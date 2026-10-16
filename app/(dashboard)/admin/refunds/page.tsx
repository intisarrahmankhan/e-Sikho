import React from 'react';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  RotateCcw,
  ChevronRight,
  ArrowLeft,
  LayoutDashboard,
  ShieldCheck,
  DollarSign,
  AlertTriangle,
} from 'lucide-react';
import dbConnect from '@/lib/mongoose';
import Payment from '@/models/Payment';
import RefundReconciliationQueue from '@/components/admin/RefundReconciliationQueue';
import { getRefundRequestsAction } from '@/actions/financial';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Refund Request Processing & Reconciliation Panel | Admin Portal',
  description:
    'Evaluate student refund requests, manage transaction disputes, revoke course access atomically, and adjust platform balances.',
};

export default async function AdminRefundsPage() {
  const session = await auth();
  if (!session || !session.user) {
    redirect('/login');
  }

  const role = (session.user as any)?.role;
  if (role !== 'ADMIN' && role !== 'SUPERADMIN' && role !== 'MODERATOR') {
    redirect('/student');
  }

  await dbConnect();

  const response = await getRefundRequestsAction();
  const payments = response.payments || [];

  return (
    <div className="space-y-6 pb-16 max-w-7xl mx-auto">
      {/* Breadcrumb & Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-1.5">
          <Link
            href="/admin"
            className="flex items-center gap-1 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
          >
            <LayoutDashboard className="h-3.5 w-3.5" />
            <span>Admin Dashboard</span>
          </Link>
          <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
          <span className="font-semibold text-slate-800 dark:text-slate-200">
            Refund Reconciliation Panel
          </span>
        </div>

        <Link
          href="/admin"
          className="inline-flex items-center gap-1 font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Control Panel</span>
        </Link>
      </div>

      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 px-7 py-7 text-white shadow-xl border border-indigo-900/40">
        <div className="pointer-events-none absolute -top-10 -right-10 h-56 w-56 rounded-full bg-rose-600/10 blur-xl" />
        <div className="pointer-events-none absolute bottom-0 left-1/3 h-48 w-48 rounded-full bg-indigo-600/10 blur-xl" />

        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/20 px-3 py-1 text-xs font-semibold mb-3">
              <RotateCcw className="h-3.5 w-3.5 text-rose-400" />
              <span>Financial Reconciliation Engine</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Student Refund & Dispute Panel
            </h1>
            <p className="mt-1 text-indigo-200/80 text-sm max-w-2xl leading-relaxed">
              Evaluate student billing issues and gateway transaction disputes. Approving a refund atomically
              revokes course enrollment access and reverses instructor commission balances without orphan database records.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 backdrop-blur">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <div className="text-xs">
                <span className="text-slate-400 block">Transaction Safety</span>
                <span className="font-bold text-white">Atomic $transaction</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Reconciliation Queue Component */}
      <RefundReconciliationQueue initialPayments={payments} />
    </div>
  );
}
