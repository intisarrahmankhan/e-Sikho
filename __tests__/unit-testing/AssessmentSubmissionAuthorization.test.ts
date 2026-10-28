import { beforeEach, expect, it, vi } from 'vitest';
import { auth } from '@/auth';
import { submitExamAction } from '@/actions/exam';
import { submitContestAction } from '@/actions/contest';
import { canAccessAssessment } from '@/lib/assessment-access';
import ExamSubmission from '@/models/ExamSubmission';
import ContestSubmission from '@/models/ContestSubmission';
vi.mock('@/lib/mongoose', () => ({ default: vi.fn() }));
vi.mock('@/lib/assessment-access', () => ({ getAssessmentViewer: vi.fn(async () => ({ id: '507f1f77bcf86cd799439001', role: 'STUDENT' })), canAccessAssessment: vi.fn(async () => false), filterVisibleAssessments: vi.fn(), authorizeAssessmentCreation: vi.fn() }));
vi.mock('@/models/User', () => ({ default: { findOne: vi.fn(async () => ({ _id: '507f1f77bcf86cd799439001' })) } }));
vi.mock('@/models/Exam', () => ({ default: { findById: vi.fn(() => ({ lean: async () => ({ _id: '507f1f77bcf86cd799439002', status: 'PUBLISHED', scope: 'GLOBAL', questions: [] }) })) } }));
vi.mock('@/models/Contest', () => ({ default: { findOne: vi.fn(() => ({ lean: async () => ({ _id: '507f1f77bcf86cd799439003', scope: 'GLOBAL', problems: [] }) })) } }));
vi.mock('@/models/ExamSubmission', () => ({ default: { create: vi.fn() } }));
vi.mock('@/models/ContestSubmission', () => ({ default: { create: vi.fn(), findOneAndUpdate: vi.fn() } }));
beforeEach(() => { vi.clearAllMocks(); vi.mocked(auth).mockResolvedValue({ user: { id: '507f1f77bcf86cd799439001', role: 'STUDENT' } } as any); });
it('rejects a forged exam submission from an excluded student before grading or saving', async () => {
  const result = await submitExamAction({ examId: '507f1f77bcf86cd799439002', answers: {}, timeTakenSeconds: 30 });
  expect(result.error).toContain('not eligible'); expect(canAccessAssessment).toHaveBeenCalled(); expect(ExamSubmission.create).not.toHaveBeenCalled();
});
it('rejects a forged contest submission from an excluded student before scoring or changing ratings', async () => {
  const result = await submitContestAction({ contestSlug: 'restricted-contest', answers: {}, timeTakenSeconds: 30 });
  expect(result.error).toContain('not eligible'); expect(canAccessAssessment).toHaveBeenCalled(); expect(ContestSubmission.create).not.toHaveBeenCalled(); expect(ContestSubmission.findOneAndUpdate).not.toHaveBeenCalled();
});
