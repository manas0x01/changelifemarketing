import { connectDB } from '@/lib/database';
import User from '@/models/User';
import { NextRequest, NextResponse } from 'next/server';
import { signToken } from '@/lib/jwt';
import { encryptCookieValue } from '@/lib/cookieEncryption';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const { username, password } = await request.json();

    console.log('🔐 Login attempt:', { username, passwordLength: password?.length });

    // Validation
    if (!username || !password) {
      console.log('❌ Validation failed - missing credentials');
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    // Find user with password field included
    const user = await User.findOne({ username }).select('+password');

    if (!user) {
      console.log('❌ User not found:', username);
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      );
    }

    console.log('✅ User found, comparing password...');
    console.log('📋 User details:', {
      id: user._id,
      username: user.username,
      hasPassword: !!user.password,
      passwordHashLength: user.password?.length,
    });

    // Compare passwords
    const isPasswordCorrect = await user.comparePassword(password);

    console.log('🔑 Password comparison result:', isPasswordCorrect);

    if (!isPasswordCorrect) {
      console.log('❌ Password mismatch for user:', username);
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      );
    }

    console.log('✅ Password correct, creating session...');

    // Get the user's _id as string
    const userId = user._id?.toString() || '';

    console.log('📋 Session details:', {
      userId,
      userEmail: user.email,
      userIdType: typeof userId,
    });

    // Generate JWT token (use username as primary identifier)
    const token = signToken({
      username: user.username,
      userId: userId,
      email: user.email || undefined,
    });

    console.log('🔐 JWT token generated successfully');

    // Encrypt sensitive data before storing in cookies
    console.log('🔒 Encrypting cookie values...');
    const encryptedUsername = encryptCookieValue(username);
    console.log('✅ Username encrypted successfully');

    // Create response
    const response = NextResponse.json(
      {
        message: 'Login successful',
        user: {
          id: userId,
          username: user.username,
          email: user.email,
        },
      },
      { status: 200 }
    );

    // Set JWT token in httpOnly cookie
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    });

    // Set encrypted username cookie for transaction password verification
    response.cookies.set('user-username', encryptedUsername, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, 
      path: '/',
    });

    console.log('\n✅ Login successful for:', username);
    console.log('🍪 Cookies being set:');
    console.log('   - auth-token (JWT): ✓');
    console.log('   - user-username (Encrypted): ✓');
    console.log('   - maxAge: 30 days');
    console.log('   - sameSite: lax');
    console.log('   - httpOnly (auth-token): true');
    console.log('🔒 All sensitive data encrypted with AES-256-GCM');
    console.log('\n');
    
    return response;
  } catch (error: any) {
    console.error('❌ Error during login:', error);
    return NextResponse.json(
      { error: error.message || 'Error during login' },
      { status: 500 }
    );
  }
}
