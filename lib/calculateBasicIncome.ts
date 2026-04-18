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

  if (!Array.isArray(user.sessionBasedIncome)) {
    user.sessionBasedIncome = [];
  }

  const alreadyEarnedThisSession = user.sessionBasedIncome.find(
    (s: any) =>
      s.sessionType === sessionType &&
      new Date(s.date || s.sessionDate).toDateString() === today
  );

  if (alreadyEarnedThisSession) {
    return {
      success: false,
      reason: "Session limit reached (1 pair only)",
    };
  }

  const todaySessions = user.sessionBasedIncome.filter(
    (s: any) => new Date(s.date || s.sessionDate).toDateString() === today
  );

  if (todaySessions.length >= 2) {
    return {
      success: false,
      reason: "Daily cap reached (₹2000)",
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
    return {
      success: false,
      reason: "Pair not complete",
    };
  }

  const possiblePairs = Math.min(leftCount, rightCount);
  const alreadyGivenPairs = user.basicPairs || 0;

  const newPairs = possiblePairs - alreadyGivenPairs;

  if (newPairs <= 0) {
    return {
      success: false,
      reason: "No new pair available",
    };
  }

  const pairsToGive = 1; // max 1 per session
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
  // Ensure Mongoose detects the change to the subdocument array
  if (typeof (user as any).markModified === 'function') {
    try {
      (user as any).markModified('sessionBasedIncome');
    } catch (err) {
      // non-fatal: markModified exists on mongoose documents
    }
  }
  user.basicPairs = alreadyGivenPairs + pairsToGive;

  if (typeof (user as any).markModified === 'function') {
    try {
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