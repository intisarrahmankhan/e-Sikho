'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { DollarSign, TrendingUp, CheckCircle, Clock, ArrowUpRight } from 'lucide-react';
import { updatePayoutStatus } from '@/actions/financial';

export default function FinancialAnalytics({
  totalRevenue,
  platformCommission,
  instructorEarnings,
  payoutRequests,
}: {
  totalRevenue: number;
  platformCommission: number;
  instructorEarnings: number;
  payoutRequests: any[];
}) {
  const [requests, setRequests] = React.useState(payoutRequests);
  const [loading, setLoading] = React.useState<string | null>(null);

  const handleStatusUpdate = async (id: string, status: 'APPROVED' | 'DISBURSED' | 'REJECTED') => {
    setLoading(id);
    let txnId: string | undefined;
    if (status === 'DISBURSED') {
      txnId = prompt('Enter Bank/MFS Transaction ID for Disbursal:') || undefined;
      if (!txnId) {
        setLoading(null);
        return;
      }
    }

    let reason: string | undefined;
    if (status === 'REJECTED') {
      reason = prompt('Enter rejection reason:') || undefined;
      if (!reason) {
        setLoading(null);
        return;
      }
    }

    const res = await updatePayoutStatus(id, status, txnId, reason);
    if (res.success) {
      setRequests(prev => prev.map(r => r.id === id ? { ...r, status, transactionId: txnId, rejectionReason: reason } : r));
    } else {
      alert(res.error);
    }
    setLoading(null);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Course Revenue */}
        <Card className="bg-white border border-slate-200/80 shadow-2xs hover:shadow-xs transition-shadow">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-600">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Course Revenue</p>
              <h3 className="text-2xl font-black text-slate-900 mt-0.5">৳{totalRevenue.toLocaleString()}</h3>
            </div>
          </CardContent>
        </Card>
        
        {/* Platform Commission */}
        <Card className="bg-white border border-slate-200/80 shadow-2xs hover:shadow-xs transition-shadow">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-600">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Platform Commission</p>
                <h3 className="text-2xl font-black text-indigo-600 mt-0.5">৳{platformCommission.toLocaleString()}</h3>
              </div>
            </div>
            <div className="text-right hidden sm:block">
              <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 block">Rules Active</span>
              <span className="text-[11px] text-slate-400 mt-0.5 block">10% Default | 5% Early Bird</span>
            </div>
          </CardContent>
        </Card>

        {/* Instructor Earnings (Net) */}
        <Card className="bg-white border border-slate-200/80 shadow-2xs hover:shadow-xs transition-shadow">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-blue-600">
              <ArrowUpRight className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Instructor Earnings (Net)</p>
              <h3 className="text-2xl font-black text-slate-900 mt-0.5">৳{instructorEarnings.toLocaleString()}</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="border border-slate-200/80 rounded-xl overflow-hidden bg-white shadow-2xs">
        <div className="bg-slate-50/80 px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
          <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-400" />
            Instructor Payout Requests
          </h3>
          <Link
            href="/admin/payouts"
            className="text-xs font-semibold text-primary-600 hover:text-primary-700 inline-flex items-center gap-1 transition"
          >
            Manage Payout Workflows & Ledger &rarr;
          </Link>
        </div>
        {requests.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs font-medium">No payout requests pending.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs sm:text-sm text-left text-slate-600">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-700 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 font-bold">Instructor ID</th>
                  <th className="px-3 py-3 font-bold">Amount</th>
                  <th className="px-3 py-3 font-bold">Method</th>
                  <th className="px-3 py-3 font-bold">Status</th>
                  <th className="px-4 py-3 text-right font-bold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {requests.map(req => (
                  <tr key={req.id} className="hover:bg-slate-50/70 transition">
                    <td className="px-4 py-3 font-mono text-xs text-slate-700 truncate max-w-[130px]" title={req.userId.toString()}>{req.userId.toString()}</td>
                    <td className="px-3 py-3 font-bold text-emerald-600">৳{req.amount.toLocaleString()}</td>
                    <td className="px-3 py-3">
                      <div className="font-medium text-slate-900">{req.mfsProvider}</div>
                      <div className="text-[11px] text-slate-400">{req.mfsNumber}</div>
                    </td>
                    <td className="px-3 py-3">
                      <Badge variant={
                        req.status === 'APPROVED' ? 'default' : 
                        req.status === 'DISBURSED' ? 'secondary' : 
                        req.status === 'REJECTED' ? 'destructive' : 'outline'
                      }>
                        {req.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {req.status === 'REQUESTED' && (
                        <div className="flex justify-end gap-1.5">
                          <button
                            disabled={loading === req.id}
                            onClick={() => handleStatusUpdate(req.id, 'APPROVED')}
                            className="px-2.5 py-1 bg-primary-600 text-white rounded-lg text-xs font-semibold hover:bg-primary-700 disabled:opacity-50 transition active:scale-[0.98]"
                          >
                            Approve
                          </button>
                          <button
                            disabled={loading === req.id}
                            onClick={() => handleStatusUpdate(req.id, 'REJECTED')}
                            className="px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold hover:bg-rose-100 disabled:opacity-50 transition active:scale-[0.98]"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                      {req.status === 'APPROVED' && (
                        <button
                          disabled={loading === req.id}
                          onClick={() => handleStatusUpdate(req.id, 'DISBURSED')}
                          className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 disabled:opacity-50 transition active:scale-[0.98]"
                        >
                          Mark Disbursed
                        </button>
                      )}
                      {req.status === 'DISBURSED' && (
                        <span className="text-xs text-slate-500 font-mono">TXN: {req.transactionId}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
