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
    if (!token) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = '/auth/login';
      return NextResponse.redirect(loginUrl);
    }

    // Verify JWT and check admin role
    const payload = await verifyAuth(token);
    if (!payload) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = '/auth/login';
      return NextResponse.redirect(loginUrl);
    }

    // Check if user has admin role
    const userRole = payload.role || payload.user?.role;
    if (userRole !== 'admin') {
      const homeUrl = request.nextUrl.clone();
      homeUrl.pathname = '/';
      return NextResponse.redirect(homeUrl);
    }

    // Admin verified, allow access to /admin/dashboard
    return NextResponse.next();
  }

  // ── User Dashboard Protection ──
  if (pathname.startsWith('/dashboard')) {
    if (!hasSessionCookie) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = '/auth/login';
      return NextResponse.redirect(loginUrl);
    }
  }

  // ── Auth Pages Redirect ──
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
