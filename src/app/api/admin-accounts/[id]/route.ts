import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db";
import AdminAccount from "@/models/AdminAccount";

const DEFAULT_ALLOWED_DOMAIN = "neu.edu.ph";

function normalizeEmail(email?: string | null) {
  return (email || "").trim().toLowerCase();
}

function isAllowedDomain(email: string) {
  const domain =
    (process.env.GOOGLE_ALLOWED_DOMAIN || DEFAULT_ALLOWED_DOMAIN).toLowerCase();
  return email.endsWith(`@${domain}`);
}

function extractRole(session: unknown) {
  return (session as { user?: { role?: string } })?.user?.role;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (extractRole(session) !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const email = normalizeEmail(body?.email);
    const name = (body?.name || "").trim();

    if (!email || !name) {
      return NextResponse.json(
        { error: "Email and name are required" },
        { status: 400 }
      );
    }

    if (!isAllowedDomain(email)) {
      return NextResponse.json(
        { error: "Email must be from the allowed Google domain" },
        { status: 400 }
      );
    }

    await connectDB();

    const duplicate = await AdminAccount.findOne({ email, _id: { $ne: id } }).lean();
    if (duplicate) {
      return NextResponse.json(
        { error: "Another admin account already uses this email" },
        { status: 409 }
      );
    }

    const updated = await AdminAccount.findByIdAndUpdate(
      id,
      { email, name },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json({ error: "Admin account not found" }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Admin account update error:", error);
    return NextResponse.json(
      { error: "Failed to update admin account" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (extractRole(session) !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    await connectDB();

    const total = await AdminAccount.countDocuments({});
    if (total <= 1) {
      return NextResponse.json(
        { error: "At least one admin account must remain" },
        { status: 400 }
      );
    }

    const deleted = await AdminAccount.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json({ error: "Admin account not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin account delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete admin account" },
      { status: 500 }
    );
  }
}
