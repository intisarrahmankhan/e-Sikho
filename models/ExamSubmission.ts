import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ISubmissionAnswer {
  questionIndex: number;
  type?: 'MCQ' | 'TRUE_FALSE' | 'SHORT_ANSWER' | 'CODE';
  selectedOption?: number;
  textAnswer?: string;
  codeAnswer?: string;
  codeExecutionResult?: {
    passedCount: number;
    totalCount: number;
    allPassed: boolean;
    details?: string;
  };
  isAttempted?: boolean;
  negativeMarks?: number;
  isCorrect: boolean;
}

export interface IExamSubmission extends Document {
  examId: mongoose.Types.ObjectId | string;
  studentId: mongoose.Types.ObjectId | string;
  attemptNumber?: number;
  answers: ISubmissionAnswer[];
  score: number;
  totalMarks: number;
  percentage: number;
  passed: boolean;
  hasNegativeMarking?: boolean;
  negativeMarkingRate?: number;
  negativeMarksDeducted?: number;
  rawEarnedScore?: number;
  totalCorrect?: number;
  totalWrong?: number;
  totalSkipped?: number;
  timeTakenSeconds: number;
  submittedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const submissionAnswerSchema = new Schema<ISubmissionAnswer>({
  questionIndex: { type: Number, required: true },
  type: {
    type: String,
    enum: ['MCQ', 'TRUE_FALSE', 'SHORT_ANSWER', 'CODE'],
    default: 'MCQ',
  },
  selectedOption: { type: Number, default: -1 },
  textAnswer: { type: String, default: '' },
  codeAnswer: { type: String, default: '' },
  codeExecutionResult: {
    passedCount: { type: Number, default: 0 },
    totalCount: { type: Number, default: 0 },
    allPassed: { type: Boolean, default: false },
    details: { type: String, default: '' },
  },
  isAttempted: { type: Boolean, default: false },
  negativeMarks: { type: Number, default: 0 },
  isCorrect: { type: Boolean, required: true },
});

const examSubmissionSchema = new Schema<IExamSubmission>(
  {
    examId: { type: Schema.Types.ObjectId, ref: 'Exam', required: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    attemptNumber: { type: Number, default: 1 },
    answers: { type: [submissionAnswerSchema], default: [] },
    score: { type: Number, required: true, default: 0 },
    totalMarks: { type: Number, required: true, default: 0 },
    percentage: { type: Number, required: true, default: 0 },
    passed: { type: Boolean, required: true, default: false },
    hasNegativeMarking: { type: Boolean, default: false },
    negativeMarkingRate: { type: Number, default: 0 },
    negativeMarksDeducted: { type: Number, default: 0 },
    rawEarnedScore: { type: Number, default: 0 },
    totalCorrect: { type: Number, default: 0 },
    totalWrong: { type: Number, default: 0 },
    totalSkipped: { type: Number, default: 0 },
    timeTakenSeconds: { type: Number, default: 0 },
    submittedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

const ExamSubmission: Model<IExamSubmission> =
  mongoose.models.ExamSubmission ||
  mongoose.model<IExamSubmission>('ExamSubmission', examSubmissionSchema);

export default ExamSubmission;
