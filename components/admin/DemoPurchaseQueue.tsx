'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { approveDemoPurchase, type getPendingDemoPurchases } from '@/actions/demo-purchases';
import { Button } from '@/components/ui/Button';

type PendingPurchasesResult = Awaited<ReturnType<typeof getPendingDemoPurchases>>;

const priceFormat = new Intl.NumberFormat('en-BD', { style: 'currency', currency: 'BDT' });
const dateFormat = new Intl.DateTimeFormat('en-GB', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'Asia/Dhaka',
});

export default function DemoPurchaseQueue({ result }: { result: PendingPurchasesResult }) {
  const router = useRouter();
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [approvedIds, setApprovedIds] = useState<string[]>([]);
  const [notice, setNotice] = useState<{ message: string; error?: boolean } | null>(null);

  async function handleApprove(id: string) {
    setApprovingId(id);
    setNotice(null);
    try {
      const response = await approveDemoPurchase(id);
      if (!response.success) {
        setNotice({ message: response.error, error: true });
        return;
      }
      setApprovedIds((previous) => [...previous, id]);
      setNotice({ message: 'Demo purchase approved. The student now has course access.' });
      router.refresh();
    } catch {
      setNotice({ message: 'The approval could not be completed. Refresh the page and try again.', error: true });
    } finally {
      setApprovingId(null);
    }
  }

  if (!result.success) {
    return <p role="alert" className="text-sm text-red-700">{result.error}</p>;
  }

  const visiblePurchases = result.purchases.filter((purchase) => !approvedIds.includes(purchase.id));

  return (
    <div className="space-y-4">
      {notice && (
        <p role={notice.error ? 'alert' : 'status'} className={notice.error ? 'text-sm text-red-700' : 'text-sm text-emerald-700'}>
          {notice.message}
        </p>
      )}
      {visiblePurchases.length === 0 ? (
        <p className="text-sm text-slate-600">No demo purchases are awaiting approval.</p>
      ) : (
        <ul className="space-y-3">
          {visiblePurchases.map((purchase) => (
            <li key={purchase.id} className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0 space-y-1">
                <p className="break-words text-sm font-semibold text-slate-900">{purchase.courseTitle}</p>
                <p className="text-sm text-slate-700">{purchase.studentName}</p>
                <p className="break-all text-xs text-slate-600">{purchase.studentEmail}</p>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{priceFormat.format(purchase.amount)}</p>
                  <time dateTime={purchase.requestedAt} className="text-xs text-slate-600">
                    {dateFormat.format(new Date(purchase.requestedAt))}
                  </time>
                </div>
                <Button
                  type="button"
                  size="lg"
                  onClick={() => handleApprove(purchase.id)}
                  disabled={approvingId !== null}
                >
                  {approvingId === purchase.id ? 'Approving…' : 'Approve Demo Purchase'}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
