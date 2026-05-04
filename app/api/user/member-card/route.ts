import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/database";
import User from "@/models/User";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.username) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { userId } = await req.json();
    
    if (!userId || typeof userId !== "string") {
      return NextResponse.json(
        { success: false, message: "User ID is required" },
        { status: 400 }
      );
    }

    await connectDB();

    // Find the user - search by userId or username (case insensitive)
    const user = await User.findOne({
      $or: [
        { userId: { $regex: new RegExp(`^${userId}$`, 'i') } },
        { username: { $regex: new RegExp(`^${userId}$`, 'i') } }
      ]
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // Get left and right children - leftChild/rightChild store usernames, not ObjectIds
    const leftChild = user.leftChild ? await User.findOne({
      $or: [
        { userId: { $regex: new RegExp(`^${user.leftChild}$`, 'i') } },
        { username: { $regex: new RegExp(`^${user.leftChild}$`, 'i') } }
      ]
    }) : null;
    const rightChild = user.rightChild ? await User.findOne({
      $or: [
        { userId: { $regex: new RegExp(`^${user.rightChild}$`, 'i') } },
        { username: { $regex: new RegExp(`^${user.rightChild}$`, 'i') } }
      ]
    }) : null;

    // Count direct members
    const leftDirectCount = user.directMembers?.filter((m: any) => m.position === "left").length || 0;
    const rightDirectCount = user.directMembers?.filter((m: any) => m.position === "right").length || 0;

    const card = {
      sponsorId: user.sponsorId || "",
      joiningDate: user.joiningDate ? new Date(user.joiningDate).toLocaleDateString() : "",
      package: user.registeredPackage || "",
      leftId: leftChild?.userId || leftChild?.username || "",
      rightId: rightChild?.userId || rightChild?.username || "",
      leftCount: user.totalTeam?.left || 0,
      rightCount: user.totalTeam?.right || 0,
      totalCount: (user.totalTeam?.left || 0) + (user.totalTeam?.right || 0),
      totalDirect: {
        left: leftDirectCount,
        right: rightDirectCount,
      },
    };

    return NextResponse.json({
      success: true,
      card: card,
    });

  } catch (error: any) {
    console.error("Error fetching member card:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch member details" },
      { status: 500 }
    );
  }
}
