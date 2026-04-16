import { getServerSession } from 'next-auth';
import { connectDB } from '@/lib/database';
import { authOptions } from '@/lib/auth';
import User from '@/models/User';
import { NextRequest, NextResponse } from 'next/server';
import { checkAwardQualification, AWARD_RANKS } from '@/lib/incomeCalculations';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.username) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const user = await User.findOne({ username: session.user.username })
      .select('boosterIncomeRecords boosterStatus basicIncome username userId fullName');

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    const totalBoosterPairs = (user.boosterIncomeRecords || [])
      .reduce((sum: number, record: any) => sum + (record.pairsMatched || 0), 0);
    const qualification = checkAwardQualification(totalBoosterPairs);
    const rankProgressData = {
      currentRank: qualification.currentRank
        ? {
            number: qualification.currentRank.rank,
            name: qualification.currentRank.name,
            requiredPairs: qualification.currentRank.requiredBoosterPairs,
            award: qualification.currentRank.award,
            achievedPairs: totalBoosterPairs
          }
        : null,
      
      nextRank: qualification.nextRank
        ? {
            number: qualification.nextRank.rank,
            name: qualification.nextRank.name,
            requiredPairs: qualification.nextRank.requiredBoosterPairs,
            award: qualification.nextRank.award,
            pairsNeeded: qualification.pairsNeededForNext
          }
        : null,

      progress: {
        totalBoosterPairs,
        pairsNeeded: qualification.pairsNeededForNext,
        progressPercentage: qualification.nextRank
          ? Math.round(
              ((totalBoosterPairs - (qualification.currentRank?.requiredBoosterPairs || 0)) /
                (qualification.nextRank.requiredBoosterPairs - (qualification.currentRank?.requiredBoosterPairs || 0))) *
              100
            )
          : 100
      },

      allRanks: AWARD_RANKS.map((rank) => ({
        rank: rank.rank,
        name: rank.name,
        requiredPairs: rank.requiredBoosterPairs,
        award: rank.award,
        isCurrentRank: rank.rank === qualification.currentRank?.rank,
        isNextRank: rank.rank === qualification.nextRank?.rank,
        isAchieved: totalBoosterPairs >= rank.requiredBoosterPairs,
        progressPercentage:
          totalBoosterPairs >= rank.requiredBoosterPairs
            ? 100
            : Math.round((totalBoosterPairs / rank.requiredBoosterPairs) * 100)
      }))
    };

    return NextResponse.json({
      success: true,
      data: rankProgressData,
      totalRanks: AWARD_RANKS.length,
      hint: 'Increase booster pairs by building your left and right downline'
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to check award qualification' },
      { status: 500 }
    );
  }
}

/**
 * GET - Public rank information (no auth required)
 */
export async function GET(req: NextRequest) {
  try {
    return NextResponse.json({
      success: true,
      data: AWARD_RANKS.map((rank) => ({
        rank: rank.rank,
        name: rank.name,
        requiredBoosterPairs: rank.requiredBoosterPairs,
        award: rank.award
      }))
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to retrieve rank information' },
      { status: 500 }
    );
  }
}
