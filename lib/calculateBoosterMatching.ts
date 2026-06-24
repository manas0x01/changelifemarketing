function getSessionType(date: Date): "morning" | "evening" {
  // Use IST (UTC+5:30) for session determination
  const istDate = new Date(date.getTime() + 5.5 * 60 * 60 * 1000);
  const hour = istDate.getUTCHours();
  return hour < 12 ? "morning" : "evening";
}

import { istDateISO } from "./istUtils";

export async function calculateBoosterMatching(user: any, manualDate?: Date, addedPosition?: 'Left' | 'Right') {
  console.log('[DEBUG] calculateBoosterMatching: entry', { userId: user?.userId, isBooster: user?.isBooster });
  
  const targetDate = manualDate || new Date();
  const today = istDateISO(targetDate);
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
    (r: any) => r.sessionType === sessionType && istDateISO(new Date(r.date)) === today
  );

  let paidSoFar = 0;
  let currentRecord;
  if (existingIndex > -1) {
    currentRecord = user.boosterMatchingRecords[existingIndex];
  } else {
    currentRecord = {
      srNo: user.boosterMatchingRecords.length + 1,
      date: targetDate,
      sessionType,
      pairsMatched: 0,
      paidPairs: 0,
      flashedPairs: 0,
      pairs: 0,
      income: 0,
      netIncome: 0,
      status: user.isBooster ? 'Released' : 'Hold',
      processed: true,
      sessionLeftGenerated: 0,
      sessionRightGenerated: 0,
      sameSessionPairsPaid: 0,
    };
    user.boosterMatchingRecords.push(currentRecord);
  }

  // Record newly generated counts in the current session
  if (addedPosition === 'Left') {
    currentRecord.sessionLeftGenerated = (currentRecord.sessionLeftGenerated || 0) + 1;
  } else if (addedPosition === 'Right') {
    currentRecord.sessionRightGenerated = (currentRecord.sessionRightGenerated || 0) + 1;
  }

  paidSoFar = currentRecord.paidPairs || 0;
  const remainingCap = Math.max(0, 10 - paidSoFar);

  // Maximum pairs that CAN be paid in this session (since both legs must be generated in THIS session)
  const maxSameSessionPairs = Math.min(currentRecord.sessionLeftGenerated || 0, currentRecord.sessionRightGenerated || 0);
  const sameSessionPairsPaidSoFar = currentRecord.sameSessionPairsPaid || 0;
  
  // How many of the pairs being processed right now are same-session pairs?
  const availableSameSessionPairs = Math.max(0, maxSameSessionPairs - sameSessionPairsPaidSoFar);
  const sameSessionPairsInThisRun = Math.min(pairsToProcess, availableSameSessionPairs);
  
  // Only same-session pairs are eligible to be paid (subject to the cap)
  const pairsToPay = Math.min(sameSessionPairsInThisRun, remainingCap);
  
  // The rest are flashed (this includes cross-session matches and pairs exceeding the cap)
  const pairsToFlash = pairsToProcess - pairsToPay;
  const income = pairsToPay * 1000;
  
  currentRecord.sameSessionPairsPaid = sameSessionPairsPaidSoFar + sameSessionPairsInThisRun;

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
  // 7. Update the Session Record
  currentRecord.pairsMatched = (currentRecord.pairsMatched || 0) + pairsToProcess;
  currentRecord.paidPairs = (currentRecord.paidPairs || 0) + pairsToPay;
  currentRecord.flashedPairs = (currentRecord.flashedPairs || 0) + pairsToFlash;
  currentRecord.pairs = currentRecord.paidPairs;
  currentRecord.income = (currentRecord.income || 0) + income;
  currentRecord.netIncome = currentRecord.income;
  currentRecord.status = user.isBooster ? 'Released' : 'Hold';

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