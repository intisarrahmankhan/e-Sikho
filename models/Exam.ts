import mongoose, { Document, Model, Schema } from 'mongoose';

export type ExamQuestionType = 'MCQ' | 'TRUE_FALSE' | 'SHORT_ANSWER' | 'CODE';

export interface IExamTestCase {
  input: string;
  expectedOutput: string;
  isHidden?: boolean;
}

export interface IExamQuestion {
  _id?: string;
  type?: ExamQuestionType;
  question: string;
  options?: string[];
  correctAnswer?: number;
  acceptedAnswers?: string[];
  codeTemplate?: string;
  codeLanguage?: string;
  testCases?: IExamTestCase[];
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
  hasNegativeMarking?: boolean;
  negativeMarkingValue?: number;
  maxAttempts?: number;
  status: 'DRAFT' | 'PUBLISHED';
  questions: IExamQuestion[];
  createdById?: mongoose.Types.ObjectId | string;
  createdAt: Date;
  updatedAt: Date;
}

const testCaseSchema = new Schema<IExamTestCase>(
  {
    input: { type: String, default: '' },
    expectedOutput: { type: String, default: '' },
    isHidden: { type: Boolean, default: false },
  },
  { _id: false }
);

const questionSchema = new Schema<IExamQuestion>({
  type: {
    type: String,
    enum: ['MCQ', 'TRUE_FALSE', 'SHORT_ANSWER', 'CODE'],
    default: 'MCQ',
  },
  question: { type: String, required: true },
  options: { type: [String], default: [] },
  correctAnswer: { type: Number, default: 0 },
  acceptedAnswers: { type: [String], default: [] },
  codeTemplate: { type: String, default: '' },
  codeLanguage: { type: String, default: 'javascript' },
  testCases: { type: [testCaseSchema], default: [] },
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
    hasNegativeMarking: { type: Boolean, default: false },
    negativeMarkingValue: { type: Number, default: 0.25 },
    maxAttempts: { type: Number, default: 3, min: 1 },
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
