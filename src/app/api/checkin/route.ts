import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Visitor from "@/models/Visitor";
import VisitLog, { VISIT_REASONS } from "@/models/VisitLog";

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { rfid, email, reason, name } = body;

    if (!reason || !VISIT_REASONS.includes(reason)) {
      return NextResponse.json(
        { error: "Invalid reason. Must be one of: reading, researching, use of computer, meeting, other" },
        { status: 400 }
      );
    }

    let visitor = null;

    if (rfid && rfid.trim()) {
      visitor = await Visitor.findOne({ rfid: rfid.trim() });
    } else if (email && email.trim()) {
      const emailLower = email.trim().toLowerCase();
      visitor = await Visitor.findOne({ email: emailLower });
      if (!visitor && name) {
        visitor = await Visitor.create({
          name: name.trim(),
          email: emailLower,
          program: "N/A",
          type: "student",
        });
      }
    }

    if (!visitor) {
      return NextResponse.json(
        { error: "Visitor not found. Please register with the library admin." },
        { status: 404 }
      );
    }

    if (visitor.blocked) {
      return NextResponse.json(
        { error: "blocked", blockedReason: visitor.blockedReason || "You are not allowed to use the library." },
        { status: 403 }
      );
    }

    const log = await VisitLog.create({
      visitor: visitor._id,
      reason,
      checkInTime: new Date(),
    });

    return NextResponse.json({
      success: true,
      visitor: {
        _id: visitor._id,
        name: visitor.name,
        program: visitor.program,
        email: visitor.email,
      },
      logId: log._id,
    });
  } catch (error) {
    console.error("Check-in error:", error);
    return NextResponse.json(
      { error: "Failed to process check-in" },
      { status: 500 }
    );
  }
}
