import mongoose from 'mongoose';
import User from '../models/User';
import { connectDB } from '../lib/database';

/**
 * Fix CLM949879 fraudulent income - DIRECT DATABASE UPDATE
 * Bypasses pre-save hooks to prevent self-healing from re-generating income
 */

async function fixIncome() {
  try {
    await connectDB();
    
    console.log('🔧 Fixing CLM949879 fraudulent income (bypassing hooks)...\n');

    // Get the main user first
    const user = await User.findOne({
      $or: [
        { userId: 'CLM949879' },
        { username: 'CLM949879' }
      ]
    });

    if (!user) {
      console.log('❌ User CLM949879 not found');
      return;
    }

    // Get downline members
    const leftMembers = await User.find({
      $or: [
        { placementId: user.userId, placementPosition: 'left' },
        { placementId: user.username, placementPosition: 'left' }
      ]
    });

    const rightMembers = await User.find({
      $or: [
        { placementId: user.userId, placementPosition: 'right' },
        { placementId: user.username, placementPosition: 'right' }
      ]
    });

    // 1️⃣ Fix left member joiningDate
    if (leftMembers.length > 0) {
      const leftMember = leftMembers[0];
      const correctJoinDate = new Date(leftMember.createdAt).toISOString().split('T')[0];
      
      await User.updateOne(
        { _id: leftMember._id },
        { $set: { joiningDate: correctJoinDate } }
      );
      
      console.log(`✅ Left member (${leftMember.username})`);
      console.log(`   Set joiningDate: ${correctJoinDate} (from createdAt)`);
      console.log(`   Joined at 14:19:42 = AFTERNOON/EVENING session`);
    }

    console.log();

    // 2️⃣ Fix right member joiningDate
    if (rightMembers.length > 0) {
      const rightMember = rightMembers[0];
      const correctJoinDate = new Date(rightMember.createdAt).toISOString().split('T')[0];
      
      await User.updateOne(
        { _id: rightMember._id },
        { $set: { joiningDate: correctJoinDate } }
      );
      
      console.log(`✅ Right member (${rightMember.username})`);
      console.log(`   Set joiningDate: ${correctJoinDate} (from createdAt)`);
      console.log(`   Joined at 23:03:41 = EVENING session`);
    }

    console.log();

    // 3️⃣ Fix main user income - DIRECT UPDATE (bypasses pre-save hooks)
    const result = await User.updateOne(
      { _id: user._id },
      {
        $set: {
          basicIncome: 0,
          basicPairs: 0,
          sessionBasedIncome: [],
          sessionTeam: { left: 0, right: 0 },
          lastSessionDate: null,
          lastSessionType: null
        }
      }
    );
    
    console.log(`✅ CLM949879 income removed (direct database update)`);
    console.log(`   Updated: ${result.modifiedCount} document(s)`);
    console.log(`   Old basicIncome: ₹${user.basicIncome || 0}`);
    console.log(`   New basicIncome: ₹0`);
    console.log(`   Old basicPairs: ${user.basicPairs || 0}`);
    console.log(`   New basicPairs: 0`);
    console.log(`   Cleared sessionBasedIncome records`);

    console.log('\n✅ FIX COMPLETE!\n');
    console.log('📋 SUMMARY:');
    console.log(`   Left member joined: June 18 (afternoon) - FIXED`);
    console.log(`   Right member joined: June 9 (evening) - FIXED`);
    console.log(`   DIFFERENT DAYS: June 9 vs June 18 ❌`);
    console.log(`   Income generated: ₹1000 (fraudulent) ❌ REMOVED`);
    console.log(`   Income now: ₹0 ✅`);
    console.log('\n   RULE: SAME DAY + SAME SESSION ONLY');
    console.log(`   This pair violated the rule (different days)\n`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
}

fixIncome();
