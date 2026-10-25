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
  type?: 'VIDEO' | 'PDF' | 'QUIZ' | 'PROJECT';
  isDownloadable?: boolean; // false = View-Only by default to protect intellectual property
  bunnyVideoId?: string;
  bunnyLibraryId?: string;
  // Project submission portal fields
  projectInstructions?: string;
  projectDeliverables?: string[];
  maxMarks?: number;
  passMarks?: number;
  githubRequired?: boolean;
  liveUrlRequired?: boolean;
  automatedChecks?: string[];
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
    type: { type: String, enum: ['VIDEO', 'PDF', 'QUIZ', 'PROJECT'], default: 'VIDEO' },
    isDownloadable: { type: Boolean, default: false }, // Default view-only
    bunnyVideoId: { type: String, default: '' },
    bunnyLibraryId: { type: String, default: '' },
    projectInstructions: { type: String, default: '' },
    projectDeliverables: { type: [String], default: ['github', 'liveUrl', 'description'] },
    maxMarks: { type: Number, default: 100 },
    passMarks: { type: Number, default: 60 },
    githubRequired: { type: Boolean, default: true },
    liveUrlRequired: { type: Boolean, default: true },
    automatedChecks: {
      type: [String],
      default: ['github_repo_valid', 'live_url_active', 'code_structure', 'readme_docs'],
    },
  },
  {
    timestamps: false,
  }
);

const Lesson: Model<ILesson> =
  mongoose.models.Lesson || mongoose.model<ILesson>('Lesson', lessonSchema);

export default Lesson;
