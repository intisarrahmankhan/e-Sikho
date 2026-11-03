import React, { Suspense } from "react";
import { CoursesCatalog } from "@/components/courses/CoursesCatalog";
import { Course as CourseType } from "@/lib/courses-data";
import dbConnect from '@/lib/mongoose';
import Course from '@/models/Course';
import Instructor from '@/models/Instructor';
import { getPersonalizedRecommendationsAction } from '@/actions/recommendations';
import { getUserWishlistIdsAction } from '@/actions/wishlist';

export const dynamic = 'force-dynamic';

export default async function CoursesPage() {
  let additionalCourses: CourseType[] = [];
  let recommendationsRes: any = { success: false, recommendations: [], studentProfile: null };
  let userWishlistIds: string[] = [];

  try {
    // Try fetching from MongoDB
    await dbConnect();

    // Load the independent catalog and user-specific sections together.
    const [submittedCourses, recRes, wishlistRes] = await Promise.all([
      Course.find({ approvalStatus: 'APPROVED', status: 'PUBLISHED' })
        .populate('instructor')
        .lean(),
      getPersonalizedRecommendationsAction(4),
      getUserWishlistIdsAction(),
    ]);
    recommendationsRes = recRes;
    userWishlistIds = wishlistRes.wishlistIds || [];

    // Cards use course-level metadata; curriculum is loaded on the detail page.
    additionalCourses = submittedCourses.map((course: any) => {
      return {
        id: course._id.toString(),
        title: course.title,
        titleEn: course.titleEn,
        tagline: course.tagline,
        taglineEn: course.taglineEn,
        description: course.description,
        descriptionEn: course.descriptionEn,
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
        thumbnailUrlEn: course.thumbnailUrlEn,
        instructor: course.instructor ? {
          id: course.instructor._id.toString(),
          name: course.instructor.name,
          role: course.instructor.role || "ইন্সট্রাক্টর",
          avatar: course.instructor.avatar || "/images/avatar-placeholder.svg",
          bio: course.instructor.bio || "",
        } : { id: '', name: 'Unknown', role: 'Instructor', avatar: '', bio: '' },
        learningOutcomes: typeof course.learningOutcomes === 'string' ? JSON.parse(course.learningOutcomes) : (course.learningOutcomes || []),
        prerequisites: typeof course.prerequisites === 'string' ? JSON.parse(course.prerequisites) : (course.prerequisites || []),
        modules: [],
      };
    });
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
      <CoursesCatalog
        additionalCourses={additionalCourses}
        recommendations={recommendationsRes.recommendations}
        studentProfile={recommendationsRes.studentProfile}
        userWishlistIds={userWishlistIds}
      />
    </Suspense>
  );
}
