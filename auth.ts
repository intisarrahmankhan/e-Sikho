import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import dbConnect from '@/lib/mongoose';
import User from '@/models/User';

export const { handlers, signIn, signOut, auth } = NextAuth({
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
    async signIn({ user, account }) {
      // On first Google login, upsert the user into MongoDB
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
    async jwt({ token, user, account }) {
      if (account?.provider === 'google' && token.email) {
        // Fetch the stored role from MongoDB on every new login
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
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role ?? 'STUDENT';
        (session.user as any).status = token.status ?? 'APPROVED';
      }
      return session;
    },
  },
});