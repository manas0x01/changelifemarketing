import User, { IUser } from "../models/User";
import { calculateBasicIncome } from "./calculateBasicIncome";
import { calculateBoosterIncome } from "./calculateBoosterIncome";
import { calculateBoosterMatching } from "./calculateBoosterMatching";
import { checkBoosterQualification } from "./checkBoosterQualification";
import { checkAwardRank } from "./checkAwardRank";
import { auditDownlineSessionSpread } from "./sessionValidation";

/**
 * Recursively updates team counts for all ancestors up the tree.
 * @param userId - The ID of the user whose counts need to be updated (usually the parent of the deleted/added user)
 * @param position - The position of the branch being updated ('left' or 'right')
 * @param increment - Amount to add (can be negative for deletion)
 * @param session - Optional MongoDB session for transaction support
 */
export async function updateTeamCounts(
  userId: string | undefined, 
  position: 'left' | 'right' | undefined, 
  increment: number,
  session?: any
) {
  if (!userId || !position) return;

  // 1. Fetch all ancestors in ONE GO using $graphLookup (The single biggest optimization for tree traversal)
  const pathResult = await User.aggregate([
    { $match: { $or: [{ userId: userId }, { username: userId }] } },
    {
      $graphLookup: {
        from: "users",
        startWith: "$placementId",
        connectFromField: "placementId",
        connectToField: "username",
        as: "ancestors",
        depthField: "depth"
      }
    }
  ]).session(session || null);

  if (pathResult.length === 0) return;

  const startUserRaw = pathResult[0];
  const ancestorList = (startUserRaw.ancestors || []).sort((a: any, b: any) => a.depth - b.depth);
  
  // Create a list of IDs to fetch full Mongoose documents for
  const allIds = [startUserRaw._id, ...ancestorList.map((a: any) => a._id)];
  
  // 2. Fetch all documents in one query (maintaining the bottom-up order)
  const users = await User.find({ _id: { $in: allIds } }).session(session || null);
  
  // Map back to the sorted order
  const sortedUsers = allIds.map(id => users.find(u => u._id.toString() === id.toString())).filter(Boolean) as IUser[];

  let currentPosition: 'left' | 'right' | undefined = position;

  for (const user of sortedUsers) {
    if (!user.totalTeam) user.totalTeam = { left: 0, right: 0 };
    if (!user.sessionTeam) user.sessionTeam = { left: 0, right: 0 };

    // 🔐 CRITICAL: Ensure joiningDate is always set (prevents session tracking bugs)
    if (!user.joiningDate || user.joiningDate.trim() === '') {
      const joinDate = new Date().toISOString().split('T')[0];
      console.warn(`⚠️  [TEAM UTILS] ${user.username}: joiningDate was missing, setting to ${joinDate}`);
      user.joiningDate = joinDate;
    }

    const now = new Date();
    const currentHour = now.getHours();
    // IMPORTANT: Respect the user's manually set session type (from the 🔄 button).
    // Only fall back to clock-based detection if the user has never set a session type.
    const currentSessionType = (currentHour < 12 ? "morning" : "evening");
    const nowDateStr = now.toDateString();
    const lastDateStr = user.lastSessionDate ? new Date(user.lastSessionDate).toDateString() : "";

    const sessionChanged = (lastDateStr !== nowDateStr) || (user.lastSessionType !== currentSessionType);

    if (sessionChanged) {
      console.log(`[TEAM UTILS] Session changed for ${user.username} (${user.lastSessionType} -> ${currentSessionType}). Finalizing old session counts.`);
      console.log(`[TEAM UTILS] 📅 Last session: ${lastDateStr} ${user.lastSessionType}, Current: ${nowDateStr} ${currentSessionType}`);
      
      // Determine what session we are closing
      const previousSessionType = (user.lastSessionType || (currentHour < 12 ? "evening" : "morning")) as "morning" | "evening";

      // Match for the session that just ended
      // This now handles both 1-pair (basic) and 10-pair (booster) binary logic
      await calculateBasicIncome(user, previousSessionType, user.lastSessionDate || new Date()); 

      // FLASH OUT: Resetting sessionTeam effectively flashes out any unpaired BV for Basic users.
      // For Booster users, unpaired BV is already in boosterPairsCarryForward.
      console.log(`[TEAM UTILS] 🔄 Flushing sessionTeam for ${user.username}: L:${user.sessionTeam?.left}, R:${user.sessionTeam?.right} → 0,0`);
      console.log(`[TEAM UTILS] 🔐 SAME DAY + SAME SESSION RULE: New session started. sessionTeam reset for fresh pairing.`);
      user.sessionTeam = { left: 0, right: 0 };
      user.lastSessionType = currentSessionType as any;
      user.lastSessionDate = now;
    } else {
      // 🔧 SAFETY CHECK: Ensure sessionTeam is always initialized even if session didn't change
      if (!user.sessionTeam) {
        console.log(`[TEAM UTILS] ⚠️  sessionTeam was missing for ${user.username}, initializing`);
        user.sessionTeam = { left: 0, right: 0 };
      }
    }

    // Update the counts for the specific side (Basic Binary)
    if (currentPosition === 'left') {
      user.totalTeam.left = (user.totalTeam.left || 0) + increment;
      user.sessionTeam.left = (user.sessionTeam.left || 0) + increment;
    } else if (currentPosition === 'right') {
      user.totalTeam.right = (user.totalTeam.right || 0) + increment;
      user.sessionTeam.right = (user.sessionTeam.right || 0) + increment;
    }

    // Calculate Basic Binary Income (handles both basic and booster phases)
    await calculateBasicIncome(user, currentSessionType as any);
    
    // Check for Booster Upgrade
    if (!user.isBooster) {
      const qualResult = await checkBoosterQualification(user);
      if (qualResult.success && qualResult.isBooster) {
        await handleBoosterUpgrade(user.username, user.placementId, user.placementPosition, session);
      }
    }

    if (user.isBooster) {
      await checkAwardRank(user);
    }

    user.totalIncome = (user.basicIncome || 0) + (user.boosterMatchingIncome || 0) + (user.awardIncome || 0) + (user.repurchaseIncome || 0);

    if (!user.sessionTeam) user.sessionTeam = { left: 0, right: 0 };

    await user.save({ session: session || undefined });

    // Important: move to next position based on current user's placement
    currentPosition = user.placementPosition;
  }
}

/**
 * Recursively updates booster counts and triggers matching when a downline member becomes a Booster.
 * @param boosterId - The ID of the user who just became a booster
 * @param startUserId - The ancestor to start with
 * @param startPosition - The side the booster is on for that ancestor
 */
export async function handleBoosterUpgrade(
  boosterId: string,
  startUserId: string | undefined,
  startPosition: 'left' | 'right' | undefined,
  session?: any
) {
  if (!startUserId || !startPosition) return;

  // 1. Fetch all ancestors using aggregate
  const pathResult = await User.aggregate([
    { $match: { username: startUserId } },
    {
      $graphLookup: {
        from: "users",
        startWith: "$placementId",
        connectFromField: "placementId",
        connectToField: "username",
        as: "ancestors",
        depthField: "depth"
      }
    }
  ]).session(session || null);

  if (pathResult.length === 0) return;

  const startUserRaw = pathResult[0];
  const ancestorList = (startUserRaw.ancestors || []).sort((a: any, b: any) => a.depth - b.depth);
  const allIds = [startUserRaw._id, ...ancestorList.map((a: any) => a._id)];
  
  const users = await User.find({ _id: { $in: allIds } }).session(session || null);
  const sortedUsers = allIds.map(id => users.find(u => u._id.toString() === id.toString())).filter(Boolean) as IUser[];

  let currentPosition: 'left' | 'right' | undefined = startPosition;

  for (const user of sortedUsers) {
    if (!user.boosterCount) user.boosterCount = { left: 0, right: 0 };
    if (!user.boosterPairsCarryForward) user.boosterPairsCarryForward = { left: 0, right: 0 };

    // Update the Booster counts for the side where the upgrade happened
    if (currentPosition === 'left') {
      user.boosterCount.left = (user.boosterCount.left || 0) + 1;
      user.boosterPairsCarryForward.left = (user.boosterPairsCarryForward.left || 0) + 1;
    } else {
      user.boosterCount.right = (user.boosterCount.right || 0) + 1;
      user.boosterPairsCarryForward.right = (user.boosterPairsCarryForward.right || 0) + 1;
    }

    console.log(`🚀 [BOOSTER PROPAGATION] Updating ${user.username}: New Booster from ${currentPosition} (${boosterId})`);

    // 1. Calculate matching income for this ancestor
    await calculateBoosterMatching(user);
    
    if (user.isBooster) {
      await checkAwardRank(user);
    }

    // 2. Check if this ancestor now qualifies for Booster themselves
    if (!user.isBooster) {
      const qualResult = await checkBoosterQualification(user);
      if (qualResult.success && qualResult.isBooster) {
        // Recursive upgrade! This user just became a booster too.
        // Note: We don't need to call handleBoosterUpgrade again manually here 
        // because the loop will continue and update their ancestors anyway.
        // But we should ensure the next iteration knows this user is now a booster.
      }
    }

    await user.save({ session: session || undefined });

    // Move to next position based on this user's placement relative to their parent
    currentPosition = user.placementPosition;
  }
}

// Helper to count total descendants using $graphLookup (MUCH FASTER)
export async function countTotalDescendants(user: any): Promise<number> {
  if (!user) return 0;
  
  const targetId = user.username || user.userId;
  if (!targetId) return 0;

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
    console.error(`[TEAM UTILS] Error in countTotalDescendants for ${targetId}:`, err);
    return 0;
  }
}

// Helper to count actual children in tree branches with details (Basic/Booster) using $graphLookup
export async function countDetailedTree(user: any) {
  const targetId = user.username || user.userId;
  if (!targetId) return { 
    leftBasic: 0, leftBooster: 0, 
    rightBasic: 0, rightBooster: 0,
    leftTotal: 0, rightTotal: 0
  };

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
          isBooster: 1,
          descendants: {
            $map: {
              input: "$descendants",
              as: "d",
              in: { isBooster: "$$d.isBooster" }
            }
          }
        }
      }
    ]);
    
    let stats = {
      leftBasic: 0, leftBooster: 0,
      rightBasic: 0, rightBooster: 0,
      leftTotal: 0, rightTotal: 0
    };

    result.forEach(r => {
      const isLeft = r.placementPosition === 'left';
      const isRight = r.placementPosition === 'right';
      
      if (isLeft) {
        if (r.isBooster) stats.leftBooster++; else stats.leftBasic++;
        r.descendants.forEach((d: any) => {
          if (d.isBooster) stats.leftBooster++; else stats.leftBasic++;
        });
        stats.leftTotal = 1 + r.descendants.length;
      }
      if (isRight) {
        if (r.isBooster) stats.rightBooster++; else stats.rightBasic++;
        r.descendants.forEach((d: any) => {
          if (d.isBooster) stats.rightBooster++; else stats.rightBasic++;
        });
        stats.rightTotal = 1 + r.descendants.length;
      }
    });

    return stats;
  } catch (err) {
    console.error(`[TEAM UTILS] Error in countDetailedTree for ${targetId}:`, err);
    return { 
      leftBasic: 0, leftBooster: 0, 
      rightBasic: 0, rightBooster: 0,
      leftTotal: 0, rightTotal: 0
    };
  }
}
