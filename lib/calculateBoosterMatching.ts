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
  
  // Total pairs that CAN be matched right now
  let pairsAvailable = Math.min(leftStock, rightStock);

  if (pairsAvailable <= 0) {
    console.log('[DEBUG] calculateBoosterMatching: no matching pairs', { userId: user?.userId });
    return { success: false, message: "No matching booster pairs" };
  }

  // Session Cap: 10 pairs (₹10,000) per session
  const remainingSessionPairs = 10 - sessionPairsUsed;
  
  // Daily Cap: ₹20,000 (Total 20 pairs per day)
  const maxPairsByDaily = Math.floor((20000 - dailyIncome) / 1000);

  // How many pairs can we actually PAY for?
  let allowedPairs = Math.min(pairsAvailable, remainingSessionPairs, maxPairsByDaily);
  allowedPairs = Math.max(0, allowedPairs); // Ensure not negative

  // How many pairs are being FLASHED OUT?
  // (Total matched - Paid pairs = Flashed pairs)
  const flushedPairs = pairsAvailable - allowedPairs;
  
  console.log('[DEBUG] calculateBoosterMatching: pair breakdown', { 
    pairsAvailable, 
    paidPairs: allowedPairs, 
    flushedPairs,
    remainingSessionPairs, 
    maxPairsByDaily 
  });

  if (allowedPairs <= 0 && flushedPairs <= 0) {
    return { success: false, message: "Limits reached and no extra pairs to flush" };
  }

  //////////////////////////////////////////////////////////////
  // 💰 INCOME (₹1000 per pair)
  //////////////////////////////////////////////////////////////
  const income = allowedPairs * 1000;

  user.boosterMatchingIncome = (user.boosterMatchingIncome || 0) + income;
  user.totalIncome = (user.basicIncome || 0) + (user.boosterMatchingIncome || 0) + (user.awardIncome || 0) + (user.repurchaseIncome || 0);

  //////////////////////////////////////////////////////////////
  // 🔥 UPDATE CARRY FORWARD (Deduct ALL Matched Pairs - STRICT FLUSH OUT)
  //////////////////////////////////////////////////////////////
  // We deduct ALL pairsAvailable so that extra pairs are GONE forever.
  user.boosterPairsCarryForward.left = Math.max(0, leftStock - pairsAvailable);
  user.boosterPairsCarryForward.right = Math.max(0, rightStock - pairsAvailable);
  
  console.log('[DEBUG] calculateBoosterMatching: stock updated with flush-out', { 
    consumed: pairsAvailable,
    paid: allowedPairs,
    flushed: flushedPairs,
    leftBvRemaining: user.boosterPairsCarryForward.left * 1000,
    rightBvRemaining: user.boosterPairsCarryForward.right * 1000 
  });


  //////////////////////////////////////////////////////////////
  // 📝 RECORD
  //////////////////////////////////////////////////////////////
  user.boosterMatchingRecords.push({
    srNo: user.boosterMatchingRecords.length + 1,
    date: now,
    sessionType,
    pairsMatched: pairsAvailable, // Total identified
    paidPairs: allowedPairs,      // Actually paid
    flashedPairs: flushedPairs,   // Lost to caps (Company Profit)
    pairs: allowedPairs,          // Alias for UI compatibility
    income,
    netIncome: income,
    status: 'Completed',
    processed: true,
  });
  console.log('[DEBUG] calculateBoosterMatching: pushed record with flush info', { sessionType, paid: allowedPairs, flashed: flushedPairs });
  console.log('[DEBUG] calculateBoosterMatching: pushed record', { date: now.toISOString(), sessionType, pairs: allowedPairs, income });

  return {
    success: true,
    pairs: allowedPairs,
    income,
    message: "Booster matching income credited",
  };
}