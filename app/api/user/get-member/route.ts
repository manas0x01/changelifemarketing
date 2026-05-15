import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/database";
import User from "@/models/User";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "Member ID is required" }, { status: 400 });
    }

    await connectDB();

    const user = await User.findOne({
      $or: [
        { username: id },
        { userId: id }
      ]
    }).select("fullName username");

    if (!user) {
      return NextResponse.json({ success: false, error: "Member not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      memberName: user.fullName || user.username
    });

  } catch (error) {
    console.error("❌ GET MEMBER ERROR:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch member" }, { status: 500 });
  }
}
