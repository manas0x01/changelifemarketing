
import User from '@/models/User';

export async function calculateAndUpdateUserMetrics(userId: any) {
  try {
    console.log('\n📊 [calculateAndUpdateUserMetrics] Starting metrics calculation for userId:', userId);
    
    console.log('🔍 [calculateAndUpdateUserMetrics] Fetching user from database...');
    const user = await User.findById(userId);
    
    if (!user) {
      console.warn(`❌ [calculateAndUpdateUserMetrics] User not found: ${userId}`);
      return;
    }
    
    console.log('✅ [calculateAndUpdateUserMetrics] User found:', {
      username: user.username,
      userId: user.userId,
      email: user.email,
    });

    // ═══════════════════════════════════════════════════════════════════════
    // 1️⃣ BASIC INCOME - From sessionBasedIncome records
    // ═══════════════════════════════════════════════════════════════════════
    console.log('\n1️⃣ [calculateAndUpdateUserMetrics] Calculating BASIC INCOME...');
    const sessionRecords = user.sessionBasedIncome || [];
    console.log(`  📋 Session-based income records found: ${sessionRecords.length}`);
    if (sessionRecords.length > 0) {
      console.log(`  📊 Sample records:`, sessionRecords.slice(0, 2));
    }
    
    const basicIncome = sessionRecords
      .reduce((sum: number, session: any) => {
        console.log(`    ➕ Adding session income: ₹${session.netIncome || 0}`);
        return sum + (session.netIncome || 0);
      }, 0);
    console.log(`  ✅ Total BASIC INCOME: ₹${basicIncome}`);

    // ═══════════════════════════════════════════════════════════════════════
    // 2️⃣ BOOSTER INCOME - From boosterMatchingRecords
    // ═══════════════════════════════════════════════════════════════════════
    console.log('\n2️⃣ [calculateAndUpdateUserMetrics] Calculating BOOSTER INCOME...');
    const boosterRecords = user.boosterMatchingRecords || [];
    console.log(`  📋 Booster matching records found: ${boosterRecords.length}`);
    if (boosterRecords.length > 0) {
      console.log(`  📊 Sample records:`, boosterRecords.slice(0, 2));
    }
    
    const boosterIncomeAmount = boosterRecords
      .reduce((sum: number, record: any) => {
        console.log(`    ➕ Adding booster income: ₹${record.netIncome || 0}`);
        return sum + (record.netIncome || 0);
      }, 0);
    console.log(`  ✅ Total BOOSTER INCOME: ₹${boosterIncomeAmount}`);

    // ═══════════════════════════════════════════════════════════════════════
    // 3️⃣ AWARD INCOME - From awardIncomeRecords
    // ═══════════════════════════════════════════════════════════════════════
    console.log('\n3️⃣ [calculateAndUpdateUserMetrics] Calculating AWARD INCOME...');
    const awardRecords = user.awardIncomeRecords || [];
    console.log(`  📋 Award income records found: ${awardRecords.length}`);
    if (awardRecords.length > 0) {
      console.log(`  📊 Sample records:`, awardRecords.slice(0, 2));
    }
    
    const awardIncome = awardRecords
      .reduce((sum: number, record: any) => {
        console.log(`    ➕ Adding award income: ₹${record.amount || 0}`);
        return sum + (record.amount || 0);
      }, 0);
    console.log(`  ✅ Total AWARD INCOME: ₹${awardIncome}`);

    // ═══════════════════════════════════════════════════════════════════════
    // 4️⃣ REPURCHASE INCOME - From repurchaseIncomeRecords
    // ═══════════════════════════════════════════════════════════════════════
    console.log('\n4️⃣ [calculateAndUpdateUserMetrics] Calculating REPURCHASE INCOME...');
    const repurchaseRecords = user.repurchaseIncomeRecords || [];
    console.log(`  📋 Repurchase income records found: ${repurchaseRecords.length}`);
    if (repurchaseRecords.length > 0) {
      console.log(`  📊 Sample records:`, repurchaseRecords.slice(0, 2));
    }
    
    const repurchaseIncome = repurchaseRecords
      .reduce((sum: number, record: any) => {
        console.log(`    ➕ Adding repurchase commission: ₹${record.commission || 0}`);
        return sum + (record.commission || 0);
      }, 0);
    console.log(`  ✅ Total REPURCHASE INCOME: ₹${repurchaseIncome}`);

    // ═══════════════════════════════════════════════════════════════════════
    // TOTAL INCOME = Basic + Booster + Award + Repurchase
    // ═══════════════════════════════════════════════════════════════════════
    console.log('\n📈 [calculateAndUpdateUserMetrics] Calculating TOTAL INCOME...');
    console.log(`  🔢 Basic Income: ₹${basicIncome}`);
    console.log(`  🔢 Booster Income: ₹${boosterIncomeAmount}`);
    console.log(`  🔢 Award Income: ₹${awardIncome}`);
    console.log(`  🔢 Repurchase Income: ₹${repurchaseIncome}`);
    
    const totalIncome = basicIncome + boosterIncomeAmount + awardIncome + repurchaseIncome;
    console.log(`  ✅ TOTAL INCOME = ₹${basicIncome} + ₹${boosterIncomeAmount} + ₹${awardIncome} + ₹${repurchaseIncome} = ₹${totalIncome}`);

    // ═══════════════════════════════════════════════════════════════════════
    // TEAM COUNTS
    // ═══════════════════════════════════════════════════════════════════════
    console.log('\n👥 [calculateAndUpdateUserMetrics] Calculating TEAM COUNTS...');
    const directMembers = user.directMembers || [];
    console.log(`  📋 Total direct members: ${directMembers.length}`);
    
    const leftCount = directMembers.filter((m: any) => m.position === 'left').length;
    console.log(`  👈 Left side members: ${leftCount}`);
    
    const rightCount = directMembers.filter((m: any) => m.position === 'right').length;
    console.log(`  👉 Right side members: ${rightCount}`);
    
    console.log(`  ✅ Team structure: Left(${leftCount}) | Right(${rightCount})`);

    // ═══════════════════════════════════════════════════════════════════════
    // UPDATE USER DOCUMENT
    // ═══════════════════════════════════════════════════════════════════════
    console.log('\n💾 [calculateAndUpdateUserMetrics] Updating user document in database...');
    console.log(`  📝 Preparing update payload:`, {
      basicIncome,
      boosterIncomeAmount,
      awardIncome,
      repurchaseIncome,
      totalIncome,
      updatedAt: new Date().toISOString(),
    });
    
    const updateResult = await User.findByIdAndUpdate(userId, {
      basicIncome,
      boosterIncomeAmount,
      awardIncome,
      repurchaseIncome,
      totalIncome,
      updatedAt: new Date(),
    }, { new: true });
    
    console.log(`  ✅ Database update successful - Verified totalIncome: ₹${updateResult?.totalIncome}`);

    console.log(`\n🎉 [calculateAndUpdateUserMetrics] ✅ METRICS CALCULATION COMPLETE for ${user.username}:`, {
      basicIncome: `₹${basicIncome}`,
      boosterIncomeAmount: `₹${boosterIncomeAmount}`,
      awardIncome: `₹${awardIncome}`,
      repurchaseIncome: `₹${repurchaseIncome}`,
      totalIncome: `₹${totalIncome}`,
      directMembers: { left: leftCount, right: rightCount },
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error(`\n❌ [calculateAndUpdateUserMetrics] FATAL ERROR calculating metrics for user ${userId}:`, {
      errorType: (error as Error).name,
      errorMessage: (error as Error).message,
      stack: (error as Error).stack,
      timestamp: new Date().toISOString(),
    });
    // Don't throw - let the operation continue even if metrics fail
  }
}
