'use client';

import React from 'react';
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
        <Card className="bg-emerald-50 border-emerald-100">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-emerald-100 rounded-lg text-emerald-700">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-emerald-800">Total Course Revenue</p>
              <h3 className="text-2xl font-bold text-emerald-900">৳{totalRevenue.toLocaleString()}</h3>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-indigo-50 border-indigo-100">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-indigo-100 rounded-lg text-indigo-700">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-indigo-800">Platform Commission</p>
              <h3 className="text-2xl font-bold text-indigo-900">৳{platformCommission.toLocaleString()}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-blue-50 border-blue-100">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg text-blue-700">
              <ArrowUpRight className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-blue-800">Instructor Earnings (Net)</p>
              <h3 className="text-2xl font-bold text-blue-900">৳{instructorEarnings.toLocaleString()}</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 border rounded-xl overflow-hidden bg-white">
        <div className="bg-slate-50 px-4 py-3 border-b">
          <h3 className="font-semibold text-slate-800 flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-500" />
            Instructor Payout Requests
          </h3>
        </div>
        {requests.length === 0 ? (
          <div className="p-8 text-center text-slate-500">No payout requests pending.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-600 border-b">
                <tr>
                  <th className="px-4 py-3">Instructor ID</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Method</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {requests.map(req => (
                  <tr key={req.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono text-xs">{req.userId.toString()}</td>
                    <td className="px-4 py-3 font-semibold text-emerald-600">৳{req.amount.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <div>{req.mfsProvider}</div>
                      <div className="text-xs text-slate-500">{req.mfsNumber}</div>
                    </td>
                    <td className="px-4 py-3">
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
                        <div className="flex justify-end gap-2">
                          <button
                            disabled={loading === req.id}
                            onClick={() => handleStatusUpdate(req.id, 'APPROVED')}
                            className="px-3 py-1 bg-indigo-600 text-white rounded text-xs hover:bg-indigo-700 disabled:opacity-50"
                          >
                            Approve
                          </button>
                          <button
                            disabled={loading === req.id}
                            onClick={() => handleStatusUpdate(req.id, 'REJECTED')}
                            className="px-3 py-1 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200 disabled:opacity-50"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                      {req.status === 'APPROVED' && (
                        <button
                          disabled={loading === req.id}
                          onClick={() => handleStatusUpdate(req.id, 'DISBURSED')}
                          className="px-3 py-1 bg-emerald-600 text-white rounded text-xs hover:bg-emerald-700 disabled:opacity-50"
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
