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

    const { sponsorId, selectedPosition } = await req.json();
    
    if (!sponsorId || typeof sponsorId !== "string") {
      return NextResponse.json(
        { success: false, message: "Sponsor ID is required" },
        { status: 400 }
      );
    }

    await connectDB();

    // Find the sponsor user - search by userId or username (case insensitive)
    const sponsor = await User.findOne({
      $or: [
        { userId: { $regex: new RegExp(`^${sponsorId}$`, 'i') } },
        { username: { $regex: new RegExp(`^${sponsorId}$`, 'i') } }
      ]
    });

    if (!sponsor) {
      return NextResponse.json(
        { success: false, message: "Sponsor not found" },
        { status: 404 }
      );
    }

    // Determine current session type based on current time
    const now = new Date();
    const currentHour = now.getHours();
    const currentSessionType = currentHour >= 0 && currentHour < 12 ? "morning" : "evening";

    // Check if sponsor needs session flushing
    const lastSessionType = sponsor.lastSessionType;
    let leftCount = sponsor.totalTeam?.left || 0;
    let rightCount = sponsor.totalTeam?.right || 0;

    if (lastSessionType && lastSessionType !== currentSessionType) {
      // Session has changed, determine what would be flushed
      if (leftCount !== rightCount) {
        if (leftCount > rightCount) {
          leftCount = rightCount; // Left would be flushed
        } else {
          rightCount = leftCount; // Right would be flushed
        }
      }
    }

    // Check if sponsor has any children - verify they actually exist in DB
    // AND check if they are currently valid (not flushed out)
    let hasLeftChild = false;
    let hasRightChild = false;

    if (sponsor.leftChild && sponsor.leftChild.trim() !== "" && leftCount > 0) {
      const leftChildUser = await User.findOne({
        $or: [
          { username: sponsor.leftChild },
          { userId: sponsor.leftChild }
        ]
      });
      hasLeftChild = !!leftChildUser;
    }
    if (sponsor.rightChild && sponsor.rightChild.trim() !== "" && rightCount > 0) {
      const rightChildUser = await User.findOne({
        $or: [
          { username: sponsor.rightChild },
          { userId: sponsor.rightChild }
        ]
      });
      hasRightChild = !!rightChildUser;
    }

    // Determine available positions
    const availablePositions = [];
    if (!hasLeftChild) availablePositions.push("left");
    if (!hasRightChild) availablePositions.push("right");

    // Check if this is the first registration (no children at all)
    const isFirstRegistration = !hasLeftChild && !hasRightChild;

    // If a position is selected, check inheritance logic
    let inheritedPositions: string[] = [];
    if (selectedPosition && availablePositions.length > 0) {
      // If a position is selected, positions below that side will be open
      // This allows single-side filling
      inheritedPositions = availablePositions; // Keep the same logic for now
    }

    return NextResponse.json({
      success: true,
      availablePositions,
      hasLeftChild,
      hasRightChild,
      isFirstRegistration,
      inheritedPositions,
      sponsor: {
        id: sponsor.userId || sponsor.username,
        name: sponsor.fullName || sponsor.username,
      }
    });

  } catch (error: any) {
    console.error("Error checking positions:", error);
    return NextResponse.json(
      { success: false, message: "Failed to check positions" },
      { status: 500 }
    );
  }
}
