import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IAutomatedCheck {
  name: string;
  status: 'PASSED' | 'FAILED' | 'WARNING';
  score: number;
  maxScore: number;
  feedback: string;
}

export interface IProjectEvaluation {
  evaluatedAt: Date;
  overallScore: number;
  maxScore: number;
  checks: IAutomatedCheck[];
  feedbackSummary: string;
  strengths: string[];
  improvements: string[];
}

export interface IProjectSubmission extends Document {
  courseId: mongoose.Types.ObjectId | string;
  moduleId?: mongoose.Types.ObjectId | string;
  lessonId: mongoose.Types.ObjectId | string;
  studentId: mongoose.Types.ObjectId | string;
  githubUrl: string;
  liveUrl?: string;
  description: string;
  notes?: string;
  status: 'PENDING' | 'EVALUATED' | 'PASSED' | 'FAILED';
  score: number;
  maxMarks: number;
  passMarks: number;
  automatedEvaluation?: IProjectEvaluation;
  instructorScore?: number;
  instructorFeedback?: string;
  submittedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const automatedCheckSchema = new Schema<IAutomatedCheck>(
  {
    name: { type: String, required: true },
    status: { type: String, enum: ['PASSED', 'FAILED', 'WARNING'], default: 'PASSED' },
    score: { type: Number, required: true, default: 0 },
    maxScore: { type: Number, required: true, default: 25 },
    feedback: { type: String, default: '' },
  },
  { _id: false }
);

const projectEvaluationSchema = new Schema<IProjectEvaluation>(
  {
    evaluatedAt: { type: Date, default: Date.now },
    overallScore: { type: Number, default: 0 },
    maxScore: { type: Number, default: 100 },
    checks: { type: [automatedCheckSchema], default: [] },
    feedbackSummary: { type: String, default: '' },
    strengths: { type: [String], default: [] },
    improvements: { type: [String], default: [] },
  },
  { _id: false }
);

const projectSubmissionSchema = new Schema<IProjectSubmission>(
  {
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    moduleId: { type: Schema.Types.ObjectId, ref: 'Module' },
    lessonId: { type: Schema.Types.ObjectId, ref: 'Lesson', required: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    githubUrl: { type: String, required: true, trim: true },
    liveUrl: { type: String, default: '', trim: true },
    description: { type: String, default: '', trim: true },
    notes: { type: String, default: '', trim: true },
    status: {
      type: String,
      enum: ['PENDING', 'EVALUATED', 'PASSED', 'FAILED'],
      default: 'PENDING',
    },
    score: { type: Number, default: 0 },
    maxMarks: { type: Number, default: 100 },
    passMarks: { type: Number, default: 60 },
    automatedEvaluation: { type: projectEvaluationSchema },
    instructorScore: { type: Number },
    instructorFeedback: { type: String, default: '' },
    submittedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

// Indexes for fast lookup
projectSubmissionSchema.index({ courseId: 1, lessonId: 1, studentId: 1 });
projectSubmissionSchema.index({ studentId: 1, status: 1 });

const ProjectSubmission: Model<IProjectSubmission> =
  mongoose.models.ProjectSubmission ||
  mongoose.model<IProjectSubmission>('ProjectSubmission', projectSubmissionSchema);

export default ProjectSubmission;
