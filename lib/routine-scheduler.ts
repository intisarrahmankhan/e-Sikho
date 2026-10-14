import { RoutineItemType, RoutinePaceMode } from '@/models/CourseRoutine';

export interface SchedulerLesson {
  id: string;
  title: string;
  duration?: string;
  moduleId?: string;
  moduleTitle?: string;
}

export interface SchedulerCourse {
  id: string;
  title: string;
  titleEn?: string;
  duration?: string;
  totalLessons?: number;
  modules?: Array<{
    id?: string;
    title: string;
    lessons?: Array<{
      id?: string;
      title: string;
      duration?: string;
    }>;
  }>;
}

export interface ScheduleOptions {
  paceMode?: RoutinePaceMode;
  startDate?: Date | string;
  targetCompletionDate?: Date | string;
  originalDurationMonths?: number;
  targetDurationMonths?: number;
  elapsedMonths?: number;
  daysPerWeek?: number;
  dailyHours?: number;
  completedLessonIds?: string[];
  rescheduleReason?: string;
}

export interface GeneratedRoutineItem {
  id: string;
  itemType: RoutineItemType;
  title: string;
  titleEn?: string;
  duration: string;
  scheduledDate: string; // YYYY-MM-DD
  moduleId?: string;
  moduleTitle?: string;
  lessonId?: string;
  dayNumber: number;
  weekNumber: number;
  completed: boolean;
  completedAt?: string;
}

export interface GeneratedSchedulePlan {
  courseId: string;
  courseTitle: string;
  paceMode: RoutinePaceMode;
  startDate: string;
  targetCompletionDate: string;
  originalDurationMonths: number;
  targetDurationMonths: number;
  elapsedMonths: number;
  totalCalendarDays: number;
  totalActiveStudyDays: number;
  daysPerWeek: number;
  dailyHours: number;
  totalLectures: number;
  completedLectures: number;
  remainingLectures: number;
  averageLecturesPerDay: number;
  totalLiveClasses: number;
  totalExams: number;
  daysSaved: number;
  shrinkPercentage: number;
  items: GeneratedRoutineItem[];
}

function formatDateISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function parseDurationMonths(durationStr?: string): number {
  if (!durationStr) return 4;
  const match = durationStr.match(/(\d+)/);
  if (match) {
    const val = parseInt(match[1], 10);
    if (durationStr.includes('ঘণ্টা') || durationStr.toLowerCase().includes('hour')) {
      return Math.max(1, Math.min(6, Math.ceil(val / 15)));
    }
    return val > 0 ? val : 4;
  }
  return 4;
}

export function generateCourseSchedule(
  course: SchedulerCourse,
  options: ScheduleOptions = {}
): GeneratedSchedulePlan {
  const originalDurationMonths =
    options.originalDurationMonths || parseDurationMonths(course.duration) || 4;

  const paceMode: RoutinePaceMode = options.paceMode || 'STANDARD';
  const elapsedMonths = Math.max(0, options.elapsedMonths || 0);

  // Determine targetDurationMonths
  let targetDurationMonths = options.targetDurationMonths;
  if (!targetDurationMonths) {
    if (paceMode === 'ACCELERATED') {
      targetDurationMonths = 1;
    } else if (paceMode === 'REBALANCED_CATCHUP') {
      targetDurationMonths = Math.max(1, originalDurationMonths - elapsedMonths);
    } else {
      targetDurationMonths = originalDurationMonths;
    }
  }

  const daysPerWeek = Math.max(1, Math.min(7, options.daysPerWeek || 5));
  const dailyHours = Math.max(1, Math.min(8, options.dailyHours || 2));
  const completedLessonIds = new Set(options.completedLessonIds || []);

  const startDateObj = options.startDate ? new Date(options.startDate) : new Date();
  startDateObj.setHours(0, 0, 0, 0);

  let targetDateObj: Date;
  if (options.targetCompletionDate) {
    targetDateObj = new Date(options.targetCompletionDate);
  } else {
    targetDateObj = new Date(startDateObj);
    const daysToAdd = Math.round(targetDurationMonths * 30.5);
    targetDateObj.setDate(targetDateObj.getDate() + daysToAdd);
  }
  targetDateObj.setHours(23, 59, 59, 999);

  // Extract all lessons from course
  const lessons: SchedulerLesson[] = [];
  if (course.modules && course.modules.length > 0) {
    course.modules.forEach((mod, modIdx) => {
      const modTitle = mod.title || `মডিউল ${modIdx + 1}`;
      const modId = mod.id || `m-${modIdx + 1}`;
      if (mod.lessons && mod.lessons.length > 0) {
        mod.lessons.forEach((les, lesIdx) => {
          lessons.push({
            id: les.id || `${modId}-l-${lesIdx + 1}`,
            title: les.title,
            duration: les.duration || '৪৫ মিনিট',
            moduleId: modId,
            moduleTitle: modTitle,
          });
        });
      }
    });
  }

  // Fallback if course has no explicit lessons
  const totalExpected = Math.max(lessons.length, course.totalLessons || 24);
  if (lessons.length === 0) {
    for (let i = 1; i <= totalExpected; i++) {
      const modNum = Math.ceil(i / 6);
      lessons.push({
        id: `gen-l-${i}`,
        title: `লেকচার ${i}: বিষয়বস্তু বিশ্লেষণ ও প্রয়োগ`,
        duration: '৪৫ মিনিট',
        moduleId: `gen-m-${modNum}`,
        moduleTitle: `মডিউল ${modNum}`,
      });
    }
  }

  // In catch-up mode after elapsed months, if no completedLessonIds were supplied,
  // simulate lessons completed prior to falling behind (e.g. 25% completed)
  if (paceMode === 'REBALANCED_CATCHUP' && completedLessonIds.size === 0 && elapsedMonths > 0) {
    const estimatedCompletedCount = Math.min(
      Math.floor(lessons.length * (elapsedMonths / originalDurationMonths) * 0.4),
      lessons.length - 2
    );
    for (let i = 0; i < estimatedCompletedCount; i++) {
      completedLessonIds.add(lessons[i].id);
    }
  }

  // Calculate days between start and target
  const diffMs = targetDateObj.getTime() - startDateObj.getTime();
  const totalCalendarDays = Math.max(7, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

  // Build calendar days and identify active study days
  // Standard study days: for 5 days/week, skip Friday & Saturday (standard Bangladesh weekend) or pick first N days
  const studyDaysIndices = new Set<number>();
  if (daysPerWeek === 7) {
    [0, 1, 2, 3, 4, 5, 6].forEach((d) => studyDaysIndices.add(d));
  } else if (daysPerWeek === 6) {
    // Skip Friday (5)
    [0, 1, 2, 3, 4, 6].forEach((d) => studyDaysIndices.add(d));
  } else if (daysPerWeek === 5) {
    // Skip Fri (5) & Sat (6)
    [0, 1, 2, 3, 4].forEach((d) => studyDaysIndices.add(d));
  } else if (daysPerWeek === 4) {
    [0, 1, 2, 3].forEach((d) => studyDaysIndices.add(d));
  } else if (daysPerWeek === 3) {
    [0, 2, 4].forEach((d) => studyDaysIndices.add(d));
  } else {
    for (let i = 0; i < daysPerWeek; i++) studyDaysIndices.add(i);
  }

  const activeDates: Date[] = [];
  for (let d = 0; d < totalCalendarDays; d++) {
    const curDate = new Date(startDateObj);
    curDate.setDate(curDate.getDate() + d);
    if (studyDaysIndices.has(curDate.getDay())) {
      activeDates.push(curDate);
    }
  }

  const totalActiveStudyDays = Math.max(3, activeDates.length);

  // Partition lessons into completed vs remaining
  const completedList = lessons.filter((l) => completedLessonIds.has(l.id));
  const remainingList = lessons.filter((l) => !completedLessonIds.has(l.id));

  const averageLecturesPerDay =
    remainingList.length > 0
      ? Number((remainingList.length / totalActiveStudyDays).toFixed(1))
      : 0;

  const routineItems: GeneratedRoutineItem[] = [];

  // Add already completed items as history if any
  completedList.forEach((les, idx) => {
    routineItems.push({
      id: `done-${les.id}`,
      itemType: 'LECTURE',
      title: les.title,
      duration: les.duration || '৪৫ মিনিট',
      scheduledDate: formatDateISO(new Date(startDateObj.getTime() - (idx + 1) * 86400000)),
      moduleId: les.moduleId,
      moduleTitle: les.moduleTitle,
      lessonId: les.id,
      dayNumber: idx + 1,
      weekNumber: Math.ceil((idx + 1) / daysPerWeek),
      completed: true,
      completedAt: formatDateISO(new Date(startDateObj.getTime() - (idx + 1) * 86400000)),
    });
  });

  // Assign remaining lessons across active study days
  let lessonCursor = 0;
  const lessonsPerDayCeil = Math.max(1, Math.ceil(remainingList.length / totalActiveStudyDays));

  activeDates.forEach((date, dayIdx) => {
    const dayNumber = dayIdx + 1;
    const weekNumber = Math.ceil(dayNumber / daysPerWeek);
    const dateStr = formatDateISO(date);

    // Assign lectures for this study day
    const assignedCount = Math.min(lessonsPerDayCeil, remainingList.length - lessonCursor);
    for (let i = 0; i < assignedCount; i++) {
      const les = remainingList[lessonCursor];
      routineItems.push({
        id: `item-${les.id}-${dayNumber}`,
        itemType: 'LECTURE',
        title: les.title,
        duration: les.duration || '৪৫ মিনিট',
        scheduledDate: dateStr,
        moduleId: les.moduleId,
        moduleTitle: les.moduleTitle,
        lessonId: les.id,
        dayNumber,
        weekNumber,
        completed: false,
      });
      lessonCursor++;
    }

    // Schedule live catch-up classes:
    // In accelerated (1 month) or catch-up mode, add weekly live Q&A sessions on the last study day of each week
    const isWeekEndDay = dayNumber % daysPerWeek === 0 || dayIdx === activeDates.length - 1;
    if (isWeekEndDay && weekNumber <= Math.ceil(totalActiveStudyDays / daysPerWeek)) {
      routineItems.push({
        id: `live-class-w${weekNumber}`,
        itemType: 'LIVE_CLASS',
        title: `লাইভ ডাউট সলভিং ও রিভিশন ক্লাস - সপ্তাহ ${weekNumber}`,
        titleEn: `Live Doubt Solving & Review Session - Week ${weekNumber}`,
        duration: '১ ঘণ্টা ১৫ মিনিট',
        scheduledDate: dateStr,
        dayNumber,
        weekNumber,
        completed: false,
      });
    }

    // Schedule Midterm Exam at 50% progress
    const midPointDay = Math.floor(totalActiveStudyDays / 2);
    if (dayNumber === midPointDay) {
      routineItems.push({
        id: `midterm-exam`,
        itemType: 'EXAM',
        title: `মিডটার্ম মূল্যায়ন পরীক্ষা (সাপ্তাহিক প্রগ্রেস কুইজ)`,
        titleEn: `Midterm Progress Assessment Exam`,
        duration: '৪৫ মিনিট',
        scheduledDate: dateStr,
        dayNumber,
        weekNumber,
        completed: false,
      });
    }

    // Schedule Final Exam on the last study day
    if (dayIdx === activeDates.length - 1) {
      routineItems.push({
        id: `final-course-exam`,
        itemType: 'EXAM',
        title: `কোর্স সমাপনী ফাইনাল পরীক্ষা ও সার্টিফিকেট অ্যাসেসমেন্ট`,
        titleEn: `Course Final Assessment & Certification Exam`,
        duration: '১ ঘণ্টা ৩০ মিনিট',
        scheduledDate: dateStr,
        dayNumber,
        weekNumber,
        completed: false,
      });
    }
  });

  // Calculate days saved & shrinkage
  const originalDurationDays = Math.round(originalDurationMonths * 30.5);
  const daysSaved = Math.max(0, originalDurationDays - totalCalendarDays);
  const shrinkPercentage = Math.round((daysSaved / originalDurationDays) * 100);

  const totalLiveClasses = routineItems.filter((i) => i.itemType === 'LIVE_CLASS').length;
  const totalExams = routineItems.filter((i) => i.itemType === 'EXAM').length;

  return {
    courseId: course.id,
    courseTitle: course.title,
    paceMode,
    startDate: formatDateISO(startDateObj),
    targetCompletionDate: formatDateISO(targetDateObj),
    originalDurationMonths,
    targetDurationMonths,
    elapsedMonths,
    totalCalendarDays,
    totalActiveStudyDays,
    daysPerWeek,
    dailyHours,
    totalLectures: lessons.length,
    completedLectures: completedList.length,
    remainingLectures: remainingList.length,
    averageLecturesPerDay,
    totalLiveClasses,
    totalExams,
    daysSaved,
    shrinkPercentage,
    items: routineItems,
  };
}
