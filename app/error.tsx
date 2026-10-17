'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { AlertCircle, RotateCcw, Home, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('App Router Caught Error:', error);
  }, [error]);

  return (
    <div className="min-h-[70vh] w-full flex items-center justify-center p-6 animate-in fade-in duration-200">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200 shadow-xl text-center space-y-6">
        <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
          <AlertCircle className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-bold text-slate-800">
            পৃষ্ঠাটি লোড হতে সমস্যা হয়েছে
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Something went wrong while loading this page.
          </p>
          {error?.message && (
            <div className="mt-3 p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-mono text-slate-600 text-left overflow-x-auto max-h-24">
              {error.message}
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Button
            onClick={() => reset()}
            className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-700 hover:to-indigo-700 text-white font-bold text-sm shadow-md transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            <span>পুনরায় চেষ্টা করুন</span>
          </Button>

          <Link
            href="/login"
            className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-sm transition-all shadow-sm"
          >
            <LogIn className="w-4 h-4" />
            <span>লগইন পৃষ্ঠা</span>
          </Link>
        </div>

        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-primary-600 transition-colors font-medium"
          >
            <Home className="w-3.5 h-3.5" />
            <span>মূল পাতায় ফিরে যান (Go to Home)</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
