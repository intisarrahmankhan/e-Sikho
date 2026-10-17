'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  DollarSign,
  Wallet,
  Clock,
  CheckCircle2,
  XCircle,
  Building,
  CreditCard,
  Send,
  ArrowRight,
  AlertCircle,
  History,
  X,
} from 'lucide-react';
import { requestPayout, cancelPayoutRequestAction } from '@/actions/financial';

interface PayoutHistoryItem {
  id: string;
  _id?: string;
  amount: number;
  status: 'PENDING' | 'REQUESTED' | 'APPROVED' | 'DISBURSED' | 'REJECTED';
  mfsProvider: 'BKASH' | 'NAGAD' | 'ROCKET' | 'BANK';
  mfsNumber: string;
  bankName?: string;
  bankBranch?: string;
  bankAccountName?: string;
  transactionId?: string;
  rejectionReason?: string;
  requestedAt: string | Date;
  processedAt?: string | Date;
}

export default function InstructorPayout({
  availableBalance: initialAvailable,
  totalEarnings: initialEarnings,
  userId,
  initialRequests = [],
}: {
  availableBalance: number;
  totalEarnings: number;
  userId: string;
  initialRequests?: PayoutHistoryItem[];
}) {
  const [loading, setLoading] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [provider, setProvider] = useState<'BKASH' | 'NAGAD' | 'ROCKET' | 'BANK'>('BKASH');
  const [number, setNumber] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankBranch, setBankBranch] = useState('');
  const [bankAccountName, setBankAccountName] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [availableBalance, setAvailableBalance] = useState(initialAvailable);
  const [totalEarnings, setTotalEarnings] = useState(initialEarnings);
  const [requests, setRequests] = useState<PayoutHistoryItem[]>(initialRequests);

  // Compute pending balance in escrow hold
  const pendingAmount = requests
    .filter((r) => r.status === 'PENDING' || r.status === 'REQUESTED')
    .reduce((sum, r) => sum + (r.amount || 0), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const reqAmount = Number(amount);
    if (!reqAmount || reqAmount <= 0) {
      setMessage({ type: 'error', text: 'অনুগ্রহ করে একটি সঠিক টাকার পরিমাণ লিখুন।' });
      setLoading(false);
      return;
    }

    if (reqAmount > availableBalance) {
      setMessage({
        type: 'error',
        text: `অপর্যাপ্ত ব্যালেন্স। আপনার উত্তোলনযোগ্য ব্যালেন্স ৳${availableBalance.toLocaleString()}।`,
      });
      setLoading(false);
      return;
    }

    if (!number.trim()) {
      setMessage({ type: 'error', text: 'অ্যাকাউন্ট বা মোবাইল নম্বর প্রদান করুন।' });
      setLoading(false);
      return;
    }

    const bankDetails =
      provider === 'BANK'
        ? {
            bankName: bankName.trim(),
            bankBranch: bankBranch.trim(),
            bankAccountName: bankAccountName.trim(),
          }
        : undefined;

    const res = await requestPayout(userId, reqAmount, provider, number.trim(), bankDetails);
    if (res.success && res.payoutRequest) {
      setMessage({
        type: 'success',
        text: `৳${reqAmount.toLocaleString()} এর উইথড্রয়াল আবেদন সফলভাবে গ্রহণ করা হয়েছে। অ্যাডমিন রিভিউয়ের পর অ্যাকাউন্টে পাঠানো হবে।`,
      });
      setAvailableBalance((prev) => prev - reqAmount);
      setRequests((prev) => [
        {
          id: res.payoutRequest._id?.toString() || `req-${Date.now()}`,
          amount: reqAmount,
          mfsProvider: provider,
          mfsNumber: number.trim(),
          status: 'PENDING',
          bankName,
          bankBranch,
          bankAccountName,
          requestedAt: new Date().toISOString(),
        },
        ...prev,
      ]);
      setAmount('');
    } else {
      setMessage({ type: 'error', text: res.error || 'আবেদন সম্পন্ন করা সম্ভব হয়নি।' });
    }
    setLoading(false);
  };

  const handleCancelRequest = async (requestId: string, reqAmount: number) => {
    if (!confirm('আপনি কি নিশ্চিত যে এই উইথড্রয়াল আবেদনটি বাতিল করতে চান? অর্থ আপনার মূল ব্যালেন্সে ফেরত আসবে।')) {
      return;
    }

    setCancellingId(requestId);
    try {
      const res = await cancelPayoutRequestAction(requestId);
      if (res.success) {
        setRequests((prev) =>
          prev.map((r) => (r.id === requestId || r._id === requestId ? { ...r, status: 'REJECTED', rejectionReason: 'Cancelled by instructor' } : r))
        );
        setAvailableBalance((prev) => prev + reqAmount);
        setMessage({ type: 'success', text: 'উইথড্রয়াল আবেদন বাতিল হয়েছে এবং অর্থ আপনার ব্যালেন্সে যুক্ত হয়েছে।' });
      } else {
        setMessage({ type: 'error', text: res.error || 'আবেদন বাতিল করা সম্ভব হয়নি।' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.message || 'ত্রুটি ঘটেছে।' });
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <Card className="border-gray-200/80 p-6 shadow-sm mb-6 bg-white dark:bg-slate-900 overflow-hidden">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Side: Balances & Stats */}
        <div className="flex-1 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              <h2 className="text-base font-bold text-gray-900 dark:text-white">
                আয় ও উইথড্রয়াল (Earnings & Payouts)
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 rounded-xl">
              <p className="text-xs text-indigo-700 dark:text-indigo-400 font-semibold mb-1">
                উত্তোলনযোগ্য ব্যালেন্স
              </p>
              <h3 className="text-2xl font-extrabold text-indigo-900 dark:text-indigo-200">
                ৳{availableBalance.toLocaleString()}
              </h3>
              <span className="text-[10px] text-indigo-600/80 dark:text-indigo-400/80 mt-1 block">
                Available to withdraw
              </span>
            </div>

            <div className="p-4 bg-amber-50/70 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/40 rounded-xl">
              <p className="text-xs text-amber-700 dark:text-amber-400 font-semibold mb-1">
                প্রক্রিয়াধীন উইথড্রয়াল
              </p>
              <h3 className="text-2xl font-extrabold text-amber-900 dark:text-amber-200">
                ৳{pendingAmount.toLocaleString()}
              </h3>
              <span className="text-[10px] text-amber-600/80 dark:text-amber-400/80 mt-1 block">
                In-review / Held in escrow
              </span>
            </div>

            <div className="p-4 bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 rounded-xl">
              <p className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold mb-1">
                সর্বমোট উপার্জিত আয়
              </p>
              <h3 className="text-2xl font-extrabold text-emerald-900 dark:text-emerald-200">
                ৳{totalEarnings.toLocaleString()}
              </h3>
              <span className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80 mt-1 block">
                Lifetime net earnings
              </span>
            </div>
          </div>

          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
            <span className="font-semibold text-slate-800 dark:text-slate-200 block mb-0.5">
              💡 উইথড্রয়াল নীতিমালা (Payout Policy):
            </span>
            কোর্স বিক্রির পর অর্জিত অর্থ আপনার ওয়ালেটে জমা হয়। আবেদন করার পর অ্যাডমিন অ্যাকাউন্ট ভেরিফাই করে সরাসরি বিকাশ, নগদ, রকেট বা ব্যাংক অ্যাকাউন্টে পাঠিয়ে ফাইন্যান্সিয়াল লেজারে ট্রানজ্যাকশন আইডি যুক্ত করে দেবে।
          </div>
        </div>

        {/* Right Side: Request Payout Form */}
        <div className="flex-1 border-t lg:border-t-0 lg:border-l border-gray-100 dark:border-slate-800 pt-4 lg:pt-0 lg:pl-6">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-1.5">
            <Send className="h-4 w-4 text-indigo-600" />
            <span>নতুন উইথড্রয়াল আবেদন (Request Payout)</span>
          </h3>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-600 dark:text-slate-400 mb-1 block font-medium">
                  পরিমাণ (৳ Amount)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs text-slate-400 font-bold">৳</span>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    max={availableBalance}
                    min={1}
                    placeholder="৫০০ বা তদূর্ধ্ব"
                    className="w-full text-sm pl-7 pr-3 py-2 border rounded-lg dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-600 dark:text-slate-400 mb-1 block font-medium">
                  পেমেন্ট চ্যানেল (Channel)
                </label>
                <select
                  value={provider}
                  onChange={(e) => setProvider(e.target.value as any)}
                  className="w-full text-sm p-2 border rounded-lg dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                >
                  <option value="BKASH">bKash (বিকাশ)</option>
                  <option value="NAGAD">Nagad (নগদ)</option>
                  <option value="ROCKET">Rocket (রকেট)</option>
                  <option value="BANK">Bank Transfer (ব্যাংক)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-600 dark:text-slate-400 mb-1 block font-medium">
                {provider === 'BANK' ? 'ব্যাংক অ্যাকাউন্ট নম্বর (Account No)' : 'MFS মোবাইল নম্বর (Phone)'}
              </label>
              <input
                type="text"
                value={number}
                onChange={(e) => setNumber(e.target.value)}
                placeholder={provider === 'BANK' ? 'e.g. 11029384756' : 'e.g. 017XXXXXXXX'}
                className="w-full text-sm p-2 border rounded-lg dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                required
              />
            </div>

            {provider === 'BANK' && (
              <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                <div>
                  <label className="text-slate-500 mb-0.5 block">ব্যাংকের নাম</label>
                  <input
                    type="text"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="e.g. Eastern Bank PLC"
                    className="w-full p-2 border rounded-lg dark:bg-slate-800 dark:border-slate-700"
                    required
                  />
                </div>
                <div>
                  <label className="text-slate-500 mb-0.5 block">শাখা (Branch)</label>
                  <input
                    type="text"
                    value={bankBranch}
                    onChange={(e) => setBankBranch(e.target.value)}
                    placeholder="e.g. Dhanmondi Branch"
                    className="w-full p-2 border rounded-lg dark:bg-slate-800 dark:border-slate-700"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || availableBalance <= 0}
              className="w-full py-2.5 bg-indigo-600 text-white rounded-lg text-xs sm:text-sm font-bold hover:bg-indigo-700 disabled:opacity-50 transition shadow-sm mt-1"
            >
              {loading ? 'প্রক্রিয়াধীন...' : 'উইথড্রয়াল আবেদন জমা দিন'}
            </button>

            {message && (
              <div
                className={`p-2.5 rounded-lg text-xs font-medium flex items-center gap-1.5 ${
                  message.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}
              >
                {message.type === 'success' ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                )}
                <span>{message.text}</span>
              </div>
            )}
          </form>
        </div>
      </div>

      {/* Payout History & Ledger Record */}
      {requests.length > 0 && (
        <div className="mt-6 pt-5 border-t border-gray-100 dark:border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <History className="h-4 w-4 text-indigo-500" />
              <span>উইথড্রয়াল হিস্ট্রি ও স্ট্যাটাস (Payout Request History)</span>
            </h4>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              সর্বমোট {requests.length} টি আবেদন
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/40 text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="px-3 py-2.5">তারিখ</th>
                  <th className="px-3 py-2.5">পরিমাণ</th>
                  <th className="px-3 py-2.5">পদ্ধতি ও নম্বর</th>
                  <th className="px-3 py-2.5">স্ট্যাটাস</th>
                  <th className="px-3 py-2.5">লেজার ট্রানজ্যাকশন আইডি</th>
                  <th className="px-3 py-2.5 text-right">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {requests.map((req) => {
                  const reqId = req.id || req._id || '';
                  const isPending = req.status === 'PENDING' || req.status === 'REQUESTED';
                  const isApproved = req.status === 'APPROVED';
                  const isDisbursed = req.status === 'DISBURSED';
                  const isRejected = req.status === 'REJECTED';

                  return (
                    <tr key={reqId} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30">
                      <td className="px-3 py-3 text-slate-600 dark:text-slate-400">
                        {new Date(req.requestedAt).toLocaleDateString('bn-BD', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="px-3 py-3 font-bold text-slate-900 dark:text-white">
                        ৳{req.amount.toLocaleString()}
                      </td>
                      <td className="px-3 py-3">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {req.mfsProvider}
                        </span>
                        <span className="text-slate-500 font-mono text-[11px] block mt-0.5">
                          {req.mfsNumber}
                        </span>
                      </td>
                      <td className="px-3 py-3">
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
                          className={`text-[10px] font-bold ${
                            isPending
                              ? 'bg-amber-100 text-amber-800 border-amber-300'
                              : isApproved
                              ? 'bg-blue-100 text-blue-800 border-blue-300'
                              : isDisbursed
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                              : 'bg-rose-100 text-rose-800 border-rose-300'
                          }`}
                        >
                          {isPending && 'প্রক্রিয়াধীন (Pending)'}
                          {isApproved && 'অনুমোদিত (Approved)'}
                          {isDisbursed && 'পরিশোধিত (Disbursed)'}
                          {isRejected && 'বাতিল / প্রত্যাখ্যাত'}
                        </Badge>
                      </td>
                      <td className="px-3 py-3">
                        {isDisbursed && req.transactionId ? (
                          <span className="font-mono text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                            TXN: {req.transactionId}
                          </span>
                        ) : isRejected && req.rejectionReason ? (
                          <span className="text-[11px] text-rose-600 italic">
                            কারণ: {req.rejectionReason}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">—</span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-right">
                        {isPending && (
                          <button
                            type="button"
                            onClick={() => handleCancelRequest(reqId, req.amount)}
                            disabled={cancellingId === reqId}
                            className="text-xs text-rose-600 hover:text-rose-800 font-semibold hover:underline disabled:opacity-50"
                          >
                            {cancellingId === reqId ? 'বাতিল হচ্ছে...' : 'আবেদন বাতিল'}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Card>
  );
}
