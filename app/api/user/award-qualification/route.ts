import { getServerSession } from "next-auth";
import { connectDB } from "@/lib/database";
import { authOptions } from "@/lib/auth";
import User from "@/models/User";
import { NextRequest, NextResponse } from "next/server";
import { checkAwardQualification, AWARD_RANKS } from "@/lib/incomeCalculations";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.username) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    await connectDB();
    const user = await User.findOne({ username: session.user.username }).select(
      "boosterIncomeRecords boosterStatus basicIncome username userId fullName",
    );

    if (!user) {
      console.error("  ❌ User not found - Returning 404");
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    const leftBooster = user.boosterCount?.left || 0;
    const rightBooster = user.boosterCount?.right || 0;

    const totalBoosterPairs = Math.min(leftBooster, rightBooster);
    
    if (!user.boosterStatus) {
      console.log("❌ User is not a booster yet");
      return NextResponse.json({
        success: true,
        data: {
          currentRank: null,
          nextRank: {
            number: AWARD_RANKS[0].rank,
            name: AWARD_RANKS[0].name,
            requiredPairs: AWARD_RANKS[0].requiredBoosterPairs,
            award: AWARD_RANKS[0].award,
            pairsNeeded: AWARD_RANKS[0].requiredBoosterPairs,
          },
          progress: {
            totalBoosterPairs: 0,
            pairsNeeded: AWARD_RANKS[0].requiredBoosterPairs,
            progressPercentage: 0,
          },
          allRanks: AWARD_RANKS.map((rank) => ({
            rank: rank.rank,
            name: rank.name,
            requiredPairs: rank.requiredBoosterPairs,
            award: rank.award,
            isCurrentRank: false,
            isNextRank: rank.rank === 1,
            isAchieved: false,
            progressPercentage: 0,
          })),
        },
        totalRanks: AWARD_RANKS.length,
      });
    }
    const qualification = checkAwardQualification(totalBoosterPairs);
    const rankProgressData = {
      currentRank: qualification.currentRank
        ? {
            number: qualification.currentRank.rank,
            name: qualification.currentRank.name,
            requiredPairs: qualification.currentRank.requiredBoosterPairs,
            award: qualification.currentRank.award,
            achievedPairs: totalBoosterPairs,
          }
        : null,

      nextRank: qualification.nextRank
        ? {
            number: qualification.nextRank.rank,
            name: qualification.nextRank.name,
            requiredPairs: qualification.nextRank.requiredBoosterPairs,
            award: qualification.nextRank.award,
            pairsNeeded: qualification.pairsNeededForNext,
          }
        : null,

      progress: {
        totalBoosterPairs,
        pairsNeeded: qualification.pairsNeededForNext,
        progressPercentage: qualification.nextRank
          ? Math.round(
              ((totalBoosterPairs -
                (qualification.currentRank?.requiredBoosterPairs || 0)) /
                (qualification.nextRank.requiredBoosterPairs -
                  (qualification.currentRank?.requiredBoosterPairs || 0))) *
                100,
            )
          : 100,
      },

      allRanks: AWARD_RANKS.map((rank) => {
        const isAchieved = totalBoosterPairs >= rank.requiredBoosterPairs;
        const progressPercentage = isAchieved
          ? 100
          : Math.round((totalBoosterPairs / rank.requiredBoosterPairs) * 100);

        console.log(
          `      🏅 Rank ${rank.rank} (${rank.name}): Required=${rank.requiredBoosterPairs}, Achieved=${isAchieved ? "✅" : "❌"}, Progress=${progressPercentage}%`,
        );

        return {
          rank: rank.rank,
          name: rank.name,
          requiredPairs: rank.requiredBoosterPairs,
          award: rank.award,
          isCurrentRank: rank.rank === qualification.currentRank?.rank,
          isNextRank: rank.rank === qualification.nextRank?.rank,
          isAchieved: isAchieved,
          progressPercentage: progressPercentage,
        };
      }),
    };

    console.log("  📤 Response prepared:");
    console.log(`    ✅ Total ranks in system: ${AWARD_RANKS.length}`);
    console.log(
      `    📊 Rank progress data: Current=${rankProgressData.currentRank?.name || "None"}, Next=${rankProgressData.nextRank?.name || "None"}`,
    );
    console.log(
      `    📈 Progress: ${rankProgressData.progress.progressPercentage}%`,
    );
    console.log(`  ✅ Returning success response\n`);

    return NextResponse.json({
      success: true,
      data: rankProgressData,
      totalRanks: AWARD_RANKS.length,
      hint: "Increase booster pairs by building your left and right downline",
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to check award qualification" },
      { status: 500 },
    );
  }
}

/**
 * GET - Public rank information (no auth required)
 */
export async function GET(req: NextRequest) {
  try {
    console.log(
      "\n📋 [AWARD-QUALIFICATION] GET request received - Public rank info",
    );

    console.log(`  📊 Total ranks to return: ${AWARD_RANKS.length}`);
    console.log(`  🔍 Mapping rank data...`);

    AWARD_RANKS.forEach((rank) => {
      console.log(
        `    🏅 Rank ${rank.rank}: ${rank.name} - Required pairs: ${rank.requiredBoosterPairs}, Award: ${rank.award}`,
      );
    });

    console.log("  ✅ Returning success response with all ranks\n");

    return NextResponse.json({
      success: true,
      data: AWARD_RANKS.map((rank) => ({
        rank: rank.rank,
        name: rank.name,
        requiredBoosterPairs: rank.requiredBoosterPairs,
        award: rank.award,
      })),
    });
  } catch (error) {
    console.error(`  💥 ERROR caught in GET try-catch`);
    console.error(
      `    - Error type: ${error instanceof Error ? error.name : typeof error}`,
    );
    console.error(
      `    - Error message: ${error instanceof Error ? error.message : String(error)}`,
    );
    console.error(`  ❌ Returning 500 error response\n`);

    return NextResponse.json(
      { error: "Failed to retrieve rank information" },
      { status: 500 },
    );
  }
}
