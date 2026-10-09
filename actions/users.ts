'use server';

import dbConnect from '@/lib/mongoose';
import User from '@/models/User';
import { auth } from '@/auth';

export async function getPaginatedUsers({
  page = 1,
  limit = 25,
  searchEmail = ''
}: {
  page?: number;
  limit?: number;
  searchEmail?: string;
}) {
  const session = await auth();
  const role = (session?.user as any)?.role;
  if (role !== 'ADMIN' && role !== 'SUPERADMIN') {
    throw new Error('Unauthorized. Admin access required.');
  }

  await dbConnect();
  const skip = (page - 1) * limit;
  
  const query = searchEmail
    ? { email: { $regex: searchEmail, $options: 'i' } }
    : {};

  const [users, total] = await Promise.all([
    User.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('_id name email phone role status createdAt')
      .lean(),
    User.countDocuments(query),
  ]);

  const formattedUsers = users.map(u => ({
    id: (u as any)._id.toString(),
    name: u.name,
    email: u.email,
    phone: (u as any).phone || '',
    role: u.role,
    status: u.status,
    createdAt: u.createdAt,
  }));

  return { users: formattedUsers, total };
}
