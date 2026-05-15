import User from "../models/User";

/**
 * Calculates Booster Level income for a specific session.
 * This is event-driven and should be called when a session transitions.
 */
export async function calculateBoosterIncome(user: any, sessionType: 'morning' | 'evening', manualDate?: Date) {
  try {
    if (!user.isBooster) return { success: false, message: "User is not a booster" };

    const targetDate = manualDate || new Date();
    const today = targetDate.toDateString();

    if (!user.boosterPairsCarryForward) {
      user.boosterPairsCarryForward = { left: 0, right: 0 };
    }

    const carryLeft = user.boosterPairsCarryForward.left || 0;
    const carryRight = user.boosterPairsCarryForward.right || 0;

    const totalPairsMatched = Math.min(carryLeft, carryRight);
    
    if (totalPairsMatched === 0) {
      return { success: true, income: 0, message: "No booster matching available" };
    }

    if (!user.boosterMatchingRecords) user.boosterMatchingRecords = [];
    
    const lastTransition = user.lastSessionDate ? new Date(user.lastSessionDate) : new Date(0);
    let sessionRecord = user.boosterMatchingRecords.find((r: any) => {
      const recDate = new Date(r.date);
      return recDate.toDateString() === today && 
             r.sessionType === sessionType &&
             recDate >= lastTransition;
    });

    const previouslyPaidPairs = sessionRecord ? (sessionRecord.paidPairs || 0) : 0;

    // 3. Calculate how many NEW pairs to pay for (Cap: 10 pairs total per session)
    const currentPaidPairs = Math.min(totalPairsMatched, 10);
    const newPairsToPay = Math.max(0, currentPaidPairs - previouslyPaidPairs);
    const newIncome = newPairsToPay * 1000;

    // 4. Update Wallet and Record
    if (newIncome > 0) {
      user.boosterMatchingIncome = (user.boosterMatchingIncome || 0) + newIncome;
      
      if (sessionRecord) {
        sessionRecord.pairsMatched = totalPairsMatched;
        sessionRecord.paidPairs = currentPaidPairs;
        sessionRecord.grossIncome = (sessionRecord.grossIncome || 0) + newIncome;
        sessionRecord.netIncome = (sessionRecord.netIncome || 0) + newIncome;
        sessionRecord.date = targetDate;
      } else {
        user.boosterMatchingRecords.push({
          srNo: user.boosterMatchingRecords.length + 1,
          date: targetDate,
          sessionType: sessionType,
          pairsMatched: totalPairsMatched,
          paidPairs: currentPaidPairs,
          grossIncome: newIncome,
          netIncome: newIncome,
          status: 'Completed'
        });
      }
      
      console.log(`⚡ [BOOSTER SYNC] ${user.username}: +${newPairsToPay} pairs matched, Credit: ₹${newIncome}`);
      
      // Update Carry Forward (Remove matched pairs)
      user.boosterPairsCarryForward.left -= totalPairsMatched;
      user.boosterPairsCarryForward.right -= totalPairsMatched;
    }

    user.totalIncome = (user.basicIncome || 0) + (user.boosterMatchingIncome || 0) + (user.awardIncome || 0) + (user.repurchaseIncome || 0);

    return {
      success: true,
      income: newIncome,
      pairs: totalPairsMatched
    };

  } catch (error) {
    console.error("Error in calculateBoosterIncome:", error);
    return { success: false, error: "Internal Server Error" };
  }
}

