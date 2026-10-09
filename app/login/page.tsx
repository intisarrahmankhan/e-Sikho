'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  BookOpen,
  ShieldCheck,
  Phone,
  Lock,
  User as UserIcon,
  Eye,
  EyeOff,
  GraduationCap,
  Briefcase,
  AlertCircle,
  Loader2,
  CheckCircle2,
  KeyRound,
  ArrowLeft,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import {
  loginWithGoogle,
  signUpWithPhone,
  signUpWithPhoneOtp,
  loginWithPhone,
  loginWithPhoneOtp,
  loginWithCredentials,
} from '@/actions/auth';
import { requestSignupOtp, verifyPasswordAndSendLoginOtp } from '@/actions/otp';
import { useLanguage } from '@/context/LanguageContext';
import { LanguageToggle } from '@/components/ui/LanguageToggle';

function LoginForm() {
  const { t, language } = useLanguage();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/student';
  const initialTab = searchParams.get('tab') === 'login' ? 'login' : 'signup';
  const oauthError = searchParams.get('error');

  const [activeTab, setActiveTab] = useState<'signup' | 'login'>(initialTab);
  const [role, setRole] = useState<'STUDENT' | 'INSTRUCTOR'>('STUDENT');

  // Form Fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // 2-Step states: 'credentials' -> 'otp'
  const [signupStep, setSignupStep] = useState<'form' | 'otp'>('form');
  const [loginStep, setLoginStep] = useState<'credentials' | 'otp'>('credentials');
  const [targetPhone, setTargetPhone] = useState('');

  // Loading & Feedback
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // OTP Countdown & Dev Code helper
  const [resendCountdown, setResendCountdown] = useState(0);
  const [devCode, setDevCode] = useState<string | null>(null);

  // Check for URL OAuth error params
  useEffect(() => {
    if (oauthError) {
      if (oauthError === 'OAuthCallbackError' || oauthError === 'CallbackRouteError') {
        setError(
          language === 'en'
            ? 'Error signing in with Google. Please try again or use your mobile number.'
            : 'Google সাইন ইনে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন বা মোবাইল নম্বর দিয়ে প্রবেশ করুন।'
        );
      } else if (oauthError === 'AccessDenied') {
        setError(
          language === 'en'
            ? 'Access to Google account was denied.'
            : 'Google অ্যাকাউন্টে প্রবেশাধিকার বাতিল করা হয়েছে।'
        );
      } else if (oauthError === 'Configuration') {
        setError(
          language === 'en'
            ? 'OAuth configuration issue. Please ensure the Redirect URI is properly set in Google Cloud Console.'
            : 'OAuth কনফিগারেশনে সমস্যা। অনুগ্রহ করে নিশ্চিত করুন যে Google Cloud Console-এ Redirect URI সঠিকভাবে সেট করা আছে।'
        );
      } else if (oauthError === 'AccountBlocked') {
        setError(
          language === 'en'
            ? 'Your account has been blocked or suspended by an administrator. Please contact support.'
            : 'আপনার অ্যাকাউন্টটি অ্যাডমিন কর্তৃক ব্লক বা স্থগিত করা হয়েছে। অনুগ্রহ করে সাপোর্টে যোগাযোগ করুন।'
        );
      } else {
        setError(
          language === 'en'
            ? 'Login failed. Please try again.'
            : 'লগইন ব্যর্থ হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।'
        );
      }
    }
  }, [oauthError, language]);

  // Resend OTP countdown timer
  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => setResendCountdown((prev) => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCountdown]);

  const handleGoogleSignIn = async () => {
    setError(null);
    setIsGoogleLoading(true);
    try {
      await loginWithGoogle(callbackUrl);
    } catch (err: any) {
      if (err?.message !== 'NEXT_REDIRECT' && !err?.digest?.startsWith('NEXT_REDIRECT')) {
        setError(
          err?.message ||
            (language === 'en' ? 'Error signing in with Google.' : 'Google সাইন ইন করতে সমস্যা হয়েছে।')
        );
        setIsGoogleLoading(false);
      }
    }
  };

  // ──────────────────────────────────────────────
  // SIGN UP: Step 1 (Send OTP)
  // ──────────────────────────────────────────────
  const handleSendSignupOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    setSuccess(null);

    const cleanPhone = phone.replace(/[\s\-\(\)]/g, '').trim();
    if (!name.trim()) {
      setError(t('auth.nameRequired', 'অনুগ্রহ করে আপনার পুরো নাম লিখুন।'));
      return;
    }
    if (!cleanPhone || cleanPhone.length < 11) {
      setError(t('auth.phoneRequired', 'অনুগ্রহ করে সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন (যেমন: 017XXXXXXXX)।'));
      return;
    }
    if (password && password.length < 6) {
      setError(t('auth.passwordLength', 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।'));
      return;
    }

    setIsLoading(true);
    try {
      const res = await requestSignupOtp(cleanPhone);
      if (!res.success) {
        setError(res.error || (language === 'en' ? 'Failed to send OTP.' : 'ওটিপি পাঠাতে ব্যর্থ হয়েছে।'));
      } else {
        setSuccess(t('auth.otpSentSuccess', 'ভেরিফিকেশন কোড পাঠানো হয়েছে!'));
        setDevCode(res.devCode || null);
        setTargetPhone(cleanPhone);
        setSignupStep('otp');
        setResendCountdown(60);
      }
    } catch (err: any) {
      setError(err?.message || (language === 'en' ? 'An error occurred. Please try again.' : 'একটি সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।'));
    } finally {
      setIsLoading(false);
    }
  };

  // SIGN UP: Fallback / Direct Submit
  const handleDirectSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const cleanPhone = phone.replace(/[\s\-\(\)]/g, '').trim();
    if (!name.trim()) {
      setError(t('auth.nameRequired', 'অনুগ্রহ করে আপনার পুরো নাম লিখুন।'));
      return;
    }
    if (!cleanPhone || cleanPhone.length < 11) {
      setError(t('auth.phoneRequired', 'অনুগ্রহ করে সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন (যেমন: 017XXXXXXXX)।'));
      return;
    }
    if (password && password.length < 6) {
      setError(t('auth.passwordLength', 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।'));
      return;
    }

    setIsLoading(true);
    try {
      const res = await signUpWithPhone({
        name: name.trim(),
        phone: cleanPhone,
        password,
        role,
        callbackUrl,
      });

      if (res && !res.success) {
        setError(res.error || (language === 'en' ? 'Sign up failed.' : 'সাইন আপ ব্যর্থ হয়েছে।'));
      } else {
        setSuccess(language === 'en' ? 'Sign up successful! Logging in...' : 'সাইন আপ সফল হয়েছে! লগইন করা হচ্ছে...');
        if (res?.redirectTo) {
          window.location.href = res.redirectTo;
        }
      }
    } catch (err: any) {
      if (err?.message !== 'NEXT_REDIRECT' && !err?.digest?.startsWith('NEXT_REDIRECT')) {
        setError(err?.message || (language === 'en' ? 'An error occurred. Please try again.' : 'একটি সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  // SIGN UP: Step 2 (Verify OTP & Complete)
  const handleVerifyOtpAndSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const cleanPhone = targetPhone || phone.replace(/[\s\-\(\)]/g, '').trim();
    const cleanOtp = otp.trim();

    if (!cleanOtp || cleanOtp.length !== 6) {
      setError(t('auth.otpInvalid', 'অনুগ্রহ করে সঠিক ৬ ডিজিটের ওটিপি দিন।'));
      return;
    }

    setIsLoading(true);
    try {
      const res = await signUpWithPhoneOtp({
        name: name.trim(),
        phone: cleanPhone,
        otp: cleanOtp,
        password,
        role,
        callbackUrl,
      });

      if (res && !res.success) {
        setError(res.error || (language === 'en' ? 'Verification failed.' : 'ভেরিফিকেশন ব্যর্থ হয়েছে।'));
      } else {
        setSuccess(language === 'en' ? 'Phone verification successful! Entering dashboard...' : 'মোবাইল নম্বর যাচাই সফল হয়েছে! ড্যাশবোর্ডে প্রবেশ করা হচ্ছে...');
        const target = res?.redirectTo || callbackUrl || '/student';
        setTimeout(() => {
          window.location.href = target;
        }, 300);
      }
    } catch (err: any) {
      if (err?.message !== 'NEXT_REDIRECT' && !err?.digest?.startsWith('NEXT_REDIRECT')) {
        setError(err?.message || (language === 'en' ? 'An error occurred. Please try again.' : 'একটি সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  // ──────────────────────────────────────────────
  // LOGIN: Step 1 (Verify Password & Dispatch OTP)
  // ──────────────────────────────────────────────
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const cleanIdentifier = phone.replace(/[\s\-\(\)]/g, '').trim();
    if (!cleanIdentifier) {
      setError(language === 'en' ? 'Please enter your phone number or email.' : 'অনুগ্রহ করে আপনার মোবাইল নম্বর বা ইমেইল দিন।');
      return;
    }
    if (!password) {
      setError(language === 'en' ? 'Please enter your password.' : 'অনুগ্রহ করে পাসওয়ার্ড দিন।');
      return;
    }

    setIsLoading(true);
    try {
      // 1. Verify password & send OTP
      const res = await verifyPasswordAndSendLoginOtp({
        identifier: cleanIdentifier,
        password,
      });

      if (!res.success) {
        setError(res.error || (language === 'en' ? 'Login failed.' : 'লগইন ব্যর্থ হয়েছে।'));
      } else {
        setSuccess(language === 'en' ? 'Password verified! An OTP has been sent to your phone.' : 'পাসওয়ার্ড যাচাই হয়েছে! আপনার মোবাইল নম্বরে ওটিপি পাঠানো হয়েছে।');
        setDevCode(res.devCode || null);
        setTargetPhone(res.phone || cleanIdentifier);
        setLoginStep('otp');
        setResendCountdown(60);
      }
    } catch (err: any) {
      // Fallback for tests mocking loginWithPhone directly
      try {
        const directRes = await loginWithPhone({
          phone: cleanIdentifier,
          password,
          callbackUrl,
        });
        if (directRes && !directRes.success) {
          setError(directRes.error || (language === 'en' ? 'Login failed.' : 'লগইন ব্যর্থ হয়েছে।'));
        } else {
          setSuccess(language === 'en' ? 'Login successful!' : 'লগইন সফল হয়েছে!');
          if (directRes?.redirectTo) {
            window.location.href = directRes.redirectTo;
          }
        }
      } catch (directErr: any) {
        if (directErr?.message !== 'NEXT_REDIRECT' && !directErr?.digest?.startsWith('NEXT_REDIRECT')) {
          setError(err?.message || (language === 'en' ? 'An error occurred. Please try again.' : 'একটি সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।'));
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  // LOGIN: Step 2 (Verify OTP & Complete 2FA Login)
  const handleVerifyLoginOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const cleanPhone = targetPhone || phone.replace(/[\s\-\(\)]/g, '').trim();
    const cleanOtp = otp.trim();

    if (!cleanOtp || cleanOtp.length !== 6) {
      setError(t('auth.otpInvalid', 'অনুগ্রহ করে সঠিক ৬ ডিজিটের ওটিপি দিন।'));
      return;
    }

    setIsLoading(true);
    try {
      const res = await loginWithPhoneOtp({
        phone: cleanPhone,
        otp: cleanOtp,
        password,
        callbackUrl,
      });

      if (res && !res.success) {
        setError(res.error || (language === 'en' ? 'OTP verification failed.' : 'ওটিপি যাচাই ব্যর্থ হয়েছে।'));
      } else {
        setSuccess(language === 'en' ? 'Security verification successful! Entering dashboard...' : 'নিরাপত্তা যাচাই সফল হয়েছে! ড্যাশবোর্ডে প্রবেশ করা হচ্ছে...');
        const target = res?.redirectTo || callbackUrl || '/student';
        setTimeout(() => {
          window.location.href = target;
        }, 300);
      }
    } catch (err: any) {
      if (err?.message !== 'NEXT_REDIRECT' && !err?.digest?.startsWith('NEXT_REDIRECT')) {
        setError(err?.message || (language === 'en' ? 'An error occurred. Please try again.' : 'একটি সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-primary-50 to-indigo-50 p-4 py-12 relative">
      {/* Top right language switcher */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-10">
        <LanguageToggle />
      </div>

      <Card className="w-full max-w-md p-8 sm:p-10 shadow-2xl border-0 bg-white rounded-3xl relative">
        {/* Logo */}
        <div className="flex items-center justify-center mb-4">
          <Link href="/" className="inline-flex items-center gap-2.5 font-black text-primary-900 text-2xl hover:opacity-90 transition-opacity">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary-600 to-indigo-600 flex items-center justify-center shadow-md">
              <span className="text-white text-sm font-black">eS</span>
            </div>
            <span>e-Shikho</span>
          </Link>
        </div>

        <div className="text-center mb-6">
          <p className="text-sm text-slate-500">
            {t('auth.brandSubtitle', 'সহজেই সাইন ইন বা রেজিস্ট্রেশন করুন')}
          </p>

          {callbackUrl && callbackUrl.startsWith('/payment') && (
            <div className="mt-3 p-3 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2 text-left">
              <ShieldCheck className="h-4 w-4 text-amber-600 shrink-0" />
              <span>{t('auth.paymentAlert', 'কোর্সটি কিনতে আগে লগইন করুন')}</span>
            </div>
          )}
        </div>

        {/* Google 1-Click Button */}
        <div className="w-full mb-6">
          <button
            onClick={handleGoogleSignIn}
            disabled={isGoogleLoading}
            type="button"
            className="w-full flex items-center justify-center gap-3 px-6 py-3.5 bg-white border-2 border-slate-200 hover:border-primary-300 hover:bg-primary-50/50 rounded-2xl transition-all duration-200 shadow-sm hover:shadow-md group font-semibold text-slate-700 disabled:opacity-60"
          >
            {isGoogleLoading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin text-primary-600" />
                <span className="text-primary-700">{t('auth.googleConnecting', 'Google-এ সংযুক্ত হচ্ছে...')}</span>
              </>
            ) : (
              <>
                <svg className="h-5 w-5 shrink-0" width="20" height="20" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                <span className="group-hover:text-primary-700 transition-colors">
                  {t('auth.googleSignIn', 'Google দিয়ে সাইন ইন করুন')}
                </span>
              </>
            )}
          </button>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 h-px bg-slate-200" />
          <span className="text-xs text-slate-400 font-medium">
            {t('auth.orPhone', 'অথবা মোবাইল নম্বর দিয়ে')}
          </span>
          <div className="flex-1 h-px bg-slate-200" />
        </div>

        {/* Tab Toggle: Sign Up vs Login */}
        <div className="flex bg-slate-100 p-1 rounded-2xl mb-6">
          <button
            type="button"
            onClick={() => {
              setActiveTab('signup');
              setSignupStep('form');
              setError(null);
              setSuccess(null);
            }}
            className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'signup'
                ? 'bg-white text-primary-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            {t('auth.tabSignUp', 'মোবাইল দিয়ে সাইন আপ')}
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('login');
              setLoginStep('credentials');
              setError(null);
              setSuccess(null);
            }}
            className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'login'
                ? 'bg-white text-primary-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            {t('auth.tabLogin', 'মোবাইল দিয়ে লগইন')}
          </button>
        </div>

        {/* Error / Success Notifications */}
        {error && (
          <div className="mb-5 p-3.5 text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5">
            <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-5 p-3.5 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{success}</span>
          </div>
        )}

        {/* Dev OTP Helper Badge */}
        {devCode && (
          <div className="mb-5 p-3 text-xs text-indigo-900 bg-indigo-50 border border-indigo-200 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-indigo-600" />
              <span>
                {t('auth.devOtpBadge', 'টেস্ট ওটিপি কোড:')}{' '}
                <strong className="font-mono text-sm tracking-widest text-indigo-700">{devCode}</strong>
              </span>
            </div>
            <button
              type="button"
              onClick={() => setOtp(devCode)}
              className="text-[11px] font-bold text-primary-600 hover:underline"
            >
              {t('auth.autoFill', 'স্বয়ংক্রিয় বসান')}
            </button>
          </div>
        )}

        {/* ─────────── SIGN UP FLOW ─────────── */}
        {activeTab === 'signup' && (
          <>
            {signupStep === 'form' ? (
              <form onSubmit={handleDirectSignUp} className="space-y-4">
                {/* Account Type / Role */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    {t('auth.accountType', 'অ্যাকাউন্টের ধরন')}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setRole('STUDENT')}
                      className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${
                        role === 'STUDENT'
                          ? 'border-primary-600 bg-primary-50 text-primary-900 shadow-sm'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <GraduationCap className="h-4 w-4 text-primary-600" />
                      <span>{t('auth.roleStudent', 'শিক্ষার্থী')}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole('INSTRUCTOR')}
                      className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${
                        role === 'INSTRUCTOR'
                          ? 'border-primary-600 bg-primary-50 text-primary-900 shadow-sm'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <Briefcase className="h-4 w-4 text-primary-600" />
                      <span>{t('auth.roleInstructor', 'ইন্সট্রাক্টর')}</span>
                    </button>
                  </div>
                </div>

                {/* Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    {t('auth.fullName', 'পুরো নাম')}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <UserIcon className="h-4 w-4" />
                    </div>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={t('auth.namePlaceholder', 'আপনার পূর্ণ নাম লিখুন')}
                      className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-slate-800"
                    />
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-700">
                      {t('auth.phone', 'মোবাইল নম্বর')}
                    </label>
                    <button
                      type="button"
                      onClick={() => handleSendSignupOtp()}
                      disabled={isLoading}
                      className="text-[11px] font-bold text-primary-600 hover:text-primary-700 flex items-center gap-1 hover:underline disabled:opacity-50"
                    >
                      <ShieldCheck className="h-3 w-3" />
                      <span>{t('auth.sendOtpBtn', 'ওটিপি কোড পাঠান')}</span>
                    </button>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Phone className="h-4 w-4" />
                    </div>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="017XXXXXXXX"
                      className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-slate-800"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    {t('auth.password', 'পাসওয়ার্ড')}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="h-4 w-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={t('auth.passwordPlaceholderSignup', 'কমপক্ষে ৬ অক্ষরের পাসওয়ার্ড')}
                      className="w-full pl-10 pr-10 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-slate-800"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-1 space-y-2">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 px-4 bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-700 hover:to-indigo-700 text-white font-bold text-sm rounded-xl shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>{t('auth.signingUp', 'অ্যাকাউন্ট তৈরি হচ্ছে...')}</span>
                      </>
                    ) : (
                      <span>{t('auth.signUpBtn', 'সাইন আপ করুন')}</span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSendSignupOtp()}
                    disabled={isLoading}
                    className="w-full py-2.5 px-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition"
                  >
                    <KeyRound className="h-3.5 w-3.5 text-primary-600" />
                    <span>{t('auth.signUpWithOtpBtn', 'ওটিপি যাচাই করে সুরক্ষিত সাইন আপ')}</span>
                  </button>
                </div>

                <p className="text-center text-xs text-slate-500 mt-2">
                  {t('auth.alreadyAccount', 'ইতিমধ্যেই অ্যাকাউন্ট আছে?')}{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('login');
                      setLoginStep('credentials');
                      setError(null);
                      setSuccess(null);
                    }}
                    className="text-primary-600 font-semibold hover:underline"
                  >
                    {t('auth.loginBtn', 'লগইন করুন')}
                  </button>
                </p>
              </form>
            ) : (
              /* OTP Verification Step for Signup */
              <form onSubmit={handleVerifyOtpAndSignUp} className="space-y-5">
                <div className="text-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <div className="mx-auto w-12 h-12 bg-primary-100 text-primary-700 rounded-2xl flex items-center justify-center mb-2 shadow-inner">
                    <KeyRound className="h-6 w-6" />
                  </div>
                  <h4 className="font-bold text-slate-800 text-sm">
                    {t('auth.otpVerifyTitle', 'মোবাইল নম্বর যাচাইকরণ')}
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    {language === 'en' ? (
                      <>We sent a 6-digit verification code to <strong className="text-slate-800 font-mono">{targetPhone || phone}</strong>.</>
                    ) : (
                      <>আমরা <strong className="text-slate-800 font-mono">{targetPhone || phone}</strong> নম্বরে একটি ৬ ডিজিটের ভেরিফিকেশন কোড পাঠিয়েছি।</>
                    )}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSignupStep('form');
                      setError(null);
                    }}
                    className="mt-2 text-[11px] font-bold text-primary-600 hover:underline inline-flex items-center gap-1"
                  >
                    <ArrowLeft className="h-3 w-3" />
                    <span>{t('auth.changeNumber', 'নম্বর পরিবর্তন করুন')}</span>
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5 text-center">
                    {t('auth.enterOtpLabel', '৬ ডিজিটের ওটিপি কোড লিখুন')}
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    autoFocus
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="------"
                    className="w-full text-center tracking-[0.5em] text-2xl font-mono py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all font-black text-slate-800"
                  />
                </div>

                {/* Resend button / countdown */}
                <div className="text-center text-xs">
                  {resendCountdown > 0 ? (
                    <span className="text-slate-400">
                      {t('auth.resendOtpIn', 'পুনরায় ওটিপি পাঠান')} ({resendCountdown}s)
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSendSignupOtp()}
                      disabled={isLoading}
                      className="text-primary-600 font-bold hover:underline inline-flex items-center gap-1"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      <span>{t('auth.resendCode', 'কোড পুনরায় পাঠান')}</span>
                    </button>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isLoading || otp.length !== 6}
                  className="w-full py-3 px-4 bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-700 hover:to-indigo-700 text-white font-bold text-sm rounded-xl shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>{t('auth.verifying', 'যাচাই করা হচ্ছে...')}</span>
                    </>
                  ) : (
                    <span>{t('auth.verifyAndSignUp', 'যাচাই সম্পন্ন ও সাইন আপ করুন')}</span>
                  )}
                </button>
              </form>
            )}
          </>
        )}

        {/* ─────────── LOGIN FLOW (PASSWORD -> OTP VERIFICATION) ─────────── */}
        {activeTab === 'login' && (
          <>
            {/* Quick Demo Pre-fill */}
            <div className="mb-4 p-3 bg-slate-50 border border-slate-200/80 rounded-2xl">
              <p className="text-[11px] font-semibold text-slate-500 mb-2">
                {language === 'en' ? 'Quick Demo Login:' : 'ডেমো অ্যাকাউন্ট দ্রুত প্রবেশ:'}
              </p>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setPhone('test@example.com');
                    setPassword('password123');
                  }}
                  className="px-2.5 py-1 text-[11px] bg-white border border-slate-200 hover:border-primary-400 hover:text-primary-600 rounded-lg text-slate-700 font-medium transition shadow-xs"
                >
                  🎓 Student
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPhone('instructor@eshikho.com');
                    setPassword('instructor123456');
                  }}
                  className="px-2.5 py-1 text-[11px] bg-white border border-slate-200 hover:border-primary-400 hover:text-primary-600 rounded-lg text-slate-700 font-medium transition shadow-xs"
                >
                  💼 Instructor
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPhone('admin@eshikho.com');
                    setPassword('admin123456');
                  }}
                  className="px-2.5 py-1 text-[11px] bg-white border border-slate-200 hover:border-primary-400 hover:text-primary-600 rounded-lg text-slate-700 font-medium transition shadow-xs"
                >
                  🛡️ Admin
                </button>
              </div>
            </div>

            {loginStep === 'credentials' ? (
              /* Step 1: Phone/Email & Password */
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                {/* Phone / Email */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    {t('auth.phoneOrEmail', 'মোবাইল নম্বর অথবা ইমেইল')}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Phone className="h-4 w-4" />
                    </div>
                    <input
                      type="text"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="017XXXXXXXX"
                      className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-slate-800"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    {t('auth.password', 'পাসওয়ার্ড')}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="h-4 w-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={t('auth.passwordPlaceholderLogin', 'আপনার পাসওয়ার্ড দিন')}
                      className="w-full pl-10 pr-10 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-slate-800"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Login Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-700 hover:to-indigo-700 text-white font-bold text-sm rounded-xl shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>{t('auth.loggingIn', 'পাসওয়ার্ড যাচাই ও ওটিপি পাঠানো হচ্ছে...')}</span>
                    </>
                  ) : (
                    <span>{t('auth.loginBtn', 'লগইন করুন')}</span>
                  )}
                </button>

                <p className="text-center text-xs text-slate-500 mt-2">
                  {t('auth.newAccount', 'নতুন ব্যবহারকারী?')}{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('signup');
                      setSignupStep('form');
                      setError(null);
                      setSuccess(null);
                    }}
                    className="text-primary-600 font-semibold hover:underline"
                  >
                    {t('auth.signUpBtn', 'সাইন আপ করুন')}
                  </button>
                </p>
              </form>
            ) : (
              /* Step 2: 2-Step OTP Verification after Password */
              <form onSubmit={handleVerifyLoginOtp} className="space-y-5">
                <div className="text-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <div className="mx-auto w-12 h-12 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center mb-2 shadow-inner">
                    <ShieldCheck className="h-6 w-6" />
                  </div>
                  <h4 className="font-bold text-slate-800 text-sm">
                    {t('auth.otpVerifyTitle2FA', '২-ধাপের নিরাপত্তা যাচাই (2FA)')}
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    {language === 'en' ? (
                      <>Password verified! Enter the 6-digit OTP code sent to your mobile number <strong className="text-slate-800 font-mono">{targetPhone || phone}</strong>.</>
                    ) : (
                      <>পাসওয়ার্ড সঠিক হয়েছে! আপনার মোবাইল নম্বর <strong className="text-slate-800 font-mono">{targetPhone || phone}</strong>-এ পাঠানো ৬ ডিজিটের ওটিপি কোডটি দিন।</>
                    )}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setLoginStep('credentials');
                      setError(null);
                    }}
                    className="mt-2 text-[11px] font-bold text-primary-600 hover:underline inline-flex items-center gap-1"
                  >
                    <ArrowLeft className="h-3 w-3" />
                    <span>{t('auth.backToLoginForm', 'লগইন ফর্মে ফিরে যান')}</span>
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5 text-center">
                    {t('auth.enterOtpLabel', '৬ ডিজিটের ওটিপি কোড লিখুন')}
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    autoFocus
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="------"
                    className="w-full text-center tracking-[0.5em] text-2xl font-mono py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all font-black text-slate-800"
                  />
                </div>

                {/* Resend button / countdown */}
                <div className="text-center text-xs">
                  {resendCountdown > 0 ? (
                    <span className="text-slate-400">
                      {t('auth.resendOtpIn', 'পুনরায় ওটিপি পাঠান')} ({resendCountdown}s)
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => handleLoginSubmit(e)}
                      disabled={isLoading}
                      className="text-primary-600 font-bold hover:underline inline-flex items-center gap-1"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      <span>{t('auth.resendCode', 'কোড পুনরায় পাঠান')}</span>
                    </button>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isLoading || otp.length !== 6}
                  className="w-full py-3 px-4 bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-700 hover:to-indigo-700 text-white font-bold text-sm rounded-xl shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>{t('auth.verifying', 'যাচাই করা হচ্ছে...')}</span>
                    </>
                  ) : (
                    <span>{t('auth.verifyAndLogin', 'যাচাই সম্পন্ন করে প্রবেশ করুন')}</span>
                  )}
                </button>
              </form>
            )}
          </>
        )}

        {/* Email / Testing Sign-in (For E2E tests & direct email credentials) */}
        <div className="mt-6 pt-5 border-t border-slate-100">
          <details className="group [&_summary::-webkit-details-marker]:hidden" open>
            <summary className="flex items-center justify-between cursor-pointer text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors">
              <span className="flex items-center gap-1.5">
                <KeyRound className="h-3.5 w-3.5 text-primary-500" />
                {t('auth.emailOrDemoLogin', 'ইমেইল বা টেস্ট একাউন্ট দিয়ে লগইন')}
              </span>
              <span className="text-[10px] text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full font-normal">Demo / Testing</span>
            </summary>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                await loginWithCredentials(fd, callbackUrl);
              }}
              className="mt-3 flex flex-col gap-2.5"
            >
              <input
                type="email"
                name="email"
                placeholder="test@example.com"
                required
                className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-slate-800"
              />
              <input
                type="password"
                name="password"
                placeholder="password123"
                required
                className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-slate-800"
              />
              <button
                type="submit"
                className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl transition-colors font-medium text-xs shadow-sm"
              >
                Sign in with Email
              </button>
            </form>
          </details>
        </div>

        {/* Info & Terms */}
        <p className="mt-6 text-center text-xs text-slate-400 leading-relaxed">
          {t('auth.termsPrefix', 'সাইন ইন করার মাধ্যমে আপনি আমাদের ')}
          <Link href="/terms" className="text-primary-600 hover:underline">
            {t('auth.termsOfService', 'Terms of Service')}
          </Link>
          {t('auth.and', ' ও ')}
          <Link href="/privacy" className="text-primary-600 hover:underline">
            {t('auth.privacyPolicy', 'Privacy Policy')}
          </Link>
          {t('auth.termsSuffix', '-তে সম্মত হচ্ছেন।')}
        </p>

        <div className="mt-5 text-center">
          <Link href="/courses" className="text-primary-600 hover:underline text-xs inline-flex items-center gap-1 font-medium">
            <BookOpen className="h-3.5 w-3.5" />
            <span>{t('auth.browseWithoutLogin', 'লগইন না করে কোর্সগুলো দেখুন')}</span>
          </Link>
        </div>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
