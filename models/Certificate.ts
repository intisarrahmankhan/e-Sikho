import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ICertificate extends Document {
  userId: mongoose.Types.ObjectId | string;
  courseId: mongoose.Types.ObjectId | string;
  certificateId: string; // Unique string for verification, e.g., UUID
  certificateUrl?: string; // S3 or storage link to the generated PDF/image
  issuedAt: Date;
}

const certificateSchema = new Schema<ICertificate>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    certificateId: { type: String, required: true, unique: true },
    certificateUrl: { type: String },
    issuedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: false,
  }
);

// One certificate per user per course
certificateSchema.index({ userId: 1, courseId: 1 }, { unique: true });

const Certificate: Model<ICertificate> =
  mongoose.models.Certificate || mongoose.model<ICertificate>('Certificate', certificateSchema);

export default Certificate;
