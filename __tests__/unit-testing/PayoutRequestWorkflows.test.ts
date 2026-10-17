import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  requestPayout,
  approvePayoutRequestAction,
  disbursePayoutRequestAction,
  rejectPayoutRequestAction,
  cancelPayoutRequestAction,
  updatePayoutStatus,
  getPayoutRequestsAction,
  getFinancialLedgerAction,
} from '@/actions/financial';

// Mock DB connect
vi.mock('@/lib/mongoose', () => ({
  default: vi.fn().mockResolvedValue(true),
}));

// Mock Next.js cache revalidatePath
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

// Mock Auth
let mockSessionUser: any = {
  id: '65f000000000000000000099',
  role: 'ADMIN',
  name: 'Admin User',
  email: 'admin@eshikho.com',
};

vi.mock('@/auth', () => ({
  auth: vi.fn(() => Promise.resolve({ user: mockSessionUser })),
}));

// Mock Mongoose Transaction Session
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
      connection: { readyState: 1 },
    },
    startSession: sessionFactory,
  };
});

// Mock AuditLog
const mockAuditLogCreate = vi.fn().mockResolvedValue([{}]);
vi.mock('@/models/AuditLog', () => ({
  default: {
    create: (...args: any[]) => mockAuditLogCreate(...args),
  },
}));

// Mock User
let mockInstructorDoc: any = null;
const mockUserFindByIdAndUpdate = vi.fn().mockResolvedValue({});
vi.mock('@/models/User', () => ({
  default: {
    findById: vi.fn(() => ({
      session: vi.fn().mockResolvedValue(mockInstructorDoc),
      lean: vi.fn().mockResolvedValue(mockInstructorDoc),
    })),
    findByIdAndUpdate: (...args: any[]) => mockUserFindByIdAndUpdate(...args),
    findOne: vi.fn().mockResolvedValue(null),
    create: vi.fn().mockResolvedValue({}),
  },
}));

// Mock PayoutRequest
let mockPayoutDoc: any = null;
const mockPayoutRequestCreate = vi.fn();
const mockPayoutRequestFind = vi.fn();
const mockPayoutRequestFindById = vi.fn();
vi.mock('@/models/PayoutRequest', () => ({
  default: {
    create: (...args: any[]) => mockPayoutRequestCreate(...args),
    findById: vi.fn(() => ({
      session: vi.fn().mockResolvedValue(mockPayoutDoc),
    })),
    find: vi.fn((query?: any) => ({
      populate: vi.fn().mockReturnValue({
        populate: vi.fn().mockReturnValue({
          populate: vi.fn().mockReturnValue({
            populate: vi.fn().mockReturnValue({
              sort: vi.fn().mockReturnValue({
                lean: vi.fn().mockResolvedValue(mockPayoutRequestFind(query) || []),
              }),
            }),
          }),
        }),
      }),
      sort: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue(mockPayoutRequestFind(query) || []),
      }),
      lean: vi.fn().mockResolvedValue(mockPayoutRequestFind(query) || []),
    })),
  },
}));

// Mock FinancialLedger
const mockFinancialLedgerCreate = vi.fn().mockResolvedValue([{}]);
const mockFinancialLedgerUpdateMany = vi.fn().mockResolvedValue({ modifiedCount: 1 });
const mockFinancialLedgerFind = vi.fn();
vi.mock('@/models/FinancialLedger', () => ({
  default: {
    create: (...args: any[]) => mockFinancialLedgerCreate(...args),
    updateMany: (...args: any[]) => mockFinancialLedgerUpdateMany(...args),
    find: vi.fn((query?: any) => ({
      populate: vi.fn().mockReturnValue({
        populate: vi.fn().mockReturnValue({
          populate: vi.fn().mockReturnValue({
            sort: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue({
                lean: vi.fn().mockResolvedValue(mockFinancialLedgerFind(query) || []),
              }),
            }),
          }),
        }),
      }),
      lean: vi.fn().mockResolvedValue(mockFinancialLedgerFind(query) || []),
    })),
  },
}));

describe('Payout Request Workflows & Financial Ledger Engine', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSessionUser = {
      id: '65f000000000000000000099',
      role: 'ADMIN',
      name: 'System Admin',
      email: 'admin@eshikho.com',
    };
  });

  describe('1. Payout Request Initiation (requestPayout)', () => {
    it('rejects invalid or non-positive payout amounts', async () => {
      const resZero = await requestPayout('65f000000000000000000001', 0, 'BKASH', '01711223344');
      expect(resZero.success).toBe(false);
      expect(resZero.error).toMatch(/greater than zero/i);

      const resNegative = await requestPayout('65f000000000000000000001', -500, 'BKASH', '01711223344');
      expect(resNegative.success).toBe(false);
      expect(resNegative.error).toMatch(/greater than zero/i);
    });

    it('rejects requests when instructor has insufficient available balance', async () => {
      mockInstructorDoc = {
        _id: '65f000000000000000000001',
        availableBalance: 2500,
        totalEarnings: 20000,
        save: vi.fn(),
      };

      const res = await requestPayout('65f000000000000000000001', 5000, 'BKASH', '01711223344');
      expect(res.success).toBe(false);
      expect(res.error).toMatch(/insufficient balance/i);
      expect(mockInstructorDoc.save).not.toHaveBeenCalled();
    });

    it('places funds on hold in FinancialLedger and creates PENDING payout request upon valid submission', async () => {
      mockInstructorDoc = {
        _id: '65f000000000000000000001',
        availableBalance: 15000,
        totalEarnings: 40000,
        bankName: '',
        save: vi.fn().mockResolvedValue(true),
      };

      const fakePayout = {
        _id: '65f000000000000000000055',
        userId: '65f000000000000000000001',
        amount: 8000,
        mfsProvider: 'BKASH',
        mfsNumber: '01711223344',
        status: 'PENDING',
      };
      mockPayoutRequestCreate.mockResolvedValue([fakePayout]);

      const res = await requestPayout('65f000000000000000000001', 8000, 'BKASH', '01711223344');

      expect(res.success).toBe(true);
      expect(mockInstructorDoc.availableBalance).toBe(7000); // 15000 - 8000
      expect(mockInstructorDoc.save).toHaveBeenCalled();

      // Verify PayoutRequest was created with PENDING
      expect(mockPayoutRequestCreate).toHaveBeenCalledWith(
        [
          expect.objectContaining({
            userId: '65f000000000000000000001',
            amount: 8000,
            mfsProvider: 'BKASH',
            mfsNumber: '01711223344',
            status: 'PENDING',
          }),
        ],
        { session: mockSession }
      );

      // Verify Escrow Hold entry logged in FinancialLedger
      expect(mockFinancialLedgerCreate).toHaveBeenCalledWith(
        [
          expect.objectContaining({
            entryType: 'PAYOUT_HOLD',
            direction: 'DEBIT',
            accountType: 'ESCROW_PAYOUT_HOLD',
            amount: 8000,
            status: 'PENDING',
          }),
        ],
        { session: mockSession }
      );

      // Verify AuditLog
      expect(mockAuditLogCreate).toHaveBeenCalledWith(
        [
          expect.objectContaining({
            action: 'REQUEST_PAYOUT',
            category: 'FINANCIAL',
          }),
        ],
        { session: mockSession }
      );
    });
  });

  describe('2. Payout Approval Workflow (approvePayoutRequestAction)', () => {
    it('blocks unauthorized regular student accounts from approving payouts', async () => {
      mockSessionUser = { id: 'student-1', role: 'STUDENT' };

      const res = await approvePayoutRequestAction('65f000000000000000000055');
      expect(res.success).toBe(false);
      expect(res.error).toMatch(/unauthorized/i);
    });

    it('blocks approving payouts that are already disbursed or rejected', async () => {
      mockPayoutDoc = {
        _id: '65f000000000000000000055',
        status: 'DISBURSED',
        save: vi.fn(),
      };

      const res = await approvePayoutRequestAction('65f000000000000000000055');
      expect(res.success).toBe(false);
      expect(res.error).toMatch(/already disbursed/i);
    });

    it('transitions status from PENDING to APPROVED and logs approval metadata', async () => {
      mockPayoutDoc = {
        _id: '65f000000000000000000055',
        userId: '65f000000000000000000001',
        amount: 8000,
        mfsProvider: 'BKASH',
        status: 'PENDING',
        save: vi.fn().mockResolvedValue(true),
      };

      const res = await approvePayoutRequestAction(
        '65f000000000000000000055',
        'Verified MFS registered name matches instructor profile'
      );

      expect(res.success).toBe(true);
      expect(mockPayoutDoc.status).toBe('APPROVED');
      expect(mockPayoutDoc.approvedBy).toBe('65f000000000000000000099');
      expect(mockPayoutDoc.adminNotes).toBe('Verified MFS registered name matches instructor profile');
      expect(mockPayoutDoc.save).toHaveBeenCalled();

      expect(mockAuditLogCreate).toHaveBeenCalledWith(
        [
          expect.objectContaining({
            action: 'APPROVE_PAYOUT_REQUEST',
            actorId: '65f000000000000000000099',
          }),
        ],
        { session: mockSession }
      );
    });
  });

  describe('3. Payout Disbursement via Financial Ledger (disbursePayoutRequestAction)', () => {
    it('requires a valid transaction reference for disbursal', async () => {
      const res = await disbursePayoutRequestAction('65f000000000000000000055', '');
      expect(res.success).toBe(false);
      expect(res.error).toMatch(/transaction reference id is required/i);
    });

    it('blocks disbursing already disbursed or rejected payouts', async () => {
      mockPayoutDoc = {
        _id: '65f000000000000000000055',
        status: 'REJECTED',
        save: vi.fn(),
      };

      const res = await disbursePayoutRequestAction('65f000000000000000000055', 'BK-TXN-12345');
      expect(res.success).toBe(false);
      expect(res.error).toMatch(/cannot disburse a rejected/i);
    });

    it('records immutable CLEARED entry in FinancialLedger and marks payout as DISBURSED', async () => {
      mockPayoutDoc = {
        _id: '65f000000000000000000055',
        userId: '65f000000000000000000001',
        amount: 8000,
        mfsProvider: 'BKASH',
        mfsNumber: '01711223344',
        status: 'APPROVED',
        save: vi.fn().mockResolvedValue(true),
      };

      const fakeLedgerDoc = {
        _id: '65f000000000000000000777',
        entryType: 'PAYOUT_DISBURSEMENT',
        amount: 8000,
        referenceId: 'BK-TRX-998877',
      };
      mockFinancialLedgerCreate.mockResolvedValue([fakeLedgerDoc]);

      const res = await disbursePayoutRequestAction(
        '65f000000000000000000055',
        'BK-TRX-998877',
        'Sent via corporate bKash merchant disbursement portal'
      );

      expect(res.success).toBe(true);
      expect(mockPayoutDoc.status).toBe('DISBURSED');
      expect(mockPayoutDoc.transactionId).toBe('BK-TRX-998877');
      expect(mockPayoutDoc.disbursedBy).toBe('65f000000000000000000099');
      expect(mockPayoutDoc.ledgerTransactionId).toBe('65f000000000000000000777');

      // Check Financial Ledger entry
      expect(mockFinancialLedgerCreate).toHaveBeenCalledWith(
        [
          expect.objectContaining({
            entryType: 'PAYOUT_DISBURSEMENT',
            direction: 'DEBIT',
            accountType: 'DISBURSED_OUTFLOW',
            amount: 8000,
            referenceId: 'BK-TRX-998877',
            status: 'CLEARED',
          }),
        ],
        { session: mockSession }
      );

      // Verify prior escrow hold cleared
      expect(mockFinancialLedgerUpdateMany).toHaveBeenCalledWith(
        expect.objectContaining({ payoutRequestId: '65f000000000000000000055', status: 'PENDING' }),
        { $set: { status: 'CLEARED' } },
        { session: mockSession }
      );

      // Check Audit Log
      expect(mockAuditLogCreate).toHaveBeenCalledWith(
        [
          expect.objectContaining({
            action: 'DISBURSE_PAYOUT',
            category: 'FINANCIAL',
          }),
        ],
        { session: mockSession }
      );
    });
  });

  describe('4. Payout Rejection & Wallet Refund (rejectPayoutRequestAction)', () => {
    it('requires a rejection reason to be specified', async () => {
      const res = await rejectPayoutRequestAction('65f000000000000000000055', '');
      expect(res.success).toBe(false);
      expect(res.error).toMatch(/rejection reason must be provided/i);
    });

    it('prevents rejecting an already disbursed payout', async () => {
      mockPayoutDoc = {
        _id: '65f000000000000000000055',
        status: 'DISBURSED',
        save: vi.fn(),
      };

      const res = await rejectPayoutRequestAction('65f000000000000000000055', 'Invalid info');
      expect(res.success).toBe(false);
      expect(res.error).toMatch(/cannot reject an already disbursed/i);
    });

    it('refunds held funds back to instructor availableBalance and logs compensating PAYOUT_REFUND ledger entry', async () => {
      mockPayoutDoc = {
        _id: '65f000000000000000000055',
        userId: '65f000000000000000000001',
        amount: 8000,
        mfsProvider: 'BKASH',
        mfsNumber: '01711223344',
        status: 'PENDING',
        save: vi.fn().mockResolvedValue(true),
      };

      const res = await rejectPayoutRequestAction(
        '65f000000000000000000055',
        'Account number mismatch with registered NID'
      );

      expect(res.success).toBe(true);
      expect(mockPayoutDoc.status).toBe('REJECTED');
      expect(mockPayoutDoc.rejectionReason).toBe('Account number mismatch with registered NID');

      // Verify instructor balance was refunded
      expect(mockUserFindByIdAndUpdate).toHaveBeenCalledWith(
        '65f000000000000000000001',
        { $inc: { availableBalance: 8000 } },
        expect.objectContaining({ session: mockSession })
      );

      // Verify compensating refund in FinancialLedger
      expect(mockFinancialLedgerCreate).toHaveBeenCalledWith(
        [
          expect.objectContaining({
            entryType: 'PAYOUT_REFUND',
            direction: 'CREDIT',
            accountType: 'INSTRUCTOR_BALANCE',
            amount: 8000,
            status: 'CLEARED',
          }),
        ],
        { session: mockSession }
      );

      // Verify prior escrow hold reversed
      expect(mockFinancialLedgerUpdateMany).toHaveBeenCalledWith(
        expect.objectContaining({ payoutRequestId: '65f000000000000000000055', status: 'PENDING' }),
        { $set: { status: 'REVERSED' } },
        { session: mockSession }
      );

      expect(mockAuditLogCreate).toHaveBeenCalledWith(
        [
          expect.objectContaining({
            action: 'REJECT_PAYOUT_REQUEST',
            category: 'FINANCIAL',
          }),
        ],
        { session: mockSession }
      );
    });
  });

  describe('5. Instructor Self-Cancellation (cancelPayoutRequestAction)', () => {
    it('allows owner to cancel their own pending payout request and restores wallet balance', async () => {
      mockSessionUser = { id: '65f000000000000000000001', role: 'INSTRUCTOR' };

      mockPayoutDoc = {
        _id: '65f000000000000000000055',
        userId: '65f000000000000000000001',
        amount: 5000,
        mfsProvider: 'NAGAD',
        mfsNumber: '01812345678',
        status: 'PENDING',
        save: vi.fn().mockResolvedValue(true),
      };

      const res = await cancelPayoutRequestAction('65f000000000000000000055');
      expect(res.success).toBe(true);
      expect(mockPayoutDoc.status).toBe('REJECTED');
      expect(mockPayoutDoc.rejectionReason).toMatch(/cancelled by instructor/i);

      expect(mockUserFindByIdAndUpdate).toHaveBeenCalledWith(
        '65f000000000000000000001',
        { $inc: { availableBalance: 5000 } },
        expect.objectContaining({ session: mockSession })
      );
    });

    it('prevents non-owner regular user from cancelling someone elses payout', async () => {
      mockSessionUser = { id: 'intruder-user', role: 'STUDENT' };

      mockPayoutDoc = {
        _id: '65f000000000000000000055',
        userId: '65f000000000000000000001',
        status: 'PENDING',
        save: vi.fn(),
      };

      const res = await cancelPayoutRequestAction('65f000000000000000000055');
      expect(res.success).toBe(false);
      expect(res.error).toMatch(/unauthorized/i);
    });
  });

  describe('6. Payout Queries & Ledger Aggregation (getPayoutRequestsAction & getFinancialLedgerAction)', () => {
    it('aggregates live KPI counts and financial amounts across lifecycle statuses', async () => {
      mockPayoutRequestFind.mockReturnValue([
        { _id: '1', amount: 10000, status: 'PENDING', mfsProvider: 'BKASH', mfsNumber: '01700' },
        { _id: '2', amount: 15000, status: 'APPROVED', mfsProvider: 'NAGAD', mfsNumber: '01800' },
        { _id: '3', amount: 20000, status: 'DISBURSED', mfsProvider: 'BANK', mfsNumber: '1100' },
        { _id: '4', amount: 5000, status: 'REJECTED', mfsProvider: 'ROCKET', mfsNumber: '01500' },
      ]);

      const res = await getPayoutRequestsAction();
      expect(res.success).toBe(true);
      expect(res.metrics).toBeDefined();
      expect(res.metrics?.totalCount).toBe(4);
      expect(res.metrics?.totalVolume).toBe(50000);
      expect(res.metrics?.pendingCount).toBe(1);
      expect(res.metrics?.pendingAmount).toBe(10000);
      expect(res.metrics?.approvedCount).toBe(1);
      expect(res.metrics?.approvedAmount).toBe(15000);
      expect(res.metrics?.disbursedCount).toBe(1);
      expect(res.metrics?.disbursedAmount).toBe(20000);
      expect(res.metrics?.rejectedCount).toBe(1);
      expect(res.metrics?.rejectedAmount).toBe(5000);
    });

    it('fetches Financial Ledger entries and computes outflow summary stats', async () => {
      mockFinancialLedgerFind.mockReturnValue([
        { _id: 'l1', amount: 20000, entryType: 'PAYOUT_DISBURSEMENT', status: 'CLEARED' },
        { _id: 'l2', amount: 10000, entryType: 'PAYOUT_HOLD', status: 'PENDING' },
        { _id: 'l3', amount: 35000, entryType: 'COURSE_SALE', status: 'CLEARED' },
        { _id: 'l4', amount: 3500, entryType: 'STUDENT_REFUND', status: 'CLEARED' },
      ]);

      const res = await getFinancialLedgerAction();
      expect(res.success).toBe(true);
      expect(res.summary?.totalDisbursedOutflow).toBe(20000);
      expect(res.summary?.totalInEscrowHold).toBe(10000);
      expect(res.summary?.totalCourseSalesInflow).toBe(35000);
      expect(res.summary?.totalStudentRefunds).toBe(3500);
    });
  });
});
