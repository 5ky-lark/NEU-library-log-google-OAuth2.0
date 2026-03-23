import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db";
import Visitor from "@/models/Visitor";
import VisitLog from "@/models/VisitLog";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as { role?: string })?.role;
    if (role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { blocked, blockedReason } = body;

    await connectDB();

    const visitor = await Visitor.findByIdAndUpdate(
      id,
      { blocked: !!blocked, blockedReason: blockedReason || undefined },
      { new: true }
    );

    if (!visitor) {
      return NextResponse.json({ error: "Visitor not found" }, { status: 404 });
    }

    return NextResponse.json(visitor);
  } catch (error) {
    console.error("Visitor update error:", error);
    return NextResponse.json(
      { error: "Failed to update visitor" },
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
    const role = (session?.user as { role?: string })?.role;
    if (role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    await connectDB();

    const visitor = await Visitor.findById(id);
    if (!visitor) {
      return NextResponse.json({ error: "Visitor not found" }, { status: 404 });
    }

    await Promise.all([
      VisitLog.deleteMany({ visitor: visitor._id }),
      Visitor.findByIdAndDelete(visitor._id),
    ]);

    return NextResponse.json({
      success: true,
      message: "Visitor deleted successfully",
    });
  } catch (error) {
    console.error("Visitor delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete visitor" },
      { status: 500 }
    );
  }
}
