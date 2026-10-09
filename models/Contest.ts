import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IContestProblem {
  id: string;
  title: string;
  statement: string; // Markdown / LaTeX format
  category: string;
  difficultyRating: number; // e.g. 1400, 1650, 1900
  points: number; // e.g. 100, 200, 300
  options: string[];
  correctAnswer: number;
  explanation: string;
  hints?: string[];
  sampleInputOutput?: string;
}

export interface IContest extends Document {
  title: string;
  slug: string;
  description: string;
  shortSummary: string;
  category: string;
  targetBackgrounds: string[]; // ['CSE', 'SWE', 'EEE', 'DATA_SCIENCE', 'BUSINESS', 'GENERAL']
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'GRANDMASTER';
  benchmarkRating: number; // Base contest rating for Elo expectation (e.g. 1400, 1600, 1850)
  startTime: Date;
  endTime: Date;
  durationMinutes: number;
  status: 'UPCOMING' | 'LIVE' | 'ENDED';
  problems: IContestProblem[];
  totalParticipants: number;
  prizePool?: string;
  featuredOnHome: boolean;
  rules?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const contestProblemSchema = new Schema<IContestProblem>({
  id: { type: String, required: true },
  title: { type: String, required: true },
  statement: { type: String, required: true },
  category: { type: String, default: 'Algorithms' },
  difficultyRating: { type: Number, default: 1400 },
  points: { type: Number, default: 100 },
  options: { type: [String], required: true },
  correctAnswer: { type: Number, required: true },
  explanation: { type: String, default: '' },
  hints: { type: [String], default: [] },
  sampleInputOutput: { type: String, default: '' },
});

const contestSchema = new Schema<IContest>(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true, index: true },
    description: { type: String, required: true },
    shortSummary: { type: String, default: '' },
    category: { type: String, default: 'Computer Science' },
    targetBackgrounds: {
      type: [String],
      default: ['CSE', 'SWE'],
      index: true,
    },
    difficulty: {
      type: String,
      enum: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'GRANDMASTER'],
      default: 'INTERMEDIATE',
    },
    benchmarkRating: { type: Number, default: 1500 },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    durationMinutes: { type: Number, default: 60 },
    status: {
      type: String,
      enum: ['UPCOMING', 'LIVE', 'ENDED'],
      default: 'LIVE',
      index: true,
    },
    problems: { type: [contestProblemSchema], default: [] },
    totalParticipants: { type: Number, default: 0 },
    prizePool: { type: String, default: '' },
    featuredOnHome: { type: Boolean, default: true, index: true },
    rules: { type: [String], default: [] },
  },
  {
    timestamps: true,
  }
);

const Contest: Model<IContest> =
  mongoose.models.Contest || mongoose.model<IContest>('Contest', contestSchema);

export default Contest;
