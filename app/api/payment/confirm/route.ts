import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json(
        { message: 'অ্যানঅথরাইজড। লগইন করুন।' },
        { status: 401 }
      );
    }

    const userId = (session.user as any).id;
    if (!userId) {
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

    const transactionId = `TXN-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)
      .toUpperCase()}`;

    // Save enrollment to DB
    await prisma.enrollment.upsert({
      where: {
        userId_courseId: {
          userId,
          courseId,
        },
      },
      update: {
        paymentStatus: status,
        transactionId: status === 'success' ? transactionId : null,
      },
      create: {
        userId,
        courseId,
        paymentStatus: status,
        transactionId: status === 'success' ? transactionId : null,
      },
    });

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
