import User from "@/models/User";

// 🔹 Session helper
function getSessionType(date: Date) {
  const hour = date.getHours();
  return hour < 12 ? "morning" : "evening";
}

async function getDescendants(user: any): Promise<any[]> {
  const list: any[] = [];
  if (user.leftChild) {
    const lc = await User.findOne({ $or: [{ username: user.leftChild }, { userId: user.leftChild }] });
    if (lc) {
      list.push(lc);
      list.push(...await getDescendants(lc));
    }
  }
  if (user.rightChild) {
    const rc = await User.findOne({ $or: [{ username: user.rightChild }, { userId: user.rightChild }] });
    if (rc) {
      list.push(rc);
      list.push(...await getDescendants(rc));
    }
  }
  return list;
}

async function countCurrentSessionDescendants(user: any, side: "left" | "right", startTime: number): Promise<number> {
  const childId = user[side === "left" ? "leftChild" : "rightChild"];
  if (!childId) return 0;

  const child = await User.findOne({
    $or: [{ username: childId }, { userId: childId }]
  });
  if (!child) return 0;

  const descendants = await getDescendants(child);
  descendants.push(child);

  const count = descendants.filter((d: any) => {
    const jd = d.joiningDate || d.createdAt || d.date;
    if (!jd) return false;
    return new Date(jd).getTime() >= startTime;
  }).length;

  return count;
}

export async function calculateBasicIncome(user: any) {
  const now = new Date();
  const today = now.toDateString();
  const sessionType = getSessionType(now);

  console.log('[DEBUG] calculateBasicIncome: entry', { userId: user?.userId, username: user?.username, sessionType, today });

  if (!Array.isArray(user.sessionBasedIncome)) {
    user.sessionBasedIncome = [];
  }

  // Calculate start time of the current session
  let sessionStartDate = user.lastSessionDate
    ? new Date(user.lastSessionDate)
    : new Date(user.createdAt || user.joiningDate || Date.now() - 12 * 60 * 60 * 1000);

  // Check if user already earned in this session - only 1 pair per session allowed
  const alreadyEarnedThisSession = user.sessionBasedIncome.find(
    (s: any) => {
      const recTime = new Date(s.date || s.sessionDate).getTime();
      return recTime >= (sessionStartDate.getTime() - 5000);
    }
  );

  if (alreadyEarnedThisSession) {
    console.log('[DEBUG] calculateBasicIncome: session limit reached - only 1 pair per session', { userId: user?.userId, sessionType });
    return {
      success: false,
      reason: "Session limit reached (1 pair only)",
    };
  }

  // Buffer slightly to account for small delays when creating the user/session change
  const startTime = sessionStartDate.getTime() - 5000;

  const leftCount = await countCurrentSessionDescendants(user, "left", startTime);
  const rightCount = await countCurrentSessionDescendants(user, "right", startTime);

  console.log('[DEBUG] calculateBasicIncome: session counts', { userId: user?.userId, leftCount, rightCount, startTime: new Date(startTime).toISOString() });

  if (leftCount < 1 || rightCount < 1) {
    console.log('[DEBUG] calculateBasicIncome: pair incomplete in this session', { userId: user?.userId, leftCount, rightCount });
    return {
      success: false,
      reason: "Pair not complete in this session",
    };
  }

  const possiblePairs = Math.min(leftCount, rightCount);

  if (possiblePairs <= 0) {
    console.log('[DEBUG] calculateBasicIncome: no new pairs in this session', { userId: user?.userId, possiblePairs });
    return {
      success: false,
      reason: "No new pair available in this session",
    };
  }

  const currentPairNumber = user.sessionBasedIncome.filter((s: any) => s && s.status === 'Completed').length + 1;

  if (currentPairNumber > 12) {
    console.log('[DEBUG] calculateBasicIncome: user has already completed 12 pairs', { userId: user?.userId });
    return {
      success: false,
      reason: "Maximum basic pairs reached",
    };
  }

  // Only give 1 pair per session maximum
  const pairsToGive = 1;
  let income = pairsToGive * 1000;
  
  // Enforce the 3rd, 6th, 9th, and 12th pair has zero income added to wallet
  if (currentPairNumber === 3 || currentPairNumber === 6 || currentPairNumber === 9 || currentPairNumber === 12) {
    income = 0;
  }
  
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
  console.log('[DEBUG] calculateBasicIncome: pushed session record', { userId: user?.userId, pairsToGive, income, currentPairNumber });
  
  // Update basicPairs based on TOTAL completed sessions in sessionBasedIncome
  const totalCompletedPairs = user.sessionBasedIncome
    .filter((s: any) => s.status === 'Completed')
    .reduce((sum: number, s: any) => sum + (s.pairs || s.pairsInSession || 0), 0);
  
  user.basicPairs = totalCompletedPairs;

  console.log('[DEBUG] calculateBasicIncome: updated counts', { userId: user?.userId, basicPairs: user.basicPairs });

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