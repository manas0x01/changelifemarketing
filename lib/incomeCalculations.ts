export type AwardRank = {
  rank: number;
  name: string;
  leftRequired: number;
  rightRequired: number;
  requiredBoosterPairs: number; // left + right
  award: string;
  awardValue?: number;
};

export const AWARD_RANKS: AwardRank[] = [
  { rank: 1, name: 'Gold', leftRequired: 5, rightRequired: 5, requiredBoosterPairs: 10, award: 'Bag + Business Kit', awardValue: 0 },
  { rank: 2, name: 'Super Gold', leftRequired: 10, rightRequired: 10, requiredBoosterPairs: 20, award: 'Smart Watch', awardValue: 0 },
  { rank: 3, name: 'Gold Star', leftRequired: 25, rightRequired: 25, requiredBoosterPairs: 50, award: 'Suit Length', awardValue: 0 },
  { rank: 4, name: 'Pearl ex', leftRequired: 50, rightRequired: 50, requiredBoosterPairs: 100, award: 'Mixi-Grinder', awardValue: 0 },
  { rank: 5, name: 'Emerald', leftRequired: 100, rightRequired: 100, requiredBoosterPairs: 200, award: 'Fridge (Refrigerator)', awardValue: 0 },
  { rank: 6, name: 'Ruby', leftRequired: 200, rightRequired: 200, requiredBoosterPairs: 400, award: 'Mobile', awardValue: 0 },
  { rank: 7, name: 'Platinum', leftRequired: 500, rightRequired: 500, requiredBoosterPairs: 1000, award: 'Laptop', awardValue: 0 },
  { rank: 8, name: 'Diamond', leftRequired: 1000, rightRequired: 1000, requiredBoosterPairs: 2000, award: 'Bike', awardValue: 0 },
  { rank: 9, name: 'Double Diamond', leftRequired: 2000, rightRequired: 2000, requiredBoosterPairs: 4000, award: '1.5 Lakh Gift', awardValue: 150000 },
  { rank: 10, name: 'Black Diamond', leftRequired: 4000, rightRequired: 4000, requiredBoosterPairs: 8000, award: '2.5 Lakh Gift', awardValue: 250000 },
  { rank: 11, name: 'Blue Diamond', leftRequired: 8000, rightRequired: 8000, requiredBoosterPairs: 16000, award: '5 Lakh ₹', awardValue: 500000 },
  { rank: 12, name: 'Royal Diamond', leftRequired: 16000, rightRequired: 16000, requiredBoosterPairs: 32000, award: '7.5 Lakh ₹', awardValue: 750000 },
  { rank: 13, name: 'Crown Diamond', leftRequired: 32000, rightRequired: 32000, requiredBoosterPairs: 64000, award: '10 Lakh ₹', awardValue: 1000000 },
];

export function checkAwardQualification(totalBoosterPairs: number) {
  // Find highest achieved rank (where requiredBoosterPairs <= totalBoosterPairs)
  let currentRank = null as AwardRank | null;
  for (let i = AWARD_RANKS.length - 1; i >= 0; i--) {
    const r = AWARD_RANKS[i];
    if (totalBoosterPairs >= r.requiredBoosterPairs) {
      currentRank = r;
      break;
    }
  }

  // Next rank is the immediate next after currentRank (or first rank if none achieved)
  let nextRank: AwardRank | null = null;
  if (!currentRank) {
    nextRank = AWARD_RANKS[0];
  } else {
    const idx = AWARD_RANKS.findIndex((x) => x.rank === currentRank!.rank);
    if (idx >= 0 && idx < AWARD_RANKS.length - 1) nextRank = AWARD_RANKS[idx + 1];
  }

  const pairsNeededForNext = nextRank ? Math.max(0, nextRank.requiredBoosterPairs - totalBoosterPairs) : 0;

  return {
    currentRank: currentRank ? { rank: currentRank.rank, name: currentRank.name, requiredBoosterPairs: currentRank.requiredBoosterPairs, award: currentRank.award } : null,
    nextRank: nextRank ? { rank: nextRank.rank, name: nextRank.name, requiredBoosterPairs: nextRank.requiredBoosterPairs, award: nextRank.award } : null,
    pairsNeededForNext,
  };
}

/* ------------------------- BASIC INCOME HELPERS ------------------------- */
export const BASIC_INCOME_CONFIG = {
  SESSION_CAP: 1000, // ₹ per session
  DAILY_CAP: 2000, // ₹ per day
  MAX_PAIRS_PER_SESSION: 9999, // no strict limit for basic
};

export function validateBasicIncomePairMatching(leftJoin: Date, rightJoin: Date) {
  // Both must be in same 12-hour session (0-11 morning, 12-23 evening)
  const leftHour = leftJoin.getHours();
  const rightHour = rightJoin.getHours();
  const leftSession = leftHour < 12 ? 'morning' : 'evening';
  const rightSession = rightHour < 12 ? 'morning' : 'evening';
  if (leftSession === rightSession) return { isValid: true, reason: 'Both members in same session' };
  return { isValid: false, reason: `Left in ${leftSession}, Right in ${rightSession}` };
}

export function calculateBasicIncome(pairs: number, _sessionType: 'morning' | 'evening') {
  const perPair = 1000; // value per pair (₹)
  const gross = pairs * perPair;
  const net = Math.min(gross, BASIC_INCOME_CONFIG.SESSION_CAP);
  return net;
}

/* ------------------------- BOOSTER HELPERS ------------------------- */
export const BOOSTER_CONFIG = {
  QUALIFICATION_THRESHOLD: 10, // pairs required to qualify as booster
  CUTTING_POSITIONS: [2, 3, 4], // example positions used for cutting logic
  CUTS_TOTAL: 10,
};

export function checkBoosterQualification(totalPairs: number) {
  const pairsNeeded = Math.max(0, BOOSTER_CONFIG.QUALIFICATION_THRESHOLD - totalPairs);
  const isQualified = pairsNeeded === 0;
  const pairsCut = Math.max(0, totalPairs - BOOSTER_CONFIG.QUALIFICATION_THRESHOLD);
  const effectivePairs = Math.min(totalPairs, BOOSTER_CONFIG.QUALIFICATION_THRESHOLD);
  return { isQualified, pairsNeeded, pairsCut, effectivePairs };
}

export const BOOSTER_MATCHING_CONFIG = {
  DAILY_CAP: 20000,
  SESSION_CAP: 10000,
  MAX_PAIRS_PER_SESSION: 10,
  CARRY_FORWARD_MAX: 10,
  PAIR_VALUE: 1000,
};

export function calculateBoosterMatchingIncome(newPairsThisSession: number, previousCarryForward: number) {
  const cfg = BOOSTER_MATCHING_CONFIG;
  const availablePairs = (previousCarryForward || 0) + (newPairsThisSession || 0);
  const pairsUsed = Math.min(availablePairs, cfg.MAX_PAIRS_PER_SESSION);
  const pairsCarried = Math.max(0, availablePairs - pairsUsed);
  const grossIncome = pairsUsed * cfg.PAIR_VALUE;
  const sessionCapped = grossIncome > cfg.SESSION_CAP;
  const netIncome = Math.min(grossIncome, cfg.SESSION_CAP);
  const pairsFleshout = Math.max(0, pairsCarried - cfg.CARRY_FORWARD_MAX);
  return {
    availablePairs,
    pairsUsed,
    pairsCarried,
    grossIncome,
    netIncome,
    sessionCapped,
    pairsFleshout,
    pairsFleshoutReason: pairsFleshout > 0 ? 'Exceeded carry-forward capacity' : null,
  } as any;
}

export default {
  AWARD_RANKS,
  checkAwardQualification,
  BASIC_INCOME_CONFIG,
  validateBasicIncomePairMatching,
  calculateBasicIncome,
  BOOSTER_CONFIG,
  checkBoosterQualification,
  BOOSTER_MATCHING_CONFIG,
  calculateBoosterMatchingIncome,
};
