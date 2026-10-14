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
