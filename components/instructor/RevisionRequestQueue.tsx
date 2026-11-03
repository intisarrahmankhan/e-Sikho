'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { reviewRevisionRequestAction } from '@/actions/revision-access';

type Request = { id: string; courseTitle: string; studentName: string; status: string; reason: string; examDate: string; reviewNotes: string; expiresAt: string };

export default function RevisionRequestQueue({ requests, error }: { requests: Request[]; error?: string }) {
  const router = useRouter();
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState('');
  async function review(id: string, decision: 'APPROVED' | 'REJECTED') {
    setPending(true); setMessage('');
    try {
      const result = await reviewRevisionRequestAction(id, decision, notes[id] || '');
      setMessage(result.error || 'Revision request reviewed.');
      if (result.success) router.refresh();
    } catch { setMessage('Could not save this review. Try again.'); }
    finally { setPending(false); }
  }
  return <div className="mx-auto max-w-4xl space-y-5 pb-12">
    <h1 className="text-2xl font-bold">Course revision requests</h1>
    <p className="text-sm text-slate-600">Review requests for expired enrollments. Approval grants the course’s configured revision period. Assessment co-teaching access does not grant permission to review another instructor’s course.</p>
    {(error || message) && <p role="status" className="rounded-lg border p-3 text-sm">{error || message}</p>}
    {!requests.length && <p className="rounded-xl border border-dashed p-8 text-center text-slate-500">No revision requests yet.</p>}
    {requests.map(request => <article key={request.id} className="space-y-3 rounded-xl border bg-white p-5">
      <div className="flex flex-wrap justify-between gap-2"><h2 className="font-semibold">{request.courseTitle} · {request.studentName}</h2><span className="text-sm font-semibold">{request.status}</span></div>
      <p className="text-sm">Exam date: {request.examDate || 'Not provided'}</p>
      <p className="whitespace-pre-wrap text-sm text-slate-600">{request.reason}</p>
      {request.reviewNotes && <p className="text-sm">Review: {request.reviewNotes}</p>}
      {request.expiresAt && request.status === 'APPROVED' && <p className="text-sm">Revision expires: {new Date(request.expiresAt).toLocaleString()}</p>}
      {request.status === 'PENDING' && <div className="space-y-3">
        <label className="block text-sm">Review notes<textarea maxLength={2000} value={notes[request.id] || ''} onChange={event => setNotes(previous => ({ ...previous, [request.id]: event.target.value }))} className="mt-1 w-full rounded-lg border p-2" /></label>
        <button disabled={pending} onClick={() => review(request.id, 'APPROVED')} className="rounded-lg bg-emerald-700 px-4 py-2 text-sm text-white disabled:opacity-50">Approve revision</button>
        <button disabled={pending} onClick={() => review(request.id, 'REJECTED')} className="ml-3 rounded-lg border border-rose-300 px-4 py-2 text-sm disabled:opacity-50">Reject with feedback</button>
      </div>}
    </article>)}
  </div>;
}
