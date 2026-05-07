import User, { IUser } from "@/models/User";

export async function checkBoosterQualification(user: IUser) {
  if (user.isBooster) {
    console.log("[BOOSTER] Already booster:", user.username);
    return { success: false, message: "Already a booster" };
  }

  if (!Array.isArray(user.boosterCuts)) {
    user.boosterCuts = [];
  }

  const totalLeft = user.totalTeam?.left || 0;
  const totalRight = user.totalTeam?.right || 0;
  const totalPairsInTree = Math.min(totalLeft, totalRight);

  console.log("🔥 [BOOSTER CHECK]", {
    user: user.username,
    totalPairsInTree,
    boosterCuts: user.boosterCuts,
  });
  
  const cutLevels = [3, 6, 9, 12];
  let newCuts: number[] = [];

  for (const cut of cutLevels) {
    if (totalPairsInTree >= cut && !user.boosterCuts.includes(cut)) {
      user.boosterCuts.push(cut);
      newCuts.push(cut);
    }
  }

  if (user.boosterCuts.includes(12) && !user.isBooster) {
    user.isBooster = true;
    user.basicRank = "Booster"; // Update rank for visibility
    user.boosterAchievedAt = new Date();
    console.log("🚀 BOOSTER ACTIVATED:", user.username);
    console.log("📊 FINAL STATE:", {
      pairs: totalPairsInTree,
      cuts: user.boosterCuts,
      rank: user.basicRank
    });

    return {
      success: true,
      isBooster: true,
      message: "🎉 User is now a Booster",
      cutsAchieved: user.boosterCuts,
    };
  }


  return {
    success: true,
    isBooster: false,
    newCuts,
    totalCuts: user.boosterCuts,
    message: "Booster progress updated",
  };
}