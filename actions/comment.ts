'use server';

import dbConnect from '@/lib/mongoose';
import Comment from '@/models/Comment';
import { revalidatePath } from 'next/cache';

export async function addComment(data: {
  content: string;
  lessonId: string;
  userId: string;
  parentId?: string | null;
}) {
  try {
    await dbConnect();
    const comment = await Comment.create({
      content: data.content,
      lessonId: data.lessonId,
      userId: data.userId,
      parentId: data.parentId || null,
    });
    revalidatePath(`/lessons/${data.lessonId}`);
    return { success: true, comment: JSON.parse(JSON.stringify(comment)) };
  } catch (error) {
    console.error('Failed to add comment:', error);
    return { success: false, error: 'Failed to add comment' };
  }
}

export async function toggleLikeComment(commentId: string, userId: string, lessonId: string) {
  try {
    await dbConnect();
    const comment = await Comment.findById(commentId);
    if (!comment) return { success: false, error: 'Comment not found' };

    const hasLiked = comment.likes.includes(userId as any);
    if (hasLiked) {
      await Comment.findByIdAndUpdate(commentId, { $pull: { likes: userId } });
    } else {
      await Comment.findByIdAndUpdate(commentId, { $push: { likes: userId } });
    }
    revalidatePath(`/lessons/${lessonId}`);
    return { success: true };
  } catch (error) {
    console.error('Failed to toggle like:', error);
    return { success: false, error: 'Failed to toggle like' };
  }
}

export async function flagSolution(commentId: string, lessonId: string) {
  try {
    await dbConnect();
    await Comment.findByIdAndUpdate(commentId, { isSolution: true });
    revalidatePath(`/lessons/${lessonId}`);
    return { success: true };
  } catch (error) {
    console.error('Failed to flag solution:', error);
    return { success: false, error: 'Failed to flag solution' };
  }
}
