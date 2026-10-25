import React from 'react';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { getStudentProfileAction } from '@/actions/student-actions';
import { StudentSettingsClient } from '@/components/dashboard/StudentSettingsClient';

export const dynamic = 'force-dynamic';

export default async function StudentSettingsPage() {
  const session = await auth();
  if (!session || !session.user) {
    redirect('/login');
  }

  const res = await getStudentProfileAction();
  if (res.error || !res.profile) {
    redirect('/login');
  }

  const effectiveRole = res.profile.role || (session.user as any)?.role;
  if (effectiveRole === 'INSTRUCTOR') {
    redirect('/instructor/settings');
  }
  if (effectiveRole === 'ADMIN' || effectiveRole === 'SUPERADMIN') {
    redirect('/admin');
  }

  return <StudentSettingsClient initialProfile={res.profile} />;
}
