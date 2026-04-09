import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectDB } from '@/lib/database';
import { authOptions } from '@/lib/auth';
import User from '@/models/User';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.username) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { transactionPassword } = body;

    if (!transactionPassword?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Transaction password is required' },
        { status: 400 }
      );
    }

    await connectDB();

    const user = await User.findOne({ username: session.user.username }).select('+password');

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Verify transaction password against stored password
    const isPasswordValid = await user.comparePassword(transactionPassword);

    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, error: 'Invalid transaction password' },
        { status: 401 }
      );
    }

    // Get available pins for the user
    const availablePins = user.ePins?.filter(p => p.status === 'Active').map(p => ({
      pin: p.pin,
      packageName: p.packageName,
    })) || [];

    return NextResponse.json(
      {
        success: true,
        message: 'Transaction password verified',
        pins: availablePins,
      },
      { status: 200 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message ?? 'Internal server error' },
      { status: 500 }
    );
  }
}
