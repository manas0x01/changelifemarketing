import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/database";
import User from "@/models/User";

const GROSS_PAIR_INCOME = 1000; // 1 Pair = 1000 rupees
const TDS_PERCENTAGE = 5; // 5% TDS
const SERVICE_CHARGE_PERCENTAGE = 15; // 15% Service Charge
const DAILY_CAP = 2000; // Max ₹2000 per day
const SESSION_CAP = 1000; // Max ₹1000 per 12-hour session
const SESSION_DURATION = 12 * 60 * 60 * 1000; // 12 hours in milliseconds

// Determine which session a timestamp belongs to
function getSessionType(date: Date): 'morning' | 'evening' {
  const hour = date.getHours();
  return hour >= 0 && hour < 12 ? 'morning' : 'evening';
}

// Get session start and end times
function getSessionBoundaries(date: Date): { start: Date; end: Date } {
  const hour = date.getHours();
  const sessionStart = new Date(date);
  const sessionEnd = new Date(date);

  if (hour >= 0 && hour < 12) {
    // Morning session: 12 AM to 12 PM
    sessionStart.setHours(0, 0, 0, 0);
    sessionEnd.setHours(12, 0, 0, 0);
  } else {
    // Evening session: 12 PM to 12 AM (next day)
    sessionStart.setHours(12, 0, 0, 0);
    sessionEnd.setHours(24, 0, 0, 0);
  }

  return { start: sessionStart, end: sessionEnd };
}

// Get today's boundaries (00:00 - 23:59)
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

    // Check rank requirement
    if (user.basicRank === 'unranked' || !user.basicRank) {
      return Response.json({
        success: false,
        message: "User must achieve basic rank to earn basic income",
        data: { currentRank: user.basicRank || 'unranked' }
      }, { status: 403 });
    }

    // Get current session info
    const now = new Date();
    const currentSession = getSessionType(now);
    const { start: sessionStart, end: sessionEnd } = getSessionBoundaries(now);
    const { start: dayStart, end: dayEnd } = getTodayBoundaries();

    // Get direct members added in this session (same timestamp boundaries)
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

    // Calculate pairs only from same session members
    const pairsThisSession = Math.min(
      leftMembersThisSession.length,
      rightMembersThisSession.length
    );

    if (pairsThisSession <= 0) {
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

    // Check daily income cap
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

    // Calculate income for this session
    const grossIncome = pairsThisSession * GROSS_PAIR_INCOME;
    const tdsAmount = (grossIncome * TDS_PERCENTAGE) / 100;
    const serviceChargeAmount = (grossIncome * SERVICE_CHARGE_PERCENTAGE) / 100;
    const netIncome = grossIncome - tdsAmount - serviceChargeAmount;

    // Check session cap
    if (sessionIncomeToday + netIncome > SESSION_CAP) {
      const remainingSessionCap = SESSION_CAP - sessionIncomeToday;
      return Response.json({
        success: false,
        message: `Session cap exceeded. Maximum ₹${SESSION_CAP} per session`,
        data: {
          sessionType: currentSession,
          currentSessionIncome: sessionIncomeToday,
          sessionCap: SESSION_CAP,
          remainingCapacity: remainingSessionCap,
          attemptedIncome: netIncome,
          status: "Session limit reached"
        }
      }, { status: 400 });
    }

    // Check daily cap
    if (todayIncome + netIncome > DAILY_CAP) {
      const remainingDailyCap = DAILY_CAP - todayIncome;
      return Response.json({
        success: false,
        message: `Daily cap exceeded. Maximum ₹${DAILY_CAP} per day`,
        data: {
          todayIncome,
          dailyCap: DAILY_CAP,
          remainingCapacity: remainingDailyCap,
          attemptedIncome: netIncome,
          status: "Daily limit reached"
        }
      }, { status: 400 });
    }

    // Create session income record
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

    // Update user
    const updatedBasicIncome = (user.basicIncome || 0) + netIncome;
    const updatedSessionBasedIncome = [...(user.sessionBasedIncome || []), sessionRecord];

    // Also create basicIncomeRecord for history
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
        breakdown: {
          grossPerPair: GROSS_PAIR_INCOME,
          tdsPerPair: (GROSS_PAIR_INCOME * TDS_PERCENTAGE) / 100,
          serviceChargePerPair: (GROSS_PAIR_INCOME * SERVICE_CHARGE_PERCENTAGE) / 100,
          netPerPair: GROSS_PAIR_INCOME - (GROSS_PAIR_INCOME * (TDS_PERCENTAGE + SERVICE_CHARGE_PERCENTAGE)) / 100,
        },
        totalBreakdown: {
          grossIncome,
          tdsDeducted: tdsAmount,
          serviceChargeDeducted: serviceChargeAmount,
          netIncome,
        },
        currentStatus: {
          basicIncome: updatedBasicIncome,
          sessionIncomeToday: sessionIncomeToday + netIncome,
          dailyIncomeToday: todayIncome + netIncome,
          sessionCap: SESSION_CAP,
          dailyCap: DAILY_CAP,
        },
        sessionDetails: {
          leftMembersInSession: leftMembersThisSession.length,
          rightMembersInSession: rightMembersThisSession.length,
          sessionStart: sessionStart.toISOString(),
          sessionEnd: sessionEnd.toISOString(),
        }
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

// GET endpoint to view status
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
