import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectDB } from '@/lib/database';
import { authOptions } from '@/lib/auth';
import User from '@/models/User';

export async function GET(req: NextRequest) {
  try {
    console.log('👤 [API] TOTAL-DIRECT - Starting...');
    const session = await getServerSession(authOptions);
    if (!session?.user?.username) {
      console.log('❌ [API] TOTAL-DIRECT - Unauthorized: No session');
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }
    console.log('✅ [API] TOTAL-DIRECT - Session found:', session.user.username);
    
    await connectDB();
    console.log('📊 [API] TOTAL-DIRECT - Database connected');
    
    const user = await User.findOne({ username: session.user.username })
      .select('totalDirect')
      .lean();

    if (!user) {
      console.log('❌ [API] TOTAL-DIRECT - User not found:', session.user.username);
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }
    
    const directData = {
      left: user.totalDirect?.left ?? 0,
      right: user.totalDirect?.right ?? 0,
    };
    console.log('✅ [API] TOTAL-DIRECT - Data retrieved:', directData);
    
    return NextResponse.json(
      {
        success: true,
        totalDirect: directData,
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error('❌ [API] TOTAL-DIRECT - Error:', err.message);
    return NextResponse.json(
      { success: false, message: err.message ?? 'Internal server error' },
      { status: 500 }
    );
  }
}
