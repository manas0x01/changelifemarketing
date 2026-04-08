import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/database";
import User from "@/models/User";

const BOOSTER_QUALIFICATION_PAIRS = 12; // Need 12 pairs to become booster
const COMPANY_CUT_PAIRS = [3, 6, 9, 12]; // Cut income at these pair milestones
const GROSS_PAIR_INCOME = 1000; // ₹1000 per pair
const TDS_PERCENTAGE = 5; // 5% TDS
const SERVICE_CHARGE_PERCENTAGE = 15; // 15% Service Charge
const BASIC_DAILY_CAP = 2000; // ₹2,000 basic income per day
const BOOSTER_DAILY_CAP = 20000; // ₹20,000 booster matching per day
const TOTAL_DAILY_CAP = 22000; // ₹22,000 total per day
const SESSION_CAP = 10000; // ₹10,000 per 12-hour session (10 pairs max)
const SESSION_PAIR_LIMIT = 10; // Max 10 pairs per session

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

    // Step 1: Check if user should become a booster (12 basic income pairs completed)
    const basicIncomeRecords = user.basicIncomeRecords || [];
    const totalBasicPairs = basicIncomeRecords.reduce((sum, r) => sum + (r.pairCount || 0), 0);

    const boosterStatus = user.boosterStatus || {
      isBoosterLeft: false,
      isBoosterRight: false,
      pairsCompletedLeft: 0,
      pairsCompletedRight: 0,
    };

    let boosterQualified = false;
    let qualificationSide = null;

    // Check left side qualification
    if (!boosterStatus.isBoosterLeft && totalBasicPairs >= BOOSTER_QUALIFICATION_PAIRS) {
      boosterStatus.isBoosterLeft = true;
      boosterStatus.boosterQualificationDateLeft = new Date();
      boosterStatus.pairsCompletedLeft = totalBasicPairs;
      boosterQualified = true;
      qualificationSide = 'left';
    }

    // For right side, we need to check team hierarchy
    // For now, assuming right becomes booster when left has formed 12 pairs in tree
    if (!boosterStatus.isBoosterRight && totalBasicPairs >= BOOSTER_QUALIFICATION_PAIRS) {
      boosterStatus.isBoosterRight = true;
      boosterStatus.boosterQualificationDateRight = new Date();
      boosterStatus.pairsCompletedRight = totalBasicPairs;
      boosterQualified = true;
      qualificationSide = 'right';
    }

    if (!boosterQualified && !boosterStatus.isBoosterLeft && !boosterStatus.isBoosterRight) {
      return Response.json({
        success: true,
        message: "Not yet qualified for booster status",
        data: {
          pairsCompleted: totalBasicPairs,
          pairsNeeded: BOOSTER_QUALIFICATION_PAIRS,
          pairsRemaining: Math.max(0, BOOSTER_QUALIFICATION_PAIRS - totalBasicPairs),
          boosterStatus: {
            isBoosterLeft: false,
            isBoosterRight: false,
          }
        }
      });
    }

    // Step 2: Calculate booster matching income if both sides are booster
    let matchingIncome = 0;

    if (boosterStatus.isBoosterLeft && boosterStatus.isBoosterRight) {
      // Both sides are booster - calculate matching pairs
      const now = new Date();
      const currentSession = getSessionType(now);
      const { start: sessionStart, end: sessionEnd } = getSessionBoundaries(now);
      const { start: dayStart, end: dayEnd } = getTodayBoundaries();

      // ═══════════════════════════════════════════════════════════════════════
      // CARRY-FORWARD LOGIC (Matched Pairs from Previous Sessions)
      // Only pairs that were waiting for opposite side completion carry forward
      // ═══════════════════════════════════════════════════════════════════════
      const carryForwardRecords = user.boosterCarryForward || [];
      const currentSessionCarryForward = carryForwardRecords
        .filter(cf => cf.sessionType === currentSession)
        .reduce((sum, cf) => sum + (cf.pairsCarried || 0), 0);

      // ═══════════════════════════════════════════════════════════════════════
      // MATCHING PAIRS CALCULATION
      // In real scenario: calculate from left/right downline booster counts
      // For now: assume new matching available + carry-forward pairs
      // But capped at SESSION_PAIR_LIMIT (10 pairs per session)
      // ═══════════════════════════════════════════════════════════════════════
      const newMatchingPairsThisSession = 1; // Example: 1 new pair available this session
      const totalMatchingPairsAvailable = newMatchingPairsThisSession + currentSessionCarryForward;
      
      // Apply session limit: MAX 10 pairs per session
      const matchingPairs = Math.min(totalMatchingPairsAvailable, SESSION_PAIR_LIMIT);
      
      // ═══════════════════════════════════════════════════════════════════════
      // FLUSH-OUT LOGIC (Pairs Beyond Session Limit)
      // Any pairs beyond SESSION_PAIR_LIMIT are PERMANENTLY DELETED (not carried)
      // Only matched pairs from PREVIOUS sessions waiting for opposite side carry forward
      // ═══════════════════════════════════════════════════════════════════════
      const flushedPairsThisSession = Math.max(0, totalMatchingPairsAvailable - SESSION_PAIR_LIMIT);
      
      // New unmatched pairs that cannot fit in session are FLUSHED (never carried)
      // Carry-forward only happens for MATCHED pairs waiting from previous session
      const carryForwardToNextSession = flushedPairsThisSession === 0 
        ? Math.max(0, totalMatchingPairsAvailable - matchingPairs)
        : 0; // If pairs are flushed, don't carry forward new pairs

      // Calculate income
      const grossIncome = matchingPairs * GROSS_PAIR_INCOME;
      const tdsAmount = (grossIncome * TDS_PERCENTAGE) / 100;
      const serviceChargeAmount = (grossIncome * SERVICE_CHARGE_PERCENTAGE) / 100;
      const netIncome = grossIncome - tdsAmount - serviceChargeAmount;

      // Check booster daily cap
      const todayBoosterMatching = (user.boosterMatchingRecords || [])
        .filter(m => m.date >= dayStart && m.date <= dayEnd)
        .reduce((sum, m) => sum + (m.netIncome || 0), 0);

      // Check TOTAL daily cap (Basic + Booster = ₹22,000)
      const todayBasicIncome = (user.sessionBasedIncome || [])
        .filter(s => s.sessionDate >= dayStart && s.sessionDate <= dayEnd)
        .reduce((sum, s) => sum + (s.netIncome || 0), 0);

      const totalTodayIncome = todayBasicIncome + todayBoosterMatching;

      if (todayBoosterMatching + netIncome > BOOSTER_DAILY_CAP) {
        const remainingBoosterCap = BOOSTER_DAILY_CAP - todayBoosterMatching;
        return Response.json({
          success: false,
          message: "Booster daily cap exceeded (₹20,000)",
          data: {
            boosterIncomeToday: todayBoosterMatching,
            boosterDailyCap: BOOSTER_DAILY_CAP,
            remainingBoosterCapacity: remainingBoosterCap,
          }
        }, { status: 400 });
      }

      if (totalTodayIncome + netIncome > TOTAL_DAILY_CAP) {
        const remainingTotalCap = TOTAL_DAILY_CAP - totalTodayIncome;
        return Response.json({
          success: false,
          message: "Total daily cap exceeded (₹22,000 = Basic ₹2K + Booster ₹20K)",
          data: {
            basicIncomeToday: todayBasicIncome,
            boosterIncomeToday: todayBoosterMatching,
            totalIncomeToday: totalTodayIncome,
            totalDailyCap: TOTAL_DAILY_CAP,
            remainingTotalCapacity: remainingTotalCap,
          }
        }, { status: 400 });
      }

      // Create matching record
      const matchingRecord = {
        srNo: ((user.boosterMatchingRecords || []).length || 0) + 1,
        date: now,
        fromLeftBoosterId: user.username,
        fromLeftBoosterName: user.fullName,
        fromRightBoosterId: user.username,
        fromRightBoosterName: user.fullName,
        pairsMatched: matchingPairs,
        grossIncome,
        carryForwardPairs: carryForwardToNextSession, // Pairs waiting for next session
        sessionType: currentSession,
        tdsDeducted: tdsAmount,
        serviceChargeDeducted: serviceChargeAmount,
        netIncome,
        status: 'Completed' as const,
      };

      matchingIncome = netIncome;
      user.boosterMatchingIncome = (user.boosterMatchingIncome || 0) + netIncome;
      user.boosterMatchingRecords = [...(user.boosterMatchingRecords || []), matchingRecord];

      // Remove used carry-forward records from current session
      if (currentSessionCarryForward > 0) {
        user.boosterCarryForward = carryForwardRecords.filter(cf => 
          !(cf.sessionType === currentSession)
        );
      }

      // Add new carry-forward if applicable (matched pairs waiting for opposite side)
      if (carryForwardToNextSession > 0) {
        const nextSessionType = currentSession === 'morning' ? 'evening' : 'morning';
        (user.boosterCarryForward || []).push({
          date: now,
          sessionType: nextSessionType,
          pairsCarried: carryForwardToNextSession,
          reason: `Waiting pairs for opposite side completion (${matchingPairs} matched in ${currentSession}, ${carryForwardToNextSession} waiting)`,
        });
      }

      // Log flushed pairs details
      if (flushedPairsThisSession > 0) {
        console.log(`📌 FLUSH-OUT: ${flushedPairsThisSession} pairs permanently deleted for ${user.username} (exceeded ${SESSION_PAIR_LIMIT} pair limit in ${currentSession} session)`);
      }
    }

    // Step 3: Apply company cuts if newly qualified
    let cutsApplied = 0;
    if (boosterQualified) {
      // Company cuts 4 pairs out of 12 (pairs 3, 6, 9, 12)
      cutsApplied = COMPANY_CUT_PAIRS.length; // 4 pairs cut
    }

    user.boosterStatus = boosterStatus;
    await user.save();

    return Response.json({
      success: true,
      message: boosterQualified 
        ? `Booster ${qualificationSide} status activated! ${cutsApplied} pairs deducted by company`
        : "Booster matching processed",
      data: {
        boosterStatus: {
          isBoosterLeft: boosterStatus.isBoosterLeft,
          isBoosterRight: boosterStatus.isBoosterRight,
          qualificationDateLeft: boosterStatus.boosterQualificationDateLeft,
          qualificationDateRight: boosterStatus.boosterQualificationDateRight,
        },
        qualificationDetails: boosterQualified ? {
          pairsCompleted: totalBasicPairs,
          companyCutPairs: COMPANY_CUT_PAIRS,
          cutsApplied,
          netPairsAfterCut: BOOSTER_QUALIFICATION_PAIRS - cutsApplied,
          status: `Now Booster ${qualificationSide}!`
        } : null,
        matchingIncome: {
          earnedThisSession: matchingIncome,
          totalBoosterMatchingIncome: user.boosterMatchingIncome,
        },
        pairManagement: {
          sessionLimit: SESSION_PAIR_LIMIT,
          explanation: "Max 10 pairs per 12-hour session",
          flushOutLogic: "Pairs beyond 10-pair limit are PERMANENTLY DELETED (not carried forward)",
          carryForwardLogic: "Only MATCHED pairs waiting for opposite side completion carry to next session",
        },
        dailyCaps: {
          basicIncome: BASIC_DAILY_CAP,
          boosterMatching: BOOSTER_DAILY_CAP,
          totalCombined: TOTAL_DAILY_CAP,
          note: "If Basic + Booster > ₹22,000, transaction rejected"
        }
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Error processing booster:', error);
    return Response.json(
      { success: false, message: "Internal server error", error: String(error) },
      { status: 500 }
    );
  }
}

// GET endpoint to view booster status
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

    const boosterStatus = user.boosterStatus || {
      isBoosterLeft: false,
      isBoosterRight: false,
      pairsCompletedLeft: 0,
      pairsCompletedRight: 0,
    };

    const basicPairs = (user.basicIncomeRecords || []).reduce((sum, r) => sum + (r.pairCount || 0), 0);
    const now = new Date();
    const { start: dayStart, end: dayEnd } = getTodayBoundaries();

    const todayMatchingIncome = (user.boosterMatchingRecords || [])
      .filter(m => m.date >= dayStart && m.date <= dayEnd)
      .reduce((sum, m) => sum + (m.netIncome || 0), 0);

    const carryForwardTotal = (user.boosterCarryForward || [])
      .reduce((sum, cf) => sum + (cf.pairsCarried || 0), 0);

    return Response.json({
      success: true,
      data: {
        userInfo: {
          username: user.username,
          basicIncome: user.basicIncome,
        },
        boosterStatus: {
          isBoosterLeft: boosterStatus.isBoosterLeft,
          isBoosterRight: boosterStatus.isBoosterRight,
          qualificationDateLeft: boosterStatus.boosterQualificationDateLeft,
          qualificationDateRight: boosterStatus.boosterQualificationDateRight,
        },
        qualificationProgress: {
          basicPairsCompleted: basicPairs,
          pairsNeeded: BOOSTER_QUALIFICATION_PAIRS,
          progress: `${basicPairs}/${BOOSTER_QUALIFICATION_PAIRS}`,
          canQualify: basicPairs >= BOOSTER_QUALIFICATION_PAIRS,
        },
        boosterIncome: {
          totalMatchingIncome: user.boosterMatchingIncome || 0,
          todayMatchingIncome,
          boosterDailyCap: BOOSTER_DAILY_CAP,
          remainingBoosterCapacity: BOOSTER_DAILY_CAP - todayMatchingIncome,
          basicIncomeToday: basicPairs * GROSS_PAIR_INCOME, // Approximate
          totalDailyCap: TOTAL_DAILY_CAP,
          remainingTotalCapacity: TOTAL_DAILY_CAP - (todayMatchingIncome + (basicPairs * 800)),
        },
        carryForward: {
          totalPairsCarried: carryForwardTotal,
          details: user.boosterCarryForward || [],
        },
        recentRecords: (user.boosterMatchingRecords || []).slice(-5).reverse(),
      }
    });

  } catch (error) {
    console.error('Error fetching booster status:', error);
    return Response.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
