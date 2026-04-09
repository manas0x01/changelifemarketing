/**
 * Income Calculation & Validation Utilities
 * Implements 10-point MLM system rules
 */

// ✅ POINT 1: Session Types (12-hour windows)
export const SESSION_TYPES = {
  MORNING: 'morning',    // 12:00 AM - 11:59 AM
  EVENING: 'evening',    // 12:00 PM - 11:59 PM
} as const;

export function getSessionFromTime(date: Date): 'morning' | 'evening' {
  const hours = date.getHours();
  return hours < 12 ? SESSION_TYPES.MORNING : SESSION_TYPES.EVENING;
}

export function getSessionDate(date: Date): { date: string; session: 'morning' | 'evening' } {
  return {
    date: date.toISOString().split('T')[0],
    session: getSessionFromTime(date)
  };
}

export const BINARY_PAIR_CONFIG = {
  GROSS_INCOME: 1000, 
  TDS_PERCENTAGE: 5,  
  SERVICE_CHARGE_PERCENTAGE: 15,
} as const;

export function calculateBinaryPairIncome(pairCount: number = 1): {
  grossIncome: number;
  tds: number;
  serviceCharge: number;
  netIncome: number;
} {
  const grossIncome = BINARY_PAIR_CONFIG.GROSS_INCOME * pairCount;
  const tds = Math.ceil((grossIncome * BINARY_PAIR_CONFIG.TDS_PERCENTAGE) / 100);
  const serviceCharge = Math.ceil((grossIncome * BINARY_PAIR_CONFIG.SERVICE_CHARGE_PERCENTAGE) / 100);
  const netIncome = grossIncome - tds - serviceCharge;

  return { grossIncome, tds, serviceCharge, netIncome };
}

// ✅ POINT 4 & 5 & 6: Basic Income Rules
export const BASIC_INCOME_CONFIG = {
  DAILY_CAP: 2000,           // ₹2,000 daily maximum
  SESSION_CAP: 1000,         // ₹1,000 per 12-hour session
  MAX_PAIRS_PER_SESSION: 1,  // Only 1 pair counts per session
} as const;

/**
 * Validates if pair matching meets time-based requirements
 * Both left & right must be in SAME 12-hour session
 */
export function validateBasicIncomePairMatching(
  leftMemberDate: Date,
  rightMemberDate: Date
): {
  isValid: boolean;
  reason?: string;
  leftSession?: string;
  rightSession?: string;
} {
  const leftSession = getSessionDate(leftMemberDate);
  const rightSession = getSessionDate(rightMemberDate);

  // Check if same date AND same session
  if (leftSession.date !== rightSession.date || leftSession.session !== rightSession.session) {
    return {
      isValid: false,
      reason: 'Members must be added in same 12-hour session (12 AM-PM or 12 PM-AM)',
      leftSession: `${leftSession.date} ${leftSession.session}`,
      rightSession: `${rightSession.date} ${rightSession.session}`
    };
  }

  return {
    isValid: true,
    leftSession: `${leftSession.date} ${leftSession.session}`,
    rightSession: `${rightSession.date} ${rightSession.session}`
  };
}

/**
 * Calculates basic income with session-based capping
 * Max ₹1,000 per session (even if multiple pairs formed)
 */
export function calculateBasicIncome(
  pairsInSession: number,
  sessionType: 'morning' | 'evening'
): number {
  // Only 1 pair counts per session, cap at ₹1,000
  const countablePairs = Math.min(pairsInSession, BASIC_INCOME_CONFIG.MAX_PAIRS_PER_SESSION);
  const { netIncome } = calculateBinaryPairIncome(countablePairs);
  return Math.min(netIncome, BASIC_INCOME_CONFIG.SESSION_CAP);
}

// ✅ POINT 7: Booster Qualification (12 pairs complete → Booster status)
export const BOOSTER_CONFIG = {
  QUALIFICATION_THRESHOLD: 12,  // 12 pairs to become booster
  CUTTING_POSITIONS: [3, 6, 9, 12], // Positions where pairs are cut
  CUTS_TOTAL: 4,               // Total pairs cut for qualification
  EFFECTIVE_PAIRS: 8,          // 12 - 4 cuts = 8 effective pairs
} as const;

/**
 * Checks if user qualifies for booster status
 * Needs 12 complete pairs (with 4 pairs cut at positions 3,6,9,12)
 */
export function checkBoosterQualification(totalPairsCompleted: number): {
  isQualified: boolean;
  pairsNeeded: number;
  pairsCut: number;
  effectivePairs: number;
} {
  const isQualified = totalPairsCompleted >= BOOSTER_CONFIG.QUALIFICATION_THRESHOLD;
  const pairsNeeded = Math.max(0, BOOSTER_CONFIG.QUALIFICATION_THRESHOLD - totalPairsCompleted);
  const pairsCut = isQualified ? BOOSTER_CONFIG.CUTS_TOTAL : 0;
  const effectivePairs = isQualified ? BOOSTER_CONFIG.EFFECTIVE_PAIRS : 0;

  return { isQualified, pairsNeeded, pairsCut, effectivePairs };
}

// ✅ POINT 8 & 9: Booster Matching Income with Carry-Forward & Fleshout
export const BOOSTER_MATCHING_CONFIG = {
  DAILY_CAP: 20000,              // ₹20,000 daily maximum
  SESSION_CAP: 10000,            // ₹10,000 per session (morning/evening)
  MAX_PAIRS_PER_SESSION: 10,     // Max 10 pairs per session before fleshout
  CARRY_FORWARD_MAX: 10,         // Max 10 pairs carried forward
} as const;

/**
 * Calculates booster matching income with session caps and carry-forward logic
 * If pairs > 10 in session: fleshout happens, 10 pairs carry to next session
 */
export function calculateBoosterMatchingIncome(
  totalPairs: number,
  previousCarryForward: number = 0
): {
  availablePairs: number;
  pairsUsed: number;
  grossIncome: number;
  netIncome: number;
  pairsCarried: number;
  pairsFleshout: number;
  sessionCapped: boolean;
} {
  // Start with carry-forward + new pairs
  const totalAvailable = previousCarryForward + totalPairs;

  // Session cap: max 10 pairs per session
  const pairsUsed = Math.min(totalAvailable, BOOSTER_MATCHING_CONFIG.MAX_PAIRS_PER_SESSION);
  const { netIncome, grossIncome } = calculateBinaryPairIncome(pairsUsed);

  // Remaining pairs for carry-forward or fleshout
  const remainingPairs = totalAvailable - pairsUsed;
  const pairsCarried = Math.min(remainingPairs, BOOSTER_MATCHING_CONFIG.CARRY_FORWARD_MAX);
  const pairsFleshout = Math.max(0, remainingPairs - BOOSTER_MATCHING_CONFIG.CARRY_FORWARD_MAX);

  return {
    availablePairs: totalAvailable,
    pairsUsed,
    grossIncome,
    netIncome: Math.min(netIncome, BOOSTER_MATCHING_CONFIG.SESSION_CAP),
    pairsCarried,
    pairsFleshout,
    sessionCapped: pairsUsed >= BOOSTER_MATCHING_CONFIG.MAX_PAIRS_PER_SESSION
  };
}

/**
 * Validates booster matching: left and right booster must exist
 * At least one pair requires: 1 left booster + 1 right booster
 */
export function validateBoosterMatching(
  isBoosterLeft: boolean,
  isBoosterRight: boolean,
  hasLeftBoosterBelow?: boolean,
  hasRightBoosterBelow?: boolean
): {
  canMatch: boolean;
  reason?: string;
} {
  if (!isBoosterLeft && !isBoosterRight) {
    return { canMatch: false, reason: 'User not booster on either side' };
  }

  if (!isBoosterLeft || !isBoosterRight) {
    return { canMatch: false, reason: 'Active booster required on both sides for matching' };
  }

  return { canMatch: true };
}

// ✅ POINT 10: Award Reward System (13 Ranks)
export const AWARD_RANKS = [
  { rank: 1, name: 'Bronze', requiredBoosterPairs: 5, award: 'Business Kit + Certificate' },
  { rank: 2, name: 'Silver', requiredBoosterPairs: 10, award: 'Silver Gift Hamper' },
  { rank: 3, name: 'Gold', requiredBoosterPairs: 15, award: 'Gold Watch' },
  { rank: 4, name: 'Platinum', requiredBoosterPairs: 20, award: 'Platinum Ring' },
  { rank: 5, name: 'Diamond', requiredBoosterPairs: 25, award: 'Diamond Pendant' },
  { rank: 6, name: 'Ruby', requiredBoosterPairs: 30, award: 'Ruby Necklace' },
  { rank: 7, name: 'Emerald', requiredBoosterPairs: 35, award: 'Emerald Bracelet' },
  { rank: 8, name: 'Sapphire', requiredBoosterPairs: 40, award: 'Sapphire Ring' },
  { rank: 9, name: 'Crown', requiredBoosterPairs: 50, award: 'Crown + BMW Car' },
  { rank: 10, name: 'Maharaja', requiredBoosterPairs: 75, award: 'Maharaja Status + House' },
  { rank: 11, name: 'Emperor', requiredBoosterPairs: 100, award: 'Emperor Status + Property' },
  { rank: 12, name: 'King', requiredBoosterPairs: 150, award: 'King Status + Business Support' },
  { rank: 13, name: 'Legend', requiredBoosterPairs: 200, award: 'Legend Status + Lifetime Income' },
] as const;

export function checkAwardQualification(totalBoosterPairs: number): {
  currentRank?: typeof AWARD_RANKS[number];
  nextRank?: typeof AWARD_RANKS[number];
  pairsNeededForNext: number;
} {
  const currentRank = [...AWARD_RANKS].reverse().find(r => totalBoosterPairs >= r.requiredBoosterPairs);
  const nextRank = AWARD_RANKS.find(r => totalBoosterPairs < r.requiredBoosterPairs);
  const pairsNeededForNext = nextRank ? nextRank.requiredBoosterPairs - totalBoosterPairs : 0;

  return { currentRank, nextRank, pairsNeededForNext };
}

// ✅ POINT 2: Entry Product Info
export const ENTRY_PRODUCT_CONFIG = {
  PB_VALUE: 80,               // 80 PB product
  MRP: 1299,                  // ₹1,299 MRP
  PURCHASE_REQUIRED_FOR_ENTRY: true,  // Must buy to join
} as const;

// ✅ Repurchase Income (Coming Soon)
export const REPURCHASE_CONFIG = {
  STATUS: 'COMING_SOON',
  PERCENTAGE: 0, // Will be defined when implemented
} as const;
