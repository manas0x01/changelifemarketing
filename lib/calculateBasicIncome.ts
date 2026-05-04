import User from "@/models/User";

// 🔹 Session helper
function getSessionType(date: Date) {
  const hour = date.getHours();
  return hour < 12 ? "morning" : "evening";
}

export async function calculateBasicIncome(user: any) {
  const now = new Date();
  const today = now.toDateString();
  const sessionType = getSessionType(now);

  console.log('[DEBUG] calculateBasicIncome: entry', { userId: user?.userId, username: user?.username, sessionType, today });

  if (!Array.isArray(user.sessionBasedIncome)) {
    user.sessionBasedIncome = [];
  }

  // Check if user already earned in this session - only 1 pair per session allowed
  const alreadyEarnedThisSession = user.sessionBasedIncome.find(
    (s: any) =>
      s.sessionType === sessionType &&
      new Date(s.date || s.sessionDate).toDateString() === today
  );

  if (alreadyEarnedThisSession) {
    console.log('[DEBUG] calculateBasicIncome: session limit reached - only 1 pair per session', { userId: user?.userId, sessionType });
    return {
      success: false,
      reason: "Session limit reached (1 pair only)",
    };
  }

  const leftCount =
    typeof user.totalTeam?.left === "number"
      ? user.totalTeam.left
      : user.leftChild && user.leftChild !== ""
      ? 1
      : 0;

  const rightCount =
    typeof user.totalTeam?.right === "number"
      ? user.totalTeam.right
      : user.rightChild && user.rightChild !== ""
      ? 1
      : 0;

  if (leftCount < 1 || rightCount < 1) {
    console.log('[DEBUG] calculateBasicIncome: pair incomplete', { userId: user?.userId, leftCount, rightCount });
    return {
      success: false,
      reason: "Pair not complete",
    };
  }

  const possiblePairs = Math.min(leftCount, rightCount);
  const alreadyGivenPairs = user.basicPairs || 0;

  const newPairs = possiblePairs - alreadyGivenPairs;

  if (newPairs <= 0) {
    console.log('[DEBUG] calculateBasicIncome: no new pairs', { userId: user?.userId, possiblePairs, alreadyGivenPairs });
    return {
      success: false,
      reason: "No new pair available",
    };
  }

  // Only give 1 pair per session maximum
  const pairsToGive = 1;
  const income = pairsToGive * 1000;
  
  user.sessionBasedIncome.push({
    date: now,
    sessionType,
    pairs: pairsToGive,
    grossIncome: income,
    netIncome: income,
    // keep old-style fields for compatibility
    sessionDate: now,
    pairsInSession: pairsToGive,
    leftMembersInSession: leftCount,
    rightMembersInSession: rightCount,
    tdsDeducted: 0,
    serviceChargeDeducted: 0,
    status: 'Completed',
  });
  console.log('[DEBUG] calculateBasicIncome: pushed session record', { userId: user?.userId, pairsToGive, income });
  
  // Update basicPairs based on TOTAL completed sessions in sessionBasedIncome
  const totalCompletedPairs = user.sessionBasedIncome
    .filter((s: any) => s.status === 'Completed')
    .reduce((sum: number, s: any) => sum + (s.pairs || s.pairsInSession || 0), 0);
  
  user.basicPairs = totalCompletedPairs;
  console.log('[DEBUG] calculateBasicIncome: basicPairs synced with records', { userId: user?.userId, basicPairs: user.basicPairs });

  // Ensure Mongoose detects the changes
  if (typeof (user as any).markModified === 'function') {
    try {
      (user as any).markModified('sessionBasedIncome');
      (user as any).markModified('basicPairs');
    } catch (err) {}
  }

  //////////////////////////////////////////////////////////////
  // ✅ SUCCESS
  //////////////////////////////////////////////////////////////
  return {
    success: true,
    income,
    message: "Basic income credited",
  };
}