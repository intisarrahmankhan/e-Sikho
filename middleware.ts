import { NextResponse } from 'next/server';
import { auth } from '@/auth';

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const role = (req.auth?.user as any)?.role;
  const { pathname } = req.nextUrl;

  const isAuthPage = pathname.startsWith('/login');
  const isApiAuthRoute = pathname.startsWith('/api/auth');

  if (isApiAuthRoute) return NextResponse.next();

  if (isAuthPage) {
    if (isLoggedIn) {
      if (role === 'ADMIN' || role === 'SUPERADMIN') return NextResponse.redirect(new URL('/admin', req.url));
      if (role === 'INSTRUCTOR') return NextResponse.redirect(new URL('/instructor', req.url));
      if (role === 'STUDENT') return NextResponse.redirect(new URL('/student', req.url));
      return NextResponse.redirect(new URL('/student', req.url));
    }
    return NextResponse.next();
  }

  // Generic dashboard redirect to role-specific dashboard
  if (isLoggedIn && pathname === '/dashboard') {
    if (role === 'ADMIN' || role === 'SUPERADMIN') return NextResponse.redirect(new URL('/admin', req.url));
    if (role === 'INSTRUCTOR') return NextResponse.redirect(new URL('/instructor', req.url));
    if (role === 'STUDENT') return NextResponse.redirect(new URL('/student', req.url));
  }

  // Protect role specific routes
  if (pathname.startsWith('/admin') && role !== 'ADMIN' && role !== 'SUPERADMIN') {
    return NextResponse.redirect(new URL('/login', req.url));
  }
  if (pathname.startsWith('/instructor') && role !== 'INSTRUCTOR') {
    return NextResponse.redirect(new URL('/login', req.url));
  }
  if (pathname.startsWith('/student') && role !== 'STUDENT') {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // Require auth for protected routes if not logged in
  const isProtectedRoute = pathname.startsWith('/dashboard') || pathname.startsWith('/admin') || pathname.startsWith('/instructor') || pathname.startsWith('/student');
  if (!isLoggedIn && isProtectedRoute) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
};
