import React from 'react';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import dbConnect from '@/lib/mongoose';
import Enrollment from '@/models/Enrollment';
import CourseRoutine from '@/models/CourseRoutine';
import Course from '@/models/Course';
import Module from '@/models/Module';
import Lesson from '@/models/Lesson';
import User from '@/models/User';
import { getCourseById } from '@/lib/courses-data';
import { generateCourseSchedule } from '@/lib/routine-scheduler';
import { StudentGoalsClient } from '@/components/dashboard/StudentGoalsClient';
import mongoose from 'mongoose';

export const dynamic = 'force-dynamic';

export default async function StudentGoalsPage({
  searchParams,
}: {
  searchParams?: Promise<{ courseId?: string }>;
}) {
  const session = await auth();
  if (!session || !session.user) redirect('/login');

  let userId = (session.user as any).id;
  if (!userId) redirect('/login');

  await dbConnect();
  if (typeof userId === 'string' && userId.includes('@')) {
    const userDoc = (await User.findOne({ email: userId }).select('_id').lean()) as any;
    if (userDoc) {
      userId = userDoc._id.toString();
    }
  }

  const enrollments = (await Enrollment.find({
    userId,
    paymentStatus: { $in: ['success', 'GRANTED', 'granted'] },
  }).lean()) as any[];

  const resolvedCourses = await Promise.all(
    enrollments.map(async (e) => {
      const courseIdStr = String(e.courseId);
      const staticCourse = getCourseById(courseIdStr);

      let courseTitle = 'অনলাইন কোর্স';
      let courseTitleEn = '';
      let thumbnailUrl = '/images/default-course.jpg';
      let duration = '৪ মাস';
      let modules: any[] = [];
      let totalLessons = 24;

      if (staticCourse) {
        courseTitle = staticCourse.title;
        courseTitleEn = staticCourse.titleEn || '';
        thumbnailUrl = staticCourse.thumbnailUrl;
        duration = staticCourse.duration;
        modules = staticCourse.modules || [];
        totalLessons = staticCourse.totalLessons || 24;
      } else if (mongoose.Types.ObjectId.isValid(courseIdStr)) {
        try {
          const dbCourse = (await Course.findById(courseIdStr).lean()) as any;
          if (dbCourse) {
            courseTitle = dbCourse.title;
            courseTitleEn = dbCourse.titleEn || '';
            thumbnailUrl = dbCourse.thumbnailUrl || '/images/default-course.jpg';
            duration = dbCourse.duration || '৪ মাস';
            totalLessons = dbCourse.totalLessons || 24;

            const courseModules = (await Module.find({ courseId: dbCourse._id })
              .sort({ order: 1 })
              .lean()) as any[];

            modules = await Promise.all(
              courseModules.map(async (m) => {
                const lessons = (await Lesson.find({ moduleId: m._id })
                  .sort({ order: 1 })
                  .lean()) as any[];
                return {
                  id: m._id.toString(),
                  title: m.title,
                  lessons: lessons.map((l) => ({
                    id: l._id.toString(),
                    title: l.title,
                    duration: l.duration || '৪৫ মিনিট',
                  })),
                };
              })
            );
          }
        } catch {}
      }

      // Check for user's saved routine in DB
      let userRoutine = (await CourseRoutine.findOne({ userId, courseId: courseIdStr }).lean()) as any;

      let initialPlan;
      if (userRoutine) {
        const items = (userRoutine.items || []).map((it: any) => ({
          ...it,
          scheduledDate:
            it.scheduledDate instanceof Date
              ? it.scheduledDate.toISOString().split('T')[0]
              : String(it.scheduledDate || '').split('T')[0],
          completedAt: it.completedAt ? new Date(it.completedAt).toISOString() : undefined,
        }));

        const totalLec = items.filter((i: any) => i.itemType === 'LECTURE').length;
        const compLec = items.filter((i: any) => i.itemType === 'LECTURE' && i.completed).length;

        initialPlan = {
          courseId: courseIdStr,
          courseTitle,
          paceMode: userRoutine.paceMode,
          startDate: new Date(userRoutine.startDate).toISOString().split('T')[0],
          targetCompletionDate: new Date(userRoutine.targetCompletionDate).toISOString().split('T')[0],
          originalDurationMonths: userRoutine.originalDurationMonths || 4,
          targetDurationMonths: userRoutine.targetDurationMonths || 1,
          elapsedMonths: 0,
          totalCalendarDays: Math.ceil(
            (new Date(userRoutine.targetCompletionDate).getTime() - new Date(userRoutine.startDate).getTime()) /
              (1000 * 60 * 60 * 24)
          ),
          totalActiveStudyDays: new Set(items.map((i: any) => i.scheduledDate)).size,
          daysPerWeek: userRoutine.daysPerWeek || 5,
          dailyHours: userRoutine.dailyHours || 2,
          totalLectures: totalLec,
          completedLectures: compLec,
          remainingLectures: totalLec - compLec,
          averageLecturesPerDay: Number(
            (Math.max(1, totalLec - compLec) / Math.max(1, new Set(items.map((i: any) => i.scheduledDate)).size)).toFixed(1)
          ),
          totalLiveClasses: items.filter((i: any) => i.itemType === 'LIVE_CLASS').length,
          totalExams: items.filter((i: any) => i.itemType === 'EXAM').length,
          daysSaved: Math.max(
            0,
            (userRoutine.originalDurationMonths || 4) * 30 -
              Math.ceil(
                (new Date(userRoutine.targetCompletionDate).getTime() - new Date(userRoutine.startDate).getTime()) /
                  (1000 * 60 * 60 * 24)
              )
          ),
          shrinkPercentage: Math.max(
            0,
            Math.round(
              (((userRoutine.originalDurationMonths || 4) * 30 -
                Math.ceil(
                  (new Date(userRoutine.targetCompletionDate).getTime() - new Date(userRoutine.startDate).getTime()) /
                    (1000 * 60 * 60 * 24)
                )) /
                ((userRoutine.originalDurationMonths || 4) * 30)) *
                100
            )
          ),
          items,
        };
      } else {
        // Generate a standard default schedule plan
        initialPlan = generateCourseSchedule(
          {
            id: courseIdStr,
            title: courseTitle,
            titleEn: courseTitleEn,
            duration,
            totalLessons,
            modules,
          },
          {
            paceMode: 'STANDARD',
            daysPerWeek: 5,
            dailyHours: 2,
          }
        );
      }

      const totalItems = initialPlan.items.length || 1;
      const compItems = initialPlan.items.filter((i: any) => i.completed).length;
      const progressPercentage = Math.round((compItems / totalItems) * 100);

      return {
        id: courseIdStr,
        title: courseTitle,
        titleEn: courseTitleEn,
        thumbnailUrl,
        progressPercentage: Math.max(progressPercentage, 10),
        targetCompletionDate: initialPlan.targetCompletionDate,
        paceMode: initialPlan.paceMode,
        initialPlan,
      };
    })
  );

  const courses = resolvedCourses.filter(Boolean);
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const defaultCourseId = resolvedSearchParams?.courseId || (courses.length > 0 ? courses[0].id : undefined);

  return <StudentGoalsClient courses={courses} defaultCourseId={defaultCourseId} />;
}
