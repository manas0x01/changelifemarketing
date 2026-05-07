import User from "../models/User";
import { checkBoosterQualification } from "./checkBoosterQualification";

/**
 * Statistically recalculates the basic income based on total team counts and session history.
 * This "Allocation-Based" approach ensures that even if sessions are changed or counts are reset,
 * the income always matches the actual members present in the tree.
 */
export async function calculateBasicIncome(user: any, manualSessionType?: string) {
  try {
    const today = new Date().toDateString();
    const currentHour = new Date().getHours();
    const sessionType = manualSessionType || user.lastSessionType || (currentHour < 12 ? "morning" : "evening");
    const currentSessionKey = `${today}-${sessionType}`;

    // 1. Get the TOTAL pairs currently in the tree
    const totalLeft = user.totalTeam?.left || 0;
    const totalRight = user.totalTeam?.right || 0;
    const totalPairsInTree = Math.min(totalLeft, totalRight);

    if (totalPairsInTree === 0) {
      user.basicIncome = 0;
      user.basicPairs = 0;
      return { success: true, income: 0, currentBasicIncome: 0 };
    }

    // 2. Prepare the session history
    if (!user.sessionBasedIncome) user.sessionBasedIncome = [];

    // Ensure we have enough sessions in history to hold all pairs from the tree
    // CAP: Maximum 12 sessions allowed for basic income (8 paid, 4 skipped = 8000 total)
    const requiredSessions = Math.min(12, Math.max(1, totalPairsInTree));
    while (user.sessionBasedIncome.length < requiredSessions) {
      const lastSession = user.sessionBasedIncome[user.sessionBasedIncome.length - 1];
      let nextType: "morning" | "evening" = "morning";
      let nextDate = new Date();

      if (lastSession) {
        nextType = lastSession.sessionType === "morning" ? "evening" : "morning";
        nextDate = new Date(lastSession.sessionDate);
        if (nextType === "morning") {
          nextDate.setDate(nextDate.getDate() + 1); // Move to next day if we just finished evening
        }
      }

      user.sessionBasedIncome.push({
        sessionDate: nextDate,
        sessionType: nextType,
        leftMembersInSession: 0,
        rightMembersInSession: 0,
        pairsInSession: 0,
        grossIncome: 0,
        netIncome: 0,
        status: 'Completed'
      });
    }

    // 3. ALLOCATE pairs to sessions
    // We distribute the totalPairsInTree across valid sessions (1 pair per session)
    let remainingPairsToAllocate = totalPairsInTree;
    let totalIncome = 0;
    let totalPairsCounted = 0;

    // Filter to valid sessions (those that aren't skipped by the %3 rule)
    for (let i = 0; i < user.sessionBasedIncome.length; i++) {
      if (i >= 12) break; // Hard cap at 12 sessions total

      const session = user.sessionBasedIncome[i];
      const sessionNumber = i + 1;

      // Reset this session's values to be recalculated
      session.leftMembersInSession = 0;
      session.rightMembersInSession = 0;
      session.pairsInSession = 0;
      session.grossIncome = 0;
      session.netIncome = 0;

      if (remainingPairsToAllocate > 0) {
        // This session gets 1 pair
        session.leftMembersInSession = 1;
        session.rightMembersInSession = 1;
        session.pairsInSession = 1;
        remainingPairsToAllocate--;

        // Calculate income for this session (Flush Out rule: max 1000 per session, skip every 3rd)
        if (sessionNumber % 3 !== 0) {
          session.grossIncome = 1000;
          session.netIncome = 1000;
          totalIncome += 1000;
          totalPairsCounted += 1;
        }
      }
    }

    // 4. Update the user model
    user.basicIncome = totalIncome;
    user.basicPairs = totalPairsCounted;
    
    // Update basicIncomeRecords for the dashboard history table
    user.basicIncomeRecords = user.sessionBasedIncome.map((s: any, i: number) => ({
      srNo: i + 1,
      amount: s.netIncome || 0,
      pairCount: s.pairsInSession || 0,
      date: s.sessionDate,
      description: `Income from ${s.sessionType} session`,
      status: 'Completed'
    }));

    // Derived values
    user.totalIncome = (user.basicIncome || 0) + (user.boosterMatchingIncome || 0) + (user.awardIncome || 0) + (user.repurchaseIncome || 0);

    // 5. Check for Booster Upgrade
    if (!user.isBooster) {
      await checkBoosterQualification(user);
    }

    return {
      success: true,
      income: totalIncome,
      currentBasicIncome: totalIncome
    };

  } catch (error) {
    console.error("Error in calculateBasicIncome:", error);
    return { success: false, error: "Internal Server Error" };
  }
}