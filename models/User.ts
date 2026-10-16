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
  interests?: string[];
  skills?: string[];
  elo?: number;
  competitiveElo?: number;
  problemsSolved?: number;
  completedCoursesCount?: number;
  streak?: number;
  instructorTitle?: string;
  organization?: string;
  experienceYears?: number;
  website?: string;
  github?: string;
  linkedin?: string;
  twitter?: string;
  expertise?: string[];
  payoutMethod?: 'BKASH' | 'NAGAD' | 'ROCKET' | 'BANK';
  payoutNumber?: string;
  bankName?: string;
  bankBranch?: string;
  bankAccountName?: string;
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
    interests: { type: [String], default: [] },
    skills: { type: [String], default: [] },
    instructorTitle: { type: String, default: '' },
    organization: { type: String, default: '' },
    experienceYears: { type: Number, default: 0 },
    website: { type: String, default: '' },
    github: { type: String, default: '' },
    linkedin: { type: String, default: '' },
    twitter: { type: String, default: '' },
    expertise: { type: [String], default: [] },
    payoutMethod: { type: String, default: 'BKASH' },
    payoutNumber: { type: String, default: '' },
    bankName: { type: String, default: '' },
    bankBranch: { type: String, default: '' },
    bankAccountName: { type: String, default: '' },
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
