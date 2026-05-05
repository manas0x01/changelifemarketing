import User, { IUser } from "@/models/User";

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

    // Initialize totalTeam if it doesn't exist
    if (!user.totalTeam) {
      user.totalTeam = { left: 0, right: 0 };
    }

    // Initialize sessionTeam and check for session change
    const now = new Date();
    const currentHour = now.getHours();
    const currentSessionType = currentHour >= 0 && currentHour < 12 ? "morning" : "evening";
    let sessionChanged = false;
    
    if (user.lastSessionType && user.lastSessionDate) {
      const lastSessionDate = new Date(user.lastSessionDate);
      const lastSessionHour = lastSessionDate.getHours();
      const lastSessionType = lastSessionHour >= 0 && lastSessionHour < 12 ? "morning" : "evening";
      sessionChanged = lastSessionType !== currentSessionType;
    } else {
      sessionChanged = true;
    }

    if (!user.sessionTeam || sessionChanged) {
      if (sessionChanged && user.lastSessionType) {
        const flushRecord = {
          date: new Date(),
          left: user.totalTeam?.left || 0,
          right: user.totalTeam?.right || 0,
          reason: `Session change: ${user.lastSessionType} to ${currentSessionType}`,
        };
        if (!user.basicFlushHistory) user.basicFlushHistory = [];
        user.basicFlushHistory.push(flushRecord);
      }
      user.sessionTeam = { left: 0, right: 0 };
      user.lastSessionType = currentSessionType;
      user.lastSessionDate = now;
    }

    // Update the count for the specific side
    if (currentPosition === 'left') {
      user.totalTeam.left = Math.max(0, (user.totalTeam.left || 0) + increment);
      user.sessionTeam.left = Math.max(0, (user.sessionTeam.left || 0) + increment);
    } else if (currentPosition === 'right') {
      user.totalTeam.right = Math.max(0, (user.totalTeam.right || 0) + increment);
      user.sessionTeam.right = Math.max(0, (user.sessionTeam.right || 0) + increment);
    }

    await user.save({ session: session || undefined });

    // Move to next ancestor
    currentUserId = user.placementId;
    currentPosition = user.placementPosition;
  }
}
