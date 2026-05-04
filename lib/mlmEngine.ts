import User from "@/models/User";
import { calculateBasicIncome } from "./calculateBasicIncome";
import { calculateBoosterMatching } from "./calculateBoosterMatching";
import { checkBoosterQualification } from "./checkBoosterQualification";
import { checkAwardRank } from "./checkAwardRank";
function getSessionType(date: Date) {
  const hour = date.getHours();
  return hour < 12 ? "morning" : "evening";
}

export async function handleBinaryAndIncome(userId: any, position: "left" | "right") {
  console.log('[MLM] handleBinaryAndIncome: entry', { userId, position });
  const user = await User.findById(userId);
  if (!user) {
    console.log('[MLM] handleBinaryAndIncome: user not found', { userId });
    return;
  }

  console.log('[MLM] handleBinaryAndIncome: user found', { username: user.username, userId: user._id });
  console.log('[MLM] handleBinaryAndIncome: before - basicIncome, basicPairs, isBooster, boosterMatchingIncome', { basicIncome: user.basicIncome, basicPairs: user.basicPairs, isBooster: user.isBooster, boosterMatchingIncome: user.boosterMatchingIncome });

  // Get current time and session
  const now = new Date();
  const currentHour = now.getHours();
  const currentSessionType = currentHour >= 0 && currentHour < 12 ? "morning" : "evening";

  // Check if we're in the same session as last activity
  let sessionChanged = false;
  if (user.lastSessionType && user.lastSessionDate) {
    const lastSessionDate = new Date(user.lastSessionDate);
    const lastSessionHour = lastSessionDate.getHours();
    const lastSessionType = lastSessionHour >= 0 && lastSessionHour < 12 ? "morning" : "evening";
    sessionChanged = lastSessionType !== currentSessionType;
  }

  // If session changed, flush previous pairs and reset
  if (sessionChanged) {
    console.log(`[MLM] Session changed from ${user.lastSessionType} to ${currentSessionType}, flushing pairs`);

    // Add to flush history
    const flushRecord = {
      date: new Date(),
      left: user.totalTeam?.left || 0,
      right: user.totalTeam?.right || 0,
      reason: `Session change: ${user.lastSessionType} to ${currentSessionType}`,
    };

    user.basicFlushHistory = user.basicFlushHistory || [];
    user.basicFlushHistory.push(flushRecord);

    // Note: Do NOT reset basicPairs here - it will be recalculated from sessionBasedIncome
    // by calculateBasicIncome to ensure income persistence
    user.lastSessionType = currentSessionType;
    user.lastSessionDate = new Date();
  }

  if (position === 'left' || position === 'right') {
    if (!user.boosterPairsCarryForward) user.boosterPairsCarryForward = { left: 0, right: 0 };
    if (user.isBooster) {
      user.boosterPairsCarryForward[position] = (user.boosterPairsCarryForward[position] || 0) + 1;
      user.boosterPairsCarryForward[position] = Math.min(user.boosterPairsCarryForward[position], 10);
      console.log('[MLM] handleBinaryAndIncome: incremented boosterPairsCarryForward', { username: user.username, position, carryForward: user.boosterPairsCarryForward });
    }
  }

  // mark modified to ensure pre-save hook triggers derived fields
  if (typeof (user as any).markModified === 'function') {
    try { (user as any).markModified('sessionBasedIncome'); } catch (e) {}
  }

  // 🔹 TRIGGER BASIC INCOME CALCULATION
  console.log('[MLM] handleBinaryAndIncome: calling calculateBasicIncome', { userId: user._id });
  const incomeResult = await calculateBasicIncome(user);
  console.log('[MLM] handleBinaryAndIncome: calculateBasicIncome result', incomeResult);

  // Update session info after calculation
  user.lastSessionType = currentSessionType;
  user.lastSessionDate = new Date();

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

  console.log('[MLM] handleBinaryAndIncome: calling checkAwardRank', { userId: user._id });
  await checkAwardRank(user);
  console.log('[MLM] handleBinaryAndIncome: after checkAwardRank', { awardRankStatus: user.awardRankStatus });

  user.totalIncome = (user.basicIncome || 0) + (user.boosterMatchingIncome || 0);

  // ensure derived fields are up-to-date before saving
  if (typeof (user as any).markModified === 'function') {
    try { (user as any).markModified('basicIncome'); } catch (e) {}
  }

  await user.save();
  console.log('[MLM] handleBinaryAndIncome: finished and saved', { userId: user._id, basicIncome: user.basicIncome, boosterMatchingIncome: user.boosterMatchingIncome, totalIncome: user.totalIncome, isBooster: user.isBooster });
}