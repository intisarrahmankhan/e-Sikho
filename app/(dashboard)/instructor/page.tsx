import React from "react";
import Link from 'next/link';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/mongoose';
import Course from '@/models/Course';
import { redirect } from 'next/navigation';
import { BookOpen, CheckCircle2, Clock, XCircle, Users, TrendingUp, Star, PlusCircle } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function InstructorDashboardPage() {
  const session = await auth();
  const user = session?.user as { id?: string; name?: string; email?: string; role?: string; image?: string } | undefined;

  if (!user?.id || user.role !== 'INSTRUCTOR') redirect('/login');

  await dbConnect();

  const rawCourses = await Course.find({ createdById: user.id })
    .sort({ createdAt: -1 })
    .select('_id title status approvalStatus price studentsEnrolled rating totalRatings createdAt')
    .lean();

  const courses = rawCourses.map((c: any) => ({ ...c, id: c._id.toString() }));

  const published = courses.filter((c) => c.status === 'PUBLISHED');
  const pending = courses.filter((c) => c.status === 'PENDING_REVIEW');
  const rejected = courses.filter((c) => c.status === 'REJECTED');
  const totalStudents = courses.reduce((acc, c) => acc + (c.studentsEnrolled ?? 0), 0);
  const avgRating =
    published.length > 0
      ? (published.reduce((acc, c) => acc + (c.rating ?? 0), 0) / published.length).toFixed(1)
      : '—';

  function statusBadge(status: string) {
    if (status === 'PUBLISHED') return 'bg-emerald-50 text-emerald-700';
    if (status === 'PENDING_REVIEW') return 'bg-amber-50 text-amber-700';
    if (status === 'REJECTED') return 'bg-red-50 text-red-700';
    return 'bg-slate-100 text-slate-600';
  }

  function statusIcon(status: string) {
    if (status === 'PUBLISHED') return <CheckCircle2 className="h-3.5 w-3.5" />;
    if (status === 'PENDING_REVIEW') return <Clock className="h-3.5 w-3.5" />;
    if (status === 'REJECTED') return <XCircle className="h-3.5 w-3.5" />;
    return null;
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex items-start justify-between border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Instructor Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            Welcome back, {user.name?.split(' ')[0] ?? 'Instructor'}! Manage your courses and track your impact.
          </p>
        </div>
        <Link
          href="/instructor/create-course"
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
        >
          <PlusCircle className="h-4 w-4" />
          Create Course
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-indigo-600 mb-2">
            <BookOpen className="h-4 w-4" />
            <span className="text-xs font-semibold uppercase tracking-wide">Total Courses</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{courses.length}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-emerald-600 mb-2">
            <CheckCircle2 className="h-4 w-4" />
            <span className="text-xs font-semibold uppercase tracking-wide">Published</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{published.length}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-blue-600 mb-2">
            <Users className="h-4 w-4" />
            <span className="text-xs font-semibold uppercase tracking-wide">Students</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{totalStudents}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-amber-500 mb-2">
            <Star className="h-4 w-4" />
            <span className="text-xs font-semibold uppercase tracking-wide">Avg Rating</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{avgRating}</p>
        </div>
      </div>

      {/* Quick Status Row */}
      {(pending.length > 0 || rejected.length > 0) && (
        <div className="flex flex-wrap gap-3">
          {pending.length > 0 && (
            <div className="flex items-center gap-2 rounded-full bg-amber-50 px-4 py-2 text-sm font-medium text-amber-700">
              <Clock className="h-4 w-4" />
              {pending.length} course{pending.length > 1 ? 's' : ''} awaiting review
            </div>
          )}
          {rejected.length > 0 && (
            <div className="flex items-center gap-2 rounded-full bg-red-50 px-4 py-2 text-sm font-medium text-red-700">
              <XCircle className="h-4 w-4" />
              {rejected.length} course{rejected.length > 1 ? 's' : ''} rejected
            </div>
          )}
        </div>
      )}

      {/* My Courses */}
      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-gray-900">My Courses</h2>
          <span className="text-xs text-gray-400">{courses.length} total</span>
        </div>

        {courses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <BookOpen className="mb-3 h-10 w-10 text-slate-300" />
            <p className="text-sm font-medium text-slate-500">No courses yet</p>
            <p className="text-xs text-slate-400 mt-1">Create your first course below</p>
          </div>
        ) : (
          <div className="space-y-3">
            {courses.map((course: any) => (
              <div
                key={course.id}
                className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 hover:bg-gray-100 transition"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-gray-900">{course.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {course.studentsEnrolled ?? 0} students ·{' '}
                    {course.price === 0 ? 'Free' : `৳${course.price}`}
                    {course.rating > 0 && ` · ⭐ ${course.rating.toFixed(1)}`}
                  </p>
                </div>
                <span
                  className={`ml-4 inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${statusBadge(course.status)}`}
                >
                  {statusIcon(course.status)}
                  {course.status === 'PENDING_REVIEW' ? 'Under Review' : course.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>



      {/* Tips */}
      <section className="rounded-xl border border-indigo-100 bg-indigo-50 p-6">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="h-5 w-5 text-indigo-600" />
          <h3 className="font-bold text-indigo-900">Tips for approval</h3>
        </div>
        <ul className="space-y-2 text-sm text-indigo-800">
          <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-indigo-400" />Write a clear, detailed course description</li>
          <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-indigo-400" />Upload a high-quality course thumbnail image</li>
          <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-indigo-400" />Set appropriate pricing (0 for free courses)</li>
          <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-indigo-400" />Include well-structured lesson content in your first module</li>
        </ul>
      </section>
    </div>
  );
}
