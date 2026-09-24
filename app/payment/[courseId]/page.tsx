'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  Lock,
  ShieldCheck,
  CreditCard,
  Smartphone,
  Building2,
  CheckCircle2,
  XCircle,
  Loader2,
  ChevronRight,
  AlertTriangle,
  Star,
  Clock,
  BookOpen,
} from 'lucide-react';
import { COURSES_DATA } from '@/lib/courses-data';

// ---------- Demo card / mobile credentials ----------------
// SUCCESS:  card 4111111111111111  exp 12/26  cvv 123
//           bKash 01700000001  PIN 1234
// FAILURE:  card 4000000000000002  or  bKash 01900000002  PIN 0000
// PENDING:  card 4000000000000010  or  bKash 01800000003  PIN 9999

type Tab = 'card' | 'mobile' | 'bank';
type PaymentStatus = 'idle' | 'processing' | 'success' | 'failed' | 'pending';

const SUCCESS_CARDS   = ['4111111111111111'];
const PENDING_CARDS   = ['4000000000000010'];
const SUCCESS_MOBILES = ['01700000001'];
const PENDING_MOBILES = ['01800000003'];

function determineStatus(tab: Tab, card: string, mobile: string, pin: string): PaymentStatus {
  if (tab === 'card') {
    const stripped = card.replace(/\s/g, '');
    if (SUCCESS_CARDS.includes(stripped)) return 'success';
    if (PENDING_CARDS.includes(stripped)) return 'pending';
    return 'failed';
  }
  if (tab === 'mobile') {
    if (SUCCESS_MOBILES.includes(mobile) && pin === '1234') return 'success';
    if (PENDING_MOBILES.includes(mobile) && pin === '9999') return 'pending';
    return 'failed';
  }
  return 'pending'; // bank transfer always pending
}

export default function PaymentPage() {
  const params  = useParams();
  const router  = useRouter();
  const courseId = params?.courseId as string;

  const course = COURSES_DATA.find(c => c.id === courseId);

  const [tab, setTab] = useState<Tab>('card');
  const [status, setStatus] = useState<PaymentStatus>('idle');

  // Card fields
  const [cardNumber, setCardNumber]   = useState('');
  const [cardName, setCardName]       = useState('');
  const [cardExpiry, setCardExpiry]   = useState('');
  const [cardCvv, setCardCvv]         = useState('');

  // Mobile fields
  const [mobileNumber, setMobileNumber] = useState('');
  const [mobilePin, setMobilePin]       = useState('');

  // Bank field
  const [bankRef, setBankRef] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [countdown, setCountdown] = useState(5);

  // Auto-redirect after success/fail/pending
  useEffect(() => {
    if (status !== 'success' && status !== 'failed' && status !== 'pending') return;
    if (countdown <= 0) {
      router.push(`/payment/result?status=${status}&courseId=${courseId}`);
      return;
    }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [status, countdown, router, courseId]);

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-slate-500">কোর্স পাওয়া যায়নি।</p>
      </div>
    );
  }

  // ---- format helpers ----
  const fmtCard = (v: string) => v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
  const fmtExpiry = (v: string) => {
    const d = v.replace(/\D/g, '').slice(0, 4);
    return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
  };

  // ---- validation ----
  function validate(): boolean {
    const e: Record<string, string> = {};
    if (tab === 'card') {
      if (cardNumber.replace(/\s/g, '').length < 16) e.cardNumber = 'সঠিক কার্ড নম্বর দিন (১৬ ডিজিট)';
      if (!cardName.trim()) e.cardName = 'কার্ডধারীর নাম দিন';
      if (cardExpiry.length < 5) e.cardExpiry = 'মেয়াদ দিন (MM/YY)';
      if (cardCvv.length < 3) e.cardCvv = 'CVV দিন';
    }
    if (tab === 'mobile') {
      if (!/^01[3-9]\d{8}$/.test(mobileNumber)) e.mobileNumber = 'সঠিক মোবাইল নম্বর দিন';
      if (mobilePin.length < 4) e.mobilePin = '৪-সংখ্যার PIN দিন';
    }
    if (tab === 'bank') {
      if (!bankRef.trim()) e.bankRef = 'ট্রানজেকশন রেফারেন্স দিন';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handlePay() {
    if (!validate()) return;
    setStatus('processing');

    // Simulate network delay
    await new Promise(r => setTimeout(r, 2200));

    const result = determineStatus(tab, cardNumber, mobileNumber, mobilePin);
    setStatus(result);
    setCountdown(5);

    // Notify the API
    await fetch('/api/payment/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ courseId, status: result }),
    });
  }

  function handleCancel() {
    // Notify the API of the cancellation so it can log/clean up server-side
    fetch('/api/payment/cancel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ courseId }),
    }).catch(() => {
      // Non-critical — swallow errors; redirect regardless
    });

    router.push(`/payment/result?status=cancelled&courseId=${courseId}`);
  }

  // ---- result screens ----
  if (status === 'success' || status === 'failed' || status === 'pending') {
    const cfg = {
      success: {
        icon: <CheckCircle2 className="h-16 w-16 text-emerald-500" />,
        title: 'পেমেন্ট সফল হয়েছে!',
        sub: `${course.title} কোর্সে আপনার ভর্তি নিশ্চিত হয়েছে।`,
        bg: 'from-emerald-50 to-white',
        border: 'border-emerald-200',
        badge: 'bg-emerald-100 text-emerald-700',
        badgeText: '✔ Enrollment Confirmed',
      },
      failed: {
        icon: <XCircle className="h-16 w-16 text-rose-500" />,
        title: 'পেমেন্ট ব্যর্থ হয়েছে',
        sub: 'আপনার তথ্য যাচাই করতে পারা যায়নি। অনুগ্রহ করে আবার চেষ্টা করুন।',
        bg: 'from-rose-50 to-white',
        border: 'border-rose-200',
        badge: 'bg-rose-100 text-rose-700',
        badgeText: '✘ Payment Failed',
      },
      pending: {
        icon: <Clock className="h-16 w-16 text-amber-500" />,
        title: 'পেমেন্ট প্রক্রিয়াধীন',
        sub: 'আপনার পেমেন্ট যাচাই চলছে। নিশ্চিত হলে ইমেইলে জানানো হবে।',
        bg: 'from-amber-50 to-white',
        border: 'border-amber-200',
        badge: 'bg-amber-100 text-amber-700',
        badgeText: '⏳ Pending Verification',
      },
    }[status];

    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
        <div className={`w-full max-w-md rounded-2xl border ${cfg.border} bg-gradient-to-b ${cfg.bg} shadow-2xl p-8 text-center space-y-5 animate-in fade-in duration-300`}>
          <div className="flex justify-center">{cfg.icon}</div>
          <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${cfg.badge}`}>
            {cfg.badgeText}
          </span>
          <h2 className="text-2xl font-extrabold text-slate-900">{cfg.title}</h2>
          <p className="text-sm text-slate-600">{cfg.sub}</p>

          {/* Course summary */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 text-left space-y-1">
            <p className="text-xs text-slate-500">কোর্স</p>
            <p className="font-semibold text-slate-800 text-sm">{course.title}</p>
            <p className="text-xs text-slate-500">মূল্য: ৳{course.price.toLocaleString('bn-BD')}</p>
          </div>

          <p className="text-xs text-slate-400">
            {countdown} সেকেন্ডে স্বয়ংক্রিয়ভাবে রিডাইরেক্ট হবে…
          </p>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => router.push('/courses')}
              className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
            >
              সকল কোর্স
            </button>
            <button
              onClick={() => router.push('/student')}
              className="flex-1 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 transition"
            >
              ড্যাশবোর্ড
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ---- main payment UI ----
  return (
    <div className="min-h-screen bg-slate-100 flex items-start justify-center py-8 px-4">
      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* === LEFT: Gateway Form === */}
        <div className="lg:col-span-3 space-y-4">

          {/* Header bar mimicking SSLCommerz */}
          <div className="rounded-2xl overflow-hidden shadow-xl border border-slate-200 bg-white">
            <div className="bg-gradient-to-r from-[#00A859] to-[#007A40] px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-white flex items-center justify-center">
                  <Lock className="h-4 w-4 text-[#00A859]" />
                </div>
                <div>
                  <p className="text-white font-bold text-base leading-tight">SSL Secured Payment</p>
                  <p className="text-green-100 text-[11px]">Powered by SSLCommerz Bangladesh</p>
                </div>
              </div>
              <ShieldCheck className="h-6 w-6 text-green-200" />
            </div>

            {/* Method tabs */}
            <div className="flex border-b border-slate-200">
              {([
                { id: 'card',   icon: <CreditCard className="h-4 w-4" />,  label: 'ডেবিট/ক্রেডিট কার্ড' },
                { id: 'mobile', icon: <Smartphone className="h-4 w-4" />,  label: 'মোবাইল ব্যাংকিং' },
                { id: 'bank',   icon: <Building2 className="h-4 w-4" />,   label: 'ব্যাংক ট্রান্সফার' },
              ] as { id: Tab; icon: React.ReactNode; label: string }[]).map(m => (
                <button
                  key={m.id}
                  onClick={() => setTab(m.id)}
                  className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs font-semibold transition border-b-2 ${
                    tab === m.id
                      ? 'border-[#00A859] text-[#00A859] bg-green-50'
                      : 'border-transparent text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  {m.icon}
                  <span className="hidden sm:block">{m.label}</span>
                </button>
              ))}
            </div>

            <div className="p-6 space-y-5">

              {/* CARD TAB */}
              {tab === 'card' && (
                <div className="space-y-4">
                  <p className="text-[11px] text-slate-400 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 flex items-center gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                    পরীক্ষা: সফল → <strong>4111 1111 1111 1111</strong> &nbsp;|&nbsp; ব্যর্থ → <strong>4000 0000 0000 0002</strong> &nbsp;|&nbsp; প্রক্রিয়াধীন → <strong>4000 0000 0000 0010</strong>
                  </p>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-700">কার্ড নম্বর *</label>
                    <input
                      value={cardNumber}
                      onChange={e => setCardNumber(fmtCard(e.target.value))}
                      placeholder="0000 0000 0000 0000"
                      maxLength={19}
                      className={`w-full rounded-lg border px-4 py-2.5 text-sm font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-[#00A859] transition ${errors.cardNumber ? 'border-rose-400 bg-rose-50' : 'border-slate-300 bg-slate-50'}`}
                    />
                    {errors.cardNumber && <p className="text-xs text-rose-500">{errors.cardNumber}</p>}
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-700">কার্ডধারীর নাম *</label>
                    <input
                      value={cardName}
                      onChange={e => setCardName(e.target.value)}
                      placeholder="যেমন: MD RAHIM HOSSAIN"
                      className={`w-full rounded-lg border px-4 py-2.5 text-sm uppercase tracking-wide focus:outline-none focus:ring-2 focus:ring-[#00A859] transition ${errors.cardName ? 'border-rose-400 bg-rose-50' : 'border-slate-300 bg-slate-50'}`}
                    />
                    {errors.cardName && <p className="text-xs text-rose-500">{errors.cardName}</p>}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-700">মেয়াদ (MM/YY) *</label>
                      <input
                        value={cardExpiry}
                        onChange={e => setCardExpiry(fmtExpiry(e.target.value))}
                        placeholder="MM/YY"
                        maxLength={5}
                        className={`w-full rounded-lg border px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#00A859] transition ${errors.cardExpiry ? 'border-rose-400 bg-rose-50' : 'border-slate-300 bg-slate-50'}`}
                      />
                      {errors.cardExpiry && <p className="text-xs text-rose-500">{errors.cardExpiry}</p>}
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-700">CVV *</label>
                      <input
                        value={cardCvv}
                        onChange={e => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                        placeholder="• • •"
                        maxLength={4}
                        type="password"
                        className={`w-full rounded-lg border px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#00A859] transition ${errors.cardCvv ? 'border-rose-400 bg-rose-50' : 'border-slate-300 bg-slate-50'}`}
                      />
                      {errors.cardCvv && <p className="text-xs text-rose-500">{errors.cardCvv}</p>}
                    </div>
                  </div>
                </div>
              )}

              {/* MOBILE BANKING TAB */}
              {tab === 'mobile' && (
                <div className="space-y-4">
                  <p className="text-[11px] text-slate-400 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 flex items-center gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                    পরীক্ষা: সফল → <strong>01700000001</strong> PIN <strong>1234</strong> &nbsp;|&nbsp; ব্যর্থ → <strong>01900000002</strong> PIN <strong>0000</strong> &nbsp;|&nbsp; প্রক্রিয়াধীন → <strong>01800000003</strong> PIN <strong>9999</strong>
                  </p>

                  {/* Mobile brand logos */}
                  <div className="grid grid-cols-4 gap-2">
                    {['bKash', 'Nagad', 'Rocket', 'Upay'].map(brand => (
                      <div key={brand} className="border border-slate-200 rounded-lg py-3 px-2 text-center cursor-pointer hover:border-[#00A859] hover:bg-green-50 transition">
                        <p className="text-xs font-bold text-slate-700">{brand}</p>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-700">মোবাইল নম্বর *</label>
                    <input
                      value={mobileNumber}
                      onChange={e => setMobileNumber(e.target.value.replace(/\D/g, '').slice(0, 11))}
                      placeholder="01XXXXXXXXX"
                      className={`w-full rounded-lg border px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#00A859] transition ${errors.mobileNumber ? 'border-rose-400 bg-rose-50' : 'border-slate-300 bg-slate-50'}`}
                    />
                    {errors.mobileNumber && <p className="text-xs text-rose-500">{errors.mobileNumber}</p>}
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-700">PIN *</label>
                    <input
                      value={mobilePin}
                      onChange={e => setMobilePin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="আপনার PIN"
                      type="password"
                      className={`w-full rounded-lg border px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#00A859] transition ${errors.mobilePin ? 'border-rose-400 bg-rose-50' : 'border-slate-300 bg-slate-50'}`}
                    />
                    {errors.mobilePin && <p className="text-xs text-rose-500">{errors.mobilePin}</p>}
                  </div>
                </div>
              )}

              {/* BANK TRANSFER TAB */}
              {tab === 'bank' && (
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3 text-sm">
                    <p className="font-bold text-blue-800">ব্যাংক ট্রান্সফার নির্দেশনা</p>
                    <div className="grid grid-cols-2 gap-1 text-xs text-blue-700">
                      <span className="font-medium">ব্যাংক:</span><span>Dutch-Bangla Bank Ltd.</span>
                      <span className="font-medium">একাউন্ট নাম:</span><span>e-Shikho BD Ltd.</span>
                      <span className="font-medium">একাউন্ট নম্বর:</span><span>1071302000001</span>
                      <span className="font-medium">রাউটিং:</span><span>090261301</span>
                      <span className="font-medium">পরিমাণ:</span><span className="font-bold text-blue-900">৳{course.price.toLocaleString('bn-BD')}</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-700">ট্রানজেকশন রেফারেন্স নম্বর *</label>
                    <input
                      value={bankRef}
                      onChange={e => setBankRef(e.target.value)}
                      placeholder="উদা: TXN20241024XXXXXX"
                      className={`w-full rounded-lg border px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#00A859] transition ${errors.bankRef ? 'border-rose-400 bg-rose-50' : 'border-slate-300 bg-slate-50'}`}
                    />
                    {errors.bankRef && <p className="text-xs text-rose-500">{errors.bankRef}</p>}
                    <p className="text-[11px] text-slate-400">ব্যাংক ট্রান্সফার যাচাই করতে ১–৩ কার্যদিবস সময় লাগতে পারে।</p>
                  </div>
                </div>
              )}

              {/* Pay button */}
              <button
                onClick={handlePay}
                disabled={status === 'processing'}
                className="w-full rounded-xl bg-[#00A859] hover:bg-[#007A40] text-white font-bold py-3.5 flex items-center justify-center gap-2.5 transition disabled:opacity-60 shadow-md"
              >
                {status === 'processing' ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>প্রক্রিয়া করা হচ্ছে…</span>
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4" />
                    <span>৳{course.price.toLocaleString('bn-BD')} পেমেন্ট করুন</span>
                    <ChevronRight className="h-4 w-4" />
                  </>
                )}
              </button>

              <button
                onClick={handleCancel}
                disabled={status === 'processing'}
                className="w-full text-xs text-slate-400 hover:text-rose-500 transition py-1"
              >
                বাতিল করুন ও ফিরে যান
              </button>
            </div>
          </div>

          {/* Trust badges */}
          <div className="flex items-center justify-center gap-6 py-2">
            {['SSL Secured', '256-bit Encrypted', 'PCI DSS Compliant'].map(t => (
              <div key={t} className="flex items-center gap-1 text-[11px] text-slate-400">
                <ShieldCheck className="h-3.5 w-3.5 text-[#00A859]" />
                {t}
              </div>
            ))}
          </div>
        </div>

        {/* === RIGHT: Order summary === */}
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white shadow-md overflow-hidden">
            <div className="bg-slate-50 border-b border-slate-200 px-5 py-4">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">অর্ডার সারসংক্ষেপ</p>
            </div>
            <div className="p-5 space-y-4">
              <img
                src={course.thumbnailUrl}
                alt={course.title}
                className="w-full rounded-xl object-cover aspect-video"
              />
              <div>
                <p className="font-bold text-slate-900 text-sm leading-snug">{course.title}</p>
                <p className="text-xs text-slate-500 mt-1">{course.tagline}</p>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                <span className="font-semibold text-amber-600">{course.rating}</span>
                <span>({course.totalRatings} রিভিউ)</span>
              </div>

              <div className="space-y-2 text-xs text-slate-500">
                <div className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" />{course.duration}</div>
                <div className="flex items-center gap-1.5"><BookOpen className="h-3.5 w-3.5" />{course.totalLessons} টি লেসন</div>
              </div>

              <div className="border-t border-slate-100 pt-4 space-y-1.5 text-sm">
                <div className="flex justify-between text-slate-600">
                  <span>কোর্স মূল্য</span>
                  <span>৳{course.originalPrice.toLocaleString('bn-BD')}</span>
                </div>
                {course.originalPrice > course.price && (
                  <div className="flex justify-between text-emerald-600 font-medium">
                    <span>ডিসকাউন্ট</span>
                    <span>-৳{(course.originalPrice - course.price).toLocaleString('bn-BD')}</span>
                  </div>
                )}
                <div className="flex justify-between font-extrabold text-slate-900 text-base border-t border-slate-200 pt-2 mt-2">
                  <span>মোট পরিমাণ</span>
                  <span>৳{course.price.toLocaleString('bn-BD')}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2 text-xs text-slate-500">
            {[
              'আজীবন অ্যাক্সেস',
              'সার্টিফিকেট প্রদান',
              '৭ দিনের মানিব্যাক গ্যারান্টি',
              'ডাউনলোডযোগ্য রিসোর্স ফাইল',
            ].map(f => (
              <div key={f} className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                {f}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
