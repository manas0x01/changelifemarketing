import { getServerSession } from 'next-auth';
import { connectDB } from '@/lib/database';
import { authOptions } from '@/lib/auth';
import User from '@/models/User';
import { NextRequest, NextResponse } from 'next/server';
import { calculateBoosterMatchingIncome, BOOSTER_MATCHING_CONFIG } from '@/lib/incomeCalculations';


export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.username) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const body = await req.json();
    const { sessionType = 'morning' } = body; 

    const user = await User.findOne({ username: session.user.username })
      .select('boosterIncomeRecords boosterCarryForward boosterStatus directMembers');

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    // Get previous carry-forward from last session
    const previousCarryForward = (user.boosterCarryForward || [])
      .filter((cf: any) => {
        const cfDate = new Date(cf.date).toISOString().split('T')[0];
        return cfDate < todayStr; // Earlier than today
      })
      .reduce((sum: number, cf: any) => sum + (cf.pairsCarried || 0), 0);

    // Count booster pairs formed in current session
    const sessionHourStart = sessionType === 'morning' ? 0 : 12;
    const sessionHourEnd = sessionType === 'morning' ? 12 : 24;

    const leftBoosters = (user.directMembers || []).filter((m: any) => 
      m.position === 'left' && 
      user.boosterStatus?.isBoosterLeft
    );
    const rightBoosters = (user.directMembers || []).filter((m: any) => 
      m.position === 'right' && 
      user.boosterStatus?.isBoosterRight
    );

    const newPairsThisSession = Math.min(leftBoosters.length, rightBoosters.length);

    // Calculate income with carry-forward and fleshout
    const result = calculateBoosterMatchingIncome(newPairsThisSession, previousCarryForward);

    // Save booster matching record (using schema-compatible format)
    const newRecord = {
      srNo: ((user.boosterIncomeRecords || []).length || 0) + 1,
      amount: result.netIncome,
      pairCount: result.pairsUsed,
      date: new Date(),
      description: `${sessionType.charAt(0).toUpperCase() + sessionType.slice(1)} session - ${result.pairsUsed} pairs matched (${result.pairsCarried} carried forward)`,
      status: 'Completed'
    };

    if (!user.boosterIncomeRecords) user.boosterIncomeRecords = [];
    user.boosterIncomeRecords.push(newRecord);

    // Update carry-forward if pairs remain
    if (result.pairsCarried > 0) {
      if (!user.boosterCarryForward) user.boosterCarryForward = [];
      user.boosterCarryForward.push({
        date: new Date(),
        sessionType: sessionType === 'morning' ? 'evening' : 'morning', // Next session
        pairsCarried: result.pairsCarried,
        reason: session.user.username ? `Carry-forward from ${sessionType} session` : 'Auto carry-forward'
      });
    }

    // Update total booster income amount
    user.boosterIncomeAmount = (user.boosterIncomeAmount || 0) + result.netIncome;

    await user.save();

    return NextResponse.json({
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
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to calculate booster matching income' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.username) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const user = await User.findOne({ username: session.user.username })
      .select('boosterCarryForward boosterIncomeAmount boosterStatus');

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    // Calculate total carry-forward
    const totalCarryForward = (user.boosterCarryForward || [])
      .filter((cf: any) => {
        const cfDate = new Date(cf.date).toISOString().split('T')[0];
        return cfDate <= todayStr;
      })
      .reduce((sum: number, cf: any) => sum + (cf.pairsCarried || 0), 0);

    // Calculate fleshout risk
    const fleshoutRisk = Math.max(0, totalCarryForward - BOOSTER_MATCHING_CONFIG.CARRY_FORWARD_MAX);

    return NextResponse.json({
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
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get carry-forward status' },
      { status: 500 }
    );
  }
}
