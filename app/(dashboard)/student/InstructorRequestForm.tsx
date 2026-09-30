'use client';

import { useState, useRef } from 'react';
import { requestInstructorRole } from '@/app/student-actions';
import { Loader2 } from 'lucide-react';

export default function InstructorRequestForm({ status }: { status?: string }) {
  const [message, setMessage] = useState('');
  const [pending, setPending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  if (status === 'APPROVED') return <p className="text-sm text-emerald-700">Your instructor request was approved. You can now create courses.</p>;
  if (status === 'PENDING' || status === 'ADMIN_APPROVED' || status === 'SUPERADMIN_APPROVED' || isSuccess) {
    return <p className="text-sm text-amber-700 font-medium">Your request is under review. Admin and Superadmin approval is required.</p>;
  }

  async function submit(formData: FormData) {
    setPending(true);
    setMessage('');
    
    // Clear previous text
    formRef.current?.reset();
    
    const result = await requestInstructorRole(formData);
    
    if (result.error) {
      setMessage(result.error);
      setPending(false);
    } else {
      setIsSuccess(true);
      // We don't need to setPending(false) here because the component will render the success message instead of the form.
    }
  }

  return (
    <form ref={formRef} action={submit} className="relative space-y-3">
      {pending && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70 backdrop-blur-[2px] rounded-lg">
          <div className="flex flex-col items-center gap-2 text-indigo-600">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm font-medium">Sending request...</span>
          </div>
        </div>
      )}
      <textarea 
        name="reason" 
        required 
        minLength={20} 
        rows={4} 
        placeholder="Tell us about your teaching experience and the subjects you want to teach..." 
        className="w-full rounded-lg border border-slate-300 p-3 text-sm outline-none focus:border-indigo-500 disabled:bg-slate-50 disabled:text-slate-400" 
        disabled={pending}
      />
      <button 
        disabled={pending} 
        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors disabled:opacity-50"
      >
        Request instructor access
      </button>
      {message && <p className="text-sm text-rose-600">{message}</p>}
    </form>
  );
}
