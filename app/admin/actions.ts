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