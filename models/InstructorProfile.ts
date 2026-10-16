import mongoose, { Document, Model, Schema } from 'mongoose';

export type InstructorApprovalStatus = 'Pending' | 'Approved' | 'Rejected';

export interface IInstructorProfile extends Document {
  userId: mongoose.Types.ObjectId | string;
  institution: string;
  qualifications: string[];
  experienceYears: number;
  subjectSpecialization: string;
  bio: string;
  credentials?: string;
  cvUrl?: string;
  portfolioUrl?: string;
  linkedinUrl?: string;
  sampleLectureUrl?: string;
  idVerificationUrl?: string;
  approval_status: InstructorApprovalStatus;
  remarks?: string;
  reviewedBy?: mongoose.Types.ObjectId | string;
  reviewedAt?: Date;
  submissionDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

const instructorProfileSchema = new Schema<IInstructorProfile>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    institution: { type: String, required: true },
    qualifications: { type: [String], default: [] },
    experienceYears: { type: Number, default: 0 },
    subjectSpecialization: { type: String, required: true },
    bio: { type: String, required: true },
    credentials: { type: String, default: '' },
    cvUrl: { type: String, default: '' },
    portfolioUrl: { type: String, default: '' },
    linkedinUrl: { type: String, default: '' },
    sampleLectureUrl: { type: String, default: '' },
    idVerificationUrl: { type: String, default: '' },
    approval_status: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected', 'PENDING', 'APPROVED', 'REJECTED'],
      default: 'Pending',
      index: true,
    },
    remarks: { type: String, default: '' },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: { type: Date },
    submissionDate: { type: Date, default: Date.now, index: true },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual alias for camelCase approvalStatus
instructorProfileSchema.virtual('approvalStatus').get(function () {
  return this.approval_status;
}).set(function (val: InstructorApprovalStatus) {
  this.approval_status = val;
});

const InstructorProfile: Model<IInstructorProfile> =
  mongoose.models.InstructorProfile ||
  mongoose.model<IInstructorProfile>('InstructorProfile', instructorProfileSchema);

export default InstructorProfile;
