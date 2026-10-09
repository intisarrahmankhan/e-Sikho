import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import CourseDetailsPage from '@/app/courses/[id]/page';
import { LanguageProvider } from '@/context/LanguageContext';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  useParams: () => ({ id: 'mongo-course-id-123' }),
  notFound: vi.fn(),
}));

describe('CourseDetailsPage with Dynamic / Database Courses', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders successfully when learningOutcomes and prerequisites are JSON strings from DB', async () => {
    const mockDbCourse = {
      _id: 'mongo-course-id-123',
      id: 'mongo-course-id-123',
      title: 'ফ্লাটার দিয়ে মোবাইল অ্যাপ ডেভেলপমেন্ট',
      titleEn: 'Flutter App Development',
      tagline: 'Flutter & Dart Mastery',
      description: 'Comprehensive course on Flutter',
      category: 'app-dev',
      categoryBangla: 'অ্যাপ ডেভেলপমেন্ট',
      level: 'বিগিনার',
      rating: 4.8,
      totalRatings: 120,
      studentsEnrolled: 500,
      duration: '২০ ঘণ্টা',
      price: 3500,
      originalPrice: 5000,
      thumbnailUrl: 'https://example.com/thumb.jpg',
      instructor: {
        name: 'ফারহানা ইয়াসমিন',
        role: 'মোবাইল অ্যাপ ট্রেইনার',
        avatar: 'https://example.com/avatar.jpg',
        bio: 'অভিজ্ঞ ফ্লাটার ইঞ্জিনিয়ার',
      },
      // In MongoDB, these are stored as JSON strings:
      learningOutcomes: JSON.stringify([
        'Flutter উইজেট ট্রি বোঝা',
        'Riverpod স্টেট ম্যানেজমেন্ট',
      ]),
      prerequisites: JSON.stringify([
        'প্রোগ্রামিংয়ের মৌলিক ধারণা',
      ]),
      modules: [
        {
          id: 'mod-1',
          title: 'Introduction to Flutter',
          duration: '১ ঘণ্টা',
          lessons: [
            { id: 'les-1', title: 'Setting up Flutter SDK', duration: '১৫ মি.' },
          ],
        },
      ],
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockDbCourse,
    } as any);

    render(
      <LanguageProvider>
        <CourseDetailsPage />
      </LanguageProvider>
    );

    await waitFor(() => {
      expect(screen.getAllByText('ফ্লাটার দিয়ে মোবাইল অ্যাপ ডেভেলপমেন্ট').length).toBeGreaterThan(0);
    });

    // Verify learning outcomes were parsed and rendered properly
    expect(screen.getByText('Flutter উইজেট ট্রি বোঝা')).toBeTruthy();
    expect(screen.getByText('Riverpod স্টেট ম্যানেজমেন্ট')).toBeTruthy();

    // Verify prerequisites were parsed and rendered properly
    expect(screen.getByText('প্রোগ্রামিংয়ের মৌলিক ধারণা')).toBeTruthy();

    // Verify instructor
    expect(screen.getByText('ফারহানা ইয়াসমিন')).toBeTruthy();
  });

  it('handles empty or malformed learning outcomes without crashing', async () => {
    const mockDbCourseWithRawString = {
      _id: 'mongo-course-id-123',
      id: 'mongo-course-id-123',
      title: 'ডাটা সায়েন্স কোর্স',
      description: 'মৌলিক ডাটা সায়েন্স',
      price: 2000,
      learningOutcomes: 'পাইথন বেসিক\nপ্যান্ডাস ও নামপাই',
      prerequisites: '',
      modules: [],
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockDbCourseWithRawString,
    } as any);

    render(
      <LanguageProvider>
        <CourseDetailsPage />
      </LanguageProvider>
    );

    await waitFor(() => {
      expect(screen.getAllByText('ডাটা সায়েন্স কোর্স').length).toBeGreaterThan(0);
    });

    expect(screen.getByText('পাইথন বেসিক')).toBeTruthy();
    expect(screen.getByText('প্যান্ডাস ও নামপাই')).toBeTruthy();
  });
});
