import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db";
import Visitor from "@/models/Visitor";

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

    let query = Visitor.find();

    if (search) {
      query = query.or([
        { name: { $regex: search, $options: "i" } },
        { program: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ]);
    }

    const visitors = await query.sort({ createdAt: -1 }).lean();

    return NextResponse.json(visitors);
  } catch (error) {
    console.error("Visitors fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch visitors" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as { role?: string })?.role;
    if (role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, email, rfid, program, type } = body;
    const normalizedType =
      type === "faculty" ? "teacher" : type;

    if (!name || !email || !program || !normalizedType) {
      return NextResponse.json(
        { error: "Name, email, program, and type are required" },
        { status: 400 }
      );
    }

    if (!["student", "teacher", "employee"].includes(normalizedType)) {
      return NextResponse.json(
        { error: "Type must be student, teacher, or employee" },
        { status: 400 }
      );
    }

    await connectDB();

    const existing = await Visitor.findOne({ email: email.toLowerCase() });
    if (existing) {
      return NextResponse.json(
        { error: "A visitor with this email already exists" },
        { status: 409 }
      );
    }

    if (rfid) {
      const existingRfid = await Visitor.findOne({ rfid });
      if (existingRfid) {
        return NextResponse.json(
          { error: "A visitor with this RFID already exists" },
          { status: 409 }
        );
      }
    }

    const visitor = await Visitor.create({
      name,
      email: email.toLowerCase(),
      rfid: rfid?.trim() || undefined,
      program,
      type: normalizedType,
    });

    return NextResponse.json(visitor);
  } catch (error) {
    console.error("Visitor create error:", error);
    return NextResponse.json(
      { error: "Failed to create visitor" },
      { status: 500 }
    );
  }
}
