import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db";
import VisitLog from "@/models/VisitLog";

function getDateRange(filter: string) {
  const now = new Date();
  let start: Date;
  let end = new Date(now);
  end.setHours(23, 59, 59, 999);

  switch (filter) {
    case "today":
      start = new Date(now);
      start.setHours(0, 0, 0, 0);
      break;
    case "week":
      start = new Date(now);
      start.setDate(start.getDate() - 7);
      start.setHours(0, 0, 0, 0);
      break;
    case "month":
      start = new Date(now);
      start.setMonth(start.getMonth() - 1);
      start.setHours(0, 0, 0, 0);
      break;
    default:
      start = new Date(0);
      break;
  }

  return { start, end };
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as { role?: string })?.role;
    if (role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const filter = searchParams.get("filter") || "today";
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");
    const reason = (searchParams.get("reason") || "").trim();
    const college = (searchParams.get("college") || "").trim();
    const employeeStatus = searchParams.get("employeeStatus") || "all";

    let start: Date;
    let end: Date;

    if (startDateParam && endDateParam) {
      start = new Date(startDateParam);
      start.setHours(0, 0, 0, 0);
      end = new Date(endDateParam);
      end.setHours(23, 59, 59, 999);
    } else {
      const range = getDateRange(filter);
      start = range.start;
      end = range.end;
    }

    const baseMatch: Record<string, unknown> = {
      checkInTime: { $gte: start, $lte: end },
    };

    if (reason) {
      baseMatch.reason = reason;
    }

    const visitorMatch: Record<string, unknown> = {};
    if (college) {
      visitorMatch["visitorData.program"] = {
        $regex: `^${escapeRegex(college)}$`,
        $options: "i",
      };
    }

    if (employeeStatus === "employee") {
      visitorMatch["visitorData.type"] = { $in: ["faculty", "employee"] };
    }

    if (employeeStatus === "nonEmployee") {
      visitorMatch["visitorData.type"] = "student";
    }

    const [faceted] = await VisitLog.aggregate([
      { $match: baseMatch },
      {
        $lookup: {
          from: "visitors",
          localField: "visitor",
          foreignField: "_id",
          as: "visitorData",
        },
      },
      { $unwind: "$visitorData" },
      ...(Object.keys(visitorMatch).length > 0 ? [{ $match: visitorMatch }] : []),
      {
        $facet: {
          totalCount: [{ $count: "count" }],
          byReason: [{ $group: { _id: "$reason", count: { $sum: 1 } } }],
          byType: [{ $group: { _id: "$visitorData.type", count: { $sum: 1 } } }],
          byCollege: [
            { $group: { _id: "$visitorData.program", count: { $sum: 1 } } },
            { $sort: { count: -1, _id: 1 } },
          ],
          employeeBreakdown: [
            {
              $group: {
                _id: {
                  $cond: [
                    { $in: ["$visitorData.type", ["faculty", "employee"]] },
                    "employee",
                    "nonEmployee",
                  ],
                },
                count: { $sum: 1 },
              },
            },
          ],
          currentInLibrary: [
            { $match: { checkOutTime: null } },
            { $count: "count" },
          ],
          dailyBreakdown: [
            {
              $group: {
                _id: {
                  $dateToString: { format: "%Y-%m-%d", date: "$checkInTime" },
                },
                count: { $sum: 1 },
              },
            },
            { $sort: { _id: 1 } },
          ],
        },
      },
    ]);

    const totalCount = faceted?.totalCount?.[0]?.count || 0;
    const currentInLibrary = faceted?.currentInLibrary?.[0]?.count || 0;
    const byReason = faceted?.byReason || [];
    const byType = faceted?.byType || [];
    const byCollege = faceted?.byCollege || [];
    const employeeBreakdown = faceted?.employeeBreakdown || [];
    const dailyBreakdown = faceted?.dailyBreakdown || [];

    return NextResponse.json({
      totalCount,
      byReason,
      byType,
      byCollege,
      employeeBreakdown,
      currentInLibrary,
      dailyBreakdown,
      start: start.toISOString(),
      end: end.toISOString(),
      appliedFilters: {
        reason,
        college,
        employeeStatus,
      },
    });
  } catch (error) {
    console.error("Stats fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch statistics" },
      { status: 500 }
    );
  }
}
