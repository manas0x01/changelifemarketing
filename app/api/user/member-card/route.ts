import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/database";
import User from "@/models/User";

import { countDetailedTree } from "@/lib/teamUtils";

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

    // Use countDetailedTree for real-time accurate counts
    const detailedStats = await countDetailedTree(user);

    // Get left and right children
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

    // Direct members activity check
    let totalActiveDirect = 0;
    if (Array.isArray(user.directMembers) && user.directMembers.length > 0) {
      const directIds = user.directMembers.map((m: any) => m.memberId);
      const directDocs = await User.find({ $or: [{ userId: { $in: directIds } }, { username: { $in: directIds } }] });
      totalActiveDirect = directDocs.filter(d => d.registeredPackage || d.joiningDate).length;
    }

    const card = {
      sponsorId: user.sponsorId || "",
      joiningDate: user.joiningDate || (user.createdAt ? (() => {
        const d = new Date(user.createdAt);
        const formatted = d.toLocaleString('en-IN', { hour12: false });
        const session = d.getHours() < 12 ? "Morning" : "Evening";
        return `${formatted} (${session})`;
      })() : ""),
      package: user.registeredPackage || "",
      leftId: leftChild?.userId || leftChild?.username || "",
      rightId: rightChild?.userId || rightChild?.username || "",
      leftCount: detailedStats.leftTotal,
      rightCount: detailedStats.rightTotal,
      totalCount: detailedStats.leftTotal + detailedStats.rightTotal,
      totalDirect: {
        left: user.directMembers?.filter((m: any) => (m.position || '').toLowerCase() === 'left').length || 0,
        right: user.directMembers?.filter((m: any) => (m.position || '').toLowerCase() === 'right').length || 0,
      },
      totalActiveDirect,
      totalLeftBasicUser: detailedStats.leftBasic,
      totalRightBasicUser: detailedStats.rightBasic,
      totalLeftBoosterUser: detailedStats.leftBooster,
      totalRightBoosterUser: detailedStats.rightBooster,
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
