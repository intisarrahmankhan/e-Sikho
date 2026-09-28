'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

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
      data: { role: newRole as any },
    });

    // Revalidate the admin dashboard cache to update active user list UI
    revalidatePath('/admin/dashboard');
    return { success: true };
  } catch (error) {
    console.error('Failed to update user role:', error);
    return { success: false, error: 'Failed to update user role' };
  }
}

// ─── Sprint 3 Admin Governance Actions ────────────────────────────────────

// ST-116: Approve Course Workflow
export async function approveCourse(courseId: string) {
  try {
    await prisma.course.update({
      where: { id: courseId },
      data: { 
        status: 'PUBLISHED', 
        rejectionReason: null 
      },
    });

    revalidatePath('/admin/dashboard');
    return { success: true };
  } catch (error) {
    console.error('Failed to approve course:', error);
    return { success: false, error: 'Failed to approve course' };
  }
}

// ST-118 & ST-119: Reject Course with Feedback Workflow
export async function rejectCourse(courseId: string, reason: string) {
  try {
    await prisma.course.update({
      where: { id: courseId },
      data: { 
        status: 'REJECTED', 
        rejectionReason: reason 
      },
    });

    revalidatePath('/admin/dashboard');
    return { success: true };
  } catch (error) {
    console.error('Failed to reject course:', error);
    return { success: false, error: 'Failed to reject course' };
  }
}

// ST-121: Toggle Account Suspension (Ban / Unban)
export async function toggleUserSuspend(userId: string, currentStatus: string) {
  try {
    const nextStatus = currentStatus === 'SUSPENDED' ? 'APPROVED' : 'SUSPENDED';
    await prisma.user.update({
      where: { id: userId },
      data: { status: nextStatus as any },
    });

    revalidatePath('/admin/dashboard');
    return { success: true };
  } catch (error) {
    console.error('Failed to toggle user suspension:', error);
    return { success: false, error: 'Failed to update user suspension status' };
  }
}