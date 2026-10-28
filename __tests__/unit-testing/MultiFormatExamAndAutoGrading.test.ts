// This suite isolates grading/answer confidentiality; audience permissions have dedicated tests.
vi.mock('@/lib/assessment-access', () => ({
  getAssessmentViewer: async () => (await auth() as any)?.user || null,
  authorizeAssessmentCreation: vi.fn(async () => ({ scope: 'GLOBAL', approvalStatus: 'APPROVED', audience: { educationLevels: [], departments: [], studentIds: [] } })),
  canAccessAssessment: vi.fn(async (_record, viewer) => !!viewer),
  filterVisibleAssessments: vi.fn(async (records) => records),
}));
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  evaluateShortAnswer,
  evaluateCodeSubmission,
  normalizeOutput,
} from '@/lib/code-evaluator';
import {
  createExamAction,
  submitExamAction,
  runSampleCodeAction,
} from '@/actions/exam';
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

describe('Multi-Format Exam & Auto-Grading Engine', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Short-Answer Intelligent Evaluator (evaluateShortAnswer)', () => {
    const accepted = ['Queue', 'কিউ', 'FIFO queue', '10.5'];

    it('should correctly accept exact match', () => {
      expect(evaluateShortAnswer('Queue', accepted)).toBe(true);
    });

    it('should accept case-insensitive variations', () => {
      expect(evaluateShortAnswer('queue', accepted)).toBe(true);
      expect(evaluateShortAnswer('QUEUE', accepted)).toBe(true);
    });

    it('should trim surrounding whitespace and trailing sentence punctuation', () => {
      expect(evaluateShortAnswer('   Queue.  ', accepted)).toBe(true);
      expect(evaluateShortAnswer('FIFO queue!', accepted)).toBe(true);
    });

    it('should match Bengali alternative synonyms', () => {
      expect(evaluateShortAnswer('কিউ', accepted)).toBe(true);
    });

    it('should match numeric equivalence', () => {
      expect(evaluateShortAnswer('10.50', accepted)).toBe(true);
      expect(evaluateShortAnswer('10.5', accepted)).toBe(true);
    });

    it('should reject incorrect answers', () => {
      expect(evaluateShortAnswer('Stack', accepted)).toBe(false);
      expect(evaluateShortAnswer('Random string', accepted)).toBe(false);
      expect(evaluateShortAnswer('', accepted)).toBe(false);
      expect(evaluateShortAnswer(null as any, accepted)).toBe(false);
    });
  });

  describe('Automated Code Execution & Verification (evaluateCodeSubmission)', () => {
    const twoSumTestCases = [
      { input: '[5, 10]', expectedOutput: '15', isHidden: false },
      { input: '[-3, 7]', expectedOutput: '4', isHidden: false },
      { input: '[100, 200]', expectedOutput: '300', isHidden: true },
    ];

    it('should grade code as correct when all test cases pass', () => {
      const studentCode = `
        function solve(input) {
          return input[0] + input[1];
        }
      `;

      const result = evaluateCodeSubmission(studentCode, twoSumTestCases);
      expect(result.allPassed).toBe(true);
      expect(result.passedCount).toBe(3);
      expect(result.totalCount).toBe(3);
      expect(result.results.every((r) => r.passed)).toBe(true);
    });

    it('should fail when code produces wrong answer on test cases', () => {
      const buggyCode = `
        function solve(input) {
          return input[0] - input[1]; // wrong subtraction
        }
      `;

      const result = evaluateCodeSubmission(buggyCode, twoSumTestCases);
      expect(result.allPassed).toBe(false);
      expect(result.passedCount).toBe(0);
      expect(result.totalCount).toBe(3);
    });

    it('should catch runtime errors gracefully without crashing', () => {
      const syntaxErrorCode = `
        function solve(input) {
          throw new Error('Fatal computation error');
        }
      `;

      const result = evaluateCodeSubmission(syntaxErrorCode, twoSumTestCases);
      expect(result.allPassed).toBe(false);
      expect(result.results[0].errorMessage).toContain('Fatal computation error');
    });

    it('should protect against infinite loops with timeout limit', () => {
      const infiniteLoopCode = `
        function solve(input) {
          while(true) {} // Infinite loop
          return 42;
        }
      `;

      const result = evaluateCodeSubmission(infiniteLoopCode, twoSumTestCases.slice(0, 1), {
        timeoutMs: 300,
      });

      expect(result.allPassed).toBe(false);
      expect(result.results[0].errorMessage).toContain('টাইম লিমিট অতিক্রান্ত হয়েছে');
    });

    it('should normalize JSON arrays and structural data', () => {
      const arrayTestCases = [
        { input: '3', expectedOutput: '[1, 2, 3]' },
      ];

      const code = `
        function solve(n) {
          const arr = [];
          for (let i = 1; i <= n; i++) arr.push(i);
          return arr;
        }
      `;

      const result = evaluateCodeSubmission(code, arrayTestCases);
      expect(result.allPassed).toBe(true);
    });

    it('should evaluate console.log outputs if function return is not used', () => {
      const stdoutTestCases = [
        { input: 'Hello', expectedOutput: 'Hello World' },
      ];

      const code = `
        console.log(input + ' World');
      `;

      const result = evaluateCodeSubmission(code, stdoutTestCases);
      expect(result.allPassed).toBe(true);
    });
  });

  describe('runSampleCodeAction', () => {
    it('should execute sample code and return outcome', async () => {
      const res = await runSampleCodeAction({
        code: 'function solve(x) { return x * 2; }',
        testCases: [{ input: '5', expectedOutput: '10' }],
      });

      expect(res.success).toBe(true);
      expect(res.outcome?.allPassed).toBe(true);
      expect(res.outcome?.passedCount).toBe(1);
    });
  });

  describe('submitExamAction with Multi-Format Auto-Grading', () => {
    const mockStudent = {
      id: 'student_cs_99',
      name: 'Tamim Iqbal',
      email: 'tamim@example.com',
      role: 'STUDENT',
    };

    const mockExam = {
      _id: 'exam_multi_123',
      title: 'CS Advanced Mock Exam',
      duration: 30,
      totalMarks: 5,
      passMarks: 3,
      questions: [
        {
          type: 'MCQ',
          question: 'What is 2 + 2?',
          options: ['3', '4', '5'],
          correctAnswer: 1,
          marks: 1,
        },
        {
          type: 'TRUE_FALSE',
          question: 'In BST, search is O(log n) in balanced state.',
          options: ['সত্য (True)', 'মিথ্যা (False)'],
          correctAnswer: 0,
          marks: 1,
        },
        {
          type: 'SHORT_ANSWER',
          question: 'FIFO data structure name?',
          acceptedAnswers: ['Queue', 'queue', 'কিউ'],
          marks: 1,
        },
        {
          type: 'CODE',
          question: 'Return square of n.',
          testCases: [
            { input: '4', expectedOutput: '16', isHidden: false },
            { input: '5', expectedOutput: '25', isHidden: true },
          ],
          marks: 2,
        },
      ],
    };

    it('should auto-grade all formats and calculate score accurately when all are correct', async () => {
      (auth as any).mockResolvedValue({ user: mockStudent });
      (Exam.findById as any).mockReturnValue({
        lean: vi.fn().mockResolvedValue(mockExam),
      });

      (ExamSubmission.create as any).mockResolvedValue({
        _id: 'sub_12345',
      });

      const studentAnswers = {
        0: { selectedOption: 1 }, // MCQ: 4 (correct)
        1: { selectedOption: 0 }, // TRUE_FALSE: True (correct)
        2: { textAnswer: 'queue' }, // SHORT_ANSWER: queue (correct)
        3: { codeAnswer: 'function solve(n) { return n * n; }' }, // CODE: square (passes all test cases)
      };

      const result = await submitExamAction({
        examId: 'exam_multi_123',
        answers: studentAnswers,
        timeTakenSeconds: 600,
      });

      expect(result.success).toBe(true);
      expect(result.result?.score).toBe(5); // 1 + 1 + 1 + 2 = 5
      expect(result.result?.totalMarks).toBe(5);
      expect(result.result?.percentage).toBe(100);
      expect(result.result?.passed).toBe(true);

      // Check breakdown
      const breakdown = result.result?.breakdown;
      expect(breakdown).toBeDefined();
      expect(breakdown![0].isCorrect).toBe(true); // MCQ
      expect(breakdown![1].isCorrect).toBe(true); // TRUE_FALSE
      expect(breakdown![2].isCorrect).toBe(true); // SHORT_ANSWER
      expect(breakdown![3].isCorrect).toBe(true); // CODE
      expect(breakdown![3].codeExecutionResult?.allPassed).toBe(true);
      expect(breakdown![3].codeExecutionResult?.passedCount).toBe(2);
    });

    it('should correctly award 0 marks when code fails test cases', async () => {
      (auth as any).mockResolvedValue({ user: mockStudent });
      (Exam.findById as any).mockReturnValue({
        lean: vi.fn().mockResolvedValue(mockExam),
      });

      (ExamSubmission.create as any).mockResolvedValue({
        _id: 'sub_partial',
      });

      const studentAnswers = {
        0: { selectedOption: 1 }, // correct (+1)
        1: { selectedOption: 1 }, // wrong (0)
        2: { textAnswer: 'Stack' }, // wrong (0)
        3: { codeAnswer: 'function solve(n) { return n + 2; }' }, // wrong code (0)
      };

      const result = await submitExamAction({
        examId: 'exam_multi_123',
        answers: studentAnswers,
        timeTakenSeconds: 400,
      });

      expect(result.success).toBe(true);
      expect(result.result?.score).toBe(1); // Only Q0 correct
      expect(result.result?.passed).toBe(false); // 1 < passMarks (3)
      expect(result.result?.breakdown[3].isCorrect).toBe(false);
    });
  });
});
