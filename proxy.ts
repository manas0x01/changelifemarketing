import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || 'your-secret-key'
);

async function verifyAuth(token: string) {
  try {
    const verified = await jwtVerify(token, JWT_SECRET);
    return verified.payload as any;
  } catch (err) {
    return null;
  }
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const hasSessionCookie =
    request.cookies.has('next-auth.session-token') ||
    request.cookies.has('__Secure-next-auth.session-token');
  if (pathname.startsWith('/admin')) {
    if (!hasSessionCookie) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = '/auth/login';
      return NextResponse.redirect(loginUrl);
    }
    const token =
      request.cookies.get('next-auth.session-token')?.value ||
      request.cookies.get('__Secure-next-auth.session-token')?.value;
    console.log('[PROXY] Raw token found:', !!token);
    if (!token) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = '/auth/login';
      return NextResponse.redirect(loginUrl);
    }
    
    const payload = await verifyAuth(token);
    console.log('[PROXY] JWT payload:', payload);

    // Extract role from JWT payload when present
    let userRole = payload?.role || payload?.user?.role;
    console.log('[PROXY] userRole from token payload:', userRole);

    // If JWT verification failed or role missing, fall back to server session API
    if (!userRole) {
      try {
        console.log('[PROXY] Attempting fallback to /api/auth/session due to missing role or invalid token');
        const sessionRes = await fetch(`${request.nextUrl.origin}/api/auth/session`, {
          method: 'GET',
          headers: { cookie: request.headers.get('cookie') || '' },
          redirect: 'manual',
        });

        if (sessionRes.ok) {
          const sessionJson = await sessionRes.json();
          console.log('[PROXY] session.json fallback:', sessionJson);
          userRole = sessionJson?.user?.role || sessionJson?.role || userRole;
        } else {
          console.log('[PROXY] session fetch returned non-OK status:', sessionRes.status);
        }
      } catch (err) {
        console.log('[PROXY] Error while fetching /api/auth/session', err);
      }
    }

    if (!userRole) {
      // Couldn't determine role — redirect to login
      console.log('[PROXY] No user role found; redirecting to /auth/login');
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = '/auth/login';
      return NextResponse.redirect(loginUrl);
    }

    if (userRole !== 'admin') {
      console.log('[PROXY] userRole is not admin, redirecting to /');
      const homeUrl = request.nextUrl.clone();
      homeUrl.pathname = '/';
      return NextResponse.redirect(homeUrl);
    }

    return NextResponse.next();
  }

  if (pathname.startsWith('/dashboard')) {
    if (!hasSessionCookie) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = '/auth/login';
      return NextResponse.redirect(loginUrl);
    }
  }

  if (pathname.startsWith('/auth/login') || pathname.startsWith('/auth/forgotpassword')) {
    if (hasSessionCookie) {
      const dashboardUrl = request.nextUrl.clone();
      dashboardUrl.pathname = '/dashboard';
      return NextResponse.redirect(dashboardUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
