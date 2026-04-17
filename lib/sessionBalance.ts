export type SessionType = 'morning' | 'evening';

export const SESSION_TYPES = {
  MORNING: 'morning' as SessionType,  // 12 AM - 11:59 AM (hours 0-11)
  EVENING: 'evening' as SessionType,  // 12 PM - 11:59 PM (hours 12-23)
};

export const INCOME_TYPES = {
  BASIC: 'basicIncome',
  BOOSTER: 'boosterIncomeAmount',
  AWARD: 'awardIncome',
  REPURCHASE: 'repurchaseIncome',
};

export const CAPS = {
  // Basic caps temporarily disabled for testing:
  // Set to Infinity so basic income won't be capped during session/daily calculations.
  BASIC_SESSION: Number.POSITIVE_INFINITY, // was 1000
  BASIC_DAILY: Number.POSITIVE_INFINITY,   // was 2000
  BOOSTER_SESSION: 10000,        // ₹10,000 per session
  BOOSTER_DAILY: 20000,          // ₹20,000 per 24 hours
  BOOSTER_PAIRS_SESSION: 10,     // 10 pairs per session
  BOOSTER_CARRY_FORWARD_MAX: 10, // Max carry forward pairs
};

export const BINARY_PAIR_GV = 1000;  // ₹1,000 per pair
export const BINARY_PAIR_NET = BINARY_PAIR_GV; // ₹1,000 (No deductions)

export function getSessionType(date: Date = new Date()): SessionType {
  const hours = date.getHours();
  const session = hours < 12 ? SESSION_TYPES.MORNING : SESSION_TYPES.EVENING;
  return session;
}


export function getSessionTimeRange(session: SessionType, date: Date = new Date()) {
  const dateStr = date.toISOString().split('T')[0];
  if (session === SESSION_TYPES.MORNING) {
    const start = new Date(`${dateStr}T00:00:00Z`);
    const end = new Date(`${dateStr}T11:59:59Z`);
    return { start, end };
  } else {
    const start = new Date(`${dateStr}T12:00:00Z`);
    const end = new Date(`${dateStr}T23:59:59Z`);
    return { start, end };
  }
}


export function isSameSession(date1: Date, date2: Date): boolean {
  const session1 = getSessionType(date1);
  const session2 = getSessionType(date2);
  const isSame = session1 === session2;
  return isSame;
}

/**
 * Calculate net income (no deductions applied)
 */
export function calculateNetIncome(grossAmount: number) {
  const netIncome = grossAmount;
  return {
    grossIncome: grossAmount,
    netIncome: netIncome,
  };
}

/**
 * Session Balance Summary
 */
export interface SessionBalance {
  date: string;
  morning: {
    type: SessionType;
    basicIncome: { pairs: number; gross: number; net: number };
    boosterIncome: { pairs: number; gross: number; net: number; carryForward: number };
    totalGross: number;
    totalNet: number;
  };
  evening: {
    type: SessionType;
    basicIncome: { pairs: number; gross: number; net: number };
    boosterIncome: { pairs: number; gross: number; net: number; carryForward: number };
    totalGross: number;
    totalNet: number;
  };
  daily: {
    totalGross: number;
    totalNet: number;
    basicCappingStatus: string;  // e.g., "2000/2000"
    boosterCappingStatus: string; // e.g., "20000/20000"
  };
}

/**
 * Time Matching Validation for Basic Income Pairs
 * Both left and right members must be joined in SAME 12-hour session
 */
export function validateTimeMatching(
  leftMemberJoinDate: Date,
  rightMemberJoinDate: Date
): { isValid: boolean; reason: string } {
  const leftSession = getSessionType(leftMemberJoinDate);
  const rightSession = getSessionType(rightMemberJoinDate);
  if (leftSession !== rightSession) {
    return {
      isValid: false,
      reason: `Time mismatch: Left member in ${leftSession} session, Right member in ${rightSession} session`,
    };
  }
  
  console.log(`  ✅ PASSED - Both members joined in same 12-hour session`);
  return {
    isValid: true,
    reason: 'Both members in same session',
  };
}

/**
 * Rank Information (13 Ranks Total) with Awards
 * Based on Booster Pair Requirements (Left-Right)
 */
export const RANK_CONFIG = [
  { rank: 1, name: 'Gold', leftBooters: 5, rightBoosters: 5, award: 'Bag + Business Kit' },
  { rank: 2, name: 'Super Gold', leftBooters: 10, rightBoosters: 10, award: 'Smart Watch' },
  { rank: 3, name: 'Gold Star', leftBooters: 25, rightBoosters: 25, award: 'Suit Length' },
  { rank: 4, name: 'Pearl ex', leftBooters: 50, rightBoosters: 50, award: 'Mixi-Grinder' },
  { rank: 5, name: 'Emerald', leftBooters: 100, rightBoosters: 100, award: 'Fridge (Refrigerator)' },
  { rank: 6, name: 'Ruby', leftBooters: 200, rightBoosters: 200, award: 'Mobile' },
  { rank: 7, name: 'Platinum', leftBooters: 500, rightBoosters: 500, award: 'Laptop' },
  { rank: 8, name: 'Diamond', leftBooters: 1000, rightBoosters: 1000, award: 'Bike' },
  { rank: 9, name: 'Double Diamond', leftBooters: 2000, rightBoosters: 2000, award: '₹1.5 Lakh Gift' },
  { rank: 10, name: 'Black Diamond', leftBooters: 4000, rightBoosters: 4000, award: '₹2.5 Lakh Gift' },
  { rank: 11, name: 'Blue Diamond', leftBooters: 8000, rightBoosters: 8000, award: '₹5 Lakh' },
  { rank: 12, name: 'Royal Diamond', leftBooters: 16000, rightBoosters: 16000, award: '₹7.5 Lakh' },
  { rank: 13, name: 'Crown Diamond', leftBooters: 32000, rightBoosters: 32000, award: '₹10 Lakh' },
];

export function checkRankQualification(
  leftBoosters: number,
  rightBoosters: number,
  targetRank: number = 1
): { qualified: boolean; nextRank: number | null; message: string } {
  const rankConfig = RANK_CONFIG[targetRank - 1];
  
  if (!rankConfig) {
    return { qualified: false, nextRank: null, message: 'Invalid rank' };
  }

  if (leftBoosters >= rankConfig.leftBooters && rightBoosters >= rankConfig.rightBoosters) {
    const nextRank = targetRank < 13 ? targetRank + 1 : null;
    return {
      qualified: true,
      nextRank: nextRank,
      message: `✓ Qualified for ${rankConfig.name} rank - Award: ${rankConfig.award}`,
    };
  }
  
  const leftNeeded = Math.max(0, rankConfig.leftBooters - leftBoosters);
  const rightNeeded = Math.max(0, rankConfig.rightBoosters - rightBoosters);

  return {
    qualified: false,
    nextRank: null,
    message: `Need ${leftNeeded} more left boosters & ${rightNeeded} more right boosters for ${rankConfig.name} rank`,
  };
}

/**
 * Format session balance for display
 */
export function formatSessionBalance(balance: SessionBalance): string {
  return `
📊 SESSION BALANCE (${balance.date})
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🌅 MORNING SESSION (12 AM - 11:59 AM)
├─ Basic Income: ${balance.morning.basicIncome.pairs} pairs | ₹${balance.morning.basicIncome.net}
├─ Booster Income: ${balance.morning.boosterIncome.pairs} pairs | ₹${balance.morning.boosterIncome.net}
└─ Session Total: ₹${balance.morning.totalNet}

🌆 EVENING SESSION (12 PM - 11:59 PM)
├─ Basic Income: ${balance.evening.basicIncome.pairs} pairs | ₹${balance.evening.basicIncome.net}
├─ Booster Income: ${balance.evening.boosterIncome.pairs} pairs | ₹${balance.evening.boosterIncome.net}
└─ Session Total: ₹${balance.evening.totalNet}

📈 DAILY SUMMARY
├─ Total Net Income: ₹${balance.daily.totalNet}
├─ Basic Cap Status: ${balance.daily.basicCappingStatus}
├─ Booster Cap Status: ${balance.daily.boosterCappingStatus}
└─ Booster Carry Forward: ${balance.morning.boosterIncome.carryForward + balance.evening.boosterIncome.carryForward} pairs
`;
}
