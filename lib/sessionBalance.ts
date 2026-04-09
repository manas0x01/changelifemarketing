/**
 * Session Balance Management Utility
 * Tracks income across 2 daily sessions (Morning & Evening)
 * Session 1: 12:00 AM - 11:59 AM (morning)
 * Session 2: 12:00 PM - 11:59 PM (evening)
 */

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
  BASIC_SESSION: 1000,           // ₹1,000 per session (1 pair)
  BASIC_DAILY: 2000,             // ₹2,000 per 24 hours
  BOOSTER_SESSION: 10000,        // ₹10,000 per session
  BOOSTER_DAILY: 20000,          // ₹20,000 per 24 hours
  BOOSTER_PAIRS_SESSION: 10,     // 10 pairs per session
  BOOSTER_CARRY_FORWARD_MAX: 10, // Max carry forward pairs
};

export const DEDUCTIONS = {
  TDS: 0.05,                     // 5%
  SERVICE_CHARGE: 0.15,          // 15%
  TOTAL: 0.20,                   // 20%
  NET_PERCENTAGE: 0.80,          // 80% (after deductions)
};

export const BINARY_PAIR_GV = 1000;  // ₹1,000 per pair
export const BINARY_PAIR_NET = BINARY_PAIR_GV * DEDUCTIONS.NET_PERCENTAGE; // ₹800

/**
 * Get current session type based on hour
 * @param date - Date to check (uses hours)
 * @returns 'morning' (0-11 hours) or 'evening' (12-23 hours)
 */
export function getSessionType(date: Date = new Date()): SessionType {
  const hours = date.getHours();
  return hours < 12 ? SESSION_TYPES.MORNING : SESSION_TYPES.EVENING;
}

/**
 * Get session start and end times for a given date
 */
export function getSessionTimeRange(session: SessionType, date: Date = new Date()) {
  const dateStr = date.toISOString().split('T')[0];
  
  if (session === SESSION_TYPES.MORNING) {
    return {
      start: new Date(`${dateStr}T00:00:00Z`),
      end: new Date(`${dateStr}T11:59:59Z`),
    };
  } else {
    return {
      start: new Date(`${dateStr}T12:00:00Z`),
      end: new Date(`${dateStr}T23:59:59Z`),
    };
  }
}

/**
 * Check if two dates are in the same session
 * @returns true if both dates are in same 12-hour session
 */
export function isSameSession(date1: Date, date2: Date): boolean {
  return getSessionType(date1) === getSessionType(date2);
}

/**
 * Calculate net income after deductions
 */
export function calculateNetIncome(
  grossAmount: number,
  tdsPercentage: number = DEDUCTIONS.TDS,
  serviceChargePercentage: number = DEDUCTIONS.SERVICE_CHARGE
) {
  const tds = grossAmount * tdsPercentage;
  const serviceCharge = grossAmount * serviceChargePercentage;
  const netIncome = grossAmount - tds - serviceCharge;
  
  return {
    grossIncome: grossAmount,
    tdsDeducted: tds,
    serviceChargeDeducted: serviceCharge,
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
  
  return {
    isValid: true,
    reason: 'Both members in same session',
  };
}

/**
 * Rank Information (13 Ranks Total)
 */
export const RANK_CONFIG = [
  { rank: 1, name: 'Bronze', leftBooters: 5, rightBoosters: 5, award: 'Business Kit' },
  { rank: 2, name: 'Silver', leftBooters: 10, rightBoosters: 10, award: 'Silver Award' },
  { rank: 3, name: 'Gold', leftBooters: 15, rightBoosters: 15, award: 'Gold Award' },
  { rank: 4, name: 'Platinum', leftBooters: 20, rightBoosters: 20, award: 'Platinum Award' },
  { rank: 5, name: 'Diamond', leftBooters: 25, rightBoosters: 25, award: 'Diamond Award' },
  { rank: 6, name: 'Ruby', leftBooters: 30, rightBoosters: 30, award: 'Ruby Award' },
  { rank: 7, name: 'Pearl', leftBooters: 35, rightBoosters: 35, award: 'Pearl Award' },
  { rank: 8, name: 'Emerald', leftBooters: 40, rightBoosters: 40, award: 'Emerald Award' },
  { rank: 9, name: 'Sapphire', leftBooters: 45, rightBoosters: 45, award: 'Sapphire Award' },
  { rank: 10, name: 'Topaz', leftBooters: 50, rightBoosters: 50, award: 'Topaz Award' },
  { rank: 11, name: 'Onyx', leftBooters: 55, rightBoosters: 55, award: 'Onyx Award' },
  { rank: 12, name: 'Jade', leftBooters: 60, rightBoosters: 60, award: 'Jade Award' },
  { rank: 13, name: 'Legend', leftBooters: 65, rightBoosters: 65, award: 'Legend Award' },
];

/**
 * Check if user qualifies for rank
 */
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
