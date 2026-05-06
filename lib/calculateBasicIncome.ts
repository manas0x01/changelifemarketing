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

  // Calculate start time of the current session
  let sessionStartDate = user.lastSessionDate
    ? new Date(user.lastSessionDate)
    : new Date(user.createdAt || user.joiningDate || Date.now() - 12 * 60 * 60 * 1000);

  const leftCount = user.sessionTeam?.left || 0;
  const rightCount = user.sessionTeam?.right || 0;
  
  // Calculate unique sessions already processed
  const uniqueSessions = new Set(
    user.sessionBasedIncome
      .filter((s: any) => s.status === 'Completed')
      .map((s: any) => `${new Date(s.date || s.sessionDate).toDateString()}-${s.sessionType}`)
  );
  
  const currentSessionKey = `${today}-${sessionType}`;
  const isFirstPairOfSession = !uniqueSessions.has(currentSessionKey);
  const sessionSequenceNumber = uniqueSessions.has(currentSessionKey) 
    ? uniqueSessions.size 
    : uniqueSessions.size + 1;

  // How many pairs already recorded for THIS specific session
  const currentSessionPairs = user.sessionBasedIncome.filter(
    (s: any) => {
      const recDate = new Date(s.date || s.sessionDate).toDateString();
      return recDate === today && s.sessionType === sessionType && s.status === 'Completed';
    }
  ).length;

  console.log('[DEBUG] calculateBasicIncome: session sequence', { 
    userId: user?.userId, 
    sessionSequenceNumber,
    isFirstPairOfSession,
    currentSessionPairs,
    totalUniqueSessions: uniqueSessions.size
  });

  // Calculate how many pairs are theoretically possible in this session
  const possiblePairsInSession = Math.min(leftCount, rightCount);

  if (possiblePairsInSession <= currentSessionPairs) {
    console.log('[DEBUG] calculateBasicIncome: no new pair completed in this session', { possiblePairsInSession, currentSessionPairs });
    return {
      success: false,
      reason: "Pair not complete or already processed in this session",
    };
  }

  // If we reach here, a NEW pair has been completed in this session
  const currentPairNumber = user.sessionBasedIncome.filter((s: any) => s && s.status === 'Completed').length + 1;

  if (currentPairNumber > 12) { 
    console.log('[DEBUG] calculateBasicIncome: user has already completed 12 basic pairs', { userId: user?.userId });
    return {
      success: false,
      reason: "Maximum basic pairs reached (12 total)",
    };
  }

  // LOGIC: Only the 1st pair of a session can earn income.
  // AND: The session sequence number must not be a multiple of 3.
  let income = 0;
  
  if (isFirstPairOfSession && sessionSequenceNumber % 3 !== 0) {
    console.log(`[DEBUG] calculateBasicIncome: Session ${sessionSequenceNumber}, Pair ${currentPairNumber}. Income set to 1000.`, { userId: user?.userId });
    income = 1000;
  } else {
    const reason = !isFirstPairOfSession 
      ? "Not the 1st pair in this session" 
      : `Session ${sessionSequenceNumber} is a "Placed Out" multiple of 3`;
    console.log(`[DEBUG] calculateBasicIncome: Session ${sessionSequenceNumber}, Pair ${currentPairNumber}. Income set to 0. Reason: ${reason}`, { userId: user?.userId });
    income = 0;
  }
  
  user.sessionBasedIncome.push({
    date: now,
    sessionType,
    pairs: 1,
    grossIncome: income,
    netIncome: income,
    // keep old-style fields for compatibility
    sessionDate: now,
    pairsInSession: 1,
    leftMembersInSession: leftCount,
    rightMembersInSession: rightCount,
    tdsDeducted: 0,
    serviceChargeDeducted: 0,
    status: 'Completed',
  });
  console.log('[DEBUG] calculateBasicIncome: pushed session record', { userId: user?.userId, income, currentPairNumber });
  
  // Update basicPairs based on TOTAL completed sessions in sessionBasedIncome
  const totalCompletedPairs = user.sessionBasedIncome
    .filter((s: any) => s.status === 'Completed')
    .length;
  
  user.basicPairs = totalCompletedPairs;

  // Ensure Mongoose detects the changes
  if (typeof (user as any).markModified === 'function') {
    try {
      (user as any).markModified('sessionBasedIncome');
      (user as any).markModified('basicPairs');
    } catch (err) {}
  }

  return {
    success: true,
    income,
    message: income > 0 ? "Basic income credited" : "Pair completed (Placed Out)",
  };
}