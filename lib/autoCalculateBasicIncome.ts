import User from "@/models/User";
import { checkBoosterQualification } from "@/lib/boosterQualification";
const INCOME_PER_PAIR = 1000;

export async function autoCalculateBasicIncome(userId: any) {
  try {
    console.log("\n⚪ AUTO-CALC START for:", userId);

    const user = await User.findById(userId);
    if (!user) {
      console.log("❌ User not found");
      return { success: false, message: "User not found" };
    }

    if (user.basicRank === "unranked" || !user.basicRank) {
      console.log("❌ User not eligible for income");
      return { success: false, message: "User not ranked" };
    }

    const leftCount = user.totalTeam?.left || 0;
    const rightCount = user.totalTeam?.right || 0;

    console.log("📊 Team counts:", { leftCount, rightCount });

    const totalPairs = Math.min(leftCount, rightCount);
    const boosterResult = checkBoosterQualification(user);
    if (boosterResult.newCuts.length > 0) {
      user.boosterCuts = boosterResult.updatedCuts;

      console.log("✂️ Booster cuts applied:", boosterResult.newCuts);
    }

    if (boosterResult.isBooster && !user.boosterEnabled) {
      console.log("🚀 USER BECAME BOOSTER");

      user.boosterEnabled = true;
      user.boosterAchievedAt = new Date();
    }
    const alreadyMatched = user.matchedPairs || 0;
    const newPairs = totalPairs - alreadyMatched;

    if (totalPairs >= 12 && !user.isBooster) {
      console.log("🚀 User became BOOSTER!");

      user.isBooster = true;

      user.boosterAchievedAt = new Date();

      await user.save();

      if (user.sponsorId) {
        const parent = await User.findOne({
          $or: [{ username: user.sponsorId }, { userId: user.sponsorId }],
        });

        if (parent) {
          const position = user.placementPosition === "left" ? "left" : "right";

          if (!parent.boosterCount) {
            parent.boosterCount = { left: 0, right: 0 };
          }

          parent.boosterCount[position] =
            (parent.boosterCount[position] || 0) + 1;

          await parent.save();

          console.log(`🔥 Booster added to parent ${position} side`);
        }
      }
    }

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
      status: "Paid",
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
