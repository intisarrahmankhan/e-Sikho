import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getCourseAccessDetails,
  toggleLessonProgressAction,
  getCourseResourcesAction,
  getCourseLiveSessionsAction,
} from '@/actions/course-access';

// Mock auth
const mockAuth = vi.fn();
vi.mock('@/auth', () => ({
  auth: () => mockAuth(),
}));

// Mock Mongoose connection
vi.mock('@/lib/mongoose', () => ({
  default: vi.fn().mockResolvedValue(undefined),
}));

// Mock next/cache
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

// Mock Models
const mockEnrollmentFindOne = vi.fn();
vi.mock('@/models/Enrollment', () => ({
  default: {
    findOne: (...args: any[]) => ({
      lean: () => mockEnrollmentFindOne(...args),
    }),
  },
}));

const mockLessonProgressFind = vi.fn();
const mockLessonProgressFindOne = vi.fn();
const mockLessonProgressCreate = vi.fn();
vi.mock('@/models/LessonProgress', () => ({
  default: {
    find: (...args: any[]) => ({
      select: () => ({
        lean: () => mockLessonProgressFind(...args),
      }),
    }),
    findOne: (...args: any[]) => mockLessonProgressFindOne(...args),
    create: (...args: any[]) => mockLessonProgressCreate(...args),
  },
}));

vi.mock('@/models/Course', () => ({
  default: {
    findById: vi.fn().mockReturnValue({
      select: () => ({
        lean: () => Promise.resolve({ totalLessons: 10 }),
      }),
    }),
  },
}));

vi.mock('@/models/User', () => ({
  default: {
    findOne: vi.fn().mockReturnValue({
      select: () => ({
        lean: () => Promise.resolve({ _id: 'resolved-user-id' }),
      }),
    }),
  },
}));

describe('Course Content Access Control & Progress Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getCourseAccessDetails', () => {
    it('returns logged-out state with locked access when no user session', async () => {
      mockAuth.mockResolvedValueOnce(null);

      const result = await getCourseAccessDetails('fullstack-nextjs');

      expect(result.isLoggedIn).toBe(false);
      expect(result.isEnrolled).toBe(false);
      expect(result.canAccessAll).toBe(false);
      expect(result.completedLessonIds).toEqual([]);
    });

    it('returns not-enrolled state for a logged-in student without enrollment', async () => {
      mockAuth.mockResolvedValueOnce({
        user: { id: 'student-1', role: 'STUDENT', email: 'student@example.com' },
      });
      mockEnrollmentFindOne.mockResolvedValueOnce(null);
      mockLessonProgressFind.mockResolvedValueOnce([]);

      const result = await getCourseAccessDetails('fullstack-nextjs');

      expect(result.isLoggedIn).toBe(true);
      expect(result.isEnrolled).toBe(false);
      expect(result.canAccessAll).toBe(false);
    });

    it('grants full access when student holds active enrollment', async () => {
      mockAuth.mockResolvedValueOnce({
        user: { id: 'student-1', role: 'STUDENT', email: 'student@example.com' },
      });
      mockEnrollmentFindOne.mockResolvedValueOnce({
        _id: 'enrollment-1',
        userId: 'student-1',
        courseId: 'fullstack-nextjs',
        paymentStatus: 'success',
      });
      mockLessonProgressFind.mockResolvedValueOnce([
        { lessonId: 'l1', isCompleted: true },
        { lessonId: 'l2', isCompleted: true },
      ]);

      const result = await getCourseAccessDetails('fullstack-nextjs');

      expect(result.isLoggedIn).toBe(true);
      expect(result.isEnrolled).toBe(true);
      expect(result.canAccessAll).toBe(true);
      expect(result.completedLessonIds).toEqual(['l1', 'l2']);
      expect(result.progressPercentage).toBeGreaterThan(0);
    });

    it('grants administrative full access to ADMIN or SUPERADMIN regardless of enrollment', async () => {
      mockAuth.mockResolvedValueOnce({
        user: { id: 'admin-1', role: 'SUPERADMIN', email: 'admin@eshikho.com' },
      });
      mockEnrollmentFindOne.mockResolvedValueOnce(null);
      mockLessonProgressFind.mockResolvedValueOnce([]);

      const result = await getCourseAccessDetails('fullstack-nextjs');

      expect(result.isLoggedIn).toBe(true);
      expect(result.canAccessAll).toBe(true);
    });
  });

  describe('toggleLessonProgressAction', () => {
    it('creates completed progress record when none existed before', async () => {
      mockAuth.mockResolvedValueOnce({
        user: { id: 'student-1', email: 'student@example.com' },
      });
      mockLessonProgressFindOne.mockResolvedValueOnce(null);
      mockLessonProgressCreate.mockResolvedValueOnce({
        _id: 'progress-1',
        isCompleted: true,
      });

      const res = await toggleLessonProgressAction('fullstack-nextjs', 'lesson-1', true);

      expect(res.success).toBe(true);
      expect(res.isCompleted).toBe(true);
      expect(mockLessonProgressCreate).toHaveBeenCalled();
    });

    it('toggles existing completed record to incomplete', async () => {
      const mockRecord = {
        _id: 'progress-1',
        isCompleted: true,
        save: vi.fn().mockResolvedValue(undefined),
      };
      mockAuth.mockResolvedValueOnce({
        user: { id: 'student-1', email: 'student@example.com' },
      });
      mockLessonProgressFindOne.mockResolvedValueOnce(mockRecord);

      const res = await toggleLessonProgressAction('fullstack-nextjs', 'lesson-1');

      expect(res.success).toBe(true);
      expect(res.isCompleted).toBe(false);
      expect(mockRecord.save).toHaveBeenCalled();
    });
  });

  describe('getCourseResourcesAction', () => {
    it('returns downloadable PDF slide files and starter archives', async () => {
      const res = await getCourseResourcesAction('fullstack-nextjs');

      expect(res.success).toBe(true);
      expect(res.resources.length).toBeGreaterThan(0);
      expect(res.resources.some((r) => r.fileType === 'pdf')).toBe(true);
    });
  });

  describe('getCourseLiveSessionsAction', () => {
    it('returns scheduled live classes with Google Meet meeting links', async () => {
      const res = await getCourseLiveSessionsAction('fullstack-nextjs');

      expect(res.success).toBe(true);
      expect(res.liveSessions.length).toBeGreaterThan(0);
      expect(res.liveSessions.some((s) => s.meetUrl?.includes('meet.google.com'))).toBe(true);
    });
  });
});
