import { NextResponse } from 'next/server';
import NextAuth from 'next-auth';
import { authConfig } from '@/auth.config';

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const role = (req.auth?.user as any)?.role;
  const { pathname } = req.nextUrl;

  const isAuthPage = pathname.startsWith('/login');
  const isApiAuthRoute = pathname.startsWith('/api/auth');

  if (isApiAuthRoute) return NextResponse.next();

  // Helper to determine the dashboard based on role
  const getRoleDashboard = (userRole?: string) => {
    if (userRole === 'ADMIN' || userRole === 'SUPERADMIN') return '/admin';
    if (userRole === 'INSTRUCTOR') return '/instructor';
    if (userRole === 'STUDENT') return '/student';
    return null;
  };

  // If user is logged in and visits auth page (/login), redirect to callbackUrl or their dashboard
  if (isAuthPage) {
    if (isLoggedIn) {
      const callbackUrl = req.nextUrl.searchParams.get('callbackUrl');
      if (callbackUrl && callbackUrl.startsWith('/') && !callbackUrl.startsWith('/login')) {
        return NextResponse.redirect(new URL(callbackUrl, req.url));
      }

      const dashboard = getRoleDashboard(role);
      if (dashboard) {
        return NextResponse.redirect(new URL(dashboard, req.url));
      }
      // If logged in but role is unknown/missing, let them access login so they can re-authenticate
      return NextResponse.next();
    }
    return NextResponse.next();
  }

  // Require auth for protected routes if not logged in
  const isProtectedRoute =
    pathname === '/dashboard' ||
    pathname.startsWith('/payment') ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/instructor') ||
    pathname.startsWith('/student');

  if (!isLoggedIn && isProtectedRoute) {
    const callbackUrl = encodeURIComponent(pathname + req.nextUrl.search);
    return NextResponse.redirect(new URL(`/login?callbackUrl=${callbackUrl}`, req.url));
  }

  // Generic /dashboard redirect to role-specific dashboard
  if (isLoggedIn && pathname === '/dashboard') {
    const dashboard = getRoleDashboard(role) || '/student';
    return NextResponse.redirect(new URL(dashboard, req.url));
  }

  // Protect role specific routes for logged-in users
  if (isLoggedIn) {
    if (pathname.startsWith('/admin') && role !== 'ADMIN' && role !== 'SUPERADMIN') {
      const target = getRoleDashboard(role) || '/student';
      return NextResponse.redirect(new URL(target, req.url));
    }
    if (pathname.startsWith('/instructor') && role !== 'INSTRUCTOR') {
      const target = getRoleDashboard(role) || '/student';
      return NextResponse.redirect(new URL(target, req.url));
    }
    if (pathname.startsWith('/student') && role !== 'STUDENT') {
      const target = getRoleDashboard(role);
      if (target && target !== '/student') {
        return NextResponse.redirect(new URL(target, req.url));
      }
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
};
