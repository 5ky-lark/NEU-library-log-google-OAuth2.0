import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db";
import VisitLog from "@/models/VisitLog";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as { role?: string })?.role;
    if (role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim() || "";
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    let match: Record<string, unknown> = {};

    if (startDate || endDate) {
      match.checkInTime = {};
      if (startDate) {
        (match.checkInTime as Record<string, Date>).$gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        (match.checkInTime as Record<string, Date>).$lte = end;
      }
    }

    let logs = await VisitLog.aggregate([
      { $match: match },
      {
        $lookup: {
          from: "visitors",
          localField: "visitor",
          foreignField: "_id",
          as: "visitorData",
        },
      },
      { $unwind: "$visitorData" },
    ]);

    if (search) {
      const lower = search.toLowerCase();
      logs = logs.filter(
        (log: { visitorData: { name?: string; program?: string }; reason?: string }) =>
          (log.visitorData?.name || "").toLowerCase().includes(lower) ||
          (log.visitorData?.program || "").toLowerCase().includes(lower) ||
          (log.reason || "").toLowerCase().includes(lower)
      );
    }

    logs.sort(
      (a: { checkInTime: Date }, b: { checkInTime: Date }) =>
        new Date(b.checkInTime).getTime() - new Date(a.checkInTime).getTime()
    );

    return NextResponse.json(logs);
  } catch (error) {
    console.error("Logs fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch logs" },
      { status: 500 }
    );
  }
}
