'use client';

import { useState, useRef } from 'react';
import { requestInstructorRole } from '@/actions/student';
import { Loader2 } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

export default function InstructorRequestForm({ status }: { status?: string }) {
  const { language } = useLanguage();
  const [message, setMessage] = useState('');
  const [pending, setPending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  if (status === 'APPROVED') {
    return (
      <p className="text-sm text-emerald-700">
        {language === 'en'
          ? 'Your instructor request was approved. You can now create courses.'
          : 'আপনার ইন্সট্রাক্টর আবেদন অনুমোদিত হয়েছে। আপনি এখন কোর্স তৈরি করতে পারবেন।'}
      </p>
    );
  }

  if (status === 'PENDING' || status === 'ADMIN_APPROVED' || status === 'SUPERADMIN_APPROVED' || isSuccess) {
    return (
      <p className="text-sm text-amber-700 font-medium">
        {language === 'en'
          ? 'Your request is under review. Admin and Superadmin approval is required.'
          : 'আপনার আবেদনটি পর্যালোচনায় রয়েছে। অ্যাডমিন ও সুপারঅ্যাডমিন অনুমোদন প্রয়োজন।'}
      </p>
    );
  }

  async function submit(formData: FormData) {
    setPending(true);
    setMessage('');

    formRef.current?.reset();
    const result = await requestInstructorRole(formData);

    if (result.error) {
      setMessage(result.error);
      setPending(false);
    } else {
      setIsSuccess(true);
    }
  }

  return (
    <form ref={formRef} action={submit} className="relative space-y-3">
      {pending && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70 backdrop-blur-[2px] rounded-lg">
          <div className="flex flex-col items-center gap-2 text-indigo-600">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm font-medium">
              {language === 'en' ? 'Sending request...' : 'আবেদন পাঠানো হচ্ছে...'}
            </span>
          </div>
        </div>
      )}
      <textarea
        name="reason"
        required
        minLength={20}
        rows={4}
        placeholder={
          language === 'en'
            ? 'Tell us about your teaching experience and the subjects you want to teach...'
            : 'আপনার শিক্ষকতার অভিজ্ঞতা এবং যে বিষয়গুলো আপনি শেখাতে চান তা লিখুন...'
        }
        className="w-full rounded-lg border border-slate-300 p-3 text-sm outline-none focus:border-indigo-500 disabled:bg-slate-50 disabled:text-slate-400"
        disabled={pending}
      />
      <button
        disabled={pending}
        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors disabled:opacity-50"
      >
        {language === 'en' ? 'Request Instructor Access' : 'ইন্সট্রাক্টর অ্যাক্সেসের আবেদন করুন'}
      </button>
      {message && <p className="text-sm text-rose-600">{message}</p>}
    </form>
  );
}
