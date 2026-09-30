'use client';
import { useState } from 'react';
import { reviewInstructorRequest } from '../actions';

export default function InstructorRequests({ requests }: { requests: { id: string; user: { name: string; email: string }; reason: string; status: string }[] }) {
  const [busy, setBusy] = useState<string | null>(null);
  if (!requests.length) return <p className="text-sm text-gray-500">No instructor requests.</p>;
  return <div className="space-y-3">{requests.map(request => <div key={request.id} className="rounded-lg border p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="font-semibold text-gray-900">{request.user.name} <span className="font-normal text-gray-500">({request.user.email})</span></p><p className="mt-1 text-sm text-gray-600">{request.reason}</p></div><span className="rounded bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-800">{request.status}</span></div><div className="mt-3 flex gap-2"><button disabled={busy === request.id} onClick={async () => { setBusy(request.id); await reviewInstructorRequest(request.id, 'APPROVE'); setBusy(null); }} className="rounded bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white">Approve my role</button><button disabled={busy === request.id} onClick={async () => { setBusy(request.id); await reviewInstructorRequest(request.id, 'REJECT'); setBusy(null); }} className="rounded bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white">Reject</button></div></div>)}</div>;
}
