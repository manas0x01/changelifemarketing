import User from "../models/User";
import { checkBoosterQualification } from "./checkBoosterQualification";

/**
 * Calculates basic income based on session matching with flush-out rules.
 * 1 User = 1000 BV
 * 1 Pair (1000L + 1000R) = 1000 Rupees
 * Logic:
 * - Match only within a particular session.
 * - Max 1 pair paid per session (1000 Rs).
 * - All unpaired BV and extra pairs are "flashed out" (removed) at session end.
 */
export async function calculateBasicIncome(user: any, manualSessionType?: string) {
  try {
    const currentHour = new Date().getHours();
    const sessionType = (manualSessionType === "morning" || manualSessionType === "evening")
      ? manualSessionType
      : (currentHour < 12 ? "morning" : "evening");

    // 1. Get joins from this session (stored in sessionTeam)
    const sessionLeft = user.sessionTeam?.left || 0;
    const sessionRight = user.sessionTeam?.right || 0;

    const pairsInSession = Math.min(sessionLeft, sessionRight);

    if (pairsInSession === 0) {
      return { success: true, income: 0, pairs: 0 };
    }

    // ALWAYS max 1 pair paid per session for Basic Income
    let paidPairs = 1;
    let newIncome = 0;
    let grossIncomeVal = 1000;
    let description = "";

    if (!user.isBooster) {
      // BASIC PHASE (Up to 12th pair) - Apply Cuts
      const currentLifetimePairs = user.basicPairs || 0;
      const pairSequenceNumber = currentLifetimePairs + 1;
      const cutLevels = [3, 6, 9, 12];
      const isCutPair = cutLevels.includes(pairSequenceNumber);

      newIncome = isCutPair ? 0 : 1000;
      description = isCutPair ? `Basic Pair #${pairSequenceNumber} Cut (${sessionType})` : `Basic Income (${sessionType})`;

      if (isCutPair) {
        console.log(`✂️ [BASIC CUT] ${user.username}: Pair #${pairSequenceNumber} cut.`);
      }
    } else {
      // BOOSTER PHASE - No more cuts for basic pairs, but still 1 pair cap
      newIncome = 1000;
      description = `Basic Income (${sessionType})`;
      console.log(`🚀 [BOOSTER USER BASIC] ${user.username}: 1 basic pair matched.`);
    }

    // FLASH OUT: In Basic logic, any matching triggers a full flash-out of that session's units
    if (user.sessionTeam) {
      console.log(`💥 [FLASH OUT] ${user.username}: Matching occurred, flashing session team (L:${user.sessionTeam.left}, R:${user.sessionTeam.right} -> 0,0)`);
      user.sessionTeam.left = 0;
      user.sessionTeam.right = 0;
    }

    // 4. Update session history / records
    if (!user.sessionBasedIncome) user.sessionBasedIncome = [];

    const today = new Date();
    const lastTransition = user.lastSessionDate ? new Date(user.lastSessionDate) : new Date(0);
    
    let sessionRecord = user.sessionBasedIncome.find((s: any) => {
      const recDate = new Date(s.date || s.sessionDate);
      return recDate.toDateString() === today.toDateString() && 
             s.sessionType === sessionType &&
             recDate >= lastTransition;
    });

    if (sessionRecord) {
      // Even if already processed, we follow the 1-pair cap. 
      // If a match happens later in the same session, it will flash but not pay again.
      if (sessionRecord.processed) {
        if (user.sessionTeam) {
          user.sessionTeam.left = 0;
          user.sessionTeam.right = 0;
        }
        return { success: true, income: 0, pairs: 0, message: "Session already paid/flashed" };
      }

      sessionRecord.pairs = paidPairs;
      sessionRecord.netIncome = newIncome;
      sessionRecord.grossIncome = grossIncomeVal;
      sessionRecord.processed = true;
      sessionRecord.description = description;

      user.basicIncome = (user.basicIncome || 0) + newIncome;
      user.basicPairs = (user.basicPairs || 0) + paidPairs;
    } else {
      user.sessionBasedIncome.push({
        date: today,
        sessionType: sessionType,
        pairs: paidPairs,
        netIncome: newIncome,
        grossIncome: grossIncomeVal,
        processed: true,
        status: 'Completed',
        description: description
      });

      user.basicIncome = (user.basicIncome || 0) + newIncome;
      user.basicPairs = (user.basicPairs || 0) + paidPairs;
    }

    // Update basicIncomeRecords for display
    user.basicIncomeRecords = user.sessionBasedIncome.map((s: any, i: number) => ({
      srNo: i + 1,
      amount: s.netIncome || 0,
      pairCount: s.pairs || 0,
      date: s.date || s.sessionDate,
      description: s.description || (s.netIncome === 0 && s.pairs > 0 ? `Basic Pair Cut` : description),
      status: 'Completed'
    }));

    user.totalIncome = (user.basicIncome || 0) + (user.boosterMatchingIncome || 0) + (user.awardIncome || 0) + (user.repurchaseIncome || 0);

    // 6. Check for Booster Upgrade
    if (!user.isBooster) {
      await checkBoosterQualification(user);
    }

    return {
      success: true,
      income: newIncome,
      pairs: paidPairs
    };

  } catch (error) {
    console.error("Error in calculateBasicIncome:", error);
    return { success: false, error: "Internal Server Error" };
  }
}