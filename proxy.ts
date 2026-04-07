import { NextRequest, NextResponse } from 'next/server';

export const proxy = (request: NextRequest) => {
  const pathname = request.nextUrl.pathname;
  const hasSessionCookie =
    request.cookies.has('next-auth.session-token') ||
    request.cookies.has('__Secure-next-auth.session-token');
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
};

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
