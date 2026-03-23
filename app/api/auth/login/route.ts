import { connectDB } from '@/lib/database';
import User from '@/models/User';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const { username, password } = await request.json();

    // Validation
    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    // Find user with password field included
    const user = await User.findOne({ username }).select('+password');

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      );
    }

    // Compare passwords
    const isPasswordCorrect = await user.comparePassword(password);

    if (!isPasswordCorrect) {
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      );
    }

    // Create response
    const response = NextResponse.json(
      {
        message: 'Login successful',
        user: {
          id: user._id,
          username: user.username,
        },
      },
      { status: 200 }
    );

    // Set secure cookie with session token
    response.cookies.set('next-auth.session-token', `${user._id}`, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    });

    return response;
  } catch (error: any) {
    console.error('Error during login:', error);
    return NextResponse.json(
      { error: error.message || 'Error during login' },
      { status: 500 }
    );
  }
}
