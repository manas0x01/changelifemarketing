import { getServerSession } from 'next-auth';
import { connectDB } from '@/lib/database';
import { authOptions } from '@/lib/auth';
import User from '@/models/User';
import { NextRequest, NextResponse } from 'next/server';
import { calculateBoosterMatchingIncome, BOOSTER_MATCHING_CONFIG } from '@/lib/incomeCalculations';


export async function POST(req: NextRequest) {
  try {
    console.log('🟢 [POST] /api/user/booster-matching-income - Entry');
    const session = await getServerSession(authOptions);
    console.log('👤 Session:', session);
    if (!session?.user?.username) {
      console.log('🔴 Unauthorized access attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    console.log('✅ Database connected');

    const body = await req.json();
    console.log('📦 Request body:', body);
    const { sessionType = 'morning' } = body; 
    console.log('🕒 Session type:', sessionType);

    const user = await User.findOne({ username: session.user.username })
      .select('boosterIncomeRecords boosterCarryForward boosterStatus directMembers');
    console.log('👤 User fetched:', user ? user.username : null);

    if (!user) {
      console.log('🔴 User not found');
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    console.log('📅 Today:', todayStr);

    // Get previous carry-forward from last session
    const previousCarryForward = (user.boosterCarryForward || [])
      .filter((cf: any) => {
        const cfDate = new Date(cf.date).toISOString().split('T')[0];
        return cfDate < todayStr; // Earlier than today
      })
      .reduce((sum: number, cf: any) => sum + (cf.pairsCarried || 0), 0);
    console.log('🔄 Previous carry-forward:', previousCarryForward);

    // Count booster pairs formed in current session
    const sessionHourStart = sessionType === 'morning' ? 0 : 12;
    const sessionHourEnd = sessionType === 'morning' ? 12 : 24;
    console.log('⏰ Session hours:', sessionHourStart, '-', sessionHourEnd);

    const leftBoosters = (user.directMembers || []).filter((m: any) => 
      m.position === 'left' && 
      user.boosterStatus?.isBoosterLeft
    );
    const rightBoosters = (user.directMembers || []).filter((m: any) => 
      m.position === 'right' && 
      user.boosterStatus?.isBoosterRight
    );
    console.log('👥 Left boosters:', leftBoosters.length, 'Right boosters:', rightBoosters.length);

    const newPairsThisSession = Math.min(leftBoosters.length, rightBoosters.length);
    console.log('🔗 New pairs this session:', newPairsThisSession);

    // Calculate income with carry-forward and fleshout
    const result = calculateBoosterMatchingIncome(newPairsThisSession, previousCarryForward);
    console.log('💸 Booster matching income result:', result);

    // Save booster matching record (using schema-compatible format)
    const newRecord = {
      srNo: ((user.boosterIncomeRecords || []).length || 0) + 1,
      amount: result.netIncome,
      pairCount: result.pairsUsed,
      date: new Date(),
      description: `${sessionType.charAt(0).toUpperCase() + sessionType.slice(1)} session - ${result.pairsUsed} pairs matched (${result.pairsCarried} carried forward)`,
      status: 'Completed'
    };
    console.log('📝 New booster income record:', newRecord);

    if (!user.boosterIncomeRecords) user.boosterIncomeRecords = [];
    user.boosterIncomeRecords.push(newRecord);
    console.log('📈 Updated boosterIncomeRecords:', user.boosterIncomeRecords.length);

    // Update carry-forward if pairs remain
    if (result.pairsCarried > 0) {
      if (!user.boosterCarryForward) user.boosterCarryForward = [];
      user.boosterCarryForward.push({
        date: new Date(),
        sessionType: sessionType === 'morning' ? 'evening' : 'morning', // Next session
        pairsCarried: result.pairsCarried,
        reason: session.user.username ? `Carry-forward from ${sessionType} session` : 'Auto carry-forward'
      });
      console.log('🔄 Carry-forward updated:', user.boosterCarryForward[user.boosterCarryForward.length - 1]);
    }

    // Update total booster income amount
    user.boosterIncomeAmount = (user.boosterIncomeAmount || 0) + result.netIncome;
    console.log('💰 Updated boosterIncomeAmount:', user.boosterIncomeAmount);

    await user.save();
    console.log('💾 User saved successfully');

    const responsePayload = {
      success: true,
      message: 'Booster matching income calculated',
      data: {
        sessionType,
        sessionDate: todayStr,
        previousCarryForward,
        newPairsThisSession,
        totalPairsAvailable: result.availablePairs,
        pairsUsed: result.pairsUsed,
        grossIncome: result.grossIncome,
        netIncome: result.netIncome,
        pairsCarried: result.pairsCarried,
        pairsFleshout: result.pairsFleshout,
        sessionCapped: result.sessionCapped,
        dailyBalance: user.boosterIncomeAmount,
        warnings: [
          ...(result.sessionCapped ? ['Session capped at 10 pairs - remaining pairs may fleshout'] : []),
          ...(result.pairsFleshout > 0 ? [`⚠️ ${result.pairsFleshout} pairs fleshout (beyond 10 carry-forward limit)`] : []),
          ...(result.pairsCarried > 0 ? [`✓ ${result.pairsCarried} pairs carried to next session`] : [])
        ]
      },
      limits: {
        dailyCap: BOOSTER_MATCHING_CONFIG.DAILY_CAP,
        sessionCap: BOOSTER_MATCHING_CONFIG.SESSION_CAP,
        maxPairsPerSession: BOOSTER_MATCHING_CONFIG.MAX_PAIRS_PER_SESSION,
        carryForwardMax: BOOSTER_MATCHING_CONFIG.CARRY_FORWARD_MAX
      }
    };
    console.log('📤 Response payload:', responsePayload);
    console.log('✅ [POST] /api/user/booster-matching-income - Exit');
    return NextResponse.json(responsePayload);
  } catch (error) {
    console.log('❌ Error in [POST] /api/user/booster-matching-income:', error);
    return NextResponse.json(
      { error: 'Failed to calculate booster matching income' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    console.log('🟢 [GET] /api/user/booster-matching-income - Entry');
    const session = await getServerSession(authOptions);
    console.log('👤 Session:', session);
    if (!session?.user?.username) {
      console.log('🔴 Unauthorized access attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    console.log('✅ Database connected');

    const user = await User.findOne({ username: session.user.username })
      .select('boosterCarryForward boosterIncomeAmount boosterStatus');
    console.log('👤 User fetched:', user ? user.username : null);

    if (!user) {
      console.log('🔴 User not found');
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    console.log('📅 Today:', todayStr);

    // Calculate total carry-forward
    const totalCarryForward = (user.boosterCarryForward || [])
      .filter((cf: any) => {
        const cfDate = new Date(cf.date).toISOString().split('T')[0];
        return cfDate <= todayStr;
      })
      .reduce((sum: number, cf: any) => sum + (cf.pairsCarried || 0), 0);
    console.log('🔄 Total carry-forward:', totalCarryForward);

    // Calculate fleshout risk
    const fleshoutRisk = Math.max(0, totalCarryForward - BOOSTER_MATCHING_CONFIG.CARRY_FORWARD_MAX);
    console.log('⚠️ Fleshout risk:', fleshoutRisk);

    const responsePayload = {
      success: true,
      data: {
        isBooster: user.boosterStatus?.isBoosterLeft && user.boosterStatus?.isBoosterRight,
        totalCarryForward,
        carryForwardCapacity: Math.max(0, BOOSTER_MATCHING_CONFIG.CARRY_FORWARD_MAX - totalCarryForward),
        fleshoutRisk,
        totalBoosterIncome: user.boosterIncomeAmount || 0,
        carryForwardDetails: (user.boosterCarryForward || [])
          .filter((cf: any) => {
            const cfDate = new Date(cf.date).toISOString().split('T')[0];
            return cfDate <= todayStr;
          })
          .map((cf: any) => ({
            date: cf.date,
            sessionType: cf.sessionType,
            pairsCarried: cf.pairsCarried,
            reason: cf.reason
          }))
      }
    };
    console.log('📤 Response payload:', responsePayload);
    console.log('✅ [GET] /api/user/booster-matching-income - Exit');
    return NextResponse.json(responsePayload);
  } catch (error) {
    console.log('❌ Error in [GET] /api/user/booster-matching-income:', error);
    return NextResponse.json(
      { error: 'Failed to get carry-forward status' },
      { status: 500 }
    );
  }
}
