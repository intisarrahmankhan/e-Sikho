import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import { checkRateLimit } from '@/lib/rateLimit';

import dbConnect from '@/lib/mongoose';
import Enrollment from '@/models/Enrollment';
import Course from '@/models/Course';
import User from '@/models/User';
import { processEnrollmentCommission } from '@/actions/financial';
import { isValidMongoObjectId } from '@/lib/auth-helpers';

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || req.ip || 'unknown-ip';
    if (!checkRateLimit(ip, 5, 60000)) { // 5 requests per minute per IP
      return NextResponse.json({ message: 'Too many requests. Try again later.' }, { status: 429 });
    }

    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json(
        { message: 'অ্যানঅথরাইজড। লগইন করুন।' },
        { status: 401 }
      );
    }

    const rawUserId = (session.user as any).id;
    const userEmail = (session.user as any).email;
    if (!rawUserId && !userEmail) {
      return NextResponse.json(
        { message: 'ইউজার আইডি পাওয়া যায়নি।' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { courseId, status } = body as { courseId: string; status: string };

    // Validate required fields
    if (!courseId || !status) {
      return NextResponse.json(
        { message: 'courseId এবং status আবশ্যক।' },
        { status: 400 }
      );
    }

    // Only accept known statuses
    const validStatuses = ['success', 'failed', 'pending'] as const;
    type ValidStatus = (typeof validStatuses)[number];

    if (!validStatuses.includes(status as ValidStatus)) {
      return NextResponse.json(
        { message: 'অবৈধ payment status।' },
        { status: 400 }
      );
    }

    // Status-specific messages (Bangla)
    const messages: Record<ValidStatus, string> = {
      success: 'পেমেন্ট সফল হয়েছে এবং কোর্সে ভর্তি নিশ্চিত হয়েছে।',
      failed: 'পেমেন্ট ব্যর্থ হয়েছে। কার্ড/মোবাইল তথ্য যাচাই করুন।',
      pending: 'পেমেন্ট যাচাই প্রক্রিয়াধীন। নিশ্চিত হলে ইমেইলে জানানো হবে।',
    };

    await dbConnect();

    // Resolve safe userId
    let userId = rawUserId;
    if (!isValidMongoObjectId(userId) && userEmail) {
      const u = (await User.findOne({ email: userEmail }).select('_id').lean()) as any;
      if (u) userId = u._id.toString();
    }
    if (!userId) {
      return NextResponse.json(
        { message: 'ইউজার অ্যাকাউন্ট যাচাই করা যায়নি।' },
        { status: 401 }
      );
    }

    // Check course existence
    let course: any = null;
    if (isValidMongoObjectId(courseId)) {
      course = await Course.findById(courseId).select('price originalPrice createdById studentsEnrolled isEarlyBird earlyBirdUntil createdAt');
    }

    // 1. Prevent self-enrollment (instructors cannot enroll in their own course)
    if (course && course.createdById && course.createdById.toString() === userId.toString()) {
      return NextResponse.json(
        { message: 'ইন্সট্রাক্টরগণ তাদের নিজস্ব কোর্সে শিক্ষার্থী হিসেবে এনরোল করতে পারবেন না।' },
        { status: 400 }
      );
    }

    // 2. Prevent duplicate enrollment
    const existingEnrollment = await Enrollment.findOne({
      userId,
      courseId,
      paymentStatus: { $in: ['success', 'GRANTED', 'granted'] },
    });

    if (existingEnrollment) {
      return NextResponse.json(
        { message: 'আপনি ইতিমধ্যে এই কোর্সে এনরোল করেছেন।' },
        { status: 400 }
      );
    }

    const transactionId = `TXN-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)
      .toUpperCase()}`;

    // Save enrollment to DB
    const enrollment = await Enrollment.findOneAndUpdate(
      {
        userId,
        courseId,
      },
      {
        paymentStatus: status,
        transactionId: status === 'success' ? transactionId : null,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    if (status === 'success') {
      try {
        revalidatePath('/student');
        revalidatePath('/instructor');
        revalidatePath(`/courses/${courseId}`);
      } catch {}
      if (course) {
        await Course.findByIdAndUpdate(courseId, { $inc: { studentsEnrolled: 1 } });
        if (course.price > 0) {
          await processEnrollmentCommission(enrollment._id.toString(), courseId, course.price);
        }
      }
    }

    const response = {
      transactionId,
      courseId,
      status: status as ValidStatus,
      message: messages[status as ValidStatus],
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Payment confirm error:', error);
    return NextResponse.json(
      { message: 'সার্ভার ত্রুটি। পরে আবার চেষ্টা করুন।' },
      { status: 500 }
    );
  }
}
