import { getServerSession } from 'next-auth';
import { connectDB } from '@/lib/database';
import { authOptions } from '@/lib/auth';
import User from '@/models/User';
import { NextRequest, NextResponse } from 'next/server';
import { checkBoosterQualification, BOOSTER_CONFIG } from '@/lib/incomeCalculations';

/**
 * ✅ POINT 7: Auto-Qualify for Booster Status
 * Rules:
 * - After 12 pairs complete → User becomes Booster
 * - 4 pairs are cut at positions 3, 6, 9, 12
 * - 8 effective pairs after cuts
 * - Creates separate left & right booster status
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.username) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const user = await User.findOne({ username: session.user.username })
      .select('basicIncomeRecords boosterStatus userId username fullName');

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Count total pairs completed (from basicIncomeRecords)
    const totalRecords = (user.basicIncomeRecords || []);
    const totalPairsCompleted = totalRecords.length;

    // Check qualification status
    const qualificationStatus = checkBoosterQualification(totalPairsCompleted);

    // If newly qualified, auto-promote to booster
    if (qualificationStatus.isQualified && (!user.boosterStatus?.isBoosterLeft || !user.boosterStatus?.isBoosterRight)) {
      // Update booster status
      user.boosterStatus = {
        isBoosterLeft: true,
        isBoosterRight: true,
        boosterQualificationDateLeft: new Date(Date.now() - 1000 * 60 * 60 * 24), // Simulated qualification
        boosterQualificationDateRight: new Date(Date.now() - 1000 * 60 * 60 * 24),
        pairsCompletedLeft: totalPairsCompleted,
        pairsCompletedRight: totalPairsCompleted,
        ...user.boosterStatus
      };
      
      await user.save();

      return NextResponse.json({
        success: true,
        status: 'NEWLY_QUALIFIED',
        message: `🎉 Congratulations! You've qualified for Booster status!`,
        data: {
          totalPairsCompleted,
          pairsCut: qualificationStatus.pairsCut,
          effectivePairs: qualificationStatus.effectivePairs,
          newStatus: 'BOOSTER',
          qualificationDate: new Date(),
          nextMilestone: 'Booster Matching Income - Earn ₹20,000 daily cap'
        }
      });
    }

    // Already qualified
    if (qualificationStatus.isQualified) {
      return NextResponse.json({
        success: true,
        status: 'ALREADY_QUALIFIED',
        data: {
          totalPairsCompleted,
          pairsCut: qualificationStatus.pairsCut,
          effectivePairs: qualificationStatus.effectivePairs,
          currentStatus: 'BOOSTER',
          qualificationDate: user.boosterStatus?.boosterQualificationDateLeft || 'N/A',
          boosterSince: user.boosterStatus?.boosterQualificationDateLeft ? 'Active' : 'Pending'
        }
      });
    }

    // Not yet qualified
    return NextResponse.json({
      success: true,
      status: 'NOT_QUALIFIED',
      data: {
        totalPairsCompleted,
        pairsNeeded: qualificationStatus.pairsNeeded,
        qualificationThreshold: BOOSTER_CONFIG.QUALIFICATION_THRESHOLD,
        progressPercentage: Math.round((totalPairsCompleted / BOOSTER_CONFIG.QUALIFICATION_THRESHOLD) * 100),
        message: `${qualificationStatus.pairsNeeded} more pairs needed for Booster qualification`,
        cuttingPositions: BOOSTER_CONFIG.CUTTING_POSITIONS,
        totalCuts: BOOSTER_CONFIG.CUTS_TOTAL
      }
    });
  } catch (error) {
    console.error('Booster qualification error:', error);
    return NextResponse.json(
      { error: 'Failed to check booster qualification' },
      { status: 500 }
    );
  }
}

/**
 * GET - Check current booster status without auto-promoting
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.username) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const user = await User.findOne({ username: session.user.username })
      .select('basicIncomeRecords boosterStatus userId username');

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const totalRecords = (user.basicIncomeRecords || []);
    const totalPairsCompleted = totalRecords.length;
    const qualificationStatus = checkBoosterQualification(totalPairsCompleted);

    return NextResponse.json({
      success: true,
      data: {
        isBooster: qualificationStatus.isQualified,
        totalPairsCompleted,
        pairsNeeded: qualificationStatus.pairsNeeded,
        boosterLeft: user.boosterStatus?.isBoosterLeft || false,
        boosterRight: user.boosterStatus?.isBoosterRight || false,
        qualificationThreshold: BOOSTER_CONFIG.QUALIFICATION_THRESHOLD
      }
    });
  } catch (error) {
    console.error('Get booster status error:', error);
    return NextResponse.json(
      { error: 'Failed to get booster status' },
      { status: 500 }
    );
  }
}
