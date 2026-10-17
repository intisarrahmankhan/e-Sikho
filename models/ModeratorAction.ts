import mongoose, { Document, Model, Schema } from 'mongoose';

export type ModeratorActionType = 'Warning' | 'Remove' | 'Ban' | 'Other';

export interface IModeratorAction extends Document {
  reportId: mongoose.Types.ObjectId | string;
  moderatorId: mongoose.Types.ObjectId | string;
  targetId: mongoose.Types.ObjectId | string;
  targetType: string;
  targetUserId?: mongoose.Types.ObjectId | string;
  actionTaken: ModeratorActionType;
  note: string;
  penaltyDetails?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const moderatorActionSchema = new Schema<IModeratorAction>(
  {
    reportId: { type: Schema.Types.ObjectId, ref: 'Report', required: true, index: true },
    moderatorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    targetId: { type: Schema.Types.ObjectId, required: true, index: true },
    targetType: {
      type: String,
      enum: ['Course', 'Lesson', 'Comment', 'User', 'COURSE', 'LESSON', 'COMMENT', 'USER'],
      required: true,
    },
    targetUserId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    actionTaken: {
      type: String,
      enum: ['Warning', 'Remove', 'Ban', 'Other', 'WARNING', 'REMOVE', 'BAN', 'OTHER'],
      required: true,
      index: true,
    },
    note: { type: String, required: true },
    penaltyDetails: { type: Schema.Types.Mixed, default: {} },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

const ModeratorAction: Model<IModeratorAction> =
  mongoose.models.ModeratorAction ||
  mongoose.model<IModeratorAction>('ModeratorAction', moderatorActionSchema);

export default ModeratorAction;
