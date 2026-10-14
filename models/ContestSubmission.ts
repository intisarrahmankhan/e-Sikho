import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IContestAnswer {
  problemId: string;
  problemIndex: number;
  selectedOption: number;
  isCorrect: boolean;
  timeSpentSeconds: number;
}

export interface IContestSubmission extends Document {
  contestId: mongoose.Types.ObjectId | string;
  studentId: mongoose.Types.ObjectId | string;
  answers: IContestAnswer[];
  totalScore: number;
  maxScore: number;
  accuracy: number;
  timeTakenSeconds: number;
  previousCompetitiveElo: number;
  newCompetitiveElo: number;
  eloChange: number; // can be negative or positive!
  previousCompositeElo: number;
  newCompositeElo: number;
  problemsSolvedCount: number;
  performanceSummary: string;
  submittedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const contestAnswerSchema = new Schema<IContestAnswer>({
  problemId: { type: String, required: true },
  problemIndex: { type: Number, required: true },
  selectedOption: { type: Number, required: true },
  isCorrect: { type: Boolean, required: true },
  timeSpentSeconds: { type: Number, default: 0 },
});

const contestSubmissionSchema = new Schema<IContestSubmission>(
  {
    contestId: { type: Schema.Types.ObjectId, ref: 'Contest', required: true, index: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    answers: { type: [contestAnswerSchema], default: [] },
    totalScore: { type: Number, required: true, default: 0 },
    maxScore: { type: Number, required: true, default: 0 },
    accuracy: { type: Number, required: true, default: 0 },
    timeTakenSeconds: { type: Number, default: 0 },
    previousCompetitiveElo: { type: Number, required: true },
    newCompetitiveElo: { type: Number, required: true },
    eloChange: { type: Number, required: true },
    previousCompositeElo: { type: Number, required: true },
    newCompositeElo: { type: Number, required: true },
    problemsSolvedCount: { type: Number, default: 0 },
    performanceSummary: { type: String, default: '' },
    submittedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

// Compound index so a user cannot duplicate active submissions if unique is needed, or can track history
contestSubmissionSchema.index({ contestId: 1, studentId: 1 });

const ContestSubmission: Model<IContestSubmission> =
  mongoose.models.ContestSubmission ||
  mongoose.model<IContestSubmission>('ContestSubmission', contestSubmissionSchema);

export default ContestSubmission;
