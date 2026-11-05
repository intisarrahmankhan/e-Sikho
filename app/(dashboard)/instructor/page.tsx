import React from 'react';
import { auth } from '@/auth';
import dbConnect from '@/lib/mongoose';
import Course from '@/models/Course';
import { redirect } from 'next/navigation';
import { InstructorDashboardClient } from '@/components/instructor/InstructorDashboardClient';
import { getUserEnrolledCourses } from '@/actions/student-actions';
import mongoose from 'mongoose';
import PlatformCommission from '@/models/PlatformCommission';
import { paidCommissionStages } from '@/lib/financial-reporting';

import { isValidMongoObjectId } from '@/lib/auth-helpers';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams?: Promise<{ tab?: string }> | { tab?: string };
}

export default async function InstructorDashboardPage({ searchParams }: PageProps) {
  const session = await auth();
  const user = session?.user as { id?: string; name?: string; email?: string; role?: string; image?: string } | undefined;

  if (!session || !user) redirect('/login');

  let userId = user.id || '';
  let userName = user.name || 'ইন্সট্রাক্টর';
  let availableBalance = 0;
  let totalEarnings = 0;
  let courses: any[] = [];
  let payoutRequests: any[] = [];
  let enrolledCourses: any[] = [];
  let effectiveRole = user.role;

  const resolvedSearchParams = searchParams instanceof Promise ? await searchParams : (searchParams || {});

  try {
    await dbConnect();

    // Verify user document from MongoDB to ensure real-time role accuracy
    const { default: User } = await import('@/models/User');
    const userDoc = await User.findOne({ 
      $or: [
        { _id: isValidMongoObjectId(userId) ? userId : null },
        { email: user.email || (typeof userId === 'string' && userId.includes('@') ? userId : null) }
      ]
    }).select('_id availableBalance totalEarnings name role').lean() as any;

    if (userDoc) {
      userId = userDoc._id.toString();
      availableBalance = userDoc.availableBalance || 0;
      if (userDoc.name) userName = userDoc.name;
      if (userDoc.role) effectiveRole = userDoc.role;
    }

    if (effectiveRole !== 'INSTRUCTOR' && effectiveRole !== 'ADMIN' && effectiveRole !== 'SUPERADMIN') {
      redirect('/student');
    }

    const userObjectId = isValidMongoObjectId(userId) ? new mongoose.Types.ObjectId(userId) : null;
    const rawCourses = await Course.find({
      $or: [
        { createdById: userId },
        ...(userObjectId ? [{ createdById: userObjectId }, { instructorUserIds: userObjectId }] : []),
        ...(effectiveRole === 'ADMIN' || effectiveRole === 'SUPERADMIN' ? [{}] : [])
      ]
    })
      .sort({ createdAt: -1 })
      .select('_id title status approvalStatus price studentsEnrolled rating totalRatings createdAt category level')
      .lean();

    const { default: Module } = await import('@/models/Module');
    const { default: Lesson } = await import('@/models/Lesson');

    const courseIds = (rawCourses || []).map((c: any) => c._id);
    const rawModules = await Module.find({ courseId: { $in: courseIds } })
      .sort({ order: 1, createdAt: 1 })
      .lean();

    const moduleIds = (rawModules || []).map((m: any) => m._id);
    const rawLessons = await Lesson.find({
      $or: [
        { courseId: { $in: courseIds } },
        { moduleId: { $in: moduleIds } }
      ]
    })
      .sort({ order: 1, createdAt: 1 })
      .lean();

    const lessonsByModule = new Map<string, any[]>();
    (rawLessons || []).forEach((l: any) => {
      const mId = l.moduleId ? String(l.moduleId) : '';
      if (mId) {
        if (!lessonsByModule.has(mId)) lessonsByModule.set(mId, []);
        lessonsByModule.get(mId)!.push({
          id: l._id.toString(),
          title: l.title,
          type: l.type || 'VIDEO',
          duration: l.duration || '15:00',
          isFree: Boolean(l.isFree),
          order: l.order || 0,
          videoUrl: l.videoUrl || '',
        });
      }
    });

    const modulesByCourse = new Map<string, any[]>();
    (rawModules || []).forEach((m: any) => {
      const cId = m.courseId ? String(m.courseId) : '';
      if (cId) {
        if (!modulesByCourse.has(cId)) modulesByCourse.set(cId, []);
        const mId = m._id.toString();
        modulesByCourse.get(cId)!.push({
          id: mId,
          title: m.title,
          order: m.order || 0,
          lessons: lessonsByModule.get(mId) || [],
        });
      }
    });

    const earningsByCourse = userObjectId ? await PlatformCommission.aggregate([
      { $match: { instructorUserId: userObjectId } },
      ...paidCommissionStages(),
      { $group: { _id: '$courseId', earnedRevenue: { $sum: '$instructorEarnings' } } },
    ]) : [];
    const courseEarnings = new Map(earningsByCourse.map((entry: any) => [String(entry._id), entry.earnedRevenue as number]));
    
    const sanitizedCourses = JSON.parse(JSON.stringify(rawCourses || []));
    courses = sanitizedCourses.map((c: any) => {
      const cId = c._id.toString();
      const courseModules = modulesByCourse.get(cId) || [];
      const totalLecturesCount = courseModules.reduce((sum: number, m: any) => sum + (m.lessons?.length || 0), 0);
      return {
        ...c,
        id: cId,
        _id: cId,
        earnedRevenue: courseEarnings.get(cId) ?? 0,
        modules: courseModules,
        totalLecturesCount,
      };
    });
    totalEarnings = courses.reduce((sum: number, c: any) => sum + (c.earnedRevenue || 0), 0);

    const { default: PayoutRequest } = await import('@/models/PayoutRequest');
    const rawPayoutRequests = await PayoutRequest.find({ userId })
      .sort({ createdAt: -1 })
      .lean();
    payoutRequests = JSON.parse(JSON.stringify(rawPayoutRequests || [])).map((r: any) => ({
      id: r._id.toString(),
      ...r,
    }));

  } catch (err: any) {
    if (err?.digest?.startsWith('NEXT_REDIRECT') || err?.message === 'NEXT_REDIRECT') {
      throw err;
    }
    console.warn('MongoDB connection/query warning in InstructorDashboardPage, using fallback defaults:', err);
  }

  // Fetch all enrolled courses (courses enrolled both when student and as instructor)
  try {
    enrolledCourses = await getUserEnrolledCourses(userId);
  } catch (err) {
    console.warn('Error fetching enrolled courses for instructor dashboard:', err);
  }

  return (
    <InstructorDashboardClient
      userName={userName}
      userId={userId}
      availableBalance={availableBalance}
      totalEarnings={totalEarnings}
      courses={courses}
      enrolledCourses={enrolledCourses}
      payoutRequests={payoutRequests}
      initialTab={resolvedSearchParams.tab === 'enrolled' ? 'enrolled' : 'teaching'}
    />
  );
}
