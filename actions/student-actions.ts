'use server';

import { auth } from '@/auth';
import dbConnect from '@/lib/mongoose';
import User from '@/models/User';
import InstructorRequest from '@/models/InstructorRequest';
import { hashPassword, verifyPassword, normalizePhone, isValidBDPhone, isValidMongoObjectId } from '@/lib/auth-helpers';
import { revalidatePath } from 'next/cache';

/**
 * Requests elevation from student to instructor role
 */
export async function requestInstructorRole(formData: FormData) {
  const session = await auth();
  const userId = (session?.user as { id?: string; role?: string } | undefined)?.id;
  const userEmail = (session?.user as { email?: string } | undefined)?.email;
  const role = (session?.user as { role?: string } | undefined)?.role;
  const reason = String(formData.get('reason') || '').trim();

  if (!userId || role !== 'STUDENT') return { error: 'শুধুমাত্র শিক্ষার্থীরা এই আবেদন জমা দিতে পারেন।' };
  if (reason.length < 20) return { error: 'অনুগ্রহ করে আপনার অভিজ্ঞতা ব্যাখ্যা করে কমপক্ষে ২০টি অক্ষর লিখুন।' };

  await dbConnect();

  let safeUserId = userId;
  if (!isValidMongoObjectId(safeUserId) && userEmail) {
    const u = (await User.findOne({ email: userEmail }).select('_id').lean()) as any;
    if (u) safeUserId = u._id.toString();
  }
  if (!isValidMongoObjectId(safeUserId)) {
    return { error: 'ইউজার অ্যাকাউন্ট যাচাই করা যায়নি।' };
  }

  const existing = await InstructorRequest.findOne({ userId: safeUserId });
  if (existing && ['PENDING', 'ADMIN_APPROVED', 'SUPERADMIN_APPROVED', 'APPROVED'].includes(existing.status)) {
    return { error: 'আপনার একটি সক্রিয় ইন্সট্রাক্টর রিকোয়েস্ট ইতিমধ্যে প্রক্রিয়াধীন রয়েছে।' };
  }

  await InstructorRequest.findOneAndUpdate(
    { userId: safeUserId },
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
    const sessionUserEmail = (session?.user as any)?.email;
    if (!sessionUserId && !sessionUserEmail) return { error: 'লগইন আবশ্যক।' };

    await dbConnect();

    let query: any = null;
    if (isValidMongoObjectId(sessionUserId)) {
      query = { _id: sessionUserId };
    } else if (typeof sessionUserId === 'string' && sessionUserId.includes('@')) {
      query = { email: sessionUserId };
    } else if (sessionUserEmail) {
      query = { email: sessionUserEmail };
    }

    if (!query) return { error: 'ইউজার প্রোফাইল পাওয়া যায়নি।' };

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
        academicBackground: user.academicBackground || 'Computer Science & Engineering (CSE)',
        weeklyGoalHours: user.weeklyGoalHours || 10,
        interests: Array.isArray(user.interests) ? user.interests : [],
        skills: Array.isArray(user.skills) ? user.skills : [],
        elo: user.elo || 1200,
        competitiveElo: user.competitiveElo || 1200,
        problemsSolved: user.problemsSolved || 0,
        completedCoursesCount: user.completedCoursesCount || 0,
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
 * Updates student general profile, learning goals, interests & skills
 */
export async function updateStudentProfileAction(data: {
  name: string;
  phone?: string;
  headline?: string;
  bio?: string;
  targetTrack?: string;
  academicBackground?: string;
  weeklyGoalHours?: number;
  interests?: string[];
  skills?: string[];
}) {
  try {
    const session = await auth();
    const sessionUserId = (session?.user as any)?.id;
    if (!sessionUserId) return { error: 'লগইন আবশ্যক।' };

    if (!data.name || data.name.trim().length < 2) {
      return { error: 'নামে কমপক্ষে ২টি অক্ষর থাকতে হবে।' };
    }

    await dbConnect();

    let query: any = null;
    const sessionUserEmail = (session?.user as any)?.email;
    if (isValidMongoObjectId(sessionUserId)) {
      query = { _id: sessionUserId };
    } else if (typeof sessionUserId === 'string' && sessionUserId.includes('@')) {
      query = { email: sessionUserId };
    } else if (sessionUserEmail) {
      query = { email: sessionUserEmail };
    }

    if (!query) return { error: 'ইউজার খুঁজে পাওয়া যায়নি।' };

    const updateFields: any = {
      name: data.name.trim(),
      headline: data.headline?.trim() || '',
      bio: data.bio?.trim() || '',
      targetTrack: data.targetTrack || 'Fullstack Web Development',
      academicBackground: data.academicBackground || 'Computer Science & Engineering (CSE)',
      weeklyGoalHours: Number(data.weeklyGoalHours) || 10,
    };

    if (Array.isArray(data.interests)) {
      updateFields.interests = data.interests.map((s) => String(s).trim()).filter(Boolean);
    }
    if (Array.isArray(data.skills)) {
      updateFields.skills = data.skills.map((s) => String(s).trim()).filter(Boolean);
    }

    if (data.phone) {
      const cleanPhone = normalizePhone(data.phone);
      if (!isValidBDPhone(cleanPhone)) {
        return { error: 'সঠিক বাংলাদেশী মোবাইল নম্বর (যেমন: 017XXXXXXXX) দিন।' };
      }
      updateFields.phone = cleanPhone;
    }

    await User.findOneAndUpdate(query, { $set: updateFields });

    revalidatePath('/');
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

    let query: any = null;
    const sessionUserEmail = (session?.user as any)?.email;
    if (isValidMongoObjectId(sessionUserId)) {
      query = { _id: sessionUserId };
    } else if (typeof sessionUserId === 'string' && sessionUserId.includes('@')) {
      query = { email: sessionUserId };
    } else if (sessionUserEmail) {
      query = { email: sessionUserEmail };
    }

    if (!query) return { error: 'ইউজার খুঁজে পাওয়া যায়নি।' };

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
