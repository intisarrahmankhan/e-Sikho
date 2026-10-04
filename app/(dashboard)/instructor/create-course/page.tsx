import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import CourseForm from '@/components/instructor/CourseForm';
import { ArrowLeft, PlusCircle } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function CreateCoursePage() {
  const session = await auth();
  const user = session?.user as { id?: string; role?: string } | undefined;

  if (!user?.id || user.role !== 'INSTRUCTOR') redirect('/login');

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/instructor"
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Create New Course</h1>
            <p className="mt-0.5 text-sm text-gray-500">Fill in the details below and submit for admin review.</p>
          </div>
        </div>
      </div>

      {/* Form Card */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-6">
          <PlusCircle className="h-5 w-5 text-indigo-600" />
          <h2 className="text-lg font-bold text-gray-900">Course Details</h2>
        </div>
        <CourseForm />
      </div>
    </div>
  );
}
