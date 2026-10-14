import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { RescheduleModal } from '@/components/modals/RescheduleModal';
import { CourseCard, CourseProps } from '@/components/dashboard/CourseCard';
import { LanguageProvider } from '@/context/LanguageContext';
import * as routineActions from '@/actions/routine';

vi.mock('@/actions/routine', () => ({
  previewRescheduleAction: vi.fn(),
  saveCourseRoutineAction: vi.fn(),
  toggleRoutineItemAction: vi.fn(),
  getCourseRoutineAction: vi.fn(),
}));

describe('Course Routine Reschedule Modal & CourseCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockPlan = {
    courseId: 'fullstack-nextjs',
    courseTitle: 'ফুলস্ট্যাক ওয়েব ডেভেলপমেন্ট',
    paceMode: 'ACCELERATED' as const,
    startDate: '2026-10-09',
    targetCompletionDate: '2026-11-09',
    originalDurationMonths: 4,
    targetDurationMonths: 1,
    elapsedMonths: 0,
    totalCalendarDays: 31,
    totalActiveStudyDays: 22,
    daysPerWeek: 5,
    dailyHours: 2,
    totalLectures: 24,
    completedLectures: 0,
    remainingLectures: 24,
    averageLecturesPerDay: 1.1,
    totalLiveClasses: 4,
    totalExams: 2,
    daysSaved: 89,
    shrinkPercentage: 74,
    items: [
      {
        id: 'item-1',
        itemType: 'LECTURE' as const,
        title: 'লেকচার ১: আধুনিক জাভাস্ক্রিপ্ট',
        duration: '৪৫ মিনিট',
        scheduledDate: '2026-10-10',
        dayNumber: 1,
        weekNumber: 1,
        completed: false,
      },
      {
        id: 'live-1',
        itemType: 'LIVE_CLASS' as const,
        title: 'লাইভ ডাউট সলভিং ক্লাস',
        duration: '১ ঘণ্টা',
        scheduledDate: '2026-10-15',
        dayNumber: 5,
        weekNumber: 1,
        completed: false,
      },
      {
        id: 'exam-1',
        itemType: 'EXAM' as const,
        title: 'মিডটার্ম পরীক্ষা',
        duration: '৪৫ মিনিট',
        scheduledDate: '2026-10-25',
        dayNumber: 11,
        weekNumber: 2,
        completed: false,
      },
    ],
  };

  it('renders RescheduleModal with presets: 1-month fast track, catch-up rebalance, and custom', async () => {
    (routineActions.previewRescheduleAction as any).mockResolvedValue({
      success: true,
      plan: mockPlan,
    });

    render(
      <LanguageProvider>
        <RescheduleModal
          isOpen={true}
          onClose={vi.fn()}
          courseId="fullstack-nextjs"
          courseTitle="ফুলস্ট্যাক ওয়েব ডেভেলপমেন্ট"
          currentTargetDate="2027-02-09"
        />
      </LanguageProvider>
    );

    // Check header and preset options
    expect(screen.getByText('ফুলস্ট্যাক ওয়েব ডেভেলপমেন্ট')).toBeTruthy();
    expect(screen.getByText('১ মাসে দ্রুত সমাপ্তি')).toBeTruthy();
    expect(screen.getByText('২ মাস পর রুটিন অ্যাডজাস্ট')).toBeTruthy();
    expect(screen.getByText('কাস্টম লক্ষ্য ও সময়সীমা')).toBeTruthy();

    // Check plan summary rendered from preview
    await waitFor(() => {
      expect(screen.getByText('⚡ 74% ডেডলাইন সংকুচিত')).toBeTruthy();
    });
    expect(screen.getByText('স্বয়ংক্রিয় রুটিন প্রয়োগ করুন')).toBeTruthy();
  });

  it('allows switching to Catch-up mode (missed live classes & exams) and displays elapsed slider', async () => {
    (routineActions.previewRescheduleAction as any).mockResolvedValue({
      success: true,
      plan: {
        ...mockPlan,
        paceMode: 'REBALANCED_CATCHUP',
        targetDurationMonths: 2,
        daysSaved: 60,
        shrinkPercentage: 50,
      },
    });

    render(
      <LanguageProvider>
        <RescheduleModal
          isOpen={true}
          onClose={vi.fn()}
          courseId="fullstack-nextjs"
          courseTitle="ফুলস্ট্যাক ওয়েব ডেভেলপমেন্ট"
        />
      </LanguageProvider>
    );

    // Click Catch-up / Missed Classes option
    fireEvent.click(screen.getByText('২ মাস পর রুটিন অ্যাডজাস্ট'));

    await waitFor(() => {
      expect(screen.getByText('কোর্স শুরুর কত সময় পর রি-শিডিউল করছেন?')).toBeTruthy();
    });
  });

  it('successfully applies rescheduled routine and calls onSuccess', async () => {
    (routineActions.previewRescheduleAction as any).mockResolvedValue({
      success: true,
      plan: mockPlan,
    });
    (routineActions.saveCourseRoutineAction as any).mockResolvedValue({
      success: true,
      plan: mockPlan,
    });

    const mockOnSuccess = vi.fn();

    render(
      <LanguageProvider>
        <RescheduleModal
          isOpen={true}
          onClose={vi.fn()}
          courseId="fullstack-nextjs"
          courseTitle="ফুলস্ট্যাক ওয়েব ডেভেলপমেন্ট"
          onSuccess={mockOnSuccess}
        />
      </LanguageProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('স্বয়ংক্রিয় রুটিন প্রয়োগ করুন')).toBeTruthy();
    });

    fireEvent.click(screen.getByText('স্বয়ংক্রিয় রুটিন প্রয়োগ করুন'));

    await waitFor(() => {
      expect(routineActions.saveCourseRoutineAction).toHaveBeenCalledWith(
        expect.objectContaining({
          courseId: 'fullstack-nextjs',
          paceMode: 'ACCELERATED',
        })
      );
    });

    expect(mockOnSuccess).toHaveBeenCalledWith(mockPlan);
  });

  it('renders CourseCard with adjust routine button and opens RescheduleModal', async () => {
    const sampleCourse: CourseProps = {
      id: 'course-1',
      title: 'মেশিন লার্নিং',
      thumbnailUrl: '/thumb.jpg',
      progressPercentage: 40,
      targetCompletionDate: '2026-12-01',
      paceMode: 'ACCELERATED',
    };

    render(
      <LanguageProvider>
        <CourseCard course={sampleCourse} />
      </LanguageProvider>
    );

    expect(screen.getByText('মেশিন লার্নিং')).toBeTruthy();
    expect(screen.getByText('১ মাসে শেষ')).toBeTruthy();

    const adjustBtn = screen.getByText('রুটিন পরিবর্তন');
    expect(adjustBtn).toBeTruthy();

    // Clicking open modal
    fireEvent.click(adjustBtn);
    expect(screen.getByText('কোর্স রুটিন স্বয়ংক্রিয় রি-শিডিউল ও অ্যাডজাস্ট')).toBeTruthy();
  });
});
