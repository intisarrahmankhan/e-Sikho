'use client';

import { Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { BookOpen, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';

function LoginForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/student';

  const handleGoogleSignIn = () => {
    signIn('google', { callbackUrl });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-primary-50 to-indigo-50 p-4">
      <Card className="w-full max-w-md p-10 shadow-2xl border-0 bg-white rounded-3xl">
        {/* Logo */}
        <div className="text-center mb-10">
          <Link href="/" className="inline-flex items-center gap-3 font-black text-primary-900 text-3xl mb-3">
            <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-primary-600 to-indigo-600 flex items-center justify-center shadow-lg">
              <span className="text-white text-base font-black">eS</span>
            </div>
            e-Shikho
          </Link>
          <p className="text-sm text-slate-500 mt-1">
            আপনার Google একাউন্ট দিয়ে সাইন ইন করুন
          </p>

          {callbackUrl && callbackUrl.startsWith('/payment') && (
            <div className="mt-3 p-3 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-amber-600 shrink-0" />
              <span>কোর্সটি কিনতে আগে লগইন করুন</span>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4 mb-8">
          <div className="flex-1 h-px bg-slate-100" />
          <span className="text-xs text-slate-400 font-medium">সাইন ইন করুন</span>
          <div className="flex-1 h-px bg-slate-100" />
        </div>

        {/* Google Button */}
        <button
          onClick={handleGoogleSignIn}
          className="w-full flex items-center justify-center gap-3 px-6 py-3.5 bg-white border-2 border-slate-200 hover:border-primary-300 hover:bg-primary-50 rounded-2xl transition-all duration-200 shadow-sm hover:shadow-md group font-semibold text-slate-700"
        >
          {/* Google SVG icon */}
          <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          <span className="group-hover:text-primary-700 transition-colors">Google দিয়ে সাইন ইন করুন</span>
        </button>

        {/* Info */}
        <p className="mt-6 text-center text-xs text-slate-400 leading-relaxed">
          সাইন ইন করার মাধ্যমে আপনি আমাদের{' '}
          <Link href="/terms" className="text-primary-600 hover:underline">Terms of Service</Link>
          {' ও '}
          <Link href="/privacy" className="text-primary-600 hover:underline">Privacy Policy</Link>
          -তে সম্মত হচ্ছেন।
        </p>

        <div className="mt-6 text-center">
          <Link href="/courses" className="text-primary-600 hover:underline text-xs inline-flex items-center gap-1">
            <BookOpen className="h-3.5 w-3.5" />
            <span>লগইন না করে কোর্সগুলো দেখুন</span>
          </Link>
        </div>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
