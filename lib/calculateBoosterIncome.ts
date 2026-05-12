import User from "../models/User";

/**
 * Calculates Booster Level income for a specific session.
 * This is event-driven and should be called when a session transitions.
 */
export async function calculateBoosterIncome(user: any, sessionType: 'morning' | 'evening') {
  try {
    if (!user.isBooster) return { success: false, message: "User is not a booster" };

    // 1. Get current session context
    const today = new Date().toDateString();
    const sessionKey = `${today}-${sessionType}`;

    // 2. Get new joins from this session (stored in sessionTeam)
    const newLeft = user.sessionTeam?.left || 0;
    const newRight = user.sessionTeam?.right || 0;

    // 3. Get carry forward from previous sessions
    if (!user.boosterPairsCarryForward) {
      user.boosterPairsCarryForward = { left: 0, right: 0 };
    }
    const carryLeft = user.boosterPairsCarryForward.left || 0;
    const carryRight = user.boosterPairsCarryForward.right || 0;

    // 4. Calculate total members available for matching in this session
    const totalLeft = carryLeft + newLeft;
    const totalRight = carryRight + newRight;
    const totalPairsMatched = Math.min(totalLeft, totalRight);
    
    if (totalPairsMatched === 0 && newLeft === 0 && newRight === 0) {
      return { success: true, income: 0, message: "No activity" };
    }

    // 5. Find or create the record for the CURRENT session to track progress
    if (!user.boosterMatchingRecords) user.boosterMatchingRecords = [];
    
    const lastTransition = user.lastSessionDate ? new Date(user.lastSessionDate) : new Date(0);
    let sessionRecord = user.boosterMatchingRecords.find((r: any) => {
      const recDate = new Date(r.date);
      return recDate.toDateString() === today && 
             r.sessionType === sessionType &&
             recDate >= lastTransition;
    });

    const previouslyPaidPairs = sessionRecord ? (sessionRecord.paidPairs || 0) : 0;

    // 6. Calculate how many NEW pairs to pay for (Cap: 10 pairs total per session)
    const currentPaidPairs = Math.min(totalPairsMatched, 10);
    const newPairsToPay = Math.max(0, currentPaidPairs - previouslyPaidPairs);
    const newIncome = newPairsToPay * 1000;

    if (newIncome === 0 && !sessionRecord) {
       // If no income but it's a new session, we don't necessarily need a record yet 
       // unless we want to track the carry forward state.
    }

    // 7. Update Wallet and Record
    if (newIncome > 0) {
      user.boosterMatchingIncome = (user.boosterMatchingIncome || 0) + newIncome;
      
      if (sessionRecord) {
        // Update existing session record
        sessionRecord.pairsMatched = totalPairsMatched;
        sessionRecord.paidPairs = currentPaidPairs;
        sessionRecord.grossIncome = (sessionRecord.grossIncome || 0) + newIncome;
        sessionRecord.netIncome = (sessionRecord.netIncome || 0) + newIncome;
        sessionRecord.date = new Date(); // Update timestamp to last matching
      } else {
        // Create new session record
        user.boosterMatchingRecords.push({
          srNo: user.boosterMatchingRecords.length + 1,
          date: new Date(),
          sessionType: sessionType,
          pairsMatched: totalPairsMatched,
          paidPairs: currentPaidPairs,
          grossIncome: newIncome,
          netIncome: newIncome,
          status: 'Completed'
        });
      }
      
      console.log(`⚡ [BOOSTER INSTANT] ${user.username}: +${newPairsToPay} pairs, Credit: ₹${newIncome} (Session Total: ${currentPaidPairs}/10)`);
    }

    // 8. Update Carry Forward (Stock Side)
    // IMPORTANT: This is a preview of the carry forward. 
    // The final carry forward is only "locked in" when the session actually ends.
    const previewCarryLeft = Math.max(0, totalLeft - totalPairsMatched);
    const previewCarryRight = Math.max(0, totalRight - totalPairsMatched);
    
    user.boosterPairsCarryForward = {
      left: previewCarryLeft,
      right: previewCarryRight
    };

    // Update total income
    user.totalIncome = (user.basicIncome || 0) + (user.boosterMatchingIncome || 0) + (user.awardIncome || 0) + (user.repurchaseIncome || 0);

    return {
      success: true,
      income: newIncome,
      totalSessionIncome: currentPaidPairs * 1000,
      pairs: totalPairsMatched,
      paidInThisUpdate: newPairsToPay
    };

  } catch (error) {
    console.error("Error in calculateBoosterIncome:", error);
    return { success: false, error: "Internal Server Error" };
  }
}

