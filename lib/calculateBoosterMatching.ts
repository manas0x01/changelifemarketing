function getSessionType(date: Date): "morning" | "evening" {
  const hour = date.getHours();
  return hour < 12 ? "morning" : "evening";
}

export async function calculateBoosterMatching(user: any) {
  if (!user.isBooster) {
    return { success: false, message: "User is not a booster" };
  }

  const now = new Date();
  const today = now.toDateString();
  const sessionType = getSessionType(now);

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
    return { success: false, message: "Already processed in this session" };
  }

  //////////////////////////////////////////////////////////////
  // 🔥 LIMIT CARRY FORWARD (MAX 10)
  //////////////////////////////////////////////////////////////
  user.boosterPairsCarryForward.left = Math.min(
    user.boosterPairsCarryForward.left,
    10
  );
  user.boosterPairsCarryForward.right = Math.min(
    user.boosterPairsCarryForward.right,
    10
  );

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

  const todayRecords = user.boosterMatchingRecords.filter(
    (r: any) => new Date(r.date).toDateString() === today
  );

  const dailyIncome = todayRecords.reduce(
    (sum: number, r: any) => sum + (r.income || 0),
    0
  );

  if (dailyIncome >= 20000) {
    return { success: false, message: "Daily cap reached (₹20000)" };
  }

  //////////////////////////////////////////////////////////////
  // 🔹 MATCHING LOGIC
  //////////////////////////////////////////////////////////////
  const left = user.boosterPairsCarryForward.left;
  const right = user.boosterPairsCarryForward.right;

  let pairs = Math.min(left, right);

  if (pairs <= 0) {
    return { success: false, message: "No matching booster pairs" };
  }

  const remainingSessionPairs = 10 - sessionPairsUsed;
  if (remainingSessionPairs <= 0) {
    return { success: false, message: "Session cap reached (10 pairs)" };
  }

  let allowedPairs = Math.min(pairs, remainingSessionPairs);

  const maxPairsByDaily = Math.floor((20000 - dailyIncome) / 1000);
  allowedPairs = Math.min(allowedPairs, maxPairsByDaily);

  if (allowedPairs <= 0) {
    return { success: false, message: "Daily income limit reached" };
  }

  //////////////////////////////////////////////////////////////
  // 💰 INCOME
  //////////////////////////////////////////////////////////////
  const income = allowedPairs * 1000;

  user.boosterMatchingIncome =
    (user.boosterMatchingIncome || 0) + income;

  user.totalIncome = (user.totalIncome || 0) + income;

  //////////////////////////////////////////////////////////////
  // 🔥 SAFE CARRY FORWARD UPDATE
  //////////////////////////////////////////////////////////////
  user.boosterPairsCarryForward.left = Math.max(
    0,
    left - allowedPairs
  );
  user.boosterPairsCarryForward.right = Math.max(
    0,
    right - allowedPairs
  );

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

  return {
    success: true,
    pairs: allowedPairs,
    income,
    message: "Booster matching income credited",
  };
}