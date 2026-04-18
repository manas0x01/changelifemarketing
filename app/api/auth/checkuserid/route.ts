import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/database";
import User from "@/models/User";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId } = body;

    console.log('[CHECK-USERID] received body:', { userId });

    //////////////////////////////////////////////////////////////
    // ❗ VALIDATION
    //////////////////////////////////////////////////////////////
    if (!userId || userId.trim() === "" || userId === "CLM") {
      console.log('[CHECK-USERID] invalid userId:', { userId });
      return NextResponse.json(
        {
          success: false,
          error: "Invalid User ID",
        },
        { status: 400 }
      );
    }

    const formattedUserId = userId.trim().toUpperCase();
    console.log('[CHECK-USERID] formattedUserId:', formattedUserId);

    await connectDB();
    console.log('[CHECK-USERID] DB connected');

    //////////////////////////////////////////////////////////////
    // 🔍 CHECK EXISTING USER
    //////////////////////////////////////////////////////////////
    const existingUser = await User.findOne({ userId: formattedUserId });
    console.log('[CHECK-USERID] existingUser found:', !!existingUser);

    if (existingUser) {
      console.log('[CHECK-USERID] responding: taken', { formattedUserId });
      return NextResponse.json(
        {
          success: false,
          error: "This User ID is already taken",
        },
        { status: 400 }
      );
    }

    //////////////////////////////////////////////////////////////
    // ✅ AVAILABLE
    //////////////////////////////////////////////////////////////
    return NextResponse.json({
      success: true,
      message: "User ID is available",
    });

  } catch (error: any) {
    console.error("❌ CHECK USERID ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to check User ID",
      },
      { status: 500 }
    );
  }
}