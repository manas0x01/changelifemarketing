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

  if (position === 'left' || position === 'right') {
    if (!user.boosterPairsCarryForward) user.boosterPairsCarryForward = { left: 0, right: 0 };
    if (user.isBooster) {
      user.boosterPairsCarryForward[position] = (user.boosterPairsCarryForward[position] || 0) + 1;
      user.boosterPairsCarryForward[position] = Math.min(user.boosterPairsCarryForward[position], 10);
      console.log('[MLM] handleBinaryAndIncome: incremented boosterPairsCarryForward', { username: user.username, position, carryForward: user.boosterPairsCarryForward });
    }
  }
  //Aye Hata De Baad Mai Neeche Bala 
  const left = user.totalTeam?.left || 0;
  const right = user.totalTeam?.right || 0;
  const possiblePairs = Math.min(left, right);
  user.basicPairs = possiblePairs;
  // await calculateBasicIncome(user);

  // mark modified to ensure pre-save hook triggers derived fields
  if (typeof (user as any).markModified === 'function') {
    try { (user as any).markModified('sessionBasedIncome'); } catch (e) {}
  }
  console.log('[MLM] handleBinaryAndIncome: after calculateBasicIncome', { basicIncome: user.basicIncome, basicPairs: user.basicPairs });

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