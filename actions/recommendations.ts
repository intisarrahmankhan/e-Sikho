'use server';

import { auth } from '@/auth';
import dbConnect from '@/lib/mongoose';
import Course from '@/models/Course';
import Enrollment from '@/models/Enrollment';
import User from '@/models/User';
import { COURSES_DATA, Course as CourseType } from '@/lib/courses-data';

import {
  calculateCourseRecommendationScore,
  StudentProfileForRecommendation,
  RecommendationScoreResult,
  RecommendedCourseItem,
} from '@/lib/recommendations-engine';
import { isValidMongoObjectId } from '@/lib/auth-helpers';

export type {
  StudentProfileForRecommendation,
  RecommendationScoreResult,
  RecommendedCourseItem,
};

export async function calculateCourseRecommendationScoreAction(
  course: any,
  profile: StudentProfileForRecommendation
): Promise<RecommendationScoreResult> {
  return calculateCourseRecommendationScore(course, profile);
}

/**
 * Server action to fetch personalized course recommendations for the active student
 */
export async function getPersonalizedRecommendationsAction(limit: number = 4): Promise<{
  success: boolean;
  recommendations: RecommendedCourseItem[];
  studentProfile: {
    targetTrack: string;
    elo: number;
    interests: string[];
    skills: string[];
    academicBackground: string;
  };
}> {
  try {
    const session = await auth();
    const sessionUserId = (session?.user as any)?.id;

    let profile: StudentProfileForRecommendation = {
      targetTrack: 'Fullstack Web Development',
      academicBackground: 'Computer Science & Engineering (CSE)',
      elo: 1200,
      interests: ['Web Development', 'Machine Learning & AI', 'Data Structures & Algorithms'],
      skills: ['JavaScript', 'React', 'TypeScript'],
      completedCoursesCount: 0,
    };

    let enrolledCourseIds = new Set<string>();

    await dbConnect();

    const sessionUserEmail = (session?.user as any)?.email;

    if (sessionUserId || sessionUserEmail) {
      let query: any = null;
      if (isValidMongoObjectId(sessionUserId)) {
        query = { _id: sessionUserId };
      } else if (typeof sessionUserId === 'string' && sessionUserId.includes('@')) {
        query = { email: sessionUserId };
      } else if (sessionUserEmail) {
        query = { email: sessionUserEmail };
      }

      const userDoc = query
        ? ((await User.findOne(query)
            .select('_id targetTrack academicBackground elo interests skills completedCoursesCount')
            .lean()) as any)
        : null;

      if (userDoc) {
        profile = {
          id: userDoc._id.toString(),
          targetTrack: userDoc.targetTrack || profile.targetTrack,
          academicBackground: userDoc.academicBackground || profile.academicBackground,
          elo: userDoc.elo || profile.elo,
          interests: Array.isArray(userDoc.interests) && userDoc.interests.length > 0
            ? userDoc.interests
            : profile.interests,
          skills: Array.isArray(userDoc.skills) && userDoc.skills.length > 0
            ? userDoc.skills
            : profile.skills,
          completedCoursesCount: userDoc.completedCoursesCount || 0,
        };

        // Fetch current student enrollments
        const enrollments = await Enrollment.find({
          userId: userDoc._id.toString(),
          paymentStatus: { $in: ['success', 'GRANTED', 'granted'] },
        })
          .select('courseId')
          .lean();

        for (const e of enrollments) {
          if (e.courseId) enrolledCourseIds.add(String(e.courseId));
        }
      }
    }

    // Candidate courses collection (combining DB courses and COURSES_DATA)
    const candidateMap = new Map<string, any>();

    // 1. Static high quality courses
    for (const c of COURSES_DATA) {
      candidateMap.set(c.id, {
        id: c.id,
        title: c.title,
        titleEn: c.titleEn,
        tagline: c.tagline,
        taglineEn: c.taglineEn,
        description: c.description,
        category: c.category,
        categoryBangla: c.categoryBangla,
        level: c.level,
        rating: c.rating,
        totalRatings: c.totalRatings,
        studentsEnrolled: c.studentsEnrolled,
        duration: c.duration,
        price: c.price,
        originalPrice: c.originalPrice,
        thumbnailUrl: c.thumbnailUrl,
        instructorName: c.instructor?.name || 'e-Shikho Faculty',
        learningOutcomes: c.learningOutcomes,
      });
    }

    // 2. DB published courses
    try {
      const dbCourses = await Course.find({ approvalStatus: 'APPROVED' })
        .populate('instructor')
        .lean() as any[];

      for (const dc of dbCourses) {
        const idStr = dc._id.toString();
        candidateMap.set(idStr, {
          id: idStr,
          title: dc.title,
          titleEn: dc.titleEn,
          tagline: dc.tagline,
          taglineEn: dc.taglineEn,
          description: dc.description,
          category: dc.category,
          categoryBangla: dc.categoryBangla,
          level: dc.level,
          rating: dc.rating || 4.8,
          totalRatings: dc.totalRatings || 40,
          studentsEnrolled: dc.studentsEnrolled || 200,
          duration: dc.duration || '৪০ ঘণ্টা',
          price: dc.price,
          originalPrice: dc.originalPrice,
          thumbnailUrl: dc.thumbnailUrl,
          instructorName: dc.instructor?.name || 'e-Shikho Faculty',
          learningOutcomes: dc.learningOutcomes,
        });
      }
    } catch (e) {
      // Continue with static data
    }

    // Filter out already enrolled courses
    const unenrolledCandidates = Array.from(candidateMap.values()).filter(
      (c) => !enrolledCourseIds.has(c.id)
    );

    // Score all candidates
    const scoredCourses: RecommendedCourseItem[] = unenrolledCandidates.map((c) => {
      const scoreResult = calculateCourseRecommendationScore(c, profile);
      return {
        id: c.id,
        title: c.title,
        titleEn: c.titleEn,
        tagline: c.tagline,
        taglineEn: c.taglineEn,
        description: c.description,
        category: c.category,
        categoryBangla: c.categoryBangla,
        level: c.level,
        rating: c.rating,
        totalRatings: c.totalRatings,
        studentsEnrolled: c.studentsEnrolled,
        duration: c.duration,
        price: c.price,
        originalPrice: c.originalPrice,
        thumbnailUrl: c.thumbnailUrl,
        instructorName: c.instructorName,
        matchScore: scoreResult.score,
        matchReasons: scoreResult.matchReasons,
        matchedInterests: scoreResult.matchedInterests,
        matchedSkills: scoreResult.matchedSkills,
      };
    });

    // Sort descending by match score
    scoredCourses.sort((a, b) => b.matchScore - a.matchScore);

    // Tag the top pick
    if (scoredCourses.length > 0) {
      scoredCourses[0].isTopPick = true;
    }

    const limited = scoredCourses.slice(0, limit);

    return {
      success: true,
      recommendations: limited,
      studentProfile: {
        targetTrack: profile.targetTrack || 'Fullstack Web Development',
        elo: profile.elo || 1200,
        interests: profile.interests || [],
        skills: profile.skills || [],
        academicBackground: profile.academicBackground || 'Computer Science & Engineering (CSE)',
      },
    };
  } catch (err: any) {
    console.error('Error in getPersonalizedRecommendationsAction:', err);
    return {
      success: false,
      recommendations: [],
      studentProfile: {
        targetTrack: 'Fullstack Web Development',
        elo: 1200,
        interests: [],
        skills: [],
        academicBackground: '',
      },
    };
  }
}
