import { getServerSession } from 'next-auth';
import { connectDB } from '@/lib/database';
import { authOptions } from '@/lib/auth';
import User from '@/models/User';
import { NextRequest, NextResponse } from 'next/server';
import { checkAwardQualification, AWARD_RANKS } from '@/lib/incomeCalculations';

export async function POST(req: NextRequest) {
  try {
    console.log('\n🏆 [AWARD-QUALIFICATION] POST request received');
    
    console.log('  🔐 Retrieving server session...');
    const session = await getServerSession(authOptions);
    console.log(`  ${session ? '✅' : '❌'} Session found: ${session ? 'Yes' : 'No'}`);
    
    if (!session?.user?.username) {
      console.error('  ❌ UNAUTHORIZED - No session or username');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.log(`  ✅ Username from session: "${session.user.username}"`);

    console.log('  📂 Connecting to MongoDB...');
    await connectDB();
    console.log('  ✅ Database connected');

    console.log(`  👤 Querying user data for username: "${session.user.username}"...`);
    const user = await User.findOne({ username: session.user.username })
      .select('boosterIncomeRecords boosterStatus basicIncome username userId fullName');
    console.log(`  ${user ? '✅' : '❌'} User lookup result: ${user ? 'Found' : 'Not found'}`);

    if (!user) {
      console.error('  ❌ User not found - Returning 404');
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    console.log(`    - Username: ${user.username}`);
    console.log(`    - User ID: ${user.userId}`);
    console.log(`    - Full Name: ${user.fullName}`);
    
    console.log('  📊 Calculating total booster pairs...');
    const totalBoosterPairs = (user.boosterIncomeRecords || [])
      .reduce((sum: number, record: any) => sum + (record.pairsMatched || 0), 0);
    console.log(`    - Booster income records count: ${(user.boosterIncomeRecords || []).length}`);
    console.log(`    - Total pairs matched across all records: ${totalBoosterPairs}`);
    
    console.log(`  🏅 Checking award qualification for ${totalBoosterPairs} booster pairs...`);
    const qualification = checkAwardQualification(totalBoosterPairs);
    
    console.log('  📈 Building rank progress data...');
    console.log(`    ✅ Current rank: ${qualification.currentRank ? `${qualification.currentRank.name} (Rank ${qualification.currentRank.rank})` : 'None'}`);
    console.log(`    ⏭️  Next rank: ${qualification.nextRank ? `${qualification.nextRank.name} (Rank ${qualification.nextRank.rank})` : 'Max rank reached'}`);
    console.log(`    🎯 Pairs needed for next: ${qualification.pairsNeededForNext}`);
    
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

      allRanks: AWARD_RANKS.map((rank) => {
        const isAchieved = totalBoosterPairs >= rank.requiredBoosterPairs;
        const progressPercentage = isAchieved
          ? 100
          : Math.round((totalBoosterPairs / rank.requiredBoosterPairs) * 100);
        
        console.log(`      🏅 Rank ${rank.rank} (${rank.name}): Required=${rank.requiredBoosterPairs}, Achieved=${isAchieved ? '✅' : '❌'}, Progress=${progressPercentage}%`);
        
        return {
          rank: rank.rank,
          name: rank.name,
          requiredPairs: rank.requiredBoosterPairs,
          award: rank.award,
          isCurrentRank: rank.rank === qualification.currentRank?.rank,
          isNextRank: rank.rank === qualification.nextRank?.rank,
          isAchieved: isAchieved,
          progressPercentage: progressPercentage
        };
      })
    };

    console.log('  📤 Response prepared:');
    console.log(`    ✅ Total ranks in system: ${AWARD_RANKS.length}`);
    console.log(`    📊 Rank progress data: Current=${rankProgressData.currentRank?.name || 'None'}, Next=${rankProgressData.nextRank?.name || 'None'}`);
    console.log(`    📈 Progress: ${rankProgressData.progress.progressPercentage}%`);
    console.log(`  ✅ Returning success response\n`);

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
    console.log('\n📋 [AWARD-QUALIFICATION] GET request received - Public rank info');
    
    console.log(`  📊 Total ranks to return: ${AWARD_RANKS.length}`);
    console.log(`  🔍 Mapping rank data...`);
    
    AWARD_RANKS.forEach((rank) => {
      console.log(`    🏅 Rank ${rank.rank}: ${rank.name} - Required pairs: ${rank.requiredBoosterPairs}, Award: ${rank.award}`);
    });
    
    console.log('  ✅ Returning success response with all ranks\n');
    
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
    console.error(`  💥 ERROR caught in GET try-catch`);
    console.error(`    - Error type: ${error instanceof Error ? error.name : typeof error}`);
    console.error(`    - Error message: ${error instanceof Error ? error.message : String(error)}`);
    console.error(`  ❌ Returning 500 error response\n`);
    
    return NextResponse.json(
      { error: 'Failed to retrieve rank information' },
      { status: 500 }
    );
  }
}
