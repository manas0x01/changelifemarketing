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

    const { userId, sessionType } = await req.json();
    
    if (!userId || typeof userId !== "string") {
      return NextResponse.json(
        { success: false, message: "User ID is required" },
        { status: 400 }
      );
    }

    if (!sessionType || !["morning", "evening"].includes(sessionType)) {
      return NextResponse.json(
        { success: false, message: "Session type must be 'morning' or 'evening'" },
        { status: 400 }
      );
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

    // Get current time
    const now = new Date();
    const currentHour = now.getHours();
    
    // Determine current session
    // Morning session: 12AM to 12PM (0:00 to 11:59)
    // Evening session: 12PM to 12AM (12:00 to 23:59)
    const currentSessionType = currentHour >= 0 && currentHour < 12 ? "morning" : "evening";
    
    // Check if user has any pending pairs to complete
    const leftPairs = user.totalTeam?.left || 0;
    const rightPairs = user.totalTeam?.right || 0;
    const hasLeftChild = !!user.leftChild;
    const hasRightChild = !!user.rightChild;
    
    // Calculate available pairs for current session
    let availablePairs = 0;
    let sessionStatus = "active";
    
    if (currentSessionType === sessionType) {
      // Same session - can complete pairs
      if (!hasLeftChild && leftPairs > 0) availablePairs++;
      if (!hasRightChild && rightPairs > 0) availablePairs++;
    } else {
      // Different session - check if pairs from previous session are still available
      // Pairs from previous session flash out if not completed
      sessionStatus = "expired";
      availablePairs = 0;
    }

    return NextResponse.json({
      success: true,
      currentSessionType,
      sessionStatus,
      availablePairs,
      leftPairs,
      rightPairs,
      hasLeftChild,
      hasRightChild,
      user: {
        id: user.userId || user.username,
        name: user.fullName || user.username,
        lastSessionType: user.lastSessionType,
        lastSessionDate: user.lastSessionDate,
        basicPairs: user.basicPairs || 0,
        isBooster: user.isBooster || false,
      }
    });

  } catch (error: any) {
    console.error("Error checking time slots:", error);
    return NextResponse.json(
      { success: false, message: "Failed to check time slots" },
      { status: 500 }
    );
  }
}

// Helper function to check and process session change with flash out
async function processSessionChange(user: any, currentSessionType: "morning" | "evening") {
  const lastSessionType = user.lastSessionType;
  let flushedOut = false;
  let flushMessage = "";
  let leftPairs = user.totalTeam?.left || 0;
  let rightPairs = user.totalTeam?.right || 0;

  // If session has changed and user has incomplete pairs
  if (lastSessionType && lastSessionType !== currentSessionType) {
    console.log(`[SESSION CHANGE] User ${user.userId}: ${lastSessionType} -> ${currentSessionType}`);
    
    // Check for unpaired pairs
    if (leftPairs !== rightPairs) {
      const pairsToFlush = Math.abs(leftPairs - rightPairs);
      const sideToFlush = leftPairs > rightPairs ? "left" : "right";
      
      // Record the flush
      const flushRecord = {
        date: new Date(),
        left: leftPairs,
        right: rightPairs,
        reason: `Incomplete pairs flushed during ${lastSessionType} to ${currentSessionType} session change`,
      };
      
      user.basicFlushHistory = user.basicFlushHistory || [];
      user.basicFlushHistory.push(flushRecord);
      
      // Reset the unpaired side to match the smaller value
      if (sideToFlush === "left") {
        user.totalTeam.left = rightPairs;
      } else {
        user.totalTeam.right = leftPairs;
      }
      
      flushedOut = true;
      flushMessage = `⚠️ ${pairsToFlush} incomplete ${sideToFlush} pair(s) flashed out due to session change from ${lastSessionType} to ${currentSessionType}`;
      
      console.log(`[FLASH OUT] ${flushMessage}`);
    }
    
    // Note: Do NOT clear sessionBasedIncome - income records accumulate permanently
    // Only flush incomplete pairs (unbalanced counts), not completed income
    
    // Update last session info
    user.lastSessionType = currentSessionType;
    user.lastSessionDate = new Date();
    
    await user.save();
  }
  
  return { flushedOut, flushMessage, leftPairs: user.totalTeam?.left || 0, rightPairs: user.totalTeam?.right || 0 };
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.username) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectDB();

    // Get current user
    const user = await User.findOne({ username: session.user.username });
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // Get current time and session
    const now = new Date();
    const currentHour = now.getHours();
    const currentSessionType = currentHour >= 0 && currentHour < 12 ? "morning" : "evening";
    
    // Check for session change and flash out incomplete pairs
    const { flushedOut, flushMessage, leftPairs, rightPairs } = await processSessionChange(user, currentSessionType);
    
    // Calculate available pairs after potential flush
    // Verify children actually exist (not just references)
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
    
    let availablePairs = 0;
    if (!hasLeftChild && leftPairs > 0) availablePairs++;
    if (!hasRightChild && rightPairs > 0) availablePairs++;
    
    return NextResponse.json({
      success: true,
      currentSessionType,
      currentHour: now.getHours(),
      currentTime: now.toISOString(),
      flushedOut,
      flushMessage,
      sessionChanged: flushedOut,
      availablePairs,
      leftPairs,
      rightPairs,
      hasLeftChild,
      hasRightChild,
      user: {
        id: user.userId || user.username,
        name: user.fullName || user.username,
        lastSessionType: user.lastSessionType,
        lastSessionDate: user.lastSessionDate,
        basicPairs: user.basicPairs || 0,
        boosterPairs: user.boosterPairs || 0,
        isBooster: user.isBooster || false,
        totalTeam: user.totalTeam || { left: 0, right: 0 },
      }
    });

  } catch (error: any) {
    console.error("Error getting current session:", error);
    return NextResponse.json(
      { success: false, message: "Failed to get current session" },
      { status: 500 }
    );
  }
}

// POST endpoint to manually trigger session change check with optional manual time
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.username) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { manualTime } = await req.json();
    
    await connectDB();

    // Get current user
    const user = await User.findOne({ username: session.user.username });
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // Determine session from manual time or current time
    let currentHour: number;
    if (manualTime) {
      const manualDate = new Date(manualTime);
      // Convert UTC to IST (UTC+5:30)
      const istOffset = 5.5 * 60 * 60 * 1000; // 5.5 hours in milliseconds
      const istDate = new Date(manualDate.getTime() + istOffset);
      currentHour = istDate.getHours();
      console.log(`[MANUAL TIME] UTC: ${manualDate.toISOString()}, IST Hour: ${currentHour}`);
    } else {
      currentHour = new Date().getHours();
    }
    
    const currentSessionType = currentHour >= 0 && currentHour < 12 ? "morning" : "evening";
    
    // Force session change when manualTime is provided (user clicked button)
    // This ensures flush and income logic runs even for same session
    if (manualTime && user.lastSessionType === currentSessionType) {
      console.log(`[TIME SLOTS] Forcing session change from ${user.lastSessionType} to ${currentSessionType}`);
      // Temporarily set to opposite to force a "change"
      user.lastSessionType = currentSessionType === "morning" ? "evening" : "morning";
      await user.save();
    }
    
    // Check for session change and flash out incomplete pairs
    const { flushedOut, flushMessage, leftPairs, rightPairs } = await processSessionChange(user, currentSessionType);
    
    // Calculate available pairs after potential flush
    // Verify children actually exist (not just references)
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
    
    let availablePairs = 0;
    if (!hasLeftChild && leftPairs > 0) availablePairs++;
    if (!hasRightChild && rightPairs > 0) availablePairs++;
    
    return NextResponse.json({
      success: true,
      currentSessionType,
      currentHour,
      flushedOut,
      flushMessage,
      sessionChanged: flushedOut,
      availablePairs,
      leftPairs,
      rightPairs,
      hasLeftChild,
      hasRightChild,
      user: {
        id: user.userId || user.username,
        name: user.fullName || user.username,
        lastSessionType: user.lastSessionType,
        lastSessionDate: user.lastSessionDate,
        basicPairs: user.basicPairs || 0,
        boosterPairs: user.boosterPairs || 0,
        isBooster: user.isBooster || false,
        totalTeam: user.totalTeam || { left: 0, right: 0 },
      }
    });

  } catch (error: any) {
    console.error("Error processing session change:", error);
    return NextResponse.json(
      { success: false, message: "Failed to process session change" },
      { status: 500 }
    );
  }
}
