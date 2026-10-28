import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  processRefundRequest,
  getRefundRequestsAction,
  seedDemoRefundRequestsAction,
} from '@/actions/financial';

// Mock Mongoose connection and session
vi.mock('@/lib/mongoose', () => ({
  default: vi.fn().mockResolvedValue(undefined),
}));

// Mock Auth
const mockAuth = vi.fn().mockResolvedValue({
  user: { id: 'admin-user-007', role: 'ADMIN', name: 'System Admin' },
});
vi.mock('@/auth', () => ({
  auth: () => mockAuth(),
}));

// Mock Next.js cache
const mockRevalidatePath = vi.fn();
vi.mock('next/cache', () => ({
  revalidatePath: (...args: any[]) => mockRevalidatePath(...args),
}));

// Mock AuditLog
const mockAuditLogCreate = vi.fn().mockResolvedValue(undefined);
vi.mock('@/models/AuditLog', () => ({
  default: {
    create: (...args: any[]) => mockAuditLogCreate(...args),
  },
}));

// Mock User
const mockUserFindByIdAndUpdate = vi.fn().mockResolvedValue({ _id: 'instructor-1' });
const mockUserFindOne = vi.fn();
const mockUserCreate = vi.fn();
vi.mock('@/models/User', () => ({
  default: {
    findByIdAndUpdate: (...args: any[]) => mockUserFindByIdAndUpdate(...args),
    findOne: (...args: any[]) => ({
      then: (fn: any) => Promise.resolve(mockUserFindOne(...args)).then(fn),
    }),
    create: (...args: any[]) => mockUserCreate(...args),
  },
}));

// Mock Course
const mockCourseFindById = vi.fn();
const mockCourseFindOne = vi.fn();
const mockCourseCreate = vi.fn();
vi.mock('@/models/Course', () => ({
  default: {
    findById: (...args: any[]) => ({
      session: vi.fn().mockResolvedValue(mockCourseFindById(...args)),
      then: (fn: any) => Promise.resolve(mockCourseFindById(...args)).then(fn),
    }),
    findOne: (...args: any[]) => ({
      then: (fn: any) => Promise.resolve(mockCourseFindOne(...args)).then(fn),
    }),
    create: (...args: any[]) => mockCourseCreate(...args),
  },
}));

// Mock Enrollment
const mockEnrollmentFindByIdAndUpdate = vi.fn().mockResolvedValue({ _id: 'enr-123' });
const mockEnrollmentFindOneAndUpdate = vi.fn().mockResolvedValue({ _id: 'enr-123' });
const mockEnrollmentFindById = vi.fn();
const mockEnrollmentFindOne = vi.fn();
const mockEnrollmentCreate = vi.fn();
vi.mock('@/models/Enrollment', () => ({
  default: {
    findByIdAndUpdate: (...args: any[]) => mockEnrollmentFindByIdAndUpdate(...args),
    findOneAndUpdate: (...args: any[]) => mockEnrollmentFindOneAndUpdate(...args),
    findById: (...args: any[]) => ({
      then: (fn: any) => Promise.resolve(mockEnrollmentFindById(...args)).then(fn),
    }),
    findOne: (...args: any[]) => ({
      then: (fn: any) => Promise.resolve(mockEnrollmentFindOne(...args)).then(fn),
    }),
    create: (...args: any[]) => mockEnrollmentCreate(...args),
  },
}));

// Mock PlatformCommission
const mockCommissionSave = vi.fn().mockResolvedValue(undefined);
let mockCommissionDoc: any = null;
const mockCommissionFindOne = vi.fn();
const mockCommissionFindOneAndUpdate = vi.fn();
vi.mock('@/models/PlatformCommission', () => ({
  default: {
    findOne: (...args: any[]) => ({
      session: vi.fn().mockResolvedValue(mockCommissionFindOne(...args)),
      then: (fn: any) => Promise.resolve(mockCommissionFindOne(...args)).then(fn),
    }),
    findOneAndUpdate: (...args: any[]) => mockCommissionFindOneAndUpdate(...args),
  },
}));

// Mock Payment
let mockPaymentDoc: any = null;
const mockPaymentFindById = vi.fn();
const mockPaymentFindOne = vi.fn();
const mockPaymentCreate = vi.fn();
const mockPaymentFind = vi.fn();
vi.mock('@/models/Payment', () => ({
  default: {
    findById: (...args: any[]) => ({
      then: (fn: any) => Promise.resolve(mockPaymentFindById(...args)).then(fn),
    }),
    findOne: (...args: any[]) => ({
      then: (fn: any) => Promise.resolve(mockPaymentFindOne(...args)).then(fn),
    }),
    create: (...args: any[]) => mockPaymentCreate(...args),
    find: (...args: any[]) => ({
      populate: vi.fn().mockReturnValue({
        populate: vi.fn().mockReturnValue({
          populate: vi.fn().mockReturnValue({
            populate: vi.fn().mockReturnValue({
              sort: vi.fn().mockReturnValue({
                lean: vi.fn().mockResolvedValue(mockPaymentFind(...args) || []),
              }),
            }),
          }),
        }),
      }),
    }),
  },
}));

describe('Task T-019: Refund Request Processing Engine & Reconciliation', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default authenticated admin
    mockAuth.mockResolvedValue({
      user: { id: 'admin-123', role: 'ADMIN', name: 'Admin Test' },
    });

    // Default payment document
    mockPaymentDoc = {
      _id: 'payment-555',
      userId: 'student-99',
      courseId: 'course-101',
      enrollmentId: 'enrollment-202',
      amount: 4000,
      paymentMethod: 'BKASH',
      transactionId: 'TXN-BKASH-888',
      payment_status: 'Refund_Requested',
      refundReason: 'Accidental duplicate charge',
      decision: undefined,
      refundAmount: 0,
      save: vi.fn().mockResolvedValue(true),
    };

    mockPaymentFindById.mockImplementation((id: string) => {
      if (id === 'payment-555') return mockPaymentDoc;
      return null;
    });

    mockPaymentFindOne.mockImplementation(() => null);

    // Default commission document
    mockCommissionDoc = {
      _id: 'comm-1',
      courseId: 'course-101',
      enrollmentId: 'enrollment-202',
      instructorUserId: 'instructor-1',
      totalAmount: 4000,
      commissionPercentage: 20,
      commissionAmount: 800,
      instructorEarnings: 3200,
      isRefunded: false,
      save: vi.fn().mockResolvedValue(true),
    };
    mockCommissionFindOne.mockImplementation(() => mockCommissionDoc);
  });

  describe('processRefundRequest - Approval', () => {
    it('atomically updates payment to Refunded and revokes enrollment to Cancelled', async () => {
      const res = await processRefundRequest(
        'payment-555',
        'Approved',
        'Legitimate double billing verified by admin'
      );

      expect(res.success).toBe(true);
      expect(res.decision).toBe('Approved');

      // 1. PAYMENT update
      expect(mockPaymentDoc.payment_status).toBe('Refunded');
      expect(mockPaymentDoc.decision).toBe('Approved');
      expect(mockPaymentDoc.refundAmount).toBe(4000);
      expect(mockPaymentDoc.refundReason).toBe('Legitimate double billing verified by admin');
      expect(mockPaymentDoc.refundedBy).toBe('admin-123');
      expect(mockPaymentDoc.save).toHaveBeenCalled();

      // 2. ENROLLMENT access revocation
      expect(mockEnrollmentFindByIdAndUpdate).toHaveBeenCalledWith(
        'enrollment-202',
        { paymentStatus: 'Cancelled' },
        undefined
      );

      // 3. Platform Financial Balance Adjustments
      expect(mockUserFindByIdAndUpdate).toHaveBeenCalledWith(
        'instructor-1',
        {
          $inc: {
            availableBalance: -3200,
            totalEarnings: -3200,
          },
        },
        undefined
      );
      expect(mockCommissionDoc.isRefunded).toBe(true);
      expect(mockCommissionDoc.save).toHaveBeenCalled();

      // 4. Immutable Audit Log
      expect(mockAuditLogCreate).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            action: 'REFUND_APPROVED',
            category: 'FINANCIAL',
            actorId: 'admin-123',
            targetId: 'student-99',
            details: expect.objectContaining({
              paymentId: 'payment-555',
              transactionId: 'TXN-BKASH-888',
              amount: 4000,
            }),
          }),
        ]),
        undefined
      );

      // Cache revalidation
      expect(mockRevalidatePath).toHaveBeenCalledWith('/admin/refunds');
    });

    it('handles refund approval when no commission document exists by looking up course instructor', async () => {
      mockCommissionFindOne.mockReturnValue(null);
      mockCourseFindById.mockResolvedValue({
        _id: 'course-101',
        createdById: 'instructor-fallback',
      });

      const res = await processRefundRequest('payment-555', 'Approved', 'Refund without prior commission doc');
      expect(res.success).toBe(true);

      // (4000 * 80) / 100 = 3200
      expect(mockUserFindByIdAndUpdate).toHaveBeenCalledWith(
        'instructor-fallback',
        {
          $inc: {
            availableBalance: -3200,
            totalEarnings: -3200,
          },
        },
        undefined
      );
    });

    it('supports MODERATOR and SUPERADMIN roles', async () => {
      mockAuth.mockResolvedValueOnce({
        user: { id: 'mod-1', role: 'MODERATOR', name: 'Moderator Jack' },
      });

      const res = await processRefundRequest('payment-555', 'Approved');
      expect(res.success).toBe(true);
      expect(mockPaymentDoc.payment_status).toBe('Refunded');
    });
  });

  describe('processRefundRequest - Rejection', () => {
    it('records rejection rationale and keeps student enrollment active', async () => {
      const res = await processRefundRequest(
        'payment-555',
        'Rejected',
        'Course was completed over 80%; outside refund policy window.'
      );

      expect(res.success).toBe(true);
      expect(res.decision).toBe('Rejected');

      // Payment status transition
      expect(mockPaymentDoc.decision).toBe('Rejected');
      expect(mockPaymentDoc.payment_status).toBe('Completed');
      expect(mockPaymentDoc.refundReason).toContain('outside refund policy window');
      expect(mockPaymentDoc.save).toHaveBeenCalled();

      // Enrollment remains active ('success')
      expect(mockEnrollmentFindByIdAndUpdate).toHaveBeenCalledWith(
        'enrollment-202',
        { paymentStatus: 'success' },
        undefined
      );

      // Instructor balance is NOT clawed back
      expect(mockUserFindByIdAndUpdate).not.toHaveBeenCalled();
      expect(mockCommissionDoc.isRefunded).toBe(false);

      // Audit Log for rejection
      expect(mockAuditLogCreate).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            action: 'REFUND_REJECTED',
            category: 'FINANCIAL',
            actorId: 'admin-123',
            targetId: 'student-99',
            details: expect.objectContaining({
              paymentId: 'payment-555',
              decision: 'Rejected',
            }),
          }),
        ]),
        undefined
      );
    });
  });

  describe('Security & Validation', () => {
    it('blocks unauthenticated requests', async () => {
      mockAuth.mockResolvedValueOnce(null);

      const res = await processRefundRequest('payment-555', 'Approved');
      expect(res.success).toBe(false);
      expect(res.error).toMatch(/Unauthorized/i);
    });

    it('blocks unauthorized roles (STUDENT, INSTRUCTOR)', async () => {
      mockAuth.mockResolvedValueOnce({
        user: { id: 'student-1', role: 'STUDENT', name: 'Regular Student' },
      });

      const res = await processRefundRequest('payment-555', 'Approved');
      expect(res.success).toBe(false);
      expect(res.error).toMatch(/Unauthorized/i);
    });

    it('returns error when payment record is not found and cannot be created', async () => {
      mockPaymentFindById.mockReturnValueOnce(null);
      mockPaymentFindOne.mockReturnValueOnce(null);
      mockEnrollmentFindById.mockResolvedValueOnce(null);

      const res = await processRefundRequest('non-existent-id', 'Approved');
      expect(res.success).toBe(false);
      expect(res.error).toMatch(/Payment record not found/i);
    });
  });

  describe('getRefundRequestsAction', () => {
    it('fetches and filters serialized payments for authorized admins', async () => {
      mockPaymentFind.mockReturnValueOnce([
        {
          _id: 'p-1',
          userId: { _id: 'u-1', name: 'Rahim Khan', email: 'rahim@test.com' },
          courseId: { _id: 'c-1', title: 'Next.js Mastery' },
          enrollmentId: { _id: 'e-1', paymentStatus: 'success' },
          amount: 3000,
          paymentMethod: 'BKASH',
          transactionId: 'TXN-111',
          payment_status: 'Refund_Requested',
          refundReason: 'Accidental payment',
          createdAt: new Date().toISOString(),
        },
        {
          _id: 'p-2',
          userId: { _id: 'u-2', name: 'Karim Ahmed', email: 'karim@test.com' },
          courseId: { _id: 'c-2', title: 'Python AI' },
          enrollmentId: { _id: 'e-2', paymentStatus: 'Cancelled' },
          amount: 5000,
          paymentMethod: 'NAGAD',
          transactionId: 'TXN-222',
          payment_status: 'Refunded',
          refundReason: 'Resolved refund',
          createdAt: new Date().toISOString(),
        },
      ]);

      const res = await getRefundRequestsAction();
      expect(res.success).toBe(true);
      expect(res.payments).toHaveLength(2);
      expect(res.payments[0].transactionId).toBe('TXN-111');
      expect(res.payments[0].user.name).toBe('Rahim Khan');
    });

    it('filters by search term correctly', async () => {
      mockPaymentFind.mockReturnValueOnce([
        {
          _id: 'p-1',
          userId: { _id: 'u-1', name: 'Rahim Khan', email: 'rahim@test.com' },
          courseId: { _id: 'c-1', title: 'Next.js Mastery' },
          amount: 3000,
          paymentMethod: 'BKASH',
          transactionId: 'TXN-SEARCH-MATCH',
          payment_status: 'Refund_Requested',
          createdAt: new Date().toISOString(),
        },
        {
          _id: 'p-2',
          userId: { _id: 'u-2', name: 'Karim Ahmed', email: 'karim@test.com' },
          courseId: { _id: 'c-2', title: 'Python AI' },
          amount: 5000,
          paymentMethod: 'NAGAD',
          transactionId: 'TXN-OTHER',
          payment_status: 'Refunded',
          createdAt: new Date().toISOString(),
        },
      ]);

      const res = await getRefundRequestsAction({ search: 'SEARCH-MATCH' });
      expect(res.success).toBe(true);
      expect(res.payments).toHaveLength(1);
      expect(res.payments[0].transactionId).toBe('TXN-SEARCH-MATCH');
    });
  });

  describe('seedDemoRefundRequestsAction', () => {
    it('refuses to create sample financial records', async () => {
      mockUserFindOne.mockResolvedValue({ _id: 'mock-user-1' });
      mockCourseFindOne.mockResolvedValue({ _id: 'mock-course-1' });
      mockEnrollmentFindOne.mockResolvedValue({ _id: 'mock-enr-1' });
      mockPaymentFindOne.mockResolvedValue(null);
      mockPaymentCreate.mockResolvedValue({ _id: 'new-payment' });

      const res = await seedDemoRefundRequestsAction();
      expect(res.success).toBe(false);
      expect(mockPaymentCreate).not.toHaveBeenCalled();
    });
  });
});
