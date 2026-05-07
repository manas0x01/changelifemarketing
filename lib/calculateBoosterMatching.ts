function getSessionType(date: Date): "morning" | "evening" {
  const hour = date.getHours();
  return hour < 12 ? "morning" : "evening";
}

export async function calculateBoosterMatching(user: any) {
  console.log('[DEBUG] calculateBoosterMatching: entry', { userId: user?.userId, isBooster: user?.isBooster });
  if (!user.isBooster) {
    console.log('[DEBUG] calculateBoosterMatching: abort - not a booster', { userId: user?.userId });
    return { success: false, message: "User is not a booster" };
  }

  const now = new Date();
  const today = now.toDateString();
  const sessionType = getSessionType(now);
  console.log('[DEBUG] calculateBoosterMatching: session', { today, sessionType });

  if (!user.boosterMatchingRecords) user.boosterMatchingRecords = [];
  if (!user.boosterPairsCarryForward)
    user.boosterPairsCarryForward = { left: 0, right: 0 };

  //////////////////////////////////////////////////////////////
  // 🔥 SESSION DOUBLE EXECUTION GUARD
  //////////////////////////////////////////////////////////////
  const lastRecord =
    user.boosterMatchingRecords[user.boosterMatchingRecords.length - 1];

  if (
    lastRecord &&
    new Date(lastRecord.date).toDateString() === today &&
    lastRecord.sessionType === sessionType &&
    lastRecord.processed
  ) {
    console.log('[DEBUG] calculateBoosterMatching: already processed this session', { userId: user?.userId, sessionType });
    return { success: false, message: "Already processed in this session" };
  }

  //////////////////////////////////////////////////////////////
  // 🔥 NO CARRY FORWARD CAP (Stock side can be unlimited)
  //////////////////////////////////////////////////////////////
  // Removed the cap that was limiting carry forward to 10.
  // Carry forward represents BV stock and should not be capped.
  console.log('[DEBUG] calculateBoosterMatching: Current Stock (BV)', { 
    leftBv: user.boosterPairsCarryForward.left * 1000, 
    rightBv: user.boosterPairsCarryForward.right * 1000 
  });

  //////////////////////////////////////////////////////////////
  // 🔹 SESSION + DAILY CALC
  //////////////////////////////////////////////////////////////
  const sessionRecords = user.boosterMatchingRecords.filter(
    (r: any) =>
      r.sessionType === sessionType &&
      new Date(r.date).toDateString() === today
  );

  const sessionPairsUsed = sessionRecords.reduce(
    (sum: number, r: any) => sum + (r.pairs || 0),
    0
  );
  console.log('[DEBUG] calculateBoosterMatching: sessionPairsUsed', { sessionPairsUsed });

  const todayRecords = user.boosterMatchingRecords.filter(
    (r: any) => new Date(r.date).toDateString() === today
  );

  const dailyIncome = todayRecords.reduce(
    (sum: number, r: any) => sum + (r.income || 0),
    0
  );
  console.log('[DEBUG] calculateBoosterMatching: dailyIncome', { dailyIncome });

  if (dailyIncome >= 20000) {
    return { success: false, message: "Daily cap reached (₹20000)" };
  }

  //////////////////////////////////////////////////////////////
  // 🔹 MATCHING LOGIC (1 Pair = 1000 BV Left + 1000 BV Right)
  //////////////////////////////////////////////////////////////
  const leftStock = user.boosterPairsCarryForward.left;
  const rightStock = user.boosterPairsCarryForward.right;
  
  let pairsAvailable = Math.min(leftStock, rightStock);

  if (pairsAvailable <= 0) {
    console.log('[DEBUG] calculateBoosterMatching: no matching pairs', { userId: user?.userId });
    return { success: false, message: "No matching booster pairs" };
  }

  // Session Cap: 10 pairs (₹10,000) per session
  const remainingSessionPairs = 10 - sessionPairsUsed;
  if (remainingSessionPairs <= 0) {
    console.log('[DEBUG] calculateBoosterMatching: session cap reached', { sessionPairsUsed });
    return { success: false, message: "Session cap reached (10 pairs)" };
  }

  let allowedPairs = Math.min(pairsAvailable, remainingSessionPairs);

  // Daily Cap: ₹20,000
  const maxPairsByDaily = Math.floor((20000 - dailyIncome) / 1000);
  allowedPairs = Math.min(allowedPairs, maxPairsByDaily);
  
  console.log('[DEBUG] calculateBoosterMatching: allowedPairs computed', { 
    pairsAvailable, 
    remainingSessionPairs, 
    maxPairsByDaily, 
    allowedPairs 
  });

  if (allowedPairs <= 0) {
    return { success: false, message: "Daily income limit reached" };
  }

  //////////////////////////////////////////////////////////////
  // 💰 INCOME (₹1000 per pair)
  //////////////////////////////////////////////////////////////
  const income = allowedPairs * 1000;

  user.boosterMatchingIncome = (user.boosterMatchingIncome || 0) + income;
  user.totalIncome = (user.basicIncome || 0) + (user.boosterMatchingIncome || 0) + (user.awardIncome || 0) + (user.repurchaseIncome || 0);

  //////////////////////////////////////////////////////////////
  // 🔥 UPDATE CARRY FORWARD (Deduct Matched Pairs)
  //////////////////////////////////////////////////////////////
  user.boosterPairsCarryForward.left = Math.max(0, leftStock - allowedPairs);
  user.boosterPairsCarryForward.right = Math.max(0, rightStock - allowedPairs);
  
  console.log('[DEBUG] calculateBoosterMatching: stock updated', { 
    leftBvRemaining: user.boosterPairsCarryForward.left * 1000,
    rightBvRemaining: user.boosterPairsCarryForward.right * 1000 
  });


  //////////////////////////////////////////////////////////////
  // 📝 RECORD
  //////////////////////////////////////////////////////////////
  user.boosterMatchingRecords.push({
    date: now,
    sessionType,
    pairs: allowedPairs,
    income,
    processed: true,
  });
  console.log('[DEBUG] calculateBoosterMatching: pushed record', { date: now.toISOString(), sessionType, pairs: allowedPairs, income });

  return {
    success: true,
    pairs: allowedPairs,
    income,
    message: "Booster matching income credited",
  };
}