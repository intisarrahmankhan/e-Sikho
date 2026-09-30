'use server';

import { prisma } from '@/lib/prisma';

export async function getPaginatedUsers({
  page = 1,
  limit = 25,
  searchEmail = ''
}: {
  page?: number;
  limit?: number;
  searchEmail?: string;
}) {
  const skip = (page - 1) * limit;
  
  // We want to fetch all users but allow searching by email
  const where = searchEmail
    ? { email: { contains: searchEmail, mode: 'insensitive' as const } }
    : {};

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, email: true, role: true, status: true, createdAt: true },
    }),
    prisma.user.count({ where }),
  ]);

  return { users, total };
}
