// This suite isolates grading/answer confidentiality; audience permissions have dedicated tests.
vi.mock('@/lib/assessment-access', () => ({
  getAssessmentViewer: async () => (await auth() as any)?.user || null,
  authorizeAssessmentCreation: vi.fn(async () => ({ scope: 'GLOBAL', approvalStatus: 'APPROVED', audience: { educationLevels: [], departments: [], studentIds: [] } })),
  canAccessAssessment: vi.fn(async (_record, viewer) => !!viewer),
  filterVisibleAssessments: vi.fn(async (records) => records),
}));
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { auth } from '@/auth';
import { getExamByIdAction } from '@/actions/exam';
import { getContestBySlugAction } from '@/actions/contest';
import Exam from '@/models/Exam';
import Contest from '@/models/Contest';

vi.mock('@/lib/mongoose', () => ({ default: vi.fn() }));
vi.mock('@/models/Exam', () => ({ default: { findById: vi.fn() } }));
vi.mock('@/models/ExamSubmission', () => ({ default: { countDocuments: vi.fn(async () => 0) } }));
vi.mock('@/models/Contest', () => ({ default: { findOne: vi.fn() } }));

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(auth).mockResolvedValue(null as any);
  vi.mocked(Exam.findById).mockReturnValue({ populate: () => ({ lean: async () => ({
    _id: 'exam-1', status: 'PUBLISHED', createdById: 'instructor-1', questions: [{
      type: 'CODE', question: 'Solve', correctAnswer: 1, acceptedAnswers: ['answer'],
      testCases: [{ input: 'public', expectedOutput: '1' }, { input: 'secret', expectedOutput: '2', isHidden: true }],
    }],
  }) }) } as any);
  vi.mocked(Contest.findOne).mockReturnValue({ lean: async () => ({
    _id: 'contest-1', endTime: new Date(Date.now() + 60000),
    problems: [{ title: 'Problem', correctAnswer: 1, explanation: 'Solution' }],
  }) } as any);
});

describe('Assessment answer confidentiality', () => {
  it('does not expose exam answers when an anonymous caller requests preview mode', async () => {
    const result = await getExamByIdAction('exam-1', false);
    expect(result.error).toBeDefined();
    expect(result.exam).toBeUndefined();
  });
  it('lets the exam author inspect answers', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: 'instructor-1', role: 'INSTRUCTOR' } } as any);
    expect((await getExamByIdAction('exam-1', false)).exam?.questions[0]).toHaveProperty('correctAnswer', 1);
  });
  it('does not let another instructor inspect exam answers', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: 'other-instructor', role: 'INSTRUCTOR' } } as any);
    expect((await getExamByIdAction('exam-1', false)).exam?.questions[0]).not.toHaveProperty('correctAnswer');
  });
  it('does not expose active contest solutions using a client preview flag', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: 'student-1', role: 'STUDENT' } } as any);
    const result = await getContestBySlugAction('active-contest', false);
    expect(result.contest?.problems[0]).not.toHaveProperty('correctAnswer');
    expect(result.contest?.problems[0]).not.toHaveProperty('explanation');
  });
});
