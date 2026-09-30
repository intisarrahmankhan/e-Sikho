'use client';

import { useState } from 'react';
import { createCourse } from './actions';

export default function CourseForm() {
  const [message, setMessage] = useState('');
  const [pending, setPending] = useState(false);
  async function submit(formData: FormData) {
    setPending(true); setMessage('');
    const result = await createCourse(formData);
    setMessage(result.error || 'Course submitted for admin review.');
    setPending(false);
  }
  return <form action={submit} className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
    <div><h2 className="text-lg font-bold text-slate-900">Create a course</h2><p className="text-sm text-slate-500">Your course will be published after review.</p></div>
    <input name="title" required placeholder="Course title" className="rounded-lg border p-3 text-sm" />
    <input name="tagline" placeholder="Short tagline" className="rounded-lg border p-3 text-sm" />
    <textarea name="description" required rows={4} placeholder="Course description" className="rounded-lg border p-3 text-sm" />
    <div className="grid gap-4 sm:grid-cols-3"><input name="category" placeholder="Category" className="rounded-lg border p-3 text-sm" /><select name="level" className="rounded-lg border p-3 text-sm"><option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option></select><input name="duration" placeholder="Duration" className="rounded-lg border p-3 text-sm" /></div>
    <div><label className="mb-1 block text-sm font-medium">Price (BDT; use 0 for free)</label><input name="price" type="number" min="0" defaultValue="0" required className="w-full rounded-lg border p-3 text-sm" /></div>
    <div><label className="mb-1 block text-sm font-medium">Course image</label><input name="thumbnail" type="file" accept="image/*" className="w-full rounded-lg border p-3 text-sm" /></div>
    <input name="moduleTitle" required placeholder="First module title" className="rounded-lg border p-3 text-sm" />
    <input name="lessonTitle" required placeholder="First lesson title" className="rounded-lg border p-3 text-sm" />
    <textarea name="lessonContent" required rows={6} placeholder="Lesson content" className="rounded-lg border p-3 text-sm" />
    <button disabled={pending} className="rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50">{pending ? 'Submitting...' : 'Submit course for review'}</button>
    {message && <p className="text-sm text-slate-600">{message}</p>}
  </form>;
}
