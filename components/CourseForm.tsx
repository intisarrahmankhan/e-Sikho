'use client';

import { useState, useRef } from 'react';
import { createCourse } from '@/actions/instructor';
import { PlusCircle, Loader2 } from 'lucide-react';

interface CourseFormProps {
  onSuccess?: () => void;
}

export default function CourseForm({ onSuccess }: CourseFormProps) {
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [pending, setPending] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  async function submit(formData: FormData) {
    setPending(true);
    setMessage('');
    const result = await createCourse(formData);
    if (result.error) {
      setIsError(true);
      setMessage(result.error);
    } else {
      setIsError(false);
      setMessage('✓ Course submitted for admin review!');
      formRef.current?.reset();
      onSuccess?.();
    }
    setPending(false);
  }

  return (
    <form ref={formRef} action={submit} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Course Title *</label>
          <input
            name="title"
            required
            placeholder="e.g. Complete React Course"
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Short Tagline</label>
          <input
            name="tagline"
            placeholder="One-line course description"
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Description *</label>
          <textarea
            name="description"
            required
            rows={4}
            placeholder="Detailed course description..."
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Category *</label>
          <input
            name="category"
            required
            placeholder="e.g. Web Development"
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Level</label>
          <select
            name="level"
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          >
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Duration</label>
          <input
            name="duration"
            placeholder="e.g. 12 hours"
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Price (BDT) — 0 for free</label>
          <input
            name="price"
            type="number"
            min="0"
            defaultValue="0"
            required
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Course Thumbnail</label>
          <input
            name="thumbnail"
            type="file"
            accept="image/*"
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-3 file:py-1 file:text-xs file:font-semibold file:text-indigo-700"
          />
        </div>

        <div className="sm:col-span-2 border-t border-slate-100 pt-4">
          <p className="mb-3 text-sm font-semibold text-slate-700">First Module & Lesson</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <input
              name="moduleTitle"
              required
              placeholder="Module title"
              className="rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            />
            <input
              name="lessonTitle"
              required
              placeholder="First lesson title"
              className="rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            />
          </div>
          <textarea
            name="lessonContent"
            required
            rows={5}
            placeholder="Lesson content..."
            className="mt-3 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          />
        </div>
      </div>

      <button
        disabled={pending}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
      >
        {pending ? (
          <><Loader2 className="h-4 w-4 animate-spin" /> Submitting...</>
        ) : (
          <><PlusCircle className="h-4 w-4" /> Submit Course for Review</>
        )}
      </button>

      {message && (
        <p className={`rounded-xl p-3 text-sm font-medium ${isError ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
          {message}
        </p>
      )}
    </form>
  );
}
