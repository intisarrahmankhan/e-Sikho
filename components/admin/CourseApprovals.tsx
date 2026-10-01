'use client';

import { useState } from 'react';
import { approveCourse, rejectCourse } from '@/actions/admin';
import { CheckCircle2, XCircle, BookOpen, Loader2, User2, Tag, Calendar, AlertCircle } from 'lucide-react';

interface Course {
  id: string;
  title: string;
  category: string;
  createdAt: Date;
  instructor?: { name: string; role?: string } | null;
}

export default function CourseApprovals({ pendingCourses }: { pendingCourses: Course[] }) {
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [resolved, setResolved] = useState<Set<string>>(new Set());

  const handleApprove = async (courseId: string) => {
    setLoadingId(courseId);
    await approveCourse(courseId);
    setResolved((prev) => new Set([...prev, courseId]));
    setLoadingId(null);
  };

  const handleRejectSubmit = async () => {
    if (!selectedCourseId || !reason.trim()) return;
    setLoadingId(selectedCourseId);
    await rejectCourse(selectedCourseId, reason);
    setResolved((prev) => new Set([...prev, selectedCourseId]));
    setSelectedCourseId(null);
    setReason('');
    setLoadingId(null);
  };

  const visible = pendingCourses.filter((c) => !resolved.has(c.id));

  if (visible.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <div className="h-12 w-12 rounded-full bg-emerald-50 flex items-center justify-center mb-3">
          <CheckCircle2 className="h-6 w-6 text-emerald-500" />
        </div>
        <p className="text-sm font-semibold text-gray-700">Queue is empty</p>
        <p className="text-xs text-gray-400 mt-1">No courses are currently pending final approval.</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {visible.map((course) => (
          <div
            key={course.id}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-gray-100 bg-gray-50/60 px-5 py-4 hover:bg-gray-50 transition-colors"
          >
            {/* Info */}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-gray-900 truncate">{course.title}</p>
              <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-gray-400">
                <span className="flex items-center gap-1">
                  <User2 className="h-3 w-3" />
                  {course.instructor?.name || 'Unknown'}
                </span>
                <span className="flex items-center gap-1">
                  <Tag className="h-3 w-3" />
                  {course.category}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {new Date(course.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 shrink-0">
              <button
                disabled={loadingId === course.id}
                onClick={() => handleApprove(course.id)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
              >
                {loadingId === course.id ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                )}
                {loadingId === course.id ? 'Approving…' : 'Approve'}
              </button>
              <button
                disabled={loadingId === course.id}
                onClick={() => setSelectedCourseId(course.id)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-50 transition-colors"
              >
                <XCircle className="h-3.5 w-3.5" />
                Reject
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Rejection Modal */}
      {selectedCourseId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-gray-100 overflow-hidden">
            {/* Modal header */}
            <div className="flex items-center gap-3 border-b border-gray-100 bg-rose-50 px-6 py-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-100">
                <AlertCircle className="h-5 w-5 text-rose-600" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-900">Rejection Feedback</h4>
                <p className="text-xs text-gray-500">This feedback will be shown to the instructor.</p>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Missing complete course syllabus or invalid thumbnail aspect ratio..."
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-800 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 focus:outline-none transition"
                rows={4}
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => { setSelectedCourseId(null); setReason(''); }}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleRejectSubmit}
                  disabled={!reason.trim() || loadingId === selectedCourseId}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-50 transition"
                >
                  {loadingId === selectedCourseId ? (
                    <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Rejecting…</>
                  ) : (
                    <><XCircle className="h-3.5 w-3.5" /> Confirm Rejection</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
