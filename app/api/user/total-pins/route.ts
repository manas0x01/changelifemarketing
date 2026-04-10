import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectDB } from '@/lib/database';
import { authOptions } from '@/lib/auth';
import User from '@/models/User';

export async function GET(req: NextRequest) {
  try {
    console.log('📌 [API] TOTAL-PINS - Starting...');
    
    const session = await getServerSession(authOptions);
    if (!session?.user?.username) {
      console.log('❌ [API] TOTAL-PINS - Unauthorized: No session');
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }
    console.log('✅ [API] TOTAL-PINS - Session found:', session.user.username);

    await connectDB();
    console.log('📊 [API] TOTAL-PINS - Database connected');
    
    const user = await User.findOne({ username: session.user.username })
      .select('ePins')
      .lean();

    if (!user) {
      console.log('❌ [API] TOTAL-PINS - User not found:', session.user.username);
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }
    console.log('✅ [API] TOTAL-PINS - User found');

    // Count active ePins
    const activePins = user.ePins ? user.ePins.filter((pin: any) => pin.status === 'Active').length : 0;
    const totalPins = user.ePins ? user.ePins.length : 0;
    const usedPins = totalPins - activePins;
    
    console.log('📝 [API] TOTAL-PINS - Active:', activePins, '| Used:', usedPins, '| Total:', totalPins);

    return NextResponse.json(
      {
        success: true,
        activePins,
        totalPins,
        usedPins,
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error('❌ [API] TOTAL-PINS - Error:', err);
    return NextResponse.json(
      { success: false, message: err.message ?? 'Internal server error' },
      { status: 500 }
    );
  }
}
