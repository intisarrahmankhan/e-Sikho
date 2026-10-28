import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/actions/course-access', () => ({ getCourseAccessDetails: vi.fn(async () => ({ canAccessAll: true })) }));
vi.mock('@/models/Course', () => ({ default: { exists: vi.fn(async () => ({ _id: 'course-id' })), findById: vi.fn(() => ({ lean: async () => ({ title: 'Course' }) })) } }));

// Mock mongoose and models
vi.mock('@/lib/mongoose', () => ({
  default: vi.fn().mockResolvedValue(true),
}));

vi.mock('@/auth', () => ({
  auth: vi.fn(),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

import { auth } from '@/auth';
import LiveQuestion from '@/models/LiveQuestion';
import LiveSession from '@/models/LiveSession';
import Course from '@/models/Course';
import { getCourseAccessDetails } from '@/actions/course-access';
import {
  submitLiveQuestionAction,
  toggleUpvoteLiveQuestionAction,
  answerLiveQuestionAction,
  pinLiveQuestionAction,
  getLiveSessionDetailsAction,
} from '@/actions/live-class';

vi.mock('@/models/LiveQuestion', () => {
  return {
    default: {
      create: vi.fn(),
      findById: vi.fn(),
      find: vi.fn(),
    },
  };
});

vi.mock('@/models/LiveSession', () => {
  return {
    default: {
      findById: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue(null),
      }),
    },
  };
});

describe('Interactive Live Class Streaming with Real-Time Student Questions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getCourseAccessDetails).mockResolvedValue({ canAccessAll: true } as any);
    vi.mocked(LiveSession.findById).mockReturnValue({ lean: async () => ({ _id: '507f1f77bcf86cd799439010', courseId: 'fullstack-nextjs', title: 'Live class', scheduledTime: new Date(), status: 'LIVE_NOW', viewerCount: 0 }) } as any);
    vi.mocked(Course.exists).mockResolvedValue({ _id: 'course-id' } as any);
  });

  describe('submitLiveQuestionAction', () => {
    it('rejects question submission when user is not authenticated', async () => {
      vi.mocked(auth).mockResolvedValue(null as any);

      const res = await submitLiveQuestionAction({
        sessionId: 'live-next-1',
        courseId: 'fullstack-nextjs',
        question: 'How do Server Actions work?',
      });

      expect(res.success).toBe(false);
      expect(res.error).toContain('লগইন করুন');
    });

    it('rejects question when text length is less than 5 characters', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'student-123', name: 'Tanvir', role: 'STUDENT' },
      } as any);

      const res = await submitLiveQuestionAction({
        sessionId: 'live-next-1',
        courseId: 'fullstack-nextjs',
        question: 'Why?',
      });

      expect(res.success).toBe(false);
      expect(res.error).toContain('৫টি অক্ষরের');
    });

    it('successfully persists question and returns live question item', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'student-123', name: 'Tanvir Ahmed', role: 'STUDENT' },
      } as any);

      const fakeCreated = {
        _id: 'q-999',
        sessionId: 'live-next-1',
        courseId: 'fullstack-nextjs',
        studentId: 'student-123',
        studentName: 'Tanvir Ahmed',
        studentAvatar: 'https://example.com/avatar.png',
        question: 'How does NextAuth JWT rotation handle refresh tokens?',
        upvotes: [],
        upvoteCount: 0,
        isAnswered: false,
        isPinned: false,
        createdAt: new Date('2026-10-15T04:00:00Z'),
      };

      vi.mocked(LiveQuestion.create).mockResolvedValue(fakeCreated as any);

      const res = await submitLiveQuestionAction({
        sessionId: 'live-next-1',
        courseId: 'fullstack-nextjs',
        question: 'How does NextAuth JWT rotation handle refresh tokens?',
      });

      expect(res.success).toBe(true);
      expect(res.question).toBeDefined();
      expect(res.question?.id).toBe('q-999');
      expect(res.question?.question).toContain('NextAuth JWT rotation');
      expect(res.question?.upvoteCount).toBe(0);
      expect(res.question?.isAuthor).toBe(true);
    });
  });

  describe('toggleUpvoteLiveQuestionAction', () => {
    it('adds student upvote when student has not yet upvoted', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'student-voter-1', name: 'Voter One', role: 'STUDENT' },
      } as any);

      const mockQuestionDoc: any = {
        _id: 'q-100',
        sessionId: 'live-next-1',
        upvotes: ['other-user-2'],
        upvoteCount: 1,
        save: vi.fn().mockResolvedValue(true),
      };

      vi.mocked(LiveQuestion.findById).mockResolvedValue(mockQuestionDoc);

      const res = await toggleUpvoteLiveQuestionAction('q-100');

      expect(res.success).toBe(true);
      expect(res.hasUpvoted).toBe(true);
      expect(res.upvoteCount).toBe(2);
      expect(mockQuestionDoc.upvotes).toContain('student-voter-1');
      expect(mockQuestionDoc.save).toHaveBeenCalled();
    });

    it('removes student upvote when student already upvoted (toggle off)', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'student-voter-1', name: 'Voter One', role: 'STUDENT' },
      } as any);

      const mockQuestionDoc: any = {
        _id: 'q-100',
        sessionId: 'live-next-1',
        upvotes: ['student-voter-1', 'other-user-2'],
        upvoteCount: 2,
        save: vi.fn().mockResolvedValue(true),
      };

      vi.mocked(LiveQuestion.findById).mockResolvedValue(mockQuestionDoc);

      const res = await toggleUpvoteLiveQuestionAction('q-100');

      expect(res.success).toBe(true);
      expect(res.hasUpvoted).toBe(false);
      expect(res.upvoteCount).toBe(1);
      expect(mockQuestionDoc.upvotes).not.toContain('student-voter-1');
      expect(mockQuestionDoc.save).toHaveBeenCalled();
    });
  });

  describe('answerLiveQuestionAction', () => {
    it('marks question as answered and saves instructor reply', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'instructor-1', name: 'Lead Instructor', role: 'INSTRUCTOR' },
      } as any);

      const mockQuestionDoc: any = {
        _id: 'q-200',
        sessionId: 'live-next-1',
        isAnswered: false,
        instructorReply: '',
        save: vi.fn().mockResolvedValue(true),
      };

      vi.mocked(LiveQuestion.findById).mockResolvedValue(mockQuestionDoc);

      const res = await answerLiveQuestionAction({
        questionId: 'q-200',
        isAnswered: true,
        instructorReply: 'Use Server Actions with useTransition for optimal UX.',
      });

      expect(res.success).toBe(true);
      expect(res.isAnswered).toBe(true);
      expect(res.instructorReply).toBe('Use Server Actions with useTransition for optimal UX.');
      expect(mockQuestionDoc.isAnswered).toBe(true);
      expect(mockQuestionDoc.instructorReply).toContain('useTransition');
      expect(mockQuestionDoc.save).toHaveBeenCalled();
    });
  });

  describe('pinLiveQuestionAction', () => {
    it('toggles question pinned status for instructor highlight', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'instructor-1', name: 'Lead Instructor', role: 'INSTRUCTOR' },
      } as any);

      const mockQuestionDoc: any = {
        _id: 'q-300',
        sessionId: 'live-next-1',
        isPinned: false,
        save: vi.fn().mockResolvedValue(true),
      };

      vi.mocked(LiveQuestion.findById).mockResolvedValue(mockQuestionDoc);

      const res = await pinLiveQuestionAction('q-300');

      expect(res.success).toBe(true);
      expect(res.isPinned).toBe(true);
      expect(mockQuestionDoc.isPinned).toBe(true);
    });
  });

  describe('getLiveSessionDetailsAction', () => {
    it('loads live session and questions sorted by votes and pinned state', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'student-99', name: 'Active Student', role: 'STUDENT' },
      } as any);

      const mockQuestions = [
        {
          _id: 'q-1',
          sessionId: 'live-next-1',
          courseId: 'fullstack-nextjs',
          studentId: 'student-1',
          studentName: 'Student 1',
          question: 'Pinned question with 5 votes',
          upvotes: ['u1', 'u2', 'u3', 'u4', 'u5'],
          upvoteCount: 5,
          isAnswered: false,
          isPinned: true,
          createdAt: new Date(),
        },
        {
          _id: 'q-2',
          sessionId: 'live-next-1',
          courseId: 'fullstack-nextjs',
          studentId: 'student-2',
          studentName: 'Student 2',
          question: 'Unpinned question with 20 votes',
          upvotes: ['student-99', 'u2'],
          upvoteCount: 20,
          isAnswered: true,
          isPinned: false,
          createdAt: new Date(),
        },
      ];

      vi.mocked(LiveQuestion.find).mockReturnValue({
        sort: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue(mockQuestions),
        }),
      } as any);

      const res = await getLiveSessionDetailsAction('507f1f77bcf86cd799439010');

      expect(res.success).toBe(true);
      expect(res.session).toBeDefined();
      expect(res.session?.status).toBe('LIVE_NOW');
      expect(res.questions.length).toBe(2);

      // Student 99 has upvoted q-2
      const q2 = res.questions.find((q) => q.id === 'q-2');
      expect(q2?.hasUpvoted).toBe(true);
    });
  });
  it('prevents a student from answering or pinning questions', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: 'student-1', role: 'STUDENT' } } as any);
    const question = { courseId: 'course-1', save: vi.fn() };
    vi.mocked(LiveQuestion.findById).mockResolvedValue(question as any);
    expect((await answerLiveQuestionAction({ questionId: 'q-1' })).success).toBe(false);
    expect((await pinLiveQuestionAction('q-1')).success).toBe(false);
    expect(question.save).not.toHaveBeenCalled();
  });
  it('prevents another instructor from modifying the course live questions', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: 'other-instructor', role: 'INSTRUCTOR' } } as any);
    vi.mocked(Course.exists).mockResolvedValue(null);
    const question = { courseId: 'course-1', save: vi.fn() };
    vi.mocked(LiveQuestion.findById).mockResolvedValue(question as any);
    expect((await answerLiveQuestionAction({ questionId: 'q-1' })).success).toBe(false);
    expect(question.save).not.toHaveBeenCalled();
  });
  it('does not create fake sessions or seed questions for missing sessions', async () => {
    vi.mocked(LiveSession.findById).mockReturnValue({ lean: async () => null } as any);
    expect((await getLiveSessionDetailsAction('507f1f77bcf86cd799439010')).success).toBe(false);
    expect(LiveQuestion.create).not.toHaveBeenCalled();
  });

});
