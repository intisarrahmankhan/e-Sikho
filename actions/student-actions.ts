'use server';

import { auth } from '@/auth';
import dbConnect from '@/lib/mongoose';
import User from '@/models/User';
import InstructorRequest from '@/models/InstructorRequest';
import { hashPassword, verifyPassword, normalizePhone, isValidBDPhone } from '@/lib/auth-helpers';
import { revalidatePath } from 'next/cache';

/**
 * Requests elevation from student to instructor role
 */
export async function requestInstructorRole(formData: FormData) {
  const session = await auth();
  const userId = (session?.user as { id?: string; role?: string } | undefined)?.id;
  const role = (session?.user as { role?: string } | undefined)?.role;
  const reason = String(formData.get('reason') || '').trim();

  if (!userId || role !== 'STUDENT') return { error: 'শুধুমাত্র শিক্ষার্থীরা এই আবেদন জমা দিতে পারেন।' };
  if (reason.length < 20) return { error: 'অনুগ্রহ করে আপনার অভিজ্ঞতা ব্যাখ্যা করে কমপক্ষে ২০টি অক্ষর লিখুন।' };

  await dbConnect();

  const existing = await InstructorRequest.findOne({ userId });
  if (existing && ['PENDING', 'ADMIN_APPROVED', 'SUPERADMIN_APPROVED', 'APPROVED'].includes(existing.status)) {
    return { error: 'আপনার একটি সক্রিয় ইন্সট্রাক্টর রিকোয়েস্ট ইতিমধ্যে প্রক্রিয়াধীন রয়েছে।' };
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

/**
 * Fetches current authenticated student profile details
 */
export async function getStudentProfileAction() {
  try {
    const session = await auth();
    const sessionUserId = (session?.user as any)?.id;
    if (!sessionUserId) return { error: 'লগইন আবশ্যক।' };

    await dbConnect();

    let query: any = { _id: sessionUserId };
    if (typeof sessionUserId === 'string' && sessionUserId.includes('@')) {
      query = { email: sessionUserId };
    }

    const user = await User.findOne(query).select('-password').lean() as any;
    if (!user) return { error: 'ইউজার প্রোফাইল পাওয়া যায়নি।' };

    return {
      success: true,
      profile: {
        id: user._id.toString(),
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        headline: user.headline || 'Aspiring Developer',
        bio: user.bio || '',
        targetTrack: user.targetTrack || 'Fullstack Web Development',
        weeklyGoalHours: user.weeklyGoalHours || 10,
        elo: user.elo || 1200,
        streak: user.streak || 1,
        image: user.image || '',
        role: user.role,
        status: user.status,
      },
    };
  } catch (error: any) {
    console.error('Failed to get student profile:', error);
    return { error: 'প্রোফাইল লোড করতে ব্যর্থ হয়েছে।' };
  }
}

/**
 * Updates student general profile and learning goals
 */
export async function updateStudentProfileAction(data: {
  name: string;
  phone?: string;
  headline?: string;
  bio?: string;
  targetTrack?: string;
  weeklyGoalHours?: number;
}) {
  try {
    const session = await auth();
    const sessionUserId = (session?.user as any)?.id;
    if (!sessionUserId) return { error: 'লগইন আবশ্যক।' };

    if (!data.name || data.name.trim().length < 2) {
      return { error: 'নামে কমপক্ষে ২টি অক্ষর থাকতে হবে।' };
    }

    await dbConnect();

    let query: any = { _id: sessionUserId };
    if (typeof sessionUserId === 'string' && sessionUserId.includes('@')) {
      query = { email: sessionUserId };
    }

    const updateFields: any = {
      name: data.name.trim(),
      headline: data.headline?.trim() || '',
      bio: data.bio?.trim() || '',
      targetTrack: data.targetTrack || 'Fullstack Web Development',
      weeklyGoalHours: Number(data.weeklyGoalHours) || 10,
    };

    if (data.phone) {
      const cleanPhone = normalizePhone(data.phone);
      if (!isValidBDPhone(cleanPhone)) {
        return { error: 'সঠিক বাংলাদেশী মোবাইল নম্বর (যেমন: 017XXXXXXXX) দিন।' };
      }
      updateFields.phone = cleanPhone;
    }

    await User.findOneAndUpdate(query, { $set: updateFields });

    revalidatePath('/student');
    revalidatePath('/student/settings');
    return { success: true };
  } catch (error: any) {
    console.error('Failed to update student profile:', error);
    return { error: 'প্রোফাইল আপডেট ব্যর্থ হয়েছে।' };
  }
}

/**
 * Updates student password securely with scrypt validation
 */
export async function updateStudentPasswordAction(data: {
  currentPassword?: string;
  newPassword: string;
}) {
  try {
    const session = await auth();
    const sessionUserId = (session?.user as any)?.id;
    if (!sessionUserId) return { error: 'লগইন আবশ্যক।' };

    if (!data.newPassword || data.newPassword.length < 6) {
      return { error: 'নতুন পাসওয়ার্ডে কমপক্ষে ৬টি অক্ষর থাকতে হবে।' };
    }

    await dbConnect();

    let query: any = { _id: sessionUserId };
    if (typeof sessionUserId === 'string' && sessionUserId.includes('@')) {
      query = { email: sessionUserId };
    }

    const user = await User.findOne(query);
    if (!user) return { error: 'ইউজার খুঁজে পাওয়া যায়নি।' };

    // If user already has a password set, verify the current one
    if (user.password && data.currentPassword) {
      const isMatch = verifyPassword(data.currentPassword, user.password);
      if (!isMatch) {
        return { error: 'বর্তমান পাসওয়ার্ডটি ভুল দেওয়া হয়েছে।' };
      }
    }

    user.password = hashPassword(data.newPassword);
    await user.save();

    revalidatePath('/student/settings');
    return { success: true };
  } catch (error: any) {
    console.error('Failed to update password:', error);
    return { error: 'পাসওয়ার্ড পরিবর্তন ব্যর্থ হয়েছে।' };
  }
}
