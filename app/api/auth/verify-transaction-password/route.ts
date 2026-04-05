import { connectDB } from '@/lib/database';
import User from '@/models/User';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const { transactionPassword } = await request.json();
    if (!transactionPassword) {
      return NextResponse.json(
        { error: 'Transaction password is required' },
        { status: 400 }
      );
    }
    const session = await getServerSession(authOptions);
    if (!session?.user?.username) {
      return NextResponse.json(
        { error: 'User session not found. Please login again.' },
        { status: 401 }
      );
    }
    const username = session.user.username;
    const user = await User.findOne({ username }).select('+transactionPassword');
    if (!user) {
      return NextResponse.json(
        { error: 'User not found. Please login again.' },
        { status: 404 }
      );
    }
    const isPasswordCorrect = await user.compareTransactionPassword(transactionPassword);
    if (!isPasswordCorrect) {
      return NextResponse.json(
        { error: 'Invalid transaction password. Please try again.' },
        { status: 401 }
      );
    }
    return NextResponse.json(
      {
        success: true,
        message: 'Transaction password verified successfully',
        userId: user._id?.toString(),
        username: user.username,
      },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Error verifying transaction password' },
      { status: 500 }
    );
  }
}