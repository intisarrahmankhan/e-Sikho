'use server';

import { auth } from '@/auth';
import dbConnect from '@/lib/mongoose';
import Course from '@/models/Course';
import Enrollment from '@/models/Enrollment';
import User from '@/models/User';
import { COURSES_DATA, Course as CourseType } from '@/lib/courses-data';

export interface StudentProfileForRecommendation {
  id?: string;
  targetTrack?: string;
  academicBackground?: string;
  elo?: number;
  interests?: string[];
  skills?: string[];
  completedCoursesCount?: number;
}

export interface RecommendationScoreResult {
  score: number;
  matchPercentage: number;
  trackScore: number;
  interestScore: number;
  skillScore: number;
  eloScore: number;
  socialScore: number;
  matchReasons: { en: string; bn: string }[];
  matchedInterests: string[];
  matchedSkills: string[];
}

export interface RecommendedCourseItem {
  id: string;
  title: string;
  titleEn?: string;
  tagline: string;
  taglineEn?: string;
  description: string;
  category: string;
  categoryBangla: string;
  level: string;
  rating: number;
  totalRatings: number;
  studentsEnrolled: number;
  duration: string;
  price: number;
  originalPrice: number;
  thumbnailUrl: string;
  instructorName: string;
  matchScore: number;
  matchReasons: { en: string; bn: string }[];
  matchedInterests: string[];
  matchedSkills: string[];
  isTopPick?: boolean;
}

/**
 * Pure calculation engine to score a candidate course against a student profile
 */
export function calculateCourseRecommendationScore(
  course: {
    id?: string;
    title: string;
    titleEn?: string;
    category?: string;
    level?: string;
    description?: string;
    learningOutcomes?: string[] | string;
    rating?: number;
    studentsEnrolled?: number;
  },
  profile: StudentProfileForRecommendation
): RecommendationScoreResult {
  const targetTrack = profile.targetTrack || 'Fullstack Web Development';
  const elo = profile.elo || 1200;
  const interests = (profile.interests && profile.interests.length > 0)
    ? profile.interests
    : ['Web Development', 'Machine Learning & AI', 'Data Structures & Algorithms'];
  const skills = profile.skills || [];

  const courseText = [
    course.title || '',
    course.titleEn || '',
    course.category || '',
    course.description || '',
    Array.isArray(course.learningOutcomes)
      ? course.learningOutcomes.join(' ')
      : typeof course.learningOutcomes === 'string'
      ? course.learningOutcomes
      : '',
  ]
    .join(' ')
    .toLowerCase();

  // 1. Track Alignment (up to 35 pts)
  let trackScore = 10;
  const trackLower = targetTrack.toLowerCase();

  const trackKeywordsMap: Record<string, string[]> = {
    web: ['web', 'frontend', 'backend', 'fullstack', 'react', 'next.js', 'node', 'javascript', 'typescript'],
    data: ['data science', 'ai', 'machine learning', 'python', 'deep learning', 'pandas', 'neural', 'scikit'],
    algorithm: ['dsa', 'data structure', 'algorithm', 'competitive programming', 'leetcode', 'c++', 'problem solving'],
    system: ['system design', 'architecture', 'cloud', 'scale', 'microservices', 'distributed', 'docker'],
    mobile: ['mobile', 'flutter', 'dart', 'app', 'android', 'ios'],
  };

  let matchedTrackKeywords = 0;
  for (const [key, keywords] of Object.entries(trackKeywordsMap)) {
    if (trackLower.includes(key)) {
      for (const kw of keywords) {
        if (courseText.includes(kw)) {
          matchedTrackKeywords++;
        }
      }
    }
  }

  if (matchedTrackKeywords >= 3) {
    trackScore = 35;
  } else if (matchedTrackKeywords >= 1) {
    trackScore = 28;
  } else if (
    (trackLower.includes('fullstack') && course.category === 'web-dev') ||
    (trackLower.includes('data') && course.category === 'data-science') ||
    (trackLower.includes('algorithm') && course.category === 'programming') ||
    (trackLower.includes('system') && course.category === 'system-design') ||
    (trackLower.includes('mobile') && course.category === 'app-dev')
  ) {
    trackScore = 32;
  }

  // 2. Student Interests Match (up to 25 pts)
  let interestScore = 0;
  const matchedInterests: string[] = [];

  for (const interest of interests) {
    const intWords = interest.toLowerCase().split(/[\s,&]+/);
    const hasMatch = intWords.some((w) => w.length > 2 && courseText.includes(w));
    if (hasMatch) {
      matchedInterests.push(interest);
      interestScore += 10;
    }
  }
  interestScore = Math.min(25, interestScore);
  if (matchedInterests.length === 0) {
    interestScore = 8; // baseline
  }

  // 3. Student Skills Synergy & Expansion (up to 20 pts)
  let skillScore = 0;
  const matchedSkills: string[] = [];

  for (const skill of skills) {
    const sLower = skill.toLowerCase();
    if (courseText.includes(sLower)) {
      matchedSkills.push(skill);
      skillScore += 8;
    }
  }
  skillScore = Math.min(20, skillScore);
  if (skills.length === 0) {
    skillScore = 12; // baseline for beginner
  } else if (matchedSkills.length === 0 && trackScore >= 25) {
    skillScore = 8; // foundational synergy baseline
  }

  // 4. Elo & Level Calibration (up to 10 pts)
  let eloScore = 7;
  const levelStr = (course.level || '').toLowerCase();
  const isBeginner = levelStr.includes('বিগিনার') || levelStr.includes('begin');
  const isIntermediate = levelStr.includes('ইন্টারমিডিয়েট') || levelStr.includes('inter');
  const isAdvanced = levelStr.includes('অ্যাডভান্সড') || levelStr.includes('advan');

  if (elo < 1300) {
    if (isBeginner) eloScore = 10;
    else if (isIntermediate) eloScore = 7;
    else if (isAdvanced) eloScore = 4;
    else eloScore = 9;
  } else if (elo < 1600) {
    if (isIntermediate) eloScore = 10;
    else if (isBeginner) eloScore = 8;
    else if (isAdvanced) eloScore = 7;
    else eloScore = 9;
  } else {
    // 1600+
    if (isAdvanced) eloScore = 10;
    else if (isIntermediate) eloScore = 8;
    else if (isBeginner) eloScore = 5;
    else eloScore = 8;
  }

  // 5. Social Proof & Rating (up to 10 pts)
  const rating = Number(course.rating) || 4.5;
  const enrolled = Number(course.studentsEnrolled) || 100;
  const ratingPts = Math.min(6, Math.round((rating / 5) * 6));
  const enrolledPts = Math.min(4, Math.round((enrolled / 250) * 4));
  const socialScore = ratingPts + enrolledPts;

  // Aggregate Score
  const rawScore = trackScore + interestScore + skillScore + eloScore + socialScore;
  const score = Math.min(99, Math.max(38, Math.round(rawScore)));

  // Generate localized match reasons
  const matchReasons: { en: string; bn: string }[] = [];

  if (trackScore >= 25) {
    matchReasons.push({
      en: `Aligned with your target track: ${targetTrack}`,
      bn: `আপনার নির্ধারিত ট্র্যাক ${targetTrack}-এর সাথে সঙ্গতিপূর্ণ`,
    });
  }

  if (matchedInterests.length > 0) {
    const listStr = matchedInterests.slice(0, 2).join(', ');
    matchReasons.push({
      en: `Matches your interest in ${listStr}`,
      bn: `আপনার আগ্রহের বিষয় ${listStr}-এর সাথে দারুণভাবে মিলে যায়`,
    });
  }

  if (matchedSkills.length > 0) {
    const listStr = matchedSkills.slice(0, 2).join(', ');
    matchReasons.push({
      en: `Builds upon your knowledge of ${listStr}`,
      bn: `আপনার ${listStr} দক্ষতার পরবর্তী ধাপে পৌঁছাতে সহায়ক`,
    });
  }

  if (eloScore >= 8) {
    matchReasons.push({
      en: `Calibrated for your rating tier (${elo} Elo)`,
      bn: `আপনার বর্তমান ইলো রেটিং টিয়ার (${elo} Elo)-এর জন্য উপযুক্ত`,
    });
  }

  if (rating >= 4.7) {
    matchReasons.push({
      en: `Top-rated (${rating}★) with ${enrolled}+ enrolled students`,
      bn: `${enrolled}+ শিক্ষার্থীর পছন্দে ${rating}★ রেটিং প্রাপ্ত`,
    });
  }

  return {
    score,
    matchPercentage: score,
    trackScore,
    interestScore,
    skillScore,
    eloScore,
    socialScore,
    matchReasons,
    matchedInterests,
    matchedSkills,
  };
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

    if (sessionUserId) {
      let query: any = { _id: sessionUserId };
      if (typeof sessionUserId === 'string' && sessionUserId.includes('@')) {
        query = { email: sessionUserId };
      }

      const userDoc = await User.findOne(query)
        .select('_id targetTrack academicBackground elo interests skills completedCoursesCount')
        .lean() as any;

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
