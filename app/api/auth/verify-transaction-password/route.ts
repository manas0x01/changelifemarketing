import { connectDB } from '@/lib/database';
import User from '@/models/User';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    console.log('\n🔐 === VERIFY TRANSACTION PASSWORD ===');
    
    // Get transaction password from request body
    const { transactionPassword } = await request.json();

    console.log('🔐 Verifying transaction password...');
    console.log(`   Password length: ${transactionPassword?.length}`);

    // Validation
    if (!transactionPassword) {
      console.log('❌ Validation failed - transaction password missing');
      return NextResponse.json(
        { error: 'Transaction password is required' },
        { status: 400 }
      );
    }

    // Debug: Log all cookies received
    console.log('\n🍪 Cookies received from browser:');
    const allCookies = request.cookies.getAll();
    console.log('   Total cookies:', allCookies.length);
    allCookies.forEach((cookie, index) => {
      console.log(`   [${index + 1}] Name: "${cookie.name}" | Value: "${cookie.value.substring(0, 20)}..."`);
    });

    // Get username from cookies
    const usernameCookie = request.cookies.get('user-username');
    console.log('\n🔍 Looking for "user-username" cookie...');
    console.log('   Cookie found:', !!usernameCookie);
    
    if (usernameCookie) {
      console.log('   Cookie value:', usernameCookie.value);
    }
    
    const username = usernameCookie?.value;
    
    if (!username) {
      console.log('\n❌ Username not found in cookies');
      console.log('   Possible causes:');
      console.log('   1. User not logged in');
      console.log('   2. Login did not set cookies properly');
      console.log('   3. Browser not sending cookies');
      console.log('   4. Cookie has expired');
      return NextResponse.json(
        { error: 'User session not found. Please login again.' },
        { status: 401 }
      );
    }

    console.log(`\n✅ Username from cookies: ${username}`);

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