'use server';

import dbConnect from '@/lib/mongoose';
import User from '@/models/User';
import VerificationCode from '@/models/VerificationCode';
import { normalizePhone, isValidBDPhone, verifyPassword } from '@/lib/auth-helpers';
import { sendOtpSms } from '@/lib/sms';

export interface OtpActionResponse {
  success: boolean;
  message?: string;
  error?: string;
  devCode?: string;
  phone?: string;
}

/**
 * Sends OTP for New User Registration / Sign-Up
 */
export async function requestSignupOtp(phone: string): Promise<OtpActionResponse> {
  const cleanPhone = normalizePhone(phone);
  if (!isValidBDPhone(cleanPhone)) {
    return {
      success: false,
      error: 'অনুগ্রহ করে সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন (যেমন: 017XXXXXXXX)।',
    };
  }

  await dbConnect();

  // Check if phone already registered
  const existingUser = await User.findOne({
    $or: [{ phone: cleanPhone }, { email: `${cleanPhone}@phone.esikho.com` }],
  });

  if (existingUser) {
    return {
      success: false,
      error: 'এই ফোন নম্বর দিয়ে ইতিমধ্যেই একটি অ্যাকাউন্ট তৈরি করা হয়েছে। অনুগ্রহ করে লগইন করুন।',
    };
  }

  // Rate limiting: check if an OTP was created within the last 60 seconds
  const recentOtp = await VerificationCode.findOne({
    phone: cleanPhone,
    purpose: 'SIGNUP',
    createdAt: { $gt: new Date(Date.now() - 60 * 1000) },
  });

  if (recentOtp) {
    return {
      success: false,
      error: 'অনুগ্রহ করে ১ মিনিট অপেক্ষা করে পুনরায় ওটিপি চান।',
    };
  }

  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes validity

  // Remove existing pending signup OTPs for this phone to avoid clutter
  await VerificationCode.deleteMany({ phone: cleanPhone, purpose: 'SIGNUP' });

  // Save new OTP
  await VerificationCode.create({
    phone: cleanPhone,
    code: otp,
    purpose: 'SIGNUP',
    expiresAt,
  });

  // Send SMS
  const smsResult = await sendOtpSms(cleanPhone, otp, 'SIGNUP');

  return {
    success: true,
    message: 'আপনার মোবাইলে একটি ৬ ডিজিটের ভেরিফিকেশন কোড পাঠানো হয়েছে।',
    devCode: smsResult.devCode,
    phone: cleanPhone,
  };
}

/**
 * Verifies password FIRST, and only if password is valid, sends OTP to the user's mobile number
 */
export async function verifyPasswordAndSendLoginOtp(params: {
  identifier: string; // phone or email
  password?: string;
  phoneForMissing?: string;
}): Promise<OtpActionResponse & { userRole?: string }> {
  const { identifier, password, phoneForMissing } = params;
  if (!identifier || !identifier.trim()) {
    return { success: false, error: 'অনুগ্রহ করে আপনার মোবাইল নম্বর বা ইমেইল লিখুন।' };
  }

  await dbConnect();

  const cleanPhone = normalizePhone(identifier);
  const rawId = identifier.trim().toLowerCase();

  const user = await User.findOne({
    $or: [
      ...(cleanPhone ? [{ phone: cleanPhone }, { email: `${cleanPhone}@phone.esikho.com` }] : []),
      { email: rawId },
      ...(cleanPhone ? [{ email: cleanPhone }] : []),
    ],
  });

  if (!user) {
    return {
      success: false,
      error: 'এই মোবাইল নম্বর বা ইমেইল দিয়ে কোনো অ্যাকাউন্ট পাওয়া যায়নি।',
    };
  }

  // 1. Password Verification
  if (user.password) {
    if (!password) {
      return { success: false, error: 'অনুগ্রহ করে আপনার পাসওয়ার্ড দিন।' };
    }
    const isMatch = verifyPassword(password, user.password);
    if (!isMatch) {
      return { success: false, error: 'ভুল পাসওয়ার্ড! অনুগ্রহ করে সঠিক পাসওয়ার্ড দিন।' };
    }
  }

  // 2. Resolve Mobile Number to send OTP
  let targetPhone = user.phone || (isValidBDPhone(cleanPhone) ? cleanPhone : '');
  if (!targetPhone && phoneForMissing) {
    const cleanMissing = normalizePhone(phoneForMissing);
    if (isValidBDPhone(cleanMissing)) {
      targetPhone = cleanMissing;
      user.phone = cleanMissing;
      await user.save();
    }
  }

  if (!targetPhone) {
    return {
      success: false,
      error: 'অ্যাকাউন্টে কোনো মোবাইল নম্বর যুক্ত নেই। অনুগ্রহ করে ওটিপি পাওয়ার জন্য একটি মোবাইল নম্বর দিন।',
    };
  }

  // 3. Rate limiting (60 seconds)
  const recentOtp = await VerificationCode.findOne({
    phone: targetPhone,
    purpose: 'LOGIN',
    createdAt: { $gt: new Date(Date.now() - 60 * 1000) },
  });

  if (recentOtp) {
    return {
      success: false,
      error: 'অনুগ্রহ করে ১ মিনিট অপেক্ষা করে পুনরায় ওটিপি চান।',
      phone: targetPhone,
    };
  }

  // 4. Generate & Save OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 mins

  await VerificationCode.deleteMany({ phone: targetPhone, purpose: 'LOGIN' });

  await VerificationCode.create({
    phone: targetPhone,
    code: otp,
    purpose: 'LOGIN',
    expiresAt,
  });

  // 5. Send SMS
  const smsResult = await sendOtpSms(targetPhone, otp, 'LOGIN');

  return {
    success: true,
    message: 'পাসওয়ার্ড সঠিক! আপনার মোবাইল নম্বরে ৬ ডিজিটের ভেরিফিকেশন ওটিপি পাঠানো হয়েছে।',
    devCode: smsResult.devCode,
    phone: targetPhone,
    userRole: user.role,
  };
}

/**
 * Sends OTP for Existing User Login (legacy/direct)
 */
export async function requestLoginOtp(phone: string): Promise<OtpActionResponse> {
  const cleanPhone = normalizePhone(phone);
  if (!isValidBDPhone(cleanPhone)) {
    return {
      success: false,
      error: 'অনুগ্রহ করে সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন (যেমন: 017XXXXXXXX)।',
    };
  }

  await dbConnect();

  // Check if user exists
  const user = await User.findOne({
    $or: [{ phone: cleanPhone }, { email: `${cleanPhone}@phone.esikho.com` }],
  });

  if (!user) {
    return {
      success: false,
      error: 'এই ফোন নম্বরে কোনো অ্যাকাউন্ট পাওয়া যায়নি। অনুগ্রহ করে আগে সাইন আপ করুন।',
    };
  }

  // Rate limiting: check 60 seconds
  const recentOtp = await VerificationCode.findOne({
    phone: cleanPhone,
    purpose: 'LOGIN',
    createdAt: { $gt: new Date(Date.now() - 60 * 1000) },
  });

  if (recentOtp) {
    return {
      success: false,
      error: 'অনুগ্রহ করে ১ মিনিট অপেক্ষা করে পুনরায় ওটিপি চান।',
    };
  }

  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes validity

  await VerificationCode.deleteMany({ phone: cleanPhone, purpose: 'LOGIN' });

  await VerificationCode.create({
    phone: cleanPhone,
    code: otp,
    purpose: 'LOGIN',
    expiresAt,
  });

  const smsResult = await sendOtpSms(cleanPhone, otp, 'LOGIN');

  return {
    success: true,
    message: 'লগইন করার জন্য আপনার মোবাইলে ওটিপি পাঠানো হয়েছে।',
    devCode: smsResult.devCode,
    phone: cleanPhone,
  };
}
