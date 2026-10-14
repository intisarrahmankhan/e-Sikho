import mongoose, { Document, Model, Schema } from 'mongoose';

export type RoutineItemType = 'LECTURE' | 'LIVE_CLASS' | 'EXAM' | 'REVISION';
export type RoutinePaceMode = 'ACCELERATED' | 'REBALANCED_CATCHUP' | 'CUSTOM' | 'STANDARD';

export interface IRoutineItem {
  id: string;
  itemType: RoutineItemType;
  title: string;
  titleEn?: string;
  duration: string;
  scheduledDate: Date;
  moduleId?: string;
  moduleTitle?: string;
  lessonId?: string;
  dayNumber: number;
  weekNumber: number;
  completed: boolean;
  completedAt?: Date;
}

export interface ICourseRoutine extends Document {
  userId: mongoose.Types.ObjectId | string;
  courseId: string;
  paceMode: RoutinePaceMode;
  startDate: Date;
  targetCompletionDate: Date;
  originalDurationMonths: number;
  targetDurationMonths: number;
  daysPerWeek: number;
  dailyHours: number;
  rescheduleReason?: string;
  lastRescheduledAt: Date;
  items: IRoutineItem[];
  createdAt: Date;
  updatedAt: Date;
}

const routineItemSchema = new Schema<IRoutineItem>(
  {
    id: { type: String, required: true },
    itemType: {
      type: String,
      enum: ['LECTURE', 'LIVE_CLASS', 'EXAM', 'REVISION'],
      default: 'LECTURE',
    },
    title: { type: String, required: true },
    titleEn: { type: String, default: '' },
    duration: { type: String, default: '30 mins' },
    scheduledDate: { type: Date, required: true },
    moduleId: { type: String, default: '' },
    moduleTitle: { type: String, default: '' },
    lessonId: { type: String, default: '' },
    dayNumber: { type: Number, default: 1 },
    weekNumber: { type: Number, default: 1 },
    completed: { type: Boolean, default: false },
    completedAt: { type: Date },
  },
  { _id: false }
);

const courseRoutineSchema = new Schema<ICourseRoutine>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    courseId: { type: String, required: true },
    paceMode: {
      type: String,
      enum: ['ACCELERATED', 'REBALANCED_CATCHUP', 'CUSTOM', 'STANDARD'],
      default: 'STANDARD',
    },
    startDate: { type: Date, default: Date.now },
    targetCompletionDate: { type: Date, required: true },
    originalDurationMonths: { type: Number, default: 4 },
    targetDurationMonths: { type: Number, default: 1 },
    daysPerWeek: { type: Number, default: 5 },
    dailyHours: { type: Number, default: 2 },
    rescheduleReason: { type: String, default: '' },
    lastRescheduledAt: { type: Date, default: Date.now },
    items: { type: [routineItemSchema], default: [] },
  },
  {
    timestamps: true,
  }
);

courseRoutineSchema.index({ userId: 1, courseId: 1 }, { unique: true });

const CourseRoutine: Model<ICourseRoutine> =
  mongoose.models.CourseRoutine ||
  mongoose.model<ICourseRoutine>('CourseRoutine', courseRoutineSchema);

export default CourseRoutine;
