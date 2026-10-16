import mongoose, { Document, Model, Schema } from 'mongoose';

export type PaymentStatusType =
  | 'Pending'
  | 'Completed'
  | 'Refunded'
  | 'Disputed'
  | 'Failed'
  | 'Refund_Requested';

export interface IPayment extends Document {
  userId: mongoose.Types.ObjectId | string;
  courseId: mongoose.Types.ObjectId | string;
  enrollmentId?: mongoose.Types.ObjectId | string;
  amount: number;
  paymentMethod: string;
  transactionId: string;
  payment_status: PaymentStatusType;
  refundReason?: string;
  decision?: 'Approved' | 'Rejected';
  refundAmount?: number;
  refundedAt?: Date;
  refundedBy?: mongoose.Types.ObjectId | string;
  disputeNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const paymentSchema = new Schema<IPayment>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    courseId: { type: Schema.Types.Mixed, ref: 'Course', required: true, index: true },
    enrollmentId: { type: Schema.Types.ObjectId, ref: 'Enrollment', index: true },
    amount: { type: Number, required: true, default: 0 },
    paymentMethod: { type: String, default: 'BKASH' },
    transactionId: { type: String, required: true, unique: true, index: true },
    payment_status: {
      type: String,
      enum: [
        'Pending',
        'Completed',
        'Refunded',
        'Disputed',
        'Failed',
        'Refund_Requested',
        'PENDING',
        'COMPLETED',
        'REFUNDED',
        'DISPUTED',
        'FAILED',
        'REFUND_REQUESTED',
      ],
      default: 'Pending',
      index: true,
    },
    refundReason: { type: String, default: '' },
    decision: { type: String, enum: ['Approved', 'Rejected'] },
    refundAmount: { type: Number, default: 0 },
    refundedAt: { type: Date },
    refundedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    disputeNotes: { type: String, default: '' },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

paymentSchema.virtual('paymentStatus').get(function () {
  return this.payment_status;
}).set(function (val: PaymentStatusType) {
  this.payment_status = val;
});

const Payment: Model<IPayment> =
  mongoose.models.Payment || mongoose.model<IPayment>('Payment', paymentSchema);

export default Payment;
