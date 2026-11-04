'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CircleCheck, Clock, CreditCard } from 'lucide-react';
import { getDemoPurchaseCheckoutStatus, submitDemoPurchase } from '@/actions/demo-purchases';
import { useLanguage } from '@/context/LanguageContext';

const checkoutCopy = {
  en: {
    title: 'Demo checkout',
    notice: 'This is a simulation. You will be charged BDT 0. Checkout uses a sample card.',
    back: 'Back to course',
    summary: 'Order summary',
    price: 'Course price',
    method: 'Payment method',
    status: 'Purchase status',
    card: 'Demo card',
    cardNumber: 'Sample card number',
    expiration: 'Expiry date',
    securityCode: 'Security code',
    submit: 'Send demo purchase request',
    working: 'Please wait…',
    pending: 'Awaiting admin approval',
    pendingDetail: 'Your request was submitted. An administrator must approve it before you can access the course.',
    approved: 'Course access is available',
    openCourse: 'Open course',
    refresh: 'Check request status',
    error: 'Something went wrong. Please try again.',
  },
  bn: {
    title: 'ডেমো চেকআউট',
    notice: 'এটি একটি ডেমো। আপনার কাছ থেকে ৳০ নেওয়া হবে। চেকআউটে নমুনা কার্ড ব্যবহার করা হয়।',
    back: 'কোর্সে ফিরে যান',
    summary: 'অর্ডারের সারসংক্ষেপ',
    price: 'কোর্সের মূল্য',
    method: 'পেমেন্ট পদ্ধতি',
    status: 'ক্রয়ের অবস্থা',
    card: 'ডেমো কার্ড',
    cardNumber: 'নমুনা কার্ড নম্বর',
    expiration: 'মেয়াদ শেষের তারিখ',
    securityCode: 'সিকিউরিটি কোড',
    submit: 'ডেমো ক্রয়ের অনুরোধ পাঠান',
    working: 'অনুগ্রহ করে অপেক্ষা করুন…',
    pending: 'অ্যাডমিনের অনুমোদনের অপেক্ষায়',
    pendingDetail: 'আপনার অনুরোধ পাঠানো হয়েছে। কোর্সে প্রবেশ করতে অ্যাডমিনের অনুমোদন প্রয়োজন।',
    approved: 'কোর্সে প্রবেশ করতে পারবেন',
    openCourse: 'কোর্স খুলুন',
    refresh: 'অনুরোধের অবস্থা দেখুন',
    error: 'সমস্যা হয়েছে। আবার চেষ্টা করুন।',
  },
};

type CheckoutStatus = Awaited<ReturnType<typeof getDemoPurchaseCheckoutStatus>>;

export default function DemoCheckout({ courseId, title, titleEn, price, initialStatus }: {
  courseId: string;
  title: string;
  titleEn?: string;
  price: number;
  initialStatus: CheckoutStatus;
}) {
  const { language } = useLanguage();
  const copy = checkoutCopy[language];
  const [status, setStatus] = useState(initialStatus);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const courseHref = `/courses/${encodeURIComponent(courseId)}`;
  const priceLabel = language === 'en' ? `BDT ${price.toLocaleString('en-BD')}` : `৳${price.toLocaleString('bn-BD')}`;
  const checkoutButton = 'inline-flex w-full items-center justify-center rounded-xl bg-primary-600 px-4 py-3 text-sm font-semibold text-white hover:bg-primary-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 disabled:opacity-60';

  async function submitPurchase() {
    setBusy(true);
    setError('');
    try {
      const result = await submitDemoPurchase(courseId);
      if (result.success) setStatus('pending');
      else setError(result.error);
    } catch {
      setError(copy.error);
    } finally {
      setBusy(false);
    }
  }

  async function refreshStatus() {
    setBusy(true);
    setError('');
    try {
      setStatus(await getDemoPurchaseCheckoutStatus(courseId));
    } catch {
      setError(copy.error);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 py-4 sm:py-8">
      <Link href={courseHref} className="inline-flex items-center gap-2 text-sm font-medium text-primary-700 hover:underline">
        <ArrowLeft aria-hidden="true" className="h-4 w-4" />
        {copy.back}
      </Link>
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-slate-900">{copy.title}</h1>
        <p className="text-sm text-slate-600">{copy.notice}</p>
      </div>

      <div className="grid items-start gap-5 md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <section aria-labelledby="purchase-panel" className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 id="purchase-panel" className="text-lg font-bold text-slate-900">{status === 'available' ? copy.method : copy.status}</h2>

          {status === 'available' && (
            <>
              <div className="rounded-xl border border-primary-200 bg-primary-50 p-4">
                <p className="flex items-center gap-2 font-semibold text-primary-800">
                  <CreditCard aria-hidden="true" className="h-5 w-5" />
                  {copy.card}
                </p>
                <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div className="col-span-2 rounded-lg bg-white p-3">
                    <dt className="text-slate-600">{copy.cardNumber}</dt>
                    <dd className="mt-1 font-mono font-semibold text-slate-900" dir="ltr">4242 4242 4242 4242</dd>
                  </div>
                  <div className="rounded-lg bg-white p-3">
                    <dt className="text-slate-600">{copy.expiration}</dt>
                    <dd className="mt-1 font-mono font-semibold text-slate-900">12/30</dd>
                  </div>
                  <div className="rounded-lg bg-white p-3">
                    <dt className="text-slate-600">{copy.securityCode}</dt>
                    <dd className="mt-1 font-mono font-semibold text-slate-900">123</dd>
                  </div>
                </dl>
              </div>
              <button type="button" disabled={busy} onClick={submitPurchase} className={checkoutButton}>
                {busy ? copy.working : copy.submit}
              </button>
            </>
          )}

          {status === 'pending' && (
            <>
              <div role="status" className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
                <p className="flex items-center gap-2 font-semibold">
                  <Clock aria-hidden="true" className="h-5 w-5 shrink-0" />
                  {copy.pending}
                </p>
                <p className="mt-2">{copy.pendingDetail}</p>
              </div>
              <button type="button" disabled={busy} onClick={refreshStatus} className={checkoutButton}>
                {busy ? copy.working : copy.refresh}
              </button>
            </>
          )}

          {status === 'enrolled' && (
            <>
              <p role="status" className="flex items-center gap-2 rounded-xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">
                <CircleCheck aria-hidden="true" className="h-5 w-5 shrink-0" />
                {copy.approved}
              </p>
              <Link href={courseHref} className={checkoutButton}>{copy.openCourse}</Link>
            </>
          )}

          {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
        </section>

        <section aria-labelledby="order-summary" className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 id="order-summary" className="text-lg font-bold text-slate-900">{copy.summary}</h2>
          <p className="font-semibold text-slate-800">{language === 'en' && titleEn ? titleEn : title}</p>
          <dl className="flex items-baseline justify-between gap-3 border-t border-slate-200 pt-4">
            <dt className="text-sm text-slate-600">{copy.price}</dt>
            <dd className="font-bold text-slate-900">{priceLabel}</dd>
          </dl>
        </section>
      </div>
    </div>
  );
}
