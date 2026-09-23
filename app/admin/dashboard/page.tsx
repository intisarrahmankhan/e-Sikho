import { auth, signOut } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import PendingApprovals from './PendingApprovals';
import UserRoleManager from './UserRoleManager';

export default async function DashboardPage() {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  // Fetch real-time data from PostgreSQL
  const pendingUsers = await prisma.user.findMany({
    where: { status: 'PENDING' },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  });

  const activeUsers = await prisma.user.findMany({
    where: { status: 'APPROVED' },
    select: { id: true, name: true, email: true, role: true },
    orderBy: { createdAt: 'desc' },
  });

  const totalCourses = await prisma.course.count();
  const totalStudents = await prisma.user.count({
    where: { role: 'STUDENT', status: 'APPROVED' },
  });
  const totalFaculty = await prisma.user.count({
    where: { role: 'INSTRUCTOR', status: 'APPROVED' },
  });

  async function handleSignOut() {
    'use server';
    await signOut({ redirectTo: '/login' });
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col justify-between p-4 shadow-lg">
        <div>
          <div className="flex items-center gap-3 border-b border-slate-700 pb-4 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600 text-xl font-bold text-white shadow">
              eS
            </div>
            <div>
              <h1 className="text-lg font-bold text-white leading-tight">e-Shikho</h1>
              <p className="text-xs text-slate-400">Admin Control Panel</p>
            </div>
          </div>

          <nav className="space-y-1">
            <a href="#overview" className="block rounded-md bg-slate-800 px-4 py-2.5 text-sm font-medium text-white shadow-sm">
              📊 Overview
            </a>
            <a href="#courses" className="block rounded-md px-4 py-2.5 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition">
              📚 Course Management
            </a>
            <a href="#users" className="block rounded-md px-4 py-2.5 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition">
              👥 User Accounts
            </a>
            <a href="#approvals" className="block rounded-md px-4 py-2.5 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition">
              ⏳ Pending Approvals
            </a>
          </nav>
        </div>

        <div className="border-t border-slate-700 pt-4">
          <div className="mb-3 px-2">
            <p className="text-sm font-semibold text-white">{session.user?.name}</p>
            <p className="text-xs text-slate-400">{session.user?.email}</p>
          </div>
          <form action={handleSignOut}>
            <button
              type="submit"
              className="w-full rounded-md bg-red-600/90 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 transition"
            >
              Sign Out
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        <header className="flex items-center justify-between pb-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Platform Management</h2>
            <p className="text-sm text-gray-500">Overview of courses, active users, and registration requests.</p>
          </div>
          <button className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-indigo-700">
            + Create New Course
          </button>
        </header>

        {/* Dynamic Metric Cards */}
        <div id="overview" className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg bg-white p-5 shadow-sm border border-gray-200">
            <p className="text-sm font-medium text-gray-500">Total Courses</p>
            <p className="mt-1 text-2xl font-semibold text-gray-900">{totalCourses}</p>
          </div>
          <div className="rounded-lg bg-white p-5 shadow-sm border border-gray-200">
            <p className="text-sm font-medium text-gray-500">Students</p>
            <p className="mt-1 text-2xl font-semibold text-gray-900">{totalStudents}</p>
          </div>
          <div className="rounded-lg bg-white p-5 shadow-sm border border-gray-200">
            <p className="text-sm font-medium text-gray-500">Faculty / Instructors</p>
            <p className="mt-1 text-2xl font-semibold text-gray-900">{totalFaculty}</p>
          </div>
          <div className="rounded-lg bg-white p-5 shadow-sm border border-gray-200">
            <p className="text-sm font-medium text-gray-500">Pending Requests</p>
            <p className="mt-1 text-2xl font-semibold text-amber-600">{pendingUsers.length}</p>
          </div>
        </div>

        {/* Pending Approvals Section */}
        <section id="approvals" className="mt-8 rounded-lg bg-white p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 border-b pb-3 mb-4">
            Pending Registration Approvals
          </h3>
          <PendingApprovals pendingUsers={pendingUsers} />
        </section>

        {/* User Accounts & Role Management Section */}
        <section id="users" className="mt-8 rounded-lg bg-white p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 border-b pb-3 mb-4">
            User Role Management (Promote / Demote)
          </h3>
          <UserRoleManager activeUsers={activeUsers} />
        </section>

        {/* Courses Section */}
        <section id="courses" className="mt-8 rounded-lg bg-white p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between border-b pb-3 mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Course Catalog</h3>
            <button className="text-sm font-medium text-indigo-600 hover:text-indigo-800">
              Manage Categories
            </button>
          </div>
          <p className="text-sm text-gray-500">
            No courses found. Click "+ Create New Course" above to add the first course to the platform.
          </p>
        </section>
      </main>
    </div>
  );
}