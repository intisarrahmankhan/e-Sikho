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

    const rawCourses = await Course.find({ createdById: userId })
      .sort({ createdAt: -1 })
      .select('_id title status approvalStatus price studentsEnrolled rating totalRatings createdAt category level')
      .lean();

    const earningsByCourse = isValidMongoObjectId(userId) ? await PlatformCommission.aggregate([
      { $match: { instructorUserId: new mongoose.Types.ObjectId(userId) } },
      ...paidCommissionStages(),
      { $group: { _id: '$courseId', earnedRevenue: { $sum: '$instructorEarnings' } } },
    ]) : [];
    const courseEarnings = new Map(earningsByCourse.map((entry: any) => [String(entry._id), entry.earnedRevenue as number]));
    totalEarnings = earningsByCourse.reduce((sum: number, entry: any) => sum + entry.earnedRevenue, 0);
    courses = (rawCourses || []).map((c: any) => ({
      ...c, id: c._id.toString(), earnedRevenue: courseEarnings.get(String(c._id)) || 0,
    }));

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
