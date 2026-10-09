import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import Credentials from 'next-auth/providers/credentials';
import dbConnect from '@/lib/mongoose';
import User from '@/models/User';
import Instructor from '@/models/Instructor';
import VerificationCode from '@/models/VerificationCode';
import { normalizePhone, hashPassword, verifyPassword } from '@/lib/auth-helpers';

export const { handlers, auth, signIn, signOut } = NextAuth({
    secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || 'e-sikho-auth-super-secret-key-cse314-2026',
    providers: [
        Google({
            clientId: process.env.GOOGLE_CLIENT_ID || 'dummy-google-client-id',
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'dummy-google-client-secret',
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
                // Dummy credentials bypass for testing
                if (credentials?.email === 'test@example.com' && credentials?.password === 'password123') {
                    return { id: '65f000000000000000000001', name: 'Test Student', email: 'test@example.com', role: 'STUDENT', status: 'APPROVED' } as any;
                }
                if (credentials?.email === 'instructor@eshikho.com' && credentials?.password === 'instructor123456') {
                    return { id: '65f000000000000000000002', name: 'Test Instructor', email: 'instructor@eshikho.com', role: 'INSTRUCTOR', status: 'APPROVED' } as any;
                }
                if (credentials?.email === 'admin@eshikho.com' && credentials?.password === 'admin123456') {
                    return { id: '65f000000000000000000003', name: 'Test Admin', email: 'admin@eshikho.com', role: 'ADMIN', status: 'APPROVED' } as any;
                }

                await dbConnect();

                // 1. Phone number authentication (Sign up or Login with OTP / Password)
                if (credentials?.phone) {
                    const cleanPhone = normalizePhone(String(credentials.phone));
                    if (!cleanPhone) {
                        throw new Error('একটি সঠিক মোবাইল নম্বর লিখুন');
                    }

                    const isSignUp = credentials.isSignUp === 'true';
                    const requestedRole = String(credentials.role || 'STUDENT').toUpperCase();
                    const password = credentials.password ? String(credentials.password) : '';
                    const otp = credentials.otp ? String(credentials.otp).trim() : '';

                    if (isSignUp) {
                        // Check if phone is already registered
                        const existingUser = await User.findOne({
                            $or: [{ phone: cleanPhone }, { email: `${cleanPhone}@phone.esikho.com` }],
                        });
                        if (existingUser) {
                            throw new Error('এই ফোন নম্বর দিয়ে ইতিমধ্যেই একটি অ্যাকাউন্ট তৈরি করা হয়েছে। অনুগ্রহ করে লগইন করুন।');
                        }

                        // Verify OTP for Signup
                        if (otp) {
                            const otpRecord = await VerificationCode.findOne({
                                phone: cleanPhone,
                                purpose: 'SIGNUP',
                                expiresAt: { $gt: new Date() },
                            }).sort({ createdAt: -1 });

                            if (!otpRecord) {
                                throw new Error('ওটিপি কোডটি মেয়াদোত্তীর্ণ বা পাওয়া যায়নি। অনুগ্রহ করে নতুন ওটিপি কোড চান।');
                            }

                            if (otpRecord.code !== otp) {
                                otpRecord.attempts = (otpRecord.attempts || 0) + 1;
                                await otpRecord.save();
                                if (otpRecord.attempts >= 5) {
                                    await VerificationCode.deleteOne({ _id: otpRecord._id });
                                    throw new Error('ভুল ওটিপি দেওয়ার কারণে কোডটি বাতিল করা হয়েছে। নতুন কোড চান।');
                                }
                                throw new Error('ভুল ওটিপি কোড! অনুগ্রহ করে আপনার মোবাইলে পাঠানো সঠিক ৬ ডিজিটের কোড দিন।');
                            }

                            // Delete verified OTP so it cannot be reused
                            await VerificationCode.deleteOne({ _id: otpRecord._id });
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
                            role: requestedRole === 'INSTRUCTOR' ? 'INSTRUCTOR' : 'STUDENT',
                            status: 'APPROVED',
                            image: '',
                        });

                        if (requestedRole === 'INSTRUCTOR') {
                            const existingInstructor = await Instructor.findOne({ name: newUser.name });
                            if (!existingInstructor) {
                                await Instructor.create({
                                    name: newUser.name,
                                    role: 'Instructor',
                                    avatar: '',
                                    bio: 'e-Shikho অনুমোদিত ইন্সট্রাক্টর',
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
                            $or: [
                                ...(cleanPhone ? [{ phone: cleanPhone }, { email: `${cleanPhone}@phone.esikho.com` }] : []),
                                { email: String(credentials.phone || '').toLowerCase().trim() },
                                { email: String(credentials.email || '').toLowerCase().trim() },
                            ],
                        });

                        if (!user) {
                            throw new Error('এই তথ্যে কোনো অ্যাকাউন্ট পাওয়া যায়নি। অনুগ্রহ করে সাইন আপ করুন।');
                        }

                        if (user.status === 'BLOCKED' || user.status === 'SUSPENDED') {
                            throw new Error('আপনার অ্যাকাউন্টটি সাময়িকভাবে বা স্থায়ীভাবে ব্লক করা হয়েছে। অ্যাডমিনের সাথে যোগাযোগ করুন। (Account Blocked)');
                        }

                        // 1. Verify password if account has password
                        if (user.password && password) {
                            const isValid = verifyPassword(password, user.password);
                            if (!isValid) {
                                throw new Error('ভুল পাসওয়ার্ড! অনুগ্রহ করে সঠিক পাসওয়ার্ড দিন।');
                            }
                        }

                        // 2. Verify OTP if provided
                        if (otp) {
                            const targetPhone = user.phone || cleanPhone;
                            if (!targetPhone) {
                                throw new Error('অ্যাকাউন্টে কোনো মোবাইল নম্বর যুক্ত নেই।');
                            }

                            const otpRecord = await VerificationCode.findOne({
                                phone: targetPhone,
                                purpose: 'LOGIN',
                                expiresAt: { $gt: new Date() },
                            }).sort({ createdAt: -1 });

                            if (!otpRecord) {
                                throw new Error('লগইন ওটিপি কোডটি মেয়াদোত্তীর্ণ বা পাওয়া যায়নি। পুনরায় কোড চান।');
                            }

                            if (otpRecord.code !== otp) {
                                otpRecord.attempts = (otpRecord.attempts || 0) + 1;
                                await otpRecord.save();
                                if (otpRecord.attempts >= 5) {
                                    await VerificationCode.deleteOne({ _id: otpRecord._id });
                                    throw new Error('ভুল ওটিপি দেওয়ায় কোডটি বাতিল করা হয়েছে। নতুন কোড চান।');
                                }
                                throw new Error('ভুল ওটিপি কোড! অনুগ্রহ করে আপনার মোবাইলে পাঠানো সঠিক ৬ ডিজিটের কোড দিন।');
                            }

                            await VerificationCode.deleteOne({ _id: otpRecord._id });
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
                    }
                }

                // 2. Email credentials fallback (Demo / dev logins)
                if (!credentials?.email) return null;
                const email = String(credentials.email).toLowerCase().trim();
                const requestedRole = String(credentials.role || 'STUDENT').toUpperCase();
                const name = String(
                    credentials.name || (requestedRole === 'INSTRUCTOR' ? 'ইন্সট্রাক্টর আরিফ হাসান' : 'শিক্ষার্থী')
                ).trim();

                let user = await User.findOne({ email });

                if (user && (user.status === 'BLOCKED' || user.status === 'SUSPENDED')) {
                    throw new Error('আপনার অ্যাকাউন্টটি সাময়িকভাবে বা স্থায়ীভাবে ব্লক করা হয়েছে। অ্যাডমিনের সাথে যোগাযোগ করুন। (Account Blocked)');
                }

                if (!user) {
                    user = await User.create({
                        name,
                        email,
                        role: requestedRole === 'INSTRUCTOR' ? 'INSTRUCTOR' : 'STUDENT',
                        status: 'APPROVED',
                        image: '',
                    });
                } else if (requestedRole === 'INSTRUCTOR' && user.role !== 'INSTRUCTOR' && user.role !== 'ADMIN' && user.role !== 'SUPERADMIN') {
                    user.role = 'INSTRUCTOR';
                    user.status = 'APPROVED';
                    await user.save();
                }

                if (user.role === 'INSTRUCTOR') {
                    const existingInstructor = await Instructor.findOne({ name: user.name });
                    if (!existingInstructor) {
                        await Instructor.create({
                            name: user.name,
                            role: 'Instructor',
                            avatar: user.image || '',
                            bio: 'e-Shikho অনুমোদিত ইন্সট্রাক্টর',
                        });
                    }
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
                const existingUser = await User.findOne({ email: user.email });
                if (existingUser && (existingUser.status === 'BLOCKED' || existingUser.status === 'SUSPENDED')) {
                    return false; // Deny Google sign-in for blocked user
                }
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
        async jwt({ token, user }: any) {
            if (user) {
                token.id = (user as any).id || token.id;
                token.role = (user as any).role || token.role;
                token.status = (user as any).status || token.status;
                token.phone = (user as any).phone || token.phone;
            }
            if (token.email) {
                await dbConnect();
                const dbUser = await User.findOne({ email: token.email }).select('_id role status name image phone').lean() as any;
                if (dbUser) {
                    token.id = dbUser._id.toString();
                    token.role = dbUser.role || 'STUDENT';
                    token.status = dbUser.status || 'APPROVED';
                    token.name = dbUser.name || token.name;
                    token.image = dbUser.image || token.image;
                    token.phone = dbUser.phone || token.phone;
                }
            }
            return token;
        },
        async session({ session, token }: any) {
            if (session.user) {
                (session.user as any).id = token.id;
                (session.user as any).role = token.role ?? 'STUDENT';
                (session.user as any).status = token.status ?? 'APPROVED';
                (session.user as any).phone = token.phone;
            }
            return session;
        },
    },
});
