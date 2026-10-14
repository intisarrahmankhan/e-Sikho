import React from 'react';
import { notFound } from 'next/navigation';
import { getContestBySlugAction } from '@/actions/contest';
import { ContestDetailClient } from '@/components/contest/ContestDetailClient';

export const dynamic = 'force-dynamic';

interface ContestPageProps {
  params: {
    slug: string;
  };
}

export default async function ContestPage({ params }: ContestPageProps) {
  const { slug } = params;
  const res = await getContestBySlugAction(slug, false);

  if (!res.success || !res.contest) {
    notFound();
  }

  return (
    <ContestDetailClient
      contest={res.contest}
      hasSubmitted={!!res.hasSubmitted}
      submission={res.submission}
    />
  );
}
