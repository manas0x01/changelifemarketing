import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectDB } from '@/lib/database';
import { authOptions } from '@/lib/auth';
import User from '@/models/User';

export async function GET(req: NextRequest) {
  try {
    console.log('👥 [API] TOTAL-TEAM - Starting...');
    const session = await getServerSession(authOptions);
    if (!session?.user?.username) {
      console.log('❌ [API] TOTAL-TEAM - Unauthorized: No session');
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }
    console.log('✅ [API] TOTAL-TEAM - Session found:', session.user.username);

    await connectDB();
    console.log('📊 [API] TOTAL-TEAM - Database connected');

    const user = await User.findOne({ username: session.user.username })
      .select('totalTeam')
      .lean();

    if (!user) {
      console.log('❌ [API] TOTAL-TEAM - User not found:', session.user.username);
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }
    
    const teamData = {
      left: user.totalTeam?.left ?? 0,
      right: user.totalTeam?.right ?? 0,
    };
    console.log('✅ [API] TOTAL-TEAM - Data retrieved:', teamData);

    return NextResponse.json(
      {
        success: true,
        totalTeam: teamData,
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error('❌ [API] TOTAL-TEAM - Error:', err.message);
    return NextResponse.json(
      { success: false, message: err.message ?? 'Internal server error' },
      { status: 500 }
    );
  }
}
