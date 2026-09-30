'use client';

import { useState } from 'react';
import { requestInstructorRole } from '@/app/student-actions';

export default function InstructorRequestForm({ status }: { status?: string }) {
  const [message, setMessage] = useState('');
  const [pending, setPending] = useState(false);

  if (status === 'APPROVED') return <p className="text-sm text-emerald-700">Your instructor request was approved. You can now create courses.</p>;
  if (status === 'PENDING' || status === 'ADMIN_APPROVED' || status === 'SUPERADMIN_APPROVED') {
    return <p className="text-sm text-amber-700">Your request is under review. Admin and Superadmin approval is required.</p>;
  }

  async function submit(formData: FormData) {
    setPending(true);
    setMessage('');
    const result = await requestInstructorRole(formData);
    setMessage(result.error || 'Request sent successfully.');
    setPending(false);
  }

  return (
    <form action={submit} className="space-y-3">
      <textarea name="reason" required minLength={20} rows={4} placeholder="Tell us about your teaching experience and the subjects you want to teach..." className="w-full rounded-lg border border-slate-300 p-3 text-sm outline-none focus:border-indigo-500" />
      <button disabled={pending} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50">
        {pending ? 'Sending...' : 'Request instructor access'}
      </button>
      {message && <p className="text-sm text-slate-600">{message}</p>}
    </form>
  );
}
