export async function checkAwardRank(user: any) {
  console.log('[DEBUG] checkAwardRank: entry', { userId: user?.userId, isBooster: user?.isBooster });
  
  if (!user.isBooster) {
    console.log('[DEBUG] checkAwardRank: abort - not a booster', { userId: user?.userId });
    return { success: false, message: "User is not a booster" };
  }

  if (!user.boosterCount) {
    user.boosterCount = { left: 0, right: 0 };
  }

  // Track how many boosters have been "consumed" for previous ranks
  if (!user.boosterCountUsedForRank) {
    user.boosterCountUsedForRank = { left: 0, right: 0 };
  }

  if (!user.awardRankStatus) {
    user.awardRankStatus = { rank: 0, rankName: "Member" };
  }

  if (!Array.isArray(user.awardRankRecords)) {
    user.awardRankRecords = [];
  }

  //////////////////////////////////////////////////////////////
  // 🔥 BOOSTER REWARD RANKS (THIRD LEVEL)
  //////////////////////////////////////////////////////////////
  const RANKS = [
    { rank: 1, name: "GOLD", left: 5, right: 5, award: "BAG + BUSINESS KIT", image: "/awards/gold.png" },
    { rank: 2, name: "SUPER GOLD", left: 10, right: 10, award: "SMART WATCH", image: "/awards/super_gold.png" },
    { rank: 3, name: "GOLD STAR", left: 25, right: 25, award: "SUIT LENGTH", image: "/awards/gold_star.png" },
    { rank: 4, name: "PEARL EX", left: 50, right: 50, award: "MIXI - GRINDER", image: "/awards/pearl_ex.png" },
    { rank: 5, name: "EMERALD", left: 100, right: 100, award: "FRIDGE REFRIGERATOR", image: "/awards/emerald_ruby.png" },
    { rank: 6, name: "RUBY", left: 200, right: 200, award: "MOBILE", image: "/awards/emerald_ruby.png" },
    { rank: 7, name: "PLATINUM", left: 500, right: 500, award: "LAPTOP", image: "/awards/platinum_diamond.png" },
    { rank: 8, name: "DIAMOND", left: 1000, right: 1000, award: "BIKE", image: "/awards/platinum_diamond.png" },
    { rank: 9, name: "DOUBLE DIAMOND", left: 2000, right: 2000, award: "1.5 LAKH RUPEES GIFT", image: "/awards/ultimate.png" },
    { rank: 10, name: "BLACK DIAMOND", left: 4000, right: 4000, award: "2.5 LAKH RUPEES GIFT", image: "/awards/ultimate.png" },
    { rank: 11, name: "BLUE DIAMOND", left: 8000, right: 8000, award: "5 LAKH RUPEES GIFT", image: "/awards/ultimate.png" },
    { rank: 12, name: "ROYAL DIAMOND", left: 16000, right: 16000, award: "7.5 LAKH RUPEES GIFT", image: "/awards/ultimate.png" },
    { rank: 13, name: "CROWN DIAMOND", left: 32000, right: 32000, award: "10 LAKH RUPEES GIFT", image: "/awards/ultimate.png" },
  ];

  let totalAchieved = 0;
  let lastRankAchieved = null;

  // Loop to catch multiple ranks if they jump significantly
  while (true) {
    const totalLeft = user.boosterCount.left || 0;
    const totalRight = user.boosterCount.right || 0;
    const usedLeft = user.boosterCountUsedForRank.left || 0;
    const usedRight = user.boosterCountUsedForRank.right || 0;

    const availableLeft = totalLeft - usedLeft;
    const availableRight = totalRight - usedRight;

    // The next rank to achieve is the one after the current rank
    const nextRankIndex = (user.awardRankStatus.rank || 0);
    if (nextRankIndex >= RANKS.length) break;

    const targetRank = RANKS[nextRankIndex];

    if (availableLeft >= targetRank.left && availableRight >= targetRank.right) {
      // ACHIEVED!
      user.boosterCountUsedForRank.left += targetRank.left;
      user.boosterCountUsedForRank.right += targetRank.right;
      user.awardRankStatus.rank = targetRank.rank;
      user.awardRankStatus.rankName = targetRank.name;
      user.awardRankStatus.achievementDate = new Date();

      user.awardRankRecords.push({
        srNo: user.awardRankRecords.length + 1,
        rank: targetRank.rank,
        rankName: targetRank.name,
        achievedDate: new Date(),
        leftBoostersUsed: targetRank.left,
        rightBoostersUsed: targetRank.right,
        awardName: targetRank.award,
        status: 'Awarded'
      });

      totalAchieved++;
      lastRankAchieved = targetRank;
      console.log(`[AWARD] ${user.username} achieved rank ${targetRank.name}!`);
    } else {
      // Cannot achieve next rank
      break;
    }
  }

  if (totalAchieved > 0) {
    return {
      success: true,
      message: `Achieved ${totalAchieved} new rank(s)! Latest: ${lastRankAchieved?.name}`,
      rank: lastRankAchieved?.rank
    };
  }

  return { success: false, message: "No new ranks achieved" };
}