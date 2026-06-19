import User from "../models/User";
import { checkBoosterQualification } from "./checkBoosterQualification";
import { validateSessionBeforeIncome } from "./sessionValidation";

/**
 * 🔐 CRITICAL RULE: Income ONLY when SAME DAY + SAME SESSION
 * 
 * Examples:
 * ✅ Day 1 Morning + Day 1 Morning = INCOME POSSIBLE
 * ✅ Day 2 Evening + Day 2 Evening = INCOME POSSIBLE
 * ❌ Day 1 Morning + Day 2 Morning = NO INCOME (different days)
 * ❌ Day 1 Morning + Day 1 Evening = NO INCOME (different sessions)
 * 
 * Calculates basic income based on session matching with flush-out rules.
 * 1 User = 1000 BV
 * 1 Pair (1000L + 1000R) = 1000 Rupees
 * Logic:
 * - Match only within a particular session.
 * - Max 1 pair paid per session (1000 Rs).
 * - All unpaired BV and extra pairs are "flashed out" (removed) at session end.
 */
export async function calculateBasicIncome(user: any, manualSessionType?: string, manualDate?: Date) {
  try {
    const now = new Date();
    const currentHour = now.getHours();
    
    // Determine the session type for the operation:
    // If manualSessionType is provided, use it.
    // Otherwise, use the current hour: 0-11 = morning, 12-23 = evening.
    const sessionType: "morning" | "evening" = manualSessionType ? (manualSessionType as any) : (currentHour < 12 ? "morning" : "evening");

    // Define the date for the session record
    const sessionDate = manualDate || new Date();
    
    // 1. Get joins from this session (stored in sessionTeam)
    const sessionLeft = user.sessionTeam?.left || 0;
    const sessionRight = user.sessionTeam?.right || 0;

    const pairsInSession = Math.min(sessionLeft, sessionRight);

    if (pairsInSession === 0) {
      return { success: true, income: 0, pairs: 0 };
    }

    // � CRITICAL VALIDATION: Ensure same day + same session before generating income
    const validationResult = validateSessionBeforeIncome(
      user.username,
      sessionLeft,
      sessionRight,
      user.joiningDate,
      user.lastSessionDate,
      user.lastSessionType
    );

    if (!validationResult.valid) {
      console.error(`❌ [INCOME BLOCKED] ${user.username}: ${validationResult.reason}`);
      return {
        success: false,
        income: 0,
        pairs: 0,
        reason: `Income calculation blocked: ${validationResult.reason}. Rule: SAME DAY + SAME SESSION ONLY.`
      };
    }

    // �🔧 AUDIT LOG: Log when pairs are being matched
    console.log(`[BASIC INCOME] ${user.username}: Matching ${pairsInSession} pairs from sessionTeam (L:${sessionLeft}, R:${sessionRight}) on ${sessionDate.toISOString().split('T')[0]} ${sessionType}`);
    console.log(`[BASIC INCOME] User history: Total pairs=${user.basicPairs || 0}, Total income=₹${user.basicIncome || 0}`);

    // 4. Update session history / records
    if (!user.sessionBasedIncome) user.sessionBasedIncome = [];

    const todayStr = sessionDate.toDateString();
    
    let recordIndex = user.sessionBasedIncome.findIndex((s: any) => {
      const recDate = new Date(s.date || s.sessionDate);
      return recDate.toDateString() === todayStr && s.sessionType === sessionType;
    });

    const isExisting = recordIndex !== -1;
    const sessionIndex = isExisting ? (recordIndex + 1) : (user.sessionBasedIncome.length + 1);

    const cutLevels = [3, 6, 9, 12];
    const isCutSession = !user.isBooster && cutLevels.includes(sessionIndex);

    let paidPairs = 0;
    let newIncome = 0;
    let description = "";

    if (isCutSession) {
      // 3rd, 6th, 9th, 12th session: income is 0, pairs is whatever is in the session (no cap)
      paidPairs = pairsInSession;
      newIncome = 0;
      description = `Basic Session #${sessionIndex} Cut (${sessionType})`;
      console.log(`✂️ [BASIC CUT] ${user.username}: Session #${sessionIndex} is cut.`);
    } else {
      // Normal session or Booster user: capped at 1 pair, ₹1000 income
      paidPairs = 1;
      newIncome = 1000;
      description = `Basic Income (${sessionType})`;
      if (user.isBooster) {
        console.log(`🚀 [BOOSTER USER BASIC] ${user.username}: 1 basic pair matched.`);
      } else {
        console.log(`💵 [BASIC MATCH] ${user.username}: Session #${sessionIndex} matched.`);
      }
    }

    // FLASH OUT: In Basic logic, any matching triggers a full flash-out of that session's units
    if (user.sessionTeam) {
      console.log(`💥 [FLASH OUT] ${user.username}: Matching occurred, flashing session team (L:${user.sessionTeam.left}, R:${user.sessionTeam.right} -> 0,0)`);
      user.sessionTeam.left = 0;
      user.sessionTeam.right = 0;
    }

    let addedPairs = 0;
    let addedIncome = 0;

    if (isExisting) {
      const sessionRecord = user.sessionBasedIncome[recordIndex];

      if (isCutSession) {
        // Cut session: add to pairs, income remains 0
        sessionRecord.pairs = (sessionRecord.pairs || 0) + paidPairs;
        sessionRecord.netIncome = 0;
        sessionRecord.description = description;
        addedPairs = paidPairs;
        addedIncome = 0;
      } else {
        // Normal session: capped at 1 pair, ₹1000 income
        if ((sessionRecord.pairs || 0) >= 1) {
          console.log(`🚫 [BASIC CAP] ${user.username} already processed 1 pair for ${sessionType}. Skipping.`);
          return { success: true, income: 0, pairs: 0 };
        }
        sessionRecord.pairs = 1;
        sessionRecord.netIncome = 1000;
        sessionRecord.description = description;
        addedPairs = 1;
        addedIncome = 1000;
      }
      sessionRecord.processed = true;
      sessionRecord.date = sessionDate;
    } else {
      user.sessionBasedIncome.push({
        date: sessionDate,
        sessionType: sessionType,
        pairs: paidPairs,
        netIncome: newIncome,
        description: description,
        processed: true
      });
      addedPairs = paidPairs;
      addedIncome = newIncome;
    }

    // Recalculate totals from the history list to prevent drift
    user.basicIncome = user.sessionBasedIncome.reduce((sum: number, r: any) => sum + (Number(r.netIncome) || 0), 0);
    user.basicPairs = user.sessionBasedIncome.reduce((sum: number, r: any) => sum + (Number(r.pairs) || 0), 0);

    // Update basicIncomeRecords for display
    user.basicIncomeRecords = user.sessionBasedIncome.map((s: any, i: number) => ({
      srNo: i + 1,
      amount: s.netIncome || 0,
      pairCount: s.pairs || 0,
      date: s.date || s.sessionDate,
      description: s.description || (Number(s.netIncome) === 0 && Number(s.pairs) > 0 ? `Basic Session #${i + 1} Cut` : `Binary Income`),
      status: 'Completed'
    }));

    user.totalIncome = (user.basicIncome || 0) + (user.boosterMatchingIncome || 0) + (user.awardIncome || 0) + (user.repurchaseIncome || 0);

    if (typeof (user as any).markModified === 'function') {
      user.markModified('sessionBasedIncome');
      user.markModified('basicIncomeRecords');
      user.markModified('sessionTeam');
    }

    // 6. Check for Booster Upgrade
    if (!user.isBooster) {
      await checkBoosterQualification(user);
    }

    return {
      success: true,
      income: addedIncome,
      pairs: addedPairs
    };

  } catch (error) {
    console.error("Error in calculateBasicIncome:", error);
    return { success: false, error: "Internal Server Error" };
  }
}