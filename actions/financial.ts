'use server';

import mongoose from 'mongoose';
import dbConnect from '@/lib/mongoose';
import PayoutRequest from '@/models/PayoutRequest';
import PlatformCommission from '@/models/PlatformCommission';
import User from '@/models/User';
import Course from '@/models/Course';
import Enrollment from '@/models/Enrollment';
import AuditLog from '@/models/AuditLog';
import { auth } from '@/auth';

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
    if (course.createdById) {
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
