import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IInstructorRequest extends Document {
  userId: mongoose.Types.ObjectId | string;
  reason: string;
  status: string; // PENDING | ADMIN_APPROVED | SUPERADMIN_APPROVED | APPROVED | REJECTED
  adminApprovedAt?: Date;
  superadminApprovedAt?: Date;
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const instructorRequestSchema = new Schema<IInstructorRequest>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    reason: { type: String, required: true },
    status: { type: String, default: 'PENDING' },
    adminApprovedAt: { type: Date },
    superadminApprovedAt: { type: Date },
    reviewedAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

const InstructorRequest: Model<IInstructorRequest> =
  mongoose.models.InstructorRequest ||
  mongoose.model<IInstructorRequest>('InstructorRequest', instructorRequestSchema);

export default InstructorRequest;
