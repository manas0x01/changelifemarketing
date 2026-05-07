import User, { IUser } from "@/models/User";

/**
 * Checks if a user qualifies for Booster status.
 * Logic:
 * - A user becomes a Booster when they match 12 Basic Pairs (12 standard members left + 12 right).
 */
export async function checkBoosterQualification(user: IUser) {
  if (user.isBooster) {
    return { success: false, message: "Already a booster" };
  }

  if (!Array.isArray(user.boosterCuts)) {
    user.boosterCuts = [];
  }

  // Qualification is based on lifetime matched pairs (basicPairs)
  // We use user.basicPairs because totalTeam is subject to session flash-outs.
  const basicPairsMatched = user.basicPairs || 0;

  console.log("🔥 [BOOSTER QUALIFICATION CHECK]", {
    user: user.username,
    basicPairsMatched,
    boosterCuts: user.boosterCuts,
  });
  
  // Cut levels: 3, 6, 9, 12
  const cutLevels = [3, 6, 9, 12];
  let newCuts: number[] = [];

  for (const cut of cutLevels) {
    if (basicPairsMatched >= cut && !user.boosterCuts.includes(cut)) {
      user.boosterCuts.push(cut);
      newCuts.push(cut);
    }
  }

  // Reach 12 basic pairs to upgrade to Booster status
  if (user.boosterCuts.includes(12) && !user.isBooster) {
    user.isBooster = true;
    user.basicRank = "Booster";
    user.boosterAchievedAt = new Date();
    
    console.log("🚀 BOOSTER RANK ACHIEVED (via 12 Basic Pairs):", user.username);
    
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
