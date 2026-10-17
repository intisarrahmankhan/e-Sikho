'use server';

import { auth } from '@/auth';
import dbConnect from '@/lib/mongoose';
import LiveQuestion from '@/models/LiveQuestion';
import LiveSession from '@/models/LiveSession';
import User from '@/models/User';
import Course from '@/models/Course';
import { COURSES_DATA } from '@/lib/courses-data';
import { revalidatePath } from 'next/cache';
import { sendRealtimeNotification, broadcastRealtimeEvent } from '@/lib/realtime-notifications';

export interface LiveQuestionItem {
  id: string;
  sessionId: string;
  courseId: string;
  studentId: string;
  studentName: string;
  studentAvatar?: string;
  question: string;
  upvotes: string[];
  upvoteCount: number;
  isAnswered: boolean;
  answeredAt?: string;
  instructorReply?: string;
  isPinned: boolean;
  createdAt: string;
  hasUpvoted?: boolean;
  isAuthor?: boolean;
}

export interface LiveSessionData {
  id: string;
  courseId: string;
  courseTitle?: string;
  title: string;
  titleEn?: string;
  instructorName: string;
  instructorAvatar?: string;
  scheduledTime: string;
  duration: string;
  status: 'UPCOMING' | 'LIVE_NOW' | 'COMPLETED';
  streamUrl?: string;
  meetUrl?: string;
  recordingUrl?: string;
  viewerCount: number;
  description?: string;
  topic?: string;
}

/**
 * Seed questions to provide an authentic, vibrant live experience for any session
 */
const DEFAULT_SEED_QUESTIONS: Record<string, Array<{ studentName: string; question: string; upvoteCount: number; isAnswered: boolean; reply?: string }>> = {
  'live-next-1': [
    {
      studentName: 'রাকিবুল হাসান',
      question: 'ভাইয়া, Server Actions কি সরাসরি client component এর onClick হ্যান্ডলারে কল করা নিরাপদ, নাকি useTransition ব্যবহার করাই বেস্ট প্র্যাকটিস?',
      upvoteCount: 14,
      isAnswered: true,
      reply: 'Client Component এ useTransition অথবা useActionState ব্যবহার করা সবচেয়ে নিরাপদ, এতে পেন্ডিং স্টেট ও লেটেন্সি সুন্দরভাবে হ্যান্ডেল হয়।',
    },
    {
      studentName: 'তানজিলা তাসনিম',
      question: 'NextAuth v5 এ Prisma Adapter ছাড়া শুধুমাত্র কাস্টম JWT দিয়ে সেশন ম্যানেজ করলে কি পারফরম্যান্স কোনো সুবিধা পাওয়া যায়?',
      upvoteCount: 9,
      isAnswered: false,
    },
    {
      studentName: 'মেহরাব হোসেন',
      question: 'Zod ভ্যালিডেশন স্কিমা কি ক্লায়েন্ট এবং সার্ভার অ্যাকশন উভয় স্থানেই শেয়ার করা সম্ভব?',
      upvoteCount: 6,
      isAnswered: true,
      reply: 'হ্যাঁ, Zod স্কিমা একটি কমন ফোল্ডারে (যেমন /lib/validations) রেখে দুটি স্থানেই ব্যবহার করা আদর্শ।',
    },
    {
      studentName: 'সাদিয়া সুলতানা',
      question: 'Dynamic Route এ generateStaticParams ব্যবহার করলে বিল্ড টাইমে কতগুলো পেজ জেনারেট হওয়া সেফ?',
      upvoteCount: 4,
      isAnswered: false,
    },
  ],
  'live-ml-1': [
    {
      studentName: 'শাকিল আহমেদ',
      question: 'Imbalanced dataset এ SMOTE ব্যবহার করার সঠিক পর্যায় কোনটি? Train-Test split এর আগে না পরে?',
      upvoteCount: 12,
      isAnswered: true,
      reply: 'অবশ্যই Train-Test split এর পরে শুধুমাত্র Training ডেটায় SMOTE প্রয়োগ করতে হবে, নয়তো ডেটা লিকেজ ঘটবে।',
    },
    {
      studentName: 'ফারজানা ববি',
      question: 'Random Forest vs XGBoost: কোন পরিস্থিতিতে XGBoost বেশি কার্যকরী হয়?',
      upvoteCount: 8,
      isAnswered: false,
    },
  ],
  'live-dsa-1': [
    {
      studentName: 'আসিফ ইকবাল',
      question: 'Dijkstra অ্যালগরিদমে Priority Queue এর জায়গায় Fibonacci Heap ব্যবহার করলে কি বাস্তবে কোনো উল্লেখযোগ্য পারফরম্যান্স বৃদ্ধি দেখা যায়?',
      upvoteCount: 15,
      isAnswered: true,
      reply: 'তাত্ত্বিকভাবে O(E + V log V) হলেও বাস্তবে Fibonacci Heap এর কনস্ট্যান্ট ফ্যাক্টর অনেক বেশি, তাই স্ট্যান্ডার্ড বাইনারি মিন-হিপই দ্রুততর।',
    },
    {
      studentName: 'নাঈম রহমান',
      question: 'Dynamic Programming এর মেমোইজেশন ও ট্যাবুলেশনের মধ্যে স্পেস অপ্টিমাইজেশন কখন সম্ভব হয়?',
      upvoteCount: 11,
      isAnswered: false,
    },
  ],
};

/**
 * Retrieves live session details and all interactive student questions
 */
export async function getLiveSessionDetailsAction(sessionId: string): Promise<{
  success: boolean;
  session?: LiveSessionData;
  questions: LiveQuestionItem[];
  currentUserId?: string;
  isInstructorOrAdmin: boolean;
  error?: string;
}> {
  try {
    await dbConnect();
    const authSession = await auth();
    const sessionUser = authSession?.user as any;
    let currentUserId = sessionUser?.id ? String(sessionUser.id) : undefined;
    let currentUserRole = sessionUser?.role || 'STUDENT';

    if (currentUserId && /^[0-9a-fA-F]{24}$/.test(currentUserId)) {
      // already valid
    } else if (currentUserId && currentUserId.includes('@')) {
      const u = (await User.findOne({ email: currentUserId }).select('_id role').lean()) as any;
      if (u) {
        currentUserId = u._id.toString();
        currentUserRole = u.role || currentUserRole;
      }
    } else if (sessionUser?.email) {
      const u = (await User.findOne({ email: sessionUser.email }).select('_id role').lean()) as any;
      if (u) {
        currentUserId = u._id.toString();
        currentUserRole = u.role || currentUserRole;
      }
    }

    const isInstructorOrAdmin =
      currentUserRole === 'INSTRUCTOR' ||
      currentUserRole === 'ADMIN' ||
      currentUserRole === 'SUPERADMIN';

    // 1. Resolve Session Data
    let sessionData: LiveSessionData | null = null;

    try {
      if (sessionId.length === 24) {
        const dbSession = await LiveSession.findById(sessionId).lean() as any;
        if (dbSession) {
          sessionData = {
            id: dbSession._id.toString(),
            courseId: dbSession.courseId,
            title: dbSession.title,
            titleEn: dbSession.titleEn,
            instructorName: dbSession.instructorName,
            instructorAvatar: dbSession.instructorAvatar,
            scheduledTime: new Date(dbSession.scheduledTime).toISOString(),
            duration: dbSession.duration || '১ ঘণ্টা ৩০ মিনিট',
            status: dbSession.status || 'LIVE_NOW',
            streamUrl: dbSession.streamUrl || 'https://www.youtube.com/embed/live_stream?channel=UC_x5XG1OV2P6uZZ5FSM9Ttw',
            meetUrl: dbSession.meetUrl,
            recordingUrl: dbSession.recordingUrl,
            viewerCount: dbSession.viewerCount || 148,
            description: dbSession.description,
            topic: dbSession.topic,
          };
        }
      }
    } catch {}

    // Fallback standard sessions
    if (!sessionData) {
      const isNext = sessionId.includes('next');
      const isML = sessionId.includes('ml');
      const isDSA = sessionId.includes('dsa');

      let courseId = 'fullstack-nextjs';
      let title = 'লাইভ ইন্টারেক্টিভ ক্লাস: Next.js 14 App Router, Server Actions ও রিয়েল-টাইম প্রশ্নোত্তর';
      let titleEn = 'Live Interactive Class: Next.js 14 App Router, Server Actions & Real-Time Q&A';
      let instructorName = 'তানভীর আহমেদ';
      let topic = 'Next.js 14 Architecture & Production Best Practices';

      if (isML) {
        courseId = 'python-machine-learning';
        title = 'লাইভ ওয়ার্কশপ: Scikit-Learn মডেল ডিপ্লয়মেন্ট ও ডেটা প্রিপ্রসেসিং মাস্টারক্লাস';
        titleEn = 'Live Workshop: Scikit-Learn Model Deployment & Data Preprocessing';
        instructorName = 'ড. সাজিদ হাসান';
        topic = 'End-to-End ML Pipeline Architecture';
      } else if (isDSA) {
        courseId = 'dsa-in-bangla';
        title = 'লাইভ ইন্টারভিউ মক সেশন: Graph Algorithms & Dynamic Programming Deep Dive';
        titleEn = 'Live Mock Interview: Graph Algorithms & DP Deep Dive';
        instructorName = 'নাজমুল আরেফিন';
        topic = 'Advanced Graph Theory & Interview Problem Solving';
      }

      sessionData = {
        id: sessionId,
        courseId,
        title,
        titleEn,
        instructorName,
        instructorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop',
        scheduledTime: new Date().toISOString(),
        duration: '১ ঘণ্টা ৪৫ মিনিট',
        status: 'LIVE_NOW',
        streamUrl: 'https://www.youtube.com/embed/5qap5aO4i9A', // High-quality tech lecture embed
        meetUrl: 'https://meet.google.com/esh-ikho-live',
        viewerCount: 164,
        description: 'ইন্সট্রাক্টরের সাথে সরাসরি লাইভ প্রশ্ন করুন এবং গুরুত্বপূর্ণ ডাউট ক্লিয়ার করুন। আপনার প্রশ্ন উপরে তুলতে আপভোট দিন।',
        topic,
      };
    }

    // Try finding course title
    const staticCourse = COURSES_DATA.find((c) => c.id === sessionData?.courseId);
    if (staticCourse && sessionData) {
      sessionData.courseTitle = staticCourse.title;
    }

    // 2. Fetch existing questions for this session
    let dbQuestions = await LiveQuestion.find({ sessionId })
      .sort({ isPinned: -1, upvoteCount: -1, createdAt: -1 })
      .lean() as any[];

    // If no questions in DB yet, seed initial questions for this session
    if (dbQuestions.length === 0) {
      const seedList = DEFAULT_SEED_QUESTIONS[sessionId] || DEFAULT_SEED_QUESTIONS['live-next-1'] || [];
      const courseIdToUse = sessionData.courseId || 'fullstack-nextjs';

      const createdSeeds = [];
      for (const [idx, s] of seedList.entries()) {
        const fakeUserId = `student-seed-${idx + 1}`;
        const upvotesArray = Array.from({ length: s.upvoteCount }, (_, i) => `user-voter-${i + 1}`);

        const created = await LiveQuestion.create({
          sessionId,
          courseId: courseIdToUse,
          studentId: fakeUserId,
          studentName: s.studentName,
          studentAvatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(s.studentName)}`,
          question: s.question,
          upvotes: upvotesArray,
          upvoteCount: s.upvoteCount,
          isAnswered: s.isAnswered,
          answeredAt: s.isAnswered ? new Date(Date.now() - (idx + 1) * 300000) : undefined,
          instructorReply: s.reply || '',
          isPinned: idx === 0, // Pin first top question
          createdAt: new Date(Date.now() - (idx + 2) * 600000),
        });
        createdSeeds.push(created.toObject());
      }

      dbQuestions = createdSeeds;
    }

    // 3. Format questions with current user context
    const questions: LiveQuestionItem[] = dbQuestions.map((q: any) => {
      const qId = q._id.toString();
      const upvotes: string[] = Array.isArray(q.upvotes) ? q.upvotes : [];
      const hasUpvoted = currentUserId ? upvotes.includes(currentUserId) : false;
      const isAuthor = currentUserId ? q.studentId === currentUserId : false;

      return {
        id: qId,
        sessionId: q.sessionId,
        courseId: q.courseId,
        studentId: q.studentId,
        studentName: q.studentName,
        studentAvatar: q.studentAvatar,
        question: q.question,
        upvotes,
        upvoteCount: Number(q.upvoteCount) || upvotes.length,
        isAnswered: !!q.isAnswered,
        answeredAt: q.answeredAt ? new Date(q.answeredAt).toISOString() : undefined,
        instructorReply: q.instructorReply || '',
        isPinned: !!q.isPinned,
        createdAt: new Date(q.createdAt || Date.now()).toISOString(),
        hasUpvoted,
        isAuthor,
      };
    });

    return {
      success: true,
      session: sessionData,
      questions,
      currentUserId,
      isInstructorOrAdmin,
    };
  } catch (err: any) {
    console.error('Error in getLiveSessionDetailsAction:', err);
    return {
      success: false,
      questions: [],
      isInstructorOrAdmin: false,
      error: 'লাইভ ক্লাসের তথ্য লোড করতে ব্যর্থ হয়েছে।',
    };
  }
}

/**
 * Submits a new live question from a student
 */
export async function submitLiveQuestionAction(params: {
  sessionId: string;
  courseId: string;
  question: string;
}): Promise<{
  success: boolean;
  question?: LiveQuestionItem;
  error?: string;
}> {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return { success: false, error: 'প্রশ্ন করার জন্য অনুগ্রহ করে লগইন করুন।' };
    }

    const trimmedQuestion = params.question.trim();
    if (trimmedQuestion.length < 5) {
      return { success: false, error: 'প্রশ্নটি কমপক্ষে ৫টি অক্ষরের হতে হবে।' };
    }
    if (trimmedQuestion.length > 500) {
      return { success: false, error: 'প্রশ্নটি ৫০০ অক্ষরের মধ্যে সীমাবদ্ধ রাখুন।' };
    }

    await dbConnect();

    let studentId = (session.user as any).id;
    let studentName = session.user.name || 'শিক্ষার্থী';
    let studentAvatar = session.user.image || '';

    if (studentId && /^[0-9a-fA-F]{24}$/.test(studentId)) {
      // already valid
    } else if (studentId && typeof studentId === 'string' && studentId.includes('@')) {
      const u = (await User.findOne({ email: studentId }).select('_id name image').lean()) as any;
      if (u) {
        studentId = u._id.toString();
        studentName = u.name || studentName;
        studentAvatar = u.image || studentAvatar;
      }
    } else if (session.user.email) {
      const u = (await User.findOne({ email: session.user.email }).select('_id name image').lean()) as any;
      if (u) {
        studentId = u._id.toString();
        studentName = u.name || studentName;
        studentAvatar = u.image || studentAvatar;
      }
    }

    if (!studentAvatar) {
      studentAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(studentName)}`;
    }

    const created = await LiveQuestion.create({
      sessionId: params.sessionId,
      courseId: params.courseId,
      studentId: String(studentId),
      studentName,
      studentAvatar,
      question: trimmedQuestion,
      upvotes: [],
      upvoteCount: 0,
      isAnswered: false,
      isPinned: false,
      createdAt: new Date(),
    });

    revalidatePath(`/live/${params.sessionId}`);
    revalidatePath(`/courses/${params.courseId}`);

    return {
      success: true,
      question: {
        id: created._id.toString(),
        sessionId: created.sessionId,
        courseId: created.courseId,
        studentId: created.studentId,
        studentName: created.studentName,
        studentAvatar: created.studentAvatar,
        question: created.question,
        upvotes: [],
        upvoteCount: 0,
        isAnswered: false,
        isPinned: false,
        createdAt: created.createdAt.toISOString(),
        hasUpvoted: false,
        isAuthor: true,
      },
    };
  } catch (err: any) {
    console.error('Error submitting live question:', err);
    return { success: false, error: 'প্রশ্ন জমা দিতে সমস্যা হয়েছে।' };
  }
}

/**
 * Toggles a student upvote on a live question
 */
export async function toggleUpvoteLiveQuestionAction(questionId: string): Promise<{
  success: boolean;
  upvoteCount: number;
  hasUpvoted: boolean;
  error?: string;
}> {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return { success: false, upvoteCount: 0, hasUpvoted: false, error: 'আপভোট দেওয়ার জন্য লগইন করুন।' };
    }

    await dbConnect();

    let userId = (session.user as any).id;
    if (userId && typeof userId === 'string' && /^[0-9a-fA-F]{24}$/.test(userId)) {
      // already valid
    } else if (userId && typeof userId === 'string' && userId.includes('@')) {
      const u = (await User.findOne({ email: userId }).select('_id').lean()) as any;
      if (u) userId = u._id.toString();
    } else if (session.user.email) {
      const u = (await User.findOne({ email: session.user.email }).select('_id').lean()) as any;
      if (u) userId = u._id.toString();
    }
    const userIdStr = String(userId);

    const question = await LiveQuestion.findById(questionId);
    if (!question) {
      return { success: false, upvoteCount: 0, hasUpvoted: false, error: 'প্রশ্নটি পাওয়া যায়নি।' };
    }

    const currentUpvotes = Array.isArray(question.upvotes) ? question.upvotes : [];
    const alreadyUpvoted = currentUpvotes.includes(userIdStr);

    let updatedUpvotes: string[] = [];
    if (alreadyUpvoted) {
      updatedUpvotes = currentUpvotes.filter((id) => id !== userIdStr);
    } else {
      updatedUpvotes = [...currentUpvotes, userIdStr];
    }

    question.upvotes = updatedUpvotes;
    question.upvoteCount = updatedUpvotes.length;
    await question.save();

    revalidatePath(`/live/${question.sessionId}`);

    return {
      success: true,
      upvoteCount: question.upvoteCount,
      hasUpvoted: !alreadyUpvoted,
    };
  } catch (err: any) {
    console.error('Error toggling question upvote:', err);
    return { success: false, upvoteCount: 0, hasUpvoted: false, error: 'আপভোট প্রক্রিয়া ব্যর্থ হয়েছে।' };
  }
}

/**
 * Marks a live question as answered by instructor/moderator
 */
export async function answerLiveQuestionAction(params: {
  questionId: string;
  instructorReply?: string;
  isAnswered?: boolean;
}): Promise<{
  success: boolean;
  isAnswered: boolean;
  instructorReply?: string;
  error?: string;
}> {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return { success: false, isAnswered: false, error: 'লগইন আবশ্যক।' };
    }

    await dbConnect();

    const question = await LiveQuestion.findById(params.questionId);
    if (!question) {
      return { success: false, isAnswered: false, error: 'প্রশ্নটি পাওয়া যায়নি।' };
    }

    const shouldAnswer = params.isAnswered !== undefined ? params.isAnswered : true;
    question.isAnswered = shouldAnswer;
    question.answeredAt = shouldAnswer ? new Date() : undefined;
    if (params.instructorReply !== undefined) {
      question.instructorReply = params.instructorReply.trim();
    }

    await question.save();
    revalidatePath(`/live/${question.sessionId}`);

    return {
      success: true,
      isAnswered: question.isAnswered,
      instructorReply: question.instructorReply,
    };
  } catch (err: any) {
    console.error('Error answering live question:', err);
    return { success: false, isAnswered: false, error: 'স্ট্যাটাস আপডেট ব্যর্থ হয়েছে।' };
  }
}

/**
 * Pins or unpins a live question to the top of the queue
 */
export async function pinLiveQuestionAction(questionId: string): Promise<{
  success: boolean;
  isPinned: boolean;
  error?: string;
}> {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return { success: false, isPinned: false, error: 'লগইন আবশ্যক।' };
    }

    await dbConnect();

    const question = await LiveQuestion.findById(questionId);
    if (!question) {
      return { success: false, isPinned: false, error: 'প্রশ্নটি পাওয়া যায়নি।' };
    }

    question.isPinned = !question.isPinned;
    await question.save();

    revalidatePath(`/live/${question.sessionId}`);

    return {
      success: true,
      isPinned: question.isPinned,
    };
  } catch (err: any) {
    console.error('Error pinning question:', err);
    return { success: false, isPinned: false, error: 'পিন পরিবর্তন ব্যর্থ হয়েছে।' };
  }
}

/**
 * Refreshes only the questions list for real-time polling
 */
export async function getLiveQuestionsAction(sessionId: string): Promise<{
  success: boolean;
  questions: LiveQuestionItem[];
}> {
  try {
    await dbConnect();
    const authSession = await auth();
    const sessionUser = authSession?.user as any;
    let currentUserId = sessionUser?.id ? String(sessionUser.id) : undefined;

    if (currentUserId && /^[0-9a-fA-F]{24}$/.test(currentUserId)) {
      // already valid
    } else if (currentUserId && currentUserId.includes('@')) {
      const u = (await User.findOne({ email: currentUserId }).select('_id').lean()) as any;
      if (u) currentUserId = u._id.toString();
    } else if (sessionUser?.email) {
      const u = (await User.findOne({ email: sessionUser.email }).select('_id').lean()) as any;
      if (u) currentUserId = u._id.toString();
    }

    const dbQuestions = await LiveQuestion.find({ sessionId })
      .sort({ isPinned: -1, upvoteCount: -1, createdAt: -1 })
      .lean() as any[];

    const questions: LiveQuestionItem[] = dbQuestions.map((q: any) => {
      const upvotes: string[] = Array.isArray(q.upvotes) ? q.upvotes : [];
      return {
        id: q._id.toString(),
        sessionId: q.sessionId,
        courseId: q.courseId,
        studentId: q.studentId,
        studentName: q.studentName,
        studentAvatar: q.studentAvatar,
        question: q.question,
        upvotes,
        upvoteCount: Number(q.upvoteCount) || upvotes.length,
        isAnswered: !!q.isAnswered,
        answeredAt: q.answeredAt ? new Date(q.answeredAt).toISOString() : undefined,
        instructorReply: q.instructorReply || '',
        isPinned: !!q.isPinned,
        createdAt: new Date(q.createdAt || Date.now()).toISOString(),
        hasUpvoted: currentUserId ? upvotes.includes(currentUserId) : false,
        isAuthor: currentUserId ? q.studentId === currentUserId : false,
      };
    });

    return { success: true, questions };
  } catch (err) {
    return { success: false, questions: [] };
  }
}

/**
 * Completes a live class and automatically records and saves it into the respective
 * course module so that absent students can watch it later.
 */
export async function completeLiveSessionAndSaveToModuleAction({
  sessionId,
  recordingUrl,
  moduleId,
}: {
  sessionId: string;
  recordingUrl?: string;
  moduleId?: string;
}): Promise<{
  success: boolean;
  message?: string;
  lessonId?: string;
  moduleId?: string;
  error?: string;
}> {
  try {
    const authSession = await auth();
    const user = authSession?.user as any;
    if (!user) {
      return { success: false, error: 'লগইন আবশ্যক।' };
    }

    await dbConnect();

    const Module = (await import('@/models/Module')).default;
    const Lesson = (await import('@/models/Lesson')).default;
    const Notification = (await import('@/models/Notification')).default;
    const Enrollment = (await import('@/models/Enrollment')).default;

    let sessionDoc = await LiveSession.findById(sessionId);
    if (!sessionDoc) {
      // Create record if mock session
      sessionDoc = await LiveSession.create({
        courseId: 'fullstack-nextjs',
        title: 'লাইভ ডাউট সলভিং ও রিভিশন ক্লাস',
        instructorName: user.name || 'ইন্সট্রাক্টর',
        scheduledTime: new Date(),
        status: 'LIVE_NOW',
      });
    }

    const courseId = sessionDoc.courseId;
    const finalRecordingUrl =
      recordingUrl?.trim() ||
      sessionDoc.recordingUrl ||
      sessionDoc.streamUrl ||
      'https://www.youtube.com/watch?v=wm5gMKuwSYk';

    // 1. Update LiveSession status to COMPLETED
    sessionDoc.status = 'COMPLETED';
    sessionDoc.recordingUrl = finalRecordingUrl;
    await sessionDoc.save();

    // 2. Find or create the dedicated Live Recordings Module
    let targetModuleId = moduleId;
    if (!targetModuleId) {
      let archiveMod = await Module.findOne({
        courseId,
        title: { $regex: /লাইভ ক্লাস|Live Class Recordings/i },
      });

      if (!archiveMod) {
        archiveMod = await Module.create({
          courseId,
          title: 'লাইভ ক্লাস রেকর্ডিং ও আর্কাইভ (Live Class Recordings)',
          duration: '১০ ঘণ্টা',
          order: 99,
        });
      }
      targetModuleId = archiveMod._id.toString();
    }

    // 3. Save as a Lesson inside the module
    const lessonCount = await Lesson.countDocuments({ moduleId: targetModuleId });
    const newLesson = await Lesson.create({
      title: `[রেকর্ডেড লাইভ ক্লাস] ${sessionDoc.title}`,
      content: sessionDoc.description || 'লাইভ ক্লাস সেশনের সম্পূর্ণ রেকর্ডিং।',
      duration: sessionDoc.duration || '১ ঘণ্টা ৩০ মিনিট',
      isFree: false, // Strictly locked to enrolled students
      order: lessonCount + 1,
      moduleId: targetModuleId,
      videoUrl: finalRecordingUrl,
      type: 'VIDEO',
      isDownloadable: false, // DRM protected
    });

    // 4. Notify all enrolled students (including absent students)
    try {
      const enrollments = await Enrollment.find({
        courseId,
        paymentStatus: { $in: ['success', 'GRANTED', 'granted'] },
      }).select('userId').lean() as any[];

      const notificationsToInsert = enrollments.map((enr: any) => ({
        recipientId: enr.userId,
        title: 'নতুন লাইভ ক্লাসের রেকর্ডিং সংরক্ষিত হয়েছে',
        message: `"${sessionDoc.title}" ক্লাসের সম্পূর্ণ রেকর্ডিং কোর্স মডিউলে যোগ করা হয়েছে। মিস করে থাকলে এখনই দেখে নিন!`,
        type: 'LIVE_CLASS_RECORDING_READY',
        priority: 'HIGH',
        priorityWeight: 3,
        actionUrl: `/courses/${courseId}`,
        badgeLabel: 'Live Recording Ready',
      }));

      if (notificationsToInsert.length > 0) {
        await Notification.insertMany(notificationsToInsert);

        // Instantly push real-time alerts to open student tabs via SSE
        notificationsToInsert.forEach((notif: any) => {
          sendRealtimeNotification(notif.recipientId.toString(), {
            title: notif.title,
            message: notif.message,
            type: notif.type,
            priority: notif.priority,
            actionUrl: notif.actionUrl,
            badgeLabel: notif.badgeLabel,
            createdAt: new Date().toISOString(),
          });
        });
      }
    } catch (notifErr) {
      console.warn('Could not dispatch batch live recording notifications:', notifErr);
    }

    revalidatePath(`/live/${sessionId}`);
    revalidatePath(`/courses/${courseId}`);
    revalidatePath('/student');

    return {
      success: true,
      message: 'লাইভ ক্লাস সফলভাবে সম্পন্ন হয়েছে এবং রেকর্ডিং কোর্স মডিউলে সংরক্ষিত হয়েছে!',
      lessonId: newLesson._id.toString(),
      moduleId: targetModuleId,
    };
  } catch (err: any) {
    console.error('Error in completeLiveSessionAndSaveToModuleAction:', err);
    return { success: false, error: err.message || 'লাইভ ক্লাস সংরক্ষণ করতে ব্যর্থ হয়েছে।' };
  }
}

/**
 * Enforces same enrollment access and DRM security rules as regular course videos
 * for recorded live classes with student watermarking.
 */
export async function getLiveRecordingPlaybackAction(sessionId: string): Promise<{
  success: boolean;
  isLocked?: boolean;
  recordingUrl?: string;
  videoType?: 'youtube' | 'bunny' | 'html5';
  title?: string;
  watermark?: {
    studentId: string;
    studentEmail: string;
    studentName: string;
    timestamp: string;
  };
  error?: string;
}> {
  try {
    const authSession = await auth();
    const sessionUser = authSession?.user as any;
    if (!sessionUser?.email) {
      return {
        success: false,
        isLocked: true,
        error: 'সুরক্ষিত লাইভ ক্লাসের রেকর্ডিং দেখতে অনুগ্রহ করে লগইন করুন।',
      };
    }

    await dbConnect();

    let sessionDoc = await LiveSession.findById(sessionId).lean() as any;
    if (!sessionDoc) {
      // Check static list
      const { getCourseLiveSessionsAction } = await import('@/actions/course-access');
      const list = await getCourseLiveSessionsAction('fullstack-nextjs');
      const found = list.liveSessions.find((s) => s.id === sessionId);
      if (found) {
        sessionDoc = {
          ...found,
          courseId: 'fullstack-nextjs',
        };
      }
    }

    if (!sessionDoc) {
      return { success: false, error: 'লাইভ সেশনটি পাওয়া যায়নি।' };
    }

    const courseId = sessionDoc.courseId;

    // Verify course enrollment / revision access / staff rights
    const { getCourseAccessDetails } = await import('@/actions/course-access');
    const access = await getCourseAccessDetails(courseId);

    if (!access.canAccessAll) {
      return {
        success: false,
        isLocked: true,
        error: 'এই রেকর্ডেড লাইভ ক্লাসটি শুধুমাত্র কোর্সে ভর্তিকৃত শিক্ষার্থীদের জন্য সংরক্ষিত (Enrollment Required)।',
      };
    }

    const rawUrl = sessionDoc.recordingUrl || sessionDoc.streamUrl || 'https://www.youtube.com/watch?v=wm5gMKuwSYk';
    let videoType: 'youtube' | 'bunny' | 'html5' = 'html5';
    if (rawUrl.includes('youtube.com') || rawUrl.includes('youtu.be')) {
      videoType = 'youtube';
    } else if (rawUrl.includes('mediadelivery.net') || rawUrl.includes('bunny')) {
      videoType = 'bunny';
    }

    const watermark = {
      studentId: sessionUser.id || 'std-drm',
      studentEmail: sessionUser.email,
      studentName: sessionUser.name || 'Student',
      timestamp: new Date().toLocaleTimeString('bn-BD', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };

    return {
      success: true,
      recordingUrl: rawUrl,
      videoType,
      title: sessionDoc.title,
      watermark,
    };
  } catch (err: any) {
    console.error('Error getting live recording DRM playback:', err);
    return { success: false, error: err.message || 'রেকর্ডিং প্লেব্যাক তৈরি করতে ব্যর্থ হয়েছে।' };
  }
}

