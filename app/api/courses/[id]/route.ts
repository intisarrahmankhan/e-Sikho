import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import Course from '@/models/Course';
import Module from '@/models/Module';
import Lesson from '@/models/Lesson';
import Instructor from '@/models/Instructor';

export async function GET(_: Request, { params }: { params: { id: string } }) {
  await dbConnect();
  try {
    const course = await Course.findOne({ _id: params.id, approvalStatus: 'APPROVED' })
      .populate('instructor')
      .lean();
      
    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    const courseModules = await Module.find({ courseId: course._id }).sort({ order: 1 }).lean();
    const modulesWithLessons = await Promise.all(courseModules.map(async (m: any) => {
      const lessons = await Lesson.find({ moduleId: m._id }).sort({ order: 1 }).lean();
      return { ...m, lessons };
    }));

    return NextResponse.json({ ...course, modules: modulesWithLessons });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid ID or DB error' }, { status: 400 });
  }
}

