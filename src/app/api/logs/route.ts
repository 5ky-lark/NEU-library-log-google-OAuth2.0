import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db";
import VisitLog from "@/models/VisitLog";
import type { PipelineStage } from "mongoose";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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
    const all = searchParams.get("all") === "1";
    const page = Math.max(1, Number(searchParams.get("page") || "1"));
    const pageSize = Math.min(
      100,
      Math.max(1, Number(searchParams.get("pageSize") || "10"))
    );

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

    const pipeline: PipelineStage[] = [
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
    ];

    if (search) {
      pipeline.push({
        $match: {
          $or: [
            { "visitorData.name": { $regex: search, $options: "i" } },
            { "visitorData.program": { $regex: search, $options: "i" } },
            { reason: { $regex: search, $options: "i" } },
          ],
        },
      });
    }

    pipeline.push({ $sort: { checkInTime: -1 } });
    pipeline.push({
      $facet: {
        items: [
          ...(all ? [] : [{ $skip: (page - 1) * pageSize }, { $limit: pageSize }]),
        ],
        total: [{ $count: "count" }],
      },
    });

    const [result] = await VisitLog.aggregate(pipeline);
    const items = result?.items || [];
    const total = result?.total?.[0]?.count || 0;

    return NextResponse.json({
      items,
      total,
      page: all ? 1 : page,
      pageSize: all ? total : pageSize,
    });
  } catch (error) {
    console.error("Logs fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch logs" },
      { status: 500 }
    );
  }
}
