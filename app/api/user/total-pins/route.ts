import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectDB } from '@/lib/database';
import { authOptions } from '@/lib/auth';
import User from '@/models/User';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.username) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();
    const user = await User.findOne({ username: session.user.username })
      .select('ePins')
      .lean();

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // Count active ePins
    const activePins = user.ePins ? user.ePins.filter((pin: any) => pin.status === 'Active').length : 0;
    const totalPins = user.ePins ? user.ePins.length : 0;

    return NextResponse.json(
      {
        success: true,
        activePins,
        totalPins,
        usedPins: totalPins - activePins,
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error('Total pins fetch error:', err);
    return NextResponse.json(
      { success: false, message: err.message ?? 'Internal server error' },
      { status: 500 }
    );
  }
}
