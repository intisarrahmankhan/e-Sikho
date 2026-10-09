import mongoose, { Document, Model, Schema } from 'mongoose';
import '@/models/Instructor';

export interface ICourse extends Document {
  title: string;
  titleEn?: string;
  tagline: string;
  taglineEn?: string;
  description: string;
  descriptionEn?: string;
  category: string;
  categoryBangla: string;
  level: string;
  rating: number;
  totalRatings: number;
  studentsEnrolled: number;
  duration: string;
  totalLessons: number;
  price: number;
  originalPrice: number;
  thumbnailUrl: string;
  thumbnailUrlEn?: string;
  previewVideoUrl?: string;
  status: 'DRAFT' | 'PENDING_REVIEW' | 'PUBLISHED' | 'REJECTED';
  approvalStatus: string;
  rejectionReason?: string;
  submittedAt?: Date;
  reviewedAt?: Date;
  createdById?: mongoose.Types.ObjectId | string;
  instructorId: mongoose.Types.ObjectId | string;
  learningOutcomes: string;
  prerequisites: string;
  createdAt: Date;
  updatedAt: Date;
}

const courseSchema = new Schema<ICourse>(
  {
    title: { type: String, required: true },
    titleEn: { type: String, default: '' },
    tagline: { type: String, required: true },
    taglineEn: { type: String, default: '' },
    description: { type: String, required: true },
    descriptionEn: { type: String, default: '' },
    category: { type: String, required: true },
    categoryBangla: { type: String, required: true },
    level: { type: String, required: true },
    rating: { type: Number, default: 0 },
    totalRatings: { type: Number, default: 0 },
    studentsEnrolled: { type: Number, default: 0 },
    duration: { type: String, required: true },
    totalLessons: { type: Number, default: 0 },
    price: { type: Number, required: true },
    originalPrice: { type: Number, required: true },
    thumbnailUrl: { type: String, required: true },
    thumbnailUrlEn: { type: String, default: '' },
    previewVideoUrl: { type: String, default: '' },
    status: {
      type: String,
      enum: ['DRAFT', 'PENDING_REVIEW', 'PUBLISHED', 'REJECTED'],
      default: 'DRAFT',
    },
    approvalStatus: { type: String, default: 'APPROVED' },
    rejectionReason: { type: String },
    submittedAt: { type: Date },
    reviewedAt: { type: Date },
    createdById: { type: Schema.Types.ObjectId, ref: 'User' },
    instructorId: { type: Schema.Types.ObjectId, ref: 'Instructor', required: true },
    learningOutcomes: { type: String, required: true },
    prerequisites: { type: String, required: true },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

courseSchema.virtual('instructor', {
  ref: 'Instructor',
  localField: 'instructorId',
  foreignField: '_id',
  justOne: true,
});

const Course: Model<ICourse> =
  mongoose.models.Course || mongoose.model<ICourse>('Course', courseSchema);

export default Course;
