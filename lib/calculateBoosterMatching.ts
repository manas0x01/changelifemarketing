function getSessionType(date: Date): "morning" | "evening" {
  const hour = date.getHours();
  return hour < 12 ? "morning" : "evening";
}

export async function calculateBoosterMatching(user: any) {
  console.log('[DEBUG] calculateBoosterMatching: entry', { userId: user?.userId, isBooster: user?.isBooster });
  
  const now = new Date();
  const today = now.toDateString();
  const sessionType = getSessionType(now);

  if (!user.boosterMatchingRecords) user.boosterMatchingRecords = [];
  if (!user.boosterPairsCarryForward)
    user.boosterPairsCarryForward = { left: 0, right: 0 };

  // Session Cap: 10 booster pairs per session
  const sessionRecords = user.boosterMatchingRecords.filter(
    (r: any) => r.sessionType === sessionType && new Date(r.date).toDateString() === today
  );
  const sessionPairsUsed = sessionRecords.reduce((sum: number, r: any) => sum + (r.pairs || 0), 0);
  const remainingSessionPairs = 10 - sessionPairsUsed;

  const lastRecord = user.boosterMatchingRecords[user.boosterMatchingRecords.length - 1];
  if (
    lastRecord &&
    new Date(lastRecord.date).toDateString() === today &&
    lastRecord.sessionType === sessionType &&
    lastRecord.processed &&
    sessionPairsUsed >= 10
  ) {
    return { success: false, message: "Already reached 10 pairs in this session" };
  }

  //////////////////////////////////////////////////////////////
  // 🔹 MATCHING LOGIC (1 Booster Pair = 1 Booster L + 1 Booster R)
  //////////////////////////////////////////////////////////////
  const leftStock = user.boosterPairsCarryForward.left;
  const rightStock = user.boosterPairsCarryForward.right;
  
  let pairsAvailable = Math.min(leftStock, rightStock);

  if (pairsAvailable <= 0) {
    return { success: false, message: "No matching booster pairs" };
  }
  
  let allowedPairs = Math.min(pairsAvailable, remainingSessionPairs);
  allowedPairs = Math.max(0, allowedPairs);

  const flushedPairs = pairsAvailable - allowedPairs;
  
  if (allowedPairs <= 0 && flushedPairs <= 0) {
    return { success: false, message: "Limits reached" };
  }

  //////////////////////////////////////////////////////////////
  // 💰 INCOME (₹1000 per booster pair)
  //////////////////////////////////////////////////////////////
  const income = allowedPairs * 1000;

  // NEW LOGIC: 
  // - If user IS booster: status 'Released', credit boosterMatchingIncome
  // - If user is NOT booster: status 'Hold', credit NOTHING (wait for release)
  if (user.isBooster) {
    user.boosterMatchingIncome = (user.boosterMatchingIncome || 0) + income;
    console.log(`[BOOSTER MATCHING] ${user.username}: Released ₹${income}`);
  } else {
    console.log(`[BOOSTER MATCHING] ${user.username}: ₹${income} put on HOLD (Non-booster parent)`);
  }

  user.totalIncome = (user.basicIncome || 0) + (user.boosterMatchingIncome || 0) + (user.awardIncome || 0) + (user.repurchaseIncome || 0);

  //////////////////////////////////////////////////////////////
  // 🔥 UPDATE CARRY FORWARD
  //////////////////////////////////////////////////////////////
  user.boosterPairsCarryForward.left = Math.max(0, leftStock - pairsAvailable);
  user.boosterPairsCarryForward.right = Math.max(0, rightStock - pairsAvailable);
  
  //////////////////////////////////////////////////////////////
  // 📝 RECORD
  //////////////////////////////////////////////////////////////
  user.boosterMatchingRecords.push({
    srNo: user.boosterMatchingRecords.length + 1,
    date: now,
    sessionType,
    pairsMatched: pairsAvailable,
    paidPairs: allowedPairs,
    flashedPairs: flushedPairs,
    pairs: allowedPairs,
    income,
    netIncome: income,
    status: user.isBooster ? 'Released' : 'Hold',
    processed: true,
  });

  return {
    success: true,
    pairs: allowedPairs,
    income,
    message: user.isBooster ? "Booster matching released" : "Booster matching on hold",
  };
}