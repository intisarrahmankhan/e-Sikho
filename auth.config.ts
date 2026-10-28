import { AUTH_SECRET } from '@/lib/auth-secret';
import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
  secret: AUTH_SECRET,
  providers: [], // Middleware only decodes sessions; authentication runs in auth.ts.
  pages: {
    signIn: '/login',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const protectedPrefixes = ['/student', '/instructor', '/admin', '/dashboard'];
      const isProtected = protectedPrefixes.some((p) => nextUrl.pathname.startsWith(p));
      if (isProtected) return isLoggedIn;
      return true;
    },
    jwt({ token, user }: any) {
      if (user) {
        token.id = (user as any).id || token.id;
        token.role = (user as any).role || token.role;
        token.status = (user as any).status || token.status;
        token.phone = (user as any).phone || token.phone;
      }
      return token;
    },
    // Required so middleware can read role/id/status from the JWT token
    session({ session, token }: any) {
      if (session.user) {
        (session.user as any).id = token.id || token.sub;
        (session.user as any).role = token.role ?? 'STUDENT';
        (session.user as any).status = token.status ?? 'APPROVED';
        (session.user as any).phone = token.phone;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
