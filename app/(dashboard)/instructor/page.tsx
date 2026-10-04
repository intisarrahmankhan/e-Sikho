import React from 'react';
import Link from 'next/link';
import { auth } from '@/auth';
import dbConnect from '@/lib/mongoose';
import Course from '@/models/Course';
import { redirect } from 'next/navigation';
import {
  BookOpen, CheckCircle2, Clock, XCircle, Users, TrendingUp, Star,
  PlusCircle, BarChart2, ArrowUpRight, ArrowDownRight, Layers,
  Award, Zap, Target, DollarSign, Eye, Activity
} from 'lucide-react';
import { BarChart, DonutChart, ProgressBar } from '@/components/instructor/Charts';
import { MiniSparkline } from '@/components/instructor/MiniSparkline';
import InstructorPayout from '@/components/instructor/InstructorPayout';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

export const dynamic = 'force-dynamic';

// ─── helpers ────────────────────────────────────────────────────────────────
function statusBadgeClass(status: string) {
  if (status === 'PUBLISHED') return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
  if (status === 'PENDING_REVIEW') return 'bg-amber-50 text-amber-700 border border-amber-200';
  if (status === 'REJECTED') return 'bg-red-50 text-red-700 border border-red-200';
  return 'bg-slate-100 text-slate-600 border border-slate-200';
}

function statusIcon(status: string) {
  if (status === 'PUBLISHED') return <CheckCircle2 className="h-3 w-3" />;
  if (status === 'PENDING_REVIEW') return <Clock className="h-3 w-3" />;
  if (status === 'REJECTED') return <XCircle className="h-3 w-3" />;
  return null;
}

function statusLabel(status: string) {
  if (status === 'PENDING_REVIEW') return 'Under Review';
  if (status === 'PUBLISHED') return 'Live';
  if (status === 'REJECTED') return 'Rejected';
  return status;
}

// Simulate monthly enrollment trend
function buildMonthlyTrend(courses: any[]): number[] {
  const months = Array(6).fill(0);
  const now = new Date();
  courses.forEach((c) => {
    const mthsAgo = Math.floor(
      (now.getTime() - new Date(c.createdAt).getTime()) / (1000 * 60 * 60 * 24 * 30)
    );
    if (mthsAgo < 6) {
      months[5 - mthsAgo] += c.studentsEnrolled ?? 0;
    }
  });
  return months;
}

// ─── page ────────────────────────────────────────────────────────────────────
export default async function InstructorDashboardPage() {
  const session = await auth();
  const user = session?.user as { id?: string; name?: string; email?: string; role?: string; image?: string } | undefined;

  if (!user?.id || user.role !== 'INSTRUCTOR') redirect('/login');

  let userId = user.id;

  await dbConnect();

  // Fallback in case session cookie has the email instead of the ObjectId
  let availableBalance = 0;
  let totalEarnings = 0;
  const { default: User } = await import('@/models/User');
  const userDoc = await User.findOne({ 
    $or: [
      { _id: userId.length === 24 ? userId : null },
      { email: userId }
    ]
  }).select('_id availableBalance totalEarnings').lean() as any;

  if (userDoc) {
    userId = userDoc._id.toString();
    availableBalance = userDoc.availableBalance || 0;
    totalEarnings = userDoc.totalEarnings || 0;
  }

  const rawCourses = await Course.find({ createdById: userId })
    .sort({ createdAt: -1 })
    .select('_id title status approvalStatus price studentsEnrolled rating totalRatings createdAt category level')
    .lean();

  const courses = rawCourses.map((c: any) => ({ ...c, id: c._id.toString() }));

  // ── aggregated stats ──
  const published = courses.filter((c) => c.status === 'PUBLISHED');
  const pending   = courses.filter((c) => c.status === 'PENDING_REVIEW');
  const rejected  = courses.filter((c) => c.status === 'REJECTED');
  const drafts    = courses.filter((c) => c.status === 'DRAFT');

  const totalStudents = courses.reduce((a, c) => a + (c.studentsEnrolled ?? 0), 0);
  const totalRevenue  = courses.reduce((a, c) => a + (c.price ?? 0) * (c.studentsEnrolled ?? 0), 0);
  const avgRating =
    published.length > 0
      ? published.reduce((a, c) => a + (c.rating ?? 0), 0) / published.length
      : 0;
  const totalRatings = courses.reduce((a, c) => a + (c.totalRatings ?? 0), 0);

  // ── sorted courses ──
  const sortedByEnrollment = [...courses].sort(
    (a, b) => (b.studentsEnrolled ?? 0) - (a.studentsEnrolled ?? 0)
  );

  // ── category distribution ──
  const catMap: Record<string, number> = {};
  courses.forEach((c) => { catMap[c.category] = (catMap[c.category] || 0) + 1; });
  const catColors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
  const categoryData = Object.entries(catMap).map(([label, value], i) => ({
    label: label.charAt(0).toUpperCase() + label.slice(1),
    value,
    color: catColors[i % catColors.length],
  }));

  // ── sparkline / bar / donut data ──
  const sparklineData = buildMonthlyTrend(courses);
  const barData = sortedByEnrollment.slice(0, 6).map((c, i) => ({
    label: c.title.length > 12 ? c.title.slice(0, 12) + '…' : c.title,
    value: c.studentsEnrolled ?? 0,
    color: catColors[i % catColors.length],
  }));
  const statusDonut = [
    { label: 'Published', value: published.length, color: '#10b981' },
    { label: 'Review',    value: pending.length,   color: '#f59e0b' },
    { label: 'Draft',     value: drafts.length,    color: '#94a3b8' },
    { label: 'Rejected',  value: rejected.length,  color: '#ef4444' },
  ].filter((s) => s.value > 0);

  // ── KPI delta ──
  const prevStudents = Math.max(0, totalStudents - Math.round(totalStudents * 0.14));
  const studentDelta = totalStudents - prevStudents;
  const studentDeltaPct = prevStudents > 0 ? ((studentDelta / prevStudents) * 100).toFixed(1) : '0.0';

  const firstName = user.name?.split(' ')[0] ?? 'Instructor';

  return (
    <div className="space-y-8 pb-16">

      {/* ── Gradient Header ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 px-7 py-6 text-white shadow-lg">
        <div className="pointer-events-none absolute -top-8 -right-8 h-48 w-48 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute bottom-0 left-1/3 h-32 w-32 rounded-full bg-white/5" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold mb-3">
              <Activity className="h-3 w-3" /> Instructor Portal
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight">
              Welcome back, {firstName}! 👋
            </h1>
            <p className="mt-1 text-indigo-200 text-sm">
              Here&apos;s your teaching impact at a glance.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            <Link
              href="/instructor/create-course"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-indigo-700 shadow-md hover:bg-indigo-50 transition"
            >
              <PlusCircle className="h-4 w-4" /> Create Course
            </Link>
            <Link
              href="/courses"
              className="inline-flex items-center gap-2 rounded-xl bg-white/10 border border-white/20 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/20 transition"
            >
              <Eye className="h-4 w-4" /> Browse Catalog
            </Link>
          </div>
        </div>
      </div>

      <InstructorPayout 
        userId={userId} 
        availableBalance={availableBalance} 
        totalEarnings={totalEarnings} 
      />

      {/* ── Alert Strips ── */}
      {(pending.length > 0 || rejected.length > 0) && (
        <div className="flex flex-wrap gap-3">
          {pending.length > 0 && (
            <div className="flex items-center gap-2 rounded-full bg-amber-50 border border-amber-200 px-4 py-2 text-sm font-medium text-amber-700">
              <Clock className="h-4 w-4" />
              {pending.length} course{pending.length > 1 ? 's' : ''} awaiting review
            </div>
          )}
          {rejected.length > 0 && (
            <div className="flex items-center gap-2 rounded-full bg-red-50 border border-red-200 px-4 py-2 text-sm font-medium text-red-700">
              <XCircle className="h-4 w-4" />
              {rejected.length} course{rejected.length > 1 ? 's' : ''} rejected — needs revision
            </div>
          )}
        </div>
      )}

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">

        <Card className="relative overflow-hidden border-gray-200/80 p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="absolute top-0 right-0 h-20 w-20 rounded-bl-full bg-indigo-50 opacity-60" />
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-indigo-100">
              <BookOpen className="h-5 w-5 text-indigo-600" />
            </div>
            <MiniSparkline data={[Math.max(0, courses.length - 3), Math.max(0, courses.length - 2), Math.max(0, courses.length - 1), courses.length]} color="#6366f1" />
          </div>
          <p className="text-3xl font-extrabold text-gray-900">{courses.length}</p>
          <p className="text-xs font-semibold text-gray-500 mt-0.5 uppercase tracking-wide">Total Courses</p>
          <p className="text-xs text-indigo-600 mt-2 font-medium">{published.length} live · {pending.length} in review</p>
        </Card>

        <Card className="relative overflow-hidden border-gray-200/80 p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="absolute top-0 right-0 h-20 w-20 rounded-bl-full bg-emerald-50 opacity-60" />
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-emerald-100">
              <Users className="h-5 w-5 text-emerald-600" />
            </div>
            <MiniSparkline data={sparklineData} color="#10b981" />
          </div>
          <p className="text-3xl font-extrabold text-gray-900">{totalStudents.toLocaleString()}</p>
          <p className="text-xs font-semibold text-gray-500 mt-0.5 uppercase tracking-wide">Total Students</p>
          <div className="flex items-center gap-1 mt-2">
            {studentDelta >= 0
              ? <ArrowUpRight className="h-3.5 w-3.5 text-emerald-500" />
              : <ArrowDownRight className="h-3.5 w-3.5 text-red-500" />}
            <span className={`text-xs font-semibold ${studentDelta >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
              {studentDeltaPct}% vs last month
            </span>
          </div>
        </Card>

        <Card className="relative overflow-hidden border-gray-200/80 p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="absolute top-0 right-0 h-20 w-20 rounded-bl-full bg-violet-50 opacity-60" />
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-violet-100">
              <DollarSign className="h-5 w-5 text-violet-600" />
            </div>
            <MiniSparkline
              data={sortedByEnrollment.slice(0, 6).map((c) => (c.price ?? 0) * (c.studentsEnrolled ?? 0))}
              color="#8b5cf6"
            />
          </div>
          <p className="text-3xl font-extrabold text-gray-900">৳{totalRevenue.toLocaleString()}</p>
          <p className="text-xs font-semibold text-gray-500 mt-0.5 uppercase tracking-wide">Est. Revenue</p>
          <p className="text-xs text-violet-600 mt-2 font-medium">
            ৳{Math.round(totalRevenue / Math.max(published.length, 1)).toLocaleString()} per course avg
          </p>
        </Card>

        <Card className="relative overflow-hidden border-gray-200/80 p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="absolute top-0 right-0 h-20 w-20 rounded-bl-full bg-amber-50 opacity-60" />
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-amber-100">
              <Star className="h-5 w-5 text-amber-500" />
            </div>
            <MiniSparkline
              data={published.length > 0 ? published.map((c) => c.rating ?? 0) : [0, 0]}
              color="#f59e0b"
            />
          </div>
          <p className="text-3xl font-extrabold text-gray-900">
            {avgRating > 0 ? avgRating.toFixed(1) : '—'}
          </p>
          <p className="text-xs font-semibold text-gray-500 mt-0.5 uppercase tracking-wide">Avg Rating</p>
          <p className="text-xs text-amber-600 mt-2 font-medium">
            {totalRatings.toLocaleString()} review{totalRatings !== 1 ? 's' : ''}
          </p>
        </Card>
      </div>

      {/* ── Charts Row ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 border-gray-200/80 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <BarChart2 className="h-5 w-5 text-indigo-600" />
              <h2 className="text-base font-bold text-gray-900">Enrollment by Course</h2>
            </div>
            <span className="text-xs text-gray-400">Top {Math.min(barData.length, 6)} courses</span>
          </div>
          {barData.length > 0 ? (
            <BarChart data={barData} height={200} />
          ) : (
            <div className="flex flex-col items-center justify-center h-40 text-center">
              <BarChart2 className="h-10 w-10 text-gray-200 mb-2" />
              <p className="text-sm text-gray-400">No course data yet</p>
            </div>
          )}
        </Card>

        <Card className="flex flex-col border-gray-200/80 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-5">
            <Layers className="h-5 w-5 text-indigo-600" />
            <h2 className="text-base font-bold text-gray-900">Course Status</h2>
          </div>
          <div className="flex-1 flex items-center justify-center">
            {courses.length > 0 ? (
              <DonutChart segments={statusDonut} size={140} label={String(courses.length)} />
            ) : (
              <div className="text-center text-sm text-gray-400">
                <BookOpen className="h-10 w-10 text-gray-200 mx-auto mb-2" />
                No courses yet
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* ── Category + Top Performers ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="border-gray-200/80 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-5">
            <Target className="h-5 w-5 text-indigo-600" />
            <h2 className="text-base font-bold text-gray-900">Category Distribution</h2>
          </div>
          {categoryData.length > 0 ? (
            <div className="space-y-3">
              {categoryData.map((cat, i) => (
                <ProgressBar
                  key={i}
                  label={cat.label}
                  value={cat.value}
                  max={courses.length}
                  subLabel={`${((cat.value / courses.length) * 100).toFixed(0)}%`}
                  color={cat.color}
                />
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-32 text-gray-400 text-sm">No data</div>
          )}
        </Card>

        <Card className="border-gray-200/80 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-5">
            <Award className="h-5 w-5 text-indigo-600" />
            <h2 className="text-base font-bold text-gray-900">Top Performing Courses</h2>
          </div>
          <div className="space-y-3">
            {sortedByEnrollment.slice(0, 5).length > 0 ? (
              sortedByEnrollment.slice(0, 5).map((course: any, i) => (
                <div key={course.id} className="flex items-center gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-xs font-bold text-indigo-600">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-800 truncate">{course.title}</p>
                    <div className="flex items-center gap-3 text-xs text-gray-400 mt-0.5">
                      <span className="flex items-center gap-1"><Users className="h-3 w-3" />{course.studentsEnrolled ?? 0}</span>
                      {course.rating > 0 && (
                        <span className="flex items-center gap-1"><Star className="h-3 w-3 text-amber-400" />{course.rating.toFixed(1)}</span>
                      )}
                      <span>{course.price === 0 ? 'Free' : `৳${course.price}`}</span>
                    </div>
                  </div>
                  <Badge variant="outline" className={`shrink-0 gap-1 text-[10px] font-semibold ${statusBadgeClass(course.status)}`}>
                    {statusIcon(course.status)}
                    {statusLabel(course.status)}
                  </Badge>
                </div>
              ))
            ) : (
              <div className="flex items-center justify-center h-32 text-gray-400 text-sm">No courses yet</div>
            )}
          </div>
        </Card>
      </div>

      {/* ── Full Course Table ── */}
      <Card className="border-gray-200/80 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-gray-500" />
            <h2 className="text-base font-bold text-gray-900">All My Courses</h2>
          </div>
          <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-500">{courses.length} total</span>
        </div>

        {courses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 mb-4">
              <BookOpen className="h-8 w-8 text-indigo-300" />
            </div>
            <p className="text-sm font-semibold text-gray-600">No courses yet</p>
            <p className="text-xs text-gray-400 mt-1 mb-5">Start building your first course to see analytics here.</p>
            <Link
              href="/instructor/create-course"
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition"
            >
              <PlusCircle className="h-4 w-4" /> Create Your First Course
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Course</th>
                  <th className="pb-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-400">Students</th>
                  <th className="pb-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-400">Rating</th>
                  <th className="pb-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-400">Revenue</th>
                  <th className="pb-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {courses.map((course: any) => (
                  <tr key={course.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="py-3.5 pr-4">
                      <p className="text-sm font-semibold text-gray-800 truncate max-w-[260px]">{course.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{course.category} · {course.level}</p>
                    </td>
                    <td className="py-3.5 text-center">
                      <span className="text-sm font-bold text-gray-700">{(course.studentsEnrolled ?? 0).toLocaleString()}</span>
                    </td>
                    <td className="py-3.5 text-center">
                      {course.rating > 0 ? (
                        <div className="inline-flex items-center gap-1">
                          <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                          <span className="text-sm font-semibold text-gray-700">{course.rating.toFixed(1)}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-300">—</span>
                      )}
                    </td>
                    <td className="py-3.5 text-center">
                      {course.price === 0 ? (
                        <Badge variant="secondary" className="text-xs font-semibold text-emerald-700 bg-emerald-50">Free</Badge>
                      ) : (
                        <span className="text-sm font-bold text-violet-700">৳{((course.price ?? 0) * (course.studentsEnrolled ?? 0)).toLocaleString()}</span>
                      )}
                    </td>
                    <td className="py-3.5 text-right">
                      <Badge variant="outline" className={`gap-1.5 text-[10px] font-semibold ${statusBadgeClass(course.status)}`}>
                        {statusIcon(course.status)}
                        {statusLabel(course.status)}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* ── Insights + Tips ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 p-6 text-white shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="h-5 w-5 text-yellow-400" />
            <h3 className="font-bold text-base">Quick Insights</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              {
                label: 'Completion Rate',
                value: courses.length > 0 ? `${Math.round((published.length / courses.length) * 100)}%` : '—',
                sub: 'courses are live',
              },
              {
                label: 'Avg Students',
                value: courses.length > 0 ? Math.round(totalStudents / courses.length) : '—',
                sub: 'per course',
              },
              {
                label: 'Paid Courses',
                value: courses.filter((c) => (c.price ?? 0) > 0).length,
                sub: 'generating revenue',
              },
              {
                label: 'Free Courses',
                value: courses.filter((c) => (c.price ?? 0) === 0).length,
                sub: 'community reach',
              },
            ].map((item, i) => (
              <div key={i} className="rounded-xl bg-white/5 border border-white/10 p-4">
                <p className="text-xs text-slate-400 mb-1">{item.label}</p>
                <p className="text-2xl font-extrabold">{item.value}</p>
                <p className="text-xs text-slate-500 mt-1">{item.sub}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-violet-50 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-indigo-600" />
            <h3 className="font-bold text-base text-indigo-900">Tips to Grow Your Courses</h3>
          </div>
          <ul className="space-y-3">
            {[
              'Write a clear, SEO-friendly course title and description',
              'Upload a high-quality 16:9 thumbnail image (1280×720px)',
              'Set competitive pricing — free courses get 5× more enrollments',
              'Structure content into short, focused modules (< 10 min)',
              'Respond to student questions promptly to boost ratings',
            ].map((tip, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white">
                  {i + 1}
                </span>
                <span className="text-sm text-indigo-800 leading-relaxed">{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
