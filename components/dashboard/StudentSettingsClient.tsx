'use client';

import React, { useState, useTransition } from 'react';
import {
  User,
  Shield,
  Target,
  Bell,
  CheckCircle2,
  AlertCircle,
  Loader2,
  KeyRound,
  Phone,
  Mail,
  Briefcase,
  Flame,
  Award,
  Sparkles,
  Save,
  Clock,
  Layers,
  BookOpen
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useLanguage } from '@/context/LanguageContext';
import { LanguageToggle } from '@/components/ui/LanguageToggle';
import {
  updateStudentProfileAction,
  updateStudentPasswordAction
} from '@/actions/student-actions';

interface StudentProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  headline?: string;
  bio?: string;
  targetTrack?: string;
  academicBackground?: string;
  weeklyGoalHours?: number;
  elo?: number;
  competitiveElo?: number;
  problemsSolved?: number;
  completedCoursesCount?: number;
  streak?: number;
  image?: string;
  role?: string;
  status?: string;
}

interface StudentSettingsClientProps {
  initialProfile: StudentProfile;
}

type TabType = 'profile' | 'goals' | 'security' | 'preferences';

export function StudentSettingsClient({ initialProfile }: StudentSettingsClientProps) {
  const { language, t } = useLanguage();
  const [activeTab, setActiveTab] = useState<TabType>('profile');
  const [isPending, startTransition] = useTransition();

  // Profile Form States
  const [name, setName] = useState(initialProfile.name || '');
  const [phone, setPhone] = useState(initialProfile.phone || '');
  const [headline, setHeadline] = useState(initialProfile.headline || 'Aspiring Fullstack Developer');
  const [bio, setBio] = useState(initialProfile.bio || '');
  const [academicBackground, setAcademicBackground] = useState(
    initialProfile.academicBackground || 'Computer Science & Engineering (CSE)'
  );

  // Learning Goal States
  const [targetTrack, setTargetTrack] = useState(initialProfile.targetTrack || 'Fullstack Web Development');
  const [weeklyGoalHours, setWeeklyGoalHours] = useState(initialProfile.weeklyGoalHours || 10);

  // Password States
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Notification states
  const [emailNotif, setEmailNotif] = useState(true);
  const [routineReminder, setRoutineReminder] = useState(true);

  // Feedback states
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const handleSaveProfile = () => {
    setProfileSuccess(null);
    setProfileError(null);

    startTransition(async () => {
      const res = await updateStudentProfileAction({
        name,
        phone,
        headline,
        bio,
        targetTrack,
        academicBackground,
        weeklyGoalHours,
      });

      if (res.error) {
        setProfileError(res.error);
      } else {
        setProfileSuccess(
          language === 'en'
            ? 'Profile details updated successfully!'
            : 'প্রোফাইল তথ্য সফলভাবে সংরক্ষিত হয়েছে!'
        );
        setTimeout(() => setProfileSuccess(null), 4000);
      }
    });
  };

  const handleUpdatePassword = () => {
    setPasswordSuccess(null);
    setPasswordError(null);

    if (newPassword !== confirmPassword) {
      setPasswordError(
        language === 'en'
          ? 'New password and confirmation password do not match.'
          : 'নতুন পাসওয়ার্ড এবং কনফার্ম পাসওয়ার্ড মিলছে না।'
      );
      return;
    }

    startTransition(async () => {
      const res = await updateStudentPasswordAction({
        currentPassword,
        newPassword,
      });

      if (res.error) {
        setPasswordError(res.error);
      } else {
        setPasswordSuccess(
          language === 'en'
            ? 'Password updated successfully!'
            : 'পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে!'
        );
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => setPasswordSuccess(null), 4000);
      }
    });
  };

  const tracks = [
    { id: 'Fullstack Web Development', label: language === 'en' ? 'Fullstack Web Development (Next.js & React)' : 'ফুলস্ট্যাক ওয়েব ডেভেলপমেন্ট (Next.js & React)' },
    { id: 'Data Science & Applied AI', label: language === 'en' ? 'Data Science & Applied AI (Python & ML)' : 'ডাটা সায়েন্স ও এআই বুটক্যাম্প (Python & ML)' },
    { id: 'Data Structures & Algorithms', label: language === 'en' ? 'Data Structures & Algorithms Mastery' : 'ডাটা স্ট্রাকচার ও অ্যালগরিদম মাস্টারক্লাস' },
    { id: 'System Design & Cloud Architecture', label: language === 'en' ? 'High-Scale System Design' : 'হাই-স্কেল সিস্টেম ডিজাইন ও ক্লাউড' },
    { id: 'Mobile App Development', label: language === 'en' ? 'Mobile App Development (Flutter & Dart)' : 'মোবাইল অ্যাপ ডেভেলপমেন্ট (Flutter & Dart)' },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <User className="h-6 w-6 text-primary-600" />
            {language === 'en' ? 'Account & Learning Settings' : 'অ্যাকাউন্ট ও লার্নিং সেটিংস'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {language === 'en'
              ? 'Manage your personal profile, academic goals, password, and system preferences.'
              : 'আপনার ব্যক্তিগত তথ্য, পড়াশোনার লক্ষ্য, সিকিউরিটি এবং প্রেফারেন্স পরিবর্তন করুন।'}
          </p>
        </div>

        {/* User Status Pills */}
        <div className="flex items-center gap-2">
          <Badge className="bg-primary-50 text-primary-700 border border-primary-200 text-xs px-3 py-1 font-bold">
            <Flame className="h-3.5 w-3.5 text-amber-500 mr-1 inline" />
            {initialProfile.streak || 1} {language === 'en' ? 'Days Streak' : 'দিনের স্ট্রিক'}
          </Badge>
          <Badge className="bg-amber-50 text-amber-700 border border-amber-200 text-xs px-3 py-1 font-bold">
            <Award className="h-3.5 w-3.5 text-amber-600 mr-1 inline" />
            {initialProfile.elo || 1200} Elo
          </Badge>
        </div>
      </div>

      {/* ── Main Tabbed Layout ── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Navigation Sidebar */}
        <div className="md:col-span-1 space-y-1.5">
          {[
            { id: 'profile', icon: User, label: language === 'en' ? 'Profile Details' : 'প্রোফাইল তথ্য' },
            { id: 'goals', icon: Target, label: language === 'en' ? 'Learning Goals' : 'লার্নিং লক্ষ্য' },
            { id: 'security', icon: Shield, label: language === 'en' ? 'Security & Password' : 'পাসওয়ার্ড ও সিকিউরিটি' },
            { id: 'preferences', icon: Bell, label: language === 'en' ? 'Preferences' : 'প্রেফারেন্স ও সেটিংস' },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition text-left ${
                  isActive
                    ? 'bg-primary-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content Pane */}
        <div className="md:col-span-3">
          {/* TAB 1: Profile Details */}
          {activeTab === 'profile' && (
            <Card className="border border-slate-200 shadow-sm rounded-2xl overflow-hidden">
              <CardHeader className="bg-slate-50/60 border-b border-slate-100 p-6">
                <CardTitle className="text-base font-bold text-slate-800">
                  {language === 'en' ? 'Personal Profile Information' : 'ব্যক্তিগত প্রোফাইল তথ্য'}
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  {language === 'en'
                    ? 'Update how you appear on course forums, discussions, and student leaderboards.'
                    : 'কমিউনিটি ফোরাম ও লিডারবোর্ডে আপনার নাম ও প্রোফাইল প্রদর্শন নিয়ন্ত্রন করুন।'}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-5">
                {profileSuccess && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>{profileSuccess}</span>
                  </div>
                )}
                {profileError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                    <span>{profileError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">
                      {language === 'en' ? 'Full Name *' : 'পুরো নাম *'}
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="আপনার নাম"
                      className="w-full text-xs rounded-xl border border-slate-200 px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-600"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">
                      {language === 'en' ? 'Mobile Phone' : 'মোবাইল নম্বর'}
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                      <input
                        type="text"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="017XXXXXXXX"
                        className="w-full text-xs pl-9 rounded-xl border border-slate-200 px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-600"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    {language === 'en' ? 'Email Address' : 'ইমেইল অ্যাড্রেস'}
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                    <input
                      type="email"
                      value={initialProfile.email}
                      disabled
                      className="w-full text-xs pl-9 rounded-xl border border-slate-200 px-3.5 py-2.5 bg-slate-100 text-slate-500 cursor-not-allowed"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400">
                    {language === 'en' ? 'Email cannot be changed directly.' : 'অ্যাকাউন্টের সিকিউরিটির স্বার্থে ইমেইল অপরিবর্তনীয়।'}
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    {language === 'en' ? 'Professional Headline' : 'পেশাগত শিরোনাম / হেডলাইন'}
                  </label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                    <input
                      type="text"
                      value={headline}
                      onChange={(e) => setHeadline(e.target.value)}
                      placeholder="যেমন: Junior Web Developer | CS Undergrad"
                      className="w-full text-xs pl-9 rounded-xl border border-slate-200 px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-600"
                    />
                  </div>
                </div>

                {/* Academic Background / Major for Contest & Notification Prioritization */}
                <div className="space-y-1.5 p-3.5 rounded-xl bg-indigo-50/60 border border-indigo-100">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
                      <span>{language === 'en' ? 'Academic Background & Study Field' : 'একাডেমিক ব্যাকগ্রাউন্ড ও পড়াশোনার বিভাগ'}</span>
                    </label>
                    <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-full">
                      {language === 'en' ? 'Drives Contest Priority' : 'কনটেস্ট অগ্রাধিকার নির্ধারণ করে'}
                    </span>
                  </div>
                  <select
                    value={academicBackground}
                    onChange={(e) => setAcademicBackground(e.target.value)}
                    className="w-full text-xs rounded-xl border border-indigo-200 bg-white px-3.5 py-2.5 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 cursor-pointer"
                  >
                    <option value="Computer Science & Engineering (CSE)">Computer Science & Engineering (CSE / CS)</option>
                    <option value="Software Engineering (SWE)">Software Engineering (SWE / IT)</option>
                    <option value="Electrical & Electronic Engineering (EEE)">Electrical & Electronic Engineering (EEE)</option>
                    <option value="Data Science & Applied AI">Data Science & Applied AI</option>
                    <option value="Business Administration (BBA)">Business Administration (BBA / Finance / Accounting)</option>
                    <option value="General / Other Disciplines">General / Other Non-CS Disciplines</option>
                  </select>
                  <p className="text-[11px] text-indigo-700/80 leading-relaxed mt-1">
                    {language === 'en'
                      ? 'The platform uses this to prioritize algorithmic & domain contests on your homepage and send top-priority notification alerts for your track.'
                      : 'এই তথ্যের ওপর ভিত্তি করে প্ল্যাটফর্ম আপনার হোমপেজে প্রাসঙ্গিক কনটেস্টকে শীর্ষে রাখবে এবং আপনার ব্যাকগ্রাউন্ডের জন্য হাই-প্রায়োরিটি নোটিফিকেশন পাঠাবে।'}
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    {language === 'en' ? 'Bio & Learning Objective' : 'বায়ো ও শেখার উদ্দেশ্য'}
                  </label>
                  <textarea
                    rows={3}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder={language === 'en' ? 'Briefly describe your background and learning goals...' : 'আপনার পড়াশোনা ও ক্যারিয়ার লক্ষ্য সম্পর্কে সংক্ষেপে লিখুন...'}
                    className="w-full text-xs rounded-xl border border-slate-200 p-3 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-600"
                  />
                </div>

                <div className="pt-2 flex justify-end">
                  <Button
                    onClick={handleSaveProfile}
                    disabled={isPending}
                    className="bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold rounded-xl px-5 py-2.5 flex items-center gap-2"
                  >
                    {isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    <span>{language === 'en' ? 'Save Changes' : 'পরিবর্তন সংরক্ষণ করুন'}</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* TAB 2: Learning Goals */}
          {activeTab === 'goals' && (
            <Card className="border border-slate-200 shadow-sm rounded-2xl overflow-hidden">
              <CardHeader className="bg-slate-50/60 border-b border-slate-100 p-6">
                <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <Target className="h-5 w-5 text-indigo-600" />
                  {language === 'en' ? 'Career Track & Study Routine Goals' : 'ক্যারিয়ার ট্র্যাক ও স্টাডি রুটিন লক্ষ্য'}
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  {language === 'en'
                    ? 'Our routine scheduler auto-balances your course timeline based on your target pace.'
                    : 'আপনার নির্ধারিত লক্ষ্য অনুযায়ী আমাদের রুটিন ইঞ্জিন সাপ্তাহিক শিডিউল স্বয়ংক্রিয়ভাবে ব্যালেন্স করে।'}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 block">
                    {language === 'en' ? 'Primary Focus Track' : 'মূল ফোকাস ক্যারিয়ার ট্র্যাক'}
                  </label>
                  <div className="grid grid-cols-1 gap-2.5">
                    {tracks.map((t) => (
                      <label
                        key={t.id}
                        className={`flex items-center justify-between p-3.5 rounded-xl border text-xs font-semibold cursor-pointer transition ${
                          targetTrack === t.id
                            ? 'border-indigo-600 bg-indigo-50/50 text-indigo-900 shadow-xs'
                            : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="careerTrack"
                            checked={targetTrack === t.id}
                            onChange={() => setTargetTrack(t.id)}
                            className="text-indigo-600 focus:ring-indigo-500"
                          />
                          <span>{t.label}</span>
                        </div>
                        {targetTrack === t.id && (
                          <Badge className="bg-indigo-600 text-white text-[10px]">Active Track</Badge>
                        )}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Clock className="h-4 w-4 text-slate-500" />
                      {language === 'en' ? 'Weekly Target Study Hours' : 'সাপ্তাহিক টার্গেট পড়ার সময়'}
                    </label>
                    <span className="text-sm font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg border border-indigo-100">
                      {weeklyGoalHours} {language === 'en' ? 'Hours / Week' : 'ঘণ্টা / সপ্তাহ'}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="4"
                    max="35"
                    step="1"
                    value={weeklyGoalHours}
                    onChange={(e) => setWeeklyGoalHours(Number(e.target.value))}
                    className="w-full accent-indigo-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                    <span>৪ ঘণ্টা (Casual)</span>
                    <span>১৫ ঘণ্টা (Standard)</span>
                    <span>৩৫ ঘণ্টা (Intensive Bootcamp)</span>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <Button
                    onClick={handleSaveProfile}
                    disabled={isPending}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl px-5 py-2.5 flex items-center gap-2"
                  >
                    {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    <span>{language === 'en' ? 'Update Learning Goals' : 'লক্ষ্য আপডেট করুন'}</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* TAB 3: Security & Password */}
          {activeTab === 'security' && (
            <Card className="border border-slate-200 shadow-sm rounded-2xl overflow-hidden">
              <CardHeader className="bg-slate-50/60 border-b border-slate-100 p-6">
                <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <Shield className="h-5 w-5 text-emerald-600" />
                  {language === 'en' ? 'Security & Credentials' : 'পাসওয়ার্ড ও সিকিউরিটি'}
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  {language === 'en'
                    ? 'Keep your account safe by updating your password periodically.'
                    : 'আপনার অ্যাকাউন্টের সুরক্ষায় পাসওয়ার্ড নিয়মিত পরিবর্তন করুন।'}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-5">
                {passwordSuccess && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>{passwordSuccess}</span>
                  </div>
                )}
                {passwordError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                    <span>{passwordError}</span>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    {language === 'en' ? 'Current Password (if set)' : 'বর্তমান পাসওয়ার্ড'}
                  </label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="বর্তমান পাসওয়ার্ড"
                    className="w-full text-xs rounded-xl border border-slate-200 px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">
                      {language === 'en' ? 'New Password *' : 'নতুন পাসওয়ার্ড *'}
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="কমপক্ষে ৬টি অক্ষর"
                      className="w-full text-xs rounded-xl border border-slate-200 px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">
                      {language === 'en' ? 'Confirm New Password *' : 'নতুন পাসওয়ার্ড নিশ্চিত করুন *'}
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="পুনরায় টাইপ করুন"
                      className="w-full text-xs rounded-xl border border-slate-200 px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <Button
                    onClick={handleUpdatePassword}
                    disabled={isPending || !newPassword}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl px-5 py-2.5 flex items-center gap-2"
                  >
                    {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
                    <span>{language === 'en' ? 'Change Password' : 'পাসওয়ার্ড পরিবর্তন করুন'}</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* TAB 4: Preferences */}
          {activeTab === 'preferences' && (
            <Card className="border border-slate-200 shadow-sm rounded-2xl overflow-hidden">
              <CardHeader className="bg-slate-50/60 border-b border-slate-100 p-6">
                <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <Bell className="h-5 w-5 text-amber-500" />
                  {language === 'en' ? 'Language & Notification Preferences' : 'ভাষা ও নোটিফিকেশন প্রেফারেন্স'}
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  {language === 'en'
                    ? 'Customize how you interact with platform announcements and reminders.'
                    : 'প্ল্যাটফর্ম ভাষা ও রুটিন অনুস্মারক নোটিফিকেশন কনফিগার করুন।'}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <div>
                    <p className="text-xs font-bold text-slate-800">
                      {language === 'en' ? 'Interface Language' : 'ইন্টারফেস ভাষা'}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {language === 'en' ? 'Toggle between Bangla and English' : 'বাংলা ও ইংরেজির মধ্যে পরিবর্তন করুন'}
                    </p>
                  </div>
                  <LanguageToggle />
                </div>

                <div className="space-y-4">
                  <label className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={routineReminder}
                      onChange={(e) => setRoutineReminder(e.target.checked)}
                      className="mt-0.5 rounded text-primary-600 focus:ring-primary-500"
                    />
                    <div>
                      <p className="text-xs font-bold text-slate-800">
                        {language === 'en' ? 'Daily Routine & Class Deadlines' : 'দৈনিক রুটিন ও ক্লাসের সময়সূচী'}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {language === 'en' ? 'Receive reminders when new scheduled routine lectures are due.' : 'দৈনিক নির্ধারিত লেকচার বাকি থাকলে ড্যাশবোর্ড অ্যালার্ট প্রদর্শন করুন।'}
                      </p>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={emailNotif}
                      onChange={(e) => setEmailNotif(e.target.checked)}
                      className="mt-0.5 rounded text-primary-600 focus:ring-primary-500"
                    />
                    <div>
                      <p className="text-xs font-bold text-slate-800">
                        {language === 'en' ? 'Exam & Certification Alerts' : 'পরীক্ষা ও মূল্যায়ন ফলাফল নোটিফিকেশন'}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {language === 'en' ? 'Get notified immediately upon completing quizzes and earning certifications.' : 'কুইজ সম্পন্ন হলে স্কোর ও সার্টিফিকেট সংক্রান্ত আপডেট পান।'}
                      </p>
                    </div>
                  </label>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
