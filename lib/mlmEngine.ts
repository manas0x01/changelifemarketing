import User, { IUser } from "@/models/User";
import { calculateBasicIncome } from "./calculateBasicIncome";
import { calculateBoosterMatching } from "./calculateBoosterMatching";
import { checkBoosterQualification } from "./checkBoosterQualification";
function getSessionType(date: Date) {
  // Use IST (UTC+5:30) for session determination
  const istDate = new Date(date.getTime() + 5.5 * 60 * 60 * 1000);
  const hour = istDate.getUTCHours();
  return hour < 12 ? "morning" : "evening";
}

export async function processAllAncestorsIncome(sponsorUsername: string, initialPosition: "left" | "right", manualSessionType?: string) {
  let currentUserId: string | undefined = sponsorUsername;
  let currentPosition: "left" | "right" | undefined = initialPosition;

  while (currentUserId) {
    const ancestor: IUser | null = await User.findOne({
      $or: [
        { userId: currentUserId },
        { username: currentUserId }
      ]
    });

    if (!ancestor) break;

    // Call MLM engine for this ancestor
    try {
      if (currentPosition) {
        console.log(`[MLM] processAllAncestorsIncome: processing ${currentUserId} (position: ${currentPosition})`);
        await handleBinaryAndIncome(ancestor._id, currentPosition, manualSessionType);
      }
    } catch (err) {
      console.error(`[MLM] Error processing MLM for ${currentUserId}:`, err);
    }

    // Move to next ancestor
    currentUserId = ancestor.placementId;
    currentPosition = ancestor.placementPosition;
  }
}

export async function handleBinaryAndIncome(userId: any, position: "left" | "right", manualSessionType?: string) {
  console.log('[MLM] handleBinaryAndIncome: entry', { userId, position });
  const user = await User.findById(userId);
  if (!user) {
    console.log('[MLM] handleBinaryAndIncome: user not found', { userId });
    return;
  }

  console.log('[MLM] handleBinaryAndIncome: user found', { username: user.username, userId: user._id });
  console.log('[MLM] handleBinaryAndIncome: before - basicIncome, basicPairs, isBooster, boosterMatchingIncome', { basicIncome: user.basicIncome, basicPairs: user.basicPairs, isBooster: user.isBooster, boosterMatchingIncome: user.boosterMatchingIncome });

  // Get current time and session using IST (UTC+5:30)
  const now = new Date();
  const istHour = new Date(now.getTime() + 5.5 * 60 * 60 * 1000).getUTCHours();
  const currentSessionType = manualSessionType || (istHour < 12 ? "morning" : "evening");

  // Session flushing and tracking is now handled entirely within teamUtils.ts (updateTeamCounts)


  // mark modified to ensure pre-save hook triggers derived fields
  if (typeof (user as any).markModified === 'function') {
    try { (user as any).markModified('sessionBasedIncome'); } catch (e) {}
  }

  // 🔹 TRIGGER BASIC INCOME CALCULATION
  const incomeResult = await calculateBasicIncome(user, currentSessionType);
  console.log('[MLM] handleBinaryAndIncome: calculateBasicIncome result', { 
    username: user.username, 
    success: incomeResult.success, 
    income: incomeResult.income, 
    reason: (incomeResult as any).reason,
    currentBasicIncome: user.basicIncome 
  });



  console.log('[MLM] handleBinaryAndIncome: after updates', { basicIncome: user.basicIncome, basicPairs: user.basicPairs, sessionType: currentSessionType });

  console.log('[MLM] handleBinaryAndIncome: calling checkBoosterQualification', { userId: user._id });
  await checkBoosterQualification(user);
  console.log('[MLM] handleBinaryAndIncome: after checkBoosterQualification', { isBooster: user.isBooster, boosterCuts: user.boosterCuts });

  if (user.isBooster) {
    console.log('[MLM] handleBinaryAndIncome: calling calculateBoosterMatching', { userId: user._id });
    await calculateBoosterMatching(user);
    console.log('[MLM] handleBinaryAndIncome: returned from calculateBoosterMatching', { userId: user._id, boosterMatchingIncome: user.boosterMatchingIncome });
  } else {
    console.log('[MLM] handleBinaryAndIncome: skipping calculateBoosterMatching (not a booster)', { userId: user._id });
  }

  user.totalIncome = (user.basicIncome || 0) + (user.boosterMatchingIncome || 0);

  // ensure derived fields are up-to-date before saving
  if (typeof (user as any).markModified === 'function') {
    try { (user as any).markModified('basicIncome'); } catch (e) {}
  }

  await user.save();
  console.log('[MLM] handleBinaryAndIncome: finished and saved', { userId: user._id, basicIncome: user.basicIncome, boosterMatchingIncome: user.boosterMatchingIncome, totalIncome: user.totalIncome, isBooster: user.isBooster });
}