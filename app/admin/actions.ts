'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';

async function isReviewer() {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  return role === 'ADMIN' || role === 'SUPERADMIN' ? role : null;
}

export async function reviewInstructorRequest(requestId: string, decision: 'APPROVE' | 'REJECT') {
  const role = await isReviewer();
  if (!role) return { error: 'Unauthorized' };
  const request = await prisma.instructorRequest.findUnique({ where: { id: requestId } });
  if (!request) return { error: 'Request not found' };
  if (decision === 'REJECT') await prisma.instructorRequest.update({ where: { id: requestId }, data: { status: 'REJECTED', reviewedAt: new Date() } });
  else {
    const data = role === 'ADMIN' ? { adminApprovedAt: new Date() } : { superadminApprovedAt: new Date() };
    const next = { ...request, ...data };
    const bothApproved = Boolean(next.adminApprovedAt && next.superadminApprovedAt);
    await prisma.$transaction([
      prisma.instructorRequest.update({ where: { id: requestId }, data: { ...data, status: bothApproved ? 'APPROVED' : role === 'ADMIN' ? 'ADMIN_APPROVED' : 'SUPERADMIN_APPROVED', reviewedAt: bothApproved ? new Date() : undefined } }),
      ...(bothApproved ? [prisma.user.update({ where: { id: request.userId }, data: { role: 'INSTRUCTOR' } })] : []),
    ]);
  }
  revalidatePath('/admin/dashboard'); revalidatePath('/student');
  return { success: true };
}

export async function reviewCourse(courseId: string, decision: 'APPROVE' | 'REJECT', rejectionReason?: string) {
  if (!await isReviewer()) return { error: 'Unauthorized' };
  await prisma.course.update({ where: { id: courseId }, data: { approvalStatus: decision === 'APPROVE' ? 'APPROVED' : 'REJECTED', rejectionReason: decision === 'REJECT' ? (rejectionReason || 'Please revise and resubmit.') : null, reviewedAt: new Date() } });
  revalidatePath('/admin/dashboard'); revalidatePath('/courses');
  return { success: true };
}

export async function updateUserStatus(userId: string, status: 'APPROVED' | 'REJECTED') {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: { status },
    });

    // Revalidate the admin dashboard cache to refresh UI instantly
    revalidatePath('/admin/dashboard');
    return { success: true };
  } catch (error) {
    console.error('Failed to update user status:', error);
    return { success: false, error: 'Failed to update user status' };
  }
}

export async function updateUserRole(
  userId: string,
  newRole: 'STUDENT' | 'INSTRUCTOR' | 'MODERATOR' | 'ADMIN'
) {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: { role: newRole },
    });

    // Revalidate the admin dashboard cache to update active user list UI
    revalidatePath('/admin/dashboard');
    return { success: true };
  } catch (error) {
    console.error('Failed to update user role:', error);
    return { success: false, error: 'Failed to update user role' };
  }
}
