import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ILiveSession extends Document {
  courseId: string;
  title: string;
  titleEn?: string;
  instructorName: string;
  instructorAvatar?: string;
  scheduledTime: Date;
  duration: string;
  status: 'UPCOMING' | 'LIVE_NOW' | 'COMPLETED';
  streamUrl?: string; // YouTube embed / Bunny HLS stream / iframe
  meetUrl?: string;
  recordingUrl?: string;
  viewerCount: number;
  description?: string;
  topic?: string;
  createdAt: Date;
  updatedAt: Date;
}

const liveSessionSchema = new Schema<ILiveSession>(
  {
    courseId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    titleEn: { type: String, default: '' },
    instructorName: { type: String, required: true },
    instructorAvatar: { type: String, default: '' },
    scheduledTime: { type: Date, required: true },
    duration: { type: String, default: '১ ঘণ্টা ৩০ মিনিট' },
    status: {
      type: String,
      enum: ['UPCOMING', 'LIVE_NOW', 'COMPLETED'],
      default: 'UPCOMING',
    },
    streamUrl: { type: String, default: '' },
    meetUrl: { type: String, default: '' },
    recordingUrl: { type: String, default: '' },
    viewerCount: { type: Number, default: 0 },
    description: { type: String, default: '' },
    topic: { type: String, default: '' },
  },
  {
    timestamps: true,
  }
);

const LiveSession: Model<ILiveSession> =
  mongoose.models.LiveSession || mongoose.model<ILiveSession>('LiveSession', liveSessionSchema);

export default LiveSession;
