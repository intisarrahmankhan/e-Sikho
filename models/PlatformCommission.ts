import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IPlatformCommission extends Document {
  courseId: mongoose.Types.ObjectId | string;
  enrollmentId: mongoose.Types.ObjectId | string;
  instructorUserId: mongoose.Types.ObjectId | string;
  totalAmount: number;
  commissionPercentage: number;
  commissionAmount: number;
  instructorEarnings: number;
  createdAt: Date;
  updatedAt: Date;
}

const platformCommissionSchema = new Schema<IPlatformCommission>(
  {
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    enrollmentId: { type: Schema.Types.ObjectId, ref: 'Enrollment', required: true },
    instructorUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    totalAmount: { type: Number, required: true },
    commissionPercentage: { type: Number, required: true },
    commissionAmount: { type: Number, required: true },
    instructorEarnings: { type: Number, required: true },
  },
  { timestamps: true }
);

const PlatformCommission: Model<IPlatformCommission> =
  mongoose.models.PlatformCommission || mongoose.model<IPlatformCommission>('PlatformCommission', platformCommissionSchema);

export default PlatformCommission;
