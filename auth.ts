import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import dbConnect from '@/lib/mongoose';
import User from '@/models/User';

import Credentials from 'next-auth/providers/credentials';

export const { handlers, auth, signIn, signOut } = NextAuth({
    providers: [
        Google({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),
        Credentials({
            name: "Developer Auto Login",
            credentials: {
                role: { label: "Role (STUDENT, INSTRUCTOR, ADMIN)", type: "text", placeholder: "INSTRUCTOR" }
            },
            async authorize(credentials) {
                const role = (credentials?.role as string)?.toUpperCase() || 'INSTRUCTOR';
                
                // Return a mock user directly WITHOUT hitting MongoDB.
                // This avoids errors if the developer doesn't have a local MongoDB running.
                return {
                    id: `dev_${role.toLowerCase()}_12345`,
                    name: `Dev ${role}`,
                    email: `dev_${role.toLowerCase()}@eshikho.test`,
                    role: role,
                };
            }
        })
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
            // If user object is present (first login), attach role to token immediately
            if (user?.role) {
                token.role = user.role;
            }
            if (user?.id) {
                token.id = user.id;
            }

            // We always want to ensure token.id is the MongoDB ObjectId.
            // If it's a dev user, we skip DB entirely.
            if (token.email && token.email.endsWith('@eshikho.test')) {
                return token;
            }

            // If it's missing or somehow set to an email, we fetch it.
            if (token.email && (!token.id || token.id.includes('@'))) {
                try {
                    await dbConnect();
                    const dbUser = await User.findOne({ email: token.email }).select('_id role status').lean() as any;
                    if (dbUser) {
                        token.id = dbUser._id.toString();
                        token.role = dbUser.role;
                        token.status = dbUser.status;
                    }
                } catch (e) {
                    console.error("DB connection failed during auth JWT callback", e);
                }
            } else if (account?.provider === 'google' && token.email) {
                // First sign in fallback just in case
                try {
                    await dbConnect();
                    const dbUser = await User.findOne({ email: token.email }).select('_id role status').lean() as any;
                    if (dbUser) {
                        token.id = dbUser._id.toString();
                        token.role = dbUser.role;
                        token.status = dbUser.status;
                    }
                } catch (e) {
                    console.error("DB connection failed during auth JWT callback", e);
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
