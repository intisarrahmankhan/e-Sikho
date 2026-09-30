import React, { Suspense } from "react";
import { CoursesCatalog } from "@/components/courses/CoursesCatalog";
import { Course as CourseType } from "@/lib/courses-data";
import dbConnect from '@/lib/mongoose';
import Course from '@/models/Course';
import Module from '@/models/Module';
import Lesson from '@/models/Lesson';
import Instructor from '@/models/Instructor';

export const dynamic = 'force-dynamic';

export default async function CoursesPage() {
  let additionalCourses: CourseType[] = [];

  try {
    // Try fetching from MongoDB
    await dbConnect();
    const submittedCourses = await Course.find({ approvalStatus: 'APPROVED' })
      .populate('instructor')
      .lean();

    // In Mongoose, we have to fetch modules and lessons separately if we didn't setup virtual populates
    additionalCourses = await Promise.all(submittedCourses.map(async (course: any) => {
      const courseModules = await Module.find({ courseId: course._id }).sort({ order: 1 }).lean();
      const modulesWithLessons = await Promise.all(courseModules.map(async (m: any) => {
        const lessons = await Lesson.find({ moduleId: m._id }).sort({ order: 1 }).lean();
        return {
          id: m._id.toString(),
          title: m.title,
          duration: m.duration,
          lessons: lessons.map((l: any) => ({
            id: l._id.toString(),
            title: l.title,
            duration: l.duration,
            isFree: l.isFree,
          }))
        };
      }));

      return {
        id: course._id.toString(),
        title: course.title,
        tagline: course.tagline,
        description: course.description,
        category: (['web-dev', 'data-science', 'app-dev', 'programming', 'system-design'].includes(course.category)
          ? course.category : 'programming') as CourseType['category'],
        categoryBangla: course.categoryBangla,
        level: course.level as CourseType['level'],
        rating: course.rating,
        totalRatings: course.totalRatings,
        studentsEnrolled: course.studentsEnrolled,
        duration: course.duration,
        totalLessons: course.totalLessons,
        price: course.price,
        originalPrice: course.originalPrice,
        thumbnailUrl: course.thumbnailUrl,
        instructor: course.instructor ? {
          id: course.instructor._id.toString(),
          name: course.instructor.name,
          role: course.instructor.role || "ইন্সট্রাক্টর",
          avatar: course.instructor.avatar || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80",
          bio: course.instructor.bio || "",
        } : { id: '', name: 'Unknown', role: 'Instructor', avatar: '', bio: '' },
        learningOutcomes: typeof course.learningOutcomes === 'string' ? JSON.parse(course.learningOutcomes) : (course.learningOutcomes || []),
        prerequisites: typeof course.prerequisites === 'string' ? JSON.parse(course.prerequisites) : (course.prerequisites || []),
        modules: modulesWithLessons,
      };
    }));
  } catch (error) {
    // Graceful fallback when MongoDB is unavailable
    console.warn("Notice: MongoDB unavailable. Displaying static course catalog.");
  }

  return (
    <Suspense fallback={
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-200 border-t-primary-600" />
      </div>
    }>
      <CoursesCatalog additionalCourses={additionalCourses} />
    </Suspense>
  );
}
