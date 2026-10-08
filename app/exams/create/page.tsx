import React from 'react';
import Link from 'next/link';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import dbConnect from '@/lib/mongoose';
import Course from '@/models/Course';
import ExamCreateForm from '@/components/exam/ExamCreateForm';
import { ChevronLeft } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function CreateExamPage() {
  const session = await auth();
  if (!session || !session.user) {
    redirect('/login');
  }

  await dbConnect();
  const rawCourses = await Course.find({ status: 'PUBLISHED' })
    .select('_id title')
    .lean();

  const courses = rawCourses.map((c: any) => ({
    id: c._id.toString(),
    title: c.title,
  }));

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

      <ExamCreateForm courses={courses} />
    </div>
  );
}
