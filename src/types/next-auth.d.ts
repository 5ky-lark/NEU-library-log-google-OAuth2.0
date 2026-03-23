import "next-auth";
import "next-auth/jwt";

type UserRole = "user" | "admin";

declare module "next-auth" {
  interface User {
    id?: string;
    role?: UserRole;
  }

  interface Session {
    user: {
      id?: string;
      email?: string;
      name?: string;
      image?: string;
      role?: UserRole;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: UserRole;
  }
}
