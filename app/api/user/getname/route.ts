import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/database";
import User from "@/models/User";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId } = body;
    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          message: "User ID is required",
        },
        { status: 400 }
      );
    }

    console.log('[GET-NAME] requested userId:', userId);

    await connectDB();

    // Accept either userId or username or sponsorId as the lookup key
    const user = await User.findOne({
      $or: [
        { userId: userId },
        { username: userId },
        { sponsorId: userId },
      ],
    }).select("fullName username userId leftChild rightChild");

    console.log('[GET-NAME] db user found:', {
      username: user?.username ?? null,
      userId: user?.userId ?? null,
      fullNamePresent: !!(user?.fullName),
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid Sponsor ID",
        },
        { status: 404 }
      );
    }

    // Determine availability of left/right positions
    const leftEmpty = !user.leftChild || String(user.leftChild).trim() === "";
    const rightEmpty = !user.rightChild || String(user.rightChild).trim() === "";
    const availablePositions: string[] = [];
    if (leftEmpty) availablePositions.push("left");
    if (rightEmpty) availablePositions.push("right");

    const respData: any = {
      userId: user.userId,
      name: user.fullName || user.username,
      leftChild: user.leftChild || "",
      rightChild: user.rightChild || "",
      isLeftEmpty: leftEmpty,
      isRightEmpty: rightEmpty,
      availablePositions,
    };

    // If neither side available, include an explicit message for the frontend
    if (availablePositions.length === 0) {
      respData.message = "Both Childs Are Already Filled";
    }

    return NextResponse.json({ success: true, data: respData });

  } catch (error: any) {
    console.error("❌ GET NAME ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch user name",
      },
      { status: 500 }
    );
  }
}