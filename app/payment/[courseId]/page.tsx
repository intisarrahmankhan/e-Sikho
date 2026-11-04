import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';
import { notFound, redirect } from 'next/navigation';
import { getDemoPurchaseCheckoutStatus } from '@/actions/demo-purchases';
import { isValidMongoObjectId } from '@/lib/auth-helpers';
import { isDemoCheckoutEnabled } from '@/lib/demo-checkout';
import dbConnect from '@/lib/mongoose';
import Course from '@/models/Course';
import DemoCheckout from './DemoCheckout';

export default async function PaymentPage({ params }: { params: { courseId: string } }) {
  const courseId = params.courseId.trim();

  if (isDemoCheckoutEnabled()) {
    if (!isValidMongoObjectId(courseId)) notFound();

    await dbConnect();
    const course = await Course.findOne({ _id: courseId, status: 'PUBLISHED', approvalStatus: 'APPROVED' })
      .select('title titleEn price')
      .lean();
    if (!course || !Number.isFinite(course.price) || course.price < 0) notFound();

    const savedCourseId = String(course._id);
    if (course.price === 0) redirect(`/courses/${savedCourseId}`);

    const status = await getDemoPurchaseCheckoutStatus(savedCourseId);
    return <DemoCheckout courseId={savedCourseId} title={course.title} titleEn={course.titleEn} price={course.price} initialStatus={status} />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center space-y-4">
        <ShieldCheck className="mx-auto h-12 w-12 text-primary-600" />
        <h1 className="text-xl font-bold text-slate-900">পেমেন্ট এখনো চালু হয়নি</h1>
        <p className="text-sm text-slate-600">
          অনলাইন পেমেন্ট বর্তমানে উপলব্ধ নয়। কোর্সে ভর্তির তথ্যের জন্য প্ল্যাটফর্মের অ্যাডমিনের সাথে যোগাযোগ করুন।
        </p>
        <Link href={`/courses/${encodeURIComponent(courseId)}`} className="inline-block rounded-lg bg-primary-600 px-5 py-2.5 text-white">
          কোর্সে ফিরে যান
        </Link>
      </div>
    </div>
  );
}
