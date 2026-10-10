import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ICoupon extends Document {
  code: string;
  discountPercentage: number;
  courseId?: mongoose.Types.ObjectId | string | null; // If null, applies to any course
  validUntil: Date;
  maxUses: number; // Maximum number of times this coupon can be used
  currentUses: number; // Track how many times it has been used
  instructorId?: mongoose.Types.ObjectId | string; // If an instructor generated it
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const couponSchema = new Schema<ICoupon>(
  {
    code: { type: String, required: true, unique: true, uppercase: true },
    discountPercentage: { type: Number, required: true, min: 1, max: 100 },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', default: null },
    validUntil: { type: Date, required: true },
    maxUses: { type: Number, default: 100 },
    currentUses: { type: Number, default: 0 },
    instructorId: { type: Schema.Types.ObjectId, ref: 'User' },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

const Coupon: Model<ICoupon> =
  mongoose.models.Coupon || mongoose.model<ICoupon>('Coupon', couponSchema);

export default Coupon;
