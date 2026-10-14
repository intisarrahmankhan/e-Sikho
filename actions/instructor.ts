'use server';

import { auth } from '@/auth';
import dbConnect from '@/lib/mongoose';
import Course from '@/models/Course';
import Instructor from '@/models/Instructor';
import Module from '@/models/Module';
import Lesson from '@/models/Lesson';
import User from '@/models/User';
import { uploadToR2 } from '@/lib/r2';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import { revalidatePath } from 'next/cache';

async function saveThumbnail(file: File | null, existingUrl = '') {
  if (existingUrl) return existingUrl;
  if (!file || file.size === 0) return '';
  if (!file.type.startsWith('image/')) throw new Error('Thumbnail must be an image.');
  if (file.size > 5 * 1024 * 1024) throw new Error('Thumbnail must be smaller than 5MB.');
  const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;
  const directory = path.join(process.cwd(), 'public', 'uploads');
  await mkdir(directory, { recursive: true });
  await writeFile(path.join(directory, filename), Buffer.from(await file.arrayBuffer()));
  return `/uploads/${filename}`;
}

async function handleVideoUpload(file: File | null, existingUrl: string): Promise<string> {
  if (existingUrl && existingUrl.trim()) return existingUrl.trim();
  if (!file || file.size === 0) return '';

  const buffer = Buffer.from(await file.arrayBuffer());

  // Attempt R2 upload if credentials exist
  if (process.env.CLOUDFLARE_R2_ACCOUNT_ID && process.env.CLOUDFLARE_R2_ACCESS_KEY_ID) {
    try {
      const videoUrl = await uploadToR2(buffer, file.name, file.type || 'video/mp4');
      if (videoUrl) return videoUrl;
    } catch (r2Error) {
      console.warn('R2 upload failed, falling back to local storage:', r2Error);
    }
  }

  // Graceful local fallback to public/uploads/videos
  const extension = file.name.split('.').pop()?.toLowerCase() || 'mp4';
  const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}-${cleanName}`;
  const directory = path.join(process.cwd(), 'public', 'uploads', 'videos');
  await mkdir(directory, { recursive: true });
  await writeFile(path.join(directory, filename), buffer);
  return `/uploads/videos/${filename}`;
}

export async function createCourse(formData: FormData) {
  const session = await auth();
  const user = session?.user as { id?: string; role?: string; name?: string; image?: string } | undefined;
  if (!user?.id || (user.role !== 'INSTRUCTOR' && user.role !== 'SUPERADMIN' && user.role !== 'ADMIN')) {
    return { error: 'Only approved instructors and administrators can create courses.' };
  }

  const title = String(formData.get('title') || '').trim();
  const description = String(formData.get('description') || '').trim();
  const lessonTitle = String(formData.get('lessonTitle') || '').trim();
  const lessonContent = String(formData.get('lessonContent') || '').trim();
  const price = Number(formData.get('price') || 0);

  // Video fields
  let lessonVideoUrl = String(formData.get('videoUrl') || formData.get('lessonVideoUrl') || '').trim();
  const lessonVideoFile = formData.get('lessonVideo') as File | null;

  let previewVideoUrl = String(formData.get('previewVideoUrl') || '').trim();
  const previewVideoFile = formData.get('previewVideo') as File | null;

  if (!title || !description || !lessonTitle || !lessonContent) {
    return { error: 'Complete the course title, description, and first lesson fields.' };
  }
  if (!Number.isInteger(price) || price < 0) {
    return { error: 'Price must be a non-negative whole number.' };
  }

  try {
    await dbConnect();

    // Upload videos if files are provided
    if (lessonVideoFile && lessonVideoFile.size > 0) {
      lessonVideoUrl = await handleVideoUpload(lessonVideoFile, '');
    }

    if (previewVideoFile && previewVideoFile.size > 0) {
      previewVideoUrl = await handleVideoUpload(previewVideoFile, '');
    }

    const thumbnailFile = formData.get('thumbnail') as File | null;
    const existingThumbUrl = String(formData.get('thumbnailUrl') || '');
    const thumbnailUrl = await saveThumbnail(thumbnailFile, existingThumbUrl) ||
      'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=800&auto=format&fit=crop';

    const thumbnailEnFile = formData.get('thumbnailEn') as File | null;
    const existingThumbEnUrl = String(formData.get('thumbnailUrlEn') || '');
    const thumbnailUrlEn = await saveThumbnail(thumbnailEnFile, existingThumbEnUrl);

    const titleEn = String(formData.get('titleEn') || '').trim();
    const taglineEn = String(formData.get('taglineEn') || '').trim();
    const descriptionEn = String(formData.get('descriptionEn') || '').trim();

    let instructor = await Instructor.findOne({ name: user.name });
    if (!instructor) {
      instructor = await Instructor.create({
        name: user.name || 'Instructor',
        role: 'Instructor',
        avatar: user.image || '',
        bio: 'e-Shikho অনুমোদিত ইন্সট্রাক্টর',
      });
    }

    const course = await Course.create({
      title,
      titleEn: titleEn || undefined,
      tagline: String(formData.get('tagline') || title),
      taglineEn: taglineEn || undefined,
      description,
      descriptionEn: descriptionEn || undefined,
      category: String(formData.get('category') || 'general'),
      categoryBangla: String(formData.get('categoryBangla') || formData.get('category') || 'সাধারণ'),
      level: String(formData.get('level') || 'বিগিনার'),
      rating: 0,
      totalRatings: 0,
      studentsEnrolled: 0,
      duration: String(formData.get('duration') || '1 hour'),
      totalLessons: 1,
      price,
      originalPrice: price,
      thumbnailUrl,
      thumbnailUrlEn: thumbnailUrlEn || undefined,
      previewVideoUrl,
      instructorId: instructor._id,
      createdById: user.id,
      approvalStatus: 'PENDING_REVIEW',
      submittedAt: new Date(),
      learningOutcomes: JSON.stringify([]),
      prerequisites: JSON.stringify([]),
    });

    const courseModule = await Module.create({
      title: String(formData.get('moduleTitle') || 'মডিউল ১: ভূমিকা ও পরিচিতি'),
      duration: '১ ঘণ্টা',
      order: 0,
      courseId: course._id,
    });

    await Lesson.create({
      title: lessonTitle,
      content: lessonContent,
      duration: String(formData.get('lessonDuration') || '15:00'),
      isFree: formData.get('isFree') === 'true' || formData.get('isFree') === 'on' || true,
      order: 0,
      moduleId: courseModule._id,
      videoUrl: lessonVideoUrl,
    });

    revalidatePath('/instructor');
    revalidatePath('/admin/dashboard');
    return { success: true, courseId: course._id.toString() };
  } catch (error) {
    console.error('Course creation error:', error);
    return { error: error instanceof Error ? error.message : 'Could not submit the course.' };
  }
}

export async function addCourseModule(courseId: string, title: string, duration = '১ ঘণ্টা') {
  const session = await auth();
  const user = session?.user as { id?: string; role?: string } | undefined;
  if (!user?.id || user.role !== 'INSTRUCTOR') return { error: 'Unauthorized. Instructors only.' };

  if (!courseId || !title.trim()) {
    return { error: 'Course ID and Module title are required.' };
  }

  try {
    await dbConnect();
    const course = await Course.findById(courseId);
    if (!course) return { error: 'Course not found.' };

    const moduleCount = await Module.countDocuments({ courseId });
    const newModule = await Module.create({
      title: title.trim(),
      duration: duration.trim(),
      order: moduleCount,
      courseId: course._id,
    });

    revalidatePath('/instructor');
    revalidatePath(`/instructor/courses/${courseId}/lectures`);
    return { success: true, module: JSON.parse(JSON.stringify(newModule)) };
  } catch (error: any) {
    console.error('Error adding module:', error);
    return { error: error.message || 'Failed to add module.' };
  }
}

export async function addCourseLecture(formData: FormData) {
  const session = await auth();
  const user = session?.user as { id?: string; role?: string } | undefined;
  if (!user?.id || user.role !== 'INSTRUCTOR') return { error: 'Unauthorized. Instructors only.' };

  const courseId = String(formData.get('courseId') || '').trim();
  let moduleId = String(formData.get('moduleId') || '').trim();
  const title = String(formData.get('title') || '').trim();
  const content = String(formData.get('content') || '').trim();
  const duration = String(formData.get('duration') || '15:00').trim();
  const isFree = formData.get('isFree') === 'true' || formData.get('isFree') === 'on';

  let videoUrl = String(formData.get('videoUrl') || '').trim();
  const videoFile = formData.get('videoFile') as File | null;

  if (!courseId || !title) {
    return { error: 'লেকচারের নাম ও কোর্স আইডি আবশ্যক।' };
  }

  try {
    await dbConnect();
    const course = await Course.findById(courseId);
    if (!course) return { error: 'Course not found.' };

    // Video handling
    if (videoFile && videoFile.size > 0) {
      videoUrl = await handleVideoUpload(videoFile, '');
    }

    // Ensure a module exists
    if (!moduleId) {
      let firstMod = await Module.findOne({ courseId }).sort({ order: 1 });
      if (!firstMod) {
        firstMod = await Module.create({
          courseId: course._id,
          title: 'মডিউল ১: সাধারণ লেকচারসমূহ',
          duration: '১ ঘণ্টা',
          order: 0,
        });
      }
      moduleId = firstMod._id.toString();
    }

    const lessonCount = await Lesson.countDocuments({ moduleId });

    const lesson = await Lesson.create({
      title,
      content,
      duration,
      isFree,
      order: lessonCount,
      moduleId,
      videoUrl,
    });

    // Update course totalLessons
    const modules = await Module.find({ courseId }).select('_id');
    const moduleIds = modules.map((m) => m._id);
    const totalLessons = await Lesson.countDocuments({ moduleId: { $in: moduleIds } });
    course.totalLessons = totalLessons;
    await course.save();

    revalidatePath('/instructor');
    revalidatePath(`/instructor/courses/${courseId}/lectures`);
    revalidatePath(`/courses/${courseId}`);

    return { success: true, lesson: JSON.parse(JSON.stringify(lesson)) };
  } catch (error: any) {
    console.error('Error adding lecture:', error);
    return { error: error.message || 'Failed to add lecture.' };
  }
}

export async function updateCourseLecture(formData: FormData) {
  const session = await auth();
  const user = session?.user as { id?: string; role?: string } | undefined;
  if (!user?.id || user.role !== 'INSTRUCTOR') return { error: 'Unauthorized. Instructors only.' };

  const lessonId = String(formData.get('lessonId') || '').trim();
  const courseId = String(formData.get('courseId') || '').trim();
  const title = String(formData.get('title') || '').trim();
  const content = String(formData.get('content') || '').trim();
  const duration = String(formData.get('duration') || '').trim();
  const isFree = formData.get('isFree') === 'true' || formData.get('isFree') === 'on';

  let videoUrl = String(formData.get('videoUrl') || '').trim();
  const videoFile = formData.get('videoFile') as File | null;

  if (!lessonId || !title) {
    return { error: 'Lesson ID and title are required.' };
  }

  try {
    await dbConnect();
    const lesson = await Lesson.findById(lessonId);
    if (!lesson) return { error: 'Lesson not found.' };

    if (videoFile && videoFile.size > 0) {
      videoUrl = await handleVideoUpload(videoFile, '');
    }

    lesson.title = title;
    if (content !== undefined) lesson.content = content;
    if (duration) lesson.duration = duration;
    lesson.isFree = isFree;
    if (videoUrl) lesson.videoUrl = videoUrl;

    await lesson.save();

    revalidatePath('/instructor');
    if (courseId) {
      revalidatePath(`/instructor/courses/${courseId}/lectures`);
      revalidatePath(`/courses/${courseId}`);
    }

    return { success: true, lesson: JSON.parse(JSON.stringify(lesson)) };
  } catch (error: any) {
    console.error('Error updating lecture:', error);
    return { error: error.message || 'Failed to update lecture.' };
  }
}

export async function deleteCourseLecture(lessonId: string, courseId: string) {
  const session = await auth();
  const user = session?.user as { id?: string; role?: string } | undefined;
  if (!user?.id || user.role !== 'INSTRUCTOR') return { error: 'Unauthorized.' };

  try {
    await dbConnect();
    await Lesson.findByIdAndDelete(lessonId);

    if (courseId) {
      const modules = await Module.find({ courseId }).select('_id');
      const moduleIds = modules.map((m) => m._id);
      const totalLessons = await Lesson.countDocuments({ moduleId: { $in: moduleIds } });
      await Course.findByIdAndUpdate(courseId, { totalLessons });

      revalidatePath('/instructor');
      revalidatePath(`/instructor/courses/${courseId}/lectures`);
      revalidatePath(`/courses/${courseId}`);
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error deleting lecture:', error);
    return { error: error.message || 'Failed to delete lecture.' };
  }
}

export async function getCourseCurriculum(courseId: string) {
  try {
    await dbConnect();
    const course = await Course.findById(courseId).lean();
    if (!course) return { error: 'Course not found.' };

    const rawModules = await Module.find({ courseId }).sort({ order: 1 }).lean();
    const modules = await Promise.all(
      rawModules.map(async (mod: any) => {
        const lessons = await Lesson.find({ moduleId: mod._id }).sort({ order: 1 }).lean();
        return {
          ...mod,
          id: mod._id.toString(),
          _id: mod._id.toString(),
          lessons: lessons.map((l: any) => ({
            ...l,
            id: l._id.toString(),
            _id: l._id.toString(),
          })),
        };
      })
    );

    return {
      success: true,
      course: {
        ...course,
        id: (course as any)._id.toString(),
        _id: (course as any)._id.toString(),
        modules,
      },
    };
  } catch (error: any) {
    console.error('Error loading course curriculum:', error);
    return { error: error.message || 'Failed to load course curriculum.' };
  }
}

export async function switchToInstructorRole() {
  const session = await auth();
  const user = session?.user as { id?: string; name?: string; email?: string } | undefined;
  if (!user?.email) return { error: 'You must be logged in.' };

  try {
    await dbConnect();
    const dbUser = await User.findOneAndUpdate(
      { email: user.email },
      { role: 'INSTRUCTOR', status: 'APPROVED' },
      { new: true }
    );
    if (!dbUser) return { error: 'User not found.' };

    const existingInstructor = await Instructor.findOne({ name: dbUser.name });
    if (!existingInstructor) {
      await Instructor.create({
        name: dbUser.name,
        role: 'Instructor',
        avatar: dbUser.image || '',
        bio: 'e-Shikho অনুমোদিত ইন্সট্রাক্টর',
      });
    }

    revalidatePath('/instructor');
    revalidatePath('/student');
    return { success: true };
  } catch (error: any) {
    return { error: error.message || 'Failed to upgrade role.' };
  }
}
