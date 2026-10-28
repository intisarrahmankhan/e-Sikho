import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';

export default function PaymentPage({ params }: { params: { courseId: string } }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center space-y-4">
        <ShieldCheck className="mx-auto h-12 w-12 text-primary-600" />
        <h1 className="text-xl font-bold text-slate-900">পেমেন্ট এখনো চালু হয়নি</h1>
        <p className="text-sm text-slate-600">
          অনলাইন পেমেন্ট বর্তমানে উপলব্ধ নয়। কোর্সে ভর্তির তথ্যের জন্য প্ল্যাটফর্মের অ্যাডমিনের সাথে যোগাযোগ করুন।
        </p>
        <Link href={`/courses/${encodeURIComponent(params.courseId)}`} className="inline-block rounded-lg bg-primary-600 px-5 py-2.5 text-white">
          কোর্সে ফিরে যান
        </Link>
      </div>
    </div>
  );
}
