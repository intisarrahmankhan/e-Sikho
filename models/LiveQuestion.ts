import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ILiveQuestion extends Document {
  sessionId: string;
  courseId: string;
  studentId: string;
  studentName: string;
  studentAvatar?: string;
  question: string;
  upvotes: string[]; // array of student/user IDs
  upvoteCount: number;
  isAnswered: boolean;
  answeredAt?: Date;
  instructorReply?: string;
  isPinned: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const liveQuestionSchema = new Schema<ILiveQuestion>(
  {
    sessionId: { type: String, required: true, index: true },
    courseId: { type: String, required: true, index: true },
    studentId: { type: String, required: true, index: true },
    studentName: { type: String, required: true },
    studentAvatar: { type: String, default: '' },
    question: { type: String, required: true, maxlength: 600 },
    upvotes: { type: [String], default: [] },
    upvoteCount: { type: Number, default: 0 },
    isAnswered: { type: Boolean, default: false },
    answeredAt: { type: Date },
    instructorReply: { type: String, default: '' },
    isPinned: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

// Fast compound lookup for live session question board
liveQuestionSchema.index({ sessionId: 1, isPinned: -1, upvoteCount: -1, createdAt: -1 });

const LiveQuestion: Model<ILiveQuestion> =
  mongoose.models.LiveQuestion || mongoose.model<ILiveQuestion>('LiveQuestion', liveQuestionSchema);

export default LiveQuestion;
