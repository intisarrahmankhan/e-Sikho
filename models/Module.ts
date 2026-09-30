import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IModule extends Document {
  title: string;
  duration: string;
  order: number;
  courseId: mongoose.Types.ObjectId | string;
}

const moduleSchema = new Schema<IModule>(
  {
    title: { type: String, required: true },
    duration: { type: String, required: true },
    order: { type: Number, default: 0 },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
  },
  {
    timestamps: false,
  }
);

const Module: Model<IModule> =
  mongoose.models.Module || mongoose.model<IModule>('Module', moduleSchema);

export default Module;
