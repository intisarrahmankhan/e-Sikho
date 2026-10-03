'use client';

import React, { useState } from 'react';
import { addComment, toggleLikeComment, flagSolution } from '@/actions/comment';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { MessageSquare, ThumbsUp, CheckCircle, Reply } from 'lucide-react';

export type CommentType = {
  _id: string;
  content: string;
  userId: { _id: string; name: string };
  parentId: string | null;
  isSolution: boolean;
  likes: string[];
  createdAt: string;
};

export default function DiscussionBoard({ lessonId, currentUserId, initialComments = [] }: { lessonId: string, currentUserId: string, initialComments?: CommentType[] }) {
  const [comments, setComments] = useState<CommentType[]>(initialComments);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);

  const handlePostComment = async () => {
    if (!newComment.trim()) return;
    const res = await addComment({ content: newComment, lessonId, userId: currentUserId, parentId: replyTo });
    if (res.success && res.comment) {
      setComments([...comments, { ...res.comment, userId: { _id: currentUserId, name: 'You' }, likes: [] }]);
      setNewComment('');
      setReplyTo(null);
    }
  };

  const handleLike = async (commentId: string) => {
    const res = await toggleLikeComment(commentId, currentUserId, lessonId);
    if (res.success) {
      setComments(comments.map(c => {
        if (c._id === commentId) {
          const hasLiked = c.likes.includes(currentUserId);
          return { ...c, likes: hasLiked ? c.likes.filter(id => id !== currentUserId) : [...c.likes, currentUserId] };
        }
        return c;
      }));
    }
  };

  const handleFlagSolution = async (commentId: string) => {
    const res = await flagSolution(commentId, lessonId);
    if (res.success) {
      setComments(comments.map(c => ({
        ...c,
        isSolution: c._id === commentId ? true : c.isSolution
      })));
    }
  };

  const topLevelComments = comments.filter(c => !c.parentId);
  const replies = comments.filter(c => c.parentId);

  return (
    <div className="space-y-6 bg-white p-6 rounded-xl border border-slate-200">
      <h3 className="text-xl font-bold flex items-center gap-2">
        <MessageSquare className="w-5 h-5 text-primary-600" /> Lesson Q&A
      </h3>
      
      <div className="space-y-4">
        {topLevelComments.map(comment => (
          <div key={comment._id} className={`p-4 rounded-lg border ${comment.isSolution ? 'border-green-500 bg-green-50' : 'border-slate-100 bg-slate-50'}`}>
            <div className="flex justify-between items-start">
              <div>
                <span className="font-semibold">{comment.userId?.name}</span>
                <span className="text-xs text-slate-500 ml-2">{new Date(comment.createdAt).toLocaleDateString()}</span>
                {comment.isSolution && <span className="ml-2 text-xs font-bold text-green-600 flex items-center gap-1 inline-flex"><CheckCircle className="w-3 h-3" /> Solution</span>}
              </div>
            </div>
            <p className="mt-2 text-sm text-slate-700">{comment.content}</p>
            
            <div className="mt-3 flex items-center gap-4 text-xs text-slate-600">
              <button onClick={() => handleLike(comment._id)} className="flex items-center gap-1 hover:text-primary-600">
                <ThumbsUp className={`w-4 h-4 ${comment.likes.includes(currentUserId) ? 'text-primary-600 fill-primary-600' : ''}`} /> {comment.likes.length}
              </button>
              <button onClick={() => setReplyTo(comment._id)} className="flex items-center gap-1 hover:text-primary-600">
                <Reply className="w-4 h-4" /> Reply
              </button>
              <button onClick={() => handleFlagSolution(comment._id)} className="hover:text-green-600">
                Mark as Solution
              </button>
            </div>

            {/* Render Replies */}
            <div className="mt-4 pl-4 border-l-2 border-slate-200 space-y-3">
              {replies.filter(r => r.parentId === comment._id).map(reply => (
                <div key={reply._id} className="text-sm">
                  <span className="font-semibold text-slate-800">{reply.userId?.name}: </span>
                  <span className="text-slate-700">{reply.content}</span>
                  <div className="mt-1 flex items-center gap-3 text-xs text-slate-500">
                    <button onClick={() => handleLike(reply._id)} className="flex items-center gap-1 hover:text-primary-600">
                      <ThumbsUp className={`w-3 h-3 ${reply.likes.includes(currentUserId) ? 'text-primary-600 fill-primary-600' : ''}`} /> {reply.likes.length}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Reply Input */}
            {replyTo === comment._id && (
              <div className="mt-3 flex gap-2">
                <Input value={newComment} onChange={e => setNewComment(e.target.value)} placeholder="Write a reply..." className="h-8 text-sm" />
                <Button size="sm" onClick={handlePostComment}>Reply</Button>
                <Button size="sm" variant="ghost" onClick={() => setReplyTo(null)}>Cancel</Button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Main Comment Input */}
      {!replyTo && (
        <div className="pt-4 border-t border-slate-100 flex gap-3">
          <Input value={newComment} onChange={e => setNewComment(e.target.value)} placeholder="Ask a question about this lesson..." />
          <Button onClick={handlePostComment}>Post</Button>
        </div>
      )}
    </div>
  );
}
