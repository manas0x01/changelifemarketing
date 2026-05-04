import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/database";
import User from "@/models/User";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId } = body;
    console.log('[CHILD-STATUS] Entry - received body:', { userId });
    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          message: "User ID is required",
        },
        { status: 400 }
      );
    }
    await connectDB();
    console.log('[CHILD-STATUS] DB connected');
    const user = await User.findOne({ $or: [{ userId }, { username: userId }] }).select(
      "userId fullName username leftChild rightChild"
    );
    console.log('[CHILD-STATUS] db user lookup result:', {
      found: !!user,
      userId: user?.userId ?? null,
      username: user?.username ?? null,
      leftChild: user?.leftChild ?? null,
      rightChild: user?.rightChild ?? null,
    });
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid User ID",
        },
        { status: 404 }
      );
    }
    // Verify child users actually exist in database
    let leftFilled = false;
    let rightFilled = false;
    
    if (user.leftChild && user.leftChild !== "") {
      const leftChildExists = await User.findOne({
        $or: [
          { userId: { $regex: new RegExp(`^${user.leftChild}$`, 'i') } },
          { username: { $regex: new RegExp(`^${user.leftChild}$`, 'i') } }
        ]
      });
      leftFilled = !!leftChildExists;
      if (!leftFilled) {
        console.log('[CHILD-STATUS] leftChild reference exists but user not found:', user.leftChild);
      }
    }
    
    if (user.rightChild && user.rightChild !== "") {
      const rightChildExists = await User.findOne({
        $or: [
          { userId: { $regex: new RegExp(`^${user.rightChild}$`, 'i') } },
          { username: { $regex: new RegExp(`^${user.rightChild}$`, 'i') } }
        ]
      });
      rightFilled = !!rightChildExists;
      if (!rightFilled) {
        console.log('[CHILD-STATUS] rightChild reference exists but user not found:', user.rightChild);
      }
    }
    
    const availablePositions = [];
    if (!leftFilled) availablePositions.push("left");
    if (!rightFilled) availablePositions.push("right");
    if (leftFilled && rightFilled) {
      const resp = {
        success: true,
        isFull: true,
        message: "Both positions are filled",
        data: {
          leftFilled: true,
          rightFilled: true,
          availablePositions: [],
        },
      };
      console.log('[CHILD-STATUS] responding (full):', resp);
      return NextResponse.json(resp);
    }
    const resp = {
      success: true,
      isFull: false,
      data: {
        leftFilled,
        rightFilled,
        availablePositions,
      },
    };
    console.log('[CHILD-STATUS] responding:', resp);
    return NextResponse.json(resp);
  } catch (error: any) {
    console.error("❌ CHILD STATUS ERROR:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to check children status",
      },
      { status: 500 }
    );
  }
}