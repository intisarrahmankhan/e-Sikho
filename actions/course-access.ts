'use server';

import { auth } from '@/auth';
import dbConnect from '@/lib/mongoose';
import Enrollment from '@/models/Enrollment';
import LessonProgress from '@/models/LessonProgress';
import Course from '@/models/Course';
import Exam from '@/models/Exam';
import User from '@/models/User';
import Module from '@/models/Module';
import Lesson from '@/models/Lesson';
import LiveSession from '@/models/LiveSession';
import { isValidMongoObjectId } from '@/lib/auth-helpers';
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
    // Staff and course creator always have full access.
    // If course has ended or enrollment expired, student only has access IF temporary revision access is active!
    // Otherwise if enrolled and not expired, student has full access.
    const isCreator = !!(dbCourse?.createdById && dbCourse.createdById.toString() === userId.toString());
    let canAccessAll = isStaff || isCreator;
    if (isEnrolled) {
      if (isCourseEnded || isEnrollmentExpired) {
        canAccessAll = isStaff || isCreator || isRevisionAccessActive;
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
    if (dbCourse) {
      const modules = await Module.find({ courseId }).select('_id').lean();
      totalLessons = await Lesson.countDocuments({ moduleId: { $in: modules.map((module) => module._id) } });
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

async function canTrackLesson(courseId: string, lessonId: string) {
  if (!isValidMongoObjectId(courseId) || !isValidMongoObjectId(lessonId)) return false;
  const access = await getCourseAccessDetails(courseId);
  if (!access.canAccessAll) return false;
  const lesson = await Lesson.findById(lessonId).select('moduleId').lean();
  return !!(lesson && await Module.exists({ _id: lesson.moduleId, courseId }));
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

    if (!await canTrackLesson(courseId, lessonId)) return { error: 'Course access is required for this lesson.' };

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
  const list: CourseResourceItem[] = [];

  const access = await getCourseAccessDetails(courseId);
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
          if (pl.pdfUrl && (pl.isFree || access.canAccessAll)) {
            list.unshift({
              id: pl._id.toString(),
              title: pl.pdfName || `${pl.title} (লেকচার স্লাইড / PDF)`,
              titleEn: pl.pdfName || `${pl.title} (Lecture Slide / PDF)`,
              fileType: 'pdf',
              fileSize: '',
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
  try {
    await dbConnect();
    const access = await getCourseAccessDetails(courseId);
    if (!access.canAccessAll) return { success: true, liveSessions: [] };
    const sessions = await LiveSession.find({ courseId }).sort({ scheduledTime: -1 }).lean();
    return { success: true, liveSessions: sessions.map((session) => ({
      id: session._id.toString(), courseId: session.courseId, title: session.title,
      titleEn: session.titleEn, instructorName: session.instructorName,
      scheduledTime: new Date(session.scheduledTime).toISOString(), duration: session.duration,
      status: session.status, meetUrl: session.meetUrl, recordingUrl: session.recordingUrl,
    })) };
  } catch {
    return { success: false, liveSessions: [] };
  }
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

    if (!Number.isFinite(currentTimestamp) || !Number.isFinite(videoDuration) || videoDuration <= 0 || currentTimestamp < 0 || currentTimestamp > videoDuration) return { success: false, error: 'Invalid playback position.' };
    if (!await canTrackLesson(courseId, lessonId)) return { success: false, error: 'Course access is required for this lesson.' };

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

