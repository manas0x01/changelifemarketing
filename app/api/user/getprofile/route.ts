import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/database";
import User from "@/models/User";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.username) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        { status: 401 }
      );
    }
    await connectDB();
    const user = await User.findOne({
      username: session.user.username,
    }).select(
      "fullName username userId email mobileNo role createdAt joiningDate"
    );
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "User not found",
        },
        { status: 404 }
      );
    }
    return NextResponse.json({
      success: true,
      user: {
        fullName: user.fullName || "",
        username: user.username,
        userId: user.userId,
        email: user.email || "",
        mobileNo: user.mobileNo || "",
        role: user.role || "user",
        joiningDate: user.joiningDate || user.createdAt,
        createdAt: user.createdAt,
      },
    });

  } catch (error: any) {
    console.error("❌ GET PROFILE ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch profile",
      },
      { status: 500 }
    );
  }
}