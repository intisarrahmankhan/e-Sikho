import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IReview extends Document {
  userId: mongoose.Types.ObjectId | string;
  courseId: mongoose.Types.ObjectId | string;
  rating: number; // 1 to 5
  comment?: string;
  instructorReply?: string;
  status: 'PUBLISHED' | 'HIDDEN' | 'FLAGGED';
  createdAt: Date;
  updatedAt: Date;
}

const reviewSchema = new Schema<IReview>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, default: '' },
    instructorReply: { type: String, default: '' },
    status: {
      type: String,
      enum: ['PUBLISHED', 'HIDDEN', 'FLAGGED'],
      default: 'PUBLISHED',
    },
  },
  {
    timestamps: true,
  }
);

// A user can review a course only once
reviewSchema.index({ userId: 1, courseId: 1 }, { unique: true });

const Review: Model<IReview> =
  mongoose.models.Review || mongoose.model<IReview>('Review', reviewSchema);

export default Review;
