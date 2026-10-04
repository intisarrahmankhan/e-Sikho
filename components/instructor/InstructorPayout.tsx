'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { DollarSign, Wallet } from 'lucide-react';
import { requestPayout } from '@/actions/financial';

export default function InstructorPayout({
  availableBalance,
  totalEarnings,
  userId
}: {
  availableBalance: number;
  totalEarnings: number;
  userId: string;
}) {
  const [loading, setLoading] = React.useState(false);
  const [amount, setAmount] = React.useState('');
  const [provider, setProvider] = React.useState<'BKASH' | 'NAGAD' | 'ROCKET' | 'BANK'>('BKASH');
  const [number, setNumber] = React.useState('');
  const [message, setMessage] = React.useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const reqAmount = Number(amount);
    if (!reqAmount || reqAmount <= 0) {
      setMessage('Invalid amount');
      setLoading(false);
      return;
    }

    if (reqAmount > availableBalance) {
      setMessage('Insufficient balance');
      setLoading(false);
      return;
    }

    const res = await requestPayout(userId, reqAmount, provider, number);
    if (res.success) {
      setMessage('Payout requested successfully. Refresh to see updated balance.');
      setAmount('');
      setNumber('');
    } else {
      setMessage(res.error || 'Request failed');
    }
    setLoading(false);
  };

  return (
    <Card className="border-gray-200/80 p-6 shadow-sm mb-6">
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Wallet className="h-5 w-5 text-indigo-600" />
            <h2 className="text-base font-bold text-gray-900">Earnings & Payouts</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-indigo-50 rounded-xl">
              <p className="text-sm text-indigo-700 font-medium">Available Balance</p>
              <h3 className="text-2xl font-bold text-indigo-900">৳{availableBalance.toLocaleString()}</h3>
            </div>
            <div className="p-4 bg-emerald-50 rounded-xl">
              <p className="text-sm text-emerald-700 font-medium">Total Earnings</p>
              <h3 className="text-2xl font-bold text-emerald-900">৳{totalEarnings.toLocaleString()}</h3>
            </div>
          </div>
        </div>

        <div className="flex-1 border-l border-gray-100 pl-0 md:pl-6">
          <h3 className="text-sm font-bold text-gray-900 mb-4">Request Payout</h3>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-600 mb-1 block">Amount (৳)</label>
                <input 
                  type="number" 
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  max={availableBalance}
                  className="w-full text-sm p-2 border rounded-md"
                  required
                />
              </div>
              <div>
                <label className="text-xs text-gray-600 mb-1 block">Provider</label>
                <select 
                  value={provider}
                  onChange={(e) => setProvider(e.target.value as 'BKASH' | 'NAGAD' | 'ROCKET' | 'BANK')}
                  className="w-full text-sm p-2 border rounded-md"
                >
                  <option value="BKASH">bKash</option>
                  <option value="NAGAD">Nagad</option>
                  <option value="ROCKET">Rocket</option>
                  <option value="BANK">Bank Transfer</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-600 mb-1 block">Account Number</label>
              <input 
                type="text" 
                value={number}
                onChange={(e) => setNumber(e.target.value)}
                className="w-full text-sm p-2 border rounded-md"
                required
              />
            </div>
            <button 
              type="submit" 
              disabled={loading || availableBalance === 0}
              className="w-full py-2 bg-indigo-600 text-white rounded-md text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? 'Processing...' : 'Submit Request'}
            </button>
            {message && <p className="text-xs font-semibold text-center mt-2 text-indigo-700">{message}</p>}
          </form>
        </div>
      </div>
    </Card>
  );
}
