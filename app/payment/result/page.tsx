'use client';

/**
 * /payment/result
 *
 * Final landing page reached after a payment attempt.  The gateway page
 * (/payment/[courseId]) redirects here once the 5-second auto-countdown
 * expires, passing two query params:
 *   • status   — "success" | "failed" | "pending" | "cancelled"
 *   • courseId — the enrolled course id
 *
 * The page shows a rich animated card (green/red/amber/slate) plus action
 * buttons so the user can head to their dashboard or browse more courses.
 */

import React, { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Ban,
  Home,
  BookOpen,
  LayoutDashboard,
  RotateCcw,
  ShieldCheck,
} from 'lucide-react';
import { COURSES_DATA } from '@/lib/courses-data';

// ─── Types ───────────────────────────────────────────────────────────────────

type ResultStatus = 'success' | 'failed' | 'pending' | 'cancelled';

/** Visual configuration keyed by payment result status. */
const STATUS_CONFIG: Record<
  ResultStatus,
  {
    icon: React.ReactNode;
    title: string;
    subtitle: string;
    ringColor: string;
    bgGradient: string;
    badgeClass: string;
    badgeText: string;
    accentBorder: string;
  }
> = {
  success: {
    icon: <CheckCircle2 className="h-20 w-20 text-emerald-500" />,
    title: 'পেমেন্ট সফল হয়েছে! 🎉',
    subtitle:
      'আপনার পেমেন্ট নিশ্চিত হয়েছে এবং কোর্সে ভর্তি সম্পন্ন হয়েছে। শুভকামনা!',
    ringColor: 'ring-emerald-400',
    bgGradient: 'from-emerald-50 via-white to-emerald-50',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    badgeText: '✔ Enrollment Confirmed',
    accentBorder: 'border-emerald-200',
  },
  failed: {
    icon: <XCircle className="h-20 w-20 text-rose-500" />,
    title: 'পেমেন্ট ব্যর্থ হয়েছে',
    subtitle:
      'আপনার কার্ড বা মোবাইল তথ্য যাচাই করা যায়নি। সঠিক তথ্য দিয়ে আবার চেষ্টা করুন।',
    ringColor: 'ring-rose-400',
    bgGradient: 'from-rose-50 via-white to-rose-50',
    badgeClass: 'bg-rose-100 text-rose-800 border-rose-300',
    badgeText: '✘ Payment Failed',
    accentBorder: 'border-rose-200',
  },
  pending: {
    icon: <Clock className="h-20 w-20 text-amber-500" />,
    title: 'পেমেন্ট প্রক্রিয়াধীন',
    subtitle:
      'আপনার পেমেন্ট যাচাই করা হচ্ছে। নিশ্চিত হলে ইমেইল ও SMS-এ জানানো হবে।',
    ringColor: 'ring-amber-400',
    bgGradient: 'from-amber-50 via-white to-amber-50',
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-300',
    badgeText: '⏳ Pending Verification',
    accentBorder: 'border-amber-200',
  },
  cancelled: {
    icon: <Ban className="h-20 w-20 text-slate-400" />,
    title: 'পেমেন্ট বাতিল হয়েছে',
    subtitle:
      'আপনি পেমেন্ট বাতিল করেছেন। যখন প্রস্তুত হবেন তখন আবার চেষ্টা করুন।',
    ringColor: 'ring-slate-300',
    bgGradient: 'from-slate-50 via-white to-slate-50',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-300',
    badgeText: '⊘ Payment Cancelled',
    accentBorder: 'border-slate-200',
  },
};

// ─── Inner component (uses useSearchParams — must be wrapped in Suspense) ────

function ResultContent() {
  const searchParams = useSearchParams();
  const router       = useRouter();

  // Read query params set by the gateway page countdown redirect
  const rawStatus = searchParams.get('status') ?? 'failed';
  const courseId  = searchParams.get('courseId') ?? '';

  // Sanitize status; fall back to 'failed' for unknown values
  const status: ResultStatus = (['success', 'failed', 'pending', 'cancelled'] as const).includes(
    rawStatus as ResultStatus
  )
    ? (rawStatus as ResultStatus)
    : 'failed';

  const cfg    = STATUS_CONFIG[status];
  const course = COURSES_DATA.find((c) => c.id === courseId);

  return (
    <div
      className={`min-h-screen flex items-center justify-center bg-gradient-to-br ${cfg.bgGradient} p-4`}
    >
      <div
        className={`w-full max-w-lg rounded-3xl border ${cfg.accentBorder} bg-white shadow-2xl overflow-hidden`}
      >
        {/* ── Status Icon ── */}
        <div className="flex flex-col items-center pt-10 pb-6 px-8 space-y-4">
          <div
            className={`rounded-full ring-4 ${cfg.ringColor} p-4 animate-[pop_0.4s_ease-out]`}
          >
            {cfg.icon}
          </div>

          <span
            className={`inline-block border text-xs font-bold px-3 py-1 rounded-full ${cfg.badgeClass}`}
          >
            {cfg.badgeText}
          </span>

          <h1 className="text-2xl font-extrabold text-slate-900 text-center">
            {cfg.title}
          </h1>
          <p className="text-sm text-slate-500 text-center leading-relaxed">
            {cfg.subtitle}
          </p>
        </div>

        {/* ── Course Summary (if courseId resolved) ── */}
        {course && (
          <div
            className={`mx-6 mb-5 rounded-2xl border ${cfg.accentBorder} bg-slate-50 p-4 flex gap-4 items-start`}
          >
            <img
              src={course.thumbnailUrl}
              alt={course.title}
              className="h-16 w-24 rounded-xl object-cover shrink-0 border border-slate-200"
            />
            <div className="space-y-0.5 min-w-0">
              <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
                কোর্স
              </p>
              <p className="font-bold text-slate-900 text-sm leading-snug line-clamp-2">
                {course.title}
              </p>
              <p className="text-xs text-slate-500">{course.instructor.name}</p>
              <p className="text-sm font-extrabold text-primary-700 mt-1">
                ৳{course.price.toLocaleString('bn-BD')}
              </p>
            </div>
          </div>
        )}

        {/* ── Trust bar ── */}
        <div className="flex items-center justify-center gap-4 py-3 bg-slate-50 border-y border-slate-100 text-[11px] text-slate-400">
          <span className="flex items-center gap-1">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
            SSL Secured
          </span>
          <span className="flex items-center gap-1">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
            256-bit Encrypted
          </span>
          <span className="flex items-center gap-1">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
            PCI DSS Compliant
          </span>
        </div>

        {/* ── Action buttons ── */}
        <div className="p-6 space-y-3">
          {/* Primary CTA depends on result */}
          {status === 'success' && (
            <button
              id="btn-go-dashboard"
              onClick={() => router.push('/student')}
              className="w-full rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 flex items-center justify-center gap-2 transition"
            >
              <LayoutDashboard className="h-4 w-4" />
              আমার ড্যাশবোর্ডে যান
            </button>
          )}

          {(status === 'failed' || status === 'cancelled') && courseId && (
            <button
              id="btn-retry-payment"
              onClick={() => router.push(`/payment/${courseId}`)}
              className="w-full rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 flex items-center justify-center gap-2 transition"
            >
              <RotateCcw className="h-4 w-4" />
              আবার পেমেন্ট করুন
            </button>
          )}

          {status === 'pending' && (
            <button
              id="btn-pending-dashboard"
              onClick={() => router.push('/student')}
              className="w-full rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 flex items-center justify-center gap-2 transition"
            >
              <LayoutDashboard className="h-4 w-4" />
              ড্যাশবোর্ডে যান (যাচাই চলছে)
            </button>
          )}

          {/* Secondary: browse courses */}
          <button
            id="btn-browse-courses"
            onClick={() => router.push('/courses')}
            className="w-full rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium py-3 flex items-center justify-center gap-2 transition text-sm"
          >
            <BookOpen className="h-4 w-4 text-slate-400" />
            সকল কোর্স দেখুন
          </button>

          {/* Tertiary: home */}
          <button
            id="btn-go-home"
            onClick={() => router.push('/')}
            className="w-full text-xs text-slate-400 hover:text-slate-600 transition py-1 flex items-center justify-center gap-1"
          >
            <Home className="h-3.5 w-3.5" />
            হোম পেইজে ফিরে যান
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Page export with Suspense boundary (required for useSearchParams) ────────

export default function PaymentResultPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <p className="text-slate-500 text-sm animate-pulse">লোড হচ্ছে…</p>
        </div>
      }
    >
      <ResultContent />
    </Suspense>
  );
}
