'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  User,
  KeyRound,
  Phone,
  Mail,
  Building,
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Lock,
  Eye,
  EyeOff,
  DollarSign,
  RotateCcw,
  ShieldAlert,
  GraduationCap,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useLanguage } from '@/context/LanguageContext';
import { updateAdminProfileAction, updateAdminPasswordAction } from '@/actions/admin';

export interface AdminProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  status: string;
  image?: string;
  headline?: string;
  bio?: string;
  organization?: string;
  createdAt?: string;
}

interface AdminSettingsClientProps {
  initialProfile: AdminProfile;
}

export function AdminSettingsClient({ initialProfile }: AdminSettingsClientProps) {
  const { language } = useLanguage();
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'system'>('profile');

  // Profile Form State
  const [name, setName] = useState(initialProfile.name || '');
  const [phone, setPhone] = useState(initialProfile.phone || '');
  const [headline, setHeadline] = useState(initialProfile.headline || '');
  const [organization, setOrganization] = useState(initialProfile.organization || 'e-Sikho Administration');
  const [bio, setBio] = useState(initialProfile.bio || '');

  // Password Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  // Status & Feedback
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    startTransition(async () => {
      const res = await updateAdminProfileAction({
        name,
        phone,
        headline,
        organization,
        bio,
      });

      if (res.success) {
        setFeedback({
          type: 'success',
          message:
            language === 'en'
              ? 'Administrator profile updated successfully.'
              : 'অ্যাডমিন প্রোফাইল সফলভাবে আপডেট করা হয়েছে।',
        });
      } else {
        setFeedback({
          type: 'error',
          message: res.error || (language === 'en' ? 'Failed to update profile.' : 'প্রোফাইল আপডেট ব্যর্থ হয়েছে।'),
        });
      }
    });
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (newPassword.length < 6) {
      setFeedback({
        type: 'error',
        message:
          language === 'en'
            ? 'New password must be at least 6 characters long.'
            : 'নতুন পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      setFeedback({
        type: 'error',
        message:
          language === 'en'
            ? 'New passwords do not match. Please re-enter.'
            : 'নতুন পাসওয়ার্ড মিলছে না। অনুগ্রহ করে আবার চেক করুন।',
      });
      return;
    }

    startTransition(async () => {
      const res = await updateAdminPasswordAction({
        currentPassword,
        newPassword,
      });

      if (res.success) {
        setFeedback({
          type: 'success',
          message:
            language === 'en'
              ? 'Admin password changed successfully.'
              : 'অ্যাডমিন পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে।',
        });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setFeedback({
          type: 'error',
          message: res.error || (language === 'en' ? 'Failed to change password.' : 'পাসওয়ার্ড পরিবর্তন ব্যর্থ হয়েছে।'),
        });
      }
    });
  };

  const isSuperadmin = initialProfile.role === 'SUPERADMIN';

  return (
    <div className="space-y-6 pb-16 w-full max-w-6xl mx-auto">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-primary-50 border border-primary-200 px-3 py-1 text-xs font-semibold text-primary-700 mb-2">
            <ShieldCheck className="h-3.5 w-3.5 text-primary-600" />
            {isSuperadmin
              ? language === 'en'
                ? 'Superadmin Security & Configuration'
                : 'সুপার-অ্যাডমিন নিরাপত্তা ও কনফিগারেশন'
              : language === 'en'
              ? 'Admin Account Settings'
              : 'অ্যাডমিন অ্যাকাউন্ট সেটিংস'}
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {language === 'en' ? 'System & Admin Settings' : 'সিস্টেম ও অ্যাডমিন সেটিংস'}
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {language === 'en'
              ? 'Manage administrator profile credentials, security policies, and platform operations.'
              : 'অ্যাডমিনিস্ট্রেটর প্রোফাইল, নিরাপত্তা পলিসি এবং প্ল্যাটফর্ম অপারেশন নিয়ন্ত্রণ করুন।'}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Badge
            variant="default"
            className={
              isSuperadmin
                ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold shadow-xs px-3 py-1 text-xs'
                : 'bg-primary-600 text-white font-semibold shadow-xs px-3 py-1 text-xs'
            }
          >
            <Sparkles className="h-3 w-3 mr-1" />
            {initialProfile.role}
          </Badge>
          <Badge variant="outline" className="text-emerald-700 bg-emerald-50 border-emerald-200 text-xs px-3 py-1">
            <CheckCircle2 className="h-3 w-3 mr-1 text-emerald-600" />
            {language === 'en' ? 'Active Access' : 'সক্রিয় এক্সেস'}
          </Badge>
        </div>
      </div>

      {/* ── Feedback Banner ── */}
      {feedback && (
        <div
          role="alert"
          className={`flex items-start gap-3 rounded-xl p-4 border text-sm font-medium animate-in fade-in duration-200 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 mt-0.5" />
          ) : (
            <AlertCircle className="h-5 w-5 shrink-0 text-rose-600 mt-0.5" />
          )}
          <span className="flex-1">{feedback.message}</span>
          <button
            onClick={() => setFeedback(null)}
            className="text-xs text-slate-400 hover:text-slate-600 underline font-semibold"
          >
            {language === 'en' ? 'Dismiss' : 'বন্ধ করুন'}
          </button>
        </div>
      )}

      {/* ── Tabs Navigation ── */}
      <div className="flex border-b border-slate-200/80 gap-2 overflow-x-auto pb-px">
        <button
          onClick={() => {
            setActiveTab('profile');
            setFeedback(null);
          }}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg border-b-2 transition-all ${
            activeTab === 'profile'
              ? 'border-primary-600 text-primary-600 bg-primary-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <User className="h-4 w-4" />
          <span>{language === 'en' ? 'Administrator Profile' : 'অ্যাডমিন প্রোফাইল'}</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('security');
            setFeedback(null);
          }}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg border-b-2 transition-all ${
            activeTab === 'security'
              ? 'border-primary-600 text-primary-600 bg-primary-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <KeyRound className="h-4 w-4" />
          <span>{language === 'en' ? 'Security & Password' : 'নিরাপত্তা ও পাসওয়ার্ড'}</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('system');
            setFeedback(null);
          }}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg border-b-2 transition-all ${
            activeTab === 'system'
              ? 'border-primary-600 text-primary-600 bg-primary-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <ShieldCheck className="h-4 w-4" />
          <span>{language === 'en' ? 'Platform Control Shortcuts' : 'সিস্টেম কন্ট্রোল শর্টকাট'}</span>
        </button>
      </div>

      {/* ── Tab 1: Profile ── */}
      {activeTab === 'profile' && (
        <form onSubmit={handleProfileSubmit} className="space-y-6">
          <Card className="border border-slate-200/80 shadow-xs">
            <CardHeader className="p-5 sm:p-6 border-b border-slate-100">
              <CardTitle className="text-base font-bold text-slate-900">
                {language === 'en' ? 'Identity & Contact Information' : 'পরিচিতি ও যোগাযোগের বিবরণ'}
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                {language === 'en'
                  ? 'Your administrator identification across platform ledger and moderation logs.'
                  : 'প্ল্যাটফর্মের লেজার ও মডারেশন লগে প্রদর্শিত আপনার তথ্য।'}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 sm:p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    {language === 'en' ? 'Full Name' : 'পুরো নাম'}
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all bg-white"
                      placeholder="e.g. Super Admin"
                    />
                  </div>
                </div>

                {/* Mobile Phone */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    {language === 'en' ? 'Mobile Number (2FA OTP)' : 'মোবাইল নম্বর (লগইন ২এফএ)'}
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all bg-white"
                      placeholder="017XXXXXXXX"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400">
                    {language === 'en'
                      ? 'Used for two-factor SMS OTP authentication during login.'
                      : 'লগইনের সময় ওটিপি ভেরিফিকেশনের জন্য ব্যবহৃত নম্বর।'}
                  </p>
                </div>

                {/* Email (Read-only) */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <span>{language === 'en' ? 'Login Email Identifier' : 'লগইন ইমেইল ঠিকানা'}</span>
                    <Lock className="h-3 w-3 text-slate-400" />
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="email"
                      value={initialProfile.email}
                      disabled
                      className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400">
                    {language === 'en'
                      ? 'System authentication key. Contact root infrastructure to alter.'
                      : 'সিস্টেম অথেনটিকেশন আইডেন্টিফায়ার (পরিবর্তনযোগ্য নয়)।'}
                  </p>
                </div>

                {/* Department / Organization */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    {language === 'en' ? 'Department / Unit' : 'ডিপার্টমেন্ট / শাখা'}
                  </label>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      value={organization}
                      onChange={(e) => setOrganization(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all bg-white"
                      placeholder="e.g. Operations & Finance"
                    />
                  </div>
                </div>
              </div>

              {/* Headline */}
              <div className="space-y-1.5 pt-2">
                <label className="text-xs font-bold text-slate-700">
                  {language === 'en' ? 'Administrative Title / Role Headline' : 'প্রশাসনিক পদবি / হেডলাইন'}
                </label>
                <input
                  type="text"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all bg-white"
                  placeholder={
                    isSuperadmin
                      ? 'Lead Platform Administrator & Financial Controller'
                      : 'Platform Content & Operations Administrator'
                  }
                />
              </div>

              {/* Bio */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  {language === 'en' ? 'Operational Notes / Bio' : 'অপারেশনাল নোট / পরিচিতি'}
                </label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all bg-white resize-none"
                  placeholder={
                    language === 'en'
                      ? 'Internal notes regarding your administrative portfolio...'
                      : 'আপনার প্রশাসনিক দায়িত্ব সম্পর্কিত নোট...'
                  }
                />
              </div>

              {/* Save Button */}
              <div className="flex justify-end pt-3">
                <Button
                  type="submit"
                  disabled={isPending}
                  className="bg-primary-600 hover:bg-primary-700 text-white font-semibold px-5 py-2 rounded-lg text-xs flex items-center gap-2 shadow-xs"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>{language === 'en' ? 'Saving...' : 'সংরক্ষণ করা হচ্ছে...'}</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      <span>{language === 'en' ? 'Save Profile Changes' : 'পরিবর্তন সংরক্ষণ করুন'}</span>
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      )}

      {/* ── Tab 2: Security & Password ── */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          {/* Password Update Card */}
          <Card className="border border-slate-200/80 shadow-xs">
            <CardHeader className="p-5 sm:p-6 border-b border-slate-100">
              <CardTitle className="text-base font-bold text-slate-900">
                {language === 'en' ? 'Change Administrator Password' : 'অ্যাডমিন পাসওয়ার্ড পরিবর্তন করুন'}
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                {language === 'en'
                  ? 'Update your master administrative password. Passwords are salted with cryptographic scrypt.'
                  : 'আপনার মূল অ্যাডমিন পাসওয়ার্ড পরিবর্তন করুন। পাসওয়ার্ড ক্রিপ্টোগ্রাফিকভাবে সুরক্ষিত রাখা হয়।'}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 sm:p-6">
              <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-lg">
                {/* Current Password */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    {language === 'en' ? 'Current Password' : 'বর্তমান পাসওয়ার্ড'}
                  </label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type={showCurrentPass ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      required
                      placeholder="••••••••••••"
                      className="w-full pl-9 pr-10 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPass(!showCurrentPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showCurrentPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    {language === 'en' ? 'New Password' : 'নতুন পাসওয়ার্ড'}
                  </label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type={showNewPass ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      minLength={6}
                      placeholder="••••••••••••"
                      className="w-full pl-9 pr-10 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPass(!showNewPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showNewPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    {language === 'en' ? 'Minimum 6 characters long.' : 'কমপক্ষে ৬ অক্ষরের হতে হবে।'}
                  </p>
                </div>

                {/* Confirm New Password */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    {language === 'en' ? 'Confirm New Password' : 'নতুন পাসওয়ার্ড পুনরায় নিশ্চিত করুন'}
                  </label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type={showConfirmPass ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      placeholder="••••••••••••"
                      className="w-full pl-9 pr-10 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPass(!showConfirmPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showConfirmPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="pt-2">
                  <Button
                    type="submit"
                    disabled={isPending}
                    className="bg-primary-600 hover:bg-primary-700 text-white font-semibold px-5 py-2 rounded-lg text-xs flex items-center gap-2 shadow-xs"
                  >
                    {isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>{language === 'en' ? 'Updating...' : 'পরিবর্তন হচ্ছে...'}</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="h-4 w-4" />
                        <span>{language === 'en' ? 'Update Master Password' : 'পাসওয়ার্ড পরিবর্তন করুন'}</span>
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Two-Factor Status Card */}
          <Card className="border border-slate-200/80 shadow-xs">
            <CardHeader className="p-5 sm:p-6 border-b border-slate-100">
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                <span>{language === 'en' ? 'Two-Factor Authentication (2FA)' : 'টু-ফ্যাক্টর অথেনটিকেশন (২এফএ)'}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 sm:p-6 space-y-3">
              <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl">
                <div>
                  <p className="text-xs font-bold text-slate-800">
                    {language === 'en' ? 'SMS OTP Verification' : 'এসএমএস ওটিপি ভেরিফিকেশন'}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {language === 'en'
                      ? `Active for phone: ${phone || initialProfile.phone || 'Configured'}`
                      : `সক্রিয় নম্বর: ${phone || initialProfile.phone || 'কনফিগার করা হয়েছে'}`}
                  </p>
                </div>
                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold text-xs">
                  {language === 'en' ? 'Enforced & Protected' : 'সুরক্ষিত ও সক্রিয়'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Tab 3: System Shortcuts ── */}
      {activeTab === 'system' && (
        <div className="space-y-6">
          <Card className="border border-slate-200/80 shadow-xs">
            <CardHeader className="p-5 sm:p-6 border-b border-slate-100">
              <CardTitle className="text-base font-bold text-slate-900">
                {language === 'en' ? 'Platform Control & Management Shortcuts' : 'প্ল্যাটফর্ম নিয়ন্ত্রণ ও দ্রুত অ্যাক্সেস'}
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                {language === 'en'
                  ? 'Direct shortcuts to financial ledgers, moderation, and approvals.'
                  : 'ফিনান্সিয়াল লেজার, মডারেশন এবং অনুমোদন টাস্কে সরাসরি যাওয়ার শর্টকাট।'}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 sm:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <Link
                  href="/admin/payouts"
                  className="flex items-start gap-3 p-4 rounded-xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/30 transition-all group"
                >
                  <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-700 group-hover:scale-105 transition-transform">
                    <DollarSign className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xs font-bold text-slate-900 group-hover:text-emerald-700 transition-colors flex items-center justify-between">
                      <span>{language === 'en' ? 'Payout Workflows' : 'পেআউট ওয়ার্কফ্লো'}</span>
                      <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {language === 'en' ? 'Review & disburse instructor balances' : 'ইন্সট্রাক্টর পেআউট নিরীক্ষা ও প্রদান'}
                    </p>
                  </div>
                </Link>

                <Link
                  href="/admin/refunds"
                  className="flex items-start gap-3 p-4 rounded-xl border border-slate-200 hover:border-amber-300 hover:bg-amber-50/30 transition-all group"
                >
                  <div className="p-2.5 rounded-lg bg-amber-50 text-amber-700 group-hover:scale-105 transition-transform">
                    <RotateCcw className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xs font-bold text-slate-900 group-hover:text-amber-700 transition-colors flex items-center justify-between">
                      <span>{language === 'en' ? 'Refund Panel' : 'রিফান্ড প্যানেল'}</span>
                      <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {language === 'en' ? 'Process student course refund claims' : 'কোর্স রিফান্ড আবেদন প্রসেসিং'}
                    </p>
                  </div>
                </Link>

                <Link
                  href="/admin/moderation"
                  className="flex items-start gap-3 p-4 rounded-xl border border-slate-200 hover:border-rose-300 hover:bg-rose-50/30 transition-all group"
                >
                  <div className="p-2.5 rounded-lg bg-rose-50 text-rose-700 group-hover:scale-105 transition-transform">
                    <ShieldAlert className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xs font-bold text-slate-900 group-hover:text-rose-700 transition-colors flex items-center justify-between">
                      <span>{language === 'en' ? 'Moderation Queue' : 'মডারেশন কিউ'}</span>
                      <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {language === 'en' ? 'Manage flagged content & comments' : 'রিপোর্টেড কনটেন্ট পর্যালোচনা'}
                    </p>
                  </div>
                </Link>

                <Link
                  href="/admin/instructors/pending"
                  className="flex items-start gap-3 p-4 rounded-xl border border-slate-200 hover:border-violet-300 hover:bg-violet-50/30 transition-all group"
                >
                  <div className="p-2.5 rounded-lg bg-violet-50 text-violet-700 group-hover:scale-105 transition-transform">
                    <GraduationCap className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xs font-bold text-slate-900 group-hover:text-violet-700 transition-colors flex items-center justify-between">
                      <span>{language === 'en' ? 'Instructor Queue' : 'ইন্সট্রাক্টর কিউ'}</span>
                      <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {language === 'en' ? 'Approve instructor applications' : 'ইন্সট্রাক্টর আবেদন পর্যালোচনা'}
                    </p>
                  </div>
                </Link>

                {isSuperadmin && (
                  <Link
                    href="/admin/audit"
                    className="flex items-start gap-3 p-4 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/30 transition-all group"
                  >
                    <div className="p-2.5 rounded-lg bg-indigo-50 text-indigo-700 group-hover:scale-105 transition-transform">
                      <ShieldCheck className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xs font-bold text-slate-900 group-hover:text-indigo-700 transition-colors flex items-center justify-between">
                        <span>{language === 'en' ? 'Security Audit Trail' : 'অডিট ট্রেইল'}</span>
                        <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </h3>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {language === 'en' ? 'Cryptographic ledger of admin actions' : 'প্রশাসনিক কাজের অপরিবর্তনীয় রেকর্ড'}
                      </p>
                    </div>
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

