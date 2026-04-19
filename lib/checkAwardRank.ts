export async function checkAwardRank(user: any) {
  console.log('[DEBUG] checkAwardRank: entry', { userId: user?.userId, isBooster: user?.isBooster });
  if (!user.isBooster) {
    console.log('[DEBUG] checkAwardRank: abort - not a booster', { userId: user?.userId });
    return {
      success: false,
      message: "User is not a booster",
    };
  }

  if (!user.boosterCount) {
    user.boosterCount = { left: 0, right: 0 };
  }

  if (!user.boosterCountUsedForRank) {
    user.boosterCountUsedForRank = { left: 0, right: 0 };
  }

  if (!user.awardRankStatus) {
    user.awardRankStatus = { currentRank: null };
  }

  if (!Array.isArray(user.awardRankRecords)) {
    user.awardRankRecords = [];
  }

  console.log('[DEBUG] checkAwardRank: initial state', {
    boosterCount: user.boosterCount,
    boosterCountUsedForRank: user.boosterCountUsedForRank,
    awardRankStatus: user.awardRankStatus,
  });

  //////////////////////////////////////////////////////////////
  // 🔥 RANK CONFIG (INCREMENTAL)
  //////////////////////////////////////////////////////////////
  const RANKS = [
    { rank: "R1", left: 5, right: 5 },
    { rank: "R2", left: 10, right: 10 },
    { rank: "R3", left: 20, right: 20 },
    { rank: "R4", left: 40, right: 40 },
    { rank: "R5", left: 80, right: 80 },
    { rank: "R6", left: 160, right: 160 },
    { rank: "R7", left: 320, right: 320 },
    { rank: "R8", left: 640, right: 640 },
    { rank: "R9", left: 1280, right: 1280 },
    { rank: "R10", left: 2560, right: 2560 },
    { rank: "R11", left: 5120, right: 5120 },
    { rank: "R12", left: 10240, right: 10240 },
    { rank: "R13", left: 20480, right: 20480 },
  ];

  //////////////////////////////////////////////////////////////
  // 🔹 CURRENT TOTAL BOOSTERS
  //////////////////////////////////////////////////////////////
  const totalLeft = user.boosterCount.left || 0;
  const totalRight = user.boosterCount.right || 0;

  //////////////////////////////////////////////////////////////
  // 🔹 USED BOOSTERS (ALREADY COUNTED FOR RANK)
  //////////////////////////////////////////////////////////////
  const usedLeft = user.boosterCountUsedForRank.left || 0;
  const usedRight = user.boosterCountUsedForRank.right || 0;

  //////////////////////////////////////////////////////////////
  // 🔹 AVAILABLE NEW BOOSTERS
  //////////////////////////////////////////////////////////////
  const availableLeft = totalLeft - usedLeft;
  const availableRight = totalRight - usedRight;

  console.log('[DEBUG] checkAwardRank: totals', { totalLeft, totalRight, usedLeft, usedRight, availableLeft, availableRight });

  let achievedRank = null;

  for (const r of RANKS) {
    if (availableLeft >= r.left && availableRight >= r.right) {
      achievedRank = r;
      break;
    }
  }

  if (!achievedRank) {
    console.log('[DEBUG] checkAwardRank: no rank achieved', { userId: user.userId });
    return {
      success: false,
      message: "No new rank achieved",
    };
  }

  //////////////////////////////////////////////////////////////
  // 🔥 UPDATE USED BOOSTERS
  //////////////////////////////////////////////////////////////
  user.boosterCountUsedForRank.left += achievedRank.left;
  user.boosterCountUsedForRank.right += achievedRank.right;
  console.log('[DEBUG] checkAwardRank: updated boosterCountUsedForRank', { boosterCountUsedForRank: user.boosterCountUsedForRank });

  //////////////////////////////////////////////////////////////
  // 🔹 UPDATE RANK
  //////////////////////////////////////////////////////////////
  user.awardRankStatus.currentRank = achievedRank.rank;
  console.log('[DEBUG] checkAwardRank: updated awardRankStatus', { currentRank: user.awardRankStatus.currentRank });

  //////////////////////////////////////////////////////////////
  // 📝 RECORD
  //////////////////////////////////////////////////////////////
  user.awardRankRecords.push({
    rank: achievedRank.rank,
    achievedAt: new Date(),
    usedLeft: achievedRank.left,
    usedRight: achievedRank.right,
  });
  console.log('[DEBUG] checkAwardRank: pushed awardRankRecord', { latestRecord: user.awardRankRecords[user.awardRankRecords.length - 1] });

  return {
    success: true,
    rank: achievedRank.rank,
    message: `🎉 New Rank Achieved: ${achievedRank.rank}`,
  };
}