import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/mongoose';
import Course from '@/models/Course';
import Module from '@/models/Module';
import Lesson from '@/models/Lesson';
import '@/models/Instructor';
import { COURSES_DATA } from '@/lib/courses-data';
import { getCourseAccessDetails } from '@/actions/course-access';
import { parseBunnyVideoUrl, generateBunnySignedEmbedUrl } from '@/lib/bunny';

function parseStringList(val: any): string[] {
  if (Array.isArray(val)) return val.map(String).filter(Boolean);
  if (typeof val === 'string' && val.trim()) {
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean);
      if (typeof parsed === 'string' && parsed.trim()) return [parsed.trim()];
    } catch {
      return val.split(/\r?\n|,/).map((s: string) => s.trim()).filter(Boolean);
    }
  }
  return [];
}

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const courseId = params?.id;
  if (!courseId) {
    return NextResponse.json({ error: 'Course ID is required' }, { status: 400 });
  }

  // Check if it matches a static course ID
  const staticCourse = COURSES_DATA.find((c) => c.id === courseId);

  try {
    await dbConnect();

    let course: any = null;
    if (mongoose.Types.ObjectId.isValid(courseId)) {
      course = await Course.findById(courseId).populate('instructor').lean();
    }

    if (!course) {
      if (staticCourse) {
        return NextResponse.json(staticCourse);
      }
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    if (course.status !== 'PUBLISHED') {
      const access = await getCourseAccessDetails(courseId);
      if (!access.canAccessAll) return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    const courseModules = await Module.find({ courseId: course._id }).sort({ order: 1 }).lean();
    const courseLessons = courseModules.length
      ? await Lesson.find({ moduleId: { $in: courseModules.map((m) => m._id) } }).sort({ order: 1 }).lean()
      : [];
    const lessonsByModule = new Map<string, typeof courseLessons>();
    for (const lesson of courseLessons) {
      const key = String(lesson.moduleId);
      if (!lessonsByModule.has(key)) lessonsByModule.set(key, []);
      lessonsByModule.get(key)!.push(lesson);
    }
    const modulesWithLessons = courseModules.map((m: any) => {
        const lessons = lessonsByModule.get(String(m._id)) || [];
        return {
          id: m._id.toString(),
          title: m.title,
          duration: m.duration || '',
          lessons: lessons.map((l: any) => ({
            id: l._id.toString(),
            title: l.title,
            duration: l.duration || '',
            isFree: !!l.isFree,
            type: l.type || 'VIDEO',
            quizId: l.quizId?.toString(),
            projectInstructions: l.projectInstructions || '',
            maxMarks: l.maxMarks,
            passMarks: l.passMarks,
            githubRequired: l.githubRequired,
            liveUrlRequired: l.liveUrlRequired,
          })),
        };
      });

    const formattedInstructor = course.instructor
      ? {
          id: course.instructor._id?.toString() || '',
          name: course.instructor.name || 'e-Shikho Faculty',
          role: course.instructor.role || 'ইন্সট্রাক্টর',
          avatar:
            course.instructor.avatar ||
            '/images/avatar-placeholder.svg',
          bio: course.instructor.bio || '',
        }
      : {
          id: '',
          name: 'e-Shikho Faculty',
          role: 'ইন্সট্রাক্টর',
          avatar:
            '/images/avatar-placeholder.svg',
          bio: '',
        };

    const modules = modulesWithLessons;

    const preview = parseBunnyVideoUrl(course.previewVideoUrl);
    const previewVideoUrl = preview ? generateBunnySignedEmbedUrl(preview.libraryId, preview.videoId, 600).embedUrl : course.previewVideoUrl || '';

    return NextResponse.json({
      ...course,
      previewVideoUrl,
      id: course._id.toString(),
      learningOutcomes: parseStringList(course.learningOutcomes),
      prerequisites: parseStringList(course.prerequisites),
      instructor: formattedInstructor,
      modules,
    });
  } catch (error) {
    if (staticCourse) {
      return NextResponse.json(staticCourse);
    }
    return NextResponse.json({ error: 'Failed to fetch course details' }, { status: 500 });
  }
}


