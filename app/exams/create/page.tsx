import React from 'react';
import Link from 'next/link';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import dbConnect from '@/lib/mongoose';
import Course from '@/models/Course';
import { getAssessmentCreationContextAction } from '@/actions/assessment-management';
import ExamCreateForm from '@/components/exam/ExamCreateForm';
import { ChevronLeft } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function CreateExamPage() {
  const session = await auth();
  if (!session || !session.user) {
    redirect('/login');
  }

  const context = await getAssessmentCreationContextAction('EXAM');
  if (context.error) redirect('/exams');
  const courses = context.courses;

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Link
          href="/exams"
          className="inline-flex items-center gap-1 hover:text-primary-600 transition"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>সকল পরীক্ষাসমূহ</span>
        </Link>
        <span>/</span>
        <span className="text-slate-900 font-medium">নতুন পরীক্ষা তৈরি</span>
      </div>

      <ExamCreateForm courses={courses} canCreateGlobal={context.canCreateGlobal} />
    </div>
  );
}
