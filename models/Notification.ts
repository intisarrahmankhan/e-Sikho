import mongoose, { Document, Model, Schema } from 'mongoose';

export interface INotification extends Document {
  recipientId: mongoose.Types.ObjectId | string;
  title: string;
  message: string;
  type: 'CONTEST_ANNOUNCEMENT' | 'CONTEST_REMINDER' | 'ELO_UPDATE' | 'COURSE_COMPLETION' | 'SYSTEM';
  priority: 'HIGH' | 'NORMAL' | 'LOW';
  priorityWeight: number; // 3 for HIGH, 2 for NORMAL, 1 for LOW for fast sorting
  targetBackgrounds: string[];
  actionUrl?: string;
  badgeLabel?: string;
  isRead: boolean;
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    recipientId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
      type: String,
      enum: ['CONTEST_ANNOUNCEMENT', 'CONTEST_REMINDER', 'ELO_UPDATE', 'COURSE_COMPLETION', 'SYSTEM'],
      default: 'CONTEST_ANNOUNCEMENT',
    },
    priority: {
      type: String,
      enum: ['HIGH', 'NORMAL', 'LOW'],
      default: 'NORMAL',
      index: true,
    },
    priorityWeight: { type: Number, default: 2, index: true }, // 3=HIGH, 2=NORMAL, 1=LOW
    targetBackgrounds: { type: [String], default: [] },
    actionUrl: { type: String, default: '/contests' },
    badgeLabel: { type: String, default: '' },
    isRead: { type: Boolean, default: false, index: true },
    readAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

// Index to efficiently query and sort notifications by priority first, then createdAt descending
notificationSchema.index({ recipientId: 1, priorityWeight: -1, createdAt: -1 });

const Notification: Model<INotification> =
  mongoose.models.Notification ||
  mongoose.model<INotification>('Notification', notificationSchema);

export default Notification;
