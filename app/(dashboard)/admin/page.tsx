import { auth } from '@/app/api/auth/[...nextauth]/route';

import { redirect } from 'next/navigation';
import dbConnect from '@/lib/mongoose';
import User from '@/models/User';
import Course from '@/models/Course';
import InstructorRequest from '@/models/InstructorRequest';
import PendingApprovals from '@/components/admin/PendingApprovals';
import PaginatedUsersList from '@/components/admin/PaginatedUsersList';
import CourseApprovals from '@/components/admin/CourseApprovals';
import InstructorRequests from '@/components/admin/InstructorRequests';
import CourseReviews from '@/components/admin/CourseReviews';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

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

  const rawInstructorRequests = await InstructorRequest.find({ status: { $in: ['PENDING', 'ADMIN_APPROVED', 'SUPERADMIN_APPROVED'] } })
    .populate({ path: 'userId', select: 'name email' })
    .sort({ createdAt: 1 })
    .lean();
  const instructorRequests = rawInstructorRequests.map((r: any) => ({ ...r, id: r._id.toString(), user: r.userId }));

  const rawCourseReviews = await Course.find({ approvalStatus: 'PENDING_REVIEW' })
    .populate({ path: 'instructor', select: 'name' })
    .sort({ createdAt: 1 })
    .lean();
  const courseReviews = rawCourseReviews.map((c: any) => ({ ...c, id: c._id.toString() }));

  const totalCourses = await Course.countDocuments();
  const totalStudents = await User.countDocuments({ role: 'STUDENT', status: 'APPROVED' });
  const totalFaculty = await User.countDocuments({ role: 'INSTRUCTOR', status: 'APPROVED' });

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-bold text-gray-900">Admin Control Panel</h1>
        <p className="text-sm text-gray-500 mt-1">Overview of platform metrics, user moderation, and course approvals.</p>
      </div>

      {/* Dynamic Metric Cards */}
      <div id="overview" className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl bg-white p-5 shadow-card border border-gray-200">
          <p className="text-sm font-medium text-gray-500">Total Courses</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900">{totalCourses}</p>
        </div>
        <div className="rounded-xl bg-white p-5 shadow-card border border-gray-200">
          <p className="text-sm font-medium text-gray-500">Students</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900">{totalStudents}</p>
        </div>
        <div className="rounded-xl bg-white p-5 shadow-card border border-gray-200">
          <p className="text-sm font-medium text-gray-500">Faculty / Instructors</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900">{totalFaculty}</p>
        </div>
        <div className="rounded-xl bg-white p-5 shadow-card border border-gray-200">
          <p className="text-sm font-medium text-gray-500">Pending User Requests</p>
          <p className="mt-1 text-2xl font-semibold text-amber-600">{pendingUsers.length}</p>
        </div>
      </div>

      {/* Pending User Registration Approvals Section */}
      <section id="approvals" className="rounded-xl bg-white p-6 shadow-card border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-100 pb-3 mb-4">
          Pending User Registration Approvals
        </h3>
        <PendingApprovals pendingUsers={pendingUsers} />
      </section>

      {/* Instructor Promotion Requests Section */}
      <section className="rounded-xl bg-white p-6 shadow-card border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-100 pb-3 mb-4">Instructor Promotion Requests</h3>
        <p className="mb-4 text-xs text-gray-500">Both an ADMIN and SUPERADMIN must approve before the student is promoted.</p>
        <InstructorRequests requests={instructorRequests} />
      </section>

      {/* Course Submissions for Review */}
      <section className="rounded-xl bg-white p-6 shadow-card border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-100 pb-3 mb-4">Course Submissions for Review</h3>
        <CourseReviews courses={courseReviews} />
      </section>

      {/* Pending Course Moderation Queue Section */}
      <section id="course-approvals" className="rounded-xl bg-white p-6 shadow-card border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-100 pb-3 mb-4">
          Course Approval Queue
        </h3>
        <CourseApprovals pendingCourses={pendingCourses} />
      </section>

      {/* User Accounts & Role/Status Management Section */}
      <section id="users" className="rounded-xl bg-white p-6 shadow-card border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-100 pb-3 mb-4">
          User Role & Account Status Management
        </h3>
        <PaginatedUsersList />
      </section>
    </div>
  );
}
