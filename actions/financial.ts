'use server';

import mongoose from 'mongoose';
import dbConnect from '@/lib/mongoose';
import PayoutRequest from '@/models/PayoutRequest';
import PlatformCommission from '@/models/PlatformCommission';
import User from '@/models/User';
import Course from '@/models/Course';
import Enrollment from '@/models/Enrollment';

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
  const session = await mongoose.startSession();
  
  try {
    session.startTransaction();

    const course = await Course.findById(courseId).session(session);
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
      { session }
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
        { session }
      );
    }

    await session.commitTransaction();
    return { success: true };
  } catch (error) {
    await session.abortTransaction();
    console.error('Error processing commission:', error);
    return { success: false, error: 'Transaction failed' };
  } finally {
    session.endSession();
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
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const user = await User.findById(userId).session(session);
    if (!user) throw new Error('User not found');
    if (user.availableBalance < amount) {
      throw new Error('Insufficient balance');
    }

    // Deduct from available balance immediately to prevent double spending
    user.availableBalance -= amount;
    await user.save({ session });

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
      { session }
    );

    await session.commitTransaction();
    return { success: true, payoutRequest: request[0] };
  } catch (error) {
    await session.abortTransaction();
    return { success: false, error: error instanceof Error ? error.message : 'Payout request failed' };
  } finally {
    session.endSession();
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
  await dbConnect();
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const payout = await PayoutRequest.findById(requestId).session(session);
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
        { session }
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
    await payout.save({ session });

    await session.commitTransaction();
    return { success: true };
  } catch (error) {
    await session.abortTransaction();
    return { success: false, error: error instanceof Error ? error.message : 'Update failed' };
  } finally {
    session.endSession();
  }
}
