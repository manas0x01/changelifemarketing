import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/database";
import User from "@/models/User";
import { calculateBasicIncome } from "@/lib/calculateBasicIncome";
import { calculateBoosterIncome } from "@/lib/calculateBoosterIncome";
import { calculateBoosterMatching } from "@/lib/calculateBoosterMatching";
import { istDateISO } from "@/lib/istUtils";



// Helper function to count actual children in tree using $graphLookup (MUCH FASTER)
async function countActualChildren(user: any) {
  const targetId = user.username || user.userId;
  if (!targetId) return { left: 0, right: 0 };

  try {
    const result = await User.aggregate([
      { $match: { placementId: targetId } },
      {
        $graphLookup: {
          from: "users",
          startWith: "$username",
          connectFromField: "username",
          connectToField: "placementId",
          as: "descendants"
        }
      },
      {
        $project: {
          placementPosition: 1,
          descendantCount: { $size: "$descendants" }
        }
      }
    ]);
    
    let left = 0;
    let right = 0;
    result.forEach(r => {
      if (r.placementPosition === 'left') left = 1 + r.descendantCount;
      if (r.placementPosition === 'right') right = 1 + r.descendantCount;
    });
    return { left, right };
  } catch (err) {
    console.error(`[PLACEMENT TREE] Error in countActualChildren for ${targetId}:`, err);
    return { left: 0, right: 0 };
  }
}

// Helper to count total descendants using $graphLookup
async function countTotalDescendants(user: any): Promise<number> {
  if (!user) return 0;
  const targetId = user.username || user.userId;
  
  try {
    const result = await User.aggregate([
      { $match: { username: targetId } },
      {
        $graphLookup: {
          from: "users",
          startWith: "$username",
          connectFromField: "username",
          connectToField: "placementId",
          as: "descendants"
        }
      },
      { $project: { count: { $size: "$descendants" } } }
    ]);
    return result[0]?.count || 0;
  } catch (err) {
    console.error(`[PLACEMENT TREE] Error in countTotalDescendants for ${targetId}:`, err);
    return 0;
  }
}

// Optimized helper to find the last left or right child down the line using a single $graphLookup
async function findLastDownlineId(startUser: any, position: "left" | "right"): Promise<string> {
  if (!startUser) return "";
  const firstChildId = position === "left" ? startUser.leftChild : startUser.rightChild;
  if (!firstChildId || !firstChildId.trim()) return startUser.userId || startUser.username || "";

  const trimmedId = firstChildId.trim();

  try {
    const targetField = position === "left" ? "leftChild" : "rightChild";
    
    const result = await User.aggregate([
      {
        $match: {
          $or: [
            { username: trimmedId },
            { userId: trimmedId }
          ]
        }
      },
      {
        $graphLookup: {
          from: "users",
          startWith: `$${targetField}`,
          connectFromField: targetField,
          connectToField: "username",
          as: "downlineChain",
          depthField: "depth"
        }
      },
      {
        $project: {
          username: 1,
          userId: 1,
          [targetField]: 1,
          downlineChain: {
            username: 1,
            userId: 1,
            [targetField]: 1,
            depth: 1
          }
        }
      }
    ]);

    if (!result || result.length === 0) return trimmedId;

    const first = result[0];
    const chain = first.downlineChain || [];
    if (chain.length === 0) {
      return first.userId || first.username || trimmedId;
    }

    chain.sort((a: any, b: any) => b.depth - a.depth);
    return chain[0].userId || chain[0].username || trimmedId;
  } catch (err) {
    console.error(`[PLACEMENT TREE] Error in findLastDownlineId for ${position}:`, err);
    return trimmedId;
  }
}

// Helper function to check and process session change with flash out
async function processSessionChange(user: any, currentSessionType: "morning" | "evening") {
  const lastSessionType = user.lastSessionType;
  const lastSessionDate = user.lastSessionDate ? new Date(user.lastSessionDate) : null;
  const now = new Date();

  const isFirstTime = !lastSessionType;
  
  let isSessionChange = false;
  if (lastSessionDate && lastSessionType) {
    const lastDateStr = istDateISO(lastSessionDate);
    const nowDateStr = istDateISO(now);
    isSessionChange = (lastDateStr !== nowDateStr) || (lastSessionType !== currentSessionType);
  }
  
  let flushedOut = false;
  let flushMessage = "";
  
  // Only process reset/income calculation if session actually changed or first time
  if (isFirstTime || isSessionChange) {
    console.log(`[PLACEMENT TREE] Processing ${isFirstTime ? 'FIRST TIME' : 'SESSION CHANGE'} for user ${user.userId}`);
    
    const previousSessionType = lastSessionType as "morning" | "evening";
    if (lastSessionType) {
      await calculateBasicIncome(user, previousSessionType);
      await calculateBoosterIncome(user, previousSessionType);
    }

    user.sessionTeam = { left: 0, right: 0 };
    user.lastSessionType = currentSessionType;
    user.lastSessionDate = now;
    
    await User.findByIdAndUpdate(user._id, {
      $set: {
        sessionTeam: user.sessionTeam,
        lastSessionType: currentSessionType,
        lastSessionDate: now
      }
    });
    console.log(`[PLACEMENT TREE] Session reset for ${user.userId} completed.`);
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
  totalLeftBoosterUser?: number;
  totalRightBoosterUser?: number;
  totalDirect?: { left: number; right: number };
  totalActiveDirect?: { left: number; right: number };
  awardRankStatus?: {
    rank: number;
    rankName: string;
    achievementDate?: Date | string;
  };
  children?: TreeNode[];
}

// Helper to recursively build tree with open/closed positions (Optimized parallel fetching)
async function buildPlacementTree(
  rootUser: any,
  depth: number = 0,
  maxDepth: number = 2,
  parentIsActive: boolean = true,
  selectedPosition?: "left" | "right",
  currentSessionType?: "morning" | "evening"
): Promise<TreeNode | null> {
  if (!rootUser || depth > maxDepth) return null;

  const isBooster = rootUser.isBooster || false;

  // Compute actual descendant counts ONLY for root node (depth === 0) for sidebar display
  let actualLeftCount = 0;
  let actualRightCount = 0;
  if (depth === 0) {
    const actualCounts = await countActualChildren(rootUser);
    actualLeftCount = actualCounts.left;
    actualRightCount = actualCounts.right;
  }

  const node: TreeNode = {
    id: rootUser.userId || rootUser.username,
    name: rootUser.fullName || rootUser.username,
    userId: rootUser.userId || rootUser.username,
    type: isBooster ? "booster" : "active",
    sponsorId: rootUser.sponsorId,
    joiningDate: rootUser.createdAt || rootUser.joiningDate || "",
    package: rootUser.registeredPackage || undefined,
    leftId: rootUser.leftChild || "",
    rightId: rootUser.rightChild || "",
    leftCount: actualLeftCount,
    rightCount: actualRightCount,
    totalCount: actualLeftCount + actualRightCount,
    totalLeftBoosterUser: rootUser.boosterCount?.left || 0,
    totalRightBoosterUser: rootUser.boosterCount?.right || 0,
    totalDirect: {
      left: rootUser.directMembers?.filter((m: any) => (m.position || '').toLowerCase() === "left").length || 0,
      right: rootUser.directMembers?.filter((m: any) => (m.position || '').toLowerCase() === "right").length || 0,
    },
    awardRankStatus: rootUser.awardRankStatus ? {
      rank: rootUser.awardRankStatus.rank || 0,
      rankName: rootUser.awardRankStatus.rankName || "Member",
      achievementDate: rootUser.awardRankStatus.achievementDate || undefined
    } : { rank: 0, rankName: "Member" },
    totalActiveDirect: { left: 0, right: 0 },
    children: [],
  };

  if (depth < maxDepth) {
    const fetchPromises: Promise<any>[] = [];

    if (rootUser.leftChild) {
      fetchPromises.push(
        User.findOne({
          $or: [
            { username: rootUser.leftChild },
            { userId: rootUser.leftChild }
          ]
        }).lean()
      );
    } else {
      fetchPromises.push(Promise.resolve(null));
    }

    if (rootUser.rightChild) {
      fetchPromises.push(
        User.findOne({
          $or: [
            { username: rootUser.rightChild },
            { userId: rootUser.rightChild }
          ]
        }).lean()
      );
    } else {
      fetchPromises.push(Promise.resolve(null));
    }

    const [leftChildDoc, rightChildDoc] = await Promise.all(fetchPromises);

    const childBuildPromises: Promise<TreeNode | null>[] = [];
    if (leftChildDoc) {
      childBuildPromises.push(buildPlacementTree(leftChildDoc, depth + 1, maxDepth, true, undefined, currentSessionType));
    }
    if (rightChildDoc) {
      childBuildPromises.push(buildPlacementTree(rightChildDoc, depth + 1, maxDepth, true, undefined, currentSessionType));
    }

    const builtChildren = await Promise.all(childBuildPromises);

    if (leftChildDoc) {
      const leftNode = builtChildren.shift() || null;
      if (leftNode) {
        leftNode.position = "left";
        node.children!.push(leftNode);
      }
    }
    if (rightChildDoc) {
      const rightNode = builtChildren.shift() || null;
      if (rightNode) {
        rightNode.position = "right";
        node.children!.push(rightNode);
      }
    }

    const hasLeftChild = node.children!.some(child => child.position === "left");
    if (!hasLeftChild) {
      const isOpen = (node.type === "active" || node.type === "booster");
      const slotNode: TreeNode = {
        id: `slot-left-${rootUser._id || rootUser.userId}`,
        name: isOpen ? "Open" : "Close",
        userId: "",
        type: isOpen ? "open" : "close",
        position: "left",
        children: [],
      };

      if (depth + 1 < maxDepth) {
        slotNode.children!.push(
          { id: `slot-left-left-${rootUser._id || rootUser.userId}`, name: "Close", userId: "", type: "close", position: "left", children: [] },
          { id: `slot-left-right-${rootUser._id || rootUser.userId}`, name: "Close", userId: "", type: "close", position: "right", children: [] }
        );
      }
      node.children!.push(slotNode);
    }

    const hasRightChild = node.children!.some(child => child.position === "right");
    if (!hasRightChild) {
      const isOpen = (node.type === "active" || node.type === "booster");
      const slotNode: TreeNode = {
        id: `slot-right-${rootUser._id || rootUser.userId}`,
        name: isOpen ? "Open" : "Close",
        userId: "",
        type: isOpen ? "open" : "close",
        position: "right",
        children: [],
      };

      if (depth + 1 < maxDepth) {
        slotNode.children!.push(
          { id: `slot-right-left-${rootUser._id || rootUser.userId}`, name: "Close", userId: "", type: "close", position: "left", children: [] },
          { id: `slot-right-right-${rootUser._id || rootUser.userId}`, name: "Close", userId: "", type: "close", position: "right", children: [] }
        );
      }
      node.children!.push(slotNode);
    }
  }

  return node;
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

    const trimmedUserId = userId.trim();

    // Fast indexed match first, fallback to regex
    let user = await User.findOne({
      $or: [
        { userId: trimmedUserId },
        { username: trimmedUserId }
      ]
    }).lean();

    if (!user) {
      user = await User.findOne({
        $or: [
          { userId: { $regex: new RegExp(`^${trimmedUserId}$`, 'i') } },
          { username: { $regex: new RegExp(`^${trimmedUserId}$`, 'i') } }
        ]
      }).lean();
    }

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    const now = new Date();
    const istDate = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
    const istHour = istDate.getUTCHours();
    const realSessionType = istHour < 12 ? "morning" : "evening";
    const currentSessionType: "morning" | "evening" = 
      (forceSessionType === "morning" || forceSessionType === "evening")
        ? forceSessionType
        : (user.lastSessionType || realSessionType);

    const { flushedOut, flushMessage, incomeMessage, leftPairs, rightPairs } = await processSessionChange(user, currentSessionType);
    
    if (forceSessionType && forceSessionType !== user.lastSessionType) {
      await User.findByIdAndUpdate(user._id, { $set: { lastSessionType: forceSessionType } });
    }

    // Run tree building and extreme downline queries in PARALLEL
    const [tree, lastLeftId, lastRightId] = await Promise.all([
      buildPlacementTree(user, 0, 2, true, selectedPosition, currentSessionType),
      findLastDownlineId(user, "left"),
      findLastDownlineId(user, "right")
    ]);

    return NextResponse.json({
      success: true,
      tree: tree,
      flushedOut,
      flushMessage,
      incomeMessage,
      currentSessionType,
      lastLeftId,
      lastRightId,
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

