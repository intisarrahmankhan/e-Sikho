import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  image?: string;
  role: 'STUDENT' | 'INSTRUCTOR' | 'MODERATOR' | 'ADMIN' | 'SUPERADMIN';
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
  createdAt: Date;
  updatedAt: Date;
  availableBalance: number;
  totalEarnings: number;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    image: { type: String },
    role: {
      type: String,
      enum: ['STUDENT', 'INSTRUCTOR', 'MODERATOR', 'ADMIN', 'SUPERADMIN'],
      default: 'STUDENT',
    },
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED'],
      default: 'PENDING',
    },
    availableBalance: { type: Number, default: 0 },
    totalEarnings: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>('User', userSchema);

export default User;
