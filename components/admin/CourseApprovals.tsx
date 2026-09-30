'use client';

import { useState } from 'react';
import { approveCourse, rejectCourse } from '@/actions/admin';

interface Course {
  id: string;
  title: string;
  category: string;
  createdAt: Date;
  instructor?: {
    name: string;
    role?: string;
  } | null;
}

export default function CourseApprovals({ pendingCourses }: { pendingCourses: Course[] }) {
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleApprove = async (courseId: string) => {
    setLoadingId(courseId);
    await approveCourse(courseId);
    setLoadingId(null);
  };

  const handleRejectSubmit = async () => {
    if (!selectedCourseId || !reason.trim()) return;
    setLoadingId(selectedCourseId);
    await rejectCourse(selectedCourseId, reason);
    setSelectedCourseId(null);
    setReason('');
    setLoadingId(null);
  };

  if (pendingCourses.length === 0) {
    return (
      <p className="text-sm text-gray-500 py-4">
        No courses are currently pending review.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-gray-600">
          <thead className="bg-gray-50 text-xs uppercase text-gray-700">
            <tr>
              <th className="px-4 py-3">Course Title</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Instructor</th>
              <th className="px-4 py-3">Submitted Date</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {pendingCourses.map((course) => (
              <tr key={course.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{course.title}</td>
                <td className="px-4 py-3">{course.category}</td>
                <td className="px-4 py-3">{course.instructor?.name || 'N/A'}</td>
                <td className="px-4 py-3">{new Date(course.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-3 text-right space-x-2">
                  <button
                    disabled={loadingId === course.id}
                    onClick={() => handleApprove(course.id)}
                    className="rounded bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 transition"
                  >
                    {loadingId === course.id ? 'Approving...' : 'Approve'}
                  </button>
                  <button
                    disabled={loadingId === course.id}
                    onClick={() => setSelectedCourseId(course.id)}
                    className="rounded bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-50 transition"
                  >
                    Reject
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedCourseId && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-2xl border border-gray-100">
            <h4 className="text-lg font-bold text-gray-900 mb-2">Rejection Feedback</h4>
            <p className="text-xs text-gray-500 mb-4">
              Please provide feedback explaining why this course was rejected so the instructor can make necessary edits.
            </p>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Missing complete course syllabus or invalid thumbnail aspect ratio..."
              className="w-full border border-gray-300 rounded-md p-3 text-sm text-gray-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              rows={4}
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedCourseId(null);
                  setReason('');
                }}
                className="px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRejectSubmit}
                disabled={!reason.trim() || loadingId === selectedCourseId}
                className="px-4 py-2 text-xs font-semibold bg-rose-600 text-white rounded hover:bg-rose-700 disabled:opacity-50 transition"
              >
                {loadingId === selectedCourseId ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
