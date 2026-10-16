import mongoose, { Document, Model, Schema } from 'mongoose';

export type ReportedEntityType = 'Course' | 'Lesson' | 'Comment' | 'User';
export type ModerationReportStatus = 'Open' | 'In Review' | 'Resolved' | 'Closed';

export interface IReport extends Document {
  reporterId: mongoose.Types.ObjectId | string;
  reported_type: ReportedEntityType;
  targetId: mongoose.Types.ObjectId | string;
  targetUserId?: mongoose.Types.ObjectId | string;
  reason: string;
  rationale: string;
  status: ModerationReportStatus;
  flaggedContentPreview?: string;
  contextData?: Record<string, any>;
  actionTaken?: string;
  resolutionNote?: string;
  resolvedBy?: mongoose.Types.ObjectId | string;
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const reportSchema = new Schema<IReport>(
  {
    reporterId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    reported_type: {
      type: String,
      enum: ['Course', 'Lesson', 'Comment', 'User', 'COURSE', 'LESSON', 'COMMENT', 'USER'],
      required: true,
      index: true,
    },
    targetId: { type: Schema.Types.ObjectId, required: true, index: true },
    targetUserId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    reason: { type: String, required: true },
    rationale: { type: String, required: true },
    status: {
      type: String,
      enum: ['Open', 'In Review', 'Resolved', 'Closed', 'OPEN', 'IN_REVIEW', 'RESOLVED', 'CLOSED'],
      default: 'Open',
      index: true,
    },
    flaggedContentPreview: { type: String, default: '' },
    contextData: { type: Schema.Types.Mixed, default: {} },
    actionTaken: { type: String },
    resolutionNote: { type: String },
    resolvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    resolvedAt: { type: Date },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual alias for camelCase reportedType
reportSchema.virtual('reportedType').get(function () {
  return this.reported_type;
}).set(function (val: ReportedEntityType) {
  this.reported_type = val;
});

const Report: Model<IReport> =
  mongoose.models.Report || mongoose.model<IReport>('Report', reportSchema);

export default Report;
