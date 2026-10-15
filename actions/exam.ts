'use server';

import { auth } from '@/auth';
import dbConnect from '@/lib/mongoose';
import Exam, { IExamQuestion } from '@/models/Exam';
import ExamSubmission from '@/models/ExamSubmission';
import Course from '@/models/Course';
import Enrollment from '@/models/Enrollment';
import User from '@/models/User';
import { revalidatePath } from 'next/cache';

import { evaluateCodeSubmission, evaluateShortAnswer, TestCase } from '@/lib/code-evaluator';

export interface CreateExamInput {
  title: string;
  description?: string;
  courseId?: string;
  category?: string;
  duration: number; // in minutes
  totalMarks?: number;
  passMarks?: number;
  hasNegativeMarking?: boolean;
  negativeMarkingValue?: number;
  maxAttempts?: number;
  questions: {
    type?: 'MCQ' | 'TRUE_FALSE' | 'SHORT_ANSWER' | 'CODE';
    question: string;
    options?: string[];
    correctAnswer?: number;
    acceptedAnswers?: string[];
    codeTemplate?: string;
    codeLanguage?: string;
    testCases?: { input: string; expectedOutput: string; isHidden?: boolean }[];
    explanation?: string;
    marks?: number;
  }[];
}

/**
 * Creates a new exam with LaTeX-enabled questions, options, short answers, coding problems,
 * configurable fractional negative marking, and retake attempt caps.
 */
export async function createExamAction(data: CreateExamInput) {
  try {
    const session = await auth();
    const user = session?.user as { id?: string; role?: string } | undefined;
    if (!user?.id) {
      return { error: 'পরীক্ষা তৈরি করতে অনুগ্রহ করে লগইন করুন।' };
    }

    if (!data.title?.trim()) {
      return { error: 'পরীক্ষার শিরোনাম আবশ্যক।' };
    }

    if (!data.questions || data.questions.length === 0) {
      return { error: 'কমপক্ষে ১টি প্রশ্ন যোগ করতে হবে।' };
    }

    for (let i = 0; i < data.questions.length; i++) {
      const q = data.questions[i];
      if (!q.question?.trim()) {
        return { error: `প্রশ্ন #${i + 1} এর বিষয়বস্তু খালি থাকতে পারে না।` };
      }
      const qType = q.type || 'MCQ';

      if (qType === 'MCQ') {
        if (!q.options || q.options.length < 2) {
          return { error: `প্রশ্ন #${i + 1} (MCQ) এ কমপক্ষে ২টি অপশন থাকতে হবে।` };
        }
        if (q.correctAnswer === undefined || q.correctAnswer < 0 || q.correctAnswer >= q.options.length) {
          return { error: `প্রশ্ন #${i + 1} এ সঠিক উত্তরটি নির্বাচন করুন।` };
        }
      } else if (qType === 'TRUE_FALSE') {
        if (!q.options || q.options.length < 2) {
          q.options = ['সত্য (True)', 'মিথ্যা (False)'];
        }
        if (q.correctAnswer === undefined || (q.correctAnswer !== 0 && q.correctAnswer !== 1)) {
          return { error: `প্রশ্ন #${i + 1} (সত্য/মিথ্যা) এ সঠিক উত্তর নির্বাচন করুন।` };
        }
      } else if (qType === 'SHORT_ANSWER') {
        if (!q.acceptedAnswers || q.acceptedAnswers.length === 0 || !q.acceptedAnswers.some((a) => a.trim())) {
          return { error: `প্রশ্ন #${i + 1} (সংক্ষিপ্ত উত্তর) এ কমপক্ষে ১টি সঠিক গ্রহণযোগ্য উত্তর প্রদান করুন।` };
        }
      } else if (qType === 'CODE') {
        if (!q.testCases || q.testCases.length === 0) {
          return { error: `প্রশ্ন #${i + 1} (কোডিং) এ কমপক্ষে ১টি টেস্ট-কেস (Input ও Expected Output) প্রদান করতে হবে।` };
        }
      }
    }

    await dbConnect();

    const computedTotalMarks = data.questions.reduce((sum, q) => sum + (q.marks || 1), 0);
    const passMarks = data.passMarks || Math.ceil(computedTotalMarks * 0.4);
    const hasNegativeMarking = !!data.hasNegativeMarking;
    const negativeMarkingValue = hasNegativeMarking
      ? Math.abs(Number(data.negativeMarkingValue !== undefined ? data.negativeMarkingValue : 0.25))
      : 0;
    const maxAttempts =
      data.maxAttempts !== undefined && Number(data.maxAttempts) > 0
        ? Number(data.maxAttempts)
        : 3;

    const newExam = await Exam.create({
      title: data.title.trim(),
      description: data.description?.trim() || '',
      courseId: data.courseId && data.courseId !== 'none' ? data.courseId : undefined,
      category: data.category || 'General',
      duration: Number(data.duration) || 15,
      totalMarks: computedTotalMarks,
      passMarks,
      hasNegativeMarking,
      negativeMarkingValue,
      maxAttempts,
      status: 'PUBLISHED',
      questions: data.questions.map((q) => {
        const qType = q.type || 'MCQ';
        return {
          type: qType,
          question: q.question.trim(),
          options: qType === 'TRUE_FALSE' ? (q.options?.length ? q.options : ['সত্য (True)', 'মিথ্যা (False)']) : (q.options || []).map((opt) => opt.trim()),
          correctAnswer: Number(q.correctAnswer || 0),
          acceptedAnswers: (q.acceptedAnswers || []).map((ans) => ans.trim()).filter(Boolean),
          codeTemplate: q.codeTemplate || '',
          codeLanguage: q.codeLanguage || 'javascript',
          testCases: (q.testCases || []).map((tc) => ({
            input: tc.input || '',
            expectedOutput: tc.expectedOutput || '',
            isHidden: !!tc.isHidden,
          })),
          explanation: q.explanation?.trim() || '',
          marks: Number(q.marks) || 1,
        };
      }),
      createdById: user.id,
    });

    revalidatePath('/exams');
    revalidatePath('/instructor');
    return { success: true, examId: newExam._id.toString() };
  } catch (error: any) {
    console.error('Error creating exam:', error);
    return { error: error.message || 'পরীক্ষা তৈরিতে সমস্যা হয়েছে।' };
  }
}

/**
 * Retrieves list of available exams.
 */
export async function getExamsAction(options?: { courseId?: string; category?: string }) {
  try {
    await dbConnect();

    const query: any = { status: 'PUBLISHED' };
    if (options?.courseId) query.courseId = options.courseId;
    if (options?.category && options.category !== 'All') query.category = options.category;

    const exams = await Exam.find(query)
      .populate('courseId', 'title category')
      .sort({ createdAt: -1 })
      .lean();

    return {
      success: true,
      exams: exams.map((exam: any) => ({
        id: exam._id.toString(),
        title: exam.title,
        description: exam.description,
        courseTitle: exam.courseId?.title || null,
        courseId: exam.courseId?._id?.toString() || null,
        category: exam.category,
        duration: exam.duration,
        totalMarks: exam.totalMarks,
        passMarks: exam.passMarks,
        hasNegativeMarking: !!exam.hasNegativeMarking,
        negativeMarkingValue: exam.negativeMarkingValue ?? 0.25,
        maxAttempts: exam.maxAttempts ?? 3,
        questionCount: exam.questions?.length || 0,
        createdAt: exam.createdAt?.toISOString(),
      })),
    };
  } catch (error: any) {
    console.error('Error fetching exams:', error);
    return { error: 'পরীক্ষাগুলোর তথ্য লোড করা যায়নি।' };
  }
}

/**
 * Retrieves a single exam by ID.
 * Optionally hides correct answers if student is taking the exam.
 * Tracks student's past attempts to enforce maxAttempts policy.
 */
export async function getExamByIdAction(examId: string, forTaking: boolean = false) {
  try {
    await dbConnect();

    const exam = await Exam.findById(examId)
      .populate('courseId', 'title category')
      .lean() as any;

    if (!exam) {
      return { error: 'পরীক্ষাটি পাওয়া যায়নি।' };
    }

    const formattedQuestions = exam.questions.map((q: any, idx: number) => {
      const qType = q.type || 'MCQ';
      return {
        id: q._id ? q._id.toString() : String(idx),
        index: idx,
        type: qType,
        question: q.question,
        options: q.options || [],
        marks: q.marks || 1,
        codeTemplate: q.codeTemplate || '',
        codeLanguage: q.codeLanguage || 'javascript',
        // In student taking mode: provide public test cases for sample testing
        testCases: forTaking
          ? (q.testCases || [])
              .filter((tc: any) => !tc.isHidden)
              .map((tc: any) => ({
                input: tc.input,
                expectedOutput: tc.expectedOutput,
                isHidden: false,
              }))
          : q.testCases || [],
        ...(forTaking
          ? {}
          : {
              correctAnswer: q.correctAnswer,
              acceptedAnswers: q.acceptedAnswers || [],
              explanation: q.explanation,
            }),
      };
    });

    let isEnrolledInCourse = true;
    let requiresEnrollment = false;
    let courseIdStr: string | null = null;

    const session = await auth();
    const user = session?.user as { id?: string; role?: string } | undefined;
    let checkUserId = user?.id;
    if (checkUserId && typeof checkUserId === 'string' && checkUserId.includes('@')) {
      const u = await User.findOne({ email: checkUserId }).select('_id').lean() as any;
      if (u) checkUserId = u._id.toString();
    }

    if (exam.courseId) {
      requiresEnrollment = true;
      courseIdStr = exam.courseId._id ? exam.courseId._id.toString() : exam.courseId.toString();
      const isStaff = user?.role === 'ADMIN' || user?.role === 'SUPERADMIN';

      if (!isStaff) {
        if (!checkUserId) {
          isEnrolledInCourse = false;
        } else {
          const enr = await Enrollment.findOne({
            userId: checkUserId,
            courseId: courseIdStr,
            paymentStatus: { $in: ['success', 'GRANTED', 'granted'] },
          }).lean();
          isEnrolledInCourse = !!enr;
        }
      }
    }

    // Retake Policy & Attempt Tracking with Mandatory 24-hour Cooldown
    const maxAttempts =
      exam.maxAttempts !== undefined && Number(exam.maxAttempts) > 0
        ? Number(exam.maxAttempts)
        : 3;
    let attemptsCount = 0;
    let isCooldownActive = false;
    let cooldownEndsAt: string | undefined = undefined;
    let cooldownRemainingHours = 0;
    let cooldownRemainingMinutes = 0;
    let lastSubmissionScore: number | undefined = undefined;
    let lastSubmissionTotalMarks: number | undefined = undefined;
    let lastSubmissionPercentage: number | undefined = undefined;

    if (checkUserId && typeof ExamSubmission?.countDocuments === 'function') {
      attemptsCount = await ExamSubmission.countDocuments({
        examId: exam._id,
        studentId: checkUserId,
      });

      if (attemptsCount > 0 && typeof ExamSubmission?.findOne === 'function') {
        const lastSub = await ExamSubmission.findOne({
          examId: exam._id,
          studentId: checkUserId,
        })
          .sort({ submittedAt: -1 })
          .lean() as any;

        if (lastSub?.submittedAt) {
          lastSubmissionScore = lastSub.score;
          lastSubmissionTotalMarks = lastSub.totalMarks;
          lastSubmissionPercentage = lastSub.percentage;

          const cooldownMs = 24 * 60 * 60 * 1000; // Mandatory 24 hours
          const timeSince = Date.now() - new Date(lastSub.submittedAt).getTime();
          if (timeSince < cooldownMs) {
            isCooldownActive = true;
            const diffMs = cooldownMs - timeSince;
            cooldownRemainingHours = Math.floor(diffMs / (1000 * 60 * 60));
            cooldownRemainingMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
            cooldownEndsAt = new Date(new Date(lastSub.submittedAt).getTime() + cooldownMs).toISOString();
          }
        }
      }
    }

    const remainingAttempts = Math.max(0, maxAttempts - attemptsCount);
    const canAttempt = attemptsCount < maxAttempts && !isCooldownActive;

    return {
      success: true,
      exam: {
        id: exam._id.toString(),
        title: exam.title,
        description: exam.description,
        category: exam.category,
        courseTitle: exam.courseId?.title || null,
        courseId: courseIdStr,
        requiresEnrollment,
        isEnrolledInCourse,
        duration: exam.duration,
        totalMarks: exam.totalMarks,
        passMarks: exam.passMarks,
        hasNegativeMarking: !!exam.hasNegativeMarking,
        negativeMarkingValue: exam.negativeMarkingValue ?? 0.25,
        maxAttempts,
        attemptsCount,
        remainingAttempts,
        canAttempt,
        isCooldownActive,
        cooldownEndsAt,
        cooldownRemainingHours,
        cooldownRemainingMinutes,
        lastSubmissionScore,
        lastSubmissionTotalMarks,
        lastSubmissionPercentage,
        questions: formattedQuestions,
      },
    };
  } catch (error: any) {
    console.error('Error fetching exam details:', error);
    return { error: 'পরীক্ষার বিবরণ পেতে সমস্যা হয়েছে।' };
  }
}

export type StudentAnswerPayload =
  | {
      selectedOption?: number;
      textAnswer?: string;
      codeAnswer?: string;
    }
  | number
  | string;

/**
 * Submits student answers, auto-grades all question formats (MCQ, True/False, Short-Answer, Code),
 * calculates score on server, and saves submission record.
 */
export async function submitExamAction({
  examId,
  answers,
  timeTakenSeconds,
}: {
  examId: string;
  answers: Record<number, StudentAnswerPayload>;
  timeTakenSeconds: number;
}) {
  try {
    const session = await auth();
    const user = session?.user as { id?: string; email?: string } | undefined;
    if (!user?.id) {
      return { error: 'উত্তর জমা দিতে লগইন আবশ্যক।' };
    }

    await dbConnect();

    const exam = await Exam.findById(examId).lean() as any;
    if (!exam) {
      return { error: 'পরীক্ষাটি পাওয়া যায়নি।' };
    }

    let checkUserId = user.id;
    if (typeof checkUserId === 'string' && checkUserId.includes('@')) {
      const u = await User.findOne({ email: checkUserId }).select('_id').lean() as any;
      if (u) checkUserId = u._id.toString();
    }

    if (exam.courseId) {
      const role = (session?.user as any)?.role;
      const isStaff = role === 'ADMIN' || role === 'SUPERADMIN';
      if (!isStaff) {
        const courseIdStr = exam.courseId.toString();
        const enr = await Enrollment.findOne({
          userId: checkUserId,
          courseId: courseIdStr,
          paymentStatus: { $in: ['success', 'GRANTED', 'granted'] },
        }).lean();

        if (!enr) {
          return { error: 'এই পরীক্ষায় অংশ নিতে অনুগ্রহ করে সংশ্লিষ্ট কোর্সে প্রথমে এনরোল করুন (Enrollment Required)।' };
        }
      }
    }

    // Exam Retake Policy Enforcement (Maximum Attempts Cap)
    const maxAttempts =
      exam.maxAttempts !== undefined && Number(exam.maxAttempts) > 0
        ? Number(exam.maxAttempts)
        : 3;

    const existingAttempts =
      typeof ExamSubmission?.countDocuments === 'function'
        ? await ExamSubmission.countDocuments({
            examId: exam._id,
            studentId: checkUserId,
          })
        : 0;

    if (existingAttempts >= maxAttempts) {
      return {
        error: `আপনি এই পরীক্ষার জন্য নির্ধারিত সর্বোচ্চ ${maxAttempts} বার প্রচেষ্টার সীমা সম্পন্ন করেছেন। আর নতুন করে উত্তর জমা দেওয়া সম্ভব নয়।`,
      };
    }

    // Mandatory 24-Hour Cooldown Between Exam Attempts
    if (existingAttempts > 0 && typeof ExamSubmission?.findOne === 'function') {
      const lastSub = await ExamSubmission.findOne({
        examId: exam._id,
        studentId: checkUserId,
      })
        .sort({ submittedAt: -1 })
        .lean() as any;

      if (lastSub?.submittedAt) {
        const cooldownMs = 24 * 60 * 60 * 1000;
        const timeSince = Date.now() - new Date(lastSub.submittedAt).getTime();
        if (timeSince < cooldownMs) {
          const diffMs = cooldownMs - timeSince;
          const hoursLeft = Math.floor(diffMs / (1000 * 60 * 60));
          const minsLeft = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
          return {
            error: `পরীক্ষার প্রচেষ্টার মধ্যে বাধ্যতামূলক ২৪ ঘণ্টার বিরতি (24-Hour Cooldown) সক্রিয় রয়েছে। অনুগ্রহ করে পূর্ববর্তী পরীক্ষার ভুলগুলো পর্যালোচনা করুন। পরবর্তী সুযোগ: আর ${hoursLeft} ঘণ্টা ${minsLeft} মিনিট পর।`,
          };
        }
      }
    }

    const currentAttemptNumber = existingAttempts + 1;

    const hasNeg = !!exam.hasNegativeMarking;
    const negRate = hasNeg ? Number(exam.negativeMarkingValue !== undefined ? exam.negativeMarkingValue : 0.25) : 0;

    let rawEarnedScore = 0;
    let totalNegativeDeducted = 0;
    let totalCorrect = 0;
    let totalWrong = 0;
    let totalSkipped = 0;

    const questionsBreakdown: any[] = [];
    const submissionAnswers: any[] = [];

    exam.questions.forEach((q: IExamQuestion, idx: number) => {
      const rawAns = answers[idx];
      const qType = q.type || 'MCQ';
      let isCorrect = false;
      let selected = -1;
      let textAnswer = '';
      let codeAnswer = '';
      let codeExecutionResult: any = undefined;

      if (typeof rawAns === 'number') {
        selected = rawAns;
      } else if (typeof rawAns === 'string') {
        textAnswer = rawAns;
        codeAnswer = rawAns;
      } else if (rawAns && typeof rawAns === 'object') {
        selected = rawAns.selectedOption !== undefined ? rawAns.selectedOption : -1;
        textAnswer = rawAns.textAnswer || '';
        codeAnswer = rawAns.codeAnswer || '';
      }

      if (qType === 'MCQ' || qType === 'TRUE_FALSE') {
        isCorrect = selected === q.correctAnswer;
      } else if (qType === 'SHORT_ANSWER') {
        isCorrect = evaluateShortAnswer(textAnswer, q.acceptedAnswers || []);
      } else if (qType === 'CODE') {
        const testCases = q.testCases || [];
        const evalResult = evaluateCodeSubmission(codeAnswer, testCases);
        codeExecutionResult = {
          passedCount: evalResult.passedCount,
          totalCount: evalResult.totalCount,
          allPassed: evalResult.allPassed,
          details: evalResult.error || `${evalResult.passedCount}/${evalResult.totalCount} টেস্ট কেস পাস করেছে`,
        };
        isCorrect = evalResult.allPassed && testCases.length > 0;
      }

      // Determine if the question was attempted by student
      let isAttempted = false;
      if (qType === 'MCQ' || qType === 'TRUE_FALSE') {
        isAttempted = selected !== -1 && selected !== undefined;
      } else if (qType === 'SHORT_ANSWER') {
        isAttempted = textAnswer.trim().length > 0;
      } else if (qType === 'CODE') {
        isAttempted = codeAnswer.trim().length > 0 && codeAnswer.trim() !== (q.codeTemplate || '').trim();
      }

      let negativeMarks = 0;
      const questionMarks = q.marks || 1;

      if (isCorrect) {
        rawEarnedScore += questionMarks;
        totalCorrect++;
      } else if (isAttempted) {
        totalWrong++;
        if (hasNeg && negRate > 0) {
          negativeMarks = Math.round(negRate * 100) / 100;
          totalNegativeDeducted += negativeMarks;
        }
      } else {
        totalSkipped++;
      }

      submissionAnswers.push({
        questionIndex: idx,
        type: qType,
        selectedOption: selected,
        textAnswer,
        codeAnswer,
        codeExecutionResult,
        isAttempted,
        negativeMarks,
        isCorrect,
      });

      questionsBreakdown.push({
        index: idx,
        type: qType,
        question: q.question,
        options: q.options || [],
        selectedOption: selected,
        textAnswer,
        codeAnswer,
        codeExecutionResult,
        correctAnswer: q.correctAnswer,
        acceptedAnswers: q.acceptedAnswers || [],
        testCases: q.testCases || [],
        isAttempted,
        negativeMarks,
        isCorrect,
        explanation: q.explanation || '',
        marks: questionMarks,
      });
    });

    totalNegativeDeducted = Math.round(totalNegativeDeducted * 100) / 100;
    const finalScore = Math.max(0, Math.round((rawEarnedScore - totalNegativeDeducted) * 100) / 100);
    const totalMarks = exam.totalMarks || exam.questions.length;
    const percentage = Math.max(0, Math.round((finalScore / totalMarks) * 100));
    const passed = finalScore >= (exam.passMarks || Math.ceil(totalMarks * 0.4));

    const submission = await ExamSubmission.create({
      examId: exam._id,
      studentId: checkUserId,
      attemptNumber: currentAttemptNumber,
      answers: submissionAnswers,
      score: finalScore,
      totalMarks,
      percentage,
      passed,
      hasNegativeMarking: hasNeg,
      negativeMarkingRate: negRate,
      negativeMarksDeducted: totalNegativeDeducted,
      rawEarnedScore,
      totalCorrect,
      totalWrong,
      totalSkipped,
      timeTakenSeconds,
      submittedAt: new Date(),
    });

    revalidatePath('/student');

    return {
      success: true,
      result: {
        submissionId: submission._id.toString(),
        score: finalScore,
        rawEarnedScore,
        totalMarks,
        percentage,
        passed,
        hasNegativeMarking: hasNeg,
        negativeMarkingRate: negRate,
        negativeMarksDeducted: totalNegativeDeducted,
        totalCorrect,
        totalWrong,
        totalSkipped,
        attemptNumber: currentAttemptNumber,
        maxAttempts,
        attemptsRemaining: Math.max(0, maxAttempts - currentAttemptNumber),
        canRetake: currentAttemptNumber < maxAttempts,
        timeTakenSeconds,
        breakdown: questionsBreakdown,
      },
    };
  } catch (error: any) {
    console.error('Error submitting exam:', error);
    return { error: 'উত্তর জমা দেওয়ার সময় ত্রুটি হয়েছে।' };
  }
}

/**
 * Retrieves student's past submissions for an exam or all exams.
 */
export async function getStudentSubmissionsAction(examId?: string) {
  try {
    const session = await auth();
    const user = session?.user as { id?: string } | undefined;
    if (!user?.id) return { error: 'লগইন আবশ্যক।' };

    await dbConnect();

    const query: any = { studentId: user.id };
    if (examId) query.examId = examId;

    const submissions = await ExamSubmission.find(query)
      .populate('examId', 'title category duration totalMarks passMarks')
      .sort({ createdAt: -1 })
      .lean();

    return {
      success: true,
      submissions: submissions.map((sub: any) => ({
        id: sub._id.toString(),
        examId: sub.examId?._id?.toString(),
        examTitle: sub.examId?.title || 'Unknown Exam',
        category: sub.examId?.category || 'General',
        score: sub.score,
        totalMarks: sub.totalMarks,
        percentage: sub.percentage,
        passed: sub.passed,
        timeTakenSeconds: sub.timeTakenSeconds,
        submittedAt: sub.submittedAt?.toISOString(),
      })),
    };
  } catch (error: any) {
    console.error('Error fetching submissions:', error);
    return { error: 'ফলাফল লোড করতে সমস্যা হয়েছে।' };
  }
}

/**
 * Interactive test runner for students while solving a coding question.
 * Runs code against sample test cases and returns immediate pass/fail feedback.
 */
export async function runSampleCodeAction({
  code,
  testCases,
  language = 'javascript',
}: {
  code: string;
  testCases: { input: string; expectedOutput: string }[];
  language?: string;
}) {
  try {
    const outcome = evaluateCodeSubmission(code, testCases, { language, timeoutMs: 3000 });
    return {
      success: true,
      outcome,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'কোড রান করতে ব্যর্থ হয়েছে।',
    };
  }
}

/**
 * Seeds rich sample exams featuring LaTeX math, True/False, Short-Answer, and automated Code grading.
 */
export async function seedSampleExamsAction() {
  try {
    await dbConnect();

    const existingCount = await Exam.countDocuments();
    if (existingCount > 0) {
      return { success: true, message: 'Exams already exist.' };
    }

    const sampleExams = [
      {
        title: 'সিএস ও সফটওয়্যার ইঞ্জিনিয়ারিং মাল্টি-ফরম্যাট মক টেস্ট (CS Multi-Format Exam)',
        description: 'MCQ, সত্য/মিথ্যা (True/False), সংক্ষিপ্ত উত্তর (Short-Answer) এবং সরাসরি কোডিং প্রবলেম (Automated Code Evaluation) সমন্বিত পূর্ণাঙ্গ মডেল টেস্ট।',
        category: 'Computer Science',
        duration: 30,
        totalMarks: 7,
        passMarks: 4,
        status: 'PUBLISHED',
        questions: [
          {
            type: 'MCQ',
            question: 'মাস্টার থিওরেম অনুসারে যদি $T(n) = 2T\\left(\\frac{n}{2}\\right) + O(n)$ হয়, তবে সামগ্রিক সময় জটিলতা (Time Complexity) কত?',
            options: [
              '$\\Theta(n \\log n)$',
              '$\\Theta(n^2)$',
              '$\\Theta(\\log n)$',
              '$\\Theta(n)$',
            ],
            correctAnswer: 0,
            explanation: 'মাস্টার উপপাদ্যের কেস ২ অনুযায়ী $T(n) = \\Theta(n \\log n)$ (যেমন মার্জ সর্ট)।',
            marks: 1,
          },
          {
            type: 'TRUE_FALSE',
            question: 'রেড-ব্ল্যাক ট্রি (Red-Black Tree)-তে রুট থেকে কোনো পাতার দূরতম পাথের দৈর্ঘ্য নিকটতম পাথের দৈর্ঘ্যের দ্বিগুণের বেশি হতে পারে না।',
            options: ['সত্য (True)', 'মিথ্যা (False)'],
            correctAnswer: 0,
            explanation: 'সত্য। কারণ কোনো পাথে দুটি লাল নোড পরপর থাকতে পারে না এবং সব পাথে সমান সংখ্যক কালো নোড থাকে। তাই সর্বোচ্চ অনুপাত ২:১।',
            marks: 1,
          },
          {
            type: 'SHORT_ANSWER',
            question: 'গ্রাফ থিওরিতে সবচেয়ে কম খরচে সমস্ত শীর্ষবিন্দু সংযুক্ত করার অ্যালগরিদমকে কী বলা হয়? (ইংরেজি বা বাংলা সংক্ষেপে লিখুন)',
            options: [],
            correctAnswer: 0,
            acceptedAnswers: [
              'Minimum Spanning Tree',
              'MST',
              'স্প্যানিং ট্রি',
              'মিনিমাম স্প্যানিং ট্রি',
              'Kruskal',
              'Prim',
            ],
            explanation: 'সব শীর্ষবিন্দু সর্বনিম্ন খরচে সংযুক্তকারী গ্রাফ সাব-ট্রিকে Minimum Spanning Tree (MST) বলা হয়, যা Kruskal বা Prim অ্যালগরিদম দ্বারা বের করা যায়।',
            marks: 1,
          },
          {
            type: 'CODE',
            question: 'দুটি সংখ্যার যোগফল নির্ণয় করতে নিচের `solve(input)` ফাংশনটি সম্পূর্ণ করুন। input হিসেবে `[a, b]` আসবে এবং আপনাকে `a + b` রিটার্ন করতে হবে।',
            options: [],
            codeLanguage: 'javascript',
            codeTemplate: `function solve(input) {\n  // input[0] এবং input[1] এর যোগফল রিটার্ন করুন\n  const a = input[0];\n  const b = input[1];\n  return a + b;\n}`,
            testCases: [
              { input: '[5, 10]', expectedOutput: '15', isHidden: false },
              { input: '[-3, 7]', expectedOutput: '4', isHidden: false },
              { input: '[100, 250]', expectedOutput: '350', isHidden: true },
              { input: '[0, 0]', expectedOutput: '0', isHidden: true },
            ],
            explanation: 'সহজেই `return input[0] + input[1];` লিখলে সমস্ত টেস্ট কেস পাস করবে।',
            marks: 2,
          },
          {
            type: 'CODE',
            question: 'প্রদত্ত সংখ্যা $n$-এর ফ্যাক্টোরিয়াল ($n!$) নির্ণয় করুন। input হিসেবে ধনাত্মক পূর্ণসংখ্যা $n$ আসবে।',
            options: [],
            codeLanguage: 'javascript',
            codeTemplate: `function solve(n) {\n  // n! এর মান রিটার্ন করুন\n  let res = 1;\n  for (let i = 2; i <= n; i++) {\n    res *= i;\n  }\n  return res;\n}`,
            testCases: [
              { input: '5', expectedOutput: '120', isHidden: false },
              { input: '3', expectedOutput: '6', isHidden: false },
              { input: '1', expectedOutput: '1', isHidden: true },
              { input: '0', expectedOutput: '1', isHidden: true },
            ],
            explanation: '0! = 1, 1! = 1 এবং n! = n * (n - 1)!। লুপ বা রিকার্শন ব্যবহার করে সমাধান সম্ভব।',
            marks: 2,
          },
        ],
      },
      {
        title: 'উচ্চতর গণিত ও ক্যালকুলাস মডেল টেস্ট (Higher Math & Calculus)',
        description: 'বিভিন্ন সমাকলন, ব্যবকলন ও জটিল সংখ্যার গাণিতিক সমস্যার উপর বিশেষ কুইজ। প্রশ্ন এবং অপশনে আধুনিক LaTeX ফরম্যাটের ব্যবহার করা হয়েছে।',
        category: 'Mathematics',
        duration: 20,
        totalMarks: 3,
        passMarks: 2,
        status: 'PUBLISHED',
        questions: [
          {
            type: 'MCQ',
            question: 'যদি $f(x) = x^3 - 3x^2 + 2x$ হয়, তবে প্রথম অন্তরকলজ $f\'(x)$ এর মান নিচের কোনটি?',
            options: [
              '$3x^2 - 6x + 2$',
              '$3x^2 - 3x + 2$',
              '$x^2 - 6x + 2$',
              '$\\frac{x^4}{4} - x^3 + x^2$',
            ],
            correctAnswer: 0,
            explanation: 'ডিফারেন্সিয়েশনের সূত্র অনুযায়ী: $\\frac{d}{dx}(x^n) = n x^{n-1}$। অতএব, $\\frac{d}{dx}(x^3 - 3x^2 + 2x) = 3x^2 - 6x + 2$।',
            marks: 1,
          },
          {
            type: 'TRUE_FALSE',
            question: 'নির্দিষ্ট সমাকলন (Definite Integral) $\\int_{0}^{\\frac{\\pi}{2}} \\cos(x) \\, dx$-এর মান $1$।',
            options: ['সত্য (True)', 'মিথ্যা (False)'],
            correctAnswer: 0,
            explanation: '$\\int \\cos(x) dx = \\sin(x)$। সুতরাং সীমা বসিয়ে পাই: $[\\sin(x)]_0^{\\pi/2} = 1 - 0 = 1$।',
            marks: 1,
          },
          {
            type: 'SHORT_ANSWER',
            question: 'দ্বিঘাত সমীকরণ $ax^2 + bx + c = 0$-এর নিশ্চয়ক (Discriminant)-এর বীজগণিতীয় রূপটি লিখুন:',
            options: [],
            correctAnswer: 0,
            acceptedAnswers: ['b^2 - 4ac', 'b^2-4ac', 'b*b - 4*a*c', 'b2 - 4ac'],
            explanation: 'দ্বিঘাত সমীকরণের নিশ্চয়ক বা Discriminant হলো $D = b^2 - 4ac$।',
            marks: 1,
          },
        ],
      },
    ];

    await Exam.insertMany(sampleExams);
    revalidatePath('/exams');
    return { success: true, count: sampleExams.length };
  } catch (error: any) {
    console.error('Error seeding sample exams:', error);
    return { error: 'নমুনা পরীক্ষা তৈরিতে ব্যর্থ।' };
  }
}

