import { NextResponse } from 'next/server';
import { auth } from '@/auth';

export async function POST() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ message: 'Please sign in.' }, { status: 401 });

  // Only a verified gateway callback may confirm paid enrollments.
  // No payment provider is integrated yet; never trust a client-supplied status.
  return NextResponse.json(
    { message: 'Paid checkout is unavailable until a verified payment gateway is configured.' },
    { status: 503 }
  );
}
