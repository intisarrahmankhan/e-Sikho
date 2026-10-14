import React from 'react';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { auth } from '@/auth';
import { getCourseCurriculum, getCourseQuizzes } from '@/actions/instructor';
import LectureManager from '@/components/instructor/LectureManager';
import { ArrowLeft, BookOpen, Layers } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }> | { id: string };
}

export default async function CourseLecturesPage({ params }: PageProps) {
  const session = await auth();
  const user = session?.user as { id?: string; role?: string } | undefined;

  if (!user?.id || (user.role !== 'INSTRUCTOR' && user.role !== 'ADMIN' && user.role !== 'SUPERADMIN')) {
    redirect('/login');
  }

  const resolvedParams = await Promise.resolve(params);
  const courseId = resolvedParams.id;

  const [curriculumRes, quizRes] = await Promise.all([
    getCourseCurriculum(courseId),
    getCourseQuizzes(courseId),
  ]);

  if (!curriculumRes.success || !curriculumRes.course) {
    notFound();
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Navigation Breadcrumb */}
      <div className="flex items-center justify-between border-b border-gray-200 pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/instructor"
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>ইন্সট্রাক্টর ড্যাশবোর্ড</span>
          </Link>
          <span className="text-gray-300">/</span>
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-indigo-600" />
            <span className="text-sm font-semibold text-gray-800 truncate max-w-sm">
              কারিকুলাম ও লেকচার বিল্ডার
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/courses/${courseId}`}
            target="_blank"
            className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-gray-700 shadow-sm hover:bg-gray-50 transition"
          >
            <BookOpen className="h-3.5 w-3.5 text-indigo-600" />
            <span>কোর্স পেজ দেখুন</span>
          </Link>
        </div>
      </div>

      {/* Main Interactive Curriculum Builder */}
      <LectureManager
        course={curriculumRes.course}
        quizzes={quizRes.quizzes || []}
      />
    </div>
  );
}
