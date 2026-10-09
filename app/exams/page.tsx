import React from 'react';
import { getExamsAction, seedSampleExamsAction } from '@/actions/exam';
import { ExamsListClient } from '@/components/exam/ExamsListClient';

export const dynamic = 'force-dynamic';

export default async function ExamsPage() {
  // Seed sample exams if database is empty so users have instant access to rich LaTeX questions
  await seedSampleExamsAction();

  const res = await getExamsAction();
  const exams = res.exams || [];

  return <ExamsListClient exams={exams} />;
}
