import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ISubmissionAnswer {
  questionIndex: number;
  selectedOption: number;
  isCorrect: boolean;
}

export interface IExamSubmission extends Document {
  examId: mongoose.Types.ObjectId | string;
  studentId: mongoose.Types.ObjectId | string;
  answers: ISubmissionAnswer[];
  score: number;
  totalMarks: number;
  percentage: number;
  passed: boolean;
  timeTakenSeconds: number;
  submittedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const submissionAnswerSchema = new Schema<ISubmissionAnswer>({
  questionIndex: { type: Number, required: true },
  selectedOption: { type: Number, required: true },
  isCorrect: { type: Boolean, required: true },
});

const examSubmissionSchema = new Schema<IExamSubmission>(
  {
    examId: { type: Schema.Types.ObjectId, ref: 'Exam', required: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    answers: { type: [submissionAnswerSchema], default: [] },
    score: { type: Number, required: true, default: 0 },
    totalMarks: { type: Number, required: true, default: 0 },
    percentage: { type: Number, required: true, default: 0 },
    passed: { type: Boolean, required: true, default: false },
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
