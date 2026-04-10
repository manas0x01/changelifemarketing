
import {
  CAPS,
  SESSION_TYPES,
  RANK_CONFIG,
  BINARY_PAIR_GV,
} from '@/lib/sessionBalance';

export interface BoosterQualificationCheck {
  totalPairsCompleted: number;
  pairsWithCuts: number; // After removing 3,6,9,12 cuts
  isQualified: boolean;
  cutsApplied: number[]; // Which pair numbers were cut
  remainingPairsNeeded: number;
  estimatedQualificationDate?: Date;
}

export function checkBoosterQualification(
  totalPairsCompleted: number
): BoosterQualificationCheck {
  const cutsApplied: number[] = [];
  let pairsWithCuts = 0;
  for (let i = 1; i <= totalPairsCompleted; i++) {
    if (i === 3 || i === 6 || i === 9 || i === 12) {
      cutsApplied.push(i);
    } else {
      pairsWithCuts++;
    }
  }
  const isQualified = totalPairsCompleted >= 12;

  return {
    totalPairsCompleted,
    pairsWithCuts,
    isQualified,
    cutsApplied,
    remainingPairsNeeded: Math.max(0, 12 - totalPairsCompleted),
  };
}

export interface BoosterIncomeCalculation {
  sessionType: 'morning' | 'evening';
  pairsMatched: number;
  grossIncome: number;
  netIncome: number;
  carryForwardPairs: number;
  fleshedOutPairs: number;
  cappingApplied: boolean;
}

export function calculateBoosterIncomeForSession(
  pairsCompleted: number,
  previousCarryForward: number = 0,
  sessionType: 'morning' | 'evening' = 'morning'
): BoosterIncomeCalculation {
  // Total available pairs = current session + carry forward
  const availablePairs = pairsCompleted + previousCarryForward;

  // Cap at 10 pairs per session
  const pairsMatchedThisSession = Math.min(
    availablePairs,
    CAPS.BOOSTER_PAIRS_SESSION
  );

  // Income calculation
  const grossIncome = pairsMatchedThisSession * BINARY_PAIR_GV;
  const cappedGrossIncome = Math.min(
    grossIncome,
    CAPS.BOOSTER_SESSION
  );
  const netIncome = cappedGrossIncome; // Already deducted in matching

  // Calculate carry forward and flesh out
  const totalFleshOut =
    availablePairs - pairsMatchedThisSession;
  const carryForwardPairs = Math.min(
    totalFleshOut,
    CAPS.BOOSTER_CARRY_FORWARD_MAX
  );
  const fleshedOutPairs = totalFleshOut - carryForwardPairs;

  return {
    sessionType,
    pairsMatched: pairsMatchedThisSession,
    grossIncome: cappedGrossIncome,
    netIncome: netIncome,
    carryForwardPairs,
    fleshedOutPairs,
    cappingApplied: grossIncome > CAPS.BOOSTER_SESSION,
  };
}

/**
 * Rank Progression Calculator
 */
export interface RankProgressionData {
  currentRank: number;
  rankName: string;
  leftBoostersUsed: number;
  rightBoostersUsed: number;
  leftBooters: number; // Required boosters for current rank
  rightBoosters: number; // Required boosters for current rank
  leftBoostersNeeded: number;
  rightBoostersNeeded: number;
  progressPercentageLeft: number;
  progressPercentageRight: number;
  isQualifiedForCurrentRank: boolean;
  nextRankRequirements?: {
    rank: number;
    rankName: string;
    leftBoostersNeeded: number;
    rightBoostersNeeded: number;
  };
  award?: string;
  awardValue?: number;
}

export function calculateRankProgression(
  leftBoostersCount: number,
  rightBoostersCount: number,
  currentRankLevel: number = 1
): RankProgressionData {
  const rankConfig = RANK_CONFIG[Math.min(currentRankLevel - 1, 12)];
  const nextRankConfig = RANK_CONFIG[Math.min(currentRankLevel, 12)];

  const isQualified =
    leftBoostersCount >= rankConfig.leftBooters &&
    rightBoostersCount >= rankConfig.rightBoosters;

  const progressPercentageLeft = Math.min(
    100,
    (leftBoostersCount / rankConfig.leftBooters) * 100
  );
  const progressPercentageRight = Math.min(
    100,
    (rightBoostersCount / rankConfig.rightBoosters) * 100
  );

  return {
    currentRank: currentRankLevel,
    rankName: rankConfig.name,
    leftBoostersUsed: Math.min(leftBoostersCount, rankConfig.leftBooters),
    rightBoostersUsed: Math.min(rightBoostersCount, rankConfig.rightBoosters),
    leftBooters: rankConfig.leftBooters,
    rightBoosters: rankConfig.rightBoosters,
    leftBoostersNeeded: Math.max(0, rankConfig.leftBooters - leftBoostersCount),
    rightBoostersNeeded: Math.max(0, rankConfig.rightBoosters - rightBoostersCount),
    progressPercentageLeft: Math.round(progressPercentageLeft * 100) / 100,
    progressPercentageRight: Math.round(progressPercentageRight * 100) / 100,
    isQualifiedForCurrentRank: isQualified,
    nextRankRequirements:
      currentRankLevel < 13
        ? {
            rank: currentRankLevel + 1,
            rankName: nextRankConfig.name,
            leftBoostersNeeded: nextRankConfig.leftBooters,
            rightBoostersNeeded: nextRankConfig.rightBoosters,
          }
        : undefined,
    award: rankConfig.award,
  };
}

/**
 * Daily Income Summary
 */
export interface DailyIncomeSummary {
  date: string;
  incomeBreakdown: {
    basicIncome: number;
    boosterIncome: number;
    awardIncome: number;
    repurchaseIncome: number;
    totalIncome: number;
  };
  cappingStatus: {
    basicIncomeUsed: number;
    basicIncomeCap: number;
    basicIncomeRemaining: number;
    boosterIncomeUsed: number;
    boosterIncomeCap: number;
    boosterIncomeRemaining: number;
  };
  boosterStatus: {
    carryForwardPairs: number;
    totalPairsCompleted: number;
    isBooster: boolean;
  };
  rankStatus: {
    currentRank: number;
    rankName: string;
    leftProgress: number;
    rightProgress: number;
  };
}

/**
 * Format Income for Display
 */
export function formatIncomeDisplay(income: BoosterIncomeCalculation): string {
  return `
═══════════════════════════════════
🚀 BOOSTER INCOME - ${income.sessionType.toUpperCase()} SESSION
═══════════════════════════════════
Pairs Matched: ${income.pairsMatched} / ${CAPS.BOOSTER_PAIRS_SESSION}
Gross Income: ₹${income.grossIncome}
Net Income: ₹${income.netIncome}
Carry Forward: ${income.carryForwardPairs} pair(s)
Fleshed Out: ${income.fleshedOutPairs} pair(s)

${income.cappingApplied ? '⚠️ CAPPING APPLIED - Daily limit reached' : '✓ No capping applied'}
═══════════════════════════════════
`;
}

/**
 * Format Rank Progression for Display
 */
export function formatRankDisplay(rankData: RankProgressionData): string {
  return `
╔════════════════════════════════════════════════╗
║     🏆 RANK PROGRESSION - ${rankData.rankName.toUpperCase()}
╚════════════════════════════════════════════════╝

Current Level: Rank ${rankData.currentRank}
Status: ${rankData.isQualifiedForCurrentRank ? '✓ QUALIFIED' : '⏳ IN PROGRESS'}

LEFT SIDE:
├─ Boosters: ${rankData.leftBoostersUsed} / ${rankData.leftBooters}
├─ Progress: ${rankData.progressPercentageLeft}%
└─ Needed: ${rankData.leftBoostersNeeded} more

RIGHT SIDE:
├─ Boosters: ${rankData.rightBoostersUsed} / ${rankData.rightBoosters}
├─ Progress: ${rankData.progressPercentageRight}%
└─ Needed: ${rankData.rightBoostersNeeded} more

Award: ${rankData.award}

${
  rankData.nextRankRequirements
    ? `
NEXT RANK: ${rankData.nextRankRequirements.rankName} (Rank ${rankData.nextRankRequirements.rank})
├─ Left Boosters Needed: ${rankData.nextRankRequirements.leftBoostersNeeded}
└─ Right Boosters Needed: ${rankData.nextRankRequirements.rightBoostersNeeded}
`
    : '🎉 YOU HAVE REACHED LEGEND STATUS!'
}
`;
}

/**
 * Calculate Income Deductions
 * NOTE: As of current policy, NO deductions are applied
 * TDS = 0, Service Charge = 0, Net = Gross
 */
export function calculateDeductions(grossAmount: number) {
  return {
    grossAmount,
    tds: 0,
    serviceCharge: 0,
    totalDeducted: 0,
    netAmount: grossAmount, // No deductions - net equals gross
    deductionPercentage: 0,
  };
}

/**
 * Validate Income Transaction
 */
export interface IncomeValidationResult {
  isValid: boolean;
  warnings: string[];
  errors: string[];
  recommendation: string;
}

export function validateIncomeTransaction(
  incomeType: string,
  amount: number,
  dailyUsed: number,
  dailyCap: number,
  pairsInSession: number,
  maxPairsPerSession: number
): IncomeValidationResult {
  const warnings: string[] = [];
  const errors: string[] = [];

  // Check caps
  if (dailyUsed + amount > dailyCap) {
    errors.push(`Daily cap of ₹${dailyCap} exceeded`);
  }

  if (pairsInSession > maxPairsPerSession) {
    errors.push(`Session pair limit of ${maxPairsPerSession} exceeded`);
  }

  // Warnings
  if (dailyUsed + amount > dailyCap * 0.8) {
    warnings.push('Approaching daily limit');
  }

  return {
    isValid: errors.length === 0,
    warnings,
    errors,
    recommendation:
      errors.length === 0
        ? 'Transaction valid - proceed'
        : `Transaction invalid: ${errors.join(', ')}`,
  };
}
