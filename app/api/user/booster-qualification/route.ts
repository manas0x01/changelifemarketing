import { getServerSession } from 'next-auth';
import { connectDB } from '@/lib/database';
import { authOptions } from '@/lib/auth';
import User from '@/models/User';
import { NextRequest, NextResponse } from 'next/server';
import { checkBoosterQualification, BOOSTER_CONFIG } from '@/lib/incomeCalculations';

export async function POST(req: NextRequest) {
  try {
    console.log('🟢 [POST] /api/user/booster-qualification - Entry');
    const session = await getServerSession(authOptions);
    console.log('👤 Session:', session);
    if (!session?.user?.username) {
      console.log('🔴 Unauthorized access attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    console.log('✅ Database connected');

    const user = await User.findOne({ username: session.user.username })
      .select('basicIncomeRecords boosterStatus userId username fullName');
    console.log('👤 User fetched:', user ? user.username : null);

    if (!user) {
      console.log('🔴 User not found');
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    const totalRecords = (user.basicIncomeRecords || []);
    console.log('📊 Total basic income records:', totalRecords.length);
    const totalPairsCompleted = totalRecords.length;
    console.log('🔗 Total pairs completed:', totalPairsCompleted);
    const qualificationStatus = checkBoosterQualification(totalPairsCompleted);
    console.log('📝 Qualification status:', qualificationStatus);
    if (qualificationStatus.isQualified && (!user.boosterStatus?.isBoosterLeft || !user.boosterStatus?.isBoosterRight)) {
      user.boosterStatus = {
        isBoosterLeft: true,
        isBoosterRight: true,
        boosterQualificationDateLeft: new Date(Date.now() - 1000 * 60 * 60 * 24), // Simulated qualification
        boosterQualificationDateRight: new Date(Date.now() - 1000 * 60 * 60 * 24),
        pairsCompletedLeft: totalPairsCompleted,
        pairsCompletedRight: totalPairsCompleted,
        ...user.boosterStatus
      };
      console.log('🏅 User newly qualified for booster:', user.boosterStatus);
      await user.save();
      console.log('💾 User saved successfully');

      const responsePayload = {
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
      };
      console.log('📤 Response payload:', responsePayload);
      console.log('✅ [POST] /api/user/booster-qualification - Exit');
      return NextResponse.json(responsePayload);
    }
    if (qualificationStatus.isQualified) {
      const responsePayload = {
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
      };
      console.log('📤 Response payload:', responsePayload);
      console.log('✅ [POST] /api/user/booster-qualification - Exit');
      return NextResponse.json(responsePayload);
    }
    const responsePayload = {
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
    };
    console.log('📤 Response payload:', responsePayload);
    console.log('✅ [POST] /api/user/booster-qualification - Exit');
    return NextResponse.json(responsePayload);
  } catch (error) {
    console.log('❌ Error in [POST] /api/user/booster-qualification:', error);
    return NextResponse.json(
      { error: 'Failed to check booster qualification' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    console.log('🟢 [GET] /api/user/booster-qualification - Entry');
    const session = await getServerSession(authOptions);
    console.log('👤 Session:', session);
    if (!session?.user?.username) {
      console.log('🔴 Unauthorized access attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    console.log('✅ Database connected');

    const user = await User.findOne({ username: session.user.username })
      .select('basicIncomeRecords boosterStatus userId username');
    console.log('👤 User fetched:', user ? user.username : null);

    if (!user) {
      console.log('🔴 User not found');
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const totalRecords = (user.basicIncomeRecords || []);
    console.log('📊 Total basic income records:', totalRecords.length);
    const totalPairsCompleted = totalRecords.length;
    console.log('🔗 Total pairs completed:', totalPairsCompleted);
    const qualificationStatus = checkBoosterQualification(totalPairsCompleted);
    console.log('📝 Qualification status:', qualificationStatus);

    const responsePayload = {
      success: true,
      data: {
        isBooster: qualificationStatus.isQualified,
        totalPairsCompleted,
        pairsNeeded: qualificationStatus.pairsNeeded,
        boosterLeft: user.boosterStatus?.isBoosterLeft || false,
        boosterRight: user.boosterStatus?.isBoosterRight || false,
        qualificationThreshold: BOOSTER_CONFIG.QUALIFICATION_THRESHOLD
      }
    };
    console.log('📤 Response payload:', responsePayload);
    console.log('✅ [GET] /api/user/booster-qualification - Exit');
    return NextResponse.json(responsePayload);
  } catch (error) {
    console.log('❌ Error in [GET] /api/user/booster-qualification:', error);
    return NextResponse.json(
      { error: 'Failed to get booster status' },
      { status: 500 }
    );
  }
}
