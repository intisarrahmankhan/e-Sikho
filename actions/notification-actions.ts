'use server';

import { auth } from '@/auth';
import dbConnect from '@/lib/mongoose';
import Notification from '@/models/Notification';
import User from '@/models/User';
import { revalidatePath } from 'next/cache';

/**
 * Fetches notifications for the current student, strictly ordered by:
 * 1. Priority Weight descending (HIGH priority first!)
 * 2. CreatedAt descending (Newest first)
 * 
 * This ensures CS students see CS contest alerts right at the top of their list!
 */
export async function getUserNotificationsAction() {
  try {
    const session = await auth();
    const sessionUserId = (session?.user as any)?.id;
    if (!sessionUserId) {
      return { success: true, notifications: [], unreadCount: 0 };
    }

    await dbConnect();

    let userQuery: any = { _id: sessionUserId };
    if (typeof sessionUserId === 'string' && sessionUserId.includes('@')) {
      userQuery = { email: sessionUserId };
    }
    const user = await User.findOne(userQuery).select('_id').lean() as any;
    if (!user) {
      return { success: true, notifications: [], unreadCount: 0 };
    }

    // Sort strictly: priorityWeight DESC (3=HIGH, 2=NORMAL, 1=LOW), then createdAt DESC
    const notifications = await Notification.find({ recipientId: user._id })
      .sort({ priorityWeight: -1, createdAt: -1 })
      .limit(30)
      .lean();

    const unreadCount = await Notification.countDocuments({
      recipientId: user._id,
      isRead: false,
    });

    const formatted = notifications.map((n: any) => ({
      id: n._id.toString(),
      title: n.title,
      message: n.message,
      type: n.type,
      priority: n.priority as 'HIGH' | 'NORMAL' | 'LOW',
      priorityWeight: n.priorityWeight,
      actionUrl: n.actionUrl || '/contests',
      badgeLabel: n.badgeLabel || '',
      isRead: !!n.isRead,
      createdAt: n.createdAt?.toISOString(),
    }));

    return {
      success: true,
      notifications: formatted,
      unreadCount,
    };
  } catch (error: any) {
    console.error('Error fetching notifications:', error);
    return { error: 'নোটিফিকেশন লোড করতে সমস্যা হয়েছে।' };
  }
}

/**
 * Marks a single notification as read
 */
export async function markNotificationAsReadAction(notificationId: string) {
  try {
    const session = await auth();
    const sessionUserId = (session?.user as any)?.id;
    if (!sessionUserId) return { error: 'লগইন আবশ্যক।' };

    await dbConnect();

    await Notification.findByIdAndUpdate(notificationId, {
      $set: { isRead: true, readAt: new Date() },
    });

    revalidatePath('/');
    revalidatePath('/student');
    return { success: true };
  } catch (error: any) {
    console.error('Error marking notification as read:', error);
    return { error: 'আপডেট ব্যর্থ হয়েছে।' };
  }
}

/**
 * Marks all notifications as read for current user
 */
export async function markAllNotificationsAsReadAction() {
  try {
    const session = await auth();
    const sessionUserId = (session?.user as any)?.id;
    if (!sessionUserId) return { error: 'লগইন আবশ্যক।' };

    await dbConnect();

    let userQuery: any = { _id: sessionUserId };
    if (typeof sessionUserId === 'string' && sessionUserId.includes('@')) {
      userQuery = { email: sessionUserId };
    }
    const user = await User.findOne(userQuery).select('_id').lean() as any;
    if (!user) return { error: 'ইউজার পাওয়া যায়নি।' };

    await Notification.updateMany(
      { recipientId: user._id, isRead: false },
      { $set: { isRead: true, readAt: new Date() } }
    );

    revalidatePath('/');
    revalidatePath('/student');
    return { success: true };
  } catch (error: any) {
    console.error('Error marking all notifications as read:', error);
    return { error: 'আপডেট ব্যর্থ হয়েছে।' };
  }
}
