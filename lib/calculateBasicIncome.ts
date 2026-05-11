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

    // 3. Match rules:
    // - If NOT Booster: Paid for only the FIRST pair (₹1000). Every 3rd, 6th, 9th, 12th pair is cut.
    // - If IS Booster: Paid for up to 10 pairs per session (₹1000/pair). No cuts.
    
    let paidPairs = 0;
    let newIncome = 0;
    let grossIncomeVal = 0;
    let description = "";

    if (!user.isBooster) {
      // BASIC PHASE (Up to 12th pair)
      const currentLifetimePairs = user.basicPairs || 0;
      const pairSequenceNumber = currentLifetimePairs + 1;
      const cutLevels = [3, 6, 9, 12];
      const isCutPair = cutLevels.includes(pairSequenceNumber);
      
      paidPairs = 1; // Always max 1 pair for Basic phase
      grossIncomeVal = 1000;
      newIncome = isCutPair ? 0 : 1000;
      description = isCutPair ? `3rd Pair Cut (${sessionType})` : `Basic Income (${sessionType})`;
      
      if (isCutPair) {
        console.log(`✂️ [BASIC CUT] ${user.username}: Pair #${pairSequenceNumber} cut.`);
      }
    } else {
      // BOOSTER PHASE (After 12th pair)
      const today = new Date();
      const existingRecord = user.sessionBasedIncome?.find((s: any) => 
        new Date(s.date || s.sessionDate).toDateString() === today.toDateString() && 
        s.sessionType === sessionType
      );
      
      const pairsAlreadyMatchedInSession = existingRecord?.pairs || 0;
      const remainingLimit = Math.max(0, 10 - pairsAlreadyMatchedInSession);
      
      paidPairs = Math.min(pairsInSession, remainingLimit);
      grossIncomeVal = paidPairs * 1000;
      newIncome = grossIncomeVal;
      description = `Booster Binary Income (${sessionType})`;
      
      console.log(`🚀 [BOOSTER BINARY] ${user.username}: matched ${paidPairs} NEW pairs (Total session: ${pairsAlreadyMatchedInSession + paidPairs}).`);
      
      if (paidPairs === 0 && pairsInSession > 0 && remainingLimit === 0) {
        console.log(`⏳ [BOOSTER CAP] ${user.username}: Session limit of 10 reached. ${pairsInSession} pairs flashed.`);
        if (user.sessionTeam) {
          user.sessionTeam.left = 0;
          user.sessionTeam.right = 0;
        }
        return { success: true, income: 0, pairs: 0, message: "Session limit reached" };
      }
    }

    // 4. Update session history / records
    if (!user.sessionBasedIncome) user.sessionBasedIncome = [];

    const today = new Date();
    let sessionRecord = user.sessionBasedIncome.find((s: any) => 
      new Date(s.date || s.sessionDate).toDateString() === today.toDateString() && 
      s.sessionType === sessionType
    );

    if (sessionRecord) {
      if (sessionRecord.processed && !user.isBooster) {
         return { success: true, income: 0, pairs: 0, message: "Session already processed" };
      }
      
      sessionRecord.pairs = (sessionRecord.pairs || 0) + paidPairs;
      sessionRecord.netIncome = (sessionRecord.netIncome || 0) + newIncome;
      sessionRecord.grossIncome = (sessionRecord.grossIncome || 0) + grossIncomeVal;
      sessionRecord.processed = true;
      
      user.basicIncome = (user.basicIncome || 0) + newIncome;
      user.basicPairs = (user.basicPairs || 0) + paidPairs;
      
      if (user.sessionTeam) {
        user.sessionTeam.left = Math.max(0, (user.sessionTeam.left || 0) - pairsInSession);
        user.sessionTeam.right = Math.max(0, (user.sessionTeam.right || 0) - pairsInSession);
      }
    } else {
      user.sessionBasedIncome.push({
        date: today,
        sessionType: sessionType,
        pairs: paidPairs,
        netIncome: newIncome,
        grossIncome: grossIncomeVal,
        processed: true,
        status: 'Completed'
      });
      
      user.basicIncome = (user.basicIncome || 0) + newIncome;
      user.basicPairs = (user.basicPairs || 0) + paidPairs;
      
      if (user.sessionTeam) {
        user.sessionTeam.left = Math.max(0, (user.sessionTeam.left || 0) - pairsInSession);
        user.sessionTeam.right = Math.max(0, (user.sessionTeam.right || 0) - pairsInSession);
      }
    }

    // Update basicIncomeRecords for display
    user.basicIncomeRecords = user.sessionBasedIncome.map((s: any, i: number) => ({
      srNo: i + 1,
      amount: s.netIncome || 0,
      pairCount: s.pairs || 0,
      date: s.date || s.sessionDate,
      description: s.netIncome === 0 && s.pairs > 0 ? "3rd Pair Cut" : description,
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