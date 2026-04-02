import { NextRequest, NextResponse } from 'next/server';

// Handle both GET and POST requests
async function handleLogout(request: NextRequest) {
  try {
    // Create redirect response to home page
    const response = NextResponse.redirect(new URL('/', request.url), {
      status: 302,
    });

    // Clear the session cookie
    response.cookies.set('next-auth.session-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0, // This deletes the cookie
      path: '/',
    });

    console.log('✅ Logout successful - Redirecting to /');
    return response;
  } catch (error: any) {
    console.error('❌ Error during logout:', error);
    return NextResponse.json(
      { error: error.message || 'Error during logout' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return handleLogout(request);
}

export async function POST(request: NextRequest) {
  return handleLogout(request);
}
