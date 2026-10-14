import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ILessonProgress extends Document {
  userId: mongoose.Types.ObjectId | string;
  courseId: mongoose.Types.ObjectId | string;
  lessonId: mongoose.Types.ObjectId | string;
  isCompleted: boolean;
  watchTime: number; // in seconds
  lastAccessedAt: Date;
}

const lessonProgressSchema = new Schema<ILessonProgress>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    lessonId: { type: Schema.Types.ObjectId, ref: 'Lesson', required: true },
    isCompleted: { type: Boolean, default: false },
    watchTime: { type: Number, default: 0 },
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
