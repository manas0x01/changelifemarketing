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

    const { userId, position, manualTime } = await req.json();
    
    if (!userId || typeof userId !== "string") {
      return NextResponse.json(
        { success: false, message: "User ID is required" },
        { status: 400 }
      );
    }

    if (!position || !["left", "right"].includes(position)) {
      return NextResponse.json(
        { success: false, message: "Position must be 'left' or 'right'" },
        { status: 400 }
      );
    }

    // Validate manualTime if provided (for testing)
    if (manualTime) {
      const manualDate = new Date(manualTime);
      if (isNaN(manualDate.getTime())) {
        return NextResponse.json(
          { success: false, message: "Manual time must be a valid ISO date string" },
          { status: 400 }
        );
      }
    }

    await connectDB();

    // Find user
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

    // Get current time and session
    const now = manualTime ? new Date(manualTime) : new Date();
    const currentHour = now.getHours();
    const currentSessionType: "morning" | "evening" = currentHour >= 0 && currentHour < 12 ? "morning" : "evening";
    
    // Log if using manual time
    if (manualTime) {
      console.log(`[PAIR] Using manual time: ${manualTime} (Session: ${currentSessionType})`);
    }
    
    // Check if we're in the correct session
    if (user.lastSessionType && user.lastSessionDate) {
      const lastSessionDate = new Date(user.lastSessionDate);
      const lastSessionHour = lastSessionDate.getHours();
      const lastSessionType = lastSessionHour >= 0 && lastSessionHour < 12 ? "morning" : "evening";
      const sessionChanged = lastSessionType !== currentSessionType;
      
      // If session changed, flush previous pairs and reset
      if (sessionChanged) {
        console.log(`[PAIR] Session changed from ${lastSessionType} to ${currentSessionType}, flushing pairs`);
        
        // Add to flush history
        const flushRecord = {
          date: new Date(),
          left: user.totalTeam?.left || 0,
          right: user.totalTeam?.right || 0,
          reason: `Session change: ${lastSessionType} to ${currentSessionType}`,
        };
        
        user.basicFlushHistory = user.basicFlushHistory || [];
        user.basicFlushHistory.push(flushRecord);
        
        // Reset pairs for new Session
        user.basicPairs = 0;
        user.lastSessionType = currentSessionType;
        user.lastSessionDate = new Date();
        

        
        // Income addition to user's total income
        const sessionIncomeAmount = 1000; // Income per completed pair
        user.totalIncome = (user.totalIncome || 0) + sessionIncomeAmount;
        console.log(`[PAIR] Income added to total: ${sessionIncomeAmount}`);
      }
    }

    // CRITICAL: Check if user already completed a pair in current session
    const sessionBasedIncome = user.sessionBasedIncome || [];
    const hasCompletedPairThisSession = sessionBasedIncome.some(
      (record: any) => record.sessionType === currentSessionType && record.status === "Completed"
    );
    
    if (hasCompletedPairThisSession) {
      console.log(`[PAIR] User already completed a pair in ${currentSessionType} session. Only one pair per session allowed.`);
      return NextResponse.json(
        { 
          success: false, 
          message: `You have already completed a pair in this ${currentSessionType} session. Only one pair is allowed per session. Please wait for the next session (${currentSessionType === "morning" ? "12:00 PM" : "12:00 AM"}).` 
        },
        { status: 400 }
      );
    }

    // Check if position is available - verify child users actually exist
    let hasLeftChild = false;
    let hasRightChild = false;
    
    if (user.leftChild) {
      const leftChildExists = await User.findOne({
        $or: [
          { userId: { $regex: new RegExp(`^${user.leftChild}$`, 'i') } },
          { username: { $regex: new RegExp(`^${user.leftChild}$`, 'i') } }
        ]
      });
      hasLeftChild = !!leftChildExists;
    }
    
    if (user.rightChild) {
      const rightChildExists = await User.findOne({
        $or: [
          { userId: { $regex: new RegExp(`^${user.rightChild}$`, 'i') } },
          { username: { $regex: new RegExp(`^${user.rightChild}$`, 'i') } }
        ]
      });
      hasRightChild = !!rightChildExists;
    }
    
    if (position === "left" && hasLeftChild) {
      return NextResponse.json(
        { success: false, message: "Left position is already filled" },
        { status: 400 }
      );
    }
    
    if (position === "right" && hasRightChild) {
      return NextResponse.json(
        { success: false, message: "Right position is already filled" },
        { status: 400 }
      );
    }

    // Check if User has pairs to complete (both sides must have at least 1)
    const leftPairs = user.totalTeam?.left || 0;
    const rightPairs = user.totalTeam?.right || 0;
    
    if (leftPairs === 0 || rightPairs === 0) {
      return NextResponse.json(
        { success: false, message: "Both sides must have at least 1 pair to complete" },
        { status: 400 }
      );
    }

    // CRITICAL: Check if this completion would complete a pair within the same session
    // A pair is completed when BOTH sides have at least 1 member
    // If left=1 and right=0, completing left would NOT complete a pair (right still 0)
    // If left=1 and right=0, completing right WOULD complete a pair (both become 1)
    const otherSide = position === "left" ? "right" : "left";
    const otherSideCount = position === "left" ? rightPairs : leftPairs;
    
    if (otherSideCount === 0) {
      console.log(`[PAIR] Cannot complete pair. ${otherSide} side has 0 members. Both sides must have at least 1 member.`);
      return NextResponse.json(
        { 
          success: false, 
          message: `Cannot complete pair. The ${otherSide} side has no members. Both sides must have at least 1 member to complete a pair.` 
        },
        { status: 400 }
      );
    }

    // Complete the pair - add income IMMEDIATELY to basicIncome
    const incomeAmount = 1000; // Basic plan income per pair
    
    // Update user's pairs count
    user.basicPairs = (user.basicPairs || 0) + 1;
    user.lastSessionType = currentSessionType;
    user.lastSessionDate = new Date();
    
    // Add income immediately to basicIncome (permanent)
    user.basicIncome = (user.basicIncome || 0) + incomeAmount;
    user.totalIncome = (user.totalIncome || 0) + incomeAmount;
    
    // Add to basicIncomeRecords for history
    const incomeRecord = {
      srNo: (user.basicIncomeRecords?.length || 0) + 1,
      amount: incomeAmount,
      pairCount: 1,
      date: new Date(),
      description: `Pair ${user.basicPairs} completed in ${currentSessionType} session`,
      status: "Paid" as const,
    };
    user.basicIncomeRecords = user.basicIncomeRecords || [];
    user.basicIncomeRecords.push(incomeRecord);
    
    // Track session completion for one-pair-per-session enforcement
    // Use status "Pending" so pre-save hook doesn't add income again (already added above)
    const sessionIncomeRecord = {
      date: new Date(),
      sessionType: currentSessionType,
      pairs: 1,
      netIncome: 0, // Income already added directly to basicIncome above
      status: "Pending" as const, // Pre-save hook skips "pending" records
    };
    user.sessionBasedIncome = user.sessionBasedIncome || [];
    user.sessionBasedIncome.push(sessionIncomeRecord);
    
    console.log(`[PAIR] Pair completed! Income ₹${incomeAmount} added immediately. Total basic income: ₹${user.basicIncome}`);
    
    // Check for booster upgrade (10 pairs required)
    if (user.basicPairs >= 10) {
      user.isBooster = true;
      user.boosterAchievedAt = new Date();
      user.basicRank = "booster";
    }

    await user.save();

    return NextResponse.json({
      success: true,
      message: `Pair completed successfully! ₹${incomeAmount} added to your basic income wallet.`,
      income: {
        amount: incomeAmount,
        totalBasicIncome: user.basicIncome,
      },
      pair: {
        pairNumber: user.basicPairs,
        sessionType: currentSessionType,
        incomePending: incomeAmount,
      },
      session: {
        type: currentSessionType,
        date: new Date(),
      },
      user: {
        id: user.userId || user.username,
        name: user.fullName || user.username,
        basicPairs: user.basicPairs,
        isBooster: user.isBooster,
        boosterAchievedAt: user.boosterAchievedAt,
      },
      pairCompleted: {
        position,
        leftPairs: user.totalTeam?.left || 0,
        rightPairs: user.totalTeam?.right || 0,
      }
    });

  } catch (error: any) {
    console.error("Error completing pair:", error);
    return NextResponse.json(
      { success: false, message: "Failed to complete pair" },
      { status: 500 }
    );
  }
}
