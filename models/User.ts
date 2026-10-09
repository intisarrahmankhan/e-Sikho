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
  },
  {
    timestamps: true,
  }
);

const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>('User', userSchema);

export default User;
