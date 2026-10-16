'use server';

import { auth } from '@/auth';
import dbConnect from '@/lib/mongoose';
import Wishlist from '@/models/Wishlist';
import User from '@/models/User';
import Course from '@/models/Course';
import { COURSES_DATA, Course as CourseType } from '@/lib/courses-data';
import { revalidatePath } from 'next/cache';

/**
 * Toggles a course in user's wishlist (adds if not present, removes if present)
 */
export async function toggleWishlistAction(courseId: string) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return { error: 'NOT_AUTHENTICATED', message: 'Please login to add to wishlist' };
    }

    await dbConnect();

    const sessionUserId = (session.user as any).id;
    let userId = sessionUserId;

    if (typeof sessionUserId === 'string' && sessionUserId.includes('@')) {
      const user = await User.findOne({ email: sessionUserId }).select('_id').lean() as any;
      if (!user) return { error: 'User not found' };
      userId = user._id;
    }

    const existing = await Wishlist.findOne({ userId, courseId });

    if (existing) {
      await Wishlist.deleteOne({ _id: existing._id });
      revalidatePath('/courses');
      revalidatePath('/wishlist');
      revalidatePath('/student');
      return { success: true, isWishlisted: false, message: 'Removed from wishlist' };
    } else {
      await Wishlist.create({
        userId,
        courseId,
        addedAt: new Date(),
      });
      revalidatePath('/courses');
      revalidatePath('/wishlist');
      revalidatePath('/student');
      return { success: true, isWishlisted: true, message: 'Added to wishlist' };
    }
  } catch (error: any) {
    console.error('Failed to toggle wishlist:', error);
    return { error: 'Failed to update wishlist' };
  }
}

/**
 * Returns array of course IDs wishlisted by current user
 */
export async function getUserWishlistIdsAction(): Promise<{ success: boolean; wishlistIds: string[] }> {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return { success: true, wishlistIds: [] };
    }

    await dbConnect();

    const sessionUserId = (session.user as any).id;
    let userId = sessionUserId;

    if (typeof sessionUserId === 'string' && sessionUserId.includes('@')) {
      const user = await User.findOne({ email: sessionUserId }).select('_id').lean() as any;
      if (!user) return { success: true, wishlistIds: [] };
      userId = user._id;
    }

    const items = await Wishlist.find({ userId }).select('courseId').lean();
    const wishlistIds = items.map((i: any) => String(i.courseId));

    return { success: true, wishlistIds };
  } catch (error) {
    console.error('Failed to get wishlist ids:', error);
    return { success: false, wishlistIds: [] };
  }
}

/**
 * Fetches all populated course details for courses in user's wishlist
 */
export async function getWishlistCoursesAction(): Promise<{
  success: boolean;
  courses: CourseType[];
  error?: string;
}> {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return { success: false, courses: [], error: 'NOT_AUTHENTICATED' };
    }

    await dbConnect();

    const sessionUserId = (session.user as any).id;
    let userId = sessionUserId;

    if (typeof sessionUserId === 'string' && sessionUserId.includes('@')) {
      const user = await User.findOne({ email: sessionUserId }).select('_id').lean() as any;
      if (!user) return { success: false, courses: [] };
      userId = user._id;
    }

    const wishlistDocs = await Wishlist.find({ userId }).sort({ addedAt: -1 }).lean();
    if (!wishlistDocs || wishlistDocs.length === 0) {
      return { success: true, courses: [] };
    }

    const courseIds = wishlistDocs.map((doc: any) => String(doc.courseId));

    // 1. Check static courses in COURSES_DATA
    const staticMap = new Map<string, CourseType>();
    for (const c of COURSES_DATA) {
      staticMap.set(c.id, c);
    }

    // 2. Fetch dynamic DB courses
    const dbCourses = await Course.find({
      _id: { $in: courseIds.filter((id) => /^[0-9a-fA-F]{24}$/.test(id)) },
    })
      .populate('instructor')
      .lean();

    const dbMap = new Map<string, any>();
    for (const c of dbCourses) {
      dbMap.set(c._id.toString(), c);
    }

    const resultCourses: CourseType[] = [];

    for (const cid of courseIds) {
      if (staticMap.has(cid)) {
        resultCourses.push(staticMap.get(cid)!);
      } else if (dbMap.has(cid)) {
        const raw = dbMap.get(cid);
        resultCourses.push({
          id: raw._id.toString(),
          title: raw.title,
          titleEn: raw.titleEn,
          tagline: raw.tagline,
          taglineEn: raw.taglineEn,
          description: raw.description,
          descriptionEn: raw.descriptionEn,
          category: raw.category || 'programming',
          categoryBangla: raw.categoryBangla || 'প্রোগ্রামিং',
          level: raw.level || 'বিগিনার',
          rating: raw.rating || 5,
          totalRatings: raw.totalRatings || 0,
          studentsEnrolled: raw.studentsEnrolled || 0,
          duration: raw.duration || '20 Hours',
          totalLessons: raw.totalLessons || 0,
          price: raw.price || 0,
          originalPrice: raw.originalPrice || 0,
          thumbnailUrl: raw.thumbnailUrl || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&auto=format&fit=crop&q=80',
          thumbnailUrlEn: raw.thumbnailUrlEn,
          instructor: raw.instructor ? {
            name: raw.instructor.name,
            role: raw.instructor.role || 'Instructor',
            avatar: raw.instructor.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
            bio: raw.instructor.bio || '',
          } : {
            name: 'Instructor',
            role: 'Educator',
            avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
            bio: '',
          },
          learningOutcomes: [],
          prerequisites: [],
          modules: [],
        });
      }
    }

    return { success: true, courses: resultCourses };
  } catch (error: any) {
    console.error('Failed to get wishlist courses:', error);
    return { success: false, courses: [], error: 'Failed to load wishlist' };
  }
}
