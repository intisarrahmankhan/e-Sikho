'use server';

import dbConnect from '@/lib/mongoose';
import Course from '@/models/Course';

export async function getPublishedCoursesAction() {
  try {
    await dbConnect();
    const courses = await Course.find({ status: 'PUBLISHED', approvalStatus: 'APPROVED' })
      .select('title titleEn tagline taglineEn category categoryBangla duration totalLessons rating price originalPrice thumbnailUrl thumbnailUrlEn')
      .sort({ createdAt: -1 }).lean();
    return courses.map(({ _id, ...course }) => ({ ...course, id: _id.toString() }));
  } catch {
    return [];
  }
}
