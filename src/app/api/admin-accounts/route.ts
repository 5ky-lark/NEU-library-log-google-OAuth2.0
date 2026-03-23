import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db";
import AdminAccount from "@/models/AdminAccount";

const DEFAULT_ALLOWED_DOMAIN = "neu.edu.ph";
const DEFAULT_ADMIN_GOOGLE_EMAILS = [
  "jcesperanza@neu.edu.ph",
  "skylark.magsilang@neu.edu.ph",
];

function normalizeEmail(email?: string | null) {
  return (email || "").trim().toLowerCase();
}

function toDisplayNameFromEmail(email: string) {
  const username = email.split("@")[0] || "admin";
  return username
    .replace(/[._-]+/g, " ")
    .replace(/\b\w/g, (match) => match.toUpperCase());
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

async function ensureSeedAdminAccounts() {
  const seedEmails = parseConfiguredAdminEmails();
  if (seedEmails.length === 0) {
    return;
  }

  await Promise.all(
    seedEmails.map((email) =>
      AdminAccount.updateOne(
        { email },
        {
          $setOnInsert: {
            email,
            name: toDisplayNameFromEmail(email),
          },
        },
        { upsert: true }
      )
    )
  );
}

function extractRole(session: unknown) {
  return (session as { user?: { role?: string } })?.user?.role;
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (extractRole(session) !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    await ensureSeedAdminAccounts();

    const items = await AdminAccount.find({}, { email: 1, name: 1, createdAt: 1 })
      .sort({ createdAt: 1, email: 1 })
      .lean();

    return NextResponse.json({
      items,
      total: items.length,
    });
  } catch (error) {
    console.error("Admin accounts fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch admin accounts" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (extractRole(session) !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const email = normalizeEmail(body?.email);
    const name = (body?.name || "").trim();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    if (!isAllowedDomain(email)) {
      return NextResponse.json(
        { error: "Email must be from the allowed Google domain" },
        { status: 400 }
      );
    }

    await connectDB();

    const existing = await AdminAccount.findOne({ email }).lean();
    if (existing) {
      return NextResponse.json(
        { error: "This email is already an admin account" },
        { status: 409 }
      );
    }

    const account = await AdminAccount.create({
      email,
      name: name || toDisplayNameFromEmail(email),
    });

    return NextResponse.json(account, { status: 201 });
  } catch (error) {
    console.error("Admin account create error:", error);
    return NextResponse.json(
      { error: "Failed to create admin account" },
      { status: 500 }
    );
  }
}
