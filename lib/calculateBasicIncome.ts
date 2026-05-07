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
export async function calculateBasicIncome(user: any, sessionType: 'morning' | 'evening') {
  try {
    // 1. Get joins from this session (stored in sessionTeam)
    // In this system, 1 user = 1000 BV. sessionTeam currently stores counts (1, 2, 3...).
    const sessionLeft = user.sessionTeam?.left || 0;
    const sessionRight = user.sessionTeam?.right || 0;

    const sessionLeftBv = sessionLeft * 1000;
    const sessionRightBv = sessionRight * 1000;

    // 2. Calculate pairs in this session
    const pairsInSession = Math.min(sessionLeft, sessionRight);
    
    if (pairsInSession === 0) {
      // No pairs made in this session. 
      // Note: Flush out happens at the end of the session in teamUtils.
      return { success: true, income: 0, pairs: 0 };
    }

    // 3. Match rules for Basic Income:
    // - Paid for only the FIRST pair (1000 Rupees).
    // - Everything else is flashed.
    // - RULE: Every 3rd pair (3, 6, 9, 12) is cut (0 income).
    
    const pairSequenceNumber = (user.basicPairs || 0) + 1;
    const isCutPair = pairSequenceNumber <= 12 && pairSequenceNumber % 3 === 0;
    
    const paidPairs = 1; // Always max 1 pair for Basic
    const newIncome = isCutPair ? 0 : 1000; // 0 if it's a cut session, else 1000

    // 4. Update session history / records
    if (!user.sessionBasedIncome) user.sessionBasedIncome = [];

    const today = new Date();
    
    // Check if we already have a record for this session to avoid double payment
    let sessionRecord = user.sessionBasedIncome.find((s: any) => 
      new Date(s.date || s.sessionDate).toDateString() === today.toDateString() && 
      s.sessionType === sessionType
    );

    if (sessionRecord) {
      // If we already processed this session, don't pay again
      if (sessionRecord.processed) {
        return { success: true, income: 0, pairs: 0, message: "Session already processed" };
      }
      
      // Update existing record
      sessionRecord.pairs = paidPairs;
      sessionRecord.netIncome = newIncome;
      sessionRecord.grossIncome = newIncome;
      sessionRecord.processed = true;
    } else {
      // Create new session record
      user.sessionBasedIncome.push({
        date: today,
        sessionType: sessionType,
        pairs: paidPairs,
        netIncome: newIncome,
        grossIncome: newIncome,
        processed: true,
        status: 'Completed'
      });
    }

    // 5. Update user aggregates
    user.basicIncome = (user.basicIncome || 0) + newIncome;
    user.basicPairs = (user.basicPairs || 0) + paidPairs;

    // Update basicIncomeRecords for display
    user.basicIncomeRecords = user.sessionBasedIncome.map((s: any, i: number) => ({
      srNo: i + 1,
      amount: s.netIncome || 0,
      pairCount: s.pairs || 0,
      date: s.date || s.sessionDate,
      description: s.netIncome === 0 && s.pairs > 0 ? `3rd Pair Cut (${s.sessionType})` : `Income from ${s.sessionType} session`,
      status: 'Completed'
    }));

    user.totalIncome = (user.basicIncome || 0) + (user.boosterMatchingIncome || 0) + (user.awardIncome || 0) + (user.repurchaseIncome || 0);

    // 6. Check for Booster Upgrade
    if (!user.isBooster) {
      await checkBoosterQualification(user);
    }

    if (isCutPair) {
      console.log(`✂️ [BASIC CUT] ${user.username}: Pair #${pairSequenceNumber} cut. Income: ₹0.`);
    } else {
      console.log(`💰 [BASIC INCOME] ${user.username}: Paid 1 pair (₹1000) for ${sessionType} session. (BV: ${sessionLeftBv}L / ${sessionRightBv}R)`);
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