'use server';

import { auth } from '@/auth';
import dbConnect from '@/lib/mongoose';
import Exam, { IExamQuestion } from '@/models/Exam';
import ExamSubmission from '@/models/ExamSubmission';
import Course from '@/models/Course';
import { revalidatePath } from 'next/cache';

export interface CreateExamInput {
  title: string;
  description?: string;
  courseId?: string;
  category?: string;
  duration: number; // in minutes
  totalMarks?: number;
  passMarks?: number;
  questions: {
    question: string;
    options: string[];
    correctAnswer: number;
    explanation?: string;
    marks?: number;
  }[];
}

/**
 * Creates a new exam with LaTeX-enabled questions and options.
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
      if (!q.options || q.options.length < 2) {
        return { error: `প্রশ্ন #${i + 1} এ কমপক্ষে ২টি অপশন থাকতে হবে।` };
      }
      if (q.correctAnswer < 0 || q.correctAnswer >= q.options.length) {
        return { error: `প্রশ্ন #${i + 1} এ সঠিক উত্তরটি নির্বাচন করুন।` };
      }
    }

    await dbConnect();

    const computedTotalMarks = data.questions.reduce((sum, q) => sum + (q.marks || 1), 0);
    const passMarks = data.passMarks || Math.ceil(computedTotalMarks * 0.4);

    const newExam = await Exam.create({
      title: data.title.trim(),
      description: data.description?.trim() || '',
      courseId: data.courseId && data.courseId !== 'none' ? data.courseId : undefined,
      category: data.category || 'General',
      duration: Number(data.duration) || 15,
      totalMarks: computedTotalMarks,
      passMarks,
      status: 'PUBLISHED',
      questions: data.questions.map((q) => ({
        question: q.question.trim(),
        options: q.options.map((opt) => opt.trim()),
        correctAnswer: Number(q.correctAnswer),
        explanation: q.explanation?.trim() || '',
        marks: Number(q.marks) || 1,
      })),
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

    const formattedQuestions = exam.questions.map((q: any, idx: number) => ({
      id: q._id ? q._id.toString() : String(idx),
      index: idx,
      question: q.question,
      options: q.options,
      marks: q.marks,
      // Only include correct answer and explanation if not in student taking mode
      ...(forTaking
        ? {}
        : {
            correctAnswer: q.correctAnswer,
            explanation: q.explanation,
          }),
    }));

    return {
      success: true,
      exam: {
        id: exam._id.toString(),
        title: exam.title,
        description: exam.description,
        category: exam.category,
        courseTitle: exam.courseId?.title || null,
        duration: exam.duration,
        totalMarks: exam.totalMarks,
        passMarks: exam.passMarks,
        questions: formattedQuestions,
      },
    };
  } catch (error: any) {
    console.error('Error fetching exam details:', error);
    return { error: 'পরীক্ষার বিবরণ পেতে সমস্যা হয়েছে।' };
  }
}

/**
 * Submits student answers, calculates score on server, and saves submission record.
 */
export async function submitExamAction({
  examId,
  answers,
  timeTakenSeconds,
}: {
  examId: string;
  answers: Record<number, number>; // { [questionIndex]: selectedOptionIndex }
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

    let calculatedScore = 0;
    const questionsBreakdown: any[] = [];
    const submissionAnswers: any[] = [];

    exam.questions.forEach((q: IExamQuestion, idx: number) => {
      const selected = answers[idx] !== undefined ? answers[idx] : -1;
      const isCorrect = selected === q.correctAnswer;
      const questionMarks = q.marks || 1;

      if (isCorrect) {
        calculatedScore += questionMarks;
      }

      submissionAnswers.push({
        questionIndex: idx,
        selectedOption: selected,
        isCorrect,
      });

      questionsBreakdown.push({
        index: idx,
        question: q.question,
        options: q.options,
        selectedOption: selected,
        correctAnswer: q.correctAnswer,
        isCorrect,
        explanation: q.explanation || '',
        marks: questionMarks,
      });
    });

    const totalMarks = exam.totalMarks || exam.questions.length;
    const percentage = Math.round((calculatedScore / totalMarks) * 100);
    const passed = calculatedScore >= (exam.passMarks || Math.ceil(totalMarks * 0.4));

    const submission = await ExamSubmission.create({
      examId: exam._id,
      studentId: user.id,
      answers: submissionAnswers,
      score: calculatedScore,
      totalMarks,
      percentage,
      passed,
      timeTakenSeconds,
      submittedAt: new Date(),
    });

    revalidatePath('/student');

    return {
      success: true,
      result: {
        submissionId: submission._id.toString(),
        score: calculatedScore,
        totalMarks,
        percentage,
        passed,
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
 * Seeds rich sample exams featuring LaTeX math formulas for quick demonstration.
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
        title: 'উচ্চতর গণিত ও ক্যালকুলাস মডেল টেস্ট (Higher Math & Calculus)',
        description: 'বিভিন্ন সমাকলন, ব্যবকলন ও জটিল সংখ্যার গাণিতিক সমস্যার উপর বিশেষ কুইজ। প্রশ্ন এবং অপশনে আধুনিক LaTeX ফরম্যাটের ব্যবহার করা হয়েছে।',
        category: 'Mathematics',
        duration: 20,
        totalMarks: 5,
        passMarks: 3,
        status: 'PUBLISHED',
        questions: [
          {
            question: 'যদি $f(x) = x^3 - 3x^2 + 2x$ হয়, তবে প্রথম অন্তরকলজ $f\'(x)$ এর মান নিচের কোনটি?',
            options: [
              '$3x^2 - 6x + 2$',
              '$3x^2 - 3x + 2$',
              '$x^2 - 6x + 2$',
              '$\\frac{x^4}{4} - x^3 + x^2$'
            ],
            correctAnswer: 0,
            explanation: 'ডিফারেন্সিয়েশনের সূত্র অনুযায়ী: $\\frac{d}{dx}(x^n) = n x^{n-1}$। অতএব, $\\frac{d}{dx}(x^3 - 3x^2 + 2x) = 3x^2 - 6x + 2$।',
            marks: 1
          },
          {
            question: 'নির্দিষ্ট সমাকলন (Definite Integral) এর মান নির্ণয় করুন:\n$$\\int_{0}^{\\frac{\\pi}{2}} \\cos(x) \\, dx$$',
            options: [
              '$0$',
              '$1$',
              '$-1$',
              '$\\frac{\\pi}{2}$'
            ],
            correctAnswer: 1,
            explanation: 'আমরা জানি $\\int \\cos(x) dx = \\sin(x)$। সুতরাং সীমা বসিয়ে পাই: $[\\sin(x)]_0^{\\pi/2} = \\sin(\\frac{\\pi}{2}) - \\sin(0) = 1 - 0 = 1$।',
            marks: 1
          },
          {
            question: 'দ্বিঘাত সমীকরণ $ax^2 + bx + c = 0$ এর মূলদ্বয় (roots) নির্ণয়ের সঠিক সূত্র কোনটি?',
            options: [
              '$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$',
              '$x = \\frac{b \\pm \\sqrt{b^2 - 4ac}}{2a}$',
              '$x = \\frac{-b \\pm \\sqrt{b^2 + 4ac}}{2a}$',
              '$x = \\frac{-b \\pm (b^2 - 4ac)}{2a}$'
            ],
            correctAnswer: 0,
            explanation: 'শ্রীধর আচার্যের বিখ্যাত দ্বিঘাত সূত্র অনুযায়ী: $x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$। যেখানে নিশ্চয়ক (Discriminant) $D = b^2 - 4ac$।',
            marks: 1
          },
          {
            question: 'আইলারের সূত্র (Euler\'s Formula) অনুসারে $e^{i\\theta}$ এর বিস্তার কোনটি?',
            options: [
              '$\\cos(\\theta) + i\\sin(\\theta)$',
              '$\\cos(\\theta) - i\\sin(\\theta)$',
              '$\\sin(\\theta) + i\\cos(\\theta)$',
              '$\\tan(\\theta) + i$'
            ],
            correctAnswer: 0,
            explanation: 'আইলারের সূত্র অনুযায়ী জটিল সূচকের সমীকরণ হল $e^{i\\theta} = \\cos(\\theta) + i\\sin(\\theta)$। বিশেষ ক্ষেত্রে যখন $\\theta = \\pi$, তখন পাই $e^{i\\pi} + 1 = 0$।',
            marks: 1
          },
          {
            question: 'নিচের কোন ম্যাট্রিক্সের নির্ণায়কের (Determinant) মান কত?\n$$A = \\begin{pmatrix} 2 & 3 \\\\ 1 & 4 \\end{pmatrix}$$',
            options: [
              '$5$',
              '$8$',
              '$11$',
              '$-5$'
            ],
            correctAnswer: 0,
            explanation: 'একটি $2 \\times 2$ ম্যাট্রিক্সের নির্ণায়ক: $\\det(A) = (2 \\times 4) - (3 \\times 1) = 8 - 3 = 5$।',
            marks: 1
          }
        ]
      },
      {
        title: 'কম্পিউটার সায়েন্স ও অ্যালগরিদম কমপ্লেক্সিটি টেস্ট (Algorithm & CS Math)',
        description: 'অ্যালগরিদমের টাইম কমপ্লেক্সিটি, বিগ-ও নোটেশন ($O$) এবং রিকারেন্স রিলেশন সংক্রান্ত গুরুত্বপূর্ণ কুইজ।',
        category: 'Computer Science',
        duration: 15,
        totalMarks: 3,
        passMarks: 2,
        status: 'PUBLISHED',
        questions: [
          {
            question: 'মাস্টার থিওরেম অনুসারে যদি $T(n) = 2T\\left(\\frac{n}{2}\\right) + O(n)$ হয়, তবে সামগ্রিক সময় জটিলতা (Time Complexity) কত?',
            options: [
              '$\\Theta(n \\log n)$',
              '$\\Theta(n^2)$',
              '$\\Theta(\\log n)$',
              '$\\Theta(n)$'
            ],
            correctAnswer: 0,
            explanation: 'মাস্টার উপপাদ্যের কেস ২ অনুযায়ী যখন $f(n) = \\Theta(n^{\\log_b a}) = \\Theta(n^{\\log_2 2}) = \\Theta(n)$, তখন জটিলতা $T(n) = \\Theta(n \\log n)$ (যেমন মার্জ সর্ট)।',
            marks: 1
          },
          {
            question: 'একটি দ্বিমুখী বাইনারি সার্চ ট্রিতে (BST) $n$ টি নোড থাকলে ভারসাম্যপূর্ণ অবস্থায় সর্বোচ্চ গভীরতা (Depth) কত?',
            options: [
              '$\\lfloor \\log_2 n \\rfloor$',
              '$n - 1$',
              '$n^2$',
              '$\\sqrt{n}$'
            ],
            correctAnswer: 0,
            explanation: 'ভারসাম্যপূর্ণ বাইনারি ট্রির ক্ষেত্রে গভীরতা হয় সূচকীয় লগারিদমিক, অর্থাৎ $O(\\log_2 n)$।',
            marks: 1
          },
          {
            question: 'গুণোত্তর ধারার সমষ্টির সূত্রানুসারে: $S = \\sum_{i=0}^{\\infty} \\left(\\frac{1}{2}\\right)^i$ এর মান কত?',
            options: [
              '$2$',
              '$1$',
              '$\\infty$',
              '$\\frac{3}{2}$'
            ],
            correctAnswer: 0,
            explanation: 'অসীম গুণোত্তর ধারার ক্ষেত্রে যখন $|r| < 1$, সমষ্টি $S = \\frac{a}{1 - r} = \\frac{1}{1 - 1/2} = 2$।',
            marks: 1
          }
        ]
      }
    ];

    await Exam.insertMany(sampleExams);
    revalidatePath('/exams');
    return { success: true, count: sampleExams.length };
  } catch (error: any) {
    console.error('Error seeding sample exams:', error);
    return { error: 'নমুনা পরীক্ষা তৈরিতে ব্যর্থ।' };
  }
}
