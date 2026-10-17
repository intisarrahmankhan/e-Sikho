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
  ShieldCheck,
  CreditCard,
  Building,
  User,
  Clock,
  Send,
  Eye,
  RefreshCw,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Receipt,
  FileSpreadsheet,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import PayoutInspectionModal, { PayoutRequestItem } from '@/components/admin/PayoutInspectionModal';
import { seedDemoPayoutRequestsAction } from '@/actions/financial';

interface PayoutManagementQueueProps {
  initialRequests: PayoutRequestItem[];
  initialLedgerEntries?: any[];
  initialMetrics?: {
    totalCount: number;
    totalVolume: number;
    pendingCount: number;
    pendingAmount: number;
    approvedCount: number;
    approvedAmount: number;
    disbursedCount: number;
    disbursedAmount: number;
    rejectedCount: number;
    rejectedAmount: number;
  } | null;
}

export default function PayoutManagementQueue({
  initialRequests,
  initialLedgerEntries = [],
  initialMetrics,
}: PayoutManagementQueueProps) {
  const [requests, setRequests] = useState<PayoutRequestItem[]>(initialRequests);
  const [ledgerEntries, setLedgerEntries] = useState<any[]>(initialLedgerEntries);
  const [statusFilter, setStatusFilter] = useState<'all' | 'PENDING' | 'APPROVED' | 'DISBURSED' | 'REJECTED'>('all');
  const [providerFilter, setProviderFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewTab, setViewTab] = useState<'queue' | 'ledger'>('queue');
  const [selectedPayout, setSelectedPayout] = useState<PayoutRequestItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Compute live metrics dynamically
  const metrics = useMemo(() => {
    let pendingCount = 0;
    let pendingAmount = 0;
    let approvedCount = 0;
    let approvedAmount = 0;
    let disbursedCount = 0;
    let disbursedAmount = 0;
    let rejectedCount = 0;
    let rejectedAmount = 0;
    let totalVolume = 0;

    requests.forEach((r) => {
      const amt = r.amount || 0;
      totalVolume += amt;
      const st = (r.status || '').toUpperCase();
      if (st === 'PENDING' || st === 'REQUESTED') {
        pendingCount++;
        pendingAmount += amt;
      } else if (st === 'APPROVED') {
        approvedCount++;
        approvedAmount += amt;
      } else if (st === 'DISBURSED') {
        disbursedCount++;
        disbursedAmount += amt;
      } else if (st === 'REJECTED') {
        rejectedCount++;
        rejectedAmount += amt;
      }
    });

    return {
      total: requests.length,
      totalVolume,
      pendingCount,
      pendingAmount,
      approvedCount,
      approvedAmount,
      disbursedCount,
      disbursedAmount,
      rejectedCount,
      rejectedAmount,
    };
  }, [requests]);

  // Filtered requests
  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      // Status filter
      if (statusFilter !== 'all') {
        const st = (r.status || '').toUpperCase();
        if (statusFilter === 'PENDING') {
          if (st !== 'PENDING' && st !== 'REQUESTED') return false;
        } else if (st !== statusFilter) {
          return false;
        }
      }

      // Provider filter
      if (providerFilter !== 'all') {
        if (r.mfsProvider !== providerFilter) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const instructorName = r.user?.name?.toLowerCase() || '';
        const instructorEmail = r.user?.email?.toLowerCase() || '';
        const mfsNumber = r.mfsNumber?.toLowerCase() || '';
        const txnId = r.transactionId?.toLowerCase() || '';
        const bankName = r.bankName?.toLowerCase() || '';

        return (
          instructorName.includes(query) ||
          instructorEmail.includes(query) ||
          mfsNumber.includes(query) ||
          txnId.includes(query) ||
          bankName.includes(query)
        );
      }

      return true;
    });
  }, [requests, statusFilter, providerFilter, searchQuery]);

  const handleOpenInspect = (payout: PayoutRequestItem) => {
    setSelectedPayout(payout);
    setIsModalOpen(true);
  };

  const handlePayoutUpdated = (updated: PayoutRequestItem) => {
    setRequests((prev) =>
      prev.map((item) => (item.id === updated.id || (item as any)._id === updated.id ? updated : item))
    );
    setNotification({
      type: 'success',
      message: `Payout request #${updated.id.slice(-6)} updated to ${updated.status}.`,
    });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleSeedDemo = async () => {
    setIsSeeding(true);
    try {
      const res = await seedDemoPayoutRequestsAction();
      if (res.success) {
        setNotification({
          type: 'success',
          message: res.message || 'Demo payout workflows seeded successfully! Refreshing...',
        });
        setTimeout(() => {
          window.location.reload();
        }, 1200);
      } else {
        setNotification({
          type: 'error',
          message: res.error || 'Failed to seed demo payouts.',
        });
      }
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: err?.message || 'Error executing demo seed.',
      });
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`flex items-center justify-between p-4 rounded-xl border text-sm font-medium transition-all ${
            notification.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300'
              : 'bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-rose-500" />
            )}
            <span>{notification.message}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            ✕
          </button>
        </div>
      )}

      {/* KPI Summary Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Pending Approvals */}
        <Card className="border border-amber-200 dark:border-amber-900/50 bg-gradient-to-br from-amber-50/50 via-white to-amber-50/20 dark:from-amber-950/20 dark:via-slate-900 dark:to-amber-950/10 shadow-sm">
          <CardContent className="p-4 sm:p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider mb-1">
                Pending Approvals
              </p>
              <h3 className="text-2xl font-extrabold text-amber-900 dark:text-amber-200">
                {metrics.pendingCount}
              </h3>
              <p className="text-xs font-semibold text-amber-600 dark:text-amber-400/80 mt-1">
                ৳{metrics.pendingAmount.toLocaleString()} in escrow hold
              </p>
            </div>
            <div className="h-11 w-11 rounded-xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
              <Clock className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        {/* 2. Approved & Awaiting Transfer */}
        <Card className="border border-blue-200 dark:border-blue-900/50 bg-gradient-to-br from-blue-50/50 via-white to-blue-50/20 dark:from-blue-950/20 dark:via-slate-900 dark:to-blue-950/10 shadow-sm">
          <CardContent className="p-4 sm:p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider mb-1">
                Approved (Ready)
              </p>
              <h3 className="text-2xl font-extrabold text-blue-900 dark:text-blue-200">
                {metrics.approvedCount}
              </h3>
              <p className="text-xs font-semibold text-blue-600 dark:text-blue-400/80 mt-1">
                ৳{metrics.approvedAmount.toLocaleString()} awaiting disbursal
              </p>
            </div>
            <div className="h-11 w-11 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
              <ShieldCheck className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        {/* 3. Disbursed via Ledger */}
        <Card className="border border-emerald-200 dark:border-emerald-900/50 bg-gradient-to-br from-emerald-50/50 via-white to-emerald-50/20 dark:from-emerald-950/20 dark:via-slate-900 dark:to-emerald-950/10 shadow-sm">
          <CardContent className="p-4 sm:p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider mb-1">
                Disbursed via Ledger
              </p>
              <h3 className="text-2xl font-extrabold text-emerald-900 dark:text-emerald-200">
                {metrics.disbursedCount}
              </h3>
              <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400/80 mt-1">
                ৳{metrics.disbursedAmount.toLocaleString()} outflow cleared
              </p>
            </div>
            <div className="h-11 w-11 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
              <Send className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        {/* 4. Rejected / Reimbursed */}
        <Card className="border border-rose-200 dark:border-rose-900/50 bg-gradient-to-br from-rose-50/50 via-white to-rose-50/20 dark:from-rose-950/20 dark:via-slate-900 dark:to-rose-950/10 shadow-sm">
          <CardContent className="p-4 sm:p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider mb-1">
                Rejected / Refunded
              </p>
              <h3 className="text-2xl font-extrabold text-rose-900 dark:text-rose-200">
                {metrics.rejectedCount}
              </h3>
              <p className="text-xs font-semibold text-rose-600 dark:text-rose-400/80 mt-1">
                ৳{metrics.rejectedAmount.toLocaleString()} returned to wallet
              </p>
            </div>
            <div className="h-11 w-11 rounded-xl bg-rose-100 dark:bg-rose-900/40 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
              <XCircle className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* View Switcher & Action Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Toggle between Queue view and Ledger view */}
        <div className="inline-flex p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setViewTab('queue')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewTab === 'queue'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Receipt className="h-3.5 w-3.5" />
            <span>Payout Workflow Queue</span>
            <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
              {requests.length}
            </span>
          </button>
          <button
            onClick={() => setViewTab('ledger')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewTab === 'ledger'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <FileSpreadsheet className="h-3.5 w-3.5" />
            <span>Financial Ledger Audit</span>
            {ledgerEntries.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                {ledgerEntries.length}
              </span>
            )}
          </button>
        </div>

        {/* Demo Data Seeder */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSeedDemo}
            disabled={isSeeding}
            className="text-xs border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
          >
            <Sparkles className={`h-3.5 w-3.5 mr-1.5 text-indigo-500 ${isSeeding ? 'animate-spin' : ''}`} />
            <span>{isSeeding ? 'Generating Sample Workflows...' : 'Seed Sample Payouts'}</span>
          </Button>
        </div>
      </div>

      {viewTab === 'queue' ? (
        <>
          {/* Status Tabs, Filters & Search Bar */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Status Filter Tabs */}
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { key: 'all', label: 'All Requests', count: requests.length },
                { key: 'PENDING', label: 'Pending', count: metrics.pendingCount, alert: metrics.pendingCount > 0 },
                { key: 'APPROVED', label: 'Approved', count: metrics.approvedCount },
                { key: 'DISBURSED', label: 'Disbursed', count: metrics.disbursedCount },
                { key: 'REJECTED', label: 'Rejected', count: metrics.rejectedCount },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setStatusFilter(tab.key as any)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    statusFilter === tab.key
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                      : 'bg-white dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                      statusFilter === tab.key
                        ? 'bg-white/20 text-white dark:bg-slate-900/20 dark:text-slate-900'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {tab.count}
                  </span>
                  {tab.alert && <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />}
                </button>
              ))}
            </div>

            {/* Provider Filter and Search Input */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <select
                value={providerFilter}
                onChange={(e) => setProviderFilter(e.target.value)}
                className="text-xs p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
              >
                <option value="all">All Channels</option>
                <option value="BKASH">bKash</option>
                <option value="NAGAD">Nagad</option>
                <option value="ROCKET">Rocket</option>
                <option value="BANK">Bank Transfer</option>
              </select>

              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search Instructor, MFS, TXN..."
                  className="pl-8 pr-3 py-1.5 text-xs w-full sm:w-56 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                />
              </div>
            </div>
          </div>

          {/* Table Container */}
          <Card className="border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden bg-white dark:bg-slate-900">
            {filteredRequests.length === 0 ? (
              <div className="p-12 text-center">
                <div className="h-12 w-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500 mx-auto flex items-center justify-center mb-3">
                  <Receipt className="h-6 w-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  No Payout Requests Found
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-4 max-w-sm mx-auto">
                  {searchQuery || statusFilter !== 'all' || providerFilter !== 'all'
                    ? 'No payout requests matched your current active filter parameters.'
                    : 'The payout processing queue is currently clear. No pending instructor withdrawal requests.'}
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleSeedDemo}
                  disabled={isSeeding}
                  className="text-xs text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                >
                  <Sparkles className="h-3.5 w-3.5 mr-1.5 text-indigo-500" />
                  Seed Demo Payout Requests
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase font-semibold tracking-wider">
                    <tr>
                      <th className="px-5 py-3.5">Instructor</th>
                      <th className="px-5 py-3.5">Requested Amount</th>
                      <th className="px-5 py-3.5">Payout Method</th>
                      <th className="px-5 py-3.5">Workflow Status</th>
                      <th className="px-5 py-3.5">Timeline</th>
                      <th className="px-5 py-3.5 text-right">Ledger Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {filteredRequests.map((r) => {
                      const isPending = r.status === 'PENDING' || r.status === 'REQUESTED';
                      const isApproved = r.status === 'APPROVED';
                      const isDisbursed = r.status === 'DISBURSED';
                      const isRejected = r.status === 'REJECTED';

                      return (
                        <tr
                          key={r.id || (r as any)._id}
                          className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                        >
                          {/* Instructor Details */}
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-sm">
                                {r.user?.name?.charAt(0) || 'I'}
                              </div>
                              <div className="min-w-0">
                                <p className="font-bold text-slate-900 dark:text-white truncate">
                                  {r.user?.name || 'Instructor'}
                                </p>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                                  {r.user?.email || `ID: ${r.userId.slice(-6)}`}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* Requested Amount */}
                          <td className="px-5 py-4">
                            <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                              ৳{r.amount.toLocaleString()}
                            </span>
                            <span className="text-[10px] text-slate-400 block mt-0.5">
                              Net payout
                            </span>
                          </td>

                          {/* Method / Account */}
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-1.5">
                              {r.mfsProvider === 'BANK' ? (
                                <Building className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                              ) : (
                                <CreditCard className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                              )}
                              <span className="font-semibold text-slate-800 dark:text-slate-200">
                                {r.mfsProvider}
                              </span>
                            </div>
                            <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 block mt-0.5">
                              {r.mfsNumber}
                            </span>
                          </td>

                          {/* Workflow Status Badge */}
                          <td className="px-5 py-4">
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
                              className={`text-[10px] uppercase font-bold tracking-wider inline-flex items-center gap-1 ${
                                isPending
                                  ? 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300'
                                  : isApproved
                                  ? 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/60 dark:text-blue-300'
                                  : isDisbursed
                                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300'
                                  : 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300'
                              }`}
                            >
                              {isPending && <Clock className="h-3 w-3" />}
                              {isApproved && <ShieldCheck className="h-3 w-3" />}
                              {isDisbursed && <CheckCircle2 className="h-3 w-3" />}
                              {isRejected && <XCircle className="h-3 w-3" />}
                              <span>{r.status}</span>
                            </Badge>
                            {isDisbursed && r.transactionId && (
                              <span className="text-[10px] font-mono text-slate-500 block mt-1 truncate max-w-[130px]">
                                TXN: {r.transactionId}
                              </span>
                            )}
                          </td>

                          {/* Timeline */}
                          <td className="px-5 py-4 text-slate-500 dark:text-slate-400">
                            <div>
                              {new Date(r.requestedAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                              })}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {new Date(r.requestedAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </div>
                          </td>

                          {/* Actions */}
                          <td className="px-5 py-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleOpenInspect(r)}
                                className="text-xs h-7 px-2.5 font-semibold border-slate-200 dark:border-slate-700 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-slate-800"
                              >
                                <Eye className="h-3.5 w-3.5 mr-1" />
                                Inspect
                              </Button>

                              {isPending && (
                                <Button
                                  size="sm"
                                  onClick={() => handleOpenInspect(r)}
                                  className="text-xs h-7 px-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
                                >
                                  Review
                                </Button>
                              )}

                              {isApproved && (
                                <Button
                                  size="sm"
                                  onClick={() => handleOpenInspect(r)}
                                  className="text-xs h-7 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                                >
                                  <Send className="h-3 w-3 mr-1" />
                                  Disburse
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      ) : (
        /* Financial Ledger View */
        <Card className="border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden bg-white dark:bg-slate-900">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-indigo-500" />
                <span>Immutable Financial Ledger Transactions</span>
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Complete double-entry accounting records: Course Inflows, Escrow Payout Holds, Disbursements, and Reversals.
              </p>
            </div>
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 font-mono">
              {ledgerEntries.length} Records
            </span>
          </div>

          {ledgerEntries.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              No financial ledger entries recorded yet. Click "Seed Sample Payouts" to populate audit trails.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="px-4 py-3">Reference / ID</th>
                    <th className="px-4 py-3">Entry Type</th>
                    <th className="px-4 py-3">Direction</th>
                    <th className="px-4 py-3">Amount</th>
                    <th className="px-4 py-3">Account Type</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Description</th>
                    <th className="px-4 py-3">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono">
                  {ledgerEntries.map((e) => (
                    <tr key={e.id || e._id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                      <td className="px-4 py-3 font-bold text-indigo-600 dark:text-indigo-400">
                        {e.referenceId || e._id?.slice(-8)}
                      </td>
                      <td className="px-4 py-3 font-sans font-semibold text-slate-800 dark:text-slate-200">
                        {e.entryType}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            e.direction === 'DEBIT'
                              ? 'bg-rose-100 text-rose-700'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {e.direction}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">
                        ৳{e.amount?.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400 font-sans text-[11px]">
                        {e.accountType}
                      </td>
                      <td className="px-4 py-3 font-sans">
                        <Badge
                          variant={e.status === 'CLEARED' ? 'secondary' : 'outline'}
                          className={`text-[10px] font-bold ${
                            e.status === 'CLEARED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : e.status === 'REVERSED'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {e.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300 font-sans text-[11px] max-w-xs truncate">
                        {e.description}
                      </td>
                      <td className="px-4 py-3 text-slate-400 text-[10px] font-sans">
                        {new Date(e.createdAt || Date.now()).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* Payout Inspection Modal */}
      <PayoutInspectionModal
        payout={selectedPayout}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handlePayoutUpdated}
      />
    </div>
  );
}
