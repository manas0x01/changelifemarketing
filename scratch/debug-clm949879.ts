import mongoose from 'mongoose';
import User from '../models/User';
import { connectDB } from '../lib/database';

/**
 * Debug script to investigate CLM949879's income generation issue
 * Check:
 * 1. User profile and team structure
 * 2. Session-based income records
 * 3. Downline members and their join dates
 * 4. Session team history
 */

async function debugUser() {
  try {
    await connectDB();
    
    const user = await User.findOne({
      $or: [
        { userId: 'CLM949879' },
        { username: 'CLM949879' }
      ]
    }).lean();

    if (!user) {
      console.log('❌ User CLM949879 not found');
      return;
    }

    console.log('\n═══════════════════════════════════════════');
    console.log('👤 USER PROFILE: CLM949879');
    console.log('═══════════════════════════════════════════');
    console.log('Username:', user.username);
    console.log('Full Name:', user.fullName);
    console.log('Joining Date:', user.joiningDate);
    console.log('Is Booster:', user.isBooster);
    console.log('Basic Rank:', user.basicRank);
    console.log('\n📊 TEAM STRUCTURE:');
    console.log('Total Team - Left:', user.totalTeam?.left, 'Right:', user.totalTeam?.right);
    console.log('Session Team - Left:', user.sessionTeam?.left, 'Right:', user.sessionTeam?.right);
    console.log('Last Session Type:', user.lastSessionType);
    console.log('Last Session Date:', user.lastSessionDate);

    console.log('\n💰 INCOME SUMMARY:');
    console.log('Basic Income:', user.basicIncome);
    console.log('Basic Pairs:', user.basicPairs);
    console.log('Booster Income:', user.boosterMatchingIncome);
    console.log('Total Income:', user.totalIncome);

    console.log('\n📋 SESSION-BASED INCOME RECORDS:');
    if (user.sessionBasedIncome && user.sessionBasedIncome.length > 0) {
      user.sessionBasedIncome.forEach((record: any, idx: number) => {
        console.log(`\n  Session #${idx + 1}:`);
        console.log(`    Date: ${new Date(record.date).toLocaleString()}`);
        console.log(`    Type: ${record.sessionType}`);
        console.log(`    Pairs: ${record.pairs}`);
        console.log(`    Net Income: ₹${record.netIncome}`);
        console.log(`    Description: ${record.description}`);
        console.log(`    Status: ${record.status || 'N/A'}`);
      });
    } else {
      console.log('  No session-based income records found');
    }

    // Get downline members
    console.log('\n👥 DOWNLINE MEMBERS:');
    const downlineLeft = await User.find({
      $or: [
        { placementId: user.userId, placementPosition: 'left' },
        { placementId: user.username, placementPosition: 'left' }
      ]
    }).select('userId username fullName joiningDate createdAt placementPosition').lean();

    const downlineRight = await User.find({
      $or: [
        { placementId: user.userId, placementPosition: 'right' },
        { placementId: user.username, placementPosition: 'right' }
      ]
    }).select('userId username fullName joiningDate createdAt placementPosition').lean();

    console.log('\n  LEFT BRANCH (' + downlineLeft.length + ' members):');
    downlineLeft.forEach(member => {
      console.log(`    - ${member.username} (${member.userId}) - Joined: ${new Date(member.joiningDate || member.createdAt).toLocaleString()}`);
    });

    console.log('\n  RIGHT BRANCH (' + downlineRight.length + ' members):');
    downlineRight.forEach(member => {
      console.log(`    - ${member.username} (${member.userId}) - Joined: ${new Date(member.joiningDate || member.createdAt).toLocaleString()}`);
    });

    // Check if 1000 income was generated correctly
    console.log('\n🔍 ISSUE ANALYSIS:');
    const basicIncomeAmount = user.basicIncome || 0;
    const sessionCount = user.sessionBasedIncome?.length || 0;
    
    if (basicIncomeAmount >= 1000) {
      console.log(`⚠️  Basic income shows ₹${basicIncomeAmount} from ${sessionCount} sessions`);
      
      // Check if pairs were made in different sessions
      if (user.sessionBasedIncome && user.sessionBasedIncome.length > 1) {
        const multipleSessions = user.sessionBasedIncome.filter((s: any) => s.pairs > 0 && s.netIncome > 0);
        if (multipleSessions.length > 1) {
          console.log(`⚠️  WARNING: Multiple income-generating sessions detected!`);
          multipleSessions.forEach((s: any, i: number) => {
            console.log(`    Session ${i+1}: ${new Date(s.date).toLocaleString()} - ₹${s.netIncome}`);
          });
        }
      }

      // Check downline join dates
      const allDownline = [...downlineLeft, ...downlineRight];
      if (allDownline.length > 0) {
        const joinDates = allDownline.map(m => new Date(m.joiningDate || m.createdAt).toDateString());
        const uniqueDates = new Set(joinDates);
        console.log(`📅 Downline joined on ${uniqueDates.size} different day(s): ${Array.from(uniqueDates).join(', ')}`);
        
        if (uniqueDates.size > 1) {
          console.log(`\n❌ PROBLEM IDENTIFIED:`);
          console.log(`   - Downline joined on different days`);
          console.log(`   - But income was calculated for same session/day`);
          console.log(`   - This violates the session-based matching logic`);
          console.log(`   - Each session should only match pairs from THAT session`);
        }
      }
    }

    // Check flash history
    if (user.basicFlushHistory && user.basicFlushHistory.length > 0) {
      console.log('\n🔄 FLASH-OUT HISTORY:');
      user.basicFlushHistory.forEach((flush: any, idx: number) => {
        console.log(`  #${idx + 1}: ${new Date(flush.date).toLocaleString()} - Left: ${flush.left}, Right: ${flush.right} (${flush.reason})`);
      });
    }

    console.log('\n═══════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
}

debugUser();
