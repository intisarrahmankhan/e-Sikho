import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IInstructor extends Document {
  name: string;
  role: string;
  avatar: string;
  bio: string;
}

const instructorSchema = new Schema<IInstructor>(
  {
    name: { type: String, required: true },
    role: { type: String, required: true },
    avatar: { type: String, required: true },
    bio: { type: String, required: true },
  },
  {
    timestamps: false,
  }
);

const Instructor: Model<IInstructor> =
  mongoose.models.Instructor || mongoose.model<IInstructor>('Instructor', instructorSchema);

export default Instructor;
