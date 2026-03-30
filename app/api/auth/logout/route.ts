import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Create response
    const response = NextResponse.json(
      {
        message: 'Logout successful',
      },
      { status: 200 }
    );

    // Clear the session cookie
    response.cookies.set('next-auth.session-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0, // This deletes the cookie
      path: '/',
    });

    return response;
  } catch (error: any) {
    console.error('Error during logout:', error);
    return NextResponse.json(
      { error: error.message || 'Error during logout' },
      { status: 500 }
    );
  }
}
