import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import Credentials from 'next-auth/providers/credentials';
import dbConnect from '@/lib/mongoose';
import User from '@/models/User';

export const { handlers, auth, signIn, signOut } = NextAuth({
    providers: [
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
                    return { id: "65f000000000000000000001", name: "Test Student", email: "test@example.com", role: "STUDENT", status: "APPROVED" } as any;
                }
                if (credentials?.email === "instructor@eshikho.com" && credentials?.password === "instructor123456") {
                    return { id: "65f000000000000000000002", name: "Test Instructor", email: "instructor@eshikho.com", role: "INSTRUCTOR", status: "APPROVED" } as any;
                }
                if (credentials?.email === "admin@eshikho.com" && credentials?.password === "admin123456") {
                    return { id: "65f000000000000000000003", name: "Test Admin", email: "admin@eshikho.com", role: "ADMIN", status: "APPROVED" } as any;
                }
                return null;
            }
        }),
    ],
    pages: {
        signIn: '/login',
    },
    callbacks: {
        authorized({ auth, request: { nextUrl } }: any) {
            const isLoggedIn = !!auth?.user;
            const protectedPrefixes = ['/student', '/instructor', '/admin', '/dashboard'];
            const isProtected = protectedPrefixes.some((p) => nextUrl.pathname.startsWith(p));
            if (isProtected) return isLoggedIn;
            return true;
        },
        async signIn({ user }: any) {
            if (user?.email) {
                try {
                    await dbConnect();
                    await User.findOneAndUpdate(
                        { email: user.email },
                        {
                            $set: {
                                name: user.name ?? 'User',
                                image: user.image ?? '',
                                role: (user as any).role ?? 'STUDENT',
                                status: (user as any).status ?? 'APPROVED',
                            },
                        },
                        { upsert: true, new: true, setDefaultsOnInsert: true }
                    );
                } catch (err) {
                    console.error('Error upserting user in signIn callback:', err);
                }
            }
            return true;
        },
        async jwt({ token, user }: any) {
            if (user) {
                token.id = user.id;
                token.role = (user as any).role;
                token.status = (user as any).status;
            }
            if (token.email) {
                try {
                    await dbConnect();
                    const dbUser = await User.findOne({ email: token.email }).select('_id role status name').lean() as any;
                    if (dbUser) {
                        token.id = dbUser._id.toString();
                        token.role = dbUser.role || token.role || 'STUDENT';
                        token.status = dbUser.status || token.status || 'APPROVED';
                        if (dbUser.name) token.name = dbUser.name;
                    }
                } catch (e) {
                    console.error('Error in jwt callback:', e);
                }
            }
            return token;
        },
        async session({ session, token }: any) {
            if (session.user) {
                (session.user as any).id = token.id;
                (session.user as any).role = token.role ?? 'STUDENT';
                (session.user as any).status = token.status ?? 'APPROVED';
                if (token.name) session.user.name = token.name;
            }
            return session;
        },
    },
});
