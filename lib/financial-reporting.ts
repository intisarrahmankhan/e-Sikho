import type { PipelineStage } from 'mongoose';

/** Revenue must have both an actual completed payment and a non-demo paid enrollment. */
export function paidCommissionStages(): PipelineStage[] {
  return [
    { $match: { isRefunded: { $ne: true }, totalAmount: { $gt: 0 } } },
    { $lookup: {
      from: 'enrollments', localField: 'enrollmentId', foreignField: '_id', as: 'enrollment',
    } },
    { $unwind: '$enrollment' },
    { $match: {
      'enrollment.demoPurchase.requestedAt': { $exists: false },
      'enrollment.paymentStatus': 'success',
      $expr: { $eq: ['$enrollment.amountPaid', '$totalAmount'] },
    } },
    { $lookup: {
      from: 'payments',
      let: { enrollmentId: '$enrollmentId', courseId: '$courseId', userId: '$enrollment.userId', amount: '$totalAmount' },
      pipeline: [
        { $match: {
          payment_status: { $in: ['Completed', 'COMPLETED'] },
          $expr: { $and: [
            { $eq: ['$enrollmentId', '$$enrollmentId'] },
            { $eq: ['$userId', '$$userId'] },
            { $eq: [{ $toString: '$courseId' }, { $toString: '$$courseId' }] },
            { $eq: ['$amount', '$$amount'] },
          ] },
        } },
        { $limit: 1 },
      ],
      as: 'completedPayment',
    } },
    { $match: { 'completedPayment.0': { $exists: true } } },
  ];
}
