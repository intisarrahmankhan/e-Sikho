'use server';

import { auth } from '@/auth';
import dbConnect from '@/lib/mongoose';
import CourseRoutine, { RoutinePaceMode } from '@/models/CourseRoutine';
import Course from '@/models/Course';
import Module from '@/models/Module';
import Lesson from '@/models/Lesson';
import User from '@/models/User';
import { COURSES_DATA } from '@/lib/courses-data';
import {
  generateCourseSchedule,
  SchedulerCourse,
  ScheduleOptions,
  GeneratedSchedulePlan,
} from '@/lib/routine-scheduler';
import { revalidatePath } from 'next/cache';
import mongoose from 'mongoose';

async function getAuthenticatedUserId(): Promise<string | null> {
  const session = await auth();
  let userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return null;

  if (typeof userId === 'string' && userId.includes('@')) {
    await dbConnect();
    const userDoc = (await User.findOne({ email: userId }).select('_id').lean()) as any;
    if (userDoc) {
      userId = userDoc._id.toString();
    }
  }

  return userId || null;
}

async function resolveCourseData(courseId: string): Promise<SchedulerCourse> {
  const staticCourse = COURSES_DATA.find((c) => c.id === courseId);
  if (staticCourse) {
    return {
      id: staticCourse.id,
      title: staticCourse.title,
      titleEn: staticCourse.titleEn,
      duration: staticCourse.duration,
      totalLessons: staticCourse.totalLessons,
      modules: staticCourse.modules,
    };
  }

  await dbConnect();
  if (mongoose.Types.ObjectId.isValid(courseId)) {
    const dbCourse = (await Course.findById(courseId).lean()) as any;
    if (dbCourse) {
      const courseModules = (await Module.find({ courseId: dbCourse._id })
        .sort({ order: 1 })
        .lean()) as any[];

      const modulesWithLessons = await Promise.all(
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

      return {
        id: dbCourse._id.toString(),
        title: dbCourse.title,
        titleEn: dbCourse.titleEn,
        duration: dbCourse.duration,
        totalLessons: dbCourse.totalLessons,
        modules: modulesWithLessons,
      };
    }
  }

  return {
    id: courseId,
    title: 'অনলাইন কোর্স',
    duration: '৪ মাস',
    totalLessons: 24,
  };
}

export async function getCourseRoutineAction(courseId: string) {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return { error: 'Unauthorized' };
    }

    await dbConnect();
    const routine = (await CourseRoutine.findOne({ userId, courseId }).lean()) as any;

    const courseData = await resolveCourseData(courseId);

    if (!routine) {
      // Generate default routine for user preview
      const defaultPlan = generateCourseSchedule(courseData, {
        paceMode: 'STANDARD',
        daysPerWeek: 5,
        dailyHours: 2,
      });
      return {
        success: true,
        isCustomized: false,
        routine: defaultPlan,
        courseTitle: courseData.title,
      };
    }

    const items = (routine.items || []).map((it: any) => ({
      ...it,
      scheduledDate:
        it.scheduledDate instanceof Date
          ? it.scheduledDate.toISOString().split('T')[0]
          : String(it.scheduledDate || '').split('T')[0],
      completedAt: it.completedAt ? new Date(it.completedAt).toISOString() : undefined,
    }));

    const totalLectures = items.filter((i: any) => i.itemType === 'LECTURE').length;
    const completedLectures = items.filter((i: any) => i.itemType === 'LECTURE' && i.completed).length;
    const remainingLectures = totalLectures - completedLectures;

    const plan: GeneratedSchedulePlan = {
      courseId,
      courseTitle: courseData.title,
      paceMode: routine.paceMode,
      startDate: new Date(routine.startDate).toISOString().split('T')[0],
      targetCompletionDate: new Date(routine.targetCompletionDate).toISOString().split('T')[0],
      originalDurationMonths: routine.originalDurationMonths || 4,
      targetDurationMonths: routine.targetDurationMonths || 1,
      elapsedMonths: 0,
      totalCalendarDays: Math.ceil(
        (new Date(routine.targetCompletionDate).getTime() - new Date(routine.startDate).getTime()) /
          (1000 * 60 * 60 * 24)
      ),
      totalActiveStudyDays: new Set(items.map((i: any) => i.scheduledDate)).size,
      daysPerWeek: routine.daysPerWeek || 5,
      dailyHours: routine.dailyHours || 2,
      totalLectures,
      completedLectures,
      remainingLectures,
      averageLecturesPerDay: Number(
        (remainingLectures / Math.max(1, new Set(items.map((i: any) => i.scheduledDate)).size)).toFixed(1)
      ),
      totalLiveClasses: items.filter((i: any) => i.itemType === 'LIVE_CLASS').length,
      totalExams: items.filter((i: any) => i.itemType === 'EXAM').length,
      daysSaved: Math.max(
        0,
        (routine.originalDurationMonths || 4) * 30 -
          Math.ceil(
            (new Date(routine.targetCompletionDate).getTime() - new Date(routine.startDate).getTime()) /
              (1000 * 60 * 60 * 24)
          )
      ),
      shrinkPercentage: Math.max(
        0,
        Math.round(
          (((routine.originalDurationMonths || 4) * 30 -
            Math.ceil(
              (new Date(routine.targetCompletionDate).getTime() - new Date(routine.startDate).getTime()) /
                (1000 * 60 * 60 * 24)
            )) /
            ((routine.originalDurationMonths || 4) * 30)) *
            100
        )
      ),
      items,
    };

    return {
      success: true,
      isCustomized: true,
      routine: plan,
      courseTitle: courseData.title,
      lastRescheduledAt: routine.lastRescheduledAt,
      rescheduleReason: routine.rescheduleReason,
    };
  } catch (error) {
    console.error('getCourseRoutineAction error:', error);
    return { error: 'Failed to load routine' };
  }
}

export async function previewRescheduleAction(
  courseId: string,
  options: ScheduleOptions
): Promise<{ success: boolean; plan?: GeneratedSchedulePlan; error?: string }> {
  try {
    const courseData = await resolveCourseData(courseId);
    const plan = generateCourseSchedule(courseData, options);
    return { success: true, plan };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to preview reschedule' };
  }
}

export async function saveCourseRoutineAction(payload: {
  courseId: string;
  paceMode: RoutinePaceMode;
  targetDurationMonths?: number;
  targetCompletionDate?: string;
  originalDurationMonths?: number;
  elapsedMonths?: number;
  daysPerWeek?: number;
  dailyHours?: number;
  rescheduleReason?: string;
}) {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return { error: 'Please sign in to adjust your routine' };
    }

    await dbConnect();
    const courseData = await resolveCourseData(payload.courseId);

    // Check existing routine to preserve already completed items
    const existing = (await CourseRoutine.findOne({ userId, courseId: payload.courseId }).lean()) as any;
    const completedLessonIds: string[] = [];
    if (existing && Array.isArray(existing.items)) {
      existing.items.forEach((it: any) => {
        if (it.completed && it.lessonId) {
          completedLessonIds.push(it.lessonId);
        }
      });
    }

    const plan = generateCourseSchedule(courseData, {
      paceMode: payload.paceMode,
      targetDurationMonths: payload.targetDurationMonths,
      targetCompletionDate: payload.targetCompletionDate,
      originalDurationMonths: payload.originalDurationMonths || 4,
      elapsedMonths: payload.elapsedMonths || 0,
      daysPerWeek: payload.daysPerWeek || 5,
      dailyHours: payload.dailyHours || 2,
      completedLessonIds,
      rescheduleReason: payload.rescheduleReason,
    });

    // Transform plan items for Mongoose
    const dbItems = plan.items.map((i) => ({
      id: i.id,
      itemType: i.itemType,
      title: i.title,
      titleEn: i.titleEn || '',
      duration: i.duration,
      scheduledDate: new Date(i.scheduledDate),
      moduleId: i.moduleId || '',
      moduleTitle: i.moduleTitle || '',
      lessonId: i.lessonId || '',
      dayNumber: i.dayNumber,
      weekNumber: i.weekNumber,
      completed: i.completed,
      completedAt: i.completedAt ? new Date(i.completedAt) : undefined,
    }));

    await CourseRoutine.findOneAndUpdate(
      { userId, courseId: payload.courseId },
      {
        userId,
        courseId: payload.courseId,
        paceMode: payload.paceMode,
        startDate: new Date(plan.startDate),
        targetCompletionDate: new Date(plan.targetCompletionDate),
        originalDurationMonths: plan.originalDurationMonths,
        targetDurationMonths: plan.targetDurationMonths,
        daysPerWeek: plan.daysPerWeek,
        dailyHours: plan.dailyHours,
        rescheduleReason: payload.rescheduleReason || '',
        lastRescheduledAt: new Date(),
        items: dbItems,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    revalidatePath('/student');
    revalidatePath('/student/goals');
    revalidatePath(`/courses/${payload.courseId}`);

    return { success: true, plan };
  } catch (error) {
    console.error('saveCourseRoutineAction error:', error);
    return { error: 'Failed to reschedule course routine' };
  }
}

export async function toggleRoutineItemAction(courseId: string, itemId: string, completed: boolean) {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return { error: 'Unauthorized' };
    }

    await dbConnect();
    const updateResult = await CourseRoutine.updateOne(
      { userId, courseId, 'items.id': itemId },
      {
        $set: {
          'items.$.completed': completed,
          'items.$.completedAt': completed ? new Date() : null,
        },
      }
    );

    if (updateResult.matchedCount === 0) {
      return { error: 'Item not found' };
    }

    revalidatePath('/student');
    revalidatePath('/student/goals');
    return { success: true };
  } catch (error) {
    console.error('toggleRoutineItemAction error:', error);
    return { error: 'Failed to update item status' };
  }
}
