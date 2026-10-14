import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/mongoose';
import Course from '@/models/Course';
import Module from '@/models/Module';
import Lesson from '@/models/Lesson';
import '@/models/Instructor';
import { COURSES_DATA } from '@/lib/courses-data';

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

    const courseModules = await Module.find({ courseId: course._id }).sort({ order: 1 }).lean();
    const modulesWithLessons = await Promise.all(
      courseModules.map(async (m: any) => {
        const lessons = await Lesson.find({ moduleId: m._id }).sort({ order: 1 }).lean();
        return {
          id: m._id.toString(),
          title: m.title,
          duration: m.duration || '',
          lessons: lessons.map((l: any) => ({
            id: l._id.toString(),
            title: l.title,
            duration: l.duration || '',
            isFree: !!l.isFree,
            videoUrl: l.videoUrl || '',
          })),
        };
      })
    );

    const formattedInstructor = course.instructor
      ? {
          id: course.instructor._id?.toString() || '',
          name: course.instructor.name || 'e-Shikho Faculty',
          role: course.instructor.role || 'ইন্সট্রাক্টর',
          avatar:
            course.instructor.avatar ||
            'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
          bio: course.instructor.bio || '',
        }
      : {
          id: '',
          name: 'e-Shikho Faculty',
          role: 'ইন্সট্রাক্টর',
          avatar:
            'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
          bio: '',
        };

    const modules =
      modulesWithLessons.length > 0
        ? modulesWithLessons
        : Array.isArray(course.modules)
        ? course.modules
        : staticCourse?.modules || [];

    return NextResponse.json({
      ...course,
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


