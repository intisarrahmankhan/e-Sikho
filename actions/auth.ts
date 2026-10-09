'use server';

import { signIn } from '@/auth';

export async function loginWithGoogle(callbackUrl: string) {
  await signIn('google', { redirectTo: callbackUrl });
}

export async function loginAsInstructor(email?: string) {
  await signIn('credentials', {
    email: email || 'instructor@esikho.com',
    role: 'INSTRUCTOR',
    name: 'ইন্সট্রাক্টর আরিফ হাসান',
    redirectTo: '/instructor',
  });
}

export async function loginAsStudent(email?: string) {
  await signIn('credentials', {
    email: email || 'student@esikho.com',
    role: 'STUDENT',
    name: 'শিক্ষার্থী রাহুল',
    redirectTo: '/student',
  });
}

export async function loginWithCredentials(
  formData: FormData | {
    email: string;
    password?: string;
    role?: string;
    name?: string;
    redirectTo?: string;
  },
  callbackUrl?: string
) {
  let credentialsObj: Record<string, any> = {};
  let target = callbackUrl;

  if (typeof FormData !== 'undefined' && formData instanceof FormData) {
    credentialsObj = Object.fromEntries(formData.entries());
    target = callbackUrl || (credentialsObj.callbackUrl as string) || '/student';
  } else {
    const data = formData as {
      email: string;
      password?: string;
      role?: string;
      name?: string;
      redirectTo?: string;
    };
    credentialsObj = {
      email: data.email,
      password: data.password,
      role: data.role || 'STUDENT',
      name: data.name || (data.role === 'INSTRUCTOR' ? 'ইন্সট্রাক্টর আরিফ হাসান' : 'শিক্ষার্থী'),
    };
    target = callbackUrl || data.redirectTo || (data.role === 'INSTRUCTOR' ? '/instructor' : '/student');
  }

  try {
    await signIn('credentials', {
      ...credentialsObj,
      redirectTo: target,
    });
  } catch (error: any) {
    if (error?.message === 'NEXT_REDIRECT' || error?.digest?.startsWith('NEXT_REDIRECT')) {
      throw error;
    }
    throw error;
  }
}

/**
 * Sign up with Phone and verified OTP
 */
export async function signUpWithPhoneOtp(formData: {
  name: string;
  phone: string;
  otp: string;
  password?: string;
  role?: 'STUDENT' | 'INSTRUCTOR';
  callbackUrl?: string;
}) {
  const { name, phone, otp, password, role = 'STUDENT', callbackUrl } = formData;

  if (!name || !name.trim()) {
    return { success: false, error: 'অনুগ্রহ করে আপনার পুরো নাম লিখুন।' };
  }

  const cleanPhone = phone ? phone.replace(/[\s\-\(\)]/g, '').trim() : '';
  if (!cleanPhone || cleanPhone.length < 11) {
    return { success: false, error: 'সঠিক মোবাইল নম্বর দিন (যেমন: 017XXXXXXXX)।' };
  }

  const cleanOtp = otp ? otp.trim() : '';
  if (!cleanOtp || cleanOtp.length !== 6) {
    return { success: false, error: 'অনুগ্রহ করে ৬ ডিজিটের ওটিপি কোড দিন।' };
  }

  if (password && password.length < 6) {
    return { success: false, error: 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।' };
  }

  const target = callbackUrl || (role === 'INSTRUCTOR' ? '/instructor' : '/student');

  try {
    await signIn('credentials', {
      name: name.trim(),
      phone: cleanPhone,
      otp: cleanOtp,
      password: password || '',
      role,
      isSignUp: 'true',
      redirectTo: target,
    });
    return { success: true, redirectTo: target };
  } catch (error: any) {
    if (error?.message === 'NEXT_REDIRECT' || error?.digest?.startsWith('NEXT_REDIRECT')) {
      throw error;
    }
    const message =
      error?.cause?.err?.message ||
      (error?.type === 'CredentialsSignin' ? 'ওটিপি কোডটি সঠিক নয় বা মেয়াদ শেষ হয়ে গেছে।' : null) ||
      error?.message ||
      'সাইন আপ ব্যর্থ হয়েছে। আবার চেষ্টা করুন।';
    return { success: false, error: message };
  }
}

/**
 * Login with Phone and OTP
 */
export async function loginWithPhoneOtp(formData: {
  phone: string;
  otp: string;
  password?: string;
  callbackUrl?: string;
}) {
  const { phone, otp, password, callbackUrl } = formData;
  const cleanPhone = phone ? phone.replace(/[\s\-\(\)]/g, '').trim() : '';

  if (!cleanPhone || cleanPhone.length < 11) {
    return { success: false, error: 'সঠিক মোবাইল নম্বর দিন (যেমন: 017XXXXXXXX)।' };
  }

  const cleanOtp = otp ? otp.trim() : '';
  if (!cleanOtp || cleanOtp.length !== 6) {
    return { success: false, error: 'অনুগ্রহ করে ৬ ডিজিটের ওটিপি কোড দিন।' };
  }

  const target = callbackUrl || '/student';

  try {
    await signIn('credentials', {
      phone: cleanPhone,
      otp: cleanOtp,
      password: password || '',
      isSignUp: 'false',
      redirectTo: target,
    });
    return { success: true, redirectTo: target };
  } catch (error: any) {
    if (error?.message === 'NEXT_REDIRECT' || error?.digest?.startsWith('NEXT_REDIRECT')) {
      throw error;
    }
    const message =
      error?.cause?.err?.message ||
      (error?.type === 'CredentialsSignin' ? 'ওটিপি কোডটি সঠিক নয় বা মেয়াদ শেষ হয়ে গেছে।' : null) ||
      error?.message ||
      'লগইন ব্যর্থ হয়েছে। আবার চেষ্টা করুন।';
    return { success: false, error: message };
  }
}

/**
 * Standard Phone sign up (legacy / direct fallback)
 */
export async function signUpWithPhone(formData: {
  name: string;
  phone: string;
  password?: string;
  role?: 'STUDENT' | 'INSTRUCTOR';
  callbackUrl?: string;
}) {
  const { name, phone, password, role = 'STUDENT', callbackUrl } = formData;

  if (!name || !name.trim()) {
    return { success: false, error: 'অনুগ্রহ করে আপনার পুরো নাম লিখুন।' };
  }

  const cleanPhone = phone ? phone.replace(/[\s\-\(\)]/g, '').trim() : '';
  if (!cleanPhone || cleanPhone.length < 11) {
    return { success: false, error: 'সঠিক মোবাইল নম্বর দিন (যেমন: 017XXXXXXXX)।' };
  }

  if (password && password.length < 6) {
    return { success: false, error: 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।' };
  }

  const target = callbackUrl || (role === 'INSTRUCTOR' ? '/instructor' : '/student');

  try {
    await signIn('credentials', {
      name: name.trim(),
      phone: cleanPhone,
      password: password || '',
      role,
      isSignUp: 'true',
      redirectTo: target,
    });
    return { success: true, redirectTo: target };
  } catch (error: any) {
    if (error?.message === 'NEXT_REDIRECT' || error?.digest?.startsWith('NEXT_REDIRECT')) {
      throw error;
    }
    const message = error?.cause?.err?.message || error?.message || 'সাইন আপ ব্যর্থ হয়েছে। আবার চেষ্টা করুন।';
    return { success: false, error: message };
  }
}

/**
 * Standard Phone login with Password
 */
export async function loginWithPhone(formData: {
  phone: string;
  password?: string;
  callbackUrl?: string;
}) {
  const { phone, password, callbackUrl } = formData;
  const cleanPhone = phone ? phone.replace(/[\s\-\(\)]/g, '').trim() : '';

  if (!cleanPhone || cleanPhone.length < 11) {
    return { success: false, error: 'সঠিক মোবাইল নম্বর দিন (যেমন: 017XXXXXXXX)।' };
  }

  const target = callbackUrl || '/student';

  try {
    await signIn('credentials', {
      phone: cleanPhone,
      password: password || '',
      isSignUp: 'false',
      redirectTo: target,
    });
    return { success: true, redirectTo: target };
  } catch (error: any) {
    if (error?.message === 'NEXT_REDIRECT' || error?.digest?.startsWith('NEXT_REDIRECT')) {
      throw error;
    }
    const message = error?.cause?.err?.message || error?.message || 'লগইন ব্যর্থ হয়েছে। মোবাইল নম্বর বা পাসওয়ার্ড পরীক্ষা করুন।';
    return { success: false, error: message };
  }
}
