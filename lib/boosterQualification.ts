export function checkBoosterQualification(user: any) {
  const totalPairs = user.matchedPairs || 0;

  const cutMilestones = [3, 6, 9, 12];
  const alreadyCut = user.boosterCuts || [];

  let newCuts: number[] = [];

  for (const cut of cutMilestones) {
    if (totalPairs >= cut && !alreadyCut.includes(cut)) {
      newCuts.push(cut);
    }
  }

  const updatedCuts = [...alreadyCut, ...newCuts];

  const isBooster = updatedCuts.length === 4;

  return {
    isBooster,
    newCuts,
    updatedCuts
  };
}