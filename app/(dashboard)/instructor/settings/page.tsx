import React from 'react';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { getInstructorProfileAction } from '@/actions/instructor';
import { InstructorSettingsClient } from '@/components/dashboard/InstructorSettingsClient';

import dbConnect from '@/lib/mongoose';
import { isValidMongoObjectId } from '@/lib/auth-helpers';

export const dynamic = 'force-dynamic';

export default async function InstructorSettingsPage() {
  const session = await auth();
  const user = session?.user as { id?: string; email?: string; role?: string } | undefined;

  if (!session || !user) {
    redirect('/login');
  }

  let effectiveRole = user.role;
  try {
    await dbConnect();
    const { default: User } = await import('@/models/User');
    const userDoc = await User.findOne({
      $or: [
        { _id: isValidMongoObjectId(user.id) ? user.id : null },
        { email: user.email || (typeof user.id === 'string' && user.id.includes('@') ? user.id : null) }
      ]
    }).select('_id role').lean() as any;
    if (userDoc?.role) {
      effectiveRole = userDoc.role;
    }
  } catch (err: any) {
    if (err?.digest?.startsWith('NEXT_REDIRECT') || err?.message === 'NEXT_REDIRECT') {
      throw err;
    }
    console.warn('Database error in InstructorSettingsPage:', err);
  }

  if (effectiveRole !== 'INSTRUCTOR' && effectiveRole !== 'ADMIN' && effectiveRole !== 'SUPERADMIN') {
    redirect('/student/settings');
  }

  const res = await getInstructorProfileAction();
  if (res.error || !res.profile) {
    redirect('/login');
  }

  return <InstructorSettingsClient initialProfile={res.profile} />;
}
