
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
  console.log('🔍 [checkBoosterQualification] Starting - Total Pairs:', totalPairsCompleted);
  const cutsApplied: number[] = [];
  let pairsWithCuts = 0;
  for (let i = 1; i <= totalPairsCompleted; i++) {
    console.log(`  ➜ Processing pair ${i}`);
    if (i === 3 || i === 6 || i === 9 || i === 12) {
      console.log(`    ✂️  Pair ${i} - CUT APPLIED`);
      cutsApplied.push(i);
    } else {
      console.log(`    ✓ Pair ${i} - COUNTED`);
      pairsWithCuts++;
    }
  }
  const isQualified = totalPairsCompleted >= 12;
  console.log('📊 [checkBoosterQualification] Pairs with cuts:', pairsWithCuts, '| Cuts applied on:', cutsApplied, '| Qualified:', isQualified);

  const result = {
    totalPairsCompleted,
    pairsWithCuts,
    isQualified,
    cutsApplied,
    remainingPairsNeeded: Math.max(0, 12 - totalPairsCompleted),
  };
  console.log('✅ [checkBoosterQualification] Result:', result);
  return result;
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
  console.log('💰 [calculateBoosterIncomeForSession] Starting - Session:', sessionType, '| Pairs:', pairsCompleted, '| Carry Forward:', previousCarryForward);
  // Total available pairs = current session + carry forward
  const availablePairs = pairsCompleted + previousCarryForward;
  console.log('  📈 Total Available Pairs:', availablePairs);

  // Cap at 10 pairs per session
  const pairsMatchedThisSession = Math.min(
    availablePairs,
    CAPS.BOOSTER_PAIRS_SESSION
  );
  console.log('  🎯 Pairs Matched This Session:', pairsMatchedThisSession, '(Cap: ' + CAPS.BOOSTER_PAIRS_SESSION + ')');

  // Income calculation
  const grossIncome = pairsMatchedThisSession * BINARY_PAIR_GV;
  console.log('  💵 Gross Income Calculation:', pairsMatchedThisSession, '×', BINARY_PAIR_GV, '=', grossIncome);
  
  const cappedGrossIncome = Math.min(
    grossIncome,
    CAPS.BOOSTER_SESSION
  );
  console.log('  🔒 Capping Applied (if needed) - Cap Limit:', CAPS.BOOSTER_SESSION, '| Final Income:', cappedGrossIncome);
  
  const netIncome = cappedGrossIncome; // Already deducted in matching
  console.log('  ✓ Net Income (after deductions):', netIncome);

  // Calculate carry forward and flesh out
  const totalFleshOut =
    availablePairs - pairsMatchedThisSession;
  console.log('  📤 Total Flesh Out:', availablePairs, '-', pairsMatchedThisSession, '=', totalFleshOut);
  
  const carryForwardPairs = Math.min(
    totalFleshOut,
    CAPS.BOOSTER_CARRY_FORWARD_MAX
  );
  console.log('  🔄 Carry Forward Pairs:', carryForwardPairs, '(Max allowed:', CAPS.BOOSTER_CARRY_FORWARD_MAX + ')');
  
  const fleshedOutPairs = totalFleshOut - carryForwardPairs;
  console.log('  ❌ Fleshed Out (Lost) Pairs:', fleshedOutPairs);

  const result = {
    sessionType,
    pairsMatched: pairsMatchedThisSession,
    grossIncome: cappedGrossIncome,
    netIncome: netIncome,
    carryForwardPairs,
    fleshedOutPairs,
    cappingApplied: grossIncome > CAPS.BOOSTER_SESSION,
  };
  console.log('✅ [calculateBoosterIncomeForSession] Result:', result);
  return result;
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
  console.log('🏆 [calculateRankProgression] Starting - Rank Level:', currentRankLevel, '| Left:', leftBoostersCount, '| Right:', rightBoostersCount);
  
  const rankConfig = RANK_CONFIG[Math.min(currentRankLevel - 1, 12)];
  const nextRankConfig = RANK_CONFIG[Math.min(currentRankLevel, 12)];
  console.log('  📋 Current Rank Config:', rankConfig.name, '- Left Required:', rankConfig.leftBooters, '| Right Required:', rankConfig.rightBoosters);

  const isQualified =
    leftBoostersCount >= rankConfig.leftBooters &&
    rightBoostersCount >= rankConfig.rightBoosters;
  console.log('  ✓ Qualified for Current Rank:', isQualified);

  const progressPercentageLeft = Math.min(
    100,
    (leftBoostersCount / rankConfig.leftBooters) * 100
  );
  console.log('  📊 Left Progress:', progressPercentageLeft + '%');
  
  const progressPercentageRight = Math.min(
    100,
    (rightBoostersCount / rankConfig.rightBoosters) * 100
  );
  console.log('  📊 Right Progress:', progressPercentageRight + '%');

  const result = {
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
  console.log('✅ [calculateRankProgression] Result:', result);
  return result;
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
  console.log('💳 [calculateDeductions] Starting - Gross Amount:', grossAmount);
  const result = {
    grossAmount,
    tds: 0,
    serviceCharge: 0,
    totalDeducted: 0,
    netAmount: grossAmount, // No deductions - net equals gross
    deductionPercentage: 0,
  };
  console.log('✅ [calculateDeductions] Result:', result);
  return result;
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
  console.log('🔐 [validateIncomeTransaction] Starting - Type:', incomeType, '| Amount:', amount);
  console.log('  📊 Daily Used:', dailyUsed, '| Daily Cap:', dailyCap, '| Total if added:', dailyUsed + amount);
  console.log('  🎯 Pairs in Session:', pairsInSession, '| Max allowed:', maxPairsPerSession);
  
  const warnings: string[] = [];
  const errors: string[] = [];

  // Check caps
  if (dailyUsed + amount > dailyCap) {
    console.log('  ❌ ERROR: Daily cap exceeded!');
    errors.push(`Daily cap of ₹${dailyCap} exceeded`);
  }

  if (pairsInSession > maxPairsPerSession) {
    console.log('  ❌ ERROR: Session pair limit exceeded!');
    errors.push(`Session pair limit of ${maxPairsPerSession} exceeded`);
  }

  // Warnings
  if (dailyUsed + amount > dailyCap * 0.8) {
    console.log('  ⚠️ WARNING: Approaching daily limit!');
    warnings.push('Approaching daily limit');
  }

  const result = {
    isValid: errors.length === 0,
    warnings,
    errors,
    recommendation:
      errors.length === 0
        ? 'Transaction valid - proceed'
        : `Transaction invalid: ${errors.join(', ')}`,
  };
  console.log('✅ [validateIncomeTransaction] Result - Valid:', result.isValid, '| Errors:', errors.length, '| Warnings:', warnings.length);
  return result;
}
