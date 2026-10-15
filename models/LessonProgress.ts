import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ILessonProgress extends Document {
  userId: mongoose.Types.ObjectId | string;
  courseId: mongoose.Types.ObjectId | string;
  lessonId: mongoose.Types.ObjectId | string;
  isCompleted: boolean;
  watchTime: number; // in seconds
  stoppedTimestamp?: number; // exact second where student stopped watching
  stoppedAtFormatted?: string; // e.g. "04:32"
  videoDuration?: number; // total duration in seconds
  dropOffRate?: number; // percentage where student dropped off (e.g. 42.5%)
  lastAccessedAt: Date;
}

const lessonProgressSchema = new Schema<ILessonProgress>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    lessonId: { type: Schema.Types.ObjectId, ref: 'Lesson', required: true },
    isCompleted: { type: Boolean, default: false },
    watchTime: { type: Number, default: 0 },
    stoppedTimestamp: { type: Number, default: 0 },
    stoppedAtFormatted: { type: String, default: '00:00' },
    videoDuration: { type: Number, default: 0 },
    dropOffRate: { type: Number, default: 0 },
    lastAccessedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

lessonProgressSchema.index({ userId: 1, courseId: 1, lessonId: 1 }, { unique: true });

const LessonProgress: Model<ILessonProgress> =
  mongoose.models.LessonProgress || mongoose.model<ILessonProgress>('LessonProgress', lessonProgressSchema);

export default LessonProgress;
