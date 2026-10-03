'use client';

import React, { useState } from 'react';
import { addLessonResource } from '@/actions/resource';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { FileText, Plus, Shield, CheckCircle } from 'lucide-react';

export type ResourceType = {
  _id: string;
  title: string;
  content: string;
  isPublic: boolean;
  userId: string;
  createdAt: string;
};

export default function NotesAndResources({ moduleId, currentUserId, initialNotes = [] }: { moduleId: string, currentUserId: string, initialNotes?: ResourceType[] }) {
  const [notes, setNotes] = useState<ResourceType[]>(initialNotes);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const handleAddNote = async () => {
    if (!title.trim() || !content.trim()) return;
    setLoading(true);
    setSuccessMsg('');
    const res = await addLessonResource({
      title,
      content,
      moduleId,
      userId: currentUserId,
      isPublic
    });
    
    if (res.success && res.resource) {
      setNotes([res.resource, ...notes]);
      setTitle('');
      setContent('');
      setIsPublic(false);
      setSuccessMsg('Note securely added and sanitized!');
      setTimeout(() => setSuccessMsg(''), 3000);
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6 bg-white p-6 rounded-xl border border-slate-200">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary-600" /> Community Notes & Resources
        </h3>
        <span className="text-xs flex items-center gap-1 text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
          <Shield className="w-3 h-3 text-emerald-600" /> XSS Protected
        </span>
      </div>

      <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-3">
        <h4 className="font-semibold text-sm">Create New Note</h4>
        <Input 
          placeholder="Note Title" 
          value={title} 
          onChange={e => setTitle(e.target.value)} 
          className="bg-white"
        />
        <textarea 
          placeholder="Type your study notes here..." 
          value={content} 
          onChange={e => setContent(e.target.value)}
          className="w-full min-h-[100px] p-3 text-sm rounded-md border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-900 bg-white"
        />
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
            <input 
              type="checkbox" 
              checked={isPublic} 
              onChange={e => setIsPublic(e.target.checked)} 
              className="rounded border-slate-300 text-primary-600 focus:ring-primary-600"
            />
            Make public to community
          </label>
          <Button onClick={handleAddNote} disabled={loading} className="gap-2">
            <Plus className="w-4 h-4" /> {loading ? 'Saving...' : 'Publish Note'}
          </Button>
        </div>
        {successMsg && (
          <p className="text-xs text-emerald-600 flex items-center gap-1 mt-2">
            <CheckCircle className="w-3 h-3" /> {successMsg}
          </p>
        )}
      </div>

      <div className="space-y-4 pt-4 border-t border-slate-100">
        <h4 className="font-semibold text-slate-800">Recent Notes</h4>
        {notes.length === 0 ? (
          <p className="text-sm text-slate-500 italic">No notes found for this module yet. Be the first to share!</p>
        ) : (
          notes.map(note => (
            <div key={note._id} className="p-4 bg-white border border-slate-100 rounded-lg shadow-sm">
              <div className="flex justify-between items-start mb-2">
                <h5 className="font-bold text-slate-900">{note.title}</h5>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${note.isPublic ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-600'}`}>
                  {note.isPublic ? 'PUBLIC' : 'PRIVATE'}
                </span>
              </div>
              <p className="text-sm text-slate-700 whitespace-pre-wrap">{note.content}</p>
              <div className="mt-3 text-xs text-slate-400">
                {new Date(note.createdAt).toLocaleDateString()}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
