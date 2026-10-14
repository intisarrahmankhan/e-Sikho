'use server';

import { auth } from '@/auth';
import dbConnect from '@/lib/mongoose';
import Review from '@/models/Review';
import Course from '@/models/Course';
import { revalidatePath } from 'next/cache';

export async function submitCourseReviewAction(data: {
  courseId: string;
  rating: number;
  comment?: string;
}) {
  try {
    const session = await auth();
    const sessionUserId = (session?.user as any)?.id;
    if (!sessionUserId) return { error: 'লগইন আবশ্যক (Login required).' };

    if (!data.courseId) return { error: 'কোর্স আইডি প্রয়োজন (Course ID required).' };
    if (!data.rating || data.rating < 1 || data.rating > 5) {
      return { error: '১ থেকে ৫ এর মধ্যে রেটিং দিন (Provide a rating between 1 and 5).' };
    }

    await dbConnect();

    // Check if the user already reviewed this course
    const existingReview = await Review.findOne({ userId: sessionUserId, courseId: data.courseId });
    if (existingReview) {
      return { error: 'আপনি ইতিমধ্যে এই কোর্সের জন্য একটি রিভিউ দিয়েছেন (You have already reviewed this course).' };
    }

    // Create the review
    const newReview = await Review.create({
      userId: sessionUserId,
      courseId: data.courseId,
      rating: data.rating,
      comment: data.comment?.trim() || '',
      status: 'PUBLISHED'
    });

    // Update the course average rating and total ratings
    const course = await Course.findById(data.courseId);
    if (course) {
      const currentTotal = course.totalRatings || 0;
      const currentAvg = course.rating || 0;
      
      const newTotal = currentTotal + 1;
      const newAvg = ((currentAvg * currentTotal) + data.rating) / newTotal;

      course.totalRatings = newTotal;
      course.rating = Number(newAvg.toFixed(1)); // Round to 1 decimal place
      await course.save();
    }

    revalidatePath(`/courses/${data.courseId}`);
    return { success: true };
  } catch (error: any) {
    console.error('Failed to submit course review:', error);
    return { error: 'রিভিউ সাবমিট করতে ব্যর্থ হয়েছে (Failed to submit review).' };
  }
}
