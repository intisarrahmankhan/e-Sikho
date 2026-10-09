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

  return <StudentSettingsClient initialProfile={res.profile} />;
}
