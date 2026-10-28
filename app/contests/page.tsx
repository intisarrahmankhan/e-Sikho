import React from 'react';
import { auth } from '@/auth';
import dbConnect from '@/lib/mongoose';
import User from '@/models/User';
import { getContestsListAction } from '@/actions/contest';
import { ContestsListClient } from '@/components/contest/ContestsListClient';

export const dynamic = 'force-dynamic';

export default async function ContestsPage() {
  const session = await auth();
  const userId = (session?.user as any)?.id;
  const userEmail = (session?.user as any)?.email;

  let userBackground = '';
  const canCreate = ['INSTRUCTOR', 'ADMIN', 'SUPERADMIN'].includes((session?.user as any)?.role || '');

  if (userId || userEmail) {
    try {
      await dbConnect();
      let userQuery: any = null;
      if (typeof userId === 'string' && /^[0-9a-fA-F]{24}$/.test(userId)) {
        userQuery = { _id: userId };
      } else if (typeof userId === 'string' && userId.includes('@')) {
        userQuery = { email: userId };
      } else if (userEmail) {
        userQuery = { email: userEmail };
      }

      if (userQuery) {
        const user = (await User.findOne(userQuery).select('academicBackground department').lean()) as any;
        if (user?.department || user?.academicBackground) {
          userBackground = user.department || user.academicBackground;
        }
      }
    } catch (err) {
      console.warn('MongoDB query warning in ContestsPage:', err);
    }
  }

  const res = await getContestsListAction(undefined, userBackground);
  const contests = res.contests || [];

  return <ContestsListClient contests={contests} userBackground={userBackground} canCreate={canCreate} />;
}
