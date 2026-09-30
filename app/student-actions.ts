'use server';

import { auth } from '@/auth';
import dbConnect from '@/lib/mongoose';
import InstructorRequest from '@/models/InstructorRequest';
import { revalidatePath } from 'next/cache';

export async function requestInstructorRole(formData: FormData) {
  const session = await auth();
  const userId = (session?.user as { id?: string; role?: string } | undefined)?.id;
  const role = (session?.user as { role?: string } | undefined)?.role;
  const reason = String(formData.get('reason') || '').trim();

  if (!userId || role !== 'STUDENT') return { error: 'Only students can submit this request.' };
  if (reason.length < 20) return { error: 'Please provide at least 20 characters explaining your experience.' };

  await dbConnect();
  
  const existing = await InstructorRequest.findOne({ userId });
  if (existing && ['PENDING', 'ADMIN_APPROVED', 'SUPERADMIN_APPROVED', 'APPROVED'].includes(existing.status)) {
    return { error: 'You already have an active instructor request.' };
  }

  await InstructorRequest.findOneAndUpdate(
    { userId },
    { reason, status: 'PENDING', adminApprovedAt: null, superadminApprovedAt: null, reviewedAt: null },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  revalidatePath('/student');
  revalidatePath('/admin/dashboard');
  return { success: true };
}
