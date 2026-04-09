import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectDB } from '@/lib/database';
import { authOptions } from '@/lib/auth';
import { calculateAndUpdateUserMetrics, recalculateAllUserMetrics } from '@/lib/calculateUserMetrics';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Only admin can recalculate metrics
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin only' },
        { status: 403 }
      );
    }

    await connectDB();

    const body = await req.json();
    const { userId, recalculateAll } = body;

    if (recalculateAll) {
      // Recalculate all users
      const result = await recalculateAllUserMetrics();
      return NextResponse.json({
        message: `Recalculated metrics for all users`,
        ...result
      });
    } else if (userId) {
      // Recalculate single user
      const updatedUser = await calculateAndUpdateUserMetrics(userId);
      return NextResponse.json({
        success: true,
        message: 'User metrics updated successfully',
        user: updatedUser
      });
    } else {
      return NextResponse.json(
        { error: 'Please provide userId or set recalculateAll to true' },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Error in calculate-metrics:', error);
    return NextResponse.json(
      { error: error.message ?? 'Failed to calculate metrics' },
      { status: 500 }
    );
  }
}
