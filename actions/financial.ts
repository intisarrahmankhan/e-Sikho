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
import { auth } from '@/auth';
import { isValidMongoObjectId } from '@/lib/auth-helpers';
import { revalidatePath } from 'next/cache';

/**
 * Calculates platform commission and updates instructor balance.
 * Runs atomically using a Mongoose transaction.
 */
export async function processEnrollmentCommission(
  enrollmentId: string,
  courseId: string,
  price: number
) {
  const PLATFORM_COMMISSION_PERCENTAGE = 20; // e.g., 20% platform fee

  // Use a mongoose session for transaction
  await dbConnect();
  const dbSession = await mongoose.startSession();
  
  try {
    dbSession.startTransaction();

    const course = await Course.findById(courseId).session(dbSession);
    if (!course) throw new Error('Course not found');

    const commissionAmount = (price * PLATFORM_COMMISSION_PERCENTAGE) / 100;
    const instructorEarnings = price - commissionAmount;

    // Create the commission record
    await PlatformCommission.create(
      [
        {
          courseId,
          enrollmentId,
          instructorUserId: course.createdById,
          totalAmount: price,
          commissionPercentage: PLATFORM_COMMISSION_PERCENTAGE,
          commissionAmount,
          instructorEarnings,
        },
      ],
      { session: dbSession }
    );

    // Update the instructor's balance
    if (course.createdById && isValidMongoObjectId(course.createdById)) {
      await User.findByIdAndUpdate(
        course.createdById,
        {
          $inc: {
            availableBalance: instructorEarnings,
            totalEarnings: instructorEarnings,
          },
        },
        { session: dbSession }
      );
    }

    await dbSession.commitTransaction();
    return { success: true };
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
 */
export async function requestPayout(
  userId: string,
  amount: number,
  mfsProvider: 'BKASH' | 'NAGAD' | 'ROCKET' | 'BANK',
  mfsNumber: string
) {
  await dbConnect();
  const dbSession = await mongoose.startSession();

  try {
    dbSession.startTransaction();

    if (!isValidMongoObjectId(userId)) throw new Error('Invalid user ID');
    const user = await User.findById(userId).session(dbSession);
    if (!user) throw new Error('User not found');
    if (user.availableBalance < amount) {
      throw new Error('Insufficient balance');
    }

    // Deduct from available balance immediately to prevent double spending
    user.availableBalance -= amount;
    await user.save({ session: dbSession });

    // Create payout request
    const request = await PayoutRequest.create(
      [
        {
          userId,
          amount,
          mfsProvider,
          mfsNumber,
          status: 'REQUESTED' as const,
        },
      ],
      { session: dbSession }
    );

    await dbSession.commitTransaction();
    return { success: true, payoutRequest: request[0] };
  } catch (error) {
    await dbSession.abortTransaction();
    return { success: false, error: error instanceof Error ? error.message : 'Payout request failed' };
  } finally {
    dbSession.endSession();
  }
}

/**
 * Superadmin: Approve/Reject/Disburse payout request
 */
export async function updatePayoutStatus(
  requestId: string,
  status: 'APPROVED' | 'DISBURSED' | 'REJECTED',
  transactionId?: string,
  rejectionReason?: string
) {
  const session = await auth();
  const userId = (session?.user as any)?.id;
  const role = (session?.user as any)?.role;

  if (!userId || role !== 'SUPERADMIN') {
    return { success: false, error: 'Unauthorized. Only Superadmins can update payout status.' };
  }

  await dbConnect();
  const dbSession = await mongoose.startSession();

  try {
    dbSession.startTransaction();

    const payout = await PayoutRequest.findById(requestId).session(dbSession);
    if (!payout) throw new Error('Payout request not found');
    
    // Prevent invalid state transitions
    if (payout.status === 'DISBURSED' || payout.status === 'REJECTED') {
      throw new Error('Payout request is already finalized');
    }

    if (status === 'REJECTED') {
      // Refund the balance to the instructor
      await User.findByIdAndUpdate(
        payout.userId,
        {
          $inc: { availableBalance: payout.amount },
        },
        { session: dbSession }
      );
      payout.rejectionReason = rejectionReason;
    }

    if (status === 'DISBURSED') {
      if (payout.status !== 'APPROVED') {
        throw new Error('Only approved payouts can be disbursed');
      }
      if (!transactionId) {
        throw new Error('Transaction ID is required for disbursed payouts');
      }
      payout.transactionId = transactionId;
      payout.processedAt = new Date();
    }

    payout.status = status;
    await payout.save({ session: dbSession });

    await AuditLog.create(
      [
        {
          action: 'UPDATE_PAYOUT_STATUS',
          category: 'FINANCIAL',
          actorId: userId,
          targetId: payout.userId,
          details: {
            requestId,
            status,
            transactionId,
            rejectionReason,
            amount: payout.amount,
          },
        },
      ],
      { session: dbSession }
    );

    await dbSession.commitTransaction();
    return { success: true };
  } catch (error) {
    await dbSession.abortTransaction();
    return { success: false, error: error instanceof Error ? error.message : 'Update failed' };
  } finally {
    dbSession.endSession();
  }
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
  try {
    await dbConnect();

    // Find sample student and course
    let student = await User.findOne({ role: 'STUDENT' });
    if (!student) {
      student = await User.create({
        name: 'Rafiqul Islam',
        email: 'rafiqul.student@example.com',
        role: 'STUDENT',
        status: 'APPROVED',
      });
    }

    let instructor = await User.findOne({ role: 'INSTRUCTOR' });
    if (!instructor) {
      instructor = await User.create({
        name: 'Prof. Hasan Ali',
        email: 'hasan.ali@example.com',
        role: 'INSTRUCTOR',
        status: 'APPROVED',
        availableBalance: 25000,
        totalEarnings: 30000,
      });
    }

    let course = await Course.findOne();
    if (!course) {
      course = await Course.create({
        title: 'Mastering Fullstack Next.js & Cloud DevOps',
        category: 'Development',
        price: 4500,
        status: 'PUBLISHED',
        instructorId: instructor._id,
        createdById: instructor._id,
      });
    }

    // Create 3 realistic payments with enrollments
    const demoRefunds = [
      {
        studentName: 'Zubair Hossain',
        studentEmail: 'zubair.hossain@example.com',
        amount: 4500,
        method: 'BKASH',
        txn: `TXN-BKASH-${Date.now()}-1`,
        status: 'Refund_Requested' as const,
        reason: 'Accidental double payment via bKash gateway. Charged twice on the same invoice.',
      },
      {
        studentName: 'Farzana Akter',
        studentEmail: 'farzana.akter@example.com',
        amount: 3800,
        method: 'NAGAD',
        txn: `TXN-NAGAD-${Date.now()}-2`,
        status: 'Refund_Requested' as const,
        reason: 'Enrolled in wrong course level. Requested refund within 48-hour satisfaction guarantee.',
      },
      {
        studentName: 'Kamal Uddin',
        studentEmail: 'kamal.uddin@example.com',
        amount: 5000,
        method: 'CARD',
        txn: `TXN-CARD-${Date.now()}-3`,
        status: 'Refunded' as const,
        reason: 'Duplicate checkout transaction processed by bank gateway.',
        refunded: true,
      },
    ];

    let createdCount = 0;

    for (const d of demoRefunds) {
      let st = await User.findOne({ email: d.studentEmail });
      if (!st) {
        st = await User.create({
          name: d.studentName,
          email: d.studentEmail,
          role: 'STUDENT',
          status: 'APPROVED',
        });
      }

      // Create or locate enrollment
      let enr = await Enrollment.findOne({ userId: st._id, courseId: course._id });
      if (!enr) {
        enr = await Enrollment.create({
          userId: st._id,
          courseId: course._id,
          paymentStatus: d.refunded ? 'Cancelled' : 'success',
          transactionId: d.txn,
          amountPaid: d.amount,
        });
      }

      // Create commission record if needed
      await PlatformCommission.findOneAndUpdate(
        { enrollmentId: enr._id },
        {
          courseId: course._id,
          enrollmentId: enr._id,
          instructorUserId: instructor._id,
          totalAmount: d.amount,
          commissionPercentage: 20,
          commissionAmount: (d.amount * 20) / 100,
          instructorEarnings: (d.amount * 80) / 100,
          isRefunded: !!d.refunded,
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      const existingPayment = await Payment.findOne({ transactionId: d.txn });
      if (!existingPayment) {
        await Payment.create({
          userId: st._id,
          courseId: course._id,
          enrollmentId: enr._id,
          amount: d.amount,
          paymentMethod: d.method,
          transactionId: d.txn,
          payment_status: d.status,
          refundReason: d.reason,
          decision: d.refunded ? 'Approved' : undefined,
          refundAmount: d.refunded ? d.amount : 0,
          refundedAt: d.refunded ? new Date() : undefined,
        });
        createdCount++;
      }
    }

    revalidatePath('/admin/refunds');
    return { success: true, message: `Created ${createdCount} demo payment reconciliation records.` };
  } catch (error: any) {
    console.error('Failed to seed demo refunds:', error);
    return { success: false, error: error?.message || 'Failed to seed demo refunds.' };
  }
}
