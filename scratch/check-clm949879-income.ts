import mongoose from 'mongoose';
import User from '../models/User';
import { connectDB } from '../lib/database';

/**
 * Detailed diagnostic for CLM949879 income
 * Check if the ₹1000 income is VALID or INVALID
 */

async function checkIncome() {
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
    console.log('👤 USER: CLM949879');
    console.log('═══════════════════════════════════════════');
    console.log('Basic Income: ₹' + (user.basicIncome || 0));
    console.log('Basic Pairs: ' + (user.basicPairs || 0));
    console.log('Joining Date: ' + user.joiningDate);
    console.log('Last Session Date: ' + (user.lastSessionDate ? new Date(user.lastSessionDate).toISOString() : 'NOT SET'));
    console.log('Last Session Type: ' + (user.lastSessionType || 'NOT SET'));

    // Get downline
    const downlineLeft = await User.find({
      $or: [
        { placementId: user.userId, placementPosition: 'left' },
        { placementId: user.username, placementPosition: 'left' }
      ]
    }).select('username userId fullName joiningDate createdAt lastSessionDate lastSessionType').lean();

    const downlineRight = await User.find({
      $or: [
        { placementId: user.userId, placementPosition: 'right' },
        { placementId: user.username, placementPosition: 'right' }
      ]
    }).select('username userId fullName joiningDate createdAt lastSessionDate lastSessionType').lean();

    console.log('\n📊 SESSION INCOME RECORDS:');
    if (user.sessionBasedIncome && user.sessionBasedIncome.length > 0) {
      user.sessionBasedIncome.forEach((record: any, idx: number) => {
        const recordDate = new Date(record.date).toISOString().split('T')[0];
        console.log(`\n  Session #${idx + 1}:`);
        console.log(`    Date: ${recordDate} (${record.sessionType})`);
        console.log(`    Pairs: ${record.pairs}`);
        console.log(`    Income: ₹${record.netIncome}`);
      });
    }

    console.log('\n\n👥 DOWNLINE MEMBERS:');
    
    console.log('\n  LEFT SIDE (' + downlineLeft.length + '):');
    downlineLeft.forEach((member: any) => {
      const joinDate = member.joiningDate ? new Date(member.joiningDate).toISOString().split('T')[0] : 'NOT SET';
      const createdDate = new Date(member.createdAt).toISOString().split('T')[0];
      console.log(`    ${member.username}`);
      console.log(`      joiningDate: ${joinDate}`);
      console.log(`      createdAt: ${createdDate}`);
      console.log(`      lastSessionDate: ${member.lastSessionDate ? new Date(member.lastSessionDate).toISOString().split('T')[0] : 'NOT SET'}`);
      console.log(`      lastSessionType: ${member.lastSessionType || 'NOT SET'}`);
    });

    console.log('\n  RIGHT SIDE (' + downlineRight.length + '):');
    downlineRight.forEach((member: any) => {
      const joinDate = member.joiningDate ? new Date(member.joiningDate).toISOString().split('T')[0] : 'NOT SET';
      const createdDate = new Date(member.createdAt).toISOString().split('T')[0];
      console.log(`    ${member.username}`);
      console.log(`      joiningDate: ${joinDate}`);
      console.log(`      createdAt: ${createdDate}`);
      console.log(`      lastSessionDate: ${member.lastSessionDate ? new Date(member.lastSessionDate).toISOString().split('T')[0] : 'NOT SET'}`);
      console.log(`      lastSessionType: ${member.lastSessionType || 'NOT SET'}`);
    });

    // Analysis
    console.log('\n\n🔍 ANALYSIS:');
    
    if (downlineLeft.length > 0 && downlineRight.length > 0) {
      const leftMember = downlineLeft[0];
      const rightMember = downlineRight[0];
      
      const leftJoinDate = leftMember.joiningDate ? new Date(leftMember.joiningDate).toISOString().split('T')[0] : 'NOT SET';
      const rightJoinDate = rightMember.joiningDate ? new Date(rightMember.joiningDate).toISOString().split('T')[0] : 'NOT SET';

      console.log(`\nLeft member join date: ${leftJoinDate}`);
      console.log(`Right member join date: ${rightJoinDate}`);

      if (leftJoinDate === rightJoinDate && leftJoinDate !== 'NOT SET') {
        console.log(`✅ SAME DAY: Both joined on ${leftJoinDate}`);
        
        // Check session type
        const leftSessionType = leftMember.lastSessionType || 'unknown';
        const rightSessionType = rightMember.lastSessionType || 'unknown';
        
        console.log(`   Left session type: ${leftSessionType}`);
        console.log(`   Right session type: ${rightSessionType}`);
        
        if (leftSessionType === rightSessionType) {
          console.log(`✅ SAME SESSION: Both in ${leftSessionType} session`);
          console.log(`\n✅ VALID INCOME: ₹${user.basicIncome} is CORRECT!`);
          console.log('   Rule: SAME DAY + SAME SESSION ✓');
        } else {
          console.log(`❌ DIFFERENT SESSIONS: ${leftSessionType} vs ${rightSessionType}`);
          console.log(`\n❌ INVALID INCOME: ₹${user.basicIncome} should be ₹0!`);
          console.log('   Rule violated: Different sessions on same day');
        }
      } else {
        console.log(`❌ DIFFERENT DAYS: ${leftJoinDate} vs ${rightJoinDate}`);
        console.log(`\n❌ INVALID INCOME: ₹${user.basicIncome} should be ₹0!`);
        console.log('   Rule violated: Different days');
      }
    }

    console.log('\n═══════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
}

checkIncome();
