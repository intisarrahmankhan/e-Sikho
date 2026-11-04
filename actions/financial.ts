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
  _options?: {
    isEarlyBird?: boolean;
    rule?: PlatformCommissionRuleType | string;
  }
) {
  const actor = await auth();
  if (!actor?.user || !['ADMIN', 'SUPERADMIN'].includes((actor.user as any).role)) {
    return { success: false, error: 'Administrator access is required for commission processing.' };
  }
  if (!Number.isFinite(price) || price <= 0) return { success: false, error: 'A positive payment amount is required.' };
  if (!isValidMongoObjectId(enrollmentId) || !isValidMongoObjectId(courseId)) {
    return { success: false, error: 'Valid enrollment and course IDs are required.' };
  }
  let dbSession: mongoose.ClientSession | null = null;
  try {
    await dbConnect();
    await PlatformCommission.init();
    dbSession = await mongoose.startSession();
    dbSession.startTransaction();

    const enrollment = await Enrollment.findById(enrollmentId).session(dbSession);
    if (!enrollment || String(enrollment.courseId) !== courseId || enrollment.demoPurchase?.requestedAt) {
      throw new Error('A matching paid enrollment is required. Demo access does not earn commission.');
    }
    const payment: any = await Payment.findOne({
      enrollmentId,
      userId: enrollment.userId,
      payment_status: 'Completed',
    }).session(dbSession);
    if (!payment || String(payment.courseId) !== courseId || !Number.isFinite(payment.amount) ||
        payment.amount <= 0 || enrollment.amountPaid !== payment.amount || price !== payment.amount ||
        enrollment.paymentStatus.toLowerCase() !== 'success') {
      throw new Error('A completed payment matching the enrollment and amount is required.');
    }
    const existing = await PlatformCommission.findOne({ enrollmentId }).session(dbSession);
    if (existing) {
      if (existing.isRefunded) throw new Error('This commission has already been refunded.');
      await dbSession.commitTransaction();
      return { success: true, alreadyProcessed: true };
    }
    const course = await Course.findById(courseId).session(dbSession);
    if (!course || !isValidMongoObjectId(String(course.createdById))) throw new Error('Course instructor not found');

    // Use the rule captured on the enrollment, never a client-selected share.
    const calc = calculatePlatformCommission(payment.amount, {
      rule: enrollment.commissionRule,
      isEarlyBird: enrollment.isEarlyBird,
    }, course);

    // Lock this enrollment inside the transaction. Concurrent requests cannot credit it twice.
    const claim = await Enrollment.updateOne(
      { _id: enrollmentId, commissionProcessedAt: { $exists: false } },
      { $set: { commissionProcessedAt: new Date(), isEarlyBird: calc.isEarlyBird, commissionRule: calc.rule } },
      { session: dbSession }
    );
    if (claim.modifiedCount !== 1) throw new Error('Commission was already processed. Refresh before retrying.');

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

    // Update the instructor's balance
    const instructor = await User.findByIdAndUpdate(
        course.createdById,
        {
          $inc: {
            availableBalance: calc.instructorEarnings,
            totalEarnings: calc.instructorEarnings,
          },
        },
        { session: dbSession }
      );
    if (!instructor) throw new Error('Instructor account not found');

    await dbSession.commitTransaction();
    return { success: true, commission: calc };
  } catch (error) {
    if (dbSession?.inTransaction()) await dbSession.abortTransaction();
    console.error('Error processing commission:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Transaction failed' };
  } finally {
    await dbSession?.endSession();
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
  const actor = (await auth())?.user as { id?: string; role?: string } | undefined;
  if (!actor?.id || actor.id !== userId || actor.role !== 'INSTRUCTOR' || !isValidMongoObjectId(userId)) {
    return { success: false as const, error: 'Sign in as the instructor who owns this balance.' };
  }
  if (!Number.isFinite(amount) || amount < 1) {
    return { success: false as const, error: 'Payout amount must be greater than zero and at least ৳1.' };
  }
  if (!['BKASH', 'NAGAD', 'ROCKET', 'BANK'].includes(mfsProvider) || typeof mfsNumber !== 'string' || !mfsNumber.trim()) {
    return { success: false as const, error: 'Choose a payout provider and enter an account number.' };
  }

  let dbSession: mongoose.ClientSession | undefined;
  try {
    await dbConnect();
    // Finish creating the payout collections before opening the transaction.
    await Promise.all([PayoutRequest.init(), FinancialLedger.init(), AuditLog.init()]);
    dbSession = await mongoose.startSession();
    dbSession.startTransaction();

    const user = await User.findById(userId).session(dbSession);
    if (!user) throw new Error('User not found');
    if (user.availableBalance < amount) {
      await dbSession.abortTransaction();
      return { success: false as const, error: `Insufficient balance. Available: ৳${user.availableBalance.toLocaleString()}, Requested: ৳${amount.toLocaleString()}` };
    }

    // Deduct from available balance immediately to prevent double spending
    const prevBalance = user.availableBalance;
    user.availableBalance -= amount;
    await user.save({ session: dbSession });

    // Create payout request with PENDING status
    const requestedAt = new Date();
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
          requestedAt,
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

    return {
      success: true as const,
      payoutRequest: { id: String(createdPayout._id), requestedAt: requestedAt.toISOString() },
      availableBalance: user.availableBalance,
    };
  } catch (error) {
    if (dbSession?.inTransaction()) await dbSession.abortTransaction();
    console.error('Payout request failed:', error);
    return { success: false as const, error: 'Could not submit the payout request. Refresh your payout history before trying again.' };
  } finally {
    await dbSession?.endSession();
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
    if (payout.status !== 'APPROVED') {
      throw new Error('Approve the payout request before recording disbursement.');
    }

    const instructor = await User.findById(payout.userId).session(dbSession);
    if (!instructor || (instructor.availableBalance || 0) < 0) {
      throw new Error('Resolve the instructor account balance before disbursing this payout.');
    }

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
      message: `External payout recorded: ৳${payout.amount.toLocaleString()} via ${payout.mfsProvider} (TXN: ${transactionId.trim()}). This action does not transfer money.`,
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
  let dbSession: mongoose.ClientSession | null = null;
  try {
    const session = await auth();
    const userId = (session?.user as any)?.id;
    const role = (session?.user as any)?.role;
    if (!userId || !['ADMIN', 'SUPERADMIN', 'MODERATOR'].includes(role)) {
      return { success: false, error: 'Unauthorized. Admin or Moderator access required.' };
    }
    if (!['Approved', 'Rejected', 'APPROVE', 'REJECT'].includes(decision)) {
      return { success: false, error: 'Invalid refund decision.' };
    }
    const normalizedDecision = decision === 'Approved' || decision === 'APPROVE' ? 'Approved' : 'Rejected';
    await dbConnect();
    await AuditLog.init();
    dbSession = await mongoose.startSession();
    dbSession.startTransaction();

    // Read inside the transaction: concurrent decisions on the same payment must conflict.
    const identifiers: Record<string, unknown>[] = [{ transactionId: paymentId }];
    if (isValidMongoObjectId(paymentId)) {
      identifiers.push({ _id: paymentId }, { enrollmentId: paymentId });
    }
    const payment: any = await Payment.findOne({ $or: identifiers }).session(dbSession);
    if (!payment) throw new Error('Payment record not found. An enrollment alone is not proof of payment.');
    const status = payment.payment_status.toUpperCase();
    if (status === 'REFUNDED') {
      if (normalizedDecision !== 'Approved') throw new Error('A completed refund cannot be rejected or restore course access.');
      await dbSession.commitTransaction();
      return { success: true, decision: normalizedDecision, paymentId: String(payment._id), message: 'This refund is already recorded.' };
    }
    if (!['REFUND_REQUESTED', 'DISPUTED'].includes(status)) {
      throw new Error('Only a pending refund request or disputed payment can be reviewed.');
    }
    if (!Number.isFinite(payment.amount) || payment.amount <= 0) throw new Error('A positive recorded payment is required.');
    if (!payment.enrollmentId) throw new Error('Link this payment to its enrollment before processing a refund.');
    const enrollment = await Enrollment.findById(payment.enrollmentId).session(dbSession);
    if (!enrollment || String(enrollment.userId) !== String(payment.userId) ||
        String(enrollment.courseId) !== String(payment.courseId) || enrollment.amountPaid !== payment.amount) {
      throw new Error('The payment does not match its enrollment. Reconcile the records before refunding.');
    }
    if (enrollment.demoPurchase?.requestedAt) throw new Error('Demo purchases have no payment to refund.');

    payment.decision = normalizedDecision;
    payment.refundReason = refundReason?.trim() || (normalizedDecision === 'Approved' ? 'Refund approved by administrator' : 'Refund request rejected by administrator');
    if (normalizedDecision === 'Approved') {
      payment.payment_status = 'Refunded';
      payment.refundedAt = new Date();
      payment.refundedBy = userId;
      payment.refundAmount = payment.amount;
      await payment.save({ session: dbSession });
      await Enrollment.findByIdAndUpdate(payment.enrollmentId, {
        $set: { paymentStatus: 'Cancelled', isRevisionGranted: false },
        $unset: { revisionAccessExpiresAt: 1 },
      }, { session: dbSession });

      // Never match by course/price: many students buy the same course at the same price.
      const commission = await PlatformCommission.findOne({
        enrollmentId: payment.enrollmentId,
        courseId: payment.courseId,
      }).session(dbSession);
      if (commission && !commission.isRefunded) {
        if (commission.totalAmount !== payment.amount || !Number.isFinite(commission.instructorEarnings) ||
            commission.instructorEarnings < 0 || commission.instructorEarnings > payment.amount) {
          throw new Error('Commission amount does not match this payment. Reconcile the records first.');
        }
        const instructor = await User.findByIdAndUpdate(commission.instructorUserId, {
          $inc: { availableBalance: -commission.instructorEarnings, totalEarnings: -commission.instructorEarnings },
        }, { session: dbSession });
        if (!instructor) throw new Error('Instructor account not found. Reconcile the refund first.');
        commission.isRefunded = true;
        commission.refundedAt = new Date();
        await commission.save({ session: dbSession });
      }
      // With no credited commission there is nothing to reverse from an instructor wallet.
    } else {
      payment.payment_status = 'Completed';
      payment.disputeNotes = payment.refundReason;
      await payment.save({ session: dbSession });
      // Rejecting a refund does not reactivate access that was separately revoked.
    }
    await AuditLog.create([{
      action: normalizedDecision === 'Approved' ? 'REFUND_APPROVED' : 'REFUND_REJECTED',
      category: 'FINANCIAL', actorId: userId, targetId: payment.userId,
      details: { paymentId: String(payment._id), transactionId: payment.transactionId,
        amount: payment.amount, decision: normalizedDecision, refundReason: payment.refundReason },
    }], { session: dbSession });
    await dbSession.commitTransaction();
    revalidatePath('/admin/refunds');
    revalidatePath('/admin');
    revalidatePath('/instructor');
    revalidatePath('/student');
    return {
      success: true, decision: normalizedDecision, paymentId: String(payment._id),
      message: normalizedDecision === 'Approved'
        ? 'Refund approval recorded and course access revoked. This does not transfer money; complete the refund with the payment provider.'
        : 'Refund request rejected. Existing enrollment access is unchanged.',
    };
  } catch (error: any) {
    if (dbSession?.inTransaction()) await dbSession.abortTransaction();
    console.error('Failed to process refund request:', error);
    return { success: false, error: error?.message || 'Failed to process refund request.' };
  } finally {
    await dbSession?.endSession();
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
    const role = ((await auth())?.user as any)?.role;
    if (!['ADMIN', 'SUPERADMIN'].includes(role)) {
      return { success: false, error: 'Administrator access required.', commissions: [] };
    }
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
      (sum: number, c: any) => sum + (c.isRefunded ? 0 : (c.commissionAmount || 0)),
      0
    );
    const totalInstructorEarnings = commissions.reduce(
      (sum: number, c: any) => sum + (c.isRefunded ? 0 : (c.instructorEarnings || 0)),
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
    const actor = (await auth())?.user as { id?: string; role?: string } | undefined;
    if (!actor?.id || (actor.id !== userId && !['ADMIN', 'SUPERADMIN'].includes(actor.role || ''))) {
      return { success: false, error: 'You can only view your own payout account.' };
    }
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
      if (st === 'PENDING' || st === 'REQUESTED' || st === 'APPROVED') {
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

