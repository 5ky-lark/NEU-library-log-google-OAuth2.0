import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import connectDB from "./db";
import Admin from "@/models/Admin";

const DEFAULT_ALLOWED_DOMAIN = "neu.edu.ph";
const DEFAULT_ADMIN_GOOGLE_EMAILS = [
  "jcesperanza@neu.edu.ph",
  "skylark.magsilang@neu.edu.ph",
];

function normalizeEmail(email?: string | null) {
  return (email || "").trim().toLowerCase();
}

function parseConfiguredAdminEmails() {
  const configured = (process.env.ADMIN_GOOGLE_EMAILS || "")
    .split(",")
    .map((email) => normalizeEmail(email))
    .filter(Boolean);

  return configured.length > 0 ? configured : DEFAULT_ADMIN_GOOGLE_EMAILS;
}

function isAllowedDomain(email: string) {
  const domain =
    (process.env.GOOGLE_ALLOWED_DOMAIN || DEFAULT_ALLOWED_DOMAIN).toLowerCase();
  return email.endsWith(`@${domain}`);
}

function isAdminGoogleEmail(email: string) {
  const adminEmails = parseConfiguredAdminEmails();
  return adminEmails.includes(email);
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      id: "google-user",
      name: "Google",
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      authorization: {
        params: {
          prompt: "select_account",
        },
      },
    }),
    GoogleProvider({
      id: "google-admin",
      name: "Google (Admin)",
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      authorization: {
        params: {
          prompt: "select_account",
        },
      },
    }),
    CredentialsProvider({
      name: "Admin Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        await connectDB();
        const admin = await Admin.findOne({ email: credentials.email });
        if (!admin) return null;

        const valid = await bcrypt.compare(credentials.password, admin.password);
        if (!valid) return null;

        return {
          id: admin._id.toString(),
          email: admin.email,
          name: admin.name,
          role: "admin",
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      const email = normalizeEmail(user.email);

      if (account?.provider === "credentials") {
        return true;
      }

      if (account?.provider === "google-user") {
        return !!email && isAllowedDomain(email);
      }

      if (account?.provider === "google-admin") {
        return !!email && isAllowedDomain(email) && isAdminGoogleEmail(email);
      }

      if (account?.provider === "google") {
        return true;
      }

      return true;
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;

        if (account?.provider === "credentials") {
          token.role = "admin";
        } else if (account?.provider === "google-admin") {
          token.role = "admin";
        } else if (account?.provider === "google-user") {
          token.role = "user";
        } else {
          token.role = (user as { role?: string }).role || token.role || "user";
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id?: string }).id = token.id;
        (session.user as { role?: string }).role = token.role || "user";
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  pages: {
    signIn: "/",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
