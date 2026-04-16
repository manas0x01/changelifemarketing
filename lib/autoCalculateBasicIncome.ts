import User from '@/models/User';

const INCOME_PER_PAIR = 1000;

export async function autoCalculateBasicIncome(userId: any) {
  try {
    console.log("\n⚪ AUTO-CALC START for:", userId);

    const user = await User.findById(userId);
    if (!user) {
      console.log("❌ User not found");
      return { success: false, message: "User not found" };
    }

    if (user.basicRank === 'unranked' || !user.basicRank) {
      console.log("❌ User not eligible for income");
      return { success: false, message: "User not ranked" };
    }

    const leftCount = user.totalTeam?.left || 0;
    const rightCount = user.totalTeam?.right || 0;

    console.log("📊 Team counts:", { leftCount, rightCount });

    const totalPairs = Math.min(leftCount, rightCount);
    const alreadyMatched = user.matchedPairs || 0;
    const newPairs = totalPairs - alreadyMatched;

    console.log("🔍 Pair calculation:", {
      totalPairs,
      alreadyMatched,
      newPairs,
    });

    if (newPairs <= 0) {
      console.log("❌ No new pairs found");
      return { success: false, message: "No new pairs" };
    }

    const income = newPairs * INCOME_PER_PAIR;

    const incomeRecord = {
      srNo: (user.basicIncomeRecords?.length || 0) + 1,
      amount: income,
      pairCount: newPairs,
      date: new Date(),
      description: `${newPairs} new pair(s) income`,
      status: 'Paid',
    };

    user.basicIncome = (user.basicIncome || 0) + income;
    user.matchedPairs = totalPairs;
    user.basicIncomeRecords = [
      ...(user.basicIncomeRecords || []),
      incomeRecord,
    ];

    await user.save();

    console.log("✅ SUCCESS:", {
      newPairs,
      income,
      totalIncome: user.basicIncome,
      matchedPairs: user.matchedPairs,
    });

    return {
      success: true,
      newPairs,
      income,
      totalIncome: user.basicIncome,
    };
  } catch (error) {
    console.error("❌ ERROR:", error);
    return { success: false, message: String(error) };
  }
}