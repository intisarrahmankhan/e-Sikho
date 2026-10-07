'use server';

import dbConnect from '@/lib/mongoose';
import User from '@/models/User';
import Course from '@/models/Course';
import InstructorRequest from '@/models/InstructorRequest';
import AuditLog from '@/models/AuditLog';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';

async function checkSuperadmin() {
  const session = await auth();
  const userId = (session?.user as any)?.id;
  const role = (session?.user as any)?.role;
  if (!userId || role !== 'SUPERADMIN') {
    throw new Error('Unauthorized. Only Superadmins can perform this action.');
  }
  return userId;
}

async function checkAdminOrSuperadmin() {
  const session = await auth();
  const userId = (session?.user as any)?.id;
  const role = (session?.user as any)?.role;
  if (!userId || (role !== 'ADMIN' && role !== 'SUPERADMIN')) {
    throw new Error('Unauthorized. Admin access required.');
  }
  return userId;
}

export async function updateUserStatus(userId: string, status: 'APPROVED' | 'REJECTED') {
  try {
    const adminId = await checkSuperadmin();
    await dbConnect();
    await User.findByIdAndUpdate(userId, { status });

    await AuditLog.create({
      action: 'UPDATE_USER_STATUS',
      category: 'USER_MANAGEMENT',
      actorId: adminId,
      targetId: userId,
      details: { status },
    });

    revalidatePath('/admin');
    revalidatePath('/admin/dashboard');
    return { success: true };
  } catch (error) {
    console.error('Failed to update user status:', error);
    return { success: false, error: 'Failed to update user status' };
  }
}

export async function updateUserRole(
  userId: string,
  newRole: 'STUDENT' | 'INSTRUCTOR' | 'MODERATOR' | 'ADMIN' | 'SUPERADMIN'
) {
  try {
    const adminId = await checkSuperadmin();
    await dbConnect();
    await User.findByIdAndUpdate(userId, { role: newRole });

    await AuditLog.create({
      action: 'UPDATE_USER_ROLE',
      category: 'SECURITY',
      actorId: adminId,
      targetId: userId,
      details: { newRole },
    });

    revalidatePath('/admin');
    revalidatePath('/admin/dashboard');
    return { success: true };
  } catch (error) {
    console.error('Failed to update user role:', error);
    return { success: false, error: 'Failed to update user role' };
  }
}

export async function approveCourse(courseId: string) {
  try {
    const adminId = await checkAdminOrSuperadmin();
    await dbConnect();
    await Course.findByIdAndUpdate(courseId, {
      status: 'PUBLISHED',
      approvalStatus: 'APPROVED',
      rejectionReason: null,
    });

    revalidatePath('/admin');
    revalidatePath('/admin/dashboard');
    return { success: true };
  } catch (error) {
    console.error('Failed to approve course:', error);
    return { success: false, error: 'Failed to approve course' };
  }
}

export async function rejectCourse(courseId: string, reason: string) {
  try {
    const adminId = await checkAdminOrSuperadmin();
    await dbConnect();
    await Course.findByIdAndUpdate(courseId, {
      status: 'REJECTED',
      approvalStatus: 'REJECTED',
      rejectionReason: reason,
    });

    revalidatePath('/admin');
    revalidatePath('/admin/dashboard');
    return { success: true };
  } catch (error) {
    console.error('Failed to reject course:', error);
    return { success: false, error: 'Failed to reject course' };
  }
}

export async function toggleUserSuspend(userId: string, currentStatus: string) {
  try {
    const adminId = await checkSuperadmin();
    await dbConnect();
    const nextStatus = currentStatus === 'SUSPENDED' ? 'APPROVED' : 'SUSPENDED';
    await User.findByIdAndUpdate(userId, { status: nextStatus });

    await AuditLog.create({
      action: 'TOGGLE_USER_SUSPEND',
      category: 'USER_MANAGEMENT',
      actorId: adminId,
      targetId: userId,
      details: { nextStatus },
    });

    revalidatePath('/admin');
    revalidatePath('/admin/dashboard');
    return { success: true };
  } catch (error) {
    console.error('Failed to toggle user suspension:', error);
    return { success: false, error: 'Failed to update user suspension status' };
  }
}

export async function reviewInstructorRequest(requestId: string, action: 'APPROVE' | 'REJECT') {
  try {
    const adminId = await checkSuperadmin();
    await dbConnect();
    const req = await InstructorRequest.findById(requestId);
    if (!req) return { success: false, error: 'Request not found' };

    if (action === 'APPROVE') {
      await InstructorRequest.findByIdAndUpdate(requestId, { status: 'APPROVED', reviewedAt: new Date() });
      await User.findByIdAndUpdate(req.userId, { role: 'INSTRUCTOR' });
      
      await AuditLog.create({
        action: 'APPROVE_INSTRUCTOR_REQUEST',
        category: 'SECURITY',
        actorId: adminId,
        targetId: req.userId,
        details: { requestId },
      });
    } else {
      await InstructorRequest.findByIdAndUpdate(requestId, { status: 'REJECTED', reviewedAt: new Date() });
    }
    revalidatePath('/admin');
    revalidatePath('/admin/dashboard');
    return { success: true };
  } catch (error) {
    console.error('Failed to review instructor request:', error);
    return { success: false, error: 'Failed to review request' };
  }
}

export async function reviewCourse(courseId: string, action: 'APPROVE' | 'REJECT') {
  try {
    const adminId = await checkAdminOrSuperadmin();
    await dbConnect();
    if (action === 'APPROVE') {
      await Course.findByIdAndUpdate(courseId, { approvalStatus: 'APPROVED', status: 'PUBLISHED' });
    } else {
      await Course.findByIdAndUpdate(courseId, { approvalStatus: 'REJECTED', status: 'REJECTED' });
    }
    revalidatePath('/admin');
    revalidatePath('/admin/dashboard');
    return { success: true };
  } catch (error) {
    console.error('Failed to review course:', error);
    return { success: false, error: 'Failed to review course' };
  }
}