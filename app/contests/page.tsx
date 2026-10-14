import React from 'react';
import { auth } from '@/auth';
import dbConnect from '@/lib/mongoose';
import User from '@/models/User';
import { getHomepageContestsAction } from '@/actions/contest';
import { ContestsListClient } from '@/components/contest/ContestsListClient';

export const dynamic = 'force-dynamic';

export default async function ContestsPage() {
  const session = await auth();
  const userId = (session?.user as any)?.id;

  let userBackground = 'Computer Science & Engineering (CSE)';

  if (userId) {
    await dbConnect();
    let userQuery: any = { _id: userId };
    if (typeof userId === 'string' && userId.includes('@')) {
      userQuery = { email: userId };
    }
    const user = await User.findOne(userQuery).select('academicBackground').lean() as any;
    if (user?.academicBackground) {
      userBackground = user.academicBackground;
    }
  }

  const res = await getHomepageContestsAction(userBackground);
  const contests = res.contests || [];

  return <ContestsListClient contests={contests} userBackground={userBackground} />;
}
