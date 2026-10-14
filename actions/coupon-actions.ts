'use server';

import { auth } from '@/auth';
import dbConnect from '@/lib/mongoose';
import Coupon from '@/models/Coupon';
import Course from '@/models/Course';
import { revalidatePath } from 'next/cache';

export async function createCouponAction(data: {
  code: string;
  discountPercentage: number;
  courseId: string | null;
  validUntil: Date;
  maxUses: number;
}) {
  try {
    const session = await auth();
    const sessionUserId = (session?.user as any)?.id;
    const role = (session?.user as any)?.role;
    
    if (!sessionUserId || (role !== 'INSTRUCTOR' && role !== 'ADMIN' && role !== 'SUPERADMIN')) {
      return { error: 'অ্যাক্সেস ডিনাইড (Access denied).' };
    }

    if (!data.code || data.code.trim().length < 3) {
      return { error: 'কুপন কোড কমপক্ষে ৩ অক্ষরের হতে হবে (Coupon code must be at least 3 characters).' };
    }
    
    if (data.discountPercentage < 1 || data.discountPercentage > 100) {
      return { error: 'ডিসকাউন্ট ১ থেকে ১০০ এর মধ্যে হতে হবে (Discount must be between 1 and 100).' };
    }

    await dbConnect();

    // Ensure the coupon code is unique
    const existing = await Coupon.findOne({ code: data.code.toUpperCase() });
    if (existing) {
      return { error: 'এই কুপন কোডটি ইতিমধ্যে ব্যবহৃত হচ্ছে (This coupon code is already in use).' };
    }

    const newCoupon = await Coupon.create({
      code: data.code.toUpperCase(),
      discountPercentage: data.discountPercentage,
      courseId: data.courseId || null,
      validUntil: data.validUntil,
      maxUses: data.maxUses,
      instructorId: sessionUserId,
      isActive: true,
    });

    revalidatePath('/instructor/coupons');
    return { success: true, coupon: JSON.parse(JSON.stringify(newCoupon)) };
  } catch (error: any) {
    console.error('Failed to create coupon:', error);
    return { error: 'কুপন তৈরি করতে ব্যর্থ হয়েছে (Failed to create coupon).' };
  }
}

export async function getInstructorCouponsAction() {
  try {
    const session = await auth();
    const sessionUserId = (session?.user as any)?.id;
    if (!sessionUserId) return { error: 'লগইন আবশ্যক (Login required).' };

    await dbConnect();
    
    const coupons = await Coupon.find({ instructorId: sessionUserId })
      .populate('courseId', 'title')
      .sort({ createdAt: -1 })
      .lean();
      
    return { success: true, coupons: JSON.parse(JSON.stringify(coupons)) };
  } catch (error: any) {
    console.error('Failed to get coupons:', error);
    return { error: 'কুপন লোড করতে ব্যর্থ হয়েছে (Failed to load coupons).' };
  }
}
