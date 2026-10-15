import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IEnrollment extends Document {
  userId: mongoose.Types.ObjectId | string;
  courseId: mongoose.Types.ObjectId | string;
  paymentStatus: string;
  transactionId?: string;
  amountPaid: number;
  couponApplied?: mongoose.Types.ObjectId | string | null;
  enrolledAt: Date;
  validUntil?: Date;
  isRevisionGranted?: boolean;
  revisionAccessExpiresAt?: Date;
  revisionRequestStatus?: 'NONE' | 'PENDING' | 'APPROVED' | 'REJECTED';
  revisionReason?: string;
  revisionExamDate?: string;
}

const enrollmentSchema = new Schema<IEnrollment>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    courseId: { type: Schema.Types.Mixed, ref: 'Course', required: true },
    paymentStatus: { type: String, default: 'pending' },
    transactionId: { type: String },
    amountPaid: { type: Number, required: true, default: 0 },
    couponApplied: { type: Schema.Types.ObjectId, ref: 'Coupon', default: null },
    enrolledAt: { type: Date, default: Date.now },
    validUntil: { type: Date },
    isRevisionGranted: { type: Boolean, default: false },
    revisionAccessExpiresAt: { type: Date },
    revisionRequestStatus: {
      type: String,
      enum: ['NONE', 'PENDING', 'APPROVED', 'REJECTED'],
      default: 'NONE',
    },
    revisionReason: { type: String, default: '' },
    revisionExamDate: { type: String, default: '' },
  },
  {
    timestamps: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

enrollmentSchema.virtual('course', {
  ref: 'Course',
  localField: 'courseId',
  foreignField: '_id',
  justOne: true,
});

enrollmentSchema.index({ userId: 1, courseId: 1 }, { unique: true });

const Enrollment: Model<IEnrollment> =
  mongoose.models.Enrollment || mongoose.model<IEnrollment>('Enrollment', enrollmentSchema);

export default Enrollment;
