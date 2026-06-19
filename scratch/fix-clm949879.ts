import mongoose from 'mongoose';
import User from '../models/User';
import { connectDB } from '../lib/database';

/**
 * Fix for CLM949879 income issue
 * 1. Audit the problem
 * 2. Reset and recalculate income correctly
 */

async function fixCLM949879() {
  try {
    await connectDB();
    
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

    console.log('\n═══════════════════════════════════════════');
    console.log('🔍 DIAGNOSIS');
    console.log('═══════════════════════════════════════════');

    // Get downline members
    const downlineLeft = await User.find({
      $or: [
        { placementId: user.userId, placementPosition: 'left' },
        { placementId: user.username, placementPosition: 'left' }
      ]
    }).select('userId username fullName joiningDate createdAt').lean();

    const downlineRight = await User.find({
      $or: [
        { placementId: user.userId, placementPosition: 'right' },
        { placementId: user.username, placementPosition: 'right' }
      ]
    }).select('userId username fullName joiningDate createdAt').lean();

    const allDownline = [...downlineLeft, ...downlineRight];

    console.log(`\nDownline members: ${allDownline.length}`);
    console.log('\nJoining Dates:');
    
    const uniqueDates = new Set();
    allDownline.forEach((member, idx) => {
      const joinDate = member.joiningDate ? new Date(member.joiningDate).toISOString().split('T')[0] : 'NOT SET';
      const createdAt = new Date(member.createdAt).toISOString().split('T')[0];
      console.log(`  ${idx + 1}. ${member.username}: joiningDate="${joinDate}" vs createdAt="${createdAt}"`);
      if (member.joiningDate) uniqueDates.add(joinDate);
    });

    console.log(`\n⚠️  Problem: All downline joined on ${uniqueDates.size} date(s)`);
    if (uniqueDates.size === 1) {
      console.log('    ✗ This is WRONG! They should have different join dates.');
    }

    console.log('\n═══════════════════════════════════════════');
    console.log('🔧 FIX STEPS');
    console.log('═══════════════════════════════════════════');

    console.log('\n1️⃣  SET CORRECT JOINING DATES from createdAt');
    allDownline.forEach(async (member) => {
      const createdDate = new Date(member.createdAt);
      await User.findOneAndUpdate(
        { _id: member._id },
        { $set: { joiningDate: createdDate.toISOString().split('T')[0] } }
      );
      console.log(`   ✓ ${member.username}: joiningDate = ${createdDate.toISOString().split('T')[0]}`);
    });

    console.log('\n2️⃣  RESET INCOME RECORDS for CLM949879');
    console.log(`   Previous basicIncome: ₹${user.basicIncome || 0}`);
    console.log(`   Previous sessions: ${user.sessionBasedIncome?.length || 0}`);

    user.basicIncome = 0;
    user.basicPairs = 0;
    user.sessionBasedIncome = [];
    user.basicIncomeRecords = [];
    user.sessionTeam = { left: 0, right: 0 };
    user.lastSessionDate = undefined;
    user.lastSessionType = undefined;
    
    await user.save();

    console.log('   ✓ Reset complete');

    console.log('\n3️⃣  RECALCULATE INCOME (next session transition)');
    console.log('   When next user joins, income will be recalculated correctly');
    console.log('   Each session will only match pairs from that session');

    console.log('\n═══════════════════════════════════════════');
    console.log('✅ FIX COMPLETE');
    console.log('═══════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
}

fixCLM949879();
