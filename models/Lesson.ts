import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ILesson extends Document {
  title: string;
  content: string;
  duration: string;
  isFree: boolean;
  order: number;
  moduleId: mongoose.Types.ObjectId | string;
  videoUrl?: string;
  videoKey?: string;
  pdfUrl?: string;
  pdfName?: string;
  quizId?: mongoose.Types.ObjectId | string;
  type?: 'VIDEO' | 'PDF' | 'QUIZ';
  isDownloadable?: boolean; // false = View-Only by default to protect intellectual property
  bunnyVideoId?: string;
  bunnyLibraryId?: string;
}

const lessonSchema = new Schema<ILesson>(
  {
    title: { type: String, required: true },
    content: { type: String, default: '' },
    duration: { type: String, required: true },
    isFree: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
    moduleId: { type: Schema.Types.ObjectId, ref: 'Module', required: true },
    videoUrl: { type: String, default: '' },
    videoKey: { type: String, default: '' },
    pdfUrl: { type: String, default: '' },
    pdfName: { type: String, default: '' },
    quizId: { type: Schema.Types.ObjectId, ref: 'Exam' },
    type: { type: String, enum: ['VIDEO', 'PDF', 'QUIZ'], default: 'VIDEO' },
    isDownloadable: { type: Boolean, default: false }, // Default view-only
    bunnyVideoId: { type: String, default: '' },
    bunnyLibraryId: { type: String, default: '' },
  },
  {
    timestamps: false,
  }
);

const Lesson: Model<ILesson> =
  mongoose.models.Lesson || mongoose.model<ILesson>('Lesson', lessonSchema);

export default Lesson;
