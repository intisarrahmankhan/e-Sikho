/**
 * Elo Rating & Competitive MMR Engine for e-Shikho
 * 
 * Supports:
 * 1. Two-way dynamic fluctuation based on performance vs expected outcome (can drop on poor performance).
 * 2. Cumulative mastery bonuses from completed courses and total problems solved.
 * 3. Dynamic K-Factor (calibration for novices vs stability for masters).
 * 4. Academic background matching and prioritization.
 */

export type RatingTier = 'Novice' | 'Pupil' | 'Specialist' | 'Expert' | 'Candidate Master' | 'Grandmaster';

export interface TierInfo {
  tier: RatingTier;
  titleEn: string;
  titleBn: string;
  minElo: number;
  maxElo: number;
  badgeColor: string; // Tailwind color class
  badgeBg: string;
  borderColor: string;
}

export const RATING_TIERS: TierInfo[] = [
  {
    tier: 'Novice',
    titleEn: 'Novice',
    titleBn: 'শিক্ষানবিস',
    minElo: 0,
    maxElo: 1199,
    badgeColor: 'text-slate-600',
    badgeBg: 'bg-slate-100',
    borderColor: 'border-slate-300',
  },
  {
    tier: 'Pupil',
    titleEn: 'Pupil',
    titleBn: 'অ্যাপ্রেন্টিস',
    minElo: 1200,
    maxElo: 1399,
    badgeColor: 'text-emerald-700',
    badgeBg: 'bg-emerald-50',
    borderColor: 'border-emerald-300',
  },
  {
    tier: 'Specialist',
    titleEn: 'Specialist',
    titleBn: 'স্পেশালিস্ট',
    minElo: 1400,
    maxElo: 1599,
    badgeColor: 'text-sky-700',
    badgeBg: 'bg-sky-50',
    borderColor: 'border-sky-300',
  },
  {
    tier: 'Expert',
    titleEn: 'Expert',
    titleBn: 'এক্সপার্ট',
    minElo: 1600,
    maxElo: 1799,
    badgeColor: 'text-indigo-700',
    badgeBg: 'bg-indigo-50',
    borderColor: 'border-indigo-300',
  },
  {
    tier: 'Candidate Master',
    titleEn: 'Candidate Master',
    titleBn: 'ক্যান্ডিডেট মাস্টার',
    minElo: 1800,
    maxElo: 1999,
    badgeColor: 'text-amber-700',
    badgeBg: 'bg-amber-50',
    borderColor: 'border-amber-300',
  },
  {
    tier: 'Grandmaster',
    titleEn: 'Grandmaster',
    titleBn: 'গ্র্যান্ডমাস্টার',
    minElo: 2000,
    maxElo: 9999,
    badgeColor: 'text-rose-700',
    badgeBg: 'bg-rose-50',
    borderColor: 'border-rose-300',
  },
];

export function getRatingTier(elo: number): TierInfo {
  const normalizedElo = Math.max(0, elo || 0);
  for (let i = RATING_TIERS.length - 1; i >= 0; i--) {
    if (normalizedElo >= RATING_TIERS[i].minElo) {
      return RATING_TIERS[i];
    }
  }
  return RATING_TIERS[0];
}

/**
 * Calculates Expected Performance (E) using the classic logistic Elo formula:
 * E = 1 / (1 + 10 ^ ((benchmarkRating - playerRating) / 400))
 */
export function calculateExpectedScore(playerRating: number, benchmarkRating: number): number {
  const exponent = (benchmarkRating - playerRating) / 400;
  return 1 / (1 + Math.pow(10, exponent));
}

/**
 * Dynamic K-Factor:
 * Calibrates quickly for newcomers, becomes more stable as student plays more or reaches elite ratings.
 */
export function calculateDynamicKFactor(playerRating: number, totalContestsPlayed: number = 0): number {
  if (totalContestsPlayed < 5) return 48; // High volatility calibration
  if (playerRating < 1400) return 36;
  if (playerRating < 1800) return 28;
  if (playerRating < 2000) return 20;
  return 16; // Grandmasters have very stable ratings
}

export interface ContestRatingCalculationParams {
  currentCompetitiveElo: number;
  benchmarkRating: number;
  score: number;
  totalMarks: number;
  timeTakenSeconds: number;
  totalDurationSeconds: number;
  totalContestsPlayed?: number;
}

export interface ContestRatingResult {
  expectedScore: number;       // 0.0 - 1.0
  actualPerformance: number;   // 0.0 - 1.0 (adjusted for accuracy & speed)
  accuracy: number;            // percentage 0 - 100
  delta: number;               // Can be POSITIVE or NEGATIVE!
  newCompetitiveElo: number;
  kFactor: number;
  speedMultiplier: number;
  performanceSummary: string;
}

/**
 * Evaluates performance in a contest or complex problem set and calculates rating change (delta).
 * IMPORTANT: Can result in a negative delta if student scores below expectation or fails problems!
 */
export function calculateContestRatingDelta(params: ContestRatingCalculationParams): ContestRatingResult {
  const {
    currentCompetitiveElo,
    benchmarkRating,
    score,
    totalMarks,
    timeTakenSeconds,
    totalDurationSeconds,
    totalContestsPlayed = 0,
  } = params;

  const validTotalMarks = Math.max(1, totalMarks);
  const accuracy = Math.max(0, Math.min(100, (score / validTotalMarks) * 100));
  const rawRatio = score / validTotalMarks;

  // Speed factor: if solved with high accuracy (>70%) under 60% of duration, small bonus; if ran out of time or very low accuracy, slight penalty
  let speedMultiplier = 1.0;
  if (totalDurationSeconds > 0 && rawRatio >= 0.7) {
    const timeRatio = timeTakenSeconds / totalDurationSeconds;
    if (timeRatio < 0.5) speedMultiplier = 1.10; // +10% speed efficiency bonus
    else if (timeRatio < 0.8) speedMultiplier = 1.04;
  } else if (rawRatio < 0.4) {
    speedMultiplier = 0.95; // penalty on poor attempts
  }

  const actualPerformance = Math.max(0, Math.min(1.0, rawRatio * speedMultiplier));
  const expectedScore = calculateExpectedScore(currentCompetitiveElo, benchmarkRating);
  const kFactor = calculateDynamicKFactor(currentCompetitiveElo, totalContestsPlayed);

  // Elo Delta Formula: Delta = K * (Actual - Expected)
  let delta = Math.round(kFactor * (actualPerformance - expectedScore));

  // Ensure minimum drop or gain bounds for meaningful feedback:
  // Cap single contest swings between -65 and +75
  delta = Math.max(-65, Math.min(75, delta));

  // If score is 0, guarantee a reasonable penalty (unless expected score was nearly 0)
  if (score === 0 && delta > -15) {
    delta = Math.min(delta, -18);
  }

  const newCompetitiveElo = Math.max(800, currentCompetitiveElo + delta);

  let performanceSummary = '';
  if (delta > 30) {
    performanceSummary = 'অসাধারণ পারফরম্যান্স! বেঞ্চমার্ক ছাড়িয়ে দারুণ রেটিং অর্জন করেছেন।';
  } else if (delta > 0) {
    performanceSummary = 'ভালো ফলাফল! প্রতিযোগিতায় প্রত্যাশার চেয়ে বেশি স্কোর করেছেন।';
  } else if (delta === 0) {
    performanceSummary = 'স্থির পারফরম্যান্স। আপনার রেটিং অপরিবর্তিত রয়েছে।';
  } else if (delta > -20) {
    performanceSummary = 'সামান্য স্কোর অবনতি। পরবর্তী প্রতিযোগিতায় ঘুরে দাঁড়ান!';
  } else {
    performanceSummary = 'প্রত্যাশিত বেঞ্চমার্কের নিচে স্কোর হওয়ায় রেটিং কমেছে। সমস্যাগুলো পুনরায় অনুশীলন করুন।';
  }

  return {
    expectedScore: Number(expectedScore.toFixed(3)),
    actualPerformance: Number(actualPerformance.toFixed(3)),
    accuracy: Math.round(accuracy),
    delta,
    newCompetitiveElo,
    kFactor,
    speedMultiplier,
    performanceSummary,
  };
}

/**
 * Calculates Composite Effective Elo combining:
 * 1. Pure Competitive Rating (Fluctuates dynamically both up and down based on contests)
 * 2. Course Completion Mastery Bonus (up to +150)
 * 3. Total Solved Problems Volume Bonus (up to +100)
 */
export function calculateCompositeElo(params: {
  competitiveElo: number;
  completedCoursesCount?: number;
  problemsSolved?: number;
}): {
  compositeElo: number;
  competitiveElo: number;
  courseBonus: number;
  problemsBonus: number;
  tier: TierInfo;
} {
  const competitiveElo = Math.max(800, params.competitiveElo || 1200);
  const completedCourses = Math.max(0, params.completedCoursesCount || 0);
  const problemsSolved = Math.max(0, params.problemsSolved || 0);

  // Bonus logic:
  // Each completed course provides +25 mastery points (max 150 points for 6+ courses)
  const courseBonus = Math.min(150, completedCourses * 25);

  // Each verified solved problem adds +2 points (max 100 points for 50+ problems)
  const problemsBonus = Math.min(100, Math.floor(problemsSolved * 2));

  const compositeElo = Math.round(competitiveElo + courseBonus + problemsBonus);
  const tier = getRatingTier(compositeElo);

  return {
    compositeElo,
    competitiveElo,
    courseBonus,
    problemsBonus,
    tier,
  };
}

/**
 * Normalizes academic background string into standard discipline keys
 */
export function normalizeBackground(bg?: string): string {
  if (!bg) return 'GENERAL';
  const clean = bg.toUpperCase();
  if (clean.includes('CSE') || clean.includes('COMPUTER') || clean.includes('SOFTWARE') || clean.includes('SWE') || clean.includes('IT')) {
    return 'CSE';
  }
  if (clean.includes('EEE') || clean.includes('ELECTRICAL') || clean.includes('ELECTRONIC') || clean.includes('ROBOTICS')) {
    return 'EEE';
  }
  if (clean.includes('DATA') || clean.includes('AI') || clean.includes('MACHINE LEARNING')) {
    return 'DATA_SCIENCE';
  }
  if (clean.includes('BUSINESS') || clean.includes('BBA') || clean.includes('FINANCE') || clean.includes('ACCOUNTING') || clean.includes('COMMERCE')) {
    return 'BUSINESS';
  }
  return 'GENERAL';
}

export interface BackgroundPriorityMatch {
  priority: 'HIGH' | 'NORMAL' | 'LOW';
  priorityScore: number; // Higher number means higher priority in sorting
  badgeTextEn: string;
  badgeTextBn: string;
  isDirectMatch: boolean;
  matchReason: string;
}

/**
 * Calculates whether a contest should be prioritized for a student's academic background.
 * Example:
 * - CS student on CS contest => HIGH priority (score 100), placed at the very top.
 * - Non-CS student on CS contest => LOW priority (score 25), visible but deprioritized.
 */
export function calculateBackgroundPriority(
  userBackground?: string,
  targetBackgrounds: string[] = ['GENERAL']
): BackgroundPriorityMatch {
  const userKey = normalizeBackground(userBackground);
  const targets = targetBackgrounds.map((t) => t.toUpperCase());

  // Direct exact match
  if (targets.includes(userKey) && userKey !== 'GENERAL') {
    return {
      priority: 'HIGH',
      priorityScore: 100,
      badgeTextEn: '🔥 Priority for Your Track',
      badgeTextBn: '🔥 আপনার ব্যাকগ্রাউন্ডের জন্য অগ্রাধিকারপ্রাপ্ত',
      isDirectMatch: true,
      matchReason: `Matches ${userBackground || 'your study domain'}`,
    };
  }

  // Cross-tech overlap (e.g. CSE with Data Science or EEE)
  if (
    (userKey === 'CSE' && (targets.includes('DATA_SCIENCE') || targets.includes('SWE'))) ||
    (userKey === 'DATA_SCIENCE' && targets.includes('CSE'))
  ) {
    return {
      priority: 'HIGH',
      priorityScore: 90,
      badgeTextEn: '✨ Highly Recommended',
      badgeTextBn: '✨ বিশেষ সুপারিশকৃত ট্র্যাক',
      isDirectMatch: true,
      matchReason: 'Direct curriculum overlap',
    };
  }

  // General contest open to everyone
  if (targets.includes('GENERAL') || targets.includes('ALL')) {
    return {
      priority: 'NORMAL',
      priorityScore: 60,
      badgeTextEn: '🌐 Open for All Disciplines',
      badgeTextBn: '🌐 সকল ব্যাকগ্রাউন্ডের জন্য উন্মুক্ত',
      isDirectMatch: false,
      matchReason: 'General curriculum problem solving',
    };
  }

  // Contest belongs to a different background (e.g. CS contest for Business student)
  return {
    priority: 'LOW',
    priorityScore: 25,
    badgeTextEn: '📌 Open Challenge • Secondary Priority',
    badgeTextBn: '📌 উন্মুক্ত চ্যালেঞ্জ • সাধারণ অগ্রাধিকার',
    isDirectMatch: false,
    matchReason: 'Different core discipline, accessible as open challenge',
  };
}
