import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const cookies = request.cookies;
    const allCookies = cookies.getAll();
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({
        authenticated: false,
        message: 'No active session found. Please login first.',
        cookies: {
          has_token: cookies.has('next-auth.session-token'),
          cookie_count: cookies.getAll().length
        }
      }, { status: 401 });
    }
    return NextResponse.json({
      authenticated: true,
      message: 'Session verified successfully',
      session: {
        username: session.user?.username,
        userId: session.user?.id,
        email: session.user?.email,
        name: session.user?.name,
        role: (session.user as any)?.role,
        fullName: (session.user as any)?.fullName,
        mobileNo: (session.user as any)?.mobileNo,
        sponsorId: (session.user as any)?.sponsorId,
        placementId: (session.user as any)?.placementId,
      },
      cookies: {
        has_session_token: cookies.has('next-auth.session-token'),
        total_cookies: cookies.getAll().length
      }
    });
  } catch (error: any) {
    return NextResponse.json(
      { 
        authenticated: false,
        error: 'Failed to verify session',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
