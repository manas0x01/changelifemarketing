import User from "@/models/User";

export async function checkBoosterQualification(user: any) {
  if (user.isBooster) {
    return { success: false, message: "Already a booster" };
  }

  if (!Array.isArray(user.boosterCuts)) {
    user.boosterCuts = [];
  }

  //////////////////////////////////////////////////////////////
  // 🔥 CORRECT PAIR COUNT (NOT basicPairs)
  //////////////////////////////////////////////////////////////
  const totalPairs = Math.min(
    user.totalTeam?.left || 0,
    user.totalTeam?.right || 0,
  );

  const cutLevels = [3, 6, 9, 12];
  let newCuts: number[] = [];

  for (const cut of cutLevels) {
    if (totalPairs >= cut && !user.boosterCuts.includes(cut)) {
      user.boosterCuts.push(cut);
      newCuts.push(cut);
    }
  }

  //////////////////////////////////////////////////////////////
  // 🚀 BOOSTER ACTIVATION
  //////////////////////////////////////////////////////////////
  if (user.boosterCuts.length === 4 && !user.isBooster) {
    user.isBooster = true;
    user.boosterAchievedAt = new Date();

    //////////////////////////////////////////////////////////////
    // 🔥 UPDATE PARENT BOOSTER COUNT
    //////////////////////////////////////////////////////////////
    const parent = await User.findById(user.placementId);

    if (parent) {
      if (!parent.boosterCount) {
        parent.boosterCount = { left: 0, right: 0 };
      }

      const position = user.placementPosition as "left" | "right";

      parent.boosterCount[position] += 1;

      await parent.save();
    }

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
