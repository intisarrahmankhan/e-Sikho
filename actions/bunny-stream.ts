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
import { COURSES_DATA } from '@/lib/courses-data';

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

    // 2. Fetch lesson metadata
    let lesson: any = null;
    let fallbackVideoUrl = 'https://www.youtube.com/watch?v=wm5gMKuwSYk';

    await dbConnect();
    if (lessonId && lessonId.length === 24) {
      lesson = await Lesson.findById(lessonId).lean();
    }

    if (!lesson) {
      // Check static course data
      const staticCourse = COURSES_DATA.find((c) => c.id === courseId);
      if (staticCourse) {
        for (const mod of staticCourse.modules) {
          const found = mod.lessons.find((l) => l.id === lessonId);
          if (found) {
            lesson = found;
            break;
          }
        }
      }
    }

    const isUnlocked = lesson?.isFree || access.canAccessAll;
    if (!isUnlocked) {
      return {
        success: false,
        isLocked: true,
        error: 'এই লেকচারটি শুধুমাত্র ভর্তিকৃত শিক্ষার্থীদের জন্য উন্মুক্ত।',
      };
    }

    const rawUrl = lesson?.videoUrl || fallbackVideoUrl;
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
    } else if (rawUrl.includes('vimeo.com')) {
      videoType = 'vimeo';
    }

    // Generate anti-piracy student watermark
    const watermark = {
      studentId: sessionUser.id || 'std-unknown',
      studentEmail: sessionUser.email || 'student@e-shikho.com',
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
