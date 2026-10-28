'use server';

import { auth } from '@/auth';
import dbConnect from '@/lib/mongoose';
import Course from '@/models/Course';
import Lesson from '@/models/Lesson';
import { getCourseAccessDetails } from '@/actions/course-access';
import {
  parseBunnyVideoUrl,
  generateBunnySignedEmbedUrl,
  BUNNY_STREAM_LIBRARY_ID,
} from '@/lib/bunny';
import Module from '@/models/Module';
import { isValidMongoObjectId } from '@/lib/auth-helpers';

export interface SignedPlaybackResult {
  success: boolean;
  isLocked?: boolean;
  error?: string;
  playbackUrl?: string;
  videoType?: 'bunny' | 'youtube' | 'vimeo' | 'html5';
  title?: string;
  watermark?: {
    studentId: string;
    studentEmail: string;
    studentName: string;
    timestamp: string;
  };
}

/**
 * Validates enrolled student session and generates a secure DRM / signed video playback link
 * with dynamic anti-piracy student watermark data.
 */
export async function getSignedVideoPlaybackAction(
  courseId: string,
  lessonId: string
): Promise<SignedPlaybackResult> {
  try {
    const session = await auth();
    const sessionUser = session?.user as
      | { id?: string; name?: string; email?: string; role?: string }
      | undefined;

    if (!sessionUser?.email) {
      return {
        success: false,
        isLocked: true,
        error: 'লগইন আবশ্যক। সুরক্ষিত ভিডিও ক্লাস দেখতে অনুগ্রহ করে লগইন করুন।',
      };
    }

    // 1. Verify access permissions (enrolled, free preview, or staff)
    const access = await getCourseAccessDetails(courseId);

    // A course entitlement must only unlock lessons belonging to that course.
    if (!isValidMongoObjectId(courseId) || !isValidMongoObjectId(lessonId)) {
      return { success: false, error: 'Lesson not found.' };
    }
    await dbConnect();
    const lesson = await Lesson.findById(lessonId).lean();
    const moduleRecord = lesson && await Module.findOne({ _id: lesson.moduleId, courseId }).lean();
    if (!lesson || !moduleRecord) return { success: false, error: 'Lesson not found in this course.' };
    const course = await Course.findById(courseId).lean();
    if (!course || (course.status !== 'PUBLISHED' && !access.canAccessAll)) {
      return { success: false, isLocked: true, error: 'Course is not published.' };
    }

    const isUnlocked = lesson?.isFree || access.canAccessAll;
    if (!isUnlocked) {
      return {
        success: false,
        isLocked: true,
        error: 'এই লেকচারটি শুধুমাত্র ভর্তিকৃত শিক্ষার্থীদের জন্য উন্মুক্ত।',
      };
    }

    const rawUrl = lesson.videoUrl || '';
    if (!rawUrl && !lesson.bunnyVideoId) return { success: false, error: 'No video has been added to this lesson.' };
    const bunnyParsed =
      (lesson?.bunnyVideoId && {
        libraryId: lesson?.bunnyLibraryId || BUNNY_STREAM_LIBRARY_ID,
        videoId: lesson.bunnyVideoId,
      }) ||
      parseBunnyVideoUrl(rawUrl);

    let playbackUrl = rawUrl;
    let videoType: 'bunny' | 'youtube' | 'vimeo' | 'html5' = 'html5';

    if (bunnyParsed) {
      videoType = 'bunny';
      // Generate signed, time-limited tokenized embed URL
      const { embedUrl } = generateBunnySignedEmbedUrl(
        bunnyParsed.libraryId,
        bunnyParsed.videoId,
        14400 // 4 hours access window
      );
      playbackUrl = embedUrl;
    } else if (rawUrl.includes('youtube.com') || rawUrl.includes('youtu.be')) {
      videoType = 'youtube';
      const url = new URL(rawUrl);
      const videoId = url.hostname === 'youtu.be' ? url.pathname.slice(1) : url.searchParams.get('v') || url.pathname.split('/').pop();
      playbackUrl = `https://www.youtube.com/embed/${encodeURIComponent(videoId || '')}`;
    } else if (rawUrl.includes('vimeo.com')) {
      videoType = 'vimeo';
      const videoId = new URL(rawUrl).pathname.split('/').filter(Boolean).pop();
      playbackUrl = `https://player.vimeo.com/video/${encodeURIComponent(videoId || '')}`;
    }

    // Generate anti-piracy student watermark
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
      playbackUrl,
      videoType,
      title: lesson?.title || 'ভিডিও লেকচার',
      watermark,
    };
  } catch (error: any) {
    console.error('Error generating signed video playback:', error);
    return {
      success: false,
      error: error.message || 'ভিডিও প্লেব্যাক তৈরি করতে ব্যর্থ হয়েছে।',
    };
  }
}
