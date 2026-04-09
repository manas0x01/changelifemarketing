/**
 * Auto-calculate and update user metrics
 * Called when:
 * - User registers (new member added)
 * - Member is added to direct/sponsor team
 * - Income is credited
 * 
 * Calculates:
 * - basicIncome (from sessionBasedIncome records)
 * - boosterIncomeAmount (from boosterMatchingRecords)
 * - awardIncome (from award records)
 * - totalIncome (sum of all 4 income types)
 */

import User from '@/models/User';

export async function calculateAndUpdateUserMetrics(userId: any) {
  try {
    const user = await User.findById(userId);
    if (!user) {
      console.warn(`User not found: ${userId}`);
      return;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 1️⃣ BASIC INCOME - From sessionBasedIncome records
    // ═══════════════════════════════════════════════════════════════════════
    const basicIncome = (user.sessionBasedIncome || [])
      .reduce((sum: number, session: any) => sum + (session.netIncome || 0), 0);

    // ═══════════════════════════════════════════════════════════════════════
    // 2️⃣ BOOSTER INCOME - From boosterMatchingRecords
    // ═══════════════════════════════════════════════════════════════════════
    const boosterIncomeAmount = (user.boosterMatchingRecords || [])
      .reduce((sum: number, record: any) => sum + (record.netIncome || 0), 0);

    // ═══════════════════════════════════════════════════════════════════════
    // 3️⃣ AWARD INCOME - From awardIncomeRecords
    // ═══════════════════════════════════════════════════════════════════════
    const awardIncome = (user.awardIncomeRecords || [])
      .reduce((sum: number, record: any) => sum + (record.amount || 0), 0);

    // ═══════════════════════════════════════════════════════════════════════
    // 4️⃣ REPURCHASE INCOME - From repurchaseIncomeRecords
    // ═══════════════════════════════════════════════════════════════════════
    const repurchaseIncome = (user.repurchaseIncomeRecords || [])
      .reduce((sum: number, record: any) => sum + (record.commission || 0), 0);

    // ═══════════════════════════════════════════════════════════════════════
    // TOTAL INCOME = Basic + Booster + Award + Repurchase
    // ═══════════════════════════════════════════════════════════════════════
    const totalIncome = basicIncome + boosterIncomeAmount + awardIncome + repurchaseIncome;

    // ═══════════════════════════════════════════════════════════════════════
    // TEAM COUNTS
    // ═══════════════════════════════════════════════════════════════════════
    const leftCount = (user.directMembers || []).filter((m: any) => m.position === 'left').length;
    const rightCount = (user.directMembers || []).filter((m: any) => m.position === 'right').length;

    // ═══════════════════════════════════════════════════════════════════════
    // UPDATE USER DOCUMENT
    // ═══════════════════════════════════════════════════════════════════════
    await User.findByIdAndUpdate(userId, {
      basicIncome,
      boosterIncomeAmount,
      awardIncome,
      repurchaseIncome,
      totalIncome,
      totalDirect: {
        left: leftCount,
        right: rightCount,
      },
      updatedAt: new Date(),
    }, { new: true });

    console.log(`✅ Metrics updated for ${user.username}:`, {
      basicIncome,
      boosterIncomeAmount,
      awardIncome,
      repurchaseIncome,
      totalIncome,
      directMembers: { left: leftCount, right: rightCount },
    });

  } catch (error) {
    console.error(`❌ Error calculating metrics for user ${userId}:`, error);
    // Don't throw - let the operation continue even if metrics fail
  }
}
