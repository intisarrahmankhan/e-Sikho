import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import dbConnect from '@/lib/mongoose';
import User from '@/models/User';

export const { handlers: { GET, POST }, auth, signIn, signOut } = NextAuth({
    providers: [
        Google({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
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
        async signIn({ user, account }: any) {
            if (account?.provider === 'google' && user.email) {
                await dbConnect();
                await User.findOneAndUpdate(
                    { email: user.email },
                    {
                        $set: { image: user.image ?? '' },
                        $setOnInsert: {
                            name: user.name ?? 'User',
                            email: user.email,
                            role: 'STUDENT',
                            status: 'APPROVED',
                        },
                    },
                    { upsert: true, new: true, setDefaultsOnInsert: true }
                );
            }
            return true;
        },
        async jwt({ token, user, account }: any) {
            if (account?.provider === 'google' && token.email) {
                await dbConnect();
                const dbUser = await User.findOne({ email: token.email }).select('_id role status').lean() as any;
                if (dbUser) {
                    token.id = dbUser._id.toString();
                    token.role = dbUser.role;
                    token.status = dbUser.status;
                }
            }
            return token;
        },
        async session({ session, token }: any) {
            if (session.user) {
                (session.user as any).id = token.id;
                (session.user as any).role = token.role ?? 'STUDENT';
                (session.user as any).status = token.status ?? 'APPROVED';
            }
            return session;
        },
    },
});
