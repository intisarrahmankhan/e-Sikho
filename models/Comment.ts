import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IComment extends Document {
  content: string;
  lessonId: mongoose.Types.ObjectId | string;
  userId: mongoose.Types.ObjectId | string;
  parentId?: mongoose.Types.ObjectId | string | null;
  isSolution: boolean;
  likes: mongoose.Types.ObjectId[] | string[];
  createdAt: Date;
  updatedAt: Date;
}

const commentSchema = new Schema<IComment>(
  {
    content: { type: String, required: true },
    lessonId: { type: Schema.Types.ObjectId, ref: 'Lesson', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    parentId: { type: Schema.Types.ObjectId, ref: 'Comment', default: null },
    isSolution: { type: Boolean, default: false },
    likes: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  },
  {
    timestamps: true,
  }
);

const Comment: Model<IComment> =
  mongoose.models.Comment || mongoose.model<IComment>('Comment', commentSchema);

export default Comment;
