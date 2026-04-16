import User from '@/models/User';
import mongoose from 'mongoose';

/**
 * Calculate and update all user metrics (team, income, etc.)
 * This function recursively counts downline and calculates income
 */
export async function calculateAndUpdateUserMetrics(userId: string | mongoose.Types.ObjectId) {
  try {
    console.log('\n📊 [calculateAndUpdateUserMetrics] Starting metrics calculation for userId:', userId);
    
    console.log('🔍 [calculateAndUpdateUserMetrics] Fetching user from database...');
    const user = await User.findById(userId);
    
    if (!user) {
      console.warn(`❌ [calculateAndUpdateUserMetrics] User not found: ${userId}`);
      return null;
    }
    
    console.log('✅ [calculateAndUpdateUserMetrics] User found:', {
      username: user.username,
      userId: user.userId,
      email: user.email,
      sponsorId: user.sponsorId,
    });

    // ── CALCULATE TOTAL TEAM (Left & Right) ──
    console.log('\n🌳 [calculateAndUpdateUserMetrics] Calculating total downline team...');
    const leftDownline = await countDownlineMembers(user._id, 'left');
    console.log(`  👈 Left downline members: ${leftDownline}`);
    
    const rightDownline = await countDownlineMembers(user._id, 'right');
    console.log(`  👉 Right downline members: ${rightDownline}`);
    console.log(`  ✅ Total downline: Left(${leftDownline}) + Right(${rightDownline}) = ${leftDownline + rightDownline}`);

    // ── CALCULATE DIRECT MEMBERS ──
    console.log('\n👥 [calculateAndUpdateUserMetrics] Calculating direct members...');
    const directMembers = await User.find({
      $or: [
        { sponsorId: user.username },
        { sponsorId: user.userId }
      ]
    }).lean();
    console.log(`  📋 Direct members found: ${directMembers.length}`);
    
    let leftTeamCount = 0;
    let rightTeamCount = 0;

    for (const member of directMembers) {
      console.log(`  👤 Processing member: ${member.username} - Position: ${member.placementPosition}`);
      if (member.placementPosition === 'left') {
        leftTeamCount++;
        console.log(`    ✓ Added to LEFT team`);
      } else if (member.placementPosition === 'right') {
        rightTeamCount++;
        console.log(`    ✓ Added to RIGHT team`);
      }
    }
    
    console.log(`  ✅ Direct team count: Left(${leftTeamCount}) | Right(${rightTeamCount})`);

    // ── CALCULATE BASIC INCOME (from pairs) ──
    console.log('\n💰 [calculateAndUpdateUserMetrics] Calculating BASIC INCOME...');
    const pairs = Math.min(leftDownline, rightDownline);
    console.log(`  🔢 Pairs calculation: MIN(${leftDownline}, ${rightDownline}) = ${pairs}`);
    
    const basicIncome = pairs * 100; // 100 per pair (adjust as needed)
    console.log(`  💹 Basic Income: ${pairs} × 100 = ₹${basicIncome}`);

    // ── CALCULATE BOOSTER INCOME ──
    console.log('\n🚀 [calculateAndUpdateUserMetrics] Calculating BOOSTER INCOME...');
    let boosterIncomeAmount = 0;
    let boosterLG = 0;
    let boosterRG = 0;
    
    // Example: Booster income from matching
    console.log(`  📊 Checking booster qualification: Left(${leftDownline}) ≥ 2 && Right(${rightDownline}) ≥ 2`);
    if (leftDownline >= 2 && rightDownline >= 2) {
      boosterLG = Math.floor(leftDownline / 2) * 50;
      console.log(`  👈 Left Booster: FLOOR(${leftDownline} / 2) × 50 = ₹${boosterLG}`);
      
      boosterRG = Math.floor(rightDownline / 2) * 50;
      console.log(`  👉 Right Booster: FLOOR(${rightDownline} / 2) × 50 = ₹${boosterRG}`);
      
      boosterIncomeAmount = boosterLG + boosterRG;
      console.log(`  ✅ Total Booster Income: ₹${boosterLG} + ₹${boosterRG} = ₹${boosterIncomeAmount}`);
    } else {
      console.log(`  ❌ Booster qualification not met - setting booster income to 0`);
    }

    // ── UPDATE USER DOCUMENT ──
    console.log('\n💾 [calculateAndUpdateUserMetrics] Updating user document in database...');
    const updatePayload = {
      totalTeam: {
        left: leftDownline,
        right: rightDownline
      },
      basicIncome: basicIncome,
      boosterIncomeAmount: boosterIncomeAmount,
      boosterIncome: {
        LG: boosterLG,
        RG: boosterRG,
        totalBoosterMatching: boosterIncomeAmount
      },
      // Total income = basic income + booster income
      totalIncome: basicIncome + boosterIncomeAmount
    };
    
    console.log(`  📝 Update payload:`, updatePayload);
    
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updatePayload,
      { new: true }
    );
    
    console.log(`  ✅ Database update successful - verified totalIncome: ₹${updatedUser?.totalIncome}`);

    // ── RECURSIVELY UPDATE SPONSOR'S METRICS ──
    console.log('\n🔄 [calculateAndUpdateUserMetrics] Checking for sponsor update...');
    if (user.sponsorId) {
      console.log(`  👤 Sponsor ID found: ${user.sponsorId}`);
      const sponsor = await User.findOne({
        $or: [
          { username: user.sponsorId },
          { userId: user.sponsorId }
        ]
      }).lean();

      if (sponsor) {
        console.log(`  ✅ Sponsor found (${sponsor.username}) - recursively updating metrics...`);
        await calculateAndUpdateUserMetrics(sponsor._id);
        console.log(`  ✅ Sponsor metrics updated`);
      } else {
        console.log(`  ⚠️ Sponsor not found in database`);
      }
    } else {
      console.log(`  ℹ️ No sponsor ID - this is a root/top member`);
    }
    
    console.log(`\n🎉 [calculateAndUpdateUserMetrics] ✅ COMPLETE for ${user.username}:`, {
      basicIncome: `₹${basicIncome}`,
      boosterIncome: `₹${boosterIncomeAmount}`,
      totalIncome: `₹${basicIncome + boosterIncomeAmount}`,
      downline: { left: leftDownline, right: rightDownline },
      timestamp: new Date().toISOString(),
    });

    return updatedUser;
  } catch (error) {
    console.error(`\n❌ [calculateAndUpdateUserMetrics] FATAL ERROR for userId ${userId}:`, {
      errorType: (error as Error).name,
      errorMessage: (error as Error).message,
      stack: (error as Error).stack,
      timestamp: new Date().toISOString(),
    });
    return null;
  }
}

/**
 * Count downline members on a specific side (left or right)
 */
async function countDownlineMembers(userId: string | mongoose.Types.ObjectId, position: 'left' | 'right'): Promise<number> {
  try {
    console.log(`\n🔍 [countDownlineMembers] Starting ${position} downline count for userId: ${userId}`);
    let count = 0;
    const queue = [userId];
    const visited = new Set<string>();
    let iterations = 0;

    while (queue.length > 0) {
      iterations++;
      const currentId = queue.shift();
      if (!currentId) continue;
      
      const currentIdStr = currentId.toString();
      if (visited.has(currentIdStr)) {
        console.log(`  ⏭️ Iteration ${iterations}: Already visited - skipping`);
        continue;
      }
      visited.add(currentIdStr);

      // Find direct children on the specified side
      console.log(`  🔍 Iteration ${iterations}: Searching children for ID ${currentIdStr}...`);
      const children = await User.find({
        placementId: currentIdStr,
        placementPosition: position
      }).lean();

      console.log(`    ✓ Found ${children.length} ${position} child(ren)`);
      count += children.length;

      // Add children to queue for recursive counting
      children.forEach(child => {
        console.log(`      → Adding child ${child.username} to queue`);
        queue.push(child._id);
      });
    }

    console.log(`  ✅ [countDownlineMembers] Total ${position} downline: ${count} (processed ${iterations} iterations)`);
    return count;
  } catch (error) {
    console.error(`  ❌ [countDownlineMembers] Error counting ${position} downline:`, {
      errorType: (error as Error).name,
      errorMessage: (error as Error).message,
      userId: userId,
      position: position,
    });
    return 0;
  }
}

/**
 * Recalculate metrics for all users in the system
 * Use this for data cleanup or maintenance
 */
export async function recalculateAllUserMetrics() {
  try {
    console.log('\n📊 [recalculateAllUserMetrics] Starting batch recalculation for ALL users...');
    
    const users = await User.find({}).lean();
    console.log(`  📋 Total users in system: ${users.length}`);
    console.log(`  ⏱️ Starting time: ${new Date().toISOString()}`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let index = 0; index < users.length; index++) {
      const user = users[index];
      console.log(`\n  ⏳ Processing user ${index + 1}/${users.length}: ${user.username}`);
      try {
        await calculateAndUpdateUserMetrics(user._id);
        successCount++;
        console.log(`    ✅ Successfully processed`);
      } catch (err) {
        errorCount++;
        console.error(`    ❌ Failed to process:`, (err as Error).message);
      }
    }

    console.log(`\n🎉 [recalculateAllUserMetrics] BATCH COMPLETE:`, {
      totalUsers: users.length,
      successCount,
      errorCount,
      duration: new Date().toISOString(),
    });

    return { success: true, processedUsers: users.length, successCount, errorCount };
  } catch (error) {
    console.error(`\n❌ [recalculateAllUserMetrics] FATAL ERROR:`, {
      errorType: (error as Error).name,
      errorMessage: (error as Error).message,
      stack: (error as Error).stack,
      timestamp: new Date().toISOString(),
    });
    return { success: false, error };
  }
}
