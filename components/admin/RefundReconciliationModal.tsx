'use client';

import React, { useState } from 'react';
import {
  X,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RotateCcw,
  DollarSign,
  CreditCard,
  User,
  BookOpen,
  ShieldAlert,
  Layers,
  FileText,
  Loader2,
  Calendar,
  Hash,
  ArrowDownLeft,
  GraduationCap,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { processRefundRequest } from '@/actions/financial';

export interface RefundPaymentItem {
  id: string;
  userId: string;
  user: {
    name?: string;
    email?: string;
    role?: string;
    phone?: string;
    image?: string;
  } | null;
  courseId: string;
  course: {
    title?: string;
    titleEn?: string;
    price?: number;
    instructor?: any;
    thumbnail?: string;
  } | null;
  enrollmentId: string;
  enrollment: {
    paymentStatus?: string;
    enrolledAt?: string;
    amountPaid?: number;
    transactionId?: string;
  } | null;
  amount: number;
  paymentMethod: string;
  transactionId: string;
  payment_status: 'Pending' | 'Completed' | 'Refunded' | 'Disputed' | 'Failed' | 'Refund_Requested' | string;
  refundReason?: string;
  decision?: 'Approved' | 'Rejected' | string;
  refundAmount?: number;
  refundedAt?: string;
  refundedBy?: { name?: string; email?: string } | null;
  disputeNotes?: string;
  createdAt: string;
}

interface RefundReconciliationModalProps {
  payment: RefundPaymentItem;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (paymentId: string, decision: 'Approved' | 'Rejected', refundReason: string) => void;
}

export default function RefundReconciliationModal({
  payment,
  isOpen,
  onClose,
  onSuccess,
}: RefundReconciliationModalProps) {
  const [decision, setDecision] = useState<'Approved' | 'Rejected'>('Approved');
  const [refundReason, setRefundReason] = useState(
    payment.refundReason || 'Student billing dispute evaluated and resolved.'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const commissionFee = Math.round((payment.amount * 20) / 100);
  const instructorFee = payment.amount - commissionFee;

  const handleProcessRefund = async () => {
    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const res = await processRefundRequest(
        payment.id,
        decision,
        refundReason.trim()
      );

      if (!res.success) {
        setErrorMsg(res.error || 'Failed to process refund request.');
        setIsSubmitting(false);
        return;
      }

      onSuccess(payment.id, decision, refundReason.trim());
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected server error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const s = status.toLowerCase();
    if (s === 'refunded') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800 px-2.5 py-0.5 text-xs font-semibold">
          <RotateCcw className="h-3 w-3" /> Refunded
        </span>
      );
    }
    if (s === 'refund_requested' || s === 'pending') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 px-2.5 py-0.5 text-xs font-semibold">
          <AlertTriangle className="h-3 w-3" /> Refund Requested
        </span>
      );
    }
    if (s === 'disputed') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-800 px-2.5 py-0.5 text-xs font-semibold">
          <ShieldAlert className="h-3 w-3" /> Disputed
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 px-2.5 py-0.5 text-xs font-semibold">
        <CheckCircle2 className="h-3 w-3" /> Completed
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 my-8 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-6 py-4 bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <DollarSign className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 dark:text-white text-lg">
                  Refund & Reconciliation
                </h3>
                {getStatusBadge(payment.payment_status)}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                <span>TXN: <strong className="font-mono">{payment.transactionId}</strong></span>
                <span>•</span>
                <span>Method: <strong>{payment.paymentMethod}</strong></span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto px-6 py-5 space-y-5 text-sm">
          {/* Linked Records: Student & Course & Enrollment */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {/* Student & Course Box */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 p-3.5 space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <User className="h-3.5 w-3.5 text-indigo-500" />
                <span>Student Details</span>
              </div>
              <div>
                <p className="font-medium text-slate-900 dark:text-white">
                  {payment.user?.name || 'Unknown Student'}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {payment.user?.email || 'No email provided'}
                </p>
                {payment.user?.phone && (
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Phone: {payment.user.phone}
                  </p>
                )}
              </div>

              <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                  <BookOpen className="h-3.5 w-3.5 text-purple-500" />
                  <span>Enrolled Course</span>
                </div>
                <p className="font-medium text-slate-900 dark:text-white text-xs line-clamp-1">
                  {payment.course?.title || payment.course?.titleEn || 'Course ID: ' + payment.courseId}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Listed Price: ৳{payment.course?.price?.toLocaleString() || payment.amount.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Enrollment & Access State Box */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 p-3.5 space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <Layers className="h-3.5 w-3.5 text-emerald-500" />
                <span>Enrollment State</span>
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Current Access Status:</p>
                <div className="mt-1 flex items-center gap-2">
                  <Badge
                    variant={
                      payment.enrollment?.paymentStatus === 'Cancelled'
                        ? 'destructive'
                        : payment.enrollment?.paymentStatus === 'success' || payment.enrollment?.paymentStatus === 'GRANTED'
                        ? 'default'
                        : 'secondary'
                    }
                  >
                    {payment.enrollment?.paymentStatus || 'No Enrollment Link'}
                  </Badge>
                  <span className="text-xs text-slate-500">
                    {payment.enrollment?.paymentStatus === 'Cancelled'
                      ? '(Access Revoked)'
                      : '(Active Student Access)'}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                <p className="text-xs text-slate-500 dark:text-slate-400">Enrollment ID:</p>
                <p className="font-mono text-xs text-slate-700 dark:text-slate-300">
                  {payment.enrollmentId || 'N/A'}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Transaction Date:</p>
                <p className="text-xs text-slate-700 dark:text-slate-300">
                  {new Date(payment.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* Student Refund Reason / Dispute */}
          <div className="rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/20 p-4">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-800 dark:text-amber-400 uppercase tracking-wider mb-1.5">
              <AlertTriangle className="h-4 w-4" />
              <span>Student Rationale & Dispute Reason</span>
            </div>
            <p className="text-slate-800 dark:text-slate-200 text-sm leading-relaxed">
              {payment.refundReason || 'No explicit reason specified by student.'}
            </p>
          </div>

          {/* Financial Balance Adjustment Ledger */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 bg-slate-50 dark:bg-slate-800/40">
            <h4 className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-2.5 flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-emerald-500" />
              <span>Financial Ledger Adjustments (Upon Approval)</span>
            </h4>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-2.5">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Student Refund</span>
                <span className="text-base font-bold text-rose-600 dark:text-rose-400">
                  -৳{payment.amount.toLocaleString()}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">100% reimbursed</span>
              </div>
              <div className="rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-2.5">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Platform Commission</span>
                <span className="text-base font-bold text-amber-600 dark:text-amber-400">
                  -৳{commissionFee.toLocaleString()}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">20% fee reversal</span>
              </div>
              <div className="rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-2.5">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Instructor Earnings</span>
                <span className="text-base font-bold text-indigo-600 dark:text-indigo-400">
                  -৳{instructorFee.toLocaleString()}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">80% wallet clawback</span>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2.5 flex items-center gap-1.5">
              <ShieldAlert className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
              <span>
                Atomic Guarantee: Revokes course access and updates financial records simultaneously with zero orphan states.
              </span>
            </p>
          </div>

          {/* Decision Selection */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Moderator / Admin Decision
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setDecision('Approved')}
                className={`flex flex-col items-center justify-center p-3.5 rounded-xl border text-center transition-all ${
                  decision === 'Approved'
                    ? 'border-rose-500 bg-rose-50/70 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 shadow-sm ring-1 ring-rose-500'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-400'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-sm">
                  <RotateCcw className="h-4 w-4" />
                  <span>Approve Refund</span>
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Revoke student enrollment & adjust balances
                </span>
              </button>

              <button
                type="button"
                onClick={() => setDecision('Rejected')}
                className={`flex flex-col items-center justify-center p-3.5 rounded-xl border text-center transition-all ${
                  decision === 'Rejected'
                    ? 'border-slate-600 dark:border-slate-400 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm ring-1 ring-slate-400'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-400'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-sm">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Reject Request</span>
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Maintain active student course access
                </span>
              </button>
            </div>
          </div>

          {/* Refund / Administrative Reason */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Administrative Rationale / Resolution Note
            </label>
            <textarea
              rows={3}
              value={refundReason}
              onChange={(e) => setRefundReason(e.target.value)}
              placeholder="Provide reason for approval or rejection..."
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-400 resize-none"
            />
          </div>

          {errorMsg && (
            <div className="flex items-center gap-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 px-3.5 py-2.5 text-xs text-rose-700 dark:text-rose-400">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 px-6 py-4 bg-slate-50/50 dark:bg-slate-800/40">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-xl"
          >
            Cancel
          </Button>

          <Button
            onClick={handleProcessRefund}
            disabled={isSubmitting}
            className={`rounded-xl text-white font-semibold flex items-center gap-2 ${
              decision === 'Approved'
                ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-500/20 shadow-md'
                : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/20 shadow-md'
            }`}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Processing...</span>
              </>
            ) : decision === 'Approved' ? (
              <>
                <RotateCcw className="h-4 w-4" />
                <span>Confirm & Revoke Access</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                <span>Confirm Rejection</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
