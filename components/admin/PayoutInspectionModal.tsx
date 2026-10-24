'use client';

import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  XCircle,
  Clock,
  Send,
  DollarSign,
  User,
  ShieldCheck,
  AlertTriangle,
  Receipt,
  Building,
  CreditCard,
  FileText,
  ArrowRight,
  RefreshCw,
  Hash,
  ExternalLink,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  approvePayoutRequestAction,
  disbursePayoutRequestAction,
  rejectPayoutRequestAction,
} from '@/actions/financial';

export interface PayoutRequestItem {
  id: string;
  _id?: string;
  userId: string;
  user?: {
    _id?: string;
    name?: string;
    email?: string;
    phone?: string;
    role?: string;
    image?: string;
    availableBalance?: number;
    totalEarnings?: number;
    bankName?: string;
    bankBranch?: string;
    bankAccountName?: string;
  } | null;
  amount: number;
  status: 'PENDING' | 'REQUESTED' | 'APPROVED' | 'DISBURSED' | 'REJECTED';
  mfsProvider: 'BKASH' | 'NAGAD' | 'ROCKET' | 'BANK';
  mfsNumber: string;
  bankName?: string;
  bankBranch?: string;
  bankAccountName?: string;
  transactionId?: string;
  rejectionReason?: string;
  adminNotes?: string;
  approvedBy?: any;
  approvedAt?: string | Date;
  disbursedBy?: any;
  disbursedAt?: string | Date;
  rejectedBy?: any;
  rejectedAt?: string | Date;
  ledgerTransactionId?: string;
  requestedAt: string | Date;
  processedAt?: string | Date;
}

interface PayoutInspectionModalProps {
  payout: PayoutRequestItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedPayout: PayoutRequestItem) => void;
}

export default function PayoutInspectionModal({
  payout,
  isOpen,
  onClose,
  onSuccess,
}: PayoutInspectionModalProps) {
  const [activeAction, setActiveAction] = useState<'NONE' | 'APPROVE' | 'DISBURSE' | 'REJECT'>('NONE');
  const [transactionId, setTransactionId] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen || !payout) return null;

  const isPending = payout.status === 'PENDING' || payout.status === 'REQUESTED';
  const isApproved = payout.status === 'APPROVED';
  const isDisbursed = payout.status === 'DISBURSED';
  const isRejected = payout.status === 'REJECTED';

  const resetForm = () => {
    setActiveAction('NONE');
    setTransactionId('');
    setRejectionReason('');
    setAdminNotes('');
    setErrorMsg(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleApprove = async () => {
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const res = await approvePayoutRequestAction(payout.id || (payout as any)._id, adminNotes);
      if (res.success && res.payout) {
        onSuccess({ ...payout, ...res.payout, status: 'APPROVED' });
        handleClose();
      } else {
        setErrorMsg(res.error || 'Failed to approve payout');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'An unexpected error occurred during approval');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDisburse = async () => {
    if (!transactionId.trim()) {
      setErrorMsg('Please enter a valid MFS or Bank Transaction ID reference');
      return;
    }
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const res = await disbursePayoutRequestAction(
        payout.id || (payout as any)._id,
        transactionId.trim(),
        adminNotes
      );
      if (res.success && res.payout) {
        onSuccess({
          ...payout,
          ...res.payout,
          status: 'DISBURSED',
          transactionId: transactionId.trim(),
          disbursedAt: new Date(),
        });
        handleClose();
      } else {
        setErrorMsg(res.error || 'Failed to disburse payout via ledger');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'An unexpected error occurred during disbursal');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      setErrorMsg('Please specify a rejection reason for the instructor');
      return;
    }
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const res = await rejectPayoutRequestAction(
        payout.id || (payout as any)._id,
        rejectionReason.trim()
      );
      if (res.success && res.payout) {
        onSuccess({
          ...payout,
          ...res.payout,
          status: 'REJECTED',
          rejectionReason: rejectionReason.trim(),
        });
        handleClose();
      } else {
        setErrorMsg(res.error || 'Failed to reject payout');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'An unexpected error occurred during rejection');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400">
              <Receipt className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Payout Request Dossier
                </h3>
                <Badge
                  variant={
                    isPending
                      ? 'outline'
                      : isApproved
                      ? 'default'
                      : isDisbursed
                      ? 'secondary'
                      : 'destructive'
                  }
                  className={`text-[10px] uppercase font-bold tracking-wider ${
                    isPending
                      ? 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300'
                      : isApproved
                      ? 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/60 dark:text-blue-300'
                      : isDisbursed
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300'
                      : 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300'
                  }`}
                >
                  {payout.status}
                </Badge>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                ID: {payout.id || (payout as any)._id}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 text-rose-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Key Figures Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-emerald-50/60 dark:bg-emerald-950/20 p-3.5">
              <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 block mb-1">
                Requested Payout Amount
              </span>
              <p className="text-2xl font-extrabold text-emerald-900 dark:text-emerald-300">
                ৳{payout.amount.toLocaleString()}
              </p>
              <span className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80">
                Full 100% net withdrawal
              </span>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 p-3.5">
              <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                Payment Channel
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                {payout.mfsProvider === 'BANK' ? (
                  <Building className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                ) : (
                  <CreditCard className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                )}
                <span className="text-base font-bold text-slate-900 dark:text-white">
                  {payout.mfsProvider}
                </span>
              </div>
              <span className="text-xs font-mono text-slate-600 dark:text-slate-400 truncate block mt-0.5">
                {payout.mfsNumber}
              </span>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 p-3.5">
              <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                Requested On
              </span>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                {new Date(payout.requestedAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </p>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                {new Date(payout.requestedAt).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          </div>

          {/* Instructor Profile Dossier */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 bg-white dark:bg-slate-900">
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-indigo-500" />
              <span>Instructor Profile & Balance Dossier</span>
            </h4>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                  {payout.user?.name?.charAt(0) || 'I'}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">
                    {payout.user?.name || 'Instructor'}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {payout.user?.email || 'N/A'} {payout.user?.phone && `· ${payout.user.phone}`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 text-right">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-medium">
                    Wallet Balance
                  </span>
                  <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                    ৳{(payout.user?.availableBalance ?? 0).toLocaleString()}
                  </span>
                </div>
                <div className="border-l border-slate-200 dark:border-slate-800 pl-4">
                  <span className="text-[10px] text-slate-400 block uppercase font-medium">
                    Lifetime Earnings
                  </span>
                  <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                    ৳{(payout.user?.totalEarnings ?? 0).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {payout.mfsProvider === 'BANK' && (payout.bankName || payout.user?.bankName) && (
              <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px]">Bank Name</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {payout.bankName || payout.user?.bankName}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Branch</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {payout.bankBranch || payout.user?.bankBranch || 'Main Branch'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Account Holder</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {payout.bankAccountName || payout.user?.bankAccountName || payout.user?.name}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Workflow & Financial Ledger Audit */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 bg-slate-50 dark:bg-slate-800/40">
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              <span>Financial Ledger Workflow Execution</span>
            </h4>

            <div className="space-y-3 text-xs">
              {/* Step 1 */}
              <div className="flex items-start gap-3">
                <div className="h-5 w-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5 font-bold text-[10px]">
                  ✓
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      Step 1: Payout Request & Escrow Hold
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(payout.requestedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                    ৳{payout.amount.toLocaleString()} was immediately placed in escrow hold and reserved from instructor available balance.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex items-start gap-3">
                <div
                  className={`h-5 w-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 font-bold text-[10px] ${
                    isApproved || isDisbursed
                      ? 'bg-emerald-100 text-emerald-700'
                      : isRejected
                      ? 'bg-rose-100 text-rose-700'
                      : 'bg-amber-100 text-amber-700 animate-pulse'
                  }`}
                >
                  {isApproved || isDisbursed ? '✓' : isRejected ? '✗' : '2'}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      Step 2: Admin Compliance & Verification
                    </span>
                    {payout.approvedAt && (
                      <span className="text-[10px] text-slate-400">
                        {new Date(payout.approvedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                    {isDisbursed || isApproved
                      ? 'Request approved by platform administrator. Target account verified.'
                      : isRejected
                      ? `Request rejected by administrator: "${payout.rejectionReason || 'Compliance issues'}"`
                      : 'Awaiting admin verification and approval decision.'}
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex items-start gap-3">
                <div
                  className={`h-5 w-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 font-bold text-[10px] ${
                    isDisbursed
                      ? 'bg-emerald-100 text-emerald-700'
                      : isRejected
                      ? 'bg-slate-200 text-slate-500'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {isDisbursed ? '✓' : '3'}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      Step 3: MFS / Bank Ledger Disbursement
                    </span>
                    {payout.disbursedAt && (
                      <span className="text-[10px] text-slate-400">
                        {new Date(payout.disbursedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                    {isDisbursed ? (
                      <span className="text-emerald-700 dark:text-emerald-400 font-medium">
                        Disbursed via {payout.mfsProvider}. Ledger Transaction TXN:{' '}
                        <span className="font-mono font-bold">{payout.transactionId}</span>
                      </span>
                    ) : isRejected ? (
                      <span className="text-slate-400">
                        Cancelled / Reimbursed back into instructor wallet.
                      </span>
                    ) : (
                      'Funds will be transferred and an immutable DISBURSED_OUTFLOW entry created in the Financial Ledger.'
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* If already disbursed: show receipt details */}
          {isDisbursed && payout.transactionId && (
            <div className="rounded-xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/50 dark:bg-emerald-950/20 p-4">
              <div className="flex items-center gap-2 mb-2 text-emerald-800 dark:text-emerald-300 font-bold text-xs">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>Financial Ledger Disbursement Certificate</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block text-[11px]">
                    Gateway / Bank Ref ID
                  </span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                    {payout.transactionId}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block text-[11px]">
                    Disbursement Date
                  </span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {payout.disbursedAt ? new Date(payout.disbursedAt).toLocaleString() : 'Recent'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* If already rejected: show rejection notice */}
          {isRejected && (
            <div className="rounded-xl border border-rose-200 dark:border-rose-800/60 bg-rose-50/50 dark:bg-rose-950/20 p-4">
              <div className="flex items-center gap-2 mb-1.5 text-rose-800 dark:text-rose-300 font-bold text-xs">
                <XCircle className="h-4 w-4 text-rose-600" />
                <span>Payout Request Rejection & Wallet Reimbursement</span>
              </div>
              <p className="text-xs text-rose-700 dark:text-rose-300 mb-2">
                Reason: {payout.rejectionReason || 'No explicit reason specified.'}
              </p>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                The full amount of ৳{payout.amount.toLocaleString()} has been safely refunded to the instructor&apos;s wallet.
              </span>
            </div>
          )}

          {/* Interactive Action Forms for Pending or Approved items */}
          {activeAction === 'APPROVE' && (
            <div className="p-4 rounded-xl border border-blue-200 dark:border-blue-800/60 bg-blue-50/60 dark:bg-blue-950/20 space-y-3">
              <h5 className="text-xs font-bold text-blue-900 dark:text-blue-300 flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-blue-600" />
                <span>Confirm Payout Approval</span>
              </h5>
              <p className="text-xs text-blue-800/90 dark:text-blue-200">
                Approving will mark this request as APPROVED and queue it for financial ledger disbursement.
              </p>
              <div>
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Admin Verification Notes (Optional)
                </label>
                <input
                  type="text"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="e.g. Identity verified; MFS account matches KYC"
                  className="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <Button variant="outline" size="sm" onClick={() => setActiveAction('NONE')} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button size="sm" onClick={handleApprove} disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 text-white">
                  {isSubmitting ? 'Approving...' : 'Confirm Approval'}
                </Button>
              </div>
            </div>
          )}

          {activeAction === 'DISBURSE' && (
            <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/60 dark:bg-emerald-950/20 space-y-3">
              <h5 className="text-xs font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
                <Send className="h-4 w-4 text-emerald-600" />
                <span>Execute Disbursement via Financial Ledger</span>
              </h5>
              <p className="text-xs text-emerald-800/90 dark:text-emerald-200">
                Enter the external transaction reference from your bKash/Nagad Merchant portal or Bank transfer receipt. This will create an immutable cleared outflow entry in the Financial Ledger.
              </p>
              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  MFS / Bank Transaction ID <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  placeholder="e.g. BK-987214981 or EBL-FT-20261017"
                  className="w-full text-xs font-mono p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-semibold"
                  required
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Disbursement Notes (Optional)
                </label>
                <input
                  type="text"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="e.g. Sent via corporate bKash merchant API"
                  className="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <Button variant="outline" size="sm" onClick={() => setActiveAction('NONE')} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button size="sm" onClick={handleDisburse} disabled={isSubmitting} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                  {isSubmitting ? 'Recording Disbursement...' : 'Execute Disbursement'}
                </Button>
              </div>
            </div>
          )}

          {activeAction === 'REJECT' && (
            <div className="p-4 rounded-xl border border-rose-200 dark:border-rose-800/60 bg-rose-50/60 dark:bg-rose-950/20 space-y-3">
              <h5 className="text-xs font-bold text-rose-900 dark:text-rose-300 flex items-center gap-1.5">
                <XCircle className="h-4 w-4 text-rose-600" />
                <span>Reject Payout & Refund Instructor Balance</span>
              </h5>
              <p className="text-xs text-rose-800/90 dark:text-rose-200">
                Rejecting will atomically return ৳{payout.amount.toLocaleString()} back to the instructor&apos;s wallet and record a PAYOUT_REFUND entry in the ledger.
              </p>
              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Rejection Reason <span className="text-rose-500">*</span>
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Provide clear reason to instructor (e.g., Inactive bKash number, KYC incomplete, bank details mismatch)"
                  rows={2}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <Button variant="outline" size="sm" onClick={() => setActiveAction('NONE')} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button size="sm" onClick={handleReject} disabled={isSubmitting} variant="destructive">
                  {isSubmitting ? 'Rejecting...' : 'Confirm Rejection'}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <Button variant="ghost" size="sm" onClick={handleClose} disabled={isSubmitting} className="text-xs">
            Close Dossier
          </Button>

          {activeAction === 'NONE' && (
            <div className="flex items-center gap-2">
              {isPending && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs text-rose-600 border-rose-200 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                    onClick={() => setActiveAction('REJECT')}
                  >
                    Reject Request
                  </Button>
                  <Button
                    size="sm"
                    className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
                    onClick={() => setActiveAction('APPROVE')}
                  >
                    Approve Payout
                  </Button>
                </>
              )}

              {isApproved && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs text-rose-600 border-rose-200 hover:bg-rose-50"
                    onClick={() => setActiveAction('REJECT')}
                  >
                    Reject
                  </Button>
                  <Button
                    size="sm"
                    className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                    onClick={() => setActiveAction('DISBURSE')}
                  >
                    <Send className="h-3.5 w-3.5 mr-1.5" />
                    Disburse via Ledger
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
