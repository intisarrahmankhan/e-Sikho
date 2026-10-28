// This suite isolates grading/answer confidentiality; audience permissions have dedicated tests.
vi.mock('@/lib/assessment-access', () => ({
  getAssessmentViewer: async () => (await auth() as any)?.user || null,
  authorizeAssessmentCreation: vi.fn(async () => ({ scope: 'GLOBAL', approvalStatus: 'APPROVED', audience: { educationLevels: [], departments: [], studentIds: [] } })),
  canAccessAssessment: vi.fn(async (_record, viewer) => !!viewer),
  filterVisibleAssessments: vi.fn(async (records) => records),
}));
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createExamAction, getExamByIdAction, submitExamAction } from '@/actions/exam';
import { auth } from '@/auth';
import Exam from '@/models/Exam';
import ExamSubmission from '@/models/ExamSubmission';
import User from '@/models/User';

vi.mock('@/auth', () => ({
  auth: vi.fn(),
}));

vi.mock('@/lib/mongoose', () => ({
  default: vi.fn().mockResolvedValue(true),
}));

vi.mock('@/models/Exam', () => ({
  default: {
    create: vi.fn(),
    findById: vi.fn(),
    countDocuments: vi.fn(),
    insertMany: vi.fn(),
  },
}));

vi.mock('@/models/ExamSubmission', () => ({
  default: {
    create: vi.fn(),
    countDocuments: vi.fn(),
  },
}));

vi.mock('@/models/User', () => ({
  default: {
    findOne: vi.fn(),
  },
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

describe('Exam Retake Policy Enforcement (Maximum 3 Attempts Cap & Configurable Limit)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Exam Creation with Configurable Max Attempts', () => {
    it('should default maxAttempts to 3 when not specified', async () => {
      (auth as any).mockResolvedValue({
        user: { id: 'inst-1', role: 'INSTRUCTOR', name: 'Dr. Kabir' },
      });

      const mockCreated = {
        _id: 'exam-retake-default',
        title: 'Algorithms Midterm',
        maxAttempts: 3,
      };

      (Exam.create as any).mockResolvedValue(mockCreated);

      const result = await createExamAction({
        title: 'Algorithms Midterm',
        category: 'Computer Science',
        duration: 30,
        totalMarks: 2,
        passMarks: 1,
        questions: [
          {
            type: 'MCQ',
            question: 'What is O(1)?',
            options: ['Constant time', 'Linear time'],
            correctAnswer: 0,
            marks: 2,
          },
        ],
      });

      expect(result.success).toBe(true);
      expect(Exam.create).toHaveBeenCalledWith(
        expect.objectContaining({
          maxAttempts: 3,
        })
      );
    });

    it('should allow instructor to configure custom attempts (e.g., 1 attempt [Strict], or 5 attempts)', async () => {
      (auth as any).mockResolvedValue({
        user: { id: 'inst-1', role: 'INSTRUCTOR', name: 'Dr. Kabir' },
      });

      const mockCreated = {
        _id: 'exam-retake-strict',
        title: 'Strict Final Exam',
        maxAttempts: 1,
      };

      (Exam.create as any).mockResolvedValue(mockCreated);

      const result = await createExamAction({
        title: 'Strict Final Exam',
        category: 'Computer Science',
        duration: 60,
        totalMarks: 5,
        passMarks: 3,
        maxAttempts: 1, // Strict single attempt
        questions: [
          {
            type: 'TRUE_FALSE',
            question: 'Arrays have continuous memory.',
            options: ['সত্য (True)', 'মিথ্যা (False)'],
            correctAnswer: 0,
            marks: 5,
          },
        ],
      });

      expect(result.success).toBe(true);
      expect(Exam.create).toHaveBeenCalledWith(
        expect.objectContaining({
          maxAttempts: 1,
        })
      );
    });
  });

  describe('Attempt Tracking via getExamByIdAction', () => {
    const mockExam = {
      _id: 'exam-101',
      title: 'Data Structures Quiz',
      category: 'Computer Science',
      duration: 20,
      totalMarks: 1,
      passMarks: 1,
      maxAttempts: 3,
      questions: [
        {
          _id: 'q1',
          type: 'MCQ',
          question: 'Stack is LIFO?',
          options: ['Yes', 'No'],
          correctAnswer: 0,
          marks: 1,
        },
      ],
    };

    it('should report canAttempt: true with 3 remaining attempts for fresh student', async () => {
      (auth as any).mockResolvedValue({
        user: { id: 'student-new', role: 'STUDENT' },
      });

      (Exam.findById as any).mockReturnValue({
        populate: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue(mockExam),
        }),
      });

      // No prior submissions
      (ExamSubmission.countDocuments as any).mockResolvedValue(0);

      const result = await getExamByIdAction('exam-101', true);
      expect(result.success).toBe(true);
      expect(result.exam?.maxAttempts).toBe(3);
      expect(result.exam?.attemptsCount).toBe(0);
      expect(result.exam?.remainingAttempts).toBe(3);
      expect(result.exam?.canAttempt).toBe(true);
    });

    it('should report canAttempt: true with 1 remaining attempt after 2 submissions', async () => {
      (auth as any).mockResolvedValue({
        user: { id: 'student-returning', role: 'STUDENT' },
      });

      (Exam.findById as any).mockReturnValue({
        populate: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue(mockExam),
        }),
      });

      // 2 prior submissions
      (ExamSubmission.countDocuments as any).mockResolvedValue(2);

      const result = await getExamByIdAction('exam-101', true);
      expect(result.success).toBe(true);
      expect(result.exam?.attemptsCount).toBe(2);
      expect(result.exam?.remainingAttempts).toBe(1);
      expect(result.exam?.canAttempt).toBe(true);
    });

    it('should report canAttempt: false and 0 remaining attempts when cap of 3 is reached', async () => {
      (auth as any).mockResolvedValue({
        user: { id: 'student-exhausted', role: 'STUDENT' },
      });

      (Exam.findById as any).mockReturnValue({
        populate: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue(mockExam),
        }),
      });

      // 3 prior submissions = reached cap
      (ExamSubmission.countDocuments as any).mockResolvedValue(3);

      const result = await getExamByIdAction('exam-101', true);
      expect(result.success).toBe(true);
      expect(result.exam?.attemptsCount).toBe(3);
      expect(result.exam?.remainingAttempts).toBe(0);
      expect(result.exam?.canAttempt).toBe(false);
    });
  });

  describe('Submission Enforcement & Retake Cap Block', () => {
    const mockExam = {
      _id: 'exam-202',
      title: 'Discrete Math Test',
      totalMarks: 1,
      passMarks: 1,
      maxAttempts: 3,
      questions: [
        {
          type: 'MCQ',
          question: 'Is graph connected?',
          options: ['Yes', 'No'],
          correctAnswer: 0,
          marks: 1,
        },
      ],
    };

    it('should allow attempt 1 of 3, recording attemptNumber: 1 and canRetake: true', async () => {
      (auth as any).mockResolvedValue({
        user: { id: 'student-abc', role: 'STUDENT' },
      });

      (Exam.findById as any).mockReturnValue({
        lean: vi.fn().mockResolvedValue(mockExam),
      });

      // 0 existing attempts
      (ExamSubmission.countDocuments as any).mockResolvedValue(0);
      (ExamSubmission.create as any).mockImplementation((data: any) => ({
        _id: 'sub-attempt-1',
        ...data,
      }));

      const result = await submitExamAction({
        examId: 'exam-202',
        answers: { 0: { selectedOption: 0 } },
        timeTakenSeconds: 60,
      });

      expect(result.success).toBe(true);
      expect(result.result?.attemptNumber).toBe(1);
      expect(result.result?.maxAttempts).toBe(3);
      expect(result.result?.attemptsRemaining).toBe(2);
      expect(result.result?.canRetake).toBe(true);

      expect(ExamSubmission.create).toHaveBeenCalledWith(
        expect.objectContaining({
          attemptNumber: 1,
          studentId: 'student-abc',
        })
      );
    });

    it('should allow attempt 3 of 3, recording canRetake: false because cap is reached', async () => {
      (auth as any).mockResolvedValue({
        user: { id: 'student-abc', role: 'STUDENT' },
      });

      (Exam.findById as any).mockReturnValue({
        lean: vi.fn().mockResolvedValue(mockExam),
      });

      // 2 existing attempts -> this is attempt 3
      (ExamSubmission.countDocuments as any).mockResolvedValue(2);
      (ExamSubmission.create as any).mockImplementation((data: any) => ({
        _id: 'sub-attempt-3',
        ...data,
      }));

      const result = await submitExamAction({
        examId: 'exam-202',
        answers: { 0: { selectedOption: 0 } },
        timeTakenSeconds: 50,
      });

      expect(result.success).toBe(true);
      expect(result.result?.attemptNumber).toBe(3);
      expect(result.result?.maxAttempts).toBe(3);
      expect(result.result?.attemptsRemaining).toBe(0);
      expect(result.result?.canRetake).toBe(false);
    });

    it('should reject attempt 4 with error when maxAttempts of 3 has already been reached', async () => {
      (auth as any).mockResolvedValue({
        user: { id: 'student-abc', role: 'STUDENT' },
      });

      (Exam.findById as any).mockReturnValue({
        lean: vi.fn().mockResolvedValue(mockExam),
      });

      // 3 existing attempts -> attempt 4 should be blocked!
      (ExamSubmission.countDocuments as any).mockResolvedValue(3);

      const result = await submitExamAction({
        examId: 'exam-202',
        answers: { 0: { selectedOption: 0 } },
        timeTakenSeconds: 45,
      });

      expect(result.error).toBeDefined();
      expect(result.error).toContain('সর্বোচ্চ 3 বার প্রচেষ্টার সীমা সম্পন্ন করেছেন');
      expect(ExamSubmission.create).not.toHaveBeenCalled();
    });

    it('should respect custom instructor maxAttempts limit (e.g. 1 attempt strict cap)', async () => {
      const strictExam = {
        ...mockExam,
        _id: 'exam-strict-1',
        maxAttempts: 1,
      };

      (auth as any).mockResolvedValue({
        user: { id: 'student-strict', role: 'STUDENT' },
      });

      (Exam.findById as any).mockReturnValue({
        lean: vi.fn().mockResolvedValue(strictExam),
      });

      // 1 prior attempt -> 2nd attempt blocked immediately
      (ExamSubmission.countDocuments as any).mockResolvedValue(1);

      const result = await submitExamAction({
        examId: 'exam-strict-1',
        answers: { 0: { selectedOption: 0 } },
        timeTakenSeconds: 45,
      });

      expect(result.error).toBeDefined();
      expect(result.error).toContain('সর্বোচ্চ 1 বার প্রচেষ্টার সীমা সম্পন্ন করেছেন');
      expect(ExamSubmission.create).not.toHaveBeenCalled();
    });
  });
});
