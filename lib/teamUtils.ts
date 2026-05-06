import User, { IUser } from "../models/User";
import { calculateBasicIncome } from "./calculateBasicIncome";

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

  let currentUserId: string | undefined = userId;
  let currentPosition: 'left' | 'right' | undefined = position;

  while (currentUserId) {
    const user: IUser | null = await User.findOne({
      $or: [
        { userId: currentUserId },
        { username: currentUserId }
      ]
    }).session(session || null);

    if (!user) break;

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
      
      // IMPORTANT: Record the final income for the session that just finished BEFORE wiping the counts
      await calculateBasicIncome(user, currentSessionType); 

      user.sessionTeam = { left: 0, right: 0 };
      user.lastSessionType = currentSessionType as any;
      user.lastSessionDate = now;
    }

    // Update the count for the specific side
    if (currentPosition === 'left') {
      user.totalTeam.left = (user.totalTeam.left || 0) + increment;
      user.sessionTeam.left = (user.sessionTeam.left || 0) + increment;
    } else if (currentPosition === 'right') {
      user.totalTeam.right = (user.totalTeam.right || 0) + increment;
      user.sessionTeam.right = (user.sessionTeam.right || 0) + increment;
    }

    // Recalculate income immediately so deletions instantly affect wallet
    await calculateBasicIncome(user);

    // Ensure sessionTeam is initialized
    if (!user.sessionTeam) user.sessionTeam = { left: 0, right: 0 };

    await user.save({ session: session || undefined });

    // Move to next ancestor
    currentUserId = user.placementId;
    currentPosition = user.placementPosition;
  }
}

// Helper to count total descendants recursively
export async function countTotalDescendants(user: any): Promise<number> {
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

// Helper to count actual children in tree branches
export async function countActualChildren(user: any) {
  let leftCount = 0;
  let rightCount = 0;
  
  if (user.leftChild) {
    const leftChild = await User.findOne({
      $or: [{ username: user.leftChild }, { userId: user.leftChild }]
    });
    if (leftChild) {
      leftCount = 1 + await countTotalDescendants(leftChild);
    }
  }
  
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
