'use server';

import { auth } from '@/auth';
import dbConnect from '@/lib/mongoose';
import Enrollment from '@/models/Enrollment';
import LessonProgress from '@/models/LessonProgress';
import Course from '@/models/Course';
import Exam from '@/models/Exam';
import User from '@/models/User';
import { COURSES_DATA } from '@/lib/courses-data';
import { revalidatePath } from 'next/cache';
import { sendRealtimeNotification } from '@/lib/realtime-notifications';

export interface CourseAccessResult {
  isLoggedIn: boolean;
  isEnrolled: boolean;
  canAccessAll: boolean; // true if enrolled (or active revision access), admin, superadmin, or instructor
  userRole?: string;
  completedLessonIds: string[];
  totalLessons: number;
  progressPercentage: number;
  // Temporary Revision Access fields
  isCourseEnded?: boolean;
  isEnrollmentExpired?: boolean;
  isRevisionAccessActive?: boolean;
  revisionAccessExpiresAt?: string;
  canRequestRevision?: boolean;
  revisionRequestStatus?: 'NONE' | 'PENDING' | 'APPROVED' | 'REJECTED';
  revisionExamDate?: string;
  revisionReason?: string;
}

export interface CourseResourceItem {
  id: string;
  title: string;
  titleEn?: string;
  fileType: 'pdf' | 'zip' | 'code' | 'doc';
  fileSize: string;
  downloadUrl: string;
  isFreePreview?: boolean;
  isDownloadable?: boolean; // false = View-Only by default to protect IP
}

export interface LiveSessionItem {
  id: string;
  title: string;
  titleEn?: string;
  instructorName: string;
  scheduledTime: string; // ISO string
  duration: string;
  status: 'UPCOMING' | 'LIVE_NOW' | 'COMPLETED';
  meetUrl?: string; // Zoom or Google Meet URL
  recordingUrl?: string; // Video URL if class is completed
  recordingLessonId?: string; // Saved lesson ID in course module
}

/**
 * Checks whether the current session has access to a specific course
 * and returns their lesson progress, including temporary revision access before final exams.
 */
export async function getCourseAccessDetails(courseId: string): Promise<CourseAccessResult> {
  try {
    const session = await auth();
    const sessionUser = session?.user as { id?: string; role?: string; email?: string } | undefined;

    if (!sessionUser?.id) {
      return {
        isLoggedIn: false,
        isEnrolled: false,
        canAccessAll: false,
        completedLessonIds: [],
        totalLessons: 0,
        progressPercentage: 0,
      };
    }

    await dbConnect();

    // Resolve userId safely
    let userId = sessionUser.id;
    if (typeof userId === 'string' && userId.includes('@')) {
      const u = await User.findOne({ email: userId }).select('_id role').lean() as any;
      if (u) userId = u._id.toString();
    }

    const role = sessionUser.role || 'STUDENT';
    const isStaff = role === 'ADMIN' || role === 'SUPERADMIN';

    // Check if user is enrolled
    const enrollment = await Enrollment.findOne({
      userId,
      courseId,
      paymentStatus: { $in: ['success', 'GRANTED', 'granted'] },
    }).lean() as any;

    const isEnrolled = !!enrollment;

    // Check course end date and temporary revision access
    let isCourseEnded = false;
    let isEnrollmentExpired = false;
    let isRevisionAccessActive = false;
    let revisionAccessExpiresAt: string | undefined = undefined;
    let canRequestRevision = false;
    let revisionRequestStatus: 'NONE' | 'PENDING' | 'APPROVED' | 'REJECTED' = 'NONE';
    let revisionExamDate: string | undefined = undefined;
    let revisionReason: string | undefined = undefined;

    let dbCourse: any = null;
    try {
      dbCourse = await Course.findById(courseId).lean();
    } catch {}

    if (isEnrolled && enrollment) {
      const now = new Date();
      revisionRequestStatus = enrollment.revisionRequestStatus || 'NONE';
      revisionExamDate = enrollment.revisionExamDate;
      revisionReason = enrollment.revisionReason;

      // Check if course has passed its scheduled end date or enrollment validity
      if (dbCourse?.courseEndDate && new Date(dbCourse.courseEndDate) < now) {
        isCourseEnded = true;
      }
      if (enrollment.validUntil && new Date(enrollment.validUntil) < now) {
        isEnrollmentExpired = true;
      }

      // Check if temporary revision access is granted and active
      if (enrollment.isRevisionGranted && enrollment.revisionAccessExpiresAt) {
        const revExp = new Date(enrollment.revisionAccessExpiresAt);
        if (revExp > now) {
          isRevisionAccessActive = true;
          revisionAccessExpiresAt = revExp.toISOString();
        } else {
          isRevisionAccessActive = false;
          // Expired revision access
          if (isCourseEnded || isEnrollmentExpired) {
            canRequestRevision = dbCourse?.allowRevisionAccess !== false;
          }
        }
      } else if (isCourseEnded || isEnrollmentExpired) {
        canRequestRevision = dbCourse?.allowRevisionAccess !== false;
      }
    }

    // Access determination:
    // Staff always has full access.
    // If course has ended or enrollment expired, student only has access IF temporary revision access is active!
    // Otherwise if enrolled and not expired, student has full access.
    let canAccessAll = isStaff;
    if (isEnrolled) {
      if (isCourseEnded || isEnrollmentExpired) {
        canAccessAll = isStaff || isRevisionAccessActive;
      } else {
        canAccessAll = true;
      }
    }

    // Fetch lesson progress for this student and course
    const progressRecords = await LessonProgress.find({
      userId,
      courseId,
      isCompleted: true,
    }).select('lessonId').lean() as any[];

    const completedLessonIds = progressRecords.map((p) => p.lessonId?.toString()).filter(Boolean);

    // Calculate total lessons
    let totalLessons = 0;
    const staticCourse = COURSES_DATA.find((c) => c.id === courseId);
    if (staticCourse) {
      totalLessons = staticCourse.modules.reduce((sum, m) => sum + (m.lessons?.length || 0), 0);
    } else if (dbCourse?.totalLessons) {
      totalLessons = dbCourse.totalLessons;
    }

    const progressPercentage =
      totalLessons > 0 ? Math.min(100, Math.round((completedLessonIds.length / totalLessons) * 100)) : 0;

    return {
      isLoggedIn: true,
      isEnrolled,
      canAccessAll,
      userRole: role,
      completedLessonIds,
      totalLessons,
      progressPercentage,
      isCourseEnded,
      isEnrollmentExpired,
      isRevisionAccessActive,
      revisionAccessExpiresAt,
      canRequestRevision,
      revisionRequestStatus,
      revisionExamDate,
      revisionReason,
    };
  } catch (error) {
    console.error('Error fetching course access details:', error);
    return {
      isLoggedIn: false,
      isEnrolled: false,
      canAccessAll: false,
      completedLessonIds: [],
      totalLessons: 0,
      progressPercentage: 0,
    };
  }
}

/**
 * Toggles or updates lesson completion for an enrolled student
 */
export async function toggleLessonProgressAction(
  courseId: string,
  lessonId: string,
  forceCompleted?: boolean
) {
  try {
    const session = await auth();
    const sessionUser = session?.user as { id?: string; email?: string } | undefined;
    if (!sessionUser?.id) {
      return { error: 'অনুগ্রহ করে প্রথমে লগইন করুন।' };
    }

    await dbConnect();

    let userId = sessionUser.id;
    if (typeof userId === 'string' && userId.includes('@')) {
      const u = await User.findOne({ email: userId }).select('_id').lean() as any;
      if (u) userId = u._id.toString();
    }

    const existing = await LessonProgress.findOne({
      userId,
      courseId,
      lessonId,
    });

    let newStatus = true;
    if (existing) {
      newStatus = typeof forceCompleted === 'boolean' ? forceCompleted : !existing.isCompleted;
      existing.isCompleted = newStatus;
      existing.lastAccessedAt = new Date();
      await existing.save();
    } else {
      newStatus = typeof forceCompleted === 'boolean' ? forceCompleted : true;
      await LessonProgress.create({
        userId,
        courseId,
        lessonId,
        isCompleted: newStatus,
        lastAccessedAt: new Date(),
      });
    }

    revalidatePath(`/courses/${courseId}`);
    revalidatePath('/student');

    return { success: true, isCompleted: newStatus };
  } catch (error: any) {
    console.error('Failed to toggle lesson progress:', error);
    return { error: error.message || 'অগ্রগতি আপডেট করতে ব্যর্থ হয়েছে।' };
  }
}

/**
 * Retrieves official downloadable course resources (Lecture Slides, PDFs, Cheat sheets)
 */
export async function getCourseResourcesAction(courseId: string): Promise<{
  success: boolean;
  resources: CourseResourceItem[];
}> {
  // Built-in curated PDF resources for the courses
  const commonPdfs: Record<string, CourseResourceItem[]> = {
    'fullstack-nextjs': [
      {
        id: 'pdf-next-1',
        title: 'Next.js 14 & React সম্পূর্ণ লেকচার স্লাইডস (PDF)',
        titleEn: 'Next.js 14 & React Complete Lecture Slides (PDF)',
        fileType: 'pdf',
        fileSize: '4.8 MB',
        downloadUrl: '/resources/nextjs-lecture-slides.pdf',
        isFreePreview: true,
      },
      {
        id: 'pdf-next-2',
        title: 'TypeScript & App Router চিটশিট ও সিনট্যাক্স গাইড (PDF)',
        titleEn: 'TypeScript & App Router Cheatsheet Guide (PDF)',
        fileType: 'pdf',
        fileSize: '2.1 MB',
        downloadUrl: '/resources/typescript-next-cheatsheet.pdf',
        isFreePreview: false,
      },
      {
        id: 'pdf-next-3',
        title: 'PostgreSQL & Prisma স্কিমা আর্কিটেকচার ব্লুপ্রিন্ট (PDF)',
        titleEn: 'PostgreSQL & Prisma Schema Architecture Blueprint (PDF)',
        fileType: 'pdf',
        fileSize: '3.4 MB',
        downloadUrl: '/resources/database-architecture.pdf',
        isFreePreview: false,
      },
      {
        id: 'zip-next-4',
        title: 'প্রজেক্ট স্টার্টার সোর্স কোড ও বয়লারপ্লেট (ZIP)',
        titleEn: 'Fullstack Starter Boilerplate & Source Code (ZIP)',
        fileType: 'zip',
        fileSize: '12.5 MB',
        downloadUrl: '/resources/fullstack-starter.zip',
        isFreePreview: false,
      },
    ],
    'python-machine-learning': [
      {
        id: 'pdf-ml-1',
        title: 'মেশিন লার্নিং ও এআই বেসিক হ্যান্ডবুক (PDF)',
        titleEn: 'Machine Learning & AI Handbook (PDF)',
        fileType: 'pdf',
        fileSize: '5.2 MB',
        downloadUrl: '/resources/ml-handbook.pdf',
        isFreePreview: true,
      },
      {
        id: 'pdf-ml-2',
        title: 'NumPy, Pandas & Scikit-Learn অ্যালগরিদম চার্ট (PDF)',
        titleEn: 'NumPy & Scikit-Learn Algorithms Reference (PDF)',
        fileType: 'pdf',
        fileSize: '3.1 MB',
        downloadUrl: '/resources/python-data-science-cheatsheet.pdf',
        isFreePreview: false,
      },
    ],
    'dsa-in-bangla': [
      {
        id: 'pdf-dsa-1',
        title: 'ডাটা স্ট্রাকচার ও অ্যালগরিদম মাস্টার নোটস (PDF)',
        titleEn: 'DSA Comprehensive Notes & Big-O Guide (PDF)',
        fileType: 'pdf',
        fileSize: '6.4 MB',
        downloadUrl: '/resources/dsa-notes.pdf',
        isFreePreview: true,
      },
      {
        id: 'pdf-dsa-2',
        title: 'LeetCode ২০০+ প্রব্লেম সলিউশন রোডম্যাপ (PDF)',
        titleEn: 'LeetCode Top 200 Problem Solving Roadmap (PDF)',
        fileType: 'pdf',
        fileSize: '4.0 MB',
        downloadUrl: '/resources/leetcode-roadmap.pdf',
        isFreePreview: false,
      },
    ],
    'system-design-architecture': [
      {
        id: 'pdf-sd-1',
        title: 'সিস্টেম ডিজাইন ব্লুপ্রিন্ট ও কেস স্টাডিজ (PDF)',
        titleEn: 'System Design Case Studies & Architecture Patterns (PDF)',
        fileType: 'pdf',
        fileSize: '7.8 MB',
        downloadUrl: '/resources/system-design-case-studies.pdf',
        isFreePreview: true,
      },
    ],
  };

  let list = commonPdfs[courseId] ? [...commonPdfs[courseId]] : [
    {
      id: `pdf-${courseId}-1`,
      title: 'কোর্স কারিকুলাম ও লেকচার নোটস (PDF)',
      titleEn: 'Course Curriculum & Lecture Notes (PDF)',
      fileType: 'pdf' as const,
      fileSize: '3.5 MB',
      downloadUrl: `/resources/${courseId}-notes.pdf`,
      isFreePreview: true,
    },
    {
      id: `pdf-${courseId}-2`,
      title: 'লেকচার এক্সারসাইজ ও প্র্যাকটিস ফাইলস (PDF)',
      titleEn: 'Lecture Exercises & Practice Files (PDF)',
      fileType: 'pdf' as const,
      fileSize: '2.8 MB',
      downloadUrl: `/resources/${courseId}-exercises.pdf`,
      isFreePreview: false,
    },
  ];

  try {
    if (courseId && courseId.length === 24) {
      await dbConnect();
      const { default: Module } = await import('@/models/Module');
      const { default: Lesson } = await import('@/models/Lesson');
      const dbModules = await Module.find({ courseId }).select('_id').lean();
      if (dbModules.length > 0) {
        const moduleIds = dbModules.map((m: any) => m._id);
        const pdfLessons = await Lesson.find({
          moduleId: { $in: moduleIds },
          pdfUrl: { $exists: true, $ne: '' },
        }).lean();

        for (const pl of pdfLessons) {
          if (pl.pdfUrl) {
            list.unshift({
              id: pl._id.toString(),
              title: pl.pdfName || `${pl.title} (লেকচার স্লাইড / PDF)`,
              titleEn: pl.pdfName || `${pl.title} (Lecture Slide / PDF)`,
              fileType: 'pdf',
              fileSize: '2.5 MB',
              downloadUrl: pl.pdfUrl,
              isFreePreview: !!pl.isFree,
              isDownloadable: !!pl.isDownloadable, // View-only unless explicitly marked downloadable
            });
          }
        }
      }
    }
  } catch (err) {
    console.error('Error fetching dynamic course PDFs:', err);
  }

  return { success: true, resources: list };
}

/**
 * Retrieves scheduled live class sessions with meeting links
 */
export async function getCourseLiveSessionsAction(courseId: string): Promise<{
  success: boolean;
  liveSessions: LiveSessionItem[];
}> {
  const sessions: Record<string, LiveSessionItem[]> = {
    'fullstack-nextjs': [
      {
        id: 'live-next-1',
        title: 'লাইভ ডাউট সলভিং ও রিভিশন ক্লাস ১: App Router & TypeScript',
        titleEn: 'Live Q&A & Code Review 1: App Router & TypeScript',
        instructorName: 'তানভীর আহমেদ',
        scheduledTime: new Date(Date.now() + 2 * 3600 * 1000).toISOString(), // 2 hours from now
        duration: '১ ঘণ্টা ১৫ মিনিট',
        status: 'UPCOMING',
        meetUrl: 'https://meet.google.com/esh-ikho-live',
      },
      {
        id: 'live-next-2',
        title: 'লাইভ ওয়ার্কশপ: NextAuth v5 সিকিউর সেশন হ্যান্ডলিং',
        titleEn: 'Live Workshop: NextAuth v5 Secure Session Handling',
        instructorName: 'তানভীর আহমেদ',
        scheduledTime: new Date(Date.now() - 48 * 3600 * 1000).toISOString(), // Past session
        duration: '১ ঘণ্টা ৩০ মিনিট',
        status: 'COMPLETED',
        recordingUrl: 'https://www.youtube.com/watch?v=wm5gMKuwSYk',
      },
    ],
    'python-machine-learning': [
      {
        id: 'live-ml-1',
        title: 'লাইভ প্রজেক্ট ওয়ার্কশপ: Scikit-Learn মডেল ডিপ্লয়মেন্ট',
        titleEn: 'Live Workshop: Scikit-Learn Model Deployment',
        instructorName: 'ড. সাজিদ হাসান',
        scheduledTime: new Date(Date.now() + 5 * 3600 * 1000).toISOString(),
        duration: '১ ঘণ্টা ৩০ মিনিট',
        status: 'UPCOMING',
        meetUrl: 'https://meet.google.com/esh-ikho-ml',
      },
    ],
    'dsa-in-bangla': [
      {
        id: 'live-dsa-1',
        title: 'লাইভ ইন্টারভিউ মক সেশন: Graph & DP Algorithms',
        titleEn: 'Live Mock Interview: Graph & Dynamic Programming',
        instructorName: 'নাজমুল আরেফিন',
        scheduledTime: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
        duration: '২ ঘণ্টা',
        status: 'UPCOMING',
        meetUrl: 'https://meet.google.com/esh-ikho-dsa',
      },
    ],
  };

  const list = sessions[courseId] || [
    {
      id: `live-${courseId}-1`,
      title: 'সাপ্তাহিক লাইভ ইন্টারেক্টিভ প্রশ্নোত্তর সেশন',
      titleEn: 'Weekly Live Interactive Q&A Session',
      instructorName: 'e-Shikho কোর্স মেন্টর',
      scheduledTime: new Date(Date.now() + 12 * 3600 * 1000).toISOString(),
      duration: '১ ঘণ্টা',
      status: 'UPCOMING',
      meetUrl: 'https://meet.google.com/esh-ikho-class',
    },
  ];

  return { success: true, liveSessions: list };
}

/**
 * Requests or activates temporary revision access to course videos and PDFs after course ends
 * so students can revise before their final exams.
 */
export async function requestRevisionAccessAction({
  courseId,
  examDate,
  reason,
}: {
  courseId: string;
  examDate: string;
  reason: string;
}): Promise<{
  success: boolean;
  message?: string;
  revisionAccessExpiresAt?: string;
  error?: string;
}> {
  try {
    const session = await auth();
    const sessionUser = session?.user as { id?: string; email?: string } | undefined;
    if (!sessionUser?.id) {
      return { success: false, error: 'রিভিশন এক্সেস অনুরোধ করতে অনুগ্রহ করে লগইন করুন।' };
    }

    await dbConnect();

    let userId = sessionUser.id;
    if (typeof userId === 'string' && userId.includes('@')) {
      const u = await User.findOne({ email: userId }).select('_id').lean() as any;
      if (u) userId = u._id.toString();
    }

    const enrollment = await Enrollment.findOne({
      userId,
      courseId,
      paymentStatus: { $in: ['success', 'GRANTED', 'granted'] },
    });

    if (!enrollment) {
      return { success: false, error: 'এই কোর্সে আপনার কোনো সক্রিয় রেজিস্ট্রেশন রেকর্ড পাওয়া যায়নি।' };
    }

    let revisionDays = 14;
    try {
      const course = await Course.findById(courseId).select('revisionAccessDays allowRevisionAccess').lean() as any;
      if (course?.allowRevisionAccess === false) {
        return { success: false, error: 'এই কোর্সের ইন্সট্রাক্টর কোর্স পরবর্তী অতিরিক্ত রিভিশন এক্সেস অনুমোদন করেননি।' };
      }
      if (course?.revisionAccessDays) revisionDays = course.revisionAccessDays;
    } catch {}

    const expiresAt = new Date(Date.now() + revisionDays * 24 * 60 * 60 * 1000);

    enrollment.isRevisionGranted = true;
    enrollment.revisionAccessExpiresAt = expiresAt;
    enrollment.revisionRequestStatus = 'APPROVED';
    enrollment.revisionReason = reason?.trim() || 'Final exam preparation';
    enrollment.revisionExamDate = examDate?.trim() || '';
    await enrollment.save();

    // Create notification for student
    try {
      const Notification = (await import('@/models/Notification')).default;
      await Notification.create({
        recipientId: userId,
        title: 'কোর্স রিভিশন এক্সেস অনুমোদিত হয়েছে',
        message: `আপনার ফাইনাল পরীক্ষার প্রস্তুতির সুবিধার্থে পরবর্তী ${revisionDays} দিনের জন্য কোর্স ভিডিও এবং লেকচার PDF এক্সেস চালু করা হয়েছে।`,
        type: 'REVISION_ACCESS_UPDATE',
        priority: 'HIGH',
        priorityWeight: 3,
        actionUrl: `/courses/${courseId}`,
        badgeLabel: 'Revision Active',
      });

      // Push real-time alert via SSE
      sendRealtimeNotification(userId.toString(), {
        title: 'কোর্স রিভিশন এক্সেস অনুমোদিত হয়েছে',
        message: `আপনার ফাইনাল পরীক্ষার প্রস্তুতির সুবিধার্থে পরবর্তী ${revisionDays} দিনের জন্য কোর্স ভিডিও এবং লেকচার PDF এক্সেস চালু করা হয়েছে।`,
        type: 'REVISION_ACCESS_UPDATE',
        priority: 'HIGH',
        actionUrl: `/courses/${courseId}`,
        badgeLabel: 'Revision Active',
        createdAt: new Date().toISOString(),
      });
    } catch (notifErr) {
      console.warn('Could not dispatch revision notification:', notifErr);
    }

    revalidatePath(`/courses/${courseId}`);
    revalidatePath('/student');

    return {
      success: true,
      message: `আপনার পরীক্ষার প্রস্তুতির জন্য সফলভাবে ${revisionDays} দিনের রিভিশন এক্সেস প্রদান করা হয়েছে।`,
      revisionAccessExpiresAt: expiresAt.toISOString(),
    };
  } catch (error: any) {
    console.error('Error requesting revision access:', error);
    return { success: false, error: error.message || 'রিভিশন এক্সেস অনুরোধ করতে ব্যর্থ হয়েছে।' };
  }
}

/**
 * Tracks student video playback heartbeat, recording exact drop-off timestamps
 * and progress checkpoints so instructors can analyze video drop-off rates.
 */
export async function trackLessonHeartbeatAction({
  courseId,
  lessonId,
  currentTimestamp,
  videoDuration,
}: {
  courseId: string;
  lessonId: string;
  currentTimestamp: number;
  videoDuration: number;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth();
    const sessionUser = session?.user as { id?: string; email?: string } | undefined;
    if (!sessionUser?.id) return { success: false, error: 'Not authenticated' };

    await dbConnect();

    let userId = sessionUser.id;
    if (typeof userId === 'string' && userId.includes('@')) {
      const u = await User.findOne({ email: userId }).select('_id').lean() as any;
      if (u) userId = u._id.toString();
    }

    const curSec = Math.max(0, Math.floor(currentTimestamp));
    const totalSec = Math.max(0, Math.floor(videoDuration));
    const mins = Math.floor(curSec / 60);
    const secs = curSec % 60;
    const formatted = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    const dropOffRate = totalSec > 0 ? Math.min(100, Math.round((curSec / totalSec) * 100)) : 0;
    const isCompleted = dropOffRate >= 85;

    const existing = await LessonProgress.findOne({ userId, courseId, lessonId });

    if (existing) {
      existing.watchTime = Math.max(existing.watchTime || 0, curSec);
      existing.stoppedTimestamp = curSec;
      existing.stoppedAtFormatted = formatted;
      if (totalSec > 0) existing.videoDuration = totalSec;
      existing.dropOffRate = dropOffRate;
      if (isCompleted) existing.isCompleted = true;
      existing.lastAccessedAt = new Date();
      await existing.save();
    } else {
      await LessonProgress.create({
        userId,
        courseId,
        lessonId,
        isCompleted,
        watchTime: curSec,
        stoppedTimestamp: curSec,
        stoppedAtFormatted: formatted,
        videoDuration: totalSec,
        dropOffRate,
        lastAccessedAt: new Date(),
      });
    }

    return { success: true };
  } catch (error: any) {
    // Non-blocking for video playback
    return { success: false, error: error.message };
  }
}

