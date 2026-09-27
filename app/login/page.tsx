'use client';

import { useState, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { BookOpen, ShieldCheck, ArrowRight } from 'lucide-react';
import Link from 'next/link';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const result = await signIn('credentials', {
        redirect: false,
        email: formData.email,
        password: formData.password,
      });

      if (result?.error) {
        setError('ভুল ইমেইল বা পাসওয়ার্ড প্রদান করা হয়েছে');
      } else {
        const destination = callbackUrl.startsWith('/') && !callbackUrl.startsWith('/login')
          ? callbackUrl
          : '/dashboard';
        router.push(destination);
        router.refresh();
      }
    } catch (err: any) {
      setError(err?.message || 'একটি অপ্রত্যাশিত সমস্যা হয়েছে');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoFill = (email: string, pass: string) => {
    setFormData({ email, password: pass });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md p-8 shadow-xl border-t-4 border-t-primary-600 bg-white">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 font-bold text-primary-900 text-2xl mb-2">
            <div className="h-8 w-8 rounded-lg bg-primary-600 flex items-center justify-center">
              <span className="text-white text-sm font-bold">eS</span>
            </div>
            e-Shikho
          </Link>
          <p className="text-sm text-slate-500 mt-1">
            আপনার একাউন্টে সাইন ইন করুন
          </p>
          {callbackUrl && callbackUrl.startsWith('/payment') && (
            <div className="mt-3 p-2.5 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-amber-600 shrink-0" />
              <span>কোর্সটি ক্রয় সম্পন্ন করতে অনুগ্রহ করে আগে লগইন করুন</span>
            </div>
          )}
        </div>

        {error && (
          <div className="mb-4 p-3 text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-md">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              ইমেইল এড্রেস
            </label>
            <Input
              name="email"
              type="email"
              required
              value={formData.email}
              onChange={handleChange}
              placeholder="user@eshikho.com"
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              পাসওয়ার্ড
            </label>
            <Input
              name="password"
              type="password"
              required
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              className="w-full"
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-2.5 transition-all shadow-sm"
            disabled={isLoading}
          >
            {isLoading ? 'সাইন ইন হচ্ছে...' : 'সাইন ইন করুন'}
          </Button>
        </form>

        <div className="mt-6 pt-6 border-t border-slate-100 text-xs text-slate-500 space-y-2">
          <p className="font-semibold text-slate-700 text-center">দ্রুত টেস্ট করার জন্য ডেমো একাউন্ট:</p>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleDemoFill('student@eshikho.com', 'student123')}
              className="px-2 py-1.5 bg-slate-50 hover:bg-primary-50 hover:text-primary-700 rounded border border-slate-200 text-center transition"
            >
              <div className="font-medium">Student</div>
              <div className="text-[10px] text-slate-400">student123</div>
            </button>
            <button
              type="button"
              onClick={() => handleDemoFill('instructor@eshikho.com', 'instructor123')}
              className="px-2 py-1.5 bg-slate-50 hover:bg-primary-50 hover:text-primary-700 rounded border border-slate-200 text-center transition"
            >
              <div className="font-medium">Instructor</div>
              <div className="text-[10px] text-slate-400">instructor123</div>
            </button>
            <button
              type="button"
              onClick={() => handleDemoFill('admin@eshikho.com', 'admin123456')}
              className="px-2 py-1.5 bg-slate-50 hover:bg-primary-50 hover:text-primary-700 rounded border border-slate-200 text-center transition"
            >
              <div className="font-medium">Admin</div>
              <div className="text-[10px] text-slate-400">admin123456</div>
            </button>
          </div>
        </div>

        <div className="mt-6 text-center text-xs text-slate-500">
          <Link href="/courses" className="text-primary-600 hover:underline inline-flex items-center gap-1">
            <BookOpen className="h-3.5 w-3.5" />
            <span>লগইন না করে কোর্সগুলো দেখতে চান?</span>
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
