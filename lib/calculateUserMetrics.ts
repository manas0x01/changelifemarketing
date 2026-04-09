import User from '@/models/User';
import mongoose from 'mongoose';

/**
 * Calculate and update all user metrics (team, income, etc.)
 * This function recursively counts downline and calculates income
 */
export async function calculateAndUpdateUserMetrics(userId: string | mongoose.Types.ObjectId) {
  try {
    const user = await User.findById(userId);
    if (!user) return null;

    // ── CALCULATE TOTAL TEAM (Left & Right) ──
    const leftDownline = await countDownlineMembers(user._id, 'left');
    const rightDownline = await countDownlineMembers(user._id, 'right');

    // ── CALCULATE DIRECT MEMBERS ──
    const directMembers = await User.find({
      $or: [
        { sponsorId: user.username },
        { sponsorId: user.userId }
      ]
    }).lean();

    let totalDirectAmount = 0;
    let leftDirectCount = 0;
    let rightDirectCount = 0;

    for (const member of directMembers) {
      // Assuming each direct member contributes some amount (e.g., registration bonus)
      // You can adjust this based on your business logic
      totalDirectAmount += 1000; // 1000 per direct member (example)
      
      if (member.placementPosition === 'left') {
        leftDirectCount++;
      } else if (member.placementPosition === 'right') {
        rightDirectCount++;
      }
    }

    // ── CALCULATE BASIC INCOME (from pairs) ──
    const pairs = Math.min(leftDownline, rightDownline);
    const basicIncome = pairs * 100; // 100 per pair (adjust as needed)

    // ── CALCULATE BOOSTER INCOME ──
    let boosterIncomeAmount = 0;
    let boosterLG = 0;
    let boosterRG = 0;
    
    // Example: Booster income from matching
    if (leftDownline >= 2 && rightDownline >= 2) {
      boosterLG = Math.floor(leftDownline / 2) * 50;
      boosterRG = Math.floor(rightDownline / 2) * 50;
      boosterIncomeAmount = boosterLG + boosterRG;
    }

    // ── UPDATE USER DOCUMENT ──
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        totalTeam: {
          left: leftDownline,
          right: rightDownline
        },
        totalDirect: {
          left: leftDirectCount,
          right: rightDirectCount
        },
        totalDirectAmount: totalDirectAmount,
        basicIncome: basicIncome,
        boosterIncomeAmount: boosterIncomeAmount,
        boosterIncome: {
          LG: boosterLG,
          RG: boosterRG,
          totalBoosterMatching: boosterIncomeAmount
        },
        // Total income = basic income + booster income
        totalIncome: basicIncome + boosterIncomeAmount
      },
      { new: true }
    );

    // ── RECURSIVELY UPDATE SPONSOR'S METRICS ──
    if (user.sponsorId) {
      const sponsor = await User.findOne({
        $or: [
          { username: user.sponsorId },
          { userId: user.sponsorId }
        ]
      }).lean();

      if (sponsor) {
        await calculateAndUpdateUserMetrics(sponsor._id);
      }
    }

    return updatedUser;
  } catch (error) {
    console.error('Error calculating user metrics:', error);
    return null;
  }
}

/**
 * Count downline members on a specific side (left or right)
 */
async function countDownlineMembers(userId: string | mongoose.Types.ObjectId, position: 'left' | 'right'): Promise<number> {
  try {
    let count = 0;
    const queue = [userId];
    const visited = new Set<string>();

    while (queue.length > 0) {
      const currentId = queue.shift();
      if (!currentId) continue;
      
      const currentIdStr = currentId.toString();
      if (visited.has(currentIdStr)) continue;
      visited.add(currentIdStr);

      // Find direct children on the specified side
      const children = await User.find({
        placementId: currentIdStr,
        placementPosition: position
      }).lean();

      count += children.length;

      // Add children to queue for recursive counting
      children.forEach(child => {
        queue.push(child._id);
      });
    }

    return count;
  } catch (error) {
    console.error('Error counting downline members:', error);
    return 0;
  }
}

/**
 * Recalculate metrics for all users in the system
 * Use this for data cleanup or maintenance
 */
export async function recalculateAllUserMetrics() {
  try {
    const users = await User.find({}).lean();
    
    for (const user of users) {
      await calculateAndUpdateUserMetrics(user._id);
    }

    return { success: true, processedUsers: users.length };
  } catch (error) {
    console.error('Error recalculating all user metrics:', error);
    return { success: false, error };
  }
}
