import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/database";
import User from "@/models/User";

const GROSS_PAIR_INCOME = 1000; // 1 Pair = 1000 rupees
const DAILY_CAP = 2000; // Max ₹2000 per day
const SESSION_CAP = 1000; // Max ₹1000 per 12-hour session
const SESSION_DURATION = 12 * 60 * 60 * 1000; // 12 hours in milliseconds

function getSessionType(date: Date): 'morning' | 'evening' {
  const hour = date.getHours();
  return hour >= 0 && hour < 12 ? 'morning' : 'evening';
}

function getSessionBoundaries(date: Date): { start: Date; end: Date } {
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

function getTodayBoundaries(): { start: Date; end: Date } {
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const end = new Date();
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.username) {
      return Response.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const user = await User.findOne({ username: session.user.username });

    if (!user) {
      return Response.json({ success: false, message: "User not found" }, { status: 404 });
    }
    if (user.basicRank === 'unranked' || !user.basicRank) {
      return Response.json({
        success: false,
        message: "User must have a rank to earn basic income (Default: 'basic')",
        data: { currentRank: user.basicRank || 'unranked' }
      }, { status: 403 });
    }
    const now = new Date();
    const currentSession = getSessionType(now);
    const { start: sessionStart, end: sessionEnd } = getSessionBoundaries(now);
    const { start: dayStart, end: dayEnd } = getTodayBoundaries();
    const directMembers = user.directMembers || [];
    
    const leftMembersThisSession = directMembers.filter(m =>
      m.position === 'left' &&
      m.joinDate >= sessionStart &&
      m.joinDate < sessionEnd
    );

    const rightMembersThisSession = directMembers.filter(m =>
      m.position === 'right' &&
      m.joinDate >= sessionStart &&
      m.joinDate < sessionEnd
    );

    const possiblePairsThisSession = Math.min(
      leftMembersThisSession.length,
      rightMembersThisSession.length
    );

    if (possiblePairsThisSession <= 0) {
      return Response.json({
        success: true,
        message: "No new pairs in this session",
        data: {
          sessionType: currentSession,
          sessionStart: sessionStart.toISOString(),
          sessionEnd: sessionEnd.toISOString(),
          leftMembersInSession: leftMembersThisSession.length,
          rightMembersInSession: rightMembersThisSession.length,
          pairsInSession: 0,
          incomeGenerated: 0,
          canRetryIn: "Check back after adding members in same session"
        }
      });
    }
    const todayIncome = (user.sessionBasedIncome || [])
      .filter(s => s.sessionDate >= dayStart && s.sessionDate <= dayEnd)
      .reduce((sum, s) => sum + (s.netIncome || 0), 0);

    const sessionIncomeToday = (user.sessionBasedIncome || [])
      .filter(s => 
        s.sessionDate >= sessionStart &&
        s.sessionDate < sessionEnd &&
        s.sessionType === currentSession
      )
      .reduce((sum, s) => sum + (s.netIncome || 0), 0);
    const NET_INCOME_PER_PAIR = GROSS_PAIR_INCOME;
    const remainingSessionCap = SESSION_CAP - sessionIncomeToday;
    const maxPairsForSessionCap = Math.floor(remainingSessionCap / NET_INCOME_PER_PAIR);
    const remainingDailyCap = DAILY_CAP - todayIncome;
    const maxPairsForDailyCap = Math.floor(remainingDailyCap / NET_INCOME_PER_PAIR);
    const pairsThisSession = Math.min(
      possiblePairsThisSession,
      maxPairsForSessionCap,
      maxPairsForDailyCap
    );
    if (pairsThisSession <= 0) {
      const sessionLimitReached = maxPairsForSessionCap <= 0;
      const dailyLimitReached = maxPairsForDailyCap <= 0;

      return Response.json({
        success: false,
        message: sessionLimitReached 
          ? `Session cap reached. Maximum ₹${SESSION_CAP} per session`
          : `Daily cap reached. Maximum ₹${DAILY_CAP} per day`,
        data: {
          possiblePairs: possiblePairsThisSession,
          sessionStatus: {
            currentIncome: sessionIncomeToday,
            remainingCapacity: remainingSessionCap,
            maxPairsFit: maxPairsForSessionCap,
          },
          dailyStatus: {
            currentIncome: todayIncome,
            remainingCapacity: remainingDailyCap,
            maxPairsFit: maxPairsForDailyCap,
          },
          creditablePairs: 0,
          reason: sessionLimitReached ? 'session_cap_exceeded' : 'daily_cap_exceeded'
        }
      }, { status: 400 });
    }
    const grossIncome = pairsThisSession * GROSS_PAIR_INCOME;
    const tdsAmount = 0;
    const serviceChargeAmount = 0;
    const netIncome = pairsThisSession * NET_INCOME_PER_PAIR;
    const sessionRecord = {
      sessionDate: now,
      sessionType: currentSession,
      leftMembersInSession: leftMembersThisSession.length,
      rightMembersInSession: rightMembersThisSession.length,
      pairsInSession: pairsThisSession,
      grossIncome,
      netIncome,
      tdsDeducted: tdsAmount,
      serviceChargeDeducted: serviceChargeAmount,
      status: 'Completed' as const,
    };
    const updatedBasicIncome = (user.basicIncome || 0) + netIncome;
    const updatedSessionBasedIncome = [...(user.sessionBasedIncome || []), sessionRecord];
    const incomeRecord = {
      srNo: ((user.basicIncomeRecords || []).length || 0) + 1,
      amount: netIncome,
      pairCount: pairsThisSession,
      date: now,
      description: `Basic Income from ${pairsThisSession} pair(s) - ${currentSession} session (${leftMembersThisSession.length}L + ${rightMembersThisSession.length}R)`,
      status: 'Paid',
    };

    user.basicIncome = updatedBasicIncome;
    user.sessionBasedIncome = updatedSessionBasedIncome;
    user.basicIncomeRecords = [...(user.basicIncomeRecords || []), incomeRecord];
    await user.save();

    return Response.json({
      success: true,
      message: `${pairsThisSession} pair(s) processed successfully in ${currentSession} session`,
      data: {
        sessionType: currentSession,
        pairsProcessed: pairsThisSession,
        pairsAvailable: possiblePairsThisSession,
        excessPairs: possiblePairsThisSession - pairsThisSession, // Pairs that didn't fit in cap
        breakdown: {
          grossPerPair: GROSS_PAIR_INCOME,
          tdsPerPair: 0,
          serviceChargePerPair: 0,
          netPerPair: NET_INCOME_PER_PAIR,
        },
        totalBreakdown: {
          grossIncome,
          tdsDeducted: 0,
          serviceChargeDeducted: 0,
          netIncome,
        },
        cappingStatus: {
          possiblePairs: possiblePairsThisSession,
          sessionCap: {
            limit: SESSION_CAP,
            currentIncome: sessionIncomeToday,
            remainingCapacity: remainingSessionCap,
            maxPairsFit: maxPairsForSessionCap,
            status: maxPairsForSessionCap > 0 ? '✅ Available' : '❌ CAPPED',
          },
          dailyCap: {
            limit: DAILY_CAP,
            currentIncome: todayIncome,
            remainingCapacity: remainingDailyCap,
            maxPairsFit: maxPairsForDailyCap,
            status: maxPairsForDailyCap > 0 ? '✅ Available' : '❌ CAPPED',
          },
        },
        currentStatus: {
          basicIncome: updatedBasicIncome,
          sessionIncomeAfter: sessionIncomeToday + netIncome,
          dailyIncomeAfter: todayIncome + netIncome,
          sessionCap: SESSION_CAP,
          dailyCap: DAILY_CAP,
        },
        sessionDetails: {
          leftMembersInSession: leftMembersThisSession.length,
          rightMembersInSession: rightMembersThisSession.length,
          sessionStart: sessionStart.toISOString(),
          sessionEnd: sessionEnd.toISOString(),
        },
        note: pairsThisSession < possiblePairsThisSession 
          ? `⚠️ Only ${pairsThisSession} pair(s) credited due to session/daily caps. ${possiblePairsThisSession - pairsThisSession} pair(s) cannot earn in this session.`
          : '✅ All available pairs credited'
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Error calculating basic income:', error);
    return Response.json(
      { success: false, message: "Internal server error", error: String(error) },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.username) {
      return Response.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const user = await User.findOne({ username: session.user.username });

    if (!user) {
      return Response.json({ success: false, message: "User not found" }, { status: 404 });
    }

    const now = new Date();
    const currentSession = getSessionType(now);
    const { start: sessionStart, end: sessionEnd } = getSessionBoundaries(now);
    const { start: dayStart, end: dayEnd } = getTodayBoundaries();

    const directMembers = user.directMembers || [];
    const leftMembersThisSession = directMembers.filter(m =>
      m.position === 'left' &&
      m.joinDate >= sessionStart &&
      m.joinDate < sessionEnd
    );
    const rightMembersThisSession = directMembers.filter(m =>
      m.position === 'right' &&
      m.joinDate >= sessionStart &&
      m.joinDate < sessionEnd
    );

    const todayIncome = (user.sessionBasedIncome || [])
      .filter(s => s.sessionDate >= dayStart && s.sessionDate <= dayEnd)
      .reduce((sum, s) => sum + (s.netIncome || 0), 0);

    const sessionIncomeToday = (user.sessionBasedIncome || [])
      .filter(s =>
        s.sessionDate >= sessionStart &&
        s.sessionDate < sessionEnd &&
        s.sessionType === currentSession
      )
      .reduce((sum, s) => sum + (s.netIncome || 0), 0);

    return Response.json({
      success: true,
      data: {
        userInfo: {
          username: user.username,
          basicRank: user.basicRank || 'unranked',
          totalBasicIncome: user.basicIncome || 0,
        },
        currentSession: {
          sessionType: currentSession,
          sessionStart: sessionStart.toISOString(),
          sessionEnd: sessionEnd.toISOString(),
          leftMembersInSession: leftMembersThisSession.length,
          rightMembersInSession: rightMembersThisSession.length,
          possiblePairs: Math.min(leftMembersThisSession.length, rightMembersThisSession.length),
        },
        dailyStatus: {
          date: now.toLocaleDateString('en-IN'),
          todayIncome: todayIncome,
          dailyCap: DAILY_CAP,
          remainingCap: DAILY_CAP - todayIncome,
          sessionIncomeToday: sessionIncomeToday,
          sessionCap: SESSION_CAP,
          remainingSessionCap: SESSION_CAP - sessionIncomeToday,
        },
        recordCount: (user.basicIncomeRecords || []).length,
        recentRecords: (user.basicIncomeRecords || []).slice(-5).reverse(),
      }
    });

  } catch (error) {
    console.error('Error fetching basic income status:', error);
    return Response.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
