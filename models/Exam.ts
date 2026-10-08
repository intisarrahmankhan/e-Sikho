import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IExamQuestion {
  _id?: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
  marks: number;
}

export interface IExam extends Document {
  title: string;
  description: string;
  courseId?: mongoose.Types.ObjectId | string;
  category: string;
  duration: number; // in minutes
  totalMarks: number;
  passMarks: number;
  status: 'DRAFT' | 'PUBLISHED';
  questions: IExamQuestion[];
  createdById?: mongoose.Types.ObjectId | string;
  createdAt: Date;
  updatedAt: Date;
}

const questionSchema = new Schema<IExamQuestion>({
  question: { type: String, required: true },
  options: { type: [String], required: true },
  correctAnswer: { type: Number, required: true },
  explanation: { type: String, default: '' },
  marks: { type: Number, default: 1 },
});

const examSchema = new Schema<IExam>(
  {
    title: { type: String, required: true },
    description: { type: String, default: '' },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course' },
    category: { type: String, default: 'General' },
    duration: { type: Number, required: true, default: 30 }, // in minutes
    totalMarks: { type: Number, required: true, default: 10 },
    passMarks: { type: Number, required: true, default: 4 },
    status: {
      type: String,
      enum: ['DRAFT', 'PUBLISHED'],
      default: 'PUBLISHED',
    },
    questions: { type: [questionSchema], default: [] },
    createdById: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  {
    timestamps: true,
  }
);

const Exam: Model<IExam> =
  mongoose.models.Exam || mongoose.model<IExam>('Exam', examSchema);

export default Exam;
