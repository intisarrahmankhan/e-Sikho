'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { requestGlobalAssessmentPermissionAction, reviewGlobalAssessmentApplicationAction } from '@/actions/assessment-management';
import { AssessmentKind } from '@/lib/assessment-policy';

type Application = { id: string; kind: string; reason: string; status: string; reviewNotes: string; instructorName: string; instructorEmail: string; createdAt: string };
export default function GlobalAssessmentApplications({ applications, reviewer = false }: { applications: Application[]; reviewer?: boolean }) {
  const router = useRouter(); const [kind, setKind] = useState<AssessmentKind>('EXAM');
  const [reason, setReason] = useState(''); const [notes, setNotes] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false); const [message, setMessage] = useState('');
  async function review(id: string, decision: 'APPROVED' | 'REJECTED') {
    setPending(true); setMessage('');
    try { const result = await reviewGlobalAssessmentApplicationAction(id, decision, notes[id] || ''); setMessage(result.error || 'Application reviewed.'); if (!result.error) router.refresh(); }
    catch { setMessage('The review could not be saved.'); } finally { setPending(false); }
  }
  return <div className="mx-auto max-w-4xl space-y-6 pb-12">
    <h1 className="text-2xl font-bold">{reviewer ? 'Global assessment approvals' : 'Assessment hosting access'}</h1>
    <p className="text-sm text-slate-600">{reviewer ? 'Approve global exam and contest hosting separately for each instructor. Only the superadmin can make this decision.' : 'Course assessments are available for courses you teach. Apply for permission to host global exams or contests, then choose the eligible education levels, departments, or students when publishing.'}</p>
    {!reviewer && <>
      <div className="flex flex-wrap gap-3"><Link href="/exams/create" className="rounded-lg border bg-white px-4 py-2 text-sm">Create an exam</Link><Link href="/contests/create" className="rounded-lg border bg-white px-4 py-2 text-sm">Create a contest</Link></div>
      <form className="space-y-3 rounded-xl border bg-white p-5" onSubmit={async (event) => {
        event.preventDefault(); setPending(true); setMessage('');
        try { const result = await requestGlobalAssessmentPermissionAction(kind, reason); setMessage(result.error || 'Application submitted to the superadmin.'); if (!result.error) { setReason(''); router.refresh(); } }
        catch { setMessage('The application could not be submitted.'); } finally { setPending(false); }
      }}>
        <label className="block text-sm font-semibold">Request access for<select value={kind} onChange={(event) => setKind(event.target.value as AssessmentKind)} className="mt-1 w-full rounded-lg border p-2"><option value="EXAM">Global exams</option><option value="CONTEST">Global contests</option></select></label>
        <label className="block text-sm font-semibold">Teaching purpose and intended audience<textarea required minLength={20} maxLength={2000} value={reason} onChange={(event) => setReason(event.target.value)} rows={4} className="mt-1 w-full rounded-lg border p-2" /></label>
        <button disabled={pending || applications.some((application) => application.kind === kind && ['PENDING', 'APPROVED'].includes(application.status))} className="rounded-lg bg-primary-600 px-4 py-2 text-sm text-white disabled:opacity-50">{pending ? 'Saving…' : 'Submit application'}</button>
      </form>
    </>}
    {message && <p role="status" className="rounded-lg border bg-slate-50 p-3 text-sm">{message}</p>}
    {!applications.length && <p className="rounded-xl border border-dashed p-8 text-center text-slate-500">No applications yet.</p>}
    {applications.map((application) => <article key={application.id} className="space-y-3 rounded-xl border bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="font-semibold">Global {application.kind.toLowerCase()} hosting</h2><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold">{application.status}</span></div>
      {reviewer && <p className="text-sm">{application.instructorName} · {application.instructorEmail}</p>}
      <p className="whitespace-pre-wrap text-sm text-slate-600">{application.reason}</p>
      {application.reviewNotes && <p className="rounded-lg bg-slate-50 p-3 text-sm">Review: {application.reviewNotes}</p>}
      {reviewer && application.status === 'PENDING' && <div className="space-y-3"><label className="block text-sm">Review notes<textarea value={notes[application.id] || ''} onChange={(event) => setNotes((previous) => ({ ...previous, [application.id]: event.target.value }))} maxLength={2000} className="mt-1 w-full rounded-lg border p-2" /></label><button disabled={pending} onClick={() => review(application.id, 'APPROVED')} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm text-white">Approve</button><button disabled={pending} onClick={() => review(application.id, 'REJECTED')} className="ml-3 rounded-lg border border-rose-200 px-4 py-2 text-sm text-rose-700">Reject with feedback</button></div>}
    </article>)}
  </div>;
}
