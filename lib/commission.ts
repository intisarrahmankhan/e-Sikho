/**
 * Platform Commission Rules & Business Logic
 *
 * Rules:
 * 1. DEFAULT rule: 10% platform commission (instructor earnings: 90%)
 * 2. EARLY_BIRD rule: 5% platform commission (instructor earnings: 95%)
 */

export const COMMISSION_RULES = {
  DEFAULT: {
    rule: 'DEFAULT' as const,
    name: 'Default Platform Commission',
    percentage: 10,
    instructorSharePercentage: 90,
    description: 'Standard 10% platform commission on course enrollments',
  },
  EARLY_BIRD: {
    rule: 'EARLY_BIRD' as const,
    name: 'Early Bird Promotional Commission',
    percentage: 5,
    instructorSharePercentage: 95,
    description: 'Discounted 5% early bird promotional platform commission for early cohorts and launches',
  },
} as const;

export type PlatformCommissionRuleType = keyof typeof COMMISSION_RULES;

export interface CommissionCalculationResult {
  rule: PlatformCommissionRuleType;
  ruleApplied: PlatformCommissionRuleType;
  commissionPercentage: number;
  commissionAmount: number;
  instructorEarnings: number;
  totalAmount: number;
  isEarlyBird: boolean;
}

export interface DetermineCommissionOptions {
  isEarlyBird?: boolean;
  rule?: PlatformCommissionRuleType | string;
  overridePercentage?: number;
  studentsEnrolled?: number;
  courseCreatedAt?: Date | string;
  earlyBirdUntil?: Date | string;
  originalPrice?: number;
  price?: number;
}

/**
 * Determines whether an enrollment qualifies for the EARLY_BIRD (5%) or DEFAULT (10%) rule.
 */
export function determineCommissionRule(
  course?: {
    isEarlyBird?: boolean;
    earlyBirdUntil?: Date | string;
    studentsEnrolled?: number;
    createdAt?: Date | string;
    price?: number;
    originalPrice?: number;
  } | null,
  options?: DetermineCommissionOptions
): PlatformCommissionRuleType {
  // 1. Explicit override in options
  if (options?.rule) {
    const normalized = options.rule.toString().toUpperCase().trim();
    if (normalized === 'EARLY_BIRD' || normalized === 'EARLYBIRD' || normalized === '5%') {
      return 'EARLY_BIRD';
    }
    if (normalized === 'DEFAULT' || normalized === '10%') {
      return 'DEFAULT';
    }
  }

  if (options?.isEarlyBird === true) {
    return 'EARLY_BIRD';
  }

  if (course) {
    // 2. Explicit course-level early bird toggle
    if (course.isEarlyBird === true) {
      return 'EARLY_BIRD';
    }

    // 3. Early bird active deadline
    if (course.earlyBirdUntil) {
      const deadline = new Date(course.earlyBirdUntil).getTime();
      if (!isNaN(deadline) && Date.now() <= deadline) {
        return 'EARLY_BIRD';
      }
    }

    // 4. Early cohort: first 20 enrolled students
    if (typeof course.studentsEnrolled === 'number' && course.studentsEnrolled < 20) {
      return 'EARLY_BIRD';
    }

    // 5. Promotional discounted launch (price < originalPrice)
    if (
      course.price !== undefined &&
      course.originalPrice !== undefined &&
      course.price > 0 &&
      course.price < course.originalPrice
    ) {
      return 'EARLY_BIRD';
    }

    // 6. Launch window (course created within the last 30 days)
    if (course.createdAt) {
      const createdTime = new Date(course.createdAt).getTime();
      if (!isNaN(createdTime)) {
        const daysSinceCreation = (Date.now() - createdTime) / (1000 * 60 * 60 * 24);
        if (daysSinceCreation >= 0 && daysSinceCreation <= 30) {
          return 'EARLY_BIRD';
        }
      }
    }
  }

  // Fallback to the standard 10% default commission rule
  return 'DEFAULT';
}

/**
 * Calculates platform commission and instructor net earnings for a transaction.
 */
export function calculatePlatformCommission(
  price: number,
  ruleOrOptions?: PlatformCommissionRuleType | DetermineCommissionOptions | string,
  course?: any
): CommissionCalculationResult {
  const safePrice = Math.max(0, Number(price) || 0);

  let rule: PlatformCommissionRuleType = 'DEFAULT';

  if (typeof ruleOrOptions === 'string') {
    const normalized = ruleOrOptions.toUpperCase().trim();
    if (normalized === 'EARLY_BIRD' || normalized === 'EARLYBIRD' || normalized === '5%') {
      rule = 'EARLY_BIRD';
    } else {
      rule = 'DEFAULT';
    }
  } else if (ruleOrOptions && typeof ruleOrOptions === 'object') {
    rule = determineCommissionRule(course, ruleOrOptions);
  } else if (course) {
    rule = determineCommissionRule(course);
  }

  const isEarlyBird = rule === 'EARLY_BIRD';
  const percentage = isEarlyBird
    ? COMMISSION_RULES.EARLY_BIRD.percentage
    : COMMISSION_RULES.DEFAULT.percentage;

  const commissionAmount = Math.round(((safePrice * percentage) / 100) * 100) / 100;
  const instructorEarnings = Math.round((safePrice - commissionAmount) * 100) / 100;

  return {
    rule,
    ruleApplied: rule,
    commissionPercentage: percentage,
    commissionAmount,
    instructorEarnings,
    totalAmount: safePrice,
    isEarlyBird,
  };
}
