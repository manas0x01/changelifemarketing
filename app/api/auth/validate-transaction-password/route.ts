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
    const username = session.user.username || session.user.email;
    const userEmail = session.user.email;
    const userId = (session.user as any)?.userId;
    if (!username && !userEmail) {
      return NextResponse.json(
        { error: 'User information not found in session' },
        { status: 400 }
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
    const searchQuery: any = {};
    let searchMethod = '';
    if (session.user.username) {
      searchQuery.username = session.user.username;
      searchMethod = 'username (from session)';
    } 
    else if (userId) {
      searchQuery.userId = userId;
      searchMethod = 'userId (from session)';
    }
    else if (userEmail) {
      searchQuery.email = userEmail;
      searchMethod = 'email (fallback)';
    }
    let user = await User.findOne(searchQuery).select('+transactionPassword');
    if (!user) {
      if (!user && session.user.username) {
        user = await User.findOne({ username: session.user.username }).select('+transactionPassword');
      }
      if (!user && userId) {
        user = await User.findOne({ userId: userId }).select('+transactionPassword');
      }

      if (!user && userEmail) {
        user = await User.findOne({ email: userEmail }).select('+transactionPassword');
      }
      if (!user && username) {
        user = await User.findOne({ mobileNo: username }).select('+transactionPassword');
      }
    }

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
    const isPasswordValid = await user.compareTransactionPassword(transactionPassword);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Transaction password is incorrect' },
        { status: 401 }
      );
    }
    const userEPins = user.ePins || [];
    const availableEPins = userEPins.filter((pin: any) => {
      // Consider a pin as available if it's Active
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
