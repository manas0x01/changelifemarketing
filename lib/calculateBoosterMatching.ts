function getSessionType(date: Date): "morning" | "evening" {
  const hour = date.getHours();
  return hour < 12 ? "morning" : "evening";
}

export async function calculateBoosterMatching(user: any, manualDate?: Date) {
  console.log('[DEBUG] calculateBoosterMatching: entry', { userId: user?.userId, isBooster: user?.isBooster });
  
  const targetDate = manualDate || new Date();
  const today = targetDate.toDateString();
  const sessionType = getSessionType(targetDate);

  if (!user.boosterMatchingRecords) user.boosterMatchingRecords = [];
  if (!user.boosterPairsCarryForward)
    user.boosterPairsCarryForward = { left: 0, right: 0 };

  // 1. Identify current session unique ID
  const currentSessionId = `${today}-${sessionType}`;

  // 2. Calculate pairs currently available to match from carry forward
  const leftStock = user.boosterPairsCarryForward.left || 0;
  const rightStock = user.boosterPairsCarryForward.right || 0;
  const pairsToProcess = Math.min(leftStock, rightStock);

  if (pairsToProcess <= 0) {
    return { success: false, message: "No matching booster pairs available" };
  }

  // 3. Check session cap (10 pairs per session)
  // Find if we already have a record for this specific session
  const existingIndex = user.boosterMatchingRecords.findIndex(
    (r: any) => r.sessionType === sessionType && new Date(r.date).toDateString() === today
  );

  let paidSoFar = 0;
  if (existingIndex > -1) {
    paidSoFar = user.boosterMatchingRecords[existingIndex].paidPairs || 0;
  }

  const remainingCap = Math.max(0, 10 - paidSoFar);
  
  // 4. Calculate how many of the available pairs can be paid and how many must be flashed
  const pairsToPay = Math.min(pairsToProcess, remainingCap);
  const pairsToFlash = pairsToProcess - pairsToPay;
  const income = pairsToPay * 1000;

  // 5. Update user income stats
  if (user.isBooster) {
    user.boosterMatchingIncome = (user.boosterMatchingIncome || 0) + income;
    if (income > 0) {
        console.log(`[BOOSTER MATCHING] ${user.username}: Released ₹${income} (Paid: ${pairsToPay}, Flashed: ${pairsToFlash})`);
    }
  } else if (income > 0) {
    console.log(`[BOOSTER MATCHING] ${user.username}: ₹${income} put on HOLD (Non-booster parent)`);
  }

  user.totalIncome = (user.basicIncome || 0) + (user.boosterMatchingIncome || 0) + (user.awardIncome || 0) + (user.repurchaseIncome || 0);

  // 6. Update Carry Forward (Subtract ALL processed pairs, both paid and flashed)
  user.boosterPairsCarryForward.left = Math.max(0, leftStock - pairsToProcess);
  user.boosterPairsCarryForward.right = Math.max(0, rightStock - pairsToProcess);

  // 7. Update or Create the Session Record
  if (existingIndex > -1) {
    // Update existing cumulative record
    user.boosterMatchingRecords[existingIndex].pairsMatched = (user.boosterMatchingRecords[existingIndex].pairsMatched || 0) + pairsToProcess;
    user.boosterMatchingRecords[existingIndex].paidPairs = (user.boosterMatchingRecords[existingIndex].paidPairs || 0) + pairsToPay;
    user.boosterMatchingRecords[existingIndex].flashedPairs = (user.boosterMatchingRecords[existingIndex].flashedPairs || 0) + pairsToFlash;
    user.boosterMatchingRecords[existingIndex].pairs = user.boosterMatchingRecords[existingIndex].paidPairs;
    user.boosterMatchingRecords[existingIndex].income = (user.boosterMatchingRecords[existingIndex].income || 0) + income;
    user.boosterMatchingRecords[existingIndex].netIncome = user.boosterMatchingRecords[existingIndex].income;
    user.boosterMatchingRecords[existingIndex].status = user.isBooster ? 'Released' : 'Hold';
  } else {
    // Create new record for this session
    user.boosterMatchingRecords.push({
      srNo: user.boosterMatchingRecords.length + 1,
      date: targetDate,
      sessionType,
      pairsMatched: pairsToProcess,
      paidPairs: pairsToPay,
      flashedPairs: pairsToFlash,
      pairs: pairsToPay,
      income: income,
      netIncome: income,
      status: user.isBooster ? 'Released' : 'Hold',
      processed: true,
    });
  }

  // Set the session flag to indicate this user's stats are up to date for this moment
  user.lastBoosterMatchingSession = currentSessionId;

  return {
    success: true,
    pairsMatched: pairsToProcess,
    paidPairs: pairsToPay,
    flashedPairs: pairsToFlash,
    income,
    message: user.isBooster ? "Booster matching updated" : "Booster matching on hold",
  };
}