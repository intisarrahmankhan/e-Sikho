// This suite isolates grading/answer confidentiality; audience permissions have dedicated tests.
vi.mock('@/lib/assessment-access', () => ({
  getAssessmentViewer: async () => (await auth() as any)?.user || null,
  authorizeAssessmentCreation: vi.fn(async () => ({ scope: 'GLOBAL', approvalStatus: 'APPROVED', audience: { educationLevels: [], departments: [], studentIds: [] } })),
  canAccessAssessment: vi.fn(async (_record, viewer) => !!viewer),
  filterVisibleAssessments: vi.fn(async (records) => records),
}));
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createExamAction, submitExamAction } from '@/actions/exam';
import { auth } from '@/auth';
import Exam from '@/models/Exam';
import ExamSubmission from '@/models/ExamSubmission';

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
    countDocuments: vi.fn().mockResolvedValue(0),
  },
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

describe('Configurable Fractional Negative Marking Engine', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Exam Creation with Configurable Negative Marking', () => {
    it('should create an exam with negative marking enabled and custom fractional rate', async () => {
      (auth as any).mockResolvedValue({
        user: { id: 'inst-1', role: 'INSTRUCTOR', name: 'Dr. Instructor' },
      });

      const mockExamDoc = {
        _id: 'exam-neg-1',
        title: 'Physics Advanced Mock Exam',
        hasNegativeMarking: true,
        negativeMarkingValue: 0.25,
      };

      (Exam.create as any).mockResolvedValue(mockExamDoc);

      const result = await createExamAction({
        title: 'Physics Advanced Mock Exam',
        category: 'পদার্থবিজ্ঞান',
        duration: 30,
        totalMarks: 4,
        passMarks: 1,
        hasNegativeMarking: true,
        negativeMarkingValue: 0.25,
        questions: [
          {
            type: 'MCQ',
            question: 'What is the speed of light?',
            options: ['3x10^8 m/s', '2x10^8 m/s', '1x10^8 m/s', '4x10^8 m/s'],
            correctAnswer: 0,
            marks: 1,
          },
        ],
      });

      expect(result.success).toBe(true);
      expect(result.examId).toBe('exam-neg-1');
      expect(Exam.create).toHaveBeenCalledWith(
        expect.objectContaining({
          hasNegativeMarking: true,
          negativeMarkingValue: 0.25,
        })
      );
    });

    it('should support other configurable negative marking rates such as -0.33 or -0.50', async () => {
      (auth as any).mockResolvedValue({
        user: { id: 'inst-2', role: 'INSTRUCTOR', name: 'Math Teacher' },
      });

      const mockExamDoc = {
        _id: 'exam-neg-2',
        title: 'Competitive Math Olympiad',
        hasNegativeMarking: true,
        negativeMarkingValue: 0.33,
      };

      (Exam.create as any).mockResolvedValue(mockExamDoc);

      const result = await createExamAction({
        title: 'Competitive Math Olympiad',
        category: 'গণিত',
        duration: 45,
        totalMarks: 10,
        passMarks: 1,
        hasNegativeMarking: true,
        negativeMarkingValue: 0.33,
        questions: [
          {
            type: 'MCQ',
            question: 'What is 2+2?',
            options: ['4', '3', '2', '1'],
            correctAnswer: 0,
            marks: 1,
          },
        ],
      });

      expect(result.success).toBe(true);
      expect(Exam.create).toHaveBeenCalledWith(
        expect.objectContaining({
          hasNegativeMarking: true,
          negativeMarkingValue: 0.33,
        })
      );
    });
  });

  describe('Submission Evaluation & Negative Marking Calculation', () => {
    const mockExam = {
      _id: 'exam-calc-1',
      title: 'Science Quiz with Negative Marking',
      hasNegativeMarking: true,
      negativeMarkingValue: 0.25,
      totalMarks: 4,
      passMarks: 2,
      questions: [
        {
          type: 'MCQ',
          question: 'Q1: Capital of Bangladesh?',
          options: ['Dhaka', 'Chittagong', 'Sylhet', 'Rajshahi'],
          correctAnswer: 0,
          marks: 1,
        },
        {
          type: 'TRUE_FALSE',
          question: 'Q2: Earth is flat.',
          correctAnswer: 1, // 0 = True, 1 = False
          marks: 1,
        },
        {
          type: 'SHORT_ANSWER',
          question: 'Q3: Name the protocol for web browsing.',
          acceptedAnswers: ['HTTP', 'HTTPS'],
          marks: 1,
        },
        {
          type: 'MCQ',
          question: 'Q4: 5 * 5 = ?',
          options: ['20', '25', '30', '35'],
          correctAnswer: 1,
          marks: 1,
        },
      ],
    };

    it('should deduct fractional marks only for attempted wrong answers, leaving skipped questions at 0 penalty', async () => {
      (auth as any).mockResolvedValue({
        user: { id: 'student-1', role: 'STUDENT', name: 'Rahim' },
      });

      (Exam.findById as any).mockReturnValue({
        lean: vi.fn().mockResolvedValue(mockExam),
      });

      (ExamSubmission.create as any).mockImplementation((data: any) => ({
        _id: 'sub-neg-1',
        ...data,
      }));

      // Answers:
      // Q0: Correct (Dhaka, index 0) -> +1
      // Q1: Wrong (answered True (0), correct is False (1)) -> attempted wrong -> -0.25
      // Q2: Skipped (empty text answer) -> skipped -> 0 penalty
      // Q3: Wrong (selected index 0 (20), correct is index 1 (25)) -> attempted wrong -> -0.25
      const answers = {
        0: { selectedOption: 0 },
        1: { selectedOption: 0 },
        2: { textAnswer: '' }, // unattempted / skipped
        3: { selectedOption: 0 },
      };

      const result = await submitExamAction({
        examId: 'exam-calc-1',
        answers,
        timeTakenSeconds: 120,
      });

      expect(result.success).toBe(true);
      expect(result.result).toBeDefined();

      const r = result.result!;
      expect(r.hasNegativeMarking).toBe(true);
      expect(r.negativeMarkingRate).toBe(0.25);
      expect(r.rawEarnedScore).toBe(1); // 1 correct
      expect(r.totalCorrect).toBe(1);
      expect(r.totalWrong).toBe(2);
      expect(r.totalSkipped).toBe(1);
      expect(r.negativeMarksDeducted).toBe(0.5); // 2 * 0.25
      expect(r.score).toBe(0.5); // 1 - 0.5 = 0.5

      // Check breakdown items
      const b = r.breakdown;
      expect(b[0].isCorrect).toBe(true);
      expect(b[0].negativeMarks).toBe(0);

      expect(b[1].isCorrect).toBe(false);
      expect(b[1].isAttempted).toBe(true);
      expect(b[1].negativeMarks).toBe(0.25);

      expect(b[2].isCorrect).toBe(false);
      expect(b[2].isAttempted).toBe(false);
      expect(b[2].negativeMarks).toBe(0); // 0 penalty for skipped!

      expect(b[3].isCorrect).toBe(false);
      expect(b[3].isAttempted).toBe(true);
      expect(b[3].negativeMarks).toBe(0.25);
    });

    it('should clamp the final score at zero when negative deductions exceed earned marks', async () => {
      (auth as any).mockResolvedValue({
        user: { id: 'student-2', role: 'STUDENT', name: 'Karim' },
      });

      (Exam.findById as any).mockReturnValue({
        lean: vi.fn().mockResolvedValue(mockExam),
      });

      (ExamSubmission.create as any).mockImplementation((data: any) => ({
        _id: 'sub-neg-2',
        ...data,
      }));

      // All 4 answers attempted and wrong:
      // Q0: Wrong (selected 1) -> -0.25
      // Q1: Wrong (selected 0) -> -0.25
      // Q2: Wrong (textAnswer 'FTP') -> -0.25
      // Q3: Wrong (selected 0) -> -0.25
      // Total earned: 0, Total negative: 1.0 -> clamped at 0
      const answers = {
        0: { selectedOption: 1 },
        1: { selectedOption: 0 },
        2: { textAnswer: 'FTP' },
        3: { selectedOption: 0 },
      };

      const result = await submitExamAction({
        examId: 'exam-calc-1',
        answers,
        timeTakenSeconds: 90,
      });

      expect(result.success).toBe(true);
      const r = result.result!;
      expect(r.rawEarnedScore).toBe(0);
      expect(r.totalCorrect).toBe(0);
      expect(r.totalWrong).toBe(4);
      expect(r.totalSkipped).toBe(0);
      expect(r.negativeMarksDeducted).toBe(1.0);
      expect(r.score).toBe(0); // Clamped at 0, not -1.0
      expect(r.percentage).toBe(0);
      expect(r.passed).toBe(false);
    });

    it('should not deduct negative marks when hasNegativeMarking is disabled', async () => {
      (auth as any).mockResolvedValue({
        user: { id: 'student-3', role: 'STUDENT', name: 'Anik' },
      });

      const examWithoutNeg = {
        ...mockExam,
        hasNegativeMarking: false,
        negativeMarkingValue: 0.25,
      };

      (Exam.findById as any).mockReturnValue({
        lean: vi.fn().mockResolvedValue(examWithoutNeg),
      });

      (ExamSubmission.create as any).mockImplementation((data: any) => ({
        _id: 'sub-no-neg',
        ...data,
      }));

      // 1 correct, 2 wrong, 1 skipped
      const answers = {
        0: { selectedOption: 0 }, // correct (+1)
        1: { selectedOption: 0 }, // wrong (0 deduction since disabled)
        2: { textAnswer: 'wrong answer' }, // wrong (0 deduction since disabled)
        3: { selectedOption: -1 }, // skipped
      };

      const result = await submitExamAction({
        examId: 'exam-calc-1',
        answers,
        timeTakenSeconds: 60,
      });

      expect(result.success).toBe(true);
      const r = result.result!;
      expect(r.hasNegativeMarking).toBe(false);
      expect(r.rawEarnedScore).toBe(1);
      expect(r.negativeMarksDeducted).toBe(0);
      expect(r.score).toBe(1);
      expect(r.breakdown[1].negativeMarks).toBe(0);
      expect(r.breakdown[2].negativeMarks).toBe(0);
    });

    it('should correctly handle custom negative marking values like -0.50', async () => {
      (auth as any).mockResolvedValue({
        user: { id: 'student-4', role: 'STUDENT', name: 'Tasnim' },
      });

      const examWith50Neg = {
        ...mockExam,
        hasNegativeMarking: true,
        negativeMarkingValue: 0.5,
      };

      (Exam.findById as any).mockReturnValue({
        lean: vi.fn().mockResolvedValue(examWith50Neg),
      });

      (ExamSubmission.create as any).mockImplementation((data: any) => ({
        _id: 'sub-neg-50',
        ...data,
      }));

      // 2 correct (+2), 1 wrong (-0.50), 1 skipped (0)
      const answers = {
        0: { selectedOption: 0 }, // correct
        1: { selectedOption: 1 }, // correct
        2: { textAnswer: 'WrongProtocol' }, // wrong -> -0.50
        3: { selectedOption: -1 }, // skipped -> 0
      };

      const result = await submitExamAction({
        examId: 'exam-calc-1',
        answers,
        timeTakenSeconds: 150,
      });

      expect(result.success).toBe(true);
      const r = result.result!;
      expect(r.negativeMarkingRate).toBe(0.5);
      expect(r.rawEarnedScore).toBe(2);
      expect(r.totalCorrect).toBe(2);
      expect(r.totalWrong).toBe(1);
      expect(r.totalSkipped).toBe(1);
      expect(r.negativeMarksDeducted).toBe(0.5);
      expect(r.score).toBe(1.5); // 2 - 0.5 = 1.5
    });
  });
});
