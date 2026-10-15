import React from 'react';
import { notFound, redirect } from 'next/navigation';
import { auth } from '@/auth';
import { getLiveSessionDetailsAction } from '@/actions/live-class';
import { LiveClassRoom } from '@/components/live/LiveClassRoom';

export const dynamic = 'force-dynamic';

interface LivePageProps {
  params: Promise<{
    sessionId: string;
  }>;
}

export default async function LiveSessionPage({ params }: LivePageProps) {
  const { sessionId } = await params;

  if (!sessionId) {
    notFound();
  }

  const res = await getLiveSessionDetailsAction(sessionId);

  if (!res.success || !res.session) {
    notFound();
  }

  return (
    <LiveClassRoom
      initialSession={res.session}
      initialQuestions={res.questions}
      isInstructorOrAdmin={res.isInstructorOrAdmin}
      currentUserId={res.currentUserId}
    />
  );
}
