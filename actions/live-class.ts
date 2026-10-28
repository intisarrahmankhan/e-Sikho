'use server';

import { auth } from '@/auth';
import dbConnect from '@/lib/mongoose';
import LiveQuestion from '@/models/LiveQuestion';
import LiveSession from '@/models/LiveSession';
import User from '@/models/User';
import Course from '@/models/Course';
import { getCourseAccessDetails } from '@/actions/course-access';
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


async function canManageLiveCourse(user: any, courseId: string) {
  if (!user?.id) return false;
  if (user.role === 'ADMIN' || user.role === 'SUPERADMIN') return true;
  return user.role === 'INSTRUCTOR' && !!await Course.exists({ _id: courseId, createdById: user.id });
}

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
            streamUrl: dbSession.streamUrl || '',
            meetUrl: dbSession.meetUrl,
            recordingUrl: dbSession.recordingUrl,
            viewerCount: dbSession.viewerCount || 0,
            description: dbSession.description,
            topic: dbSession.topic,
          };
        }
      }
    } catch {}

    if (!sessionData) return { success: false, questions: [], isInstructorOrAdmin: false, error: 'Live session not found.' };
    const access = await getCourseAccessDetails(sessionData.courseId);
    if (!access.canAccessAll) return { success: false, questions: [], isInstructorOrAdmin: false, error: 'Course access is required.' };
    const course = await Course.findById(sessionData.courseId).lean();
    const { parseBunnyVideoUrl, generateBunnySignedEmbedUrl } = await import('@/lib/bunny');
    for (const field of ['recordingUrl', 'streamUrl'] as const) {
      const source = sessionData[field];
      if (!source) continue;
      const bunnyVideo = parseBunnyVideoUrl(source);
      if (bunnyVideo) sessionData[field] = generateBunnySignedEmbedUrl(bunnyVideo.libraryId, bunnyVideo.videoId).embedUrl;
      else if (/^https:\/\/(www\.)?(youtube\.com|youtu\.be)\//.test(source)) {
        const url = new URL(source);
        const videoId = url.hostname === 'youtu.be' ? url.pathname.slice(1) : url.searchParams.get('v') || url.pathname.split('/').pop();
        sessionData[field] = `https://www.youtube.com/embed/${encodeURIComponent(videoId || '')}`;
      }
    }
    sessionData.courseTitle = course?.title || '';

    // 2. Fetch existing questions for this session
    let dbQuestions = await LiveQuestion.find({ sessionId })
      .sort({ isPinned: -1, upvoteCount: -1, createdAt: -1 })
      .lean() as any[];

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
      isInstructorOrAdmin: await canManageLiveCourse(sessionUser, sessionData.courseId),
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

    const liveSession = await LiveSession.findById(params.sessionId).lean();
    if (!liveSession || String(liveSession.courseId) !== params.courseId || liveSession.status === 'COMPLETED') {
      return { success: false, error: 'Active live session not found in this course.' };
    }
    const access = await getCourseAccessDetails(params.courseId);
    if (!access.canAccessAll) return { success: false, error: 'Course access is required.' };

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

    if (!(await getCourseAccessDetails(question.courseId)).canAccessAll) return { success: false, upvoteCount: 0, hasUpvoted: false, error: 'Course access is required.' };

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

    if (!await canManageLiveCourse(session.user, question.courseId)) {
      return { success: false, isAnswered: false, error: 'Only the course instructor or an administrator can answer questions.' };
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

    if (!await canManageLiveCourse(session.user, question.courseId)) {
      return { success: false, isPinned: false, error: 'Only the course instructor or an administrator can pin questions.' };
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

    const liveSession = await LiveSession.findById(sessionId).lean();
    if (!liveSession || !(await getCourseAccessDetails(liveSession.courseId)).canAccessAll) return { success: false, questions: [] };

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
      return { success: false, error: 'Live session not found.' };
    }

    const courseId = sessionDoc.courseId;
    if (!await canManageLiveCourse(user, courseId)) return { success: false, error: 'Only the course instructor or an administrator can archive this session.' };
    if (moduleId && !await Module.exists({ _id: moduleId, courseId })) return { success: false, error: 'Module does not belong to this course.' };

    const finalRecordingUrl =
      recordingUrl?.trim() ||
      sessionDoc.recordingUrl ||
      sessionDoc.streamUrl || '';
    if (!finalRecordingUrl) return { success: false, error: 'A recording URL is required.' };

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
      return { success: false, error: 'Live session not found.' };
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

    let rawUrl = sessionDoc.recordingUrl || '';
    if (!rawUrl) return { success: false, error: 'No recording has been added.' };
    const { parseBunnyVideoUrl, generateBunnySignedEmbedUrl } = await import('@/lib/bunny');
    const bunnyVideo = parseBunnyVideoUrl(rawUrl);
    if (bunnyVideo) rawUrl = generateBunnySignedEmbedUrl(bunnyVideo.libraryId, bunnyVideo.videoId).embedUrl;
    let videoType: 'youtube' | 'bunny' | 'html5' = 'html5';
    if (rawUrl.includes('youtube.com') || rawUrl.includes('youtu.be')) {
      videoType = 'youtube';
    } else if (rawUrl.includes('mediadelivery.net') || rawUrl.includes('bunny')) {
      videoType = 'bunny';
    }

    const watermark = {
      studentId: sessionUser.id || '',
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

