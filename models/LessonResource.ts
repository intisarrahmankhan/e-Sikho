import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ILessonResource extends Document {
  title: string;
  content: string;
  moduleId: mongoose.Types.ObjectId | string;
  userId: mongoose.Types.ObjectId | string;
  isPublic: boolean;
  attachments: string[]; // URLs or file paths
  createdAt: Date;
  updatedAt: Date;
}

const lessonResourceSchema = new Schema<ILessonResource>(
  {
    title: { type: String, required: true },
    content: { type: String, required: true },
    moduleId: { type: Schema.Types.ObjectId, ref: 'Module', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    isPublic: { type: Boolean, default: false },
    attachments: [{ type: String }],
  },
  {
    timestamps: true,
  }
);

const LessonResource: Model<ILessonResource> =
  mongoose.models.LessonResource || mongoose.model<ILessonResource>('LessonResource', lessonResourceSchema);

export default LessonResource;
