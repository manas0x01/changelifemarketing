/**
 * ✅ AUTO-CALCULATE BASIC INCOME WHEN MEMBERS ARE ADDED
 * 
 * When a new member registers:
 * 1. They're added to placement parent's directMembers
 * 2. Check if this creates a complete pair in the same 12-hour session
 * 3. If yes, automatically calculate basic income (₹800 net per pair)
 * 4. Update user's basicIncome & sessionBasedIncome
 */

import User from '@/models/User';

const GROSS_PAIR_INCOME = 1000;
const NET_INCOME_PER_PAIR = 1000;  // No deductions - full payout
const SESSION_CAP = 1000;
const DAILY_CAP = 2000;

// Get session type based on hour
function getSessionType(date: Date): 'morning' | 'evening' {
  const hour = date.getHours();
  return hour >= 0 && hour < 12 ? 'morning' : 'evening';
}

// Get session boundaries
function getSessionBoundaries(date: Date) {
  const hour = date.getHours();
  const sessionStart = new Date(date);
  const sessionEnd = new Date(date);

  if (hour >= 0 && hour < 12) {
    sessionStart.setHours(0, 0, 0, 0);
    sessionEnd.setHours(12, 0, 0, 0);
  } else {
    sessionStart.setHours(12, 0, 0, 0);
    sessionEnd.setHours(24, 0, 0, 0);
  }

  return { start: sessionStart, end: sessionEnd };
}

// Get today's boundaries
function getTodayBoundaries() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const end = new Date();
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

/**
 * Auto-calculate basic income for a user when a new member joins
 * Called from registration route after member is added
 */
export async function autoCalculateBasicIncome(placementParentId: any) {
  try {
    console.log("\n⚪ AUTO-CALC START for placement parent:", placementParentId);
    const user = await User.findById(placementParentId);
    if (!user) {
      console.warn(`❌ User not found: ${placementParentId}`);
      return { success: false, message: 'User not found' };
    }

    console.log("📋 Found user:", user.username, "Rank:", user.basicRank);

    // Check rank requirement - allow 'basic' and all other ranks
    if (user.basicRank === 'unranked' || !user.basicRank) {
      console.log(`❌ User ${user.username} not ranked (unranked), skipping basic income calculation`);
      return { success: false, message: 'User not ranked' };
    }

    console.log(`✅ User ${user.username} has rank '${user.basicRank}', can earn income`);
    // ✅ User has a valid rank ('basic' or higher), can earn income

    const now = new Date();
    const currentSession = getSessionType(now);
    const { start: sessionStart, end: sessionEnd } = getSessionBoundaries(now);
    const { start: dayStart, end: dayEnd } = getTodayBoundaries();

    // TESTING: Count ALL members (not just current session)
    const directMembers = user.directMembers || [];
    
    // const leftMembersThisSession = directMembers.filter(m =>
    //   m.position === 'left' &&
    //   m.joinDate >= sessionStart &&
    //   m.joinDate < sessionEnd
    // );

    // const rightMembersThisSession = directMembers.filter(m =>
    //   m.position === 'right' &&
    //   m.joinDate >= sessionStart &&
    //   m.joinDate < sessionEnd
    // );

    // Count ALL left/right members regardless of session
    const leftMembersThisSession = directMembers.filter(m => m.position === 'left');
    const rightMembersThisSession = directMembers.filter(m => m.position === 'right');

    console.log("📈 Session analysis:", {
      currentSession,
      sessionStart: sessionStart.toISOString(),
      sessionEnd: sessionEnd.toISOString(),
      leftMembersThisSession: leftMembersThisSession.length,
      rightMembersThisSession: rightMembersThisSession.length,
      totalDirectMembers: directMembers.length,
    });

    // Calculate pairs from ALL members
    const possiblePairsThisSession = Math.min(
      leftMembersThisSession.length,
      rightMembersThisSession.length
    );

    if (possiblePairsThisSession <= 0) {
      console.log(`❌ ${user.username}: No complete pairs (total members)`);
      return { success: false, message: 'No pairs available' };
    }

    console.log(`✅ Found ${possiblePairsThisSession} possible pairs!`);

    // TESTING: Skip session duplicate check - allow multiple calculations
    // const existingSessionIncome = (user.sessionBasedIncome || [])
    //   .filter(s =>
    //     s.sessionDate >= sessionStart &&
    //     s.sessionDate < sessionEnd &&
    //     s.sessionType === currentSession
    //   );

    // if (existingSessionIncome.length > 0) {
    //   console.log(`⚠️ ${user.username}: Basic income already calculated for this session`);
    //   return { success: false, message: 'Already calculated for this session' };
    // }
    // Check session cap
    const sessionIncomeToday = (user.sessionBasedIncome || [])
      .filter(s =>
        s.sessionDate >= sessionStart &&
        s.sessionDate < sessionEnd &&
        s.sessionType === currentSession
      )
      .reduce((sum, s) => sum + (s.netIncome || 0), 0);
    const todayIncome = (user.sessionBasedIncome || [])
      .filter(s => s.sessionDate >= dayStart && s.sessionDate <= dayEnd)
      .reduce((sum, s) => sum + (s.netIncome || 0), 0);

    console.log("💰 Income caps:", {
      sessionIncomeToday,
      SESSION_CAP,
      todayIncome,
      DAILY_CAP,
    });

    // ✅ NET INCOME PER PAIR = ₹1,000 (No deductions)
    
    // CAPPING LOGIC COMMENTED OUT FOR TESTING - Multiple IDs & Income Generation
    // const remainingSessionCap = SESSION_CAP - sessionIncomeToday;
    // const maxPairsForSessionCap = Math.floor(remainingSessionCap / NET_INCOME_PER_PAIR);
    
    // Calculate max pairs that fit in daily cap
    // const remainingDailyCap = DAILY_CAP - todayIncome;
    // const maxPairsForDailyCap = Math.floor(remainingDailyCap / NET_INCOME_PER_PAIR);

    // Using all possible pairs for testing (ignoring cap limits)
    const pairsThisSession = possiblePairsThisSession;

    console.log("🎯 Pair calculation:", {
      possiblePairsThisSession,
      // maxPairsForSessionCap,
      // maxPairsForDailyCap,
      pairsThisSession,
    });

    // if (pairsThisSession <= 0) {
    //   console.log(`❌ ${user.username}: Cannot credit pairs - caps exceeded`);
    //   return { success: false, message: 'Caps exceeded' };
    // }
    
    console.log(`✅ Will credit ${pairsThisSession} pairs!`);

    // Calculate income (₹1,000 per pair, no deductions)
    const grossIncome = pairsThisSession * GROSS_PAIR_INCOME;
    const netIncome = pairsThisSession * NET_INCOME_PER_PAIR;

    // Create session income record
    const sessionRecord = {
      sessionDate: now,
      sessionType: currentSession,
      leftMembersInSession: leftMembersThisSession.length,
      rightMembersInSession: rightMembersThisSession.length,
      pairsInSession: pairsThisSession,
      grossIncome,
      netIncome,
      status: 'Completed' as const,
    };

    // Create basic income record for history
    const incomeRecord = {
      srNo: ((user.basicIncomeRecords || []).length || 0) + 1,
      amount: netIncome,
      pairCount: pairsThisSession,
      date: now,
      description: `Basic Income from ${pairsThisSession} pair(s) - ${currentSession} session (Auto-calculated on member addition)`,
      status: 'Paid',
    };

    // Update user
    const updatedBasicIncome = (user.basicIncome || 0) + netIncome;
    const updatedSessionBasedIncome = [...(user.sessionBasedIncome || []), sessionRecord];
    const updatedBasicIncomeRecords = [...(user.basicIncomeRecords || []), incomeRecord];

    const updateResult = await User.findByIdAndUpdate(placementParentId, {
      basicIncome: updatedBasicIncome,
      sessionBasedIncome: updatedSessionBasedIncome,
      basicIncomeRecords: updatedBasicIncomeRecords,
      updatedAt: new Date(),
    }, { new: true });

    console.log(`\n🎉 AUTO-CALC SUCCESS for ${user.username}:`, {
      previousBasicIncome: user.basicIncome || 0,
      newBasicIncome: updatedBasicIncome,
      pairsThisSession,
      possiblePairsThisSession,
      excessPairs: possiblePairsThisSession - pairsThisSession,
      grossIncome,
      netIncome,
      totalBasicIncome: updatedBasicIncome,
    });

    return {
      success: true,
      message: `${pairsThisSession} pair(s) auto-calculated${pairsThisSession < possiblePairsThisSession ? ` (${possiblePairsThisSession - pairsThisSession} excess)` : ''}`,
      data: {
        pairsProcessed: pairsThisSession,
        possiblePairs: possiblePairsThisSession,
        excessPairs: possiblePairsThisSession - pairsThisSession,
        netIncome,
        totalBasicIncome: updatedBasicIncome,
        cappingInfo: {
          // sessionRemaining: remainingSessionCap,
          // dailyRemaining: remainingDailyCap,
          // sessionCapped: maxPairsForSessionCap <= 0,
          // dailyCapped: maxPairsForDailyCap <= 0,
          note: 'Capping disabled for testing'
        }
      }
    };

  } catch (error) {
    console.error(`❌ Error auto-calculating basic income:`, error);
    return { success: false, message: String(error) };
  }
}
