'use client';

import { useState } from 'react';
import { reviewInstructorRequest } from '@/actions/admin';
import { CheckCircle2, XCircle, GraduationCap, Loader2, Mail, MessageSquare } from 'lucide-react';

const STATUS_LABELS: Record<string, { label: string; class: string }> = {
  PENDING: { label: 'Pending', class: 'bg-amber-100 text-amber-800 border-amber-200' },
  ADMIN_APPROVED: { label: 'Admin Approved', class: 'bg-blue-100 text-blue-800 border-blue-200' },
  SUPERADMIN_APPROVED: { label: 'SuperAdmin Approved', class: 'bg-violet-100 text-violet-800 border-violet-200' },
  APPROVED: { label: 'Approved', class: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  REJECTED: { label: 'Rejected', class: 'bg-rose-100 text-rose-800 border-rose-200' },
};

export default function InstructorRequests({
  requests,
}: {
  requests: {
    id: string;
    user: { name: string; email: string };
    reason: string;
    status: string;
  }[];
}) {
  const [busy, setBusy] = useState<string | null>(null);
  const [resolved, setResolved] = useState<Set<string>>(new Set());

  const handleAction = async (id: string, action: 'APPROVE' | 'REJECT') => {
    setBusy(id);
    await reviewInstructorRequest(id, action);
    setResolved((prev) => new Set([...prev, id]));
    setBusy(null);
  };

  const visible = requests.filter((r) => !resolved.has(r.id));

  if (!visible.length) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <div className="h-12 w-12 rounded-full bg-violet-50 flex items-center justify-center mb-3">
          <GraduationCap className="h-6 w-6 text-violet-400" />
        </div>
        <p className="text-sm font-semibold text-gray-700">No pending requests</p>
        <p className="text-xs text-gray-400 mt-1">No instructor promotion requests at this time.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {visible.map((request) => {
        const statusStyle = STATUS_LABELS[request.status] ?? { label: request.status, class: 'bg-gray-100 text-gray-600 border-gray-200' };
        return (
          <div key={request.id} className="rounded-xl border border-gray-100 bg-gray-50/60 p-5 hover:bg-gray-50 transition-colors">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="flex items-start gap-3 min-w-0">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-700 font-bold text-sm uppercase mt-0.5">
                  {request.user.name?.charAt(0) ?? '?'}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-gray-900">{request.user.name}</p>
                  <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                    <Mail className="h-3 w-3" /> {request.user.email}
                  </p>
                  {request.reason && (
                    <p className="mt-2 flex items-start gap-1.5 text-sm text-gray-600 bg-white border border-gray-100 rounded-lg px-3 py-2">
                      <MessageSquare className="h-3.5 w-3.5 shrink-0 mt-0.5 text-gray-400" />
                      <span className="leading-relaxed">{request.reason}</span>
                    </p>
                  )}
                </div>
              </div>
              <span className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold ${statusStyle.class}`}>
                {statusStyle.label}
              </span>
            </div>

            <div className="mt-4 flex gap-2">
              <button
                disabled={busy === request.id}
                onClick={() => handleAction(request.id, 'APPROVE')}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
              >
                {busy === request.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                Approve Role
              </button>
              <button
                disabled={busy === request.id}
                onClick={() => handleAction(request.id, 'REJECT')}
                className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-50 transition-colors"
              >
                <XCircle className="h-3.5 w-3.5" />
                Reject
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
