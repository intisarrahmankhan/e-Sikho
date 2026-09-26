import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/payment/cancel
 *
 * Called when the user clicks "বাতিল করুন ও ফিরে যান" on the gateway page.
 * Logs the cancellation intent and returns a structured response so the
 * client can redirect to /payment/result?status=cancelled.
 *
 * Request Body (optional): { courseId?: string }
 * Response:                { status, courseId, message, timestamp }
 */
export async function POST(req: NextRequest) {
  try {
    // Parse body — courseId may be present to log which course was abandoned
    const body     = await req.json().catch(() => ({}));
    const courseId = (body as { courseId?: string }).courseId ?? 'unknown';

    // In production: log cancellation to analytics, release any held inventory, etc.

    return NextResponse.json(
      {
        status:    'cancelled',
        courseId,
        message:   'পেমেন্ট বাতিল করা হয়েছে।',
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      { message: 'সার্ভার ত্রুটি। পরে আবার চেষ্টা করুন।' },
      { status: 500 }
    );
  }
}
