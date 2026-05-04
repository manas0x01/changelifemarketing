import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/database";
import User from "@/models/User";

// Helper function to recursively flush a user's entire subtree
async function flushUserSubtree(user: any) {
  if (!user) return;
  
  console.log(`[PLACEMENT TREE FLUSH] Flushing user ${user.userId} and their subtree`);
  
  // Set this user's team counts to 0 (marks them as flushed)
  user.totalTeam = { left: 0, right: 0 };
  
  // Recursively flush left child
  if (user.leftChild) {
    const leftChild = await User.findOne({
      $or: [{ username: user.leftChild }, { userId: user.leftChild }]
    });
    if (leftChild) {
      await flushUserSubtree(leftChild);
    }
  }
  
  // Recursively flush right child
  if (user.rightChild) {
    const rightChild = await User.findOne({
      $or: [{ username: user.rightChild }, { userId: user.rightChild }]
    });
    if (rightChild) {
      await flushUserSubtree(rightChild);
    }
  }
  
  await user.save();
  console.log(`[PLACEMENT TREE FLUSH] User ${user.userId} and subtree flushed`);
}

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
  const isFirstTime = !lastSessionType;
  const isSessionChange = lastSessionType && lastSessionType !== currentSessionType;
  let flushedOut = false;
  let flushMessage = "";
  
  // Get ACTUAL counts from tree structure (not totalTeam which may be capped)
  const actualCounts = await countActualChildren(user);
  let leftPairs = actualCounts.left;
  let rightPairs = actualCounts.right;
  
  console.log(`[PLACEMENT TREE SESSION CHANGE] User ${user.userId}: ${lastSessionType} -> ${currentSessionType}, ACTUAL Left: ${leftPairs}, Right: ${rightPairs} (totalTeam: ${user.totalTeam?.left || 0}, ${user.totalTeam?.right || 0})`);

  // ALWAYS: Reset income to 0 if tree is completely empty (no users at all)
  if (leftPairs === 0 && rightPairs === 0) {
    console.log(`[PLACEMENT TREE] Tree is empty - resetting income to 0`);
    user.basicIncome = 0;
    user.basicPairs = 0;
    user.sessionBasedIncome = [];
    user.basicIncomeRecords = [];
    await user.save();
    return { flushedOut: false, flushMessage: "", incomeMessage: "", leftPairs: 0, rightPairs: 0 };
  }
  
  // DATA CLEANUP: Only run on session change to avoid modifying data on every tree fetch
  // isFirstTime and isSessionChange already declared above
  
  if ((isFirstTime || isSessionChange) && user.sessionBasedIncome && user.sessionBasedIncome.length > 0) {
    const uniqueSessions = new Map();
    const cleanedRecords = [];
    
    for (const record of user.sessionBasedIncome) {
      if (record.status === "Completed" && record.sessionType) {
        if (!uniqueSessions.has(record.sessionType)) {
          uniqueSessions.set(record.sessionType, true);
          cleanedRecords.push(record);
        }
      }
    }
    
    if (cleanedRecords.length !== user.sessionBasedIncome.length) {
      console.log(`[PLACEMENT TREE] Cleaned ${user.sessionBasedIncome.length - cleanedRecords.length} duplicate session records`);
      user.sessionBasedIncome = cleanedRecords;
      user.basicPairs = cleanedRecords.length;
      user.markModified('sessionBasedIncome');
    }
  }

  // Declare incomeMessage early so it can be set in flush block
  let incomeMessage = "";
  
  // Only flush on session change 
  if (isFirstTime || isSessionChange) {
    console.log(`[PLACEMENT TREE] Processing ${isFirstTime ? 'FIRST TIME' : 'SESSION CHANGE'} for user ${user.userId}`);
    
    // NEW: Add income for any new pairs formed in previous session
    const completedPastPairs = user.sessionBasedIncome?.filter((r: any) => r.status === "Completed").length || 0;
    const totalPairsInTree = Math.min(leftPairs, rightPairs);
    const newPairs = totalPairsInTree - completedPastPairs;
    
    if (newPairs > 0) {
      user.sessionBasedIncome = user.sessionBasedIncome || [];
      user.sessionBasedIncome.push({
        date: new Date(),
        sessionType: currentSessionType,
        pairs: 1,
        netIncome: 1000,
        status: "Completed" as const,
      });
      user.basicPairs = completedPastPairs + 1;
      user.markModified('sessionBasedIncome');
      incomeMessage = `✅ Session pair complete - ₹1000 added (Total: ₹${user.basicPairs * 1000})`;
      console.log(`[PLACEMENT TREE] Income added for ${currentSessionType} session - Total pairs: ${user.basicPairs}`);
    }

    // Calculate users to flush - keep only 1 pair (2 users total)
    const leftToFlush = Math.max(0, leftPairs - 1); // Keep only 1 left
    const rightToFlush = Math.max(0, rightPairs - 1); // Keep only 1 right
    const totalFlushed = leftToFlush + rightToFlush;
    
    console.log(`[PLACEMENT TREE FLUSH] Left: ${leftPairs}, Right: ${rightPairs}`);
    console.log(`[PLACEMENT TREE FLUSH] Flushing: ${leftToFlush} left, ${rightToFlush} right, Total: ${totalFlushed} users`);
    
    if (totalFlushed > 0) {
      // Record the flush
      const flushRecord = {
        date: new Date(),
        left: leftPairs,
        right: rightPairs,
        flushedLeft: leftToFlush,
        flushedRight: rightToFlush,
        reason: `Session change ${lastSessionType || 'initial'} -> ${currentSessionType}: Only 1 pair allowed, ${totalFlushed} users flushed`,
      };
      
      user.basicFlushHistory = user.basicFlushHistory || [];
      user.basicFlushHistory.push(flushRecord);
      
      // Cap both sides to 1 (keep only 1 pair)
      user.totalTeam.left = Math.min(leftPairs, 1);
      user.totalTeam.right = Math.min(rightPairs, 1);
      
      // IMPORTANT: Remove the flushed users' descendants to keep exactly 1 pair
      if (leftToFlush > 0 && user.leftChild) {
        const leftChildUser = await User.findOne({
          $or: [{ username: user.leftChild }, { userId: user.leftChild }]
        });
        if (leftChildUser) {
          console.log(`[PLACEMENT TREE FLUSH] Removing left child descendants from tree: ${leftChildUser.userId}`);
          if (leftChildUser.leftChild) {
            const lc = await User.findOne({ $or: [{ username: leftChildUser.leftChild }, { userId: leftChildUser.leftChild }] });
            if (lc) { lc.placementId = null; lc.placementName = null; lc.placementPosition = null; await lc.save(); await flushUserSubtree(lc); }
            leftChildUser.leftChild = null;
          }
          if (leftChildUser.rightChild) {
            const rc = await User.findOne({ $or: [{ username: leftChildUser.rightChild }, { userId: leftChildUser.rightChild }] });
            if (rc) { rc.placementId = null; rc.placementName = null; rc.placementPosition = null; await rc.save(); await flushUserSubtree(rc); }
            leftChildUser.rightChild = null;
          }
          await leftChildUser.save();
        }
      }
      if (rightToFlush > 0 && user.rightChild) {
        const rightChildUser = await User.findOne({
          $or: [{ username: user.rightChild }, { userId: user.rightChild }]
        });
        if (rightChildUser) {
          console.log(`[PLACEMENT TREE FLUSH] Removing right child descendants from tree: ${rightChildUser.userId}`);
          if (rightChildUser.leftChild) {
            const lc = await User.findOne({ $or: [{ username: rightChildUser.leftChild }, { userId: rightChildUser.leftChild }] });
            if (lc) { lc.placementId = null; lc.placementName = null; lc.placementPosition = null; await lc.save(); await flushUserSubtree(lc); }
            rightChildUser.leftChild = null;
          }
          if (rightChildUser.rightChild) {
            const rc = await User.findOne({ $or: [{ username: rightChildUser.rightChild }, { userId: rightChildUser.rightChild }] });
            if (rc) { rc.placementId = null; rc.placementName = null; rc.placementPosition = null; await rc.save(); await flushUserSubtree(rc); }
            rightChildUser.rightChild = null;
          }
          await rightChildUser.save();
        }
      }
      console.log(`[PLACEMENT TREE FLUSH] Removed ${leftToFlush} left and ${rightToFlush} right users from tree`);
      
      flushedOut = true;
      flushMessage = `${totalFlushed} users flashed out - only 1 pair (1 left + 1 right) kept`;
      
      console.log(`[PLACEMENT TREE FLASH OUT] ${flushMessage}`);
    } else {
      console.log(`[PLACEMENT TREE] No flush needed - already at 1 pair or less (${leftPairs} left, ${rightPairs} right)`);
    }

    // ─────────────────────────────────────────────────────────────────────
    // CRITICAL: Remove any UNPAIRED user from the tree on session change.
    // Runs only when the session changed. If one side has a child and the
    // other is empty, the lone user is permanently removed from the tree.
    // ─────────────────────────────────────────────────────────────────────
    const liveActual = await countActualChildren(user);
    const liveLeft  = liveActual.left;
    const liveRight = liveActual.right;

    if (liveLeft > 0 && liveRight === 0) {
      console.log(`[PLACEMENT TREE FLUSH] Unpaired left child (left=${liveLeft}, right=0). Removing permanently.`);
      if (user.leftChild) {
        const lu = await User.findOne({ $or: [{ username: user.leftChild }, { userId: user.leftChild }] });
        if (lu) {
          lu.placementId = null; lu.placementName = null; lu.placementPosition = null;
          await lu.save();
          await flushUserSubtree(lu);
        }
        user.leftChild = null;
      }
      user.totalTeam = { left: 0, right: 0 };
      user.basicFlushHistory = user.basicFlushHistory || [];
      user.basicFlushHistory.push({ date: new Date(), left: liveLeft, right: liveRight,
        reason: `Unpaired left user removed on session change (${lastSessionType || 'initial'} -> ${currentSessionType})` });
      flushedOut = true;
      flushMessage = (flushMessage ? flushMessage + '; ' : '') + 'Unpaired left user permanently removed from tree';
      console.log(`[PLACEMENT TREE FLUSH] Unpaired left user removed. Tree reset to 0/0.`);
    } else if (liveRight > 0 && liveLeft === 0) {
      console.log(`[PLACEMENT TREE FLUSH] Unpaired right child (left=0, right=${liveRight}). Removing permanently.`);
      if (user.rightChild) {
        const ru = await User.findOne({ $or: [{ username: user.rightChild }, { userId: user.rightChild }] });
        if (ru) {
          ru.placementId = null; ru.placementName = null; ru.placementPosition = null;
          await ru.save();
          await flushUserSubtree(ru);
        }
        user.rightChild = null;
      }
      user.totalTeam = { left: 0, right: 0 };
      user.basicFlushHistory = user.basicFlushHistory || [];
      user.basicFlushHistory.push({ date: new Date(), left: liveLeft, right: liveRight,
        reason: `Unpaired right user removed on session change (${lastSessionType || 'initial'} -> ${currentSessionType})` });
      flushedOut = true;
      flushMessage = (flushMessage ? flushMessage + '; ' : '') + 'Unpaired right user permanently removed from tree';
      console.log(`[PLACEMENT TREE FLUSH] Unpaired right user removed. Tree reset to 0/0.`);
    }
    // ─────────────────────────────────────────────────────────────────────
    
    // Update last session info
    user.lastSessionType = currentSessionType;
    user.lastSessionDate = new Date();
    console.log(`[PLACEMENT TREE] Session updated to ${currentSessionType}`);
    
    await user.save();
    console.log(`[PLACEMENT TREE] Session change saved`);
  }

  console.log(`[PLACEMENT TREE] processSessionChange returning`);
  
  return { flushedOut, flushMessage, incomeMessage, leftPairs: user.totalTeam?.left || 0, rightPairs: user.totalTeam?.right || 0 };
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
    // forceSessionType lets the frontend simulate a session change for testing
    const now = new Date();
    const currentHour = now.getHours();
    const realSessionType = currentHour >= 0 && currentHour < 12 ? "morning" : "evening";
    const currentSessionType: "morning" | "evening" = 
      (forceSessionType === "morning" || forceSessionType === "evening")
        ? forceSessionType
        : realSessionType;

    // If forceSessionType is provided and different from the user's stored session,
    // temporarily flip lastSessionType to the opposite so isSessionChange fires correctly
    if (forceSessionType && forceSessionType !== user.lastSessionType) {
      console.log(`[PLACEMENT TREE] forceSessionType=${forceSessionType}, flipping lastSessionType from ${user.lastSessionType} to ${forceSessionType === 'morning' ? 'evening' : 'morning'}`);
      user.lastSessionType = forceSessionType === "morning" ? "evening" : "morning";
      // Don't save yet — processSessionChange will see this as a session change and save
    }
    
    // Process session change to flush out unpaired users BEFORE building tree
    const { flushedOut, flushMessage, incomeMessage, leftPairs, rightPairs } = await processSessionChange(user, currentSessionType);
    
    // IMPORTANT: Re-sync the user object from the database after saving changes in processSessionChange
    // to ensure buildPlacementTree uses the updated counts and session state.
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
