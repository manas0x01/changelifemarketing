import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/database";
import User from "@/models/User";

const AWARD_RANKS = {
  1: { leftRequired: 5, rightRequired: 5, awardName: 'Bag + Business Kit', awardValue: 0 },
  2: { leftRequired: 10, rightRequired: 10, awardName: 'Smart Watch', awardValue: 0 },
  3: { leftRequired: 25, rightRequired: 25, awardName: 'Suit Length', awardValue: 0 },
  4: { leftRequired: 50, rightRequired: 50, awardName: 'Mixi-Grinder', awardValue: 0 },
  5: { leftRequired: 100, rightRequired: 100, awardName: 'Fridge (Refrigerator)', awardValue: 0 },
  6: { leftRequired: 200, rightRequired: 200, awardName: 'Mobile', awardValue: 0 },
  7: { leftRequired: 500, rightRequired: 500, awardName: 'Laptop', awardValue: 0 },
  8: { leftRequired: 1000, rightRequired: 1000, awardName: 'Bike', awardValue: 0 },
  9: { leftRequired: 2000, rightRequired: 2000, awardName: '1.5 Lakh Gift', awardValue: 150000 },
  10: { leftRequired: 4000, rightRequired: 4000, awardName: '2.5 Lakh Gift', awardValue: 250000 },
  11: { leftRequired: 8000, rightRequired: 8000, awardName: '5 Lakh ₹', awardValue: 500000 },
  12: { leftRequired: 16000, rightRequired: 16000, awardName: '7.5 Lakh ₹', awardValue: 750000 },
  13: { leftRequired: 32000, rightRequired: 32000, awardName: '10 Lakh ₹', awardValue: 1000000 },
};

const RANK_NAMES = {
  1: 'Gold',
  2: 'Super Gold',
  3: 'Gold Star',
  4: 'Pearl ex',
  5: 'Emerald',
  6: 'Ruby',
  7: 'Platinum',
  8: 'Diamond',
  9: 'Double Diamond',
  10: 'Black Diamond',
  11: 'Blue Diamond',
  12: 'Royal Diamond',
  13: 'Crown Diamond',
};

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.username) {
      return Response.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const user = await User.findOne({ username: session.user.username });

    if (!user) {
      return Response.json({ success: false, message: "User not found" }, { status: 404 });
    }

    // Step 1: Check if user is booster on BOTH sides
    const boosterStatus = user.boosterStatus || {
      isBoosterLeft: false,
      isBoosterRight: false,
    };

    if (!boosterStatus.isBoosterLeft || !boosterStatus.isBoosterRight) {
      return Response.json({
        success: false,
        message: "Must be booster on both sides (Left & Right) to qualify for award ranks",
        data: {
          boosterStatusLeft: boosterStatus.isBoosterLeft,
          boosterStatusRight: boosterStatus.isBoosterRight,
        }
      }, { status: 400 });
    }

    // Step 2: Get booster matching records and calculate total pairs
    const boosterMatchingRecords = user.boosterMatchingRecords || [];
    const totalBoosterPairs = boosterMatchingRecords.reduce((sum, r) => sum + (r.pairsMatched || 0), 0);

    // Step 3: Get current award rank status
    let currentRank = user.currentAwardRank || 0;
    const awardRankStatus = user.awardRankStatus || {
      rank: 0,
      leftBoostersForRank: 0,
      rightBoostersForRank: 0,
    };

    // Step 4: Check which ranks can be achieved
    const previousRank = currentRank;
    const rankProgressions = [];

    // Check Rank 1 to 13 progression
    for (let rankNum = 1; rankNum <= 13; rankNum++) {
      // Skip if already achieved
      if (rankNum <= currentRank) continue;

      const rankRequirements = AWARD_RANKS[rankNum as keyof typeof AWARD_RANKS];
      if (!rankRequirements) break;

      // Calculate total pairs needed for this rank (cumulative L+R)
      const totalPairsNeeded = rankRequirements.leftRequired + rankRequirements.rightRequired;

      if (totalBoosterPairs >= totalPairsNeeded) {
        rankProgressions.push({
          rank: rankNum,
          rankName: RANK_NAMES[rankNum as keyof typeof RANK_NAMES],
          achieved: true,
          reason: `Total booster pairs (${totalBoosterPairs}) >= ${totalPairsNeeded} required for Rank ${rankNum}`,
          leftRequired: rankRequirements.leftRequired,
          rightRequired: rankRequirements.rightRequired,
        });
      } else {
        rankProgressions.push({
          rank: rankNum,
          rankName: RANK_NAMES[rankNum as keyof typeof RANK_NAMES],
          achieved: false,
          pairsNeeded: totalPairsNeeded,
          pairsHave: totalBoosterPairs,
          pairsRemaining: totalPairsNeeded - totalBoosterPairs,
          leftRequired: rankRequirements.leftRequired,
          rightRequired: rankRequirements.rightRequired,
        });
        break; // Stop checking further ranks
      }
    }

    // Step 5: If any new ranks achieved, update user record
    let newRankAchieved = false;
    const awardRankRecords = user.awardRankRecords || [];

    if (rankProgressions.length > 0) {
      const latestProgression = rankProgressions[rankProgressions.length - 1];
      
      if (latestProgression.achieved && latestProgression.rank > currentRank) {
        newRankAchieved = true;
        const targetRank = latestProgression.rank;
        const rankData = AWARD_RANKS[targetRank as keyof typeof AWARD_RANKS];

        // Create award record
        const awardRecord = {
          srNo: (awardRankRecords.length || 0) + 1,
          rank: targetRank,
          rankName: RANK_NAMES[targetRank as keyof typeof RANK_NAMES],
          achievedDate: new Date(),
          leftBoostersUsed: rankData.leftRequired,
          rightBoostersUsed: rankData.rightRequired,
          awardName: rankData.awardName,
          awardValue: rankData.awardValue || 0,
          status: 'Awarded' as const,
        };

        // Update user
        user.currentAwardRank = targetRank;
        user.awardRankStatus = {
          rank: targetRank,
          leftBoostersForRank: rankData.leftRequired,
          rightBoostersForRank: rankData.rightRequired,
          achievementDate: new Date(),
          awardReceivedName: rankData.awardName,
        };
        user.awardRankRecords = [...awardRankRecords, awardRecord];

        // Add to award income records as well
        const awardIncomeRecords = user.awardIncomeRecords || [];
        awardIncomeRecords.push({
          srNo: (awardIncomeRecords.length || 0) + 1,
          amount: rankData.awardValue || 0,
          awardName: `${RANK_NAMES[targetRank as keyof typeof RANK_NAMES]} - ${rankData.awardName}`,
          date: new Date(),
          description: `Award received for achieving Rank ${targetRank}`,
          status: 'Completed',
        });
        user.awardIncomeRecords = awardIncomeRecords;

        await user.save();
      }
    }

    // Determine next rank requirements
    const nextRank = currentRank + 1;
    let nextRankRequirements = null;
    
    if (nextRank <= 13) {
      const nextRankData = AWARD_RANKS[nextRank as keyof typeof AWARD_RANKS];
      if (nextRankData) {
        const totalPairsNeededForNext = nextRankData.leftRequired + nextRankData.rightRequired;

        nextRankRequirements = {
          rank: nextRank,
          rankName: RANK_NAMES[nextRank as keyof typeof RANK_NAMES],
          leftRequired: nextRankData.leftRequired,
          rightRequired: nextRankData.rightRequired,
          awardName: nextRankData.awardName,
          totalBoosterPairsNeeded: totalPairsNeededForNext,
          totalBoosterPairsHave: totalBoosterPairs,
          boosterPairsRemaining: Math.max(0, totalPairsNeededForNext - totalBoosterPairs),
        };
      }
    }

    return Response.json({
      success: true,
      message: newRankAchieved 
        ? `🎉 Congratulations! Rank ${user.currentAwardRank} (${RANK_NAMES[user.currentAwardRank as keyof typeof RANK_NAMES]}) Achieved! Award: ${AWARD_RANKS[user.currentAwardRank as keyof typeof AWARD_RANKS].awardName}`
        : `Rank processing complete. Current Rank: ${currentRank > 0 ? `${currentRank} (${RANK_NAMES[currentRank as keyof typeof RANK_NAMES]})` : 'Not Yet Ranked'}`,
      data: {
        currentRank: {
          rank: currentRank,
          rankName: currentRank > 0 ? RANK_NAMES[currentRank as keyof typeof RANK_NAMES] : 'Unranked',
          awardName: user.awardRankStatus?.awardReceivedName || 'N/A',
          achievementDate: user.awardRankStatus?.achievementDate,
        },
        boosterStatus: {
          isBoosterLeft: boosterStatus.isBoosterLeft,
          isBoosterRight: boosterStatus.isBoosterRight,
        },
        statistics: {
          totalBoosterPairsCompleted: totalBoosterPairs,
          totalBoosterMatchingRecords: boosterMatchingRecords.length,
        },
        nextRankTarget: nextRankRequirements,
        rankProgressions: rankProgressions.slice(0, 3), // Show top 3 possible progressions
      }
    });
  } catch (error) {
    console.error('Error processing award rank:', error);
    return Response.json(
      { success: false, error: error instanceof Error ? error.message : 'Error processing award rank' },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.username) {
      return Response.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const user = await User.findOne({ username: session.user.username });

    if (!user) {
      return Response.json({ success: false, message: "User not found" }, { status: 404 });
    }

    const awardRankRecords = user.awardRankRecords || [];
    const currentRank = user.currentAwardRank || 0;

    return Response.json({
      success: true,
      message: "Award rank status retrieved",
      data: {
        currentRank: {
          rank: currentRank,
          rankName: currentRank > 0 ? RANK_NAMES[currentRank as keyof typeof RANK_NAMES] : 'Unranked',
          awardName: user.awardRankStatus?.awardReceivedName || 'N/A',
          achievementDate: user.awardRankStatus?.achievementDate,
        },
        awardHistory: awardRankRecords.map(record => ({
          rank: record.rank,
          rankName: record.rankName,
          awardName: record.awardName,
          achievedDate: record.achievedDate,
          awardValue: record.awardValue,
          status: record.status,
        })),
        totalAwardsReceived: awardRankRecords.length,
        totalAwardValue: awardRankRecords.reduce((sum, r) => sum + (r.awardValue || 0), 0),
      }
    });
  } catch (error) {
    return Response.json(
      { success: false, error: error instanceof Error ? error.message : 'Error retrieving award rank' },
      { status: 500 }
    );
  }
}
