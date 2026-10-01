'use client';

import { useState } from 'react';
import { updateUserStatus } from '@/actions/admin';
import { CheckCircle2, XCircle, Clock, User2, Mail, Loader2 } from 'lucide-react';

interface PendingUser {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: Date;
}

export default function PendingApprovals({ pendingUsers }: { pendingUsers: PendingUser[] }) {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [resolved, setResolved] = useState<Set<string>>(new Set());

  const handleAction = async (userId: string, status: 'APPROVED' | 'REJECTED') => {
    setLoadingId(userId);
    await updateUserStatus(userId, status);
    setResolved((prev) => new Set([...prev, userId]));
    setLoadingId(null);
  };

  const visible = pendingUsers.filter((u) => !resolved.has(u.id));

  if (visible.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <div className="h-12 w-12 rounded-full bg-emerald-50 flex items-center justify-center mb-3">
          <CheckCircle2 className="h-6 w-6 text-emerald-500" />
        </div>
        <p className="text-sm font-semibold text-gray-700">All clear!</p>
        <p className="text-xs text-gray-400 mt-1">No pending registration requests at the moment.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {visible.map((user) => (
        <div
          key={user.id}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-gray-100 bg-gray-50/60 px-5 py-4 hover:bg-gray-50 transition-colors"
        >
          {/* User info */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 font-bold text-sm uppercase">
              {user.name?.charAt(0) ?? '?'}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{user.name}</p>
              <p className="text-xs text-gray-400 truncate flex items-center gap-1">
                <Mail className="h-3 w-3" /> {user.email}
              </p>
            </div>
          </div>

          {/* Role + Date */}
          <div className="flex items-center gap-3 shrink-0">
            <span className="rounded-full bg-amber-100 border border-amber-200 px-2.5 py-1 text-xs font-semibold text-amber-800">
              {user.role}
            </span>
            <span className="text-xs text-gray-400 hidden sm:block">
              {new Date(user.createdAt).toLocaleDateString()}
            </span>
          </div>

          {/* Actions */}
          <div className="flex gap-2 shrink-0">
            <button
              disabled={loadingId === user.id}
              onClick={() => handleAction(user.id, 'APPROVED')}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
            >
              {loadingId === user.id ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="h-3.5 w-3.5" />
              )}
              Approve
            </button>
            <button
              disabled={loadingId === user.id}
              onClick={() => handleAction(user.id, 'REJECTED')}
              className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-50 transition-colors"
            >
              <XCircle className="h-3.5 w-3.5" />
              Reject
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
