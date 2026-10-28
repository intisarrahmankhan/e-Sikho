'use server';

import mongoose from 'mongoose';
import dbConnect from '@/lib/mongoose';
import PayoutRequest from '@/models/PayoutRequest';
import PlatformCommission from '@/models/PlatformCommission';
import User from '@/models/User';
import Course from '@/models/Course';
import Enrollment from '@/models/Enrollment';
import AuditLog from '@/models/AuditLog';
import Payment from '@/models/Payment';
import FinancialLedger from '@/models/FinancialLedger';
import { auth } from '@/auth';
import { isValidMongoObjectId } from '@/lib/auth-helpers';
import { revalidatePath } from 'next/cache';
import {
  calculatePlatformCommission,
  COMMISSION_RULES,
  PlatformCommissionRuleType,
} from '@/lib/commission';

/**
 * Calculates platform commission and updates instructor balance.
 * Implements configurable commission rules:
 * - Default rule: 10% platform commission
 * - Early Bird rule: 5% platform commission
 * Runs atomically using a Mongoose transaction.
 */
export async function processEnrollmentCommission(
  enrollmentId: string,
  courseId: string,
  price: number,
  options?: {
    isEarlyBird?: boolean;
    rule?: PlatformCommissionRuleType | string;
  }
) {
  const actor = await auth();
  if (!actor?.user || !['ADMIN', 'SUPERADMIN'].includes((actor.user as any).role)) {
    return { success: false, error: 'Administrator access is required for commission processing.' };
  }
  if (!Number.isFinite(price) || price <= 0) return { success: false, error: 'A positive payment amount is required.' };
  // Use a mongoose session for transaction
  await dbConnect();
  const dbSession = await mongoose.startSession();
  
  try {
    dbSession.startTransaction();

    const course = await Course.findById(courseId).session(dbSession);
    if (!course) throw new Error('Course not found');

    // Calculate commission using configured business rules (10% Default, 5% Early Bird)
    const calc = calculatePlatformCommission(price, options, course);

    // Create the commission record with rule tracking
    await PlatformCommission.create(
      [
        {
          courseId,
          enrollmentId,
          instructorUserId: course.createdById,
          totalAmount: calc.totalAmount,
          commissionPercentage: calc.commissionPercentage,
          commissionAmount: calc.commissionAmount,
          instructorEarnings: calc.instructorEarnings,
          commissionRule: calc.rule,
          ruleApplied: calc.ruleApplied,
        },
      ],
      { session: dbSession }
    );

    // Update enrollment with early bird / rule information if present
    if (isValidMongoObjectId(enrollmentId)) {
      await Enrollment.findByIdAndUpdate(
        enrollmentId,
        {
          isEarlyBird: calc.isEarlyBird,
          commissionRule: calc.rule,
        },
        { session: dbSession }
      );
    }

    // Update the instructor's balance
    if (course.createdById && isValidMongoObjectId(course.createdById)) {
      await User.findByIdAndUpdate(
        course.createdById,
        {
          $inc: {
            availableBalance: calc.instructorEarnings,
            totalEarnings: calc.instructorEarnings,
          },
        },
        { session: dbSession }
      );
    }

    await dbSession.commitTransaction();
    return { success: true, commission: calc };
  } catch (error) {
    await dbSession.abortTransaction();
    console.error('Error processing commission:', error);
    return { success: false, error: 'Transaction failed' };
  } finally {
    dbSession.endSession();
  }
}

/**
 * Request a payout for an instructor
 * Validates available balance, places funds on hold, and logs ledger transaction.
 */
export async function requestPayout(
  userId: string,
  amount: number,
  mfsProvider: 'BKASH' | 'NAGAD' | 'ROCKET' | 'BANK',
  mfsNumber: string,
  bankDetails?: {
    bankName?: string;
    bankBranch?: string;
    bankAccountName?: string;
  }
) {
  await dbConnect();
  const dbSession = await mongoose.startSession();

  try {
    dbSession.startTransaction();

    if (!isValidMongoObjectId(userId)) throw new Error('Invalid user ID');
    if (!amount || amount <= 0) throw new Error('Payout amount must be greater than zero');
    if (!mfsNumber || !mfsNumber.trim()) throw new Error('Account/MFS number is required');

    const user = await User.findById(userId).session(dbSession);
    if (!user) throw new Error('User not found');
    if (user.availableBalance < amount) {
      throw new Error(`Insufficient balance. Available: ৳${user.availableBalance.toLocaleString()}, Requested: ৳${amount.toLocaleString()}`);
    }

    // Deduct from available balance immediately to prevent double spending
    const prevBalance = user.availableBalance;
    user.availableBalance -= amount;
    await user.save({ session: dbSession });

    // Create payout request with PENDING status
    const request = await PayoutRequest.create(
      [
        {
          userId,
          amount,
          mfsProvider,
          mfsNumber,
          bankName: bankDetails?.bankName || user.bankName || '',
          bankBranch: bankDetails?.bankBranch || user.bankBranch || '',
          bankAccountName: bankDetails?.bankAccountName || user.bankAccountName || '',
          status: 'PENDING' as const,
          requestedAt: new Date(),
        },
      ],
      { session: dbSession }
    );

    const createdPayout = request[0];

    // Record Escrow Hold in Financial Ledger
    await FinancialLedger.create(
      [
        {
          entryType: 'PAYOUT_HOLD',
          direction: 'DEBIT',
          accountType: 'ESCROW_PAYOUT_HOLD',
          amount,
          currency: 'BDT',
          userId,
          payoutRequestId: createdPayout._id,
          referenceId: `HOLD-${createdPayout._id.toString().slice(-8)}`,
          provider: mfsProvider,
          accountNumber: mfsNumber,
          status: 'PENDING',
          description: `Payout Hold: ৳${amount.toLocaleString()} reserved for ${mfsProvider} transfer to ${mfsNumber}`,
          performedBy: userId,
          balanceBefore: prevBalance,
          balanceAfter: user.availableBalance,
        },
      ],
      { session: dbSession }
    );

    // Audit Log
    await AuditLog.create(
      [
        {
          action: 'REQUEST_PAYOUT',
          category: 'FINANCIAL',
          actorId: userId,
          targetId: userId,
          details: {
            payoutRequestId: createdPayout._id.toString(),
            amount,
            mfsProvider,
            mfsNumber,
          },
        },
      ],
      { session: dbSession }
    );

    await dbSession.commitTransaction();

    revalidatePath('/admin/payouts');
    revalidatePath('/admin');
    revalidatePath('/instructor');

    return { success: true, payoutRequest: createdPayout };
  } catch (error) {
    await dbSession.abortTransaction();
    return { success: false, error: error instanceof Error ? error.message : 'Payout request failed' };
  } finally {
    dbSession.endSession();
  }
}

/**
 * Approve a Payout Request (Admin / Superadmin)
 * Moves status from PENDING/REQUESTED to APPROVED.
 */
export async function approvePayoutRequestAction(requestId: string, adminNotes?: string) {
  const session = await auth();
  const userId = (session?.user as any)?.id;
  const role = (session?.user as any)?.role;

  if (!userId || (role !== 'ADMIN' && role !== 'SUPERADMIN')) {
    return { success: false, error: 'Unauthorized. Admin or Superadmin access required to approve payouts.' };
  }

  await dbConnect();
  const dbSession = await mongoose.startSession();

  try {
    dbSession.startTransaction();

    const payout = await PayoutRequest.findById(requestId).session(dbSession);
    if (!payout) throw new Error('Payout request not found');

    if (payout.status === 'DISBURSED') {
      throw new Error('Payout request is already disbursed and finalized');
    }
    if (payout.status === 'REJECTED') {
      throw new Error('Payout request was already rejected');
    }
    if (payout.status === 'APPROVED') {
      throw new Error('Payout request is already approved');
    }

    payout.status = 'APPROVED';
    payout.approvedBy = userId;
    payout.approvedAt = new Date();
    if (adminNotes) payout.adminNotes = adminNotes;
    await payout.save({ session: dbSession });

    await AuditLog.create(
      [
        {
          action: 'APPROVE_PAYOUT_REQUEST',
          category: 'FINANCIAL',
          actorId: userId,
          targetId: payout.userId,
          details: {
            requestId,
            amount: payout.amount,
            mfsProvider: payout.mfsProvider,
            adminNotes,
          },
        },
      ],
      { session: dbSession }
    );

    await dbSession.commitTransaction();

    revalidatePath('/admin/payouts');
    revalidatePath('/admin');
    revalidatePath('/instructor');

    return { success: true, payout: JSON.parse(JSON.stringify(payout)) };
  } catch (error) {
    await dbSession.abortTransaction();
    return { success: false, error: error instanceof Error ? error.message : 'Approval failed' };
  } finally {
    dbSession.endSession();
  }
}

/**
 * Disburse a Payout Request via Financial Ledger (Admin / Superadmin)
 * Moves status from APPROVED to DISBURSED, records external Transaction ID,
 * and creates an immutable CLEARED entry in the Financial Ledger.
 */
export async function disbursePayoutRequestAction(
  requestId: string,
  transactionId: string,
  disbursementNotes?: string
) {
  const session = await auth();
  const userId = (session?.user as any)?.id;
  const role = (session?.user as any)?.role;

  if (!userId || (role !== 'ADMIN' && role !== 'SUPERADMIN')) {
    return { success: false, error: 'Unauthorized. Admin or Superadmin access required to disburse payouts.' };
  }

  if (!transactionId || !transactionId.trim()) {
    return { success: false, error: 'MFS or Bank Transaction Reference ID is required for disbursement.' };
  }

  await dbConnect();
  const dbSession = await mongoose.startSession();

  try {
    dbSession.startTransaction();

    const payout = await PayoutRequest.findById(requestId).session(dbSession);
    if (!payout) throw new Error('Payout request not found');

    if (payout.status === 'DISBURSED') {
      throw new Error('Payout request is already marked as disbursed');
    }
    if (payout.status === 'REJECTED') {
      throw new Error('Cannot disburse a rejected payout request');
    }
    if (payout.status !== 'APPROVED' && payout.status !== 'REQUESTED' && payout.status !== 'PENDING') {
      throw new Error('Invalid payout state for disbursement');
    }

    const instructor = await User.findById(payout.userId).session(dbSession);

    // Record immutable CLEARED transaction in Financial Ledger
    const ledger = await FinancialLedger.create(
      [
        {
          entryType: 'PAYOUT_DISBURSEMENT',
          direction: 'DEBIT',
          accountType: 'DISBURSED_OUTFLOW',
          amount: payout.amount,
          currency: 'BDT',
          userId: payout.userId,
          payoutRequestId: payout._id,
          referenceId: transactionId.trim(),
          provider: payout.mfsProvider,
          accountNumber: payout.mfsNumber,
          status: 'CLEARED',
          description: `Disbursement of ৳${payout.amount.toLocaleString()} via ${payout.mfsProvider} to ${payout.mfsNumber} (Txn: ${transactionId.trim()})`,
          performedBy: userId,
          balanceBefore: instructor?.availableBalance,
          balanceAfter: instructor?.availableBalance,
          metadata: {
            disbursementNotes: disbursementNotes || '',
            bankName: payout.bankName,
            bankBranch: payout.bankBranch,
            bankAccountName: payout.bankAccountName,
          },
        },
      ],
      { session: dbSession }
    );

    // Update PayoutRequest
    payout.status = 'DISBURSED';
    payout.transactionId = transactionId.trim();
    payout.disbursedBy = userId;
    payout.disbursedAt = new Date();
    payout.processedAt = new Date();
    payout.ledgerTransactionId = ledger[0]._id.toString();
    if (disbursementNotes) payout.adminNotes = disbursementNotes;
    await payout.save({ session: dbSession });

    // Mark previous hold ledger entry as CLEARED if it exists
    await FinancialLedger.updateMany(
      { payoutRequestId: payout._id, entryType: 'PAYOUT_HOLD', status: 'PENDING' },
      { $set: { status: 'CLEARED' } },
      { session: dbSession }
    );

    // Audit Log
    await AuditLog.create(
      [
        {
          action: 'DISBURSE_PAYOUT',
          category: 'FINANCIAL',
          actorId: userId,
          targetId: payout.userId,
          details: {
            requestId,
            amount: payout.amount,
            mfsProvider: payout.mfsProvider,
            mfsNumber: payout.mfsNumber,
            transactionId: transactionId.trim(),
            ledgerEntryId: ledger[0]._id.toString(),
            disbursementNotes,
          },
        },
      ],
      { session: dbSession }
    );

    await dbSession.commitTransaction();

    revalidatePath('/admin/payouts');
    revalidatePath('/admin');
    revalidatePath('/instructor');

    return {
      success: true,
      payout: JSON.parse(JSON.stringify(payout)),
      ledgerEntry: JSON.parse(JSON.stringify(ledger[0])),
      message: `Successfully disbursed ৳${payout.amount.toLocaleString()} via ${payout.mfsProvider} (TXN: ${transactionId.trim()}) and recorded in Financial Ledger.`,
    };
  } catch (error) {
    await dbSession.abortTransaction();
    return { success: false, error: error instanceof Error ? error.message : 'Disbursement failed' };
  } finally {
    dbSession.endSession();
  }
}

/**
 * Reject a Payout Request (Admin / Superadmin)
 * Moves status to REJECTED, refunds held funds back to instructor's availableBalance,
 * and logs a compensating PAYOUT_REFUND entry in the Financial Ledger.
 */
export async function rejectPayoutRequestAction(requestId: string, rejectionReason: string) {
  const session = await auth();
  const userId = (session?.user as any)?.id;
  const role = (session?.user as any)?.role;

  if (!userId || (role !== 'ADMIN' && role !== 'SUPERADMIN')) {
    return { success: false, error: 'Unauthorized. Admin or Superadmin access required to reject payouts.' };
  }

  if (!rejectionReason || !rejectionReason.trim()) {
    return { success: false, error: 'A valid rejection reason must be provided.' };
  }

  await dbConnect();
  const dbSession = await mongoose.startSession();

  try {
    dbSession.startTransaction();

    const payout = await PayoutRequest.findById(requestId).session(dbSession);
    if (!payout) throw new Error('Payout request not found');

    if (payout.status === 'DISBURSED') {
      throw new Error('Cannot reject an already disbursed payout');
    }
    if (payout.status === 'REJECTED') {
      throw new Error('Payout request is already rejected');
    }

    // Refund the held amount back to the instructor's wallet
    const updatedUser = await User.findByIdAndUpdate(
      payout.userId,
      { $inc: { availableBalance: payout.amount } },
      { new: true, session: dbSession }
    );

    // Record compensating refund entry in Financial Ledger
    await FinancialLedger.create(
      [
        {
          entryType: 'PAYOUT_REFUND',
          direction: 'CREDIT',
          accountType: 'INSTRUCTOR_BALANCE',
          amount: payout.amount,
          currency: 'BDT',
          userId: payout.userId,
          payoutRequestId: payout._id,
          referenceId: `REFUND-${payout._id.toString().slice(-8)}`,
          provider: payout.mfsProvider,
          accountNumber: payout.mfsNumber,
          status: 'CLEARED',
          description: `Payout rejected: ৳${payout.amount.toLocaleString()} restored to instructor wallet. Reason: ${rejectionReason.trim()}`,
          performedBy: userId,
          balanceAfter: updatedUser?.availableBalance,
        },
      ],
      { session: dbSession }
    );

    // Update previous hold ledger entry to REVERSED
    await FinancialLedger.updateMany(
      { payoutRequestId: payout._id, entryType: 'PAYOUT_HOLD', status: 'PENDING' },
      { $set: { status: 'REVERSED' } },
      { session: dbSession }
    );

    payout.status = 'REJECTED';
    payout.rejectionReason = rejectionReason.trim();
    payout.rejectedBy = userId;
    payout.rejectedAt = new Date();
    payout.processedAt = new Date();
    await payout.save({ session: dbSession });

    // Audit Log
    await AuditLog.create(
      [
        {
          action: 'REJECT_PAYOUT_REQUEST',
          category: 'FINANCIAL',
          actorId: userId,
          targetId: payout.userId,
          details: {
            requestId,
            amount: payout.amount,
            rejectionReason: rejectionReason.trim(),
            refundedToBalance: true,
          },
        },
      ],
      { session: dbSession }
    );

    await dbSession.commitTransaction();

    revalidatePath('/admin/payouts');
    revalidatePath('/admin');
    revalidatePath('/instructor');

    return {
      success: true,
      payout: JSON.parse(JSON.stringify(payout)),
      message: `Payout rejected and ৳${payout.amount.toLocaleString()} returned to instructor wallet.`,
    };
  } catch (error) {
    await dbSession.abortTransaction();
    return { success: false, error: error instanceof Error ? error.message : 'Rejection failed' };
  } finally {
    dbSession.endSession();
  }
}

/**
 * Cancel a Payout Request (Instructor self-service or Admin)
 * Can only cancel requests that are still PENDING or REQUESTED.
 */
export async function cancelPayoutRequestAction(requestId: string) {
  const session = await auth();
  const currentUserId = (session?.user as any)?.id;
  const role = (session?.user as any)?.role;

  if (!currentUserId) {
    return { success: false, error: 'Unauthorized. Please log in.' };
  }

  await dbConnect();
  const dbSession = await mongoose.startSession();

  try {
    dbSession.startTransaction();

    const payout = await PayoutRequest.findById(requestId).session(dbSession);
    if (!payout) throw new Error('Payout request not found');

    const isOwner = String(payout.userId) === String(currentUserId);
    const isAdmin = role === 'ADMIN' || role === 'SUPERADMIN';

    if (!isOwner && !isAdmin) {
      throw new Error('Unauthorized to cancel this payout request');
    }

    if (payout.status !== 'PENDING' && payout.status !== 'REQUESTED') {
      throw new Error(`Cannot cancel a payout with status "${payout.status}". Only pending requests can be cancelled.`);
    }

    // Refund back to instructor wallet
    const updatedUser = await User.findByIdAndUpdate(
      payout.userId,
      { $inc: { availableBalance: payout.amount } },
      { new: true, session: dbSession }
    );

    // Record ledger reversal
    await FinancialLedger.create(
      [
        {
          entryType: 'PAYOUT_REFUND',
          direction: 'CREDIT',
          accountType: 'INSTRUCTOR_BALANCE',
          amount: payout.amount,
          currency: 'BDT',
          userId: payout.userId,
          payoutRequestId: payout._id,
          referenceId: `CANCEL-${payout._id.toString().slice(-8)}`,
          provider: payout.mfsProvider,
          accountNumber: payout.mfsNumber,
          status: 'CLEARED',
          description: `Payout cancelled by instructor: ৳${payout.amount.toLocaleString()} restored to wallet.`,
          performedBy: currentUserId,
          balanceAfter: updatedUser?.availableBalance,
        },
      ],
      { session: dbSession }
    );

    // Mark previous hold as REVERSED
    await FinancialLedger.updateMany(
      { payoutRequestId: payout._id, entryType: 'PAYOUT_HOLD', status: 'PENDING' },
      { $set: { status: 'REVERSED' } },
      { session: dbSession }
    );

    payout.status = 'REJECTED';
    payout.rejectionReason = 'Cancelled by instructor';
    payout.processedAt = new Date();
    await payout.save({ session: dbSession });

    await dbSession.commitTransaction();

    revalidatePath('/admin/payouts');
    revalidatePath('/instructor');

    return { success: true, message: 'Payout request cancelled successfully and funds returned to your balance.' };
  } catch (error) {
    await dbSession.abortTransaction();
    return { success: false, error: error instanceof Error ? error.message : 'Cancellation failed' };
  } finally {
    dbSession.endSession();
  }
}

/**
 * Universal payout status update (Admin / Superadmin)
 * Integrates with the Financial Ledger and dispatches to specific lifecycle actions.
 */
export async function updatePayoutStatus(
  requestId: string,
  status: 'APPROVED' | 'DISBURSED' | 'REJECTED',
  transactionId?: string,
  rejectionReason?: string
) {
  if (status === 'APPROVED') {
    return approvePayoutRequestAction(requestId);
  } else if (status === 'DISBURSED') {
    if (!transactionId) {
      return { success: false, error: 'Transaction ID is required for disbursed payouts' };
    }
    return disbursePayoutRequestAction(requestId, transactionId);
  } else if (status === 'REJECTED') {
    return rejectPayoutRequestAction(requestId, rejectionReason || 'Rejected by administrator');
  }

  return { success: false, error: 'Invalid payout status requested' };
}

/**
 * Task T-019: Refund Request Processing Engine
 * processRefundRequest(paymentId, decision, refundReason)
 *
 * Details:
 *   - Upon approval:
 *     - update PAYMENT.payment_status to 'Refunded'
 *     - revoke student's active status on ENROLLMENT to 'Cancelled'
 *     - adjust the platform financial balance (reverse commission and instructor earnings)
 *   - Upon rejection:
 *     - record refundReason and keep payment status 'Completed'
 *     - retain student active course access
 */
export async function processRefundRequest(
  paymentId: string,
  decision: 'Approved' | 'Rejected' | 'APPROVE' | 'REJECT',
  refundReason?: string
) {
  try {
    const session = await auth();
    const userId = (session?.user as any)?.id;
    const role = (session?.user as any)?.role;

    if (!userId || (role !== 'ADMIN' && role !== 'SUPERADMIN' && role !== 'MODERATOR')) {
      return { success: false, error: 'Unauthorized. Admin or Moderator access required.' };
    }

    await dbConnect();

    const normalizedDecision =
      decision.toUpperCase() === 'APPROVE' || decision.toLowerCase() === 'approved'
        ? 'Approved'
        : 'Rejected';

    // 1. Locate Payment record (by ID or transactionId or enrollmentId)
    let payment = await Payment.findById(paymentId);
    if (!payment) {
      payment = await Payment.findOne({
        $or: [{ transactionId: paymentId }, { enrollmentId: paymentId }],
      });
    }

    if (!payment) {
      // Check if paymentId was an Enrollment ID
      const enr = await Enrollment.findById(paymentId);
      if (enr) {
        payment = await Payment.create({
          userId: enr.userId,
          courseId: enr.courseId,
          enrollmentId: enr._id,
          amount: enr.amountPaid || 3500,
          paymentMethod: 'BKASH',
          transactionId: enr.transactionId || `TXN-REF-${Date.now()}`,
          payment_status: 'Refund_Requested',
          refundReason: refundReason || 'Disputed course purchase',
        });
      } else {
        return { success: false, error: 'Payment record not found.' };
      }
    }

    const dbSession =
      mongoose.connection?.readyState === 1 ? await mongoose.startSession() : null;
    if (dbSession) {
      try {
        dbSession.startTransaction();
      } catch {
        // standalone mongod
      }
    }

    try {
      if (normalizedDecision === 'Approved') {
        // 1. Update PAYMENT.payment_status to 'Refunded'
        payment.payment_status = 'Refunded';
        payment.decision = 'Approved';
        payment.refundReason = refundReason || 'Refund approved by administrator';
        payment.refundedAt = new Date();
        payment.refundedBy = userId as any;
        payment.refundAmount = payment.amount;
        await payment.save(dbSession ? { session: dbSession } : undefined);

        // 2. Revoke active status on ENROLLMENT to 'Cancelled'
        if (payment.enrollmentId) {
          await Enrollment.findByIdAndUpdate(
            payment.enrollmentId,
            { paymentStatus: 'Cancelled' },
            dbSession ? { session: dbSession } : undefined
          );
        } else {
          await Enrollment.findOneAndUpdate(
            { userId: payment.userId, courseId: payment.courseId },
            { paymentStatus: 'Cancelled' },
            dbSession ? { session: dbSession } : undefined
          );
        }

        // 3. Adjust platform financial balance
        const commission = await PlatformCommission.findOne({
          $or: [
            { enrollmentId: payment.enrollmentId },
            { courseId: payment.courseId, totalAmount: payment.amount },
          ],
        }).session(dbSession || null);

        if (commission && !commission.isRefunded) {
          // Deduct the instructor's earnings
          if (commission.instructorUserId) {
            await User.findByIdAndUpdate(
              commission.instructorUserId,
              {
                $inc: {
                  availableBalance: -commission.instructorEarnings,
                  totalEarnings: -commission.instructorEarnings,
                },
              },
              dbSession ? { session: dbSession } : undefined
            );
          }

          commission.isRefunded = true;
          commission.refundedAt = new Date();
          await commission.save(dbSession ? { session: dbSession } : undefined);
        } else {
          // If no commission document exists, check course instructor and adjust
          const course = await Course.findById(payment.courseId).session(dbSession || null);
          if (course?.createdById) {
            const calculatedEarnings = (payment.amount * 80) / 100;
            await User.findByIdAndUpdate(
              course.createdById,
              {
                $inc: {
                  availableBalance: -calculatedEarnings,
                  totalEarnings: -calculatedEarnings,
                },
              },
              dbSession ? { session: dbSession } : undefined
            );
          }
        }

        // 4. Log Audit
        await AuditLog.create(
          [
            {
              action: 'REFUND_APPROVED',
              category: 'FINANCIAL',
              actorId: userId,
              targetId: payment.userId,
              details: {
                paymentId: payment._id.toString(),
                transactionId: payment.transactionId,
                amount: payment.amount,
                refundReason,
              },
            },
          ],
          dbSession ? { session: dbSession } : undefined
        );
      } else {
        // Rejected
        payment.decision = 'Rejected';
        payment.refundReason = refundReason || 'Dispute rejected by administrator';
        payment.disputeNotes = refundReason || 'Payment dispute investigated and rejected.';
        if (payment.payment_status === 'Refund_Requested') {
          payment.payment_status = 'Completed';
        }
        await payment.save(dbSession ? { session: dbSession } : undefined);

        // Keep enrollment active
        if (payment.enrollmentId) {
          await Enrollment.findByIdAndUpdate(
            payment.enrollmentId,
            { paymentStatus: 'success' },
            dbSession ? { session: dbSession } : undefined
          );
        }

        // Audit Log
        await AuditLog.create(
          [
            {
              action: 'REFUND_REJECTED',
              category: 'FINANCIAL',
              actorId: userId,
              targetId: payment.userId,
              details: {
                paymentId: payment._id.toString(),
                transactionId: payment.transactionId,
                decision: 'Rejected',
                reason: refundReason,
              },
            },
          ],
          dbSession ? { session: dbSession } : undefined
        );
      }

      if (dbSession) {
        await dbSession.commitTransaction();
      }
    } catch (txErr) {
      if (dbSession) {
        await dbSession.abortTransaction();
      }
      throw txErr;
    } finally {
      if (dbSession) {
        await dbSession.endSession();
      }
    }

    revalidatePath('/admin/refunds');
    revalidatePath('/admin');
    revalidatePath('/student');

    return {
      success: true,
      decision: normalizedDecision,
      paymentId: payment._id.toString(),
      message:
        normalizedDecision === 'Approved'
          ? 'Refund approved successfully. Course enrollment access revoked and financial balance adjusted.'
          : 'Refund request rejected. Student enrollment access remains active.',
    };
  } catch (error: any) {
    console.error('Failed to process refund request:', error);
    return { success: false, error: error?.message || 'Failed to process refund request.' };
  }
}

/**
 * Fetch refund reconciliation records linking Payment and Enrollment
 */
export async function getRefundRequestsAction(filters?: {
  status?: string;
  search?: string;
}) {
  try {
    const session = await auth();
    const role = (session?.user as any)?.role;
    if (role !== 'ADMIN' && role !== 'SUPERADMIN' && role !== 'MODERATOR') {
      return { success: false, error: 'Unauthorized', payments: [] };
    }

    await dbConnect();

    const query: any = {};
    if (filters?.status && filters.status !== 'all' && filters.status !== 'ALL') {
      const s = filters.status.toLowerCase();
      if (s === 'refunded') {
        query.payment_status = { $in: ['Refunded', 'REFUNDED'] };
      } else if (s === 'refund_requested' || s === 'pending') {
        query.payment_status = { $in: ['Refund_Requested', 'REFUND_REQUESTED', 'Pending', 'PENDING'] };
      } else if (s === 'completed') {
        query.payment_status = { $in: ['Completed', 'COMPLETED', 'success'] };
      } else if (s === 'disputed') {
        query.payment_status = { $in: ['Disputed', 'DISPUTED'] };
      }
    }

    const rawPayments = await Payment.find(query)
      .populate({ path: 'userId', select: 'name email role phone image' })
      .populate({ path: 'courseId', select: 'title titleEn price instructor thumbnail' })
      .populate({ path: 'enrollmentId', select: 'paymentStatus enrolledAt amountPaid transactionId' })
      .populate({ path: 'refundedBy', select: 'name email' })
      .sort({ createdAt: -1 })
      .lean();

    let payments = JSON.parse(JSON.stringify(rawPayments)).map((p: any) => ({
      id: p._id,
      userId: p.userId?._id || p.userId,
      user: p.userId && typeof p.userId === 'object' ? p.userId : null,
      courseId: p.courseId?._id || p.courseId,
      course: p.courseId && typeof p.courseId === 'object' ? p.courseId : null,
      enrollmentId: p.enrollmentId?._id || p.enrollmentId,
      enrollment: p.enrollmentId && typeof p.enrollmentId === 'object' ? p.enrollmentId : null,
      amount: p.amount || 0,
      paymentMethod: p.paymentMethod || 'BKASH',
      transactionId: p.transactionId,
      payment_status: p.payment_status,
      refundReason: p.refundReason || '',
      decision: p.decision,
      refundAmount: p.refundAmount || 0,
      refundedAt: p.refundedAt,
      refundedBy: p.refundedBy,
      disputeNotes: p.disputeNotes || '',
      createdAt: p.createdAt,
    }));

    if (filters?.search && filters.search.trim()) {
      const term = filters.search.toLowerCase().trim();
      payments = payments.filter((item: any) => {
        return (
          item.transactionId?.toLowerCase().includes(term) ||
          item.user?.name?.toLowerCase().includes(term) ||
          item.user?.email?.toLowerCase().includes(term) ||
          item.course?.title?.toLowerCase().includes(term) ||
          item.refundReason?.toLowerCase().includes(term)
        );
      });
    }

    return { success: true, payments };
  } catch (error: any) {
    console.error('Failed to fetch refund requests:', error);
    return { success: false, error: error?.message || 'Failed to fetch refunds.', payments: [] };
  }
}

/**
 * Seed realistic refund and dispute reconciliation records
 */
export async function seedDemoRefundRequestsAction() {
  return { success: false, error: 'Sample data creation has been removed.', message: undefined };
}

/**
 * Returns platform commission ledger records and breakdown by applied rule (DEFAULT vs EARLY_BIRD).
 */
export async function getPlatformCommissionReportAction() {
  try {
    await dbConnect();

    const commissions = await PlatformCommission.find()
      .sort({ createdAt: -1 })
      .populate('courseId', 'title price')
      .populate('instructorUserId', 'name email')
      .lean();

    const defaultRuleCount = commissions.filter(
      (c: any) => c.commissionRule === 'DEFAULT' || c.ruleApplied === 'DEFAULT'
    ).length;
    const earlyBirdRuleCount = commissions.filter(
      (c: any) => c.commissionRule === 'EARLY_BIRD' || c.ruleApplied === 'EARLY_BIRD'
    ).length;

    const totalCommissionAmount = commissions.reduce(
      (sum: number, c: any) => sum + (c.commissionAmount || 0),
      0
    );
    const totalInstructorEarnings = commissions.reduce(
      (sum: number, c: any) => sum + (c.instructorEarnings || 0),
      0
    );

    return {
      success: true,
      commissions: JSON.parse(JSON.stringify(commissions)),
      stats: {
        totalRecords: commissions.length,
        defaultRuleCount,
        earlyBirdRuleCount,
        totalCommissionAmount,
        totalInstructorEarnings,
        rules: COMMISSION_RULES,
      },
    };
  } catch (err: any) {
    console.error('Failed to get platform commission report:', err);
    return { success: false, error: err.message || 'Failed to fetch commissions', commissions: [] };
  }
}

/**
 * Fetch Payout Requests with full relational population, filters, and KPI metrics.
 */
export async function getPayoutRequestsAction(filters?: {
  status?: string;
  provider?: string;
  search?: string;
  instructorId?: string;
}) {
  try {
    const session = await auth();
    const role = (session?.user as any)?.role;
    if (role !== 'ADMIN' && role !== 'SUPERADMIN' && role !== 'MODERATOR') {
      return { success: false, error: 'Unauthorized. Admin or Moderator access required.', requests: [], metrics: null };
    }

    await dbConnect();

    const query: any = {};
    if (filters?.instructorId && isValidMongoObjectId(filters.instructorId)) {
      query.userId = filters.instructorId;
    }

    if (filters?.provider && filters.provider !== 'all' && filters.provider !== 'ALL') {
      query.mfsProvider = filters.provider.toUpperCase();
    }

    if (filters?.status && filters.status !== 'all' && filters.status !== 'ALL') {
      const s = filters.status.toUpperCase();
      if (s === 'PENDING' || s === 'REQUESTED') {
        query.status = { $in: ['PENDING', 'REQUESTED'] };
      } else {
        query.status = s;
      }
    }

    const rawRequests = await PayoutRequest.find(query)
      .populate({
        path: 'userId',
        select: 'name email role phone image availableBalance totalEarnings bankName bankBranch bankAccountName',
      })
      .populate({ path: 'approvedBy', select: 'name email' })
      .populate({ path: 'disbursedBy', select: 'name email' })
      .populate({ path: 'rejectedBy', select: 'name email' })
      .sort({ createdAt: -1 })
      .lean();

    let requests = JSON.parse(JSON.stringify(rawRequests)).map((r: any) => ({
      id: r._id,
      ...r,
      user: r.userId && typeof r.userId === 'object' ? r.userId : null,
      userId: r.userId?._id ? String(r.userId._id) : String(r.userId),
    }));

    if (filters?.search && filters.search.trim()) {
      const term = filters.search.toLowerCase().trim();
      requests = requests.filter((item: any) => {
        return (
          item.transactionId?.toLowerCase().includes(term) ||
          item.mfsNumber?.toLowerCase().includes(term) ||
          item.bankName?.toLowerCase().includes(term) ||
          item.bankAccountName?.toLowerCase().includes(term) ||
          item.user?.name?.toLowerCase().includes(term) ||
          item.user?.email?.toLowerCase().includes(term) ||
          item.rejectionReason?.toLowerCase().includes(term) ||
          item.adminNotes?.toLowerCase().includes(term)
        );
      });
    }

    // Aggregate summary metrics across all payout requests
    const allRequests = await PayoutRequest.find().lean();
    let pendingCount = 0;
    let pendingAmount = 0;
    let approvedCount = 0;
    let approvedAmount = 0;
    let disbursedCount = 0;
    let disbursedAmount = 0;
    let rejectedCount = 0;
    let rejectedAmount = 0;
    let totalVolume = 0;

    allRequests.forEach((r: any) => {
      const amt = r.amount || 0;
      totalVolume += amt;
      const st = (r.status || '').toUpperCase();
      if (st === 'PENDING' || st === 'REQUESTED') {
        pendingCount++;
        pendingAmount += amt;
      } else if (st === 'APPROVED') {
        approvedCount++;
        approvedAmount += amt;
      } else if (st === 'DISBURSED') {
        disbursedCount++;
        disbursedAmount += amt;
      } else if (st === 'REJECTED') {
        rejectedCount++;
        rejectedAmount += amt;
      }
    });

    const metrics = {
      totalCount: allRequests.length,
      totalVolume,
      pendingCount,
      pendingAmount,
      approvedCount,
      approvedAmount,
      disbursedCount,
      disbursedAmount,
      rejectedCount,
      rejectedAmount,
    };

    return {
      success: true,
      requests,
      metrics,
    };
  } catch (error: any) {
    console.error('Failed to get payout requests:', error);
    return { success: false, error: error?.message || 'Failed to fetch payout requests', requests: [], metrics: null };
  }
}

/**
 * Fetch immutable Financial Ledger records with filtering and balance summary.
 */
export async function getFinancialLedgerAction(filters?: {
  entryType?: string;
  status?: string;
  search?: string;
  limit?: number;
}) {
  try {
    const session = await auth();
    const role = (session?.user as any)?.role;
    if (role !== 'ADMIN' && role !== 'SUPERADMIN' && role !== 'MODERATOR') {
      return { success: false, error: 'Unauthorized. Admin or Moderator access required.', ledgerEntries: [], summary: null };
    }

    await dbConnect();

    const query: any = {};
    if (filters?.entryType && filters.entryType !== 'all') {
      query.entryType = filters.entryType.toUpperCase();
    }
    if (filters?.status && filters.status !== 'all') {
      query.status = filters.status.toUpperCase();
    }

    const rawEntries = await FinancialLedger.find(query)
      .populate({ path: 'userId', select: 'name email role phone' })
      .populate({ path: 'performedBy', select: 'name email' })
      .populate({ path: 'payoutRequestId', select: 'amount status mfsProvider mfsNumber transactionId' })
      .sort({ createdAt: -1 })
      .limit(filters?.limit || 100)
      .lean();

    let entries = JSON.parse(JSON.stringify(rawEntries)).map((e: any) => ({
      id: e._id,
      ...e,
      user: e.userId && typeof e.userId === 'object' ? e.userId : null,
    }));

    if (filters?.search && filters.search.trim()) {
      const term = filters.search.toLowerCase().trim();
      entries = entries.filter((e: any) =>
        e.referenceId?.toLowerCase().includes(term) ||
        e.description?.toLowerCase().includes(term) ||
        e.accountNumber?.toLowerCase().includes(term) ||
        e.user?.name?.toLowerCase().includes(term) ||
        e.user?.email?.toLowerCase().includes(term)
      );
    }

    // Aggregate ledger summary totals
    const all = await FinancialLedger.find().lean();
    let totalDisbursedOutflow = 0;
    let totalInEscrowHold = 0;
    let totalCourseSalesInflow = 0;
    let totalStudentRefunds = 0;

    all.forEach((item: any) => {
      const amt = item.amount || 0;
      if (item.entryType === 'PAYOUT_DISBURSEMENT' && item.status === 'CLEARED') {
        totalDisbursedOutflow += amt;
      } else if (item.entryType === 'PAYOUT_HOLD' && item.status === 'PENDING') {
        totalInEscrowHold += amt;
      } else if (item.entryType === 'COURSE_SALE') {
        totalCourseSalesInflow += amt;
      } else if (item.entryType === 'STUDENT_REFUND') {
        totalStudentRefunds += amt;
      }
    });

    const summary = {
      totalEntries: all.length,
      totalDisbursedOutflow,
      totalInEscrowHold,
      totalCourseSalesInflow,
      totalStudentRefunds,
    };

    return { success: true, ledgerEntries: entries, summary };
  } catch (error: any) {
    console.error('Failed to get financial ledger:', error);
    return { success: false, error: error?.message || 'Failed to fetch financial ledger', ledgerEntries: [], summary: null };
  }
}

/**
 * Seed realistic demo payout requests and financial ledger entries for testing and evaluation.
 */
export async function seedDemoPayoutRequestsAction() {
  return { success: false, error: 'Sample data creation has been removed.', message: undefined };
}

/**
 * Fetch Instructor's Payout Overview: available balance, total earnings,
 * pending payout total, disbursed total, and recent payout request history.
 */
export async function getInstructorPayoutOverviewAction(userId: string) {
  try {
    await dbConnect();

    if (!isValidMongoObjectId(userId)) {
      return { success: false, error: 'Invalid user ID' };
    }

    const user = await User.findById(userId).lean();
    if (!user) {
      return { success: false, error: 'User not found' };
    }

    const requests = await PayoutRequest.find({ userId })
      .sort({ createdAt: -1 })
      .lean();

    let pendingAmount = 0;
    let disbursedTotal = 0;

    requests.forEach((r: any) => {
      const amt = r.amount || 0;
      const st = (r.status || '').toUpperCase();
      if (st === 'PENDING' || st === 'REQUESTED') {
        pendingAmount += amt;
      } else if (st === 'DISBURSED') {
        disbursedTotal += amt;
      }
    });

    return {
      success: true,
      overview: {
        availableBalance: user.availableBalance || 0,
        totalEarnings: user.totalEarnings || 0,
        pendingAmount,
        disbursedTotal,
        payoutMethod: user.payoutMethod || 'BKASH',
        payoutNumber: user.payoutNumber || '',
        bankName: user.bankName || '',
        bankBranch: user.bankBranch || '',
        bankAccountName: user.bankAccountName || '',
        requests: JSON.parse(JSON.stringify(requests)).map((r: any) => ({
          id: r._id,
          ...r,
        })),
      },
    };
  } catch (error: any) {
    console.error('Failed to get instructor payout overview:', error);
    return { success: false, error: error?.message || 'Failed to fetch payout overview' };
  }
}

