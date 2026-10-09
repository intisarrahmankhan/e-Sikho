import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  phone?: string;
  password?: string;
  image?: string;
  role: 'STUDENT' | 'INSTRUCTOR' | 'MODERATOR' | 'ADMIN' | 'SUPERADMIN';
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED' | 'BLOCKED';
  createdAt: Date;
  updatedAt: Date;
  availableBalance: number;
  totalEarnings: number;
  headline?: string;
  bio?: string;
  targetTrack?: string;
  academicBackground?: string;
  weeklyGoalHours?: number;
  elo?: number;
  competitiveElo?: number;
  problemsSolved?: number;
  completedCoursesCount?: number;
  streak?: number;
  eloHistory?: {
    date: Date;
    oldElo: number;
    newElo: number;
    delta: number;
    contestId?: string;
    contestTitle: string;
    reason: string;
  }[];
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, sparse: true, index: true },
    password: { type: String },
    image: { type: String },
    role: {
      type: String,
      enum: ['STUDENT', 'INSTRUCTOR', 'MODERATOR', 'ADMIN', 'SUPERADMIN'],
      default: 'STUDENT',
    },
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED', 'BLOCKED'],
      default: 'PENDING',
    },
    availableBalance: { type: Number, default: 0 },
    totalEarnings: { type: Number, default: 0 },
    headline: { type: String, default: 'Aspiring Developer' },
    bio: { type: String, default: '' },
    targetTrack: { type: String, default: 'Fullstack Web Development' },
    academicBackground: { type: String, default: 'Computer Science & Engineering (CSE)' },
    weeklyGoalHours: { type: Number, default: 10 },
    elo: { type: Number, default: 1200 },
    competitiveElo: { type: Number, default: 1200 },
    problemsSolved: { type: Number, default: 0 },
    completedCoursesCount: { type: Number, default: 0 },
    streak: { type: Number, default: 1 },
    eloHistory: [
      {
        date: { type: Date, default: Date.now },
        oldElo: { type: Number, required: true },
        newElo: { type: Number, required: true },
        delta: { type: Number, required: true },
        contestId: { type: String },
        contestTitle: { type: String, default: 'Contest Challenge' },
        reason: { type: String, default: 'Contest Evaluation' },
      },
    ],
  },
  {
    timestamps: true,
  }
);

const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>('User', userSchema);

export default User;
