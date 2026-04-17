import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/database';
import User from '@/models/User';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Not authenticated. Please log in first.' },
        { status: 401 }
      );
    }
    const { transactionPassword } = await request.json();
    if (!transactionPassword) {
      return NextResponse.json(
        { error: 'Transaction password is required' },
        { status: 400 }
      );
    }
    await connectDB();

    const sessionUsername = (session.user as any)?.username;
    if (!sessionUsername) {
      return NextResponse.json(
        { error: 'Username not found in session. Please login with your username.' },
        { status: 400 }
      );
    }

    console.log('🔍 [VALIDATE_TXN] Searching user by username:', sessionUsername);
    const user = await User.findOne({ username: sessionUsername }).select('+transactionPassword');

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (!user.transactionPassword || user.transactionPassword.trim() === '') {
      return NextResponse.json(
        { 
          error: 'No transaction password set',
          message: 'Please set a transaction password in your profile first'
        },
        { status: 401 }
      );
    }
    // Debug: log provided and stored password info to troubleshoot mismatches
    try {
      console.log('🔐 [VALIDATE_TXN] Provided txn password (raw):', transactionPassword);
      const providedTrimmed = String(transactionPassword).trim();
      console.log('🔐 [VALIDATE_TXN] Provided txn password (trimmed) length:', providedTrimmed.length);
      console.log('🔐 [VALIDATE_TXN] Stored txn hash length:', String(user.transactionPassword).length);
      console.log('🔐 [VALIDATE_TXN] Stored txn hash prefix:', String(user.transactionPassword).slice(0, 8));
      console.log('🔐 [VALIDATE_TXN] Stored txn hash contains bcrypt signature ($2):', String(user.transactionPassword).includes('$2'));
    } catch (dbgErr) {
      console.log('🔐 [VALIDATE_TXN] Debug logging failed:', dbgErr);
    }

    const isPasswordValid = await user.compareTransactionPassword(transactionPassword);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Transaction password is incorrect' },
        { status: 401 }
      );
    }
    const userEPins = user.ePins || [];
    const availableEPins = userEPins.filter((pin: any) => {
      return pin.status === 'Active' || !pin.status;
    });
    if (!availableEPins || availableEPins.length === 0) {
      return NextResponse.json(
        {
          error: 'no_pins_available',
          message: "You don't have a pin. First purchase a pin then create a new account",
          hasPins: false
        },
        { status: 200 }
      );
    }
    return NextResponse.json(
      {
        success: true,
        message: 'Transaction password validated successfully',
        hasPins: true,
        userId: user.userId,
        userName: user.fullName
      },
      { status: 200 }
    );

  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error', details: (error as any)?.message },
      { status: 500 }
    );
  }
}
