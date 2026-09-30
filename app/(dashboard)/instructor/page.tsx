import React from "react";
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import CourseForm from '@/app/instructor/CourseForm';

export default async function InstructorDashboardPage() {
  const session = await auth();
  const user = session?.user as { id?: string; role?: string } | undefined;
  if (!user?.id || user.role !== 'INSTRUCTOR') redirect('/student');
  const courses = await prisma.course.findMany({ where: { createdById: user.id }, orderBy: { createdAt: 'desc' }, select: { id: true, title: true, approvalStatus: true, price: true } });
  return (
    <div className="max-w-4xl space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Instructor Dashboard</h1>
      <CourseForm />
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="mb-4 text-lg font-bold">My courses</h2>{courses.length === 0 ? <p className="text-sm text-slate-500">You have not submitted a course yet.</p> : <div className="space-y-3">{courses.map(course => <div key={course.id} className="flex items-center justify-between rounded-lg border p-3"><span className="text-sm font-medium">{course.title}</span><span className="text-xs font-semibold text-slate-500">{course.approvalStatus} · {course.price === 0 ? 'Free' : `৳${course.price}`}</span></div>)}</div>}</section>
    </div>
  );
}
