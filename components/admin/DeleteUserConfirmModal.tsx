'use client';

import React from 'react';
import { AlertTriangle, Trash2, X, Loader2 } from 'lucide-react';

interface DeleteUserConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  } | null;
  isLoading: boolean;
}

export default function DeleteUserConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  user,
  isLoading,
}: DeleteUserConfirmModalProps) {
  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-rose-100 bg-rose-50/80 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-600 text-white shadow-md shadow-rose-200">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">Remove User Account</h3>
              <p className="text-xs text-rose-600 font-medium">Permanent deletion warning</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-white hover:text-gray-700 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-600 leading-relaxed">
            Are you sure you want to permanently remove <strong className="text-gray-900">{user.name}</strong> (
            <span className="font-semibold text-indigo-600">{user.role}</span>) from the platform?
          </p>

          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 space-y-1">
            <p className="font-bold">⚠️ Warning:</p>
            <ul className="list-disc list-inside space-y-0.5 text-[11px] text-rose-700">
              <li>User account ({user.email}) will be deleted from database.</li>
              <li>All associated course enrollments and records will be deleted.</li>
              {user.role === 'INSTRUCTOR' && (
                <li>Instructor profile and instructor applications will be removed.</li>
              )}
              <li>This action is irreversible.</li>
            </ul>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-md shadow-rose-200 transition disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Removing...
                </>
              ) : (
                <>
                  <Trash2 className="h-3.5 w-3.5" />
                  Confirm & Delete
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
