import { AUTH_SECRET } from '@/lib/auth-secret';
import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import Credentials from 'next-auth/providers/credentials';
import dbConnect from '@/lib/mongoose';
import User from '@/models/User';
import { consumeOtp } from '@/lib/otp';
import { normalizePhone, isValidBDPhone, hashPassword, verifyPassword, isValidMongoObjectId } from '@/lib/auth-helpers';


export const { handlers, auth, signIn, signOut } = NextAuth({
    trustHost: true,
    secret: AUTH_SECRET,
    providers: [
        Google({
            clientId: process.env.GOOGLE_CLIENT_ID || '',
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
        }),
        Credentials({
            name: 'Credentials',
            credentials: {
                email: { label: 'Email', type: 'email' },
                phone: { label: 'Phone', type: 'text' },
                password: { label: 'Password', type: 'password' },
                otp: { label: 'OTP', type: 'text' },
                role: { label: 'Role', type: 'text' },
                name: { label: 'Name', type: 'text' },
                isSignUp: { label: 'IsSignUp', type: 'text' },
            },
            async authorize(credentials) {
                if (!credentials?.phone && !credentials?.email) return null;

                try {
                    await dbConnect();
                } catch (dbErr: any) {
                    console.error('MongoDB connection error during authorize:', dbErr);
                    throw new Error('ডাটাবেজ সংযোগে সমস্যা হয়েছে (Database Connection Error)। অনুগ্রহ করে MongoDB Atlas-এ আপনার IP Whitelist যাচাই করুন।');
                }

                // 1. Phone number authentication (Sign up or Login with OTP / Password)
                if (credentials?.phone) {
                    const cleanPhone = normalizePhone(String(credentials.phone));
                    if (!isValidBDPhone(cleanPhone)) {
                        throw new Error('একটি সঠিক মোবাইল নম্বর লিখুন');
                    }

                    const isSignUp = credentials.isSignUp === 'true';
                    const requestedRole = String(credentials.role || 'STUDENT').toUpperCase();
                    const password = credentials.password ? String(credentials.password) : '';
                    const otp = credentials.otp ? String(credentials.otp).trim() : '';

                    if (isSignUp) {
                        if (!/^\d{6}$/.test(otp)) throw new Error('A verified signup OTP is required.');
                        if (password && password.length < 6) throw new Error('Password must have at least 6 characters.');
                        // Check if phone is already registered
                        const existingUser = await User.findOne({
                            $or: [{ phone: cleanPhone }, { email: `${cleanPhone}@phone.esikho.com` }],
                        });
                        if (existingUser) {
                            throw new Error('এই ফোন নম্বর দিয়ে ইতিমধ্যেই একটি অ্যাকাউন্ট তৈরি করা হয়েছে। অনুগ্রহ করে লগইন করুন।');
                        }

                        if (!await consumeOtp(otp, { phone: cleanPhone, purpose: 'SIGNUP' })) {
                            throw new Error('The verification code is invalid, expired or has reached its attempt limit. Request a new code.');
                        }

                        const name = String(
                            credentials.name || (requestedRole === 'INSTRUCTOR' ? 'ইন্সট্রাক্টর' : 'শিক্ষার্থী')
                        ).trim();
                        const hashedPassword = password ? hashPassword(password) : undefined;
                        const email = `${cleanPhone}@phone.esikho.com`;

                        const newUser = await User.create({
                            name,
                            phone: cleanPhone,
                            email,
                            password: hashedPassword,
                            role: 'STUDENT',
                            status: 'APPROVED',
                            image: '',
                        });

                        if (requestedRole === 'INSTRUCTOR') {
                            const InstructorRequest = (await import('@/models/InstructorRequest')).default;
                            const existingReq = await InstructorRequest.findOne({ userId: newUser._id });
                            if (!existingReq) {
                                await InstructorRequest.create({
                                    userId: newUser._id,
                                    reason: 'Requested instructor access during phone signup',
                                    status: 'PENDING',
                                });
                            }
                        }

                        return {
                            id: newUser._id.toString(),
                            name: newUser.name,
                            email: newUser.email,
                            phone: newUser.phone,
                            role: newUser.role,
                            status: newUser.status,
                            image: newUser.image || '',
                        };
                    } else {
                        // Login (via Password + OTP 2-Factor Authentication)
                        const user = await User.findOne({
                            ...(credentials.email
                                ? { email: String(credentials.email).toLowerCase().trim(), phone: cleanPhone }
                                : { $or: [{ phone: cleanPhone }, { email: `${cleanPhone}@phone.esikho.com` }] }),
                        });

                        if (!user) {
                            throw new Error('এই তথ্যে কোনো অ্যাকাউন্ট পাওয়া যায়নি। অনুগ্রহ করে সাইন আপ করুন।');
                        }

                        if (user.status === 'BLOCKED' || user.status === 'SUSPENDED') {
                            throw new Error('আপনার অ্যাকাউন্টটি সাময়িকভাবে বা স্থায়ীভাবে ব্লক করা হয়েছে। অ্যাডমিনের সাথে যোগাযোগ করুন। (Account Blocked)');
                        }

                        // Phone login always requires an OTP; password accounts require both factors.
                        if (!/^\d{6}$/.test(otp)) return null;
                        if (user.password && (!password || !verifyPassword(password, user.password))) return null;
                        if (!await consumeOtp(otp, {
                            phone: normalizePhone(user.phone || cleanPhone),
                            purpose: 'LOGIN',
                            userId: user._id.toString(),
                        })) return null;

                        return {
                            id: user._id.toString(),
                            name: user.name,
                            email: user.email,
                            phone: user.phone,
                            role: user.role,
                            status: user.status,
                            image: user.image || '',
                        };
                    }
                }

                // Email login must authenticate an existing account.
                if (!credentials?.email || !credentials?.password) return null;
                const email = String(credentials.email).toLowerCase().trim();
                const user = await User.findOne({ email });
                if (!user || !user.password || !verifyPassword(String(credentials.password), user.password)) return null;
                if (user.status === 'BLOCKED' || user.status === 'SUSPENDED') return null;
                // Using an email identifier must not bypass the linked phone's second factor.
                if (user.phone) {
                    const phone = normalizePhone(user.phone);
                    if (!isValidBDPhone(phone) || !await consumeOtp(String(credentials.otp || '').trim(), {
                        phone, purpose: 'LOGIN', userId: user._id.toString(),
                    })) return null;
                }


                return {
                    id: user._id.toString(),
                    name: user.name,
                    email: user.email,
                    phone: user.phone,
                    role: user.role,
                    status: user.status,
                    image: user.image || '',
                };
            },
        }),
    ],
    pages: {
        signIn: '/login',
        error: '/login',
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
            if (user?.email) {
                try {
                    await dbConnect();
                    const existingUser = await User.findOne({ email: user.email });
                    if (existingUser && (existingUser.status === 'BLOCKED' || existingUser.status === 'SUSPENDED')) {
                        return false; // Deny sign-in for blocked user
                    }
                    if (account?.provider === 'google') {
                        await User.findOneAndUpdate(
                            { email: user.email },
                            {
                                $set: {
                                    image: user.image ?? '',
                                },
                                $setOnInsert: {
                                    role: 'STUDENT',
                                    status: 'APPROVED',
                                    name: user.name ?? 'User',
                                    email: user.email,
                                },
                            },
                            { upsert: true, new: true, setDefaultsOnInsert: true }
                        );
                    }
                } catch (err) {
                    console.error('Error in signIn callback:', err);
                    return false;
                }
            }
            return true;
        },
        async jwt({ token, user, account, trigger }: any) {
            if (user) {
                token.id = (user as any).id || token.id;
                token.role = (user as any).role || token.role || 'STUDENT';
                token.status = (user as any).status || token.status || 'APPROVED';
                token.phone = (user as any).phone || token.phone;
                if (user.name) token.name = user.name;
            }

            // Ensure token.id is ALWAYS a valid 24-character hexadecimal MongoDB ObjectId.
            // If it is a UUID (e.g. from Google or NextAuth session defaults), an email, or missing, resolve it from MongoDB.
            const hasValidObjectId = isValidMongoObjectId(token.id);

            try {
                if (token.email || hasValidObjectId) {
                    await dbConnect();
                    const query = hasValidObjectId ? { _id: token.id } : { email: token.email };
                    let dbUser = await User.findOne(query).select('_id role status name phone email').lean() as any;
                    if (!dbUser || dbUser.status === 'BLOCKED' || dbUser.status === 'SUSPENDED') return null;
                    if (dbUser) {
                        token.id = dbUser._id.toString();
                        token.role = dbUser.role || token.role || 'STUDENT';
                        token.status = dbUser.status || token.status || 'APPROVED';
                        if (dbUser.phone) token.phone = dbUser.phone;
                        if (dbUser.name) token.name = dbUser.name;
                        if (dbUser.email) token.email = dbUser.email;
                    }
                }
            } catch (err) {
                console.warn('Database connection warning in jwt callback:', err);
                return null;
            }

            if (!isValidMongoObjectId(token.id)) return null;

            return token;
        },
        async session({ session, token }: any) {
            if (session.user) {
                (session.user as any).id = token.id;
                (session.user as any).role = token.role ?? 'STUDENT';
                (session.user as any).status = token.status ?? 'APPROVED';
                (session.user as any).phone = token.phone;
                if (token.name) session.user.name = token.name;
                if (token.email) session.user.email = token.email;
            }
            return session;
        },
    },
});
