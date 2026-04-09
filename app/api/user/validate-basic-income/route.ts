import { getServerSession } from 'next-auth';
import { connectDB } from '@/lib/database';
import { authOptions } from '@/lib/auth';
import User from '@/models/User';
import { NextRequest, NextResponse } from 'next/server';
import { validateBasicIncomePairMatching, calculateBasicIncome, BASIC_INCOME_CONFIG } from '@/lib/incomeCalculations';

/**
 * ✅ POINT 4-6: Validate Basic Income with Session-Based Matching
 * Rules:
 * - Both left & right must be in SAME 12-hour session (12 AM-PM or 12 PM-AM)
 * - Different sessions = NO INCOME
 * - Max ₹1,000 per session (even if multiple pairs)
 * - Daily cap: ₹2,000 (2 sessions × ₹1,000)
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.username) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const user = await User.findOne({ username: session.user.username })
      .select('sessionBasedIncome placementId placementPosition directMembers');

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    // Get today's session-based records
    const todaySessions = (user.sessionBasedIncome || []).filter((s: any) => {
      const sDate = new Date(s.sessionDate).toISOString().split('T')[0];
      return sDate === todayStr;
    });

    // Calculate income for each session
    const morningSession = todaySessions.find((s: any) => s.sessionType === 'morning');
    const eveningSession = todaySessions.find((s: any) => s.sessionType === 'evening');

    // Validate pair matching by session
    let validationResults = {
      morning: { isValid: false, pairs: 0, income: 0 },
      evening: { isValid: false, pairs: 0, income: 0 },
      totalDaily: 0,
      recommendation: ''
    };

    if (morningSession) {
      // Check if pairs in morning session meet time-matching criteria
      const leftInMorning = (user.directMembers || []).filter(
        (m: any) => m.position === 'left' && 
        new Date(m.joinDate).toISOString().split('T')[0] === todayStr &&
        new Date(m.joinDate).getHours() < 12
      );
      const rightInMorning = (user.directMembers || []).filter(
        (m: any) => m.position === 'right' && 
        new Date(m.joinDate).toISOString().split('T')[0] === todayStr &&
        new Date(m.joinDate).getHours() < 12
      );

      const pairsInMorning = Math.min(leftInMorning.length, rightInMorning.length);
      
      if (pairsInMorning > 0 && leftInMorning.length > 0 && rightInMorning.length > 0) {
        // Validate each pair
        const firstLeftMember = leftInMorning[0];
        const firstRightMember = rightInMorning[0];
        const validation = validateBasicIncomePairMatching(
          new Date(firstLeftMember.joinDate),
          new Date(firstRightMember.joinDate)
        );

        if (validation.isValid) {
          const income = calculateBasicIncome(pairsInMorning, 'morning');
          validationResults.morning = {
            isValid: true,
            pairs: pairsInMorning,
            income: income
          };
        }
      }
    }

    if (eveningSession) {
      const leftInEvening = (user.directMembers || []).filter(
        (m: any) => m.position === 'left' && 
        new Date(m.joinDate).toISOString().split('T')[0] === todayStr &&
        new Date(m.joinDate).getHours() >= 12
      );
      const rightInEvening = (user.directMembers || []).filter(
        (m: any) => m.position === 'right' && 
        new Date(m.joinDate).toISOString().split('T')[0] === todayStr &&
        new Date(m.joinDate).getHours() >= 12
      );

      const pairsInEvening = Math.min(leftInEvening.length, rightInEvening.length);

      if (pairsInEvening > 0 && leftInEvening.length > 0 && rightInEvening.length > 0) {
        const firstLeftMember = leftInEvening[0];
        const firstRightMember = rightInEvening[0];
        const validation = validateBasicIncomePairMatching(
          new Date(firstLeftMember.joinDate),
          new Date(firstRightMember.joinDate)
        );

        if (validation.isValid) {
          const income = calculateBasicIncome(pairsInEvening, 'evening');
          validationResults.evening = {
            isValid: true,
            pairs: pairsInEvening,
            income: income
          };
        }
      }
    }

    validationResults.totalDaily = validationResults.morning.income + validationResults.evening.income;

    if (!validationResults.morning.isValid && !validationResults.evening.isValid) {
      validationResults.recommendation = 'Add members to both left and right sides in the SAME 12-hour session for income';
    } else if (!validationResults.morning.isValid && validationResults.evening.isValid) {
      validationResults.recommendation = 'Morning session: Need members on both sides within 12 AM-12 PM window';
    } else if (validationResults.morning.isValid && !validationResults.evening.isValid) {
      validationResults.recommendation = 'Evening session: Need members on both sides within 12 PM-12 AM window';
    }

    return NextResponse.json({
      success: true,
      data: validationResults,
      dailyCap: BASIC_INCOME_CONFIG.DAILY_CAP,
      sessionCap: BASIC_INCOME_CONFIG.SESSION_CAP,
      maxPairsPerSession: BASIC_INCOME_CONFIG.MAX_PAIRS_PER_SESSION
    });
  } catch (error) {
    console.error('Basic income validation error:', error);
    return NextResponse.json(
      { error: 'Failed to validate basic income' },
      { status: 500 }
    );
  }
}
