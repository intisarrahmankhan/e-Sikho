import React from 'react';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { getInstructorProfileAction } from '@/actions/instructor';
import { InstructorSettingsClient } from '@/components/dashboard/InstructorSettingsClient';

export const dynamic = 'force-dynamic';

export default async function InstructorSettingsPage() {
  const session = await auth();
  const user = session?.user as { role?: string } | undefined;

  if (!session || !user) {
    redirect('/login');
  }

  if (user.role !== 'INSTRUCTOR' && user.role !== 'ADMIN' && user.role !== 'SUPERADMIN') {
    redirect('/student/settings');
  }

  const res = await getInstructorProfileAction();
  if (res.error || !res.profile) {
    redirect('/login');
  }

  return <InstructorSettingsClient initialProfile={res.profile} />;
}
