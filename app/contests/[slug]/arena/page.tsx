import React from 'react';
import { notFound, redirect } from 'next/navigation';
import { auth } from '@/auth';
import { getContestBySlugAction } from '@/actions/contest';
import { ContestArenaClient } from '@/components/contest/ContestArenaClient';

export const dynamic = 'force-dynamic';

interface ArenaPageProps {
  params: {
    slug: string;
  };
}

export default async function ArenaPage({ params }: ArenaPageProps) {
  const session = await auth();
  if (!session?.user) {
    redirect(`/login?callbackUrl=/contests/${params.slug}/arena`);
  }

  const { slug } = params;
  const res = await getContestBySlugAction(slug, true);

  if (!res.success || !res.contest) {
    notFound();
  }

  return <ContestArenaClient contest={res.contest} />;
}
