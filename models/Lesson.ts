import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ILesson extends Document {
  title: string;
  content: string;
  duration: string;
  isFree: boolean;
  order: number;
  moduleId: mongoose.Types.ObjectId | string;
}

const lessonSchema = new Schema<ILesson>(
  {
    title: { type: String, required: true },
    content: { type: String, default: '' },
    duration: { type: String, required: true },
    isFree: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
    moduleId: { type: Schema.Types.ObjectId, ref: 'Module', required: true },
  },
  {
    timestamps: false,
  }
);

const Lesson: Model<ILesson> =
  mongoose.models.Lesson || mongoose.model<ILesson>('Lesson', lessonSchema);

export default Lesson;
