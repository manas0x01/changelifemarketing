import User from '@/models/User';
import mongoose from 'mongoose';

export async function calculateAndUpdateUserMetrics(userId: string | mongoose.Types.ObjectId,
  depth: number = 0) {
  try {
    const user = await User.findById(userId);
    
    if (!user) {
      return null;
    }
    const leftDownline = await countDownlineMembers(user._id, 'left');
    const rightDownline = await countDownlineMembers(user._id, 'right');
    const directMembers = await User.find({
      $or: [
        { sponsorId: user.username },
        { sponsorId: user.userId }
      ]
    }).lean();

    let boosterIncomeAmount = 0;
    let boosterLG = 0;
    let boosterRG = 0;
    if (leftDownline >= 2 && rightDownline >= 2) {
      boosterLG = Math.floor(leftDownline / 2) * 50;     
      boosterRG = Math.floor(rightDownline / 2) * 50;
      boosterIncomeAmount = boosterLG + boosterRG;
    }

    const basicIncome = user.basicIncome || 0;
    const updatePayload = {
  boosterIncomeAmount: boosterIncomeAmount,
  boosterIncome: {
    LG: boosterLG,
    RG: boosterRG,
    totalBoosterMatching: boosterIncomeAmount
  },
  totalIncome: basicIncome + boosterIncomeAmount
};

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updatePayload,
      { returnDocument: "after" }
    );
    
    console.log(`  ✅ Database update successful - verified totalIncome: ₹${updatedUser?.totalIncome}`);

    console.log('\n🔄 [calculateAndUpdateUserMetrics] Checking for sponsor update...');
    if (user.sponsorId) {
      console.log(`  👤 Sponsor ID found: ${user.sponsorId}`);
      const sponsor = await User.findOne({
        $or: [
          { username: user.sponsorId },
          { userId: user.sponsorId }
        ]
      }).lean();
      if (depth > 3) {
    console.log("⛔ Max recursion depth reached");
    return;
  }
      if (sponsor) {
        console.log(`  ✅ Sponsor found (${sponsor.username}) - recursively updating metrics...`);
        await calculateAndUpdateUserMetrics(sponsor._id, depth + 1);
        console.log(`  ✅ Sponsor metrics updated`);
      } else {
        console.log(`  ⚠️ Sponsor not found in database`);
      }
    } else {
      console.log(`  ℹ️ No sponsor ID - this is a root/top member`);
    }
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
