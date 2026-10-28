import { auth } from '@/auth';
import React from 'react';
import { getExamsAction } from '@/actions/exam';
import { ExamsListClient } from '@/components/exam/ExamsListClient';

export const dynamic = 'force-dynamic';

export default async function ExamsPage() {

  const session = await auth();
  const canCreate = ['INSTRUCTOR', 'ADMIN', 'SUPERADMIN'].includes((session?.user as any)?.role || '');
  const res = await getExamsAction();
  const exams = res.exams || [];

  return <ExamsListClient exams={exams} canCreate={canCreate} />;
}
