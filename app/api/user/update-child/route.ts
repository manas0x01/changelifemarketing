import { connectDB } from "@/lib/database";
import User from "@/models/User";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    console.log('📍 [UPDATE-CHILD] Route called');
    
    await connectDB();
    console.log('✅ [DB] Database connected');

    const { sponsorId, position, childUserId } = await request.json();
    console.log('📝 [REQUEST] Sponsor ID:', sponsorId);
    console.log('📝 [REQUEST] Position:', position);
    console.log('📝 [REQUEST] Child User ID:', childUserId);

    if (!sponsorId || !position || !childUserId) {
      console.log('❌ [VALIDATION] Missing required fields');
      return NextResponse.json(
        { error: "Sponsor ID, position, and child user ID are required" },
        { status: 400 }
      );
    }

    if (position !== "Left" && position !== "Right") {
      console.log('❌ [VALIDATION] Invalid position:', position);
      return NextResponse.json(
        { error: "Position must be 'Left' or 'Right'" },
        { status: 400 }
      );
    }

    console.log('🔍 [DB] Searching for sponsor with username:', sponsorId.trim());
    const sponsor = await User.findOne({ username: sponsorId.trim() });
    console.log('🔍 [DB] Sponsor found:', sponsor ? 'YES' : 'NO');

    if (!sponsor) {
      console.log('❌ [ERROR] Sponsor not found for username:', sponsorId.trim());
      return NextResponse.json(
        { error: "Sponsor not found" },
        { status: 404 }
      );
    }

    // Update the appropriate field
    if (position === "Left") {
      console.log('🔄 [UPDATE] Setting leftChild to:', childUserId);
      sponsor.leftChild = childUserId;
    } else {
      console.log('🔄 [UPDATE] Setting rightChild to:', childUserId);
      sponsor.rightChild = childUserId;
    }

    await sponsor.save();
    console.log('✅ [DB] Sponsor saved successfully');

    console.log(`✅ [SUCCESS] Sponsor ${sponsorId} updated: ${position}Child = ${childUserId}`);

    return NextResponse.json({
      success: true,
      message: `${position} child updated successfully`,
      updated: {
        sponsorId: sponsor.userId,
        leftChild: sponsor.leftChild,
        rightChild: sponsor.rightChild,
      },
    });
  } catch (error) {
    console.error("❌ [ERROR] Error updating child:", error);
    console.error("❌ [ERROR] Stack:", (error as any)?.stack);
    return NextResponse.json(
      { error: "Failed to update child" },
      { status: 500 }
    );
  }
}
