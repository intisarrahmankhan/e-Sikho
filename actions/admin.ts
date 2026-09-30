'use server';

import dbConnect from '@/lib/mongoose';
import User from '@/models/User';
import Course from '@/models/Course';
import InstructorRequest from '@/models/InstructorRequest';
import { revalidatePath } from 'next/cache';

export async function updateUserStatus(userId: string, status: 'APPROVED' | 'REJECTED') {
  try {
    await dbConnect();
    await User.findByIdAndUpdate(userId, { status });

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
  newRole: 'STUDENT' | 'INSTRUCTOR' | 'MODERATOR' | 'ADMIN'
) {
  try {
    await dbConnect();
    await User.findByIdAndUpdate(userId, { role: newRole });

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
    await dbConnect();
    const nextStatus = currentStatus === 'SUSPENDED' ? 'APPROVED' : 'SUSPENDED';
    await User.findByIdAndUpdate(userId, { status: nextStatus });

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
    await dbConnect();
    const req = await InstructorRequest.findById(requestId);
    if (!req) return { success: false, error: 'Request not found' };

    if (action === 'APPROVE') {
      await InstructorRequest.findByIdAndUpdate(requestId, { status: 'APPROVED', reviewedAt: new Date() });
      await User.findByIdAndUpdate(req.userId, { role: 'INSTRUCTOR' });
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