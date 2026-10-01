'use client';

import { useState } from 'react';
import { reviewCourse } from '@/actions/admin';
import { CheckCircle2, XCircle, BookOpen, Loader2, User2, DollarSign } from 'lucide-react';

export default function CourseReviews({
  courses,
}: {
  courses: {
    id: string;
    title: string;
    description: string;
    price: number;
    instructor: { name: string };
  }[];
}) {
  const [busy, setBusy] = useState<string | null>(null);
  const [resolved, setResolved] = useState<Set<string>>(new Set());

  const handleAction = async (id: string, action: 'APPROVE' | 'REJECT') => {
    setBusy(id);
    await reviewCourse(id, action);
    setResolved((prev) => new Set([...prev, id]));
    setBusy(null);
  };

  const visible = courses.filter((c) => !resolved.has(c.id));

  if (!visible.length) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <div className="h-12 w-12 rounded-full bg-sky-50 flex items-center justify-center mb-3">
          <BookOpen className="h-6 w-6 text-sky-400" />
        </div>
        <p className="text-sm font-semibold text-gray-700">No submissions waiting</p>
        <p className="text-xs text-gray-400 mt-1">All course submissions have been reviewed.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {visible.map((course) => (
        <div key={course.id} className="rounded-xl border border-gray-100 bg-gray-50/60 p-5 hover:bg-gray-50 transition-colors">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-gray-900 truncate">{course.title}</h3>
              <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-gray-400">
                <span className="flex items-center gap-1">
                  <User2 className="h-3 w-3" /> {course.instructor?.name || 'N/A'}
                </span>
                <span className="flex items-center gap-1">
                  <DollarSign className="h-3 w-3" />
                  {course.price === 0 ? (
                    <span className="text-emerald-600 font-semibold">Free</span>
                  ) : (
                    <span className="font-semibold">৳{course.price}</span>
                  )}
                </span>
              </div>
              {course.description && (
                <p className="mt-2 text-xs text-gray-500 line-clamp-2 leading-relaxed">{course.description}</p>
              )}
            </div>

            <div className="flex gap-2 shrink-0">
              <button
                disabled={busy === course.id}
                onClick={() => handleAction(course.id, 'APPROVE')}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
              >
                {busy === course.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                Approve
              </button>
              <button
                disabled={busy === course.id}
                onClick={() => handleAction(course.id, 'REJECT')}
                className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-50 transition-colors"
              >
                <XCircle className="h-3.5 w-3.5" />
                Reject
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
