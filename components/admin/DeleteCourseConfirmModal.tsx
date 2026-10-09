'use client';

import React from 'react';
import { AlertTriangle, Trash2, X, Loader2 } from 'lucide-react';

interface DeleteCourseConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  course: {
    id: string;
    title: string;
    instructorName?: string;
  } | null;
  isLoading?: boolean;
}

export default function DeleteCourseConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  course,
  isLoading = false,
}: DeleteCourseConfirmModalProps) {
  if (!isOpen || !course) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-gray-100 overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isLoading}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Warning Icon & Header */}
        <div className="flex items-start gap-4 mb-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 shadow-sm border border-rose-200">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Delete Course</h3>
            <p className="text-xs text-gray-500 mt-0.5">This action is permanent and cannot be undone.</p>
          </div>
        </div>

        {/* Details Card */}
        <div className="rounded-xl bg-slate-50 border border-slate-100 p-4 mb-5 space-y-2">
          <div className="text-xs text-gray-500">Course to be permanently deleted:</div>
          <div className="text-sm font-bold text-gray-900">{course.title}</div>
          {course.instructorName && (
            <div className="text-xs text-slate-600 font-medium">Instructor: {course.instructorName}</div>
          )}
        </div>

        <p className="text-xs text-gray-600 leading-relaxed mb-6">
          Removing this course will also delete all its modules, lessons, and associated student enrollment access.
        </p>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            disabled={isLoading}
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-xl text-gray-600 hover:bg-gray-100 transition"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isLoading}
            onClick={onConfirm}
            className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold rounded-xl bg-rose-600 text-white hover:bg-rose-700 transition shadow-sm disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="h-3.5 w-3.5" />
                Delete Course
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
