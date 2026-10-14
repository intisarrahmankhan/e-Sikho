import { describe, it, expect } from 'vitest';
import { generateCourseSchedule, SchedulerCourse } from '@/lib/routine-scheduler';

describe('Course Routine Scheduler Engine', () => {
  const sampleCourse: SchedulerCourse = {
    id: 'fullstack-nextjs',
    title: 'ফুলস্ট্যাক ওয়েব ডেভেলপমেন্ট (Next.js, React & Node.js)',
    duration: '৪ মাস',
    totalLessons: 20,
    modules: [
      {
        id: 'm1',
        title: 'মডিউল ১: আধুনিক JavaScript',
        lessons: [
          { id: 'l1', title: 'ES6+ ফিচারস', duration: '৪৫ মিনিট' },
          { id: 'l2', title: 'TypeScript পরিচিতি', duration: '১ ঘণ্টা' },
          { id: 'l3', title: 'অ্যাসিঙ্ক কোডিং', duration: '৫০ মিনিট' },
        ],
      },
      {
        id: 'm2',
        title: 'মডিউল ২: Next.js ফান্ডামেন্টালস',
        lessons: [
          { id: 'l4', title: 'App Router বেসিকস', duration: '১ ঘণ্টা' },
          { id: 'l5', title: 'Server Components', duration: '১ ঘণ্টা ১৫ মিনিট' },
          { id: 'l6', title: 'ডেটা ফেচিং', duration: '১ ঘণ্টা' },
        ],
      },
    ],
  };

  it('generates 1-month accelerated schedule shrinking 4-month deadline', () => {
    const plan = generateCourseSchedule(sampleCourse, {
      paceMode: 'ACCELERATED',
      targetDurationMonths: 1,
      daysPerWeek: 5,
      dailyHours: 2,
    });

    expect(plan.courseId).toBe('fullstack-nextjs');
    expect(plan.paceMode).toBe('ACCELERATED');
    expect(plan.totalCalendarDays).toBeGreaterThanOrEqual(28);
    expect(plan.totalCalendarDays).toBeLessThanOrEqual(32);
    expect(plan.daysSaved).toBeGreaterThan(60);
    expect(plan.shrinkPercentage).toBeGreaterThanOrEqual(50);
    expect(plan.items.length).toBeGreaterThan(0);

    // Verify lectures, live classes and exams are included
    const lectures = plan.items.filter((i) => i.itemType === 'LECTURE');
    const liveClasses = plan.items.filter((i) => i.itemType === 'LIVE_CLASS');
    const exams = plan.items.filter((i) => i.itemType === 'EXAM');

    expect(lectures.length).toBe(sampleCourse.modules!.reduce((acc, m) => acc + m.lessons!.length, 0));
    expect(liveClasses.length).toBeGreaterThan(0);
    expect(exams.length).toBeGreaterThanOrEqual(2); // Midterm + Final
  });

  it('reschedules course after 2 months of falling behind (Catch-up Mode)', () => {
    const plan = generateCourseSchedule(sampleCourse, {
      paceMode: 'REBALANCED_CATCHUP',
      originalDurationMonths: 4,
      elapsedMonths: 2,
      targetDurationMonths: 2,
      daysPerWeek: 5,
    });

    expect(plan.paceMode).toBe('REBALANCED_CATCHUP');
    expect(plan.elapsedMonths).toBe(2);
    expect(plan.targetDurationMonths).toBe(2);
    expect(plan.daysSaved).toBeGreaterThan(0);

    // Remaining lectures should be scheduled
    const pendingLectures = plan.items.filter((i) => i.itemType === 'LECTURE' && !i.completed);
    expect(pendingLectures.length).toBeGreaterThan(0);
    expect(plan.totalLiveClasses).toBeGreaterThan(0);
    expect(plan.totalExams).toBeGreaterThanOrEqual(1);
  });

  it('correctly handles already completed lessons and only re-allocates remaining', () => {
    const plan = generateCourseSchedule(sampleCourse, {
      paceMode: 'REBALANCED_CATCHUP',
      completedLessonIds: ['l1', 'l2'],
      daysPerWeek: 4,
      targetDurationMonths: 1,
    });

    expect(plan.completedLectures).toBe(2);
    expect(plan.remainingLectures).toBe(4);

    const completedItems = plan.items.filter((i) => i.completed);
    expect(completedItems.length).toBe(2);
    expect(completedItems.map((i) => i.lessonId)).toEqual(['l1', 'l2']);
  });

  it('handles course without explicit modules by generating fallback lessons', () => {
    const bareCourse: SchedulerCourse = {
      id: 'bare-course',
      title: 'বেয়ার কোর্স',
      totalLessons: 12,
    };

    const plan = generateCourseSchedule(bareCourse, {
      paceMode: 'ACCELERATED',
      targetDurationMonths: 1,
    });

    expect(plan.totalLectures).toBe(12);
    expect(plan.items.filter((i) => i.itemType === 'LECTURE').length).toBe(12);
  });
});
