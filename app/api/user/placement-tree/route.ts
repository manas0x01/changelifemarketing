import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/database";
import User from "@/models/User";
import { calculateBasicIncome } from "@/lib/calculateBasicIncome";



// Helper function to count actual children in tree
async function countActualChildren(user: any) {
  let leftCount = 0;
  let rightCount = 0;
  
  // Count direct left children
  if (user.leftChild) {
    const leftChild = await User.findOne({
      $or: [{ username: user.leftChild }, { userId: user.leftChild }]
    });
    if (leftChild) {
      leftCount = 1 + await countTotalDescendants(leftChild);
    }
  }
  
  // Count direct right children
  if (user.rightChild) {
    const rightChild = await User.findOne({
      $or: [{ username: user.rightChild }, { userId: user.rightChild }]
    });
    if (rightChild) {
      rightCount = 1 + await countTotalDescendants(rightChild);
    }
  }
  
  return { left: leftCount, right: rightCount };
}

// Helper to count total descendants
async function countTotalDescendants(user: any): Promise<number> {
  if (!user) return 0;
  let count = 0;
  
  if (user.leftChild) {
    const leftChild = await User.findOne({
      $or: [{ username: user.leftChild }, { userId: user.leftChild }]
    });
    if (leftChild) {
      count += 1 + await countTotalDescendants(leftChild);
    }
  }
  
  if (user.rightChild) {
    const rightChild = await User.findOne({
      $or: [{ username: user.rightChild }, { userId: user.rightChild }]
    });
    if (rightChild) {
      count += 1 + await countTotalDescendants(rightChild);
    }
  }
  
  return count;
}

// Helper function to check and process session change with flash out
async function processSessionChange(user: any, currentSessionType: "morning" | "evening") {
  const lastSessionType = user.lastSessionType;
  const lastSessionDate = user.lastSessionDate ? new Date(user.lastSessionDate) : null;
  const now = new Date();

  const isFirstTime = !lastSessionType;
  
  // Robust session check: differs if type is different OR if it's a different day
  let isSessionChange = false;
  if (lastSessionDate && lastSessionType) {
    const lastDateStr = lastSessionDate.toDateString();
    const nowDateStr = now.toDateString();
    isSessionChange = (lastDateStr !== nowDateStr) || (lastSessionType !== currentSessionType);
  }
  
  let flushedOut = false;
  let flushMessage = "";
  
  // Get ACTUAL counts from tree structure (not totalTeam which may be capped)
  const actualCounts = await countActualChildren(user);
  let leftPairs = actualCounts.left;
  let rightPairs = actualCounts.right;
  
  console.log(`[PLACEMENT TREE SESSION CHANGE] User ${user.userId}: ${lastSessionType} -> ${currentSessionType}, ACTUAL Left: ${leftPairs}, Right: ${rightPairs} (isSessionChange: ${isSessionChange})`);

  // Only flush/reset on session change 
  if (isFirstTime || isSessionChange) {
    console.log(`[PLACEMENT TREE] Processing ${isFirstTime ? 'FIRST TIME' : 'SESSION CHANGE'} for user ${user.userId}`);
    
    // Visual Tree members stay forever. No flushing.
    const flushedOut = false;
    const flushMessage = "";
    
    // INCOME FLUSH: Save final income for previous session before reset
    await calculateBasicIncome(user, currentSessionType);
    
    // Reset session-only counts to 0 so unpaired income is lost.
    user.sessionTeam = { left: 0, right: 0 };
    
    // Update last session info
    user.lastSessionType = currentSessionType;
    user.lastSessionDate = now;
    
    // Perform update atomically to avoid VersionError
    await User.findByIdAndUpdate(user._id, {
      $set: {
        sessionTeam: user.sessionTeam,
        lastSessionType: currentSessionType,
        lastSessionDate: now,
        sessionBasedIncome: user.sessionBasedIncome,
        basicPairs: user.basicPairs,
        totalTeam: user.totalTeam,
        basicFlushHistory: user.basicFlushHistory
      }
    });
    console.log(`[PLACEMENT TREE] Session change and flush saved for ${user.userId}`);
    // 🔥 AUTOMATICALLY TRIGGER INCOME FOR ALL ANCESTORS ON SESSION CHANGE
    // This ensures carry-forward members are matched in the new session.
    try {
      const { processAllAncestorsIncome } = await import('@/lib/mlmEngine');
      // We trigger it for the user themselves to check their own matching
      await processAllAncestorsIncome(user.username, "left", currentSessionType); 
      console.log(`[PLACEMENT TREE] Automatic income check triggered for ${user.userId}`);
    } catch (err) {
      console.error(`[PLACEMENT TREE] Error triggering automatic income:`, err);
    }
  }

  return { flushedOut, flushMessage, incomeMessage: "", leftPairs: user.totalTeam?.left || 0, rightPairs: user.totalTeam?.right || 0 };
}

interface TreeNode {
  id: string;
  name: string;
  userId: string;
  type: "active" | "booster" | "open" | "close";
  position?: "left" | "right";
  sponsorId?: string;
  joiningDate?: string;
  package?: string;
  leftId?: string;
  rightId?: string;
  leftCount?: number;
  rightCount?: number;
  totalCount?: number;
  totalDirect?: { left: number; right: number };
  children?: TreeNode[];
}

// Helper to recursively build tree with open/closed positions
// Tree view shows only 1 pair (1 left + 1 right) per node - rest are filtered out
async function buildPlacementTree(
  rootUser: any,
  depth: number = 0,
  maxDepth: number = 3,
  parentIsActive: boolean = true,
  selectedPosition?: "left" | "right",
  currentSessionType?: "morning" | "evening"
): Promise<TreeNode | null> {
  if (!rootUser || depth > maxDepth) return null;

  let currentUser = rootUser;

  const isBooster = currentUser.isBooster || false;

  // Compute ACTUAL descendant counts from the live tree structure
  // (totalTeam can be stale; this ensures the displayed count is always correct
  //  and never includes the root user itself)
  let actualLeftCount = 0;
  let actualRightCount = 0;
  if (currentUser.leftChild) {
    const lc = await User.findOne({ $or: [{ username: currentUser.leftChild }, { userId: currentUser.leftChild }] });
    if (lc) actualLeftCount = 1 + await countTotalDescendants(lc);
  }
  if (currentUser.rightChild) {
    const rc = await User.findOne({ $or: [{ username: currentUser.rightChild }, { userId: currentUser.rightChild }] });
    if (rc) actualRightCount = 1 + await countTotalDescendants(rc);
  }

  const node: TreeNode = {
    id: currentUser.userId || currentUser.username,
    name: currentUser.fullName || currentUser.username,
    userId: currentUser.userId || currentUser.username,
    type: isBooster ? "booster" : "active",
    sponsorId: currentUser.sponsorId,
    joiningDate: currentUser.joiningDate ? new Date(currentUser.joiningDate).toLocaleDateString() : undefined,
    package: currentUser.registeredPackage || undefined,
    leftCount: actualLeftCount,
    rightCount: actualRightCount,
    totalCount: actualLeftCount + actualRightCount,
    totalDirect: {
      left: currentUser.directMembers?.filter((m: any) => m.position === "left").length || 0,
      right: currentUser.directMembers?.filter((m: any) => m.position === "right").length || 0,
    },
    children: [],
  };

  // Show children based on the leftChild/rightChild DB references.
  // After a session flush those references are explicitly set to null,
  // so checking the reference alone is the correct gate — we no longer
  // rely on totalTeam counts which can be stale for newly placed users.

  // Get left child
  if (currentUser.leftChild) {
    const leftChild = await User.findOne({
      $or: [
        { username: currentUser.leftChild },
        { userId: currentUser.leftChild }
      ]
    });
    if (leftChild) {
      const leftNode = await buildPlacementTree(leftChild, depth + 1, maxDepth, true, undefined, currentSessionType);
      if (leftNode) {
        leftNode.position = "left";
        node.children!.push(leftNode);
      }
    }
  }

  // Get right child
  if (currentUser.rightChild) {
    const rightChild = await User.findOne({
      $or: [
        { username: currentUser.rightChild },
        { userId: currentUser.rightChild }
      ]
    });
    if (rightChild) {
      const rightNode = await buildPlacementTree(rightChild, depth + 1, maxDepth, true, undefined, currentSessionType);
      if (rightNode) {
        rightNode.position = "right";
        node.children!.push(rightNode);
      }
    }
  }

  // Add open/closed positions for direct children
  if (depth < maxDepth) {
    // Check if left position is filled
    const hasLeftChild = node.children!.some(child => child.position === "left");
    if (!hasLeftChild) {
      // Position is OPEN if this node is an active or booster member
      // This allows positions under any filled node to be clickable for registration
      const isOpen = (node.type === "active" || node.type === "booster");
      
      const slotNode: TreeNode = {
        id: `slot-left-${rootUser._id}`,
        name: isOpen ? "Open" : "Close",
        userId: "",
        type: isOpen ? "open" : "close",
        position: "left",
        children: [],
      };

      // Add children below slots - all closed since parent is not filled
      if (depth + 1 < maxDepth) {
        const childLeftNode: TreeNode = {
          id: `slot-left-left-${rootUser._id}`,
          name: "Close",
          userId: "",
          type: "close",
          position: "left",
          children: [],
        };
        
        const childRightNode: TreeNode = {
          id: `slot-left-right-${rootUser._id}`,
          name: "Close",
          userId: "",
          type: "close",
          position: "right",
          children: [],
        };
        
        slotNode.children!.push(childLeftNode, childRightNode);
      }

      node.children!.push(slotNode);
    }

    // Check if right position is filled
    const hasRightChild = node.children!.some(child => child.position === "right");
    if (!hasRightChild) {
      // Position is OPEN if this node is an active or booster member
      // This allows positions under any filled node to be clickable for registration
      const isOpen = (node.type === "active" || node.type === "booster");
      
      const slotNode: TreeNode = {
        id: `slot-right-${rootUser._id}`,
        name: isOpen ? "Open" : "Close",
        userId: "",
        type: isOpen ? "open" : "close",
        position: "right",
        children: [],
      };

      // Add children below slots - all closed since parent is not filled
      if (depth + 1 < maxDepth) {
        const childLeftNode: TreeNode = {
          id: `slot-right-left-${rootUser._id}`,
          name: "Close",
          userId: "",
          type: "close",
          position: "left",
          children: [],
        };
        
        const childRightNode: TreeNode = {
          id: `slot-right-right-${rootUser._id}`,
          name: "Close",
          userId: "",
          type: "close",
          position: "right",
          children: [],
        };
        
        slotNode.children!.push(childLeftNode, childRightNode);
      }

      node.children!.push(slotNode);
    }
  }

  return node;
}

// Check if a position is open for placement
async function checkPositionOpen(parentId: string, position: "left" | "right"): Promise<boolean> {
  // For now, assume all empty positions are open
  // In a real MLM system, you might have additional rules
  return true;
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.username) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { userId, selectedPosition, forceSessionType } = await req.json();
    
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

    // Determine current session type
    const now = new Date();
    const currentHour = now.getHours();
    const realSessionType = currentHour < 12 ? "morning" : "evening";
    const currentSessionType: "morning" | "evening" = 
      (forceSessionType === "morning" || forceSessionType === "evening")
        ? forceSessionType
        : (user.lastSessionType || realSessionType);

    // Process session change to flush out unpaired users BEFORE building tree
    // We pass forceSessionType to detect the manual change
    const { flushedOut, flushMessage, incomeMessage, leftPairs, rightPairs } = await processSessionChange(user, currentSessionType);
    
    // If a manual override was provided and it successfully changed the session, make it STICKY now
    if (forceSessionType && forceSessionType !== user.lastSessionType) {
      console.log(`[PLACEMENT TREE] Saving sticky session override: ${forceSessionType} for ${user.userId}`);
      await User.findByIdAndUpdate(user._id, { $set: { lastSessionType: forceSessionType } });
    }

    // IMPORTANT: Re-sync the user object from the database
    const updatedUser = await User.findById(user._id);

    // Build the placement tree starting from this user as root
    const tree = await buildPlacementTree(updatedUser || user, 0, 3, true, selectedPosition, currentSessionType);

    return NextResponse.json({
      success: true,
      tree: tree,
      flushedOut,
      flushMessage,
      incomeMessage,
      currentSessionType,
      rootUser: {
        id: user.userId || user.username,
        name: user.fullName || user.username,
        userId: user.userId || user.username,
        leftPairs,
        rightPairs,
      }
    });

  } catch (error: any) {
    console.error("Error building placement tree:", error);
    return NextResponse.json(
      { success: false, message: "Failed to build placement tree" },
      { status: 500 }
    );
  }
}
