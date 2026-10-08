import type { NextAuthConfig } from 'next-auth';
import Google from 'next-auth/providers/google';
import Credentials from 'next-auth/providers/credentials';

export const authConfig = {
  providers: [
    // Google is listed here so the middleware can read it without importing DB code
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // dummy credentials for testing
        if (credentials?.email === "test@example.com" && credentials?.password === "password123") {
          return { id: "65f000000000000000000001", name: "Test Student", email: "test@example.com", role: "STUDENT", status: "APPROVED" };
        }
        if (credentials?.email === "instructor@eshikho.com" && credentials?.password === "instructor123456") {
          return { id: "65f000000000000000000002", name: "Test Instructor", email: "instructor@eshikho.com", role: "INSTRUCTOR", status: "APPROVED" };
        }
        if (credentials?.email === "admin@eshikho.com" && credentials?.password === "admin123456") {
          return { id: "65f000000000000000000003", name: "Test Admin", email: "admin@eshikho.com", role: "ADMIN", status: "APPROVED" };
        }
        return null;
      }
    }),
  ],
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
        token.id = user.id;
        token.role = user.role;
        token.status = user.status;
      }
      return token;
    },
    // Required so middleware can read role/id/status from the JWT token
    session({ session, token }: any) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role ?? 'STUDENT';
        (session.user as any).status = token.status ?? 'APPROVED';
      }
      return session;
    },
  },
} satisfies NextAuthConfig;

