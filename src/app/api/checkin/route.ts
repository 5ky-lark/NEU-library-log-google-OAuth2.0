import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Visitor from "@/models/Visitor";
import VisitLog, { VISIT_REASONS } from "@/models/VisitLog";

type IncomingUserRole = "student" | "teacher" | "staff";

function mapIncomingRoleToVisitorType(role?: string): "student" | "teacher" | "employee" | null {
  if (role === "student") return "student";
  if (role === "teacher") return "teacher";
  if (role === "staff") return "employee";
  return null;
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { rfid, email, reason, name, program, college, department, userRole } = body;

    const programValue =
      typeof program === "string" && program.trim()
        ? program.trim()
        : [college, department]
            .filter((v: unknown) => typeof v === "string" && v.trim())
            .map((v: string) => v.trim())
            .join(" - ");

    const mappedType = mapIncomingRoleToVisitorType(
      typeof userRole === "string" ? (userRole.toLowerCase() as IncomingUserRole) : undefined
    );

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

      if (visitor) {
        let shouldSave = false;

        if (programValue && (!visitor.program || visitor.program === "N/A")) {
          visitor.program = programValue;
          shouldSave = true;
        }

        if ((!visitor.type || visitor.type === "student") && mappedType && mappedType !== visitor.type) {
          visitor.type = mappedType;
          shouldSave = true;
        }

        if (shouldSave) {
          await visitor.save();
        }
      }

      if (!visitor && name) {
        visitor = await Visitor.create({
          name: name.trim(),
          email: emailLower,
          program: programValue || "N/A",
          type: mappedType || "student",
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
