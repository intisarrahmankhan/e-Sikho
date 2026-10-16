'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  RotateCcw,
  Search,
  Filter,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ShieldAlert,
  CreditCard,
  User,
  BookOpen,
  Layers,
  ArrowRight,
  ExternalLink,
  Sparkles,
  RefreshCw,
  Clock,
  ChevronRight,
  Check,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import RefundReconciliationModal, {
  RefundPaymentItem,
} from '@/components/admin/RefundReconciliationModal';
import { seedDemoRefundRequestsAction } from '@/actions/financial';

interface RefundReconciliationQueueProps {
  initialPayments: RefundPaymentItem[];
}

export default function RefundReconciliationQueue({
  initialPayments,
}: RefundReconciliationQueueProps) {
  const [payments, setPayments] = useState<RefundPaymentItem[]>(initialPayments);
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'Refund_Requested' | 'Refunded' | 'Disputed' | 'Completed'
  >('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPayment, setSelectedPayment] = useState<RefundPaymentItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Computed summary metrics
  const metrics = useMemo(() => {
    let pendingCount = 0;
    let refundedCount = 0;
    let disputedCount = 0;
    let completedCount = 0;
    let totalRefundedAmount = 0;

    payments.forEach((p) => {
      const s = (p.payment_status || '').toLowerCase();
      if (s === 'refund_requested' || s === 'pending') {
        pendingCount++;
      } else if (s === 'refunded') {
        refundedCount++;
        totalRefundedAmount += p.refundAmount || p.amount || 0;
      } else if (s === 'disputed') {
        disputedCount++;
      } else {
        completedCount++;
      }
    });

    return {
      total: payments.length,
      pendingCount,
      refundedCount,
      disputedCount,
      completedCount,
      totalRefundedAmount,
    };
  }, [payments]);

  // Filtered payments list
  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      // Status filter
      if (statusFilter !== 'all') {
        const s = (p.payment_status || '').toLowerCase();
        if (statusFilter === 'Refund_Requested' && s !== 'refund_requested' && s !== 'pending') {
          return false;
        }
        if (statusFilter === 'Refunded' && s !== 'refunded') {
          return false;
        }
        if (statusFilter === 'Disputed' && s !== 'disputed') {
          return false;
        }
        if (statusFilter === 'Completed' && s !== 'completed' && s !== 'success') {
          return false;
        }
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTxn = p.transactionId?.toLowerCase().includes(q);
        const matchesStudent =
          p.user?.name?.toLowerCase().includes(q) ||
          p.user?.email?.toLowerCase().includes(q);
        const matchesCourse =
          p.course?.title?.toLowerCase().includes(q) ||
          p.course?.titleEn?.toLowerCase().includes(q);
        const matchesReason = p.refundReason?.toLowerCase().includes(q);

        if (!matchesTxn && !matchesStudent && !matchesCourse && !matchesReason) {
          return false;
        }
      }

      return true;
    });
  }, [payments, statusFilter, searchQuery]);

  const handleOpenModal = (payment: RefundPaymentItem) => {
    setSelectedPayment(payment);
    setIsModalOpen(true);
  };

  const handleModalSuccess = (
    paymentId: string,
    decision: 'Approved' | 'Rejected',
    refundReason: string
  ) => {
    setPayments((prev) =>
      prev.map((item) => {
        if (item.id === paymentId) {
          return {
            ...item,
            payment_status: decision === 'Approved' ? 'Refunded' : 'Completed',
            decision,
            refundReason,
            refundAmount: decision === 'Approved' ? item.amount : 0,
            refundedAt: decision === 'Approved' ? new Date().toISOString() : undefined,
            enrollment: item.enrollment
              ? {
                  ...item.enrollment,
                  paymentStatus: decision === 'Approved' ? 'Cancelled' : 'success',
                }
              : null,
          };
        }
        return item;
      })
    );

    setNotification({
      type: 'success',
      message:
        decision === 'Approved'
          ? `Refund successfully processed. Course access revoked and platform financial balance adjusted.`
          : `Dispute rejected. Student active enrollment access maintained.`,
    });

    setTimeout(() => {
      setNotification(null);
    }, 6000);
  };

  const handleSeedDemoData = async () => {
    setIsSeeding(true);
    try {
      const res = await seedDemoRefundRequestsAction();
      if (res.success) {
        setNotification({
          type: 'success',
          message: res.message || 'Demo refund records generated successfully.',
        });
        window.location.reload();
      } else {
        setNotification({
          type: 'error',
          message: res.error || 'Failed to generate demo refund records.',
        });
      }
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: err.message || 'Error executing demo seed.',
      });
    } finally {
      setIsSeeding(false);
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
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`flex items-center justify-between gap-3 rounded-xl border p-4 text-sm font-medium shadow-lg animate-in slide-in-from-top-2 ${
            notification.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300'
              : 'bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {notification.type === 'success' ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <XCircle className="h-5 w-5 text-rose-600 dark:text-rose-400 shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-xs opacity-70 hover:opacity-100 uppercase font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-2xl border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Pending Requests
              </p>
              <h3 className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
                {metrics.pendingCount}
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Awaiting admin review</p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <AlertTriangle className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Approved Refunds
              </p>
              <h3 className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">
                {metrics.refundedCount}
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Enrollments revoked</p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <RotateCcw className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Total Reconciled
              </p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                ৳{metrics.totalRefundedAmount.toLocaleString()}
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Disbursed back to students</p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <DollarSign className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Total Payment Logs
              </p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                {metrics.total}
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Linked to enrollments</p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Layers className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Controls & Filters Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        {/* Status Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              statusFilter === 'all'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
            }`}
          >
            All ({metrics.total})
          </button>
          <button
            onClick={() => setStatusFilter('Refund_Requested')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              statusFilter === 'Refund_Requested'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-amber-700 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/60'
            }`}
          >
            <AlertTriangle className="h-3 w-3" />
            <span>Pending ({metrics.pendingCount})</span>
          </button>
          <button
            onClick={() => setStatusFilter('Refunded')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              statusFilter === 'Refunded'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-rose-700 bg-rose-50 dark:bg-rose-950/40 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/60'
            }`}
          >
            <RotateCcw className="h-3 w-3" />
            <span>Refunded ({metrics.refundedCount})</span>
          </button>
          <button
            onClick={() => setStatusFilter('Disputed')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              statusFilter === 'Disputed'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-purple-700 bg-purple-50 dark:bg-purple-950/40 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/60'
            }`}
          >
            Disputed ({metrics.disputedCount})
          </button>
          <button
            onClick={() => setStatusFilter('Completed')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              statusFilter === 'Completed'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60'
            }`}
          >
            Completed ({metrics.completedCount})
          </button>
        </div>

        {/* Search & Demo Seed Button */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search TXN, student, course..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleSeedDemoData}
            disabled={isSeeding}
            className="rounded-xl border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-xs shrink-0 flex items-center gap-1.5 font-semibold"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>{isSeeding ? 'Seeding...' : 'Demo Data'}</span>
          </Button>
        </div>
      </div>

      {/* Payments Reconciliation Table */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        {filteredPayments.length === 0 ? (
          <div className="py-16 text-center px-4">
            <div className="mx-auto h-12 w-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-3">
              <DollarSign className="h-6 w-6" />
            </div>
            <h4 className="font-bold text-slate-800 dark:text-slate-200 text-base">
              No refund or dispute records found
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1">
              There are no payment records matching your current filter criteria. You can click &quot;Demo Data&quot; to populate realistic student refund records.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                  <th className="py-3.5 px-4">Transaction & Method</th>
                  <th className="py-3.5 px-4">Student</th>
                  <th className="py-3.5 px-4">Course & Enrollment</th>
                  <th className="py-3.5 px-4 text-right">Amount</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {filteredPayments.map((p) => {
                  const isPending =
                    p.payment_status === 'Refund_Requested' ||
                    p.payment_status === 'Pending' ||
                    p.payment_status === 'Disputed';
                  const isRefunded = p.payment_status === 'Refunded';

                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Transaction ID & Method */}
                      <td className="py-3.5 px-4">
                        <div className="font-mono font-bold text-slate-900 dark:text-white">
                          {p.transactionId}
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-400 text-[11px] mt-0.5">
                          <CreditCard className="h-3 w-3" />
                          <span>{p.paymentMethod}</span>
                          <span>•</span>
                          <span>{new Date(p.createdAt).toLocaleDateString()}</span>
                        </div>
                      </td>

                      {/* Student */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {p.user?.name || 'Unknown Student'}
                        </div>
                        <div className="text-slate-400 text-[11px]">
                          {p.user?.email || 'N/A'}
                        </div>
                      </td>

                      {/* Course & Enrollment Status */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="font-medium text-slate-900 dark:text-white truncate">
                          {p.course?.title || p.course?.titleEn || 'Course ID: ' + p.courseId}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span
                            className={`inline-flex items-center gap-1 text-[11px] font-semibold ${
                              p.enrollment?.paymentStatus === 'Cancelled'
                                ? 'text-rose-600 dark:text-rose-400'
                                : p.enrollment?.paymentStatus === 'success' ||
                                  p.enrollment?.paymentStatus === 'GRANTED'
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-slate-500'
                            }`}
                          >
                            <Layers className="h-3 w-3" />
                            <span>Access: {p.enrollment?.paymentStatus || 'No Enrollment'}</span>
                          </span>
                        </div>
                      </td>

                      {/* Amount */}
                      <td className="py-3.5 px-4 text-right">
                        <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                          ৳{p.amount.toLocaleString()}
                        </span>
                        {isRefunded && (
                          <div className="text-[10px] text-rose-500 font-semibold">
                            -৳{p.refundAmount?.toLocaleString() || p.amount.toLocaleString()}
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center">
                        {getStatusBadge(p.payment_status)}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <Button
                          size="sm"
                          onClick={() => handleOpenModal(p)}
                          className={`rounded-xl text-xs font-semibold px-3 py-1.5 flex items-center gap-1.5 ml-auto ${
                            isPending
                              ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/20 shadow-sm'
                              : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200'
                          }`}
                        >
                          {isPending ? (
                            <>
                              <RotateCcw className="h-3 w-3" />
                              <span>Evaluate Dispute</span>
                            </>
                          ) : (
                            <>
                              <span>Inspect Reconciliation</span>
                              <ChevronRight className="h-3 w-3" />
                            </>
                          )}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {selectedPayment && (
        <RefundReconciliationModal
          payment={selectedPayment}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedPayment(null);
          }}
          onSuccess={handleModalSuccess}
        />
      )}
    </div>
  );
}
