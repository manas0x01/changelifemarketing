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
      console.log('❌ Validation failed - transaction password missing');
      return NextResponse.json(
        { error: 'Transaction password is required' },
        { status: 400 }
      );
    }

    // Get session using NextAuth
    console.log('\n🔍 Getting NextAuth session...');
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.username) {
      console.log('❌ No valid session found');
      return NextResponse.json(
        { error: 'User session not found. Please login again.' },
        { status: 401 }
      );
    }

    const username = session.user.username;
    console.log(`✅ Username from session: ${username}`);

    // Find user by username and get transaction password
    console.log('\n🔍 Searching database for user...');
    const user = await User.findOne({ username }).select('+transactionPassword');

    if (!user) {
      console.log(`❌ User not found in database: ${username}`);
      return NextResponse.json(
        { error: 'User not found. Please login again.' },
        { status: 404 }
      );
    }

    console.log('✅ User found in database');
    console.log(`   Username: ${user.username}`);
    console.log(`   User ID: ${user._id}`);
    console.log(`   Has transaction password: ${!!user.transactionPassword}`);

    console.log('\n✅ User found, verifying transaction password...');

    // Compare transaction passwords
    const isPasswordCorrect = await user.compareTransactionPassword(transactionPassword);

    console.log(`🔑 Password comparison result: ${isPasswordCorrect}`);

    if (!isPasswordCorrect) {
      console.log(`❌ Transaction password MISMATCH for user: ${username}`);
      console.log('   Entered password length:', transactionPassword?.length);
      console.log('   Stored password hash length:', user.transactionPassword?.length);
      return NextResponse.json(
        { error: 'Invalid transaction password. Please try again.' },
        { status: 401 }
      );
    }

    console.log(`✅ Transaction password VERIFIED for user: ${username}`);
    console.log('   Ready to proceed to next step');
    console.log('\n');

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
    console.error('\n❌ Error during transaction password verification:', error);
    console.error('   Error message:', error.message);
    console.error('   Error stack:', error.stack);
    console.log('\n');
    return NextResponse.json(
      { error: error.message || 'Error verifying transaction password' },
      { status: 500 }
    );
  }
}