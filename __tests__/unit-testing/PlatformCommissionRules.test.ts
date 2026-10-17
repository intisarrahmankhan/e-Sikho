import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  COMMISSION_RULES,
  determineCommissionRule,
  calculatePlatformCommission,
} from '@/lib/commission';
import { processEnrollmentCommission } from '@/actions/financial';

// Mock mongoose and dependencies
vi.mock('@/lib/mongoose', () => ({
  default: vi.fn().mockResolvedValue(true),
}));

vi.mock('@/auth', () => ({
  auth: vi.fn().mockResolvedValue({
    user: { id: 'admin-1', role: 'ADMIN', email: 'admin@eshikho.com' },
  }),
}));

const { mockSession } = vi.hoisted(() => ({
  mockSession: {
    startTransaction: vi.fn(),
    commitTransaction: vi.fn(),
    abortTransaction: vi.fn(),
    endSession: vi.fn(),
  },
}));

vi.mock('mongoose', async () => {
  const actual = await vi.importActual<any>('mongoose');
  const sessionFactory = vi.fn().mockResolvedValue(mockSession);
  return {
    ...actual,
    default: {
      ...actual.default,
      startSession: sessionFactory,
    },
    startSession: sessionFactory,
  };
});

let mockCourseFindByIdResult: any = null;
vi.mock('@/models/Course', () => ({
  default: {
    findById: vi.fn(() => ({
      session: vi.fn().mockResolvedValue(mockCourseFindByIdResult),
    })),
  },
}));

const mockPlatformCommissionCreate = vi.fn().mockResolvedValue([{}]);
vi.mock('@/models/PlatformCommission', () => ({
  default: {
    create: (...args: any[]) => mockPlatformCommissionCreate(...args),
    find: vi.fn().mockReturnValue({
      sort: vi.fn().mockReturnValue({
        populate: vi.fn().mockReturnValue({
          populate: vi.fn().mockReturnValue({
            lean: vi.fn().mockResolvedValue([]),
          }),
        }),
      }),
    }),
  },
}));

const mockUserFindByIdAndUpdate = vi.fn().mockResolvedValue({});
vi.mock('@/models/User', () => ({
  default: {
    findByIdAndUpdate: (...args: any[]) => mockUserFindByIdAndUpdate(...args),
  },
}));

const mockEnrollmentFindByIdAndUpdate = vi.fn().mockResolvedValue({});
vi.mock('@/models/Enrollment', () => ({
  default: {
    findByIdAndUpdate: (...args: any[]) => mockEnrollmentFindByIdAndUpdate(...args),
  },
}));

describe('Platform Commission Rules (DEFAULT 10% & EARLY_BIRD 5%)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Commission Rules Configuration', () => {
    it('establishes the default 10% commission rule with 90% instructor share', () => {
      expect(COMMISSION_RULES.DEFAULT).toBeDefined();
      expect(COMMISSION_RULES.DEFAULT.percentage).toBe(10);
      expect(COMMISSION_RULES.DEFAULT.instructorSharePercentage).toBe(90);
      expect(COMMISSION_RULES.DEFAULT.rule).toBe('DEFAULT');
    });

    it('establishes the 5% Early Bird promotional commission rule with 95% instructor share', () => {
      expect(COMMISSION_RULES.EARLY_BIRD).toBeDefined();
      expect(COMMISSION_RULES.EARLY_BIRD.percentage).toBe(5);
      expect(COMMISSION_RULES.EARLY_BIRD.instructorSharePercentage).toBe(95);
      expect(COMMISSION_RULES.EARLY_BIRD.rule).toBe('EARLY_BIRD');
    });
  });

  describe('determineCommissionRule Business Logic', () => {
    it('returns EARLY_BIRD when explicitly requested in options', () => {
      expect(determineCommissionRule(null, { isEarlyBird: true })).toBe('EARLY_BIRD');
      expect(determineCommissionRule(null, { rule: 'EARLY_BIRD' })).toBe('EARLY_BIRD');
      expect(determineCommissionRule(null, { rule: 'early_bird' })).toBe('EARLY_BIRD');
    });

    it('returns DEFAULT when explicitly requested in options', () => {
      expect(determineCommissionRule(null, { rule: 'DEFAULT' })).toBe('DEFAULT');
    });

    it('returns EARLY_BIRD when course has isEarlyBird flag set to true', () => {
      const course = { isEarlyBird: true, studentsEnrolled: 50 };
      expect(determineCommissionRule(course)).toBe('EARLY_BIRD');
    });

    it('returns EARLY_BIRD when course has an active future earlyBirdUntil date', () => {
      const futureDate = new Date(Date.now() + 7 * 86400000);
      const course = { earlyBirdUntil: futureDate, studentsEnrolled: 100 };
      expect(determineCommissionRule(course)).toBe('EARLY_BIRD');
    });

    it('returns DEFAULT when course earlyBirdUntil date has expired and no other criteria match', () => {
      const pastDate = new Date(Date.now() - 7 * 86400000);
      const oldCreation = new Date(Date.now() - 60 * 86400000);
      const course = {
        earlyBirdUntil: pastDate,
        createdAt: oldCreation,
        studentsEnrolled: 100,
        price: 2000,
        originalPrice: 2000,
      };
      expect(determineCommissionRule(course)).toBe('DEFAULT');
    });

    it('returns EARLY_BIRD for early cohort enrollments (first 20 students enrolled)', () => {
      const course = { studentsEnrolled: 12 };
      expect(determineCommissionRule(course)).toBe('EARLY_BIRD');
    });

    it('returns EARLY_BIRD when course is in promotional discounted launch phase (price < originalPrice)', () => {
      const course = { price: 2500, originalPrice: 4000 };
      expect(determineCommissionRule(course)).toBe('EARLY_BIRD');
    });

    it('returns EARLY_BIRD when course was launched recently (within 30 days of creation)', () => {
      const recentDate = new Date(Date.now() - 5 * 86400000);
      const course = { createdAt: recentDate, studentsEnrolled: 25, price: 3000, originalPrice: 3000 };
      expect(determineCommissionRule(course)).toBe('EARLY_BIRD');
    });

    it('returns DEFAULT when course does not qualify for any early bird criteria', () => {
      const oldDate = new Date(Date.now() - 90 * 86400000);
      const course = {
        createdAt: oldDate,
        studentsEnrolled: 85,
        price: 5000,
        originalPrice: 5000,
        isEarlyBird: false,
      };
      expect(determineCommissionRule(course)).toBe('DEFAULT');
    });
  });

  describe('calculatePlatformCommission Calculation Engine', () => {
    it('correctly calculates 10% platform commission and 90% instructor earnings under DEFAULT rule', () => {
      const result = calculatePlatformCommission(4000, 'DEFAULT');

      expect(result.rule).toBe('DEFAULT');
      expect(result.ruleApplied).toBe('DEFAULT');
      expect(result.commissionPercentage).toBe(10);
      expect(result.commissionAmount).toBe(400); // 10% of 4000
      expect(result.instructorEarnings).toBe(3600); // 90% of 4000
      expect(result.totalAmount).toBe(4000);
      expect(result.isEarlyBird).toBe(false);
    });

    it('correctly calculates 5% platform commission and 95% instructor earnings under EARLY_BIRD rule', () => {
      const result = calculatePlatformCommission(4000, 'EARLY_BIRD');

      expect(result.rule).toBe('EARLY_BIRD');
      expect(result.ruleApplied).toBe('EARLY_BIRD');
      expect(result.commissionPercentage).toBe(5);
      expect(result.commissionAmount).toBe(200); // 5% of 4000
      expect(result.instructorEarnings).toBe(3800); // 95% of 4000
      expect(result.totalAmount).toBe(4000);
      expect(result.isEarlyBird).toBe(true);
    });

    it('correctly handles fractional prices and rounds cleanly to 2 decimal places', () => {
      const result = calculatePlatformCommission(1999.5, 'DEFAULT');
      expect(result.commissionPercentage).toBe(10);
      expect(result.commissionAmount).toBe(199.95);
      expect(result.instructorEarnings).toBe(1799.55);
    });

    it('correctly handles zero price (free courses)', () => {
      const result = calculatePlatformCommission(0, 'DEFAULT');
      expect(result.commissionAmount).toBe(0);
      expect(result.instructorEarnings).toBe(0);
      expect(result.totalAmount).toBe(0);
    });

    it('safely clamps negative price to 0', () => {
      const result = calculatePlatformCommission(-500, 'EARLY_BIRD');
      expect(result.totalAmount).toBe(0);
      expect(result.commissionAmount).toBe(0);
      expect(result.instructorEarnings).toBe(0);
    });
  });

  describe('processEnrollmentCommission Atomic Server Action & Tracking', () => {
    it('creates PLATFORM_COMMISSION entity with DEFAULT 10% rule tracking', async () => {
      const oldDate = new Date(Date.now() - 100 * 86400000);
      mockCourseFindByIdResult = {
        _id: '65f000000000000000000010',
        createdById: '65f000000000000000000020',
        studentsEnrolled: 80,
        createdAt: oldDate,
        price: 5000,
        originalPrice: 5000,
        isEarlyBird: false,
      };

      const res = await processEnrollmentCommission(
        '65f000000000000000000001',
        '65f000000000000000000010',
        5000
      );

      expect(res.success).toBe(true);
      expect(mockPlatformCommissionCreate).toHaveBeenCalledWith(
        [
          expect.objectContaining({
            courseId: '65f000000000000000000010',
            enrollmentId: '65f000000000000000000001',
            instructorUserId: '65f000000000000000000020',
            totalAmount: 5000,
            commissionPercentage: 10,
            commissionAmount: 500,
            instructorEarnings: 4500,
            commissionRule: 'DEFAULT',
            ruleApplied: 'DEFAULT',
          }),
        ],
        { session: mockSession }
      );

      // Verify instructor balance incremented by 90% (4500 BDT)
      expect(mockUserFindByIdAndUpdate).toHaveBeenCalledWith(
        '65f000000000000000000020',
        {
          $inc: {
            availableBalance: 4500,
            totalEarnings: 4500,
          },
        },
        { session: mockSession }
      );
    });

    it('creates PLATFORM_COMMISSION entity with EARLY_BIRD 5% rule tracking when early bird applies', async () => {
      mockCourseFindByIdResult = {
        _id: '65f000000000000000000010',
        createdById: '65f000000000000000000020',
        studentsEnrolled: 5, // Early cohort qualifies for 5% early bird
        createdAt: new Date(),
        price: 6000,
        originalPrice: 6000,
        isEarlyBird: true,
      };

      const res = await processEnrollmentCommission(
        '65f000000000000000000002',
        '65f000000000000000000010',
        6000,
        { isEarlyBird: true }
      );

      expect(res.success).toBe(true);
      expect(mockPlatformCommissionCreate).toHaveBeenCalledWith(
        [
          expect.objectContaining({
            totalAmount: 6000,
            commissionPercentage: 5,
            commissionAmount: 300,
            instructorEarnings: 5700,
            commissionRule: 'EARLY_BIRD',
            ruleApplied: 'EARLY_BIRD',
          }),
        ],
        { session: mockSession }
      );

      // Verify instructor balance incremented by 95% (5700 BDT)
      expect(mockUserFindByIdAndUpdate).toHaveBeenCalledWith(
        '65f000000000000000000020',
        {
          $inc: {
            availableBalance: 5700,
            totalEarnings: 5700,
          },
        },
        { session: mockSession }
      );

      // Verify enrollment tracking
      expect(mockEnrollmentFindByIdAndUpdate).toHaveBeenCalledWith(
        '65f000000000000000000002',
        {
          isEarlyBird: true,
          commissionRule: 'EARLY_BIRD',
        },
        { session: mockSession }
      );
    });
  });
});
