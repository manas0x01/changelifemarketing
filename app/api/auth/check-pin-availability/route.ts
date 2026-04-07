import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import User from '@/models/User';
import { connectDB } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.username) {
      return NextResponse.json(
        { hasPins: false, message: 'Not authenticated' },
        { status: 401 }
      );
    }

    const user = await User.findOne({ username: session.user.username }).select('ePins');

    if (!user || !user.ePins || user.ePins.length === 0) {
      return NextResponse.json({
        hasPins: false,
        message: 'First Buy The Pin Then Create A Account',
      });
    }

    // Check for active/available pins
    const availablePins = user.ePins.filter((pin: any) => pin.status === 'Active' || pin.status === 'Transferred');
    
    if (availablePins.length === 0) {
      return NextResponse.json({
        hasPins: false,
        message: 'No Available Pins. First Buy The Pin Then Create A Account',
      });
    }

    return NextResponse.json({
      hasPins: true,
      totalPins: user.ePins.length,
      availablePins: availablePins.length,
    });
  } catch (error: any) {
    console.error('Error checking pin availability:', error);
    return NextResponse.json(
      { hasPins: false, message: 'Error checking pin availability' },
      { status: 500 }
    );
  }
}
