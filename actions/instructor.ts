'use server';

import { auth } from '@/app/api/auth/[...nextauth]/route';

import dbConnect from '@/lib/mongoose';
import Course from '@/models/Course';
import Instructor from '@/models/Instructor';
import Module from '@/models/Module';
import Lesson from '@/models/Lesson';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import { revalidatePath } from 'next/cache';

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

async function saveThumbnail(file: File) {
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

export async function createCourse(formData: FormData) {
  const session = await auth();
  const user = session?.user as { id?: string; role?: string; name?: string } | undefined;
  if (!user?.id || user.role !== 'INSTRUCTOR') return { error: 'Only approved instructors can create courses.' };

  const title = String(formData.get('title') || '').trim();
  const description = String(formData.get('description') || '').trim();
  const lessonTitle = String(formData.get('lessonTitle') || '').trim();
  const lessonContent = String(formData.get('lessonContent') || '').trim();
  const price = Number(formData.get('price') || 0);
  if (!title || !description || !lessonTitle || !lessonContent) return { error: 'Complete the course and first lesson fields.' };
  if (!Number.isInteger(price) || price < 0) return { error: 'Price must be a non-negative whole number.' };

  try {
    await dbConnect();
    const thumbnailUrl = await saveThumbnail(formData.get('thumbnail') as File);
    const instructor = await Instructor.create({
      name: user.name || 'Instructor', role: 'Instructor', avatar: '', bio: 'e-Sikho instructor'
    });
    
    const course = await Course.create({
      title, tagline: String(formData.get('tagline') || title), description,
      category: String(formData.get('category') || 'general'), categoryBangla: String(formData.get('category') || 'General'),
      level: String(formData.get('level') || 'beginner'), rating: 0, totalRatings: 0, studentsEnrolled: 0,
      duration: String(formData.get('duration') || '1 hour'), totalLessons: 1, price, originalPrice: price,
      thumbnailUrl, instructorId: instructor._id, createdById: user.id, approvalStatus: 'PENDING_REVIEW', submittedAt: new Date(),
      learningOutcomes: JSON.stringify([]), prerequisites: JSON.stringify([]),
    });

    const module = await Module.create({
      title: String(formData.get('moduleTitle') || 'Course content'),
      duration: '1 hour',
      order: 0,
      courseId: course._id,
    });

    await Lesson.create({
      title: lessonTitle,
      content: lessonContent,
      duration: '30 minutes',
      isFree: true,
      order: 0,
      moduleId: module._id,
    });

    revalidatePath('/instructor');
    revalidatePath('/admin/dashboard');
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: error instanceof Error ? error.message : 'Could not submit the course.' };
  }
}
