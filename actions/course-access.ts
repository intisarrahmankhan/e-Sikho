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

export interface CourseAccessResult {
  isLoggedIn: boolean;
  isEnrolled: boolean;
  canAccessAll: boolean; // true if enrolled, admin, superadmin, or instructor
  userRole?: string;
  completedLessonIds: string[];
  totalLessons: number;
  progressPercentage: number;
}

export interface CourseResourceItem {
  id: string;
  title: string;
  titleEn?: string;
  fileType: 'pdf' | 'zip' | 'code' | 'doc';
  fileSize: string;
  downloadUrl: string;
  isFreePreview?: boolean;
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
}

/**
 * Checks whether the current session has access to a specific course
 * and returns their lesson progress.
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
    }).lean();

    const isEnrolled = !!enrollment;
    const canAccessAll = isEnrolled || isStaff;

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
    } else {
      try {
        const dbCourse = await Course.findById(courseId).select('totalLessons').lean() as any;
        if (dbCourse?.totalLessons) totalLessons = dbCourse.totalLessons;
      } catch {}
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
