import User, { IUser } from "../models/User";
import { calculateBasicIncome } from "./calculateBasicIncome";
import { calculateBoosterIncome } from "./calculateBoosterIncome";
import { calculateBoosterMatching } from "./calculateBoosterMatching";
import { checkBoosterQualification } from "./checkBoosterQualification";
import { checkAwardRank } from "./checkAwardRank";

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
  session?: any,
  manualSessionType?: string
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

    const now = new Date();
    const currentHour = now.getHours();
    const currentSessionType = manualSessionType || (currentHour < 12 ? "morning" : "evening");
    const nowDateStr = now.toDateString();
    const lastDateStr = user.lastSessionDate ? new Date(user.lastSessionDate).toDateString() : "";

    const sessionChanged = (lastDateStr !== nowDateStr) || (user.lastSessionType !== currentSessionType);

    if (sessionChanged) {
      console.log(`[TEAM UTILS] Session changed for ${user.username} (${user.lastSessionType} -> ${currentSessionType}). Finalizing old session counts.`);
      
      // Determine what session we are closing
      const previousSessionType = (user.lastSessionType || (currentHour < 12 ? "evening" : "morning")) as "morning" | "evening";

      if (user.isBooster) {
        // Booster matching is usually real-time, but we can do a final check here
        await calculateBoosterMatching(user);
      } else {
        // BASIC INCOME: Match for the session that just ended
        await calculateBasicIncome(user, previousSessionType); 
      }

      // FLASH OUT: Resetting sessionTeam effectively flashes out any unpaired BV for Basic users.
      // For Booster users, unpaired BV is already in boosterPairsCarryForward.
      user.sessionTeam = { left: 0, right: 0 };
      user.lastSessionType = currentSessionType as any;
      user.lastSessionDate = now;
    }

    // Update the Booster counts for the specific side (1 user = 1000 BV)
    if (currentPosition === 'left') {
      user.totalTeam.left = (user.totalTeam.left || 0) + increment;
      user.sessionTeam.left = (user.sessionTeam.left || 0) + increment;
      if (user.isBooster) {
        if (!user.boosterPairsCarryForward) user.boosterPairsCarryForward = { left: 0, right: 0 };
        user.boosterPairsCarryForward.left = (user.boosterPairsCarryForward.left || 0) + increment;
      }
    } else if (currentPosition === 'right') {
      user.totalTeam.right = (user.totalTeam.right || 0) + increment;
      user.sessionTeam.right = (user.sessionTeam.right || 0) + increment;
      if (user.isBooster) {
        if (!user.boosterPairsCarryForward) user.boosterPairsCarryForward = { left: 0, right: 0 };
        user.boosterPairsCarryForward.right = (user.boosterPairsCarryForward.right || 0) + increment;
      }
    }

    // Recalculate Basic Income for the CURRENT session
    if (!user.isBooster) {
      await calculateBasicIncome(user, currentSessionType as any);
      
      // Check for Booster Upgrade
      const qualResult = await checkBoosterQualification(user);
      if (qualResult.success && qualResult.isBooster) {
        // 🚀 USER JUST BECAME A BOOSTER!
        // We must propagate this up to ancestors so they get Booster Matching income.
        await handleBoosterUpgrade(user.username, user.placementId, user.placementPosition, session);
      }
    }

    if (user.isBooster) {
      // Trigger matching for both Booster Upgrades and Standard Joins
      await calculateBoosterMatching(user);
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
    if (user.isBooster) {
      await calculateBoosterMatching(user);
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

// Helper to count actual children in tree branches using $graphLookup (MUCH FASTER)
export async function countActualChildren(user: any) {
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
    
    let leftCount = 0;
    let rightCount = 0;
    result.forEach(r => {
      if (r.placementPosition === 'left') leftCount = 1 + r.descendantCount;
      if (r.placementPosition === 'right') rightCount = 1 + r.descendantCount;
    });
    return { left: leftCount, right: rightCount };
  } catch (err) {
    console.error(`[TEAM UTILS] Error in countActualChildren for ${targetId}:`, err);
    return { left: 0, right: 0 };
  }
}
