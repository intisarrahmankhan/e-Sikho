import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import dbConnect from '@/lib/mongoose';
import User from '@/models/User';
import Course from '@/models/Course';
import Instructor from '@/models/Instructor';
import InstructorRequest from '@/models/InstructorRequest';
import PayoutRequest from '@/models/PayoutRequest';
import PlatformCommission from '@/models/PlatformCommission';
import PendingApprovals from '@/components/admin/PendingApprovals';
import FinancialAnalytics from '@/components/admin/FinancialAnalytics';
import PaginatedUsersList from '@/components/admin/PaginatedUsersList';
import CourseApprovals from '@/components/admin/CourseApprovals';
import InstructorRequests from '@/components/admin/InstructorRequests';
import CourseReviews from '@/components/admin/CourseReviews';
import CourseManagement from '@/components/admin/CourseManagement';
import { Card, CardContent } from '@/components/ui/Card';
import {
  Users, BookOpen, GraduationCap, Clock, ShieldCheck,
  AlertTriangle, CheckCircle2, BarChart3, Settings, Bell
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const session = await auth();
  if (!session) redirect('/login');

  const user = session.user as { name?: string; email?: string; role?: string };

  await dbConnect();

  const rawPendingUsers = await User.find({ status: 'PENDING' })
    .select('_id name email role createdAt')
    .sort({ createdAt: -1 })
    .lean();
  const pendingUsers = rawPendingUsers.map((u: any) => ({ ...u, id: u._id.toString() }));

  const rawPendingCourses = await Course.find({ status: 'PENDING_REVIEW' })
    .select('_id title category createdAt instructor')
    .populate({ path: 'instructor', select: 'name role' })
    .sort({ createdAt: -1 })
    .lean();
  const pendingCourses = rawPendingCourses.map((c: any) => ({ ...c, id: c._id.toString() }));

  const rawInstructorRequests = await InstructorRequest.find({
    status: { $in: ['PENDING', 'ADMIN_APPROVED', 'SUPERADMIN_APPROVED'] }
  })
    .populate({ path: 'userId', select: 'name email' })
    .sort({ createdAt: 1 })
    .lean();
  const instructorRequests = rawInstructorRequests.map((r: any) => ({
    ...r, id: r._id.toString(), user: r.userId
  }));

  const rawCourseReviews = await Course.find({ approvalStatus: 'PENDING_REVIEW' })
    .populate({ path: 'instructor', select: 'name' })
    .sort({ createdAt: 1 })
    .lean();
  const courseReviews = rawCourseReviews.map((c: any) => ({ ...c, id: c._id.toString() }));

  const totalCourses   = await Course.countDocuments();
  const totalStudents  = await User.countDocuments({ role: 'STUDENT', status: 'APPROVED' });
  const totalFaculty   = await User.countDocuments({ role: 'INSTRUCTOR', status: 'APPROVED' });
  const totalPending   = pendingUsers.length;

  // Financial Analytics
  const commissionAgg = await PlatformCommission.aggregate([
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$totalAmount' },
        platformCommission: { $sum: '$commissionAmount' },
        instructorEarnings: { $sum: '$instructorEarnings' },
      }
    }
  ]);
  const finStats = commissionAgg[0] || { totalRevenue: 0, platformCommission: 0, instructorEarnings: 0 };

  const rawPayouts = await PayoutRequest.find().sort({ createdAt: -1 }).lean();
  const payoutRequests = rawPayouts.map((r: any) => ({ ...r, id: r._id.toString(), userId: r.userId.toString() }));

  const totalAlerts = pendingUsers.length + pendingCourses.length + instructorRequests.length + payoutRequests.filter((p: any) => p.status === 'REQUESTED').length;

  const metrics = [
    {
      label: 'Total Courses',
      value: totalCourses,
      icon: BookOpen,
      gradient: 'from-violet-500 to-purple-600',
      bg: 'bg-violet-50',
      text: 'text-violet-700',
      border: 'border-violet-100',
    },
    {
      label: 'Active Students',
      value: totalStudents,
      icon: Users,
      gradient: 'from-blue-500 to-indigo-600',
      bg: 'bg-blue-50',
      text: 'text-blue-700',
      border: 'border-blue-100',
    },
    {
      label: 'Instructors',
      value: totalFaculty,
      icon: GraduationCap,
      gradient: 'from-emerald-500 to-teal-600',
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      border: 'border-emerald-100',
    },
    {
      label: 'Pending Approvals',
      value: totalPending,
      icon: Clock,
      gradient: 'from-amber-500 to-orange-600',
      bg: 'bg-amber-50',
      text: 'text-amber-700',
      border: 'border-amber-100',
      alert: totalPending > 0,
    },
  ];

  return (
    <div className="space-y-8 pb-16 max-w-7xl mx-auto">

      {/* ── Header ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-7 py-7 text-white shadow-xl border border-slate-700">
        <div className="pointer-events-none absolute -top-10 -right-10 h-56 w-56 rounded-full bg-indigo-600/10" />
        <div className="pointer-events-none absolute bottom-0 left-1/4 h-40 w-40 rounded-full bg-violet-600/10" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/20 px-3 py-1 text-xs font-semibold mb-3">
              <ShieldCheck className="h-3.5 w-3.5 text-indigo-400" />
              Admin Control Panel
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight">
              Welcome, {user?.name?.split(' ')[0] ?? 'Admin'} 👋
            </h1>
            <p className="mt-1 text-slate-400 text-sm max-w-md">
              Platform overview · Moderate users, courses, and instructor promotions from one place.
            </p>
          </div>
          <div className="flex flex-col items-end gap-3">
            {user?.role === 'SUPERADMIN' && (
              <a href="/admin/audit" className="flex items-center gap-2 rounded-xl bg-indigo-500/20 border border-indigo-500/30 px-4 py-2 text-sm font-semibold text-indigo-300 hover:bg-indigo-500/30 transition-colors">
                <ShieldCheck className="h-4 w-4 shrink-0" />
                <span>Audit Trail</span>
              </a>
            )}
            {totalAlerts > 0 && (
              <div className="flex items-center gap-2 rounded-xl bg-amber-500/20 border border-amber-500/30 px-4 py-2 text-sm font-semibold text-amber-300">
                <Bell className="h-4 w-4 shrink-0" />
                <span>{totalAlerts} item{totalAlerts !== 1 ? 's' : ''} pending</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Metric Cards ── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {metrics.map((m, i) => (
          <Card key={i} className={`relative overflow-hidden border ${m.border} p-5 shadow-sm hover:shadow-md transition-shadow`}>
            <div className={`absolute top-0 right-0 h-20 w-20 rounded-bl-full ${m.bg} opacity-60`} />
            <div className="flex items-start justify-between mb-3">
              <div className={`flex items-center justify-center h-10 w-10 rounded-xl ${m.bg} border ${m.border}`}>
                <m.icon className={`h-5 w-5 ${m.text}`} />
              </div>
              {m.alert && (
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500 animate-pulse mt-1" />
              )}
            </div>
            <p className="text-3xl font-extrabold text-gray-900">{m.value}</p>
            <p className={`text-xs font-semibold uppercase tracking-wide mt-0.5 ${m.text}`}>{m.label}</p>
          </Card>
        ))}
      </div>

      <div className="space-y-6">

        {/* Financial Analytics & Payouts */}
        <Card className="overflow-hidden border-gray-200/80 shadow-sm">
          <div className="flex items-center gap-3 border-b border-gray-100 px-6 py-4 bg-gradient-to-r from-emerald-50 to-teal-50">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100">
              <BarChart3 className="h-4 w-4 text-emerald-700" />
            </div>
            <div className="flex-1">
              <h2 className="text-sm font-bold text-gray-900">Financial Analytics & Payouts</h2>
              <p className="text-xs text-gray-500">Platform revenue, commissions, and instructor payout ledger</p>
            </div>
            {payoutRequests.filter((p: any) => p.status === 'REQUESTED').length > 0 && (
              <span className="rounded-full bg-emerald-200 px-2.5 py-1 text-xs font-bold text-emerald-800">
                {payoutRequests.filter((p: any) => p.status === 'REQUESTED').length} payout requests
              </span>
            )}
          </div>
          <CardContent className="p-6">
            <FinancialAnalytics 
              totalRevenue={finStats.totalRevenue}
              platformCommission={finStats.platformCommission}
              instructorEarnings={finStats.instructorEarnings}
              payoutRequests={payoutRequests}
            />
          </CardContent>
        </Card>

        {/* Pending User Registrations */}
        <Card className="overflow-hidden border-gray-200/80 shadow-sm">
          <div className="flex items-center gap-3 border-b border-gray-100 px-6 py-4 bg-gradient-to-r from-amber-50 to-orange-50">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100">
              <Users className="h-4 w-4 text-amber-700" />
            </div>
            <div className="flex-1">
              <h2 className="text-sm font-bold text-gray-900">Pending User Registrations</h2>
              <p className="text-xs text-gray-500">Approve or reject new user sign-ups</p>
            </div>
            {pendingUsers.length > 0 && (
              <span className="rounded-full bg-amber-200 px-2.5 py-1 text-xs font-bold text-amber-800">
                {pendingUsers.length} pending
              </span>
            )}
          </div>
          <CardContent className="p-6">
            <PendingApprovals pendingUsers={pendingUsers} />
          </CardContent>
        </Card>

        {/* Instructor Promotion Requests */}
        <Card className="overflow-hidden border-gray-200/80 shadow-sm">
          <div className="flex items-center gap-3 border-b border-gray-100 px-6 py-4 bg-gradient-to-r from-violet-50 to-indigo-50">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100">
              <GraduationCap className="h-4 w-4 text-violet-700" />
            </div>
            <div className="flex-1">
              <h2 className="text-sm font-bold text-gray-900">Instructor Promotion Requests</h2>
              <p className="text-xs text-gray-500">Both Admin & SuperAdmin approval required to promote</p>
            </div>
            {instructorRequests.length > 0 && (
              <span className="rounded-full bg-violet-200 px-2.5 py-1 text-xs font-bold text-violet-800">
                {instructorRequests.length} pending
              </span>
            )}
          </div>
          <CardContent className="p-6">
            <InstructorRequests requests={instructorRequests} />
          </CardContent>
        </Card>

        {/* Course Submissions for Review */}
        <Card className="overflow-hidden border-gray-200/80 shadow-sm">
          <div className="flex items-center gap-3 border-b border-gray-100 px-6 py-4 bg-gradient-to-r from-sky-50 to-blue-50">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-100">
              <BookOpen className="h-4 w-4 text-sky-700" />
            </div>
            <div className="flex-1">
              <h2 className="text-sm font-bold text-gray-900">Course Submissions for Review</h2>
              <p className="text-xs text-gray-500">Review instructor-submitted course content</p>
            </div>
            {courseReviews.length > 0 && (
              <span className="rounded-full bg-sky-200 px-2.5 py-1 text-xs font-bold text-sky-800">
                {courseReviews.length} to review
              </span>
            )}
          </div>
          <CardContent className="p-6">
            <CourseReviews courses={courseReviews} />
          </CardContent>
        </Card>

        {/* Course Approval Queue */}
        <Card className="overflow-hidden border-gray-200/80 shadow-sm">
          <div className="flex items-center gap-3 border-b border-gray-100 px-6 py-4 bg-gradient-to-r from-emerald-50 to-teal-50">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100">
              <CheckCircle2 className="h-4 w-4 text-emerald-700" />
            </div>
            <div className="flex-1">
              <h2 className="text-sm font-bold text-gray-900">Course Approval Queue</h2>
              <p className="text-xs text-gray-500">Final approval before courses go live</p>
            </div>
            {pendingCourses.length > 0 && (
              <span className="rounded-full bg-emerald-200 px-2.5 py-1 text-xs font-bold text-emerald-800">
                {pendingCourses.length} queued
              </span>
            )}
          </div>
          <CardContent className="p-6">
            <CourseApprovals pendingCourses={pendingCourses} />
          </CardContent>
        </Card>

        {/* Platform Course Management (All Courses) */}
        <Card className="overflow-hidden border-gray-200/80 shadow-sm">
          <div className="flex items-center gap-3 border-b border-gray-100 px-6 py-4 bg-gradient-to-r from-violet-50 to-purple-50">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100">
              <BookOpen className="h-4 w-4 text-violet-700" />
            </div>
            <div className="flex-1">
              <h2 className="text-sm font-bold text-gray-900">Platform Course Management</h2>
              <p className="text-xs text-gray-500">Create, edit, remove, and manage all platform courses</p>
            </div>
            <span className="rounded-full bg-violet-200 px-2.5 py-1 text-xs font-bold text-violet-800">
              {totalCourses} course{totalCourses !== 1 ? 's' : ''}
            </span>
          </div>
          <CardContent className="p-6">
            <CourseManagement isSuperadmin={user?.role === 'SUPERADMIN'} />
          </CardContent>
        </Card>

        {/* User Management */}
        <Card className="overflow-hidden border-gray-200/80 shadow-sm">
          <div className="flex items-center gap-3 border-b border-gray-100 px-6 py-4 bg-gradient-to-r from-slate-50 to-gray-50">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-200">
              <Settings className="h-4 w-4 text-slate-700" />
            </div>
            <div className="flex-1">
              <h2 className="text-sm font-bold text-gray-900">User Role & Account Management</h2>
              <p className="text-xs text-gray-500">Manage all platform users, roles, and account statuses</p>
            </div>
          </div>
          <CardContent className="p-6">
            <PaginatedUsersList isSuperadmin={user?.role === 'SUPERADMIN'} />
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
