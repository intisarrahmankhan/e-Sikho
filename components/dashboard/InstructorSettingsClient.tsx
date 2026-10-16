'use client';

import React, { useState, useTransition } from 'react';
import {
  User,
  Shield,
  Briefcase,
  Award,
  BookOpen,
  Users,
  Star,
  DollarSign,
  Wallet,
  Globe,
  Github,
  Linkedin,
  Twitter,
  Phone,
  Mail,
  Building,
  GraduationCap,
  Sparkles,
  Save,
  Clock,
  Layers,
  CheckCircle2,
  AlertCircle,
  Loader2,
  KeyRound,
  Bell,
  X,
  CreditCard,
  Flame,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useLanguage } from '@/context/LanguageContext';
import { LanguageToggle } from '@/components/ui/LanguageToggle';
import {
  updateInstructorProfileAction,
  updateInstructorPasswordAction,
} from '@/actions/instructor';

export interface InstructorProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  headline?: string;
  instructorTitle?: string;
  bio?: string;
  organization?: string;
  experienceYears?: number;
  academicBackground?: string;
  targetTrack?: string;
  expertise?: string[];
  skills?: string[];
  weeklyGoalHours?: number;
  website?: string;
  github?: string;
  linkedin?: string;
  twitter?: string;
  payoutMethod?: 'BKASH' | 'NAGAD' | 'ROCKET' | 'BANK';
  payoutNumber?: string;
  bankName?: string;
  bankBranch?: string;
  bankAccountName?: string;
  availableBalance?: number;
  totalEarnings?: number;
  role?: string;
  status?: string;
  image?: string;
  totalCourses?: number;
  publishedCourses?: number;
  totalStudents?: number;
  averageRating?: number;
}

const DEFAULT_EXPERTISE_DOMAINS = [
  'Fullstack Web Development',
  'Frontend Engineering',
  'Backend Architecture & Microservices',
  'System Design & Distributed Systems',
  'Data Structures & Algorithms',
  'Competitive Programming',
  'Machine Learning & Deep Learning',
  'Cloud Computing & DevOps',
  'Database Engineering & SQL',
  'Cyber Security & Ethical Hacking',
  'Mobile App Development (React Native / Flutter)',
];

const DEFAULT_INSTRUCTOR_SKILLS = [
  'JavaScript',
  'TypeScript',
  'React',
  'Next.js',
  'Node.js',
  'Express.js',
  'Python',
  'Django / FastAPI',
  'C / C++',
  'Java / Spring Boot',
  'Go (Golang)',
  'PostgreSQL',
  'MongoDB',
  'Docker & Kubernetes',
  'AWS & Cloudflare',
  'Tailwind CSS',
  'GraphQL',
];

interface InstructorSettingsClientProps {
  initialProfile: InstructorProfile;
}

type TabType = 'profile' | 'teaching' | 'payout' | 'security' | 'preferences';

export function InstructorSettingsClient({ initialProfile }: InstructorSettingsClientProps) {
  const { language, t } = useLanguage();
  const [activeTab, setActiveTab] = useState<TabType>('profile');
  const [isPending, startTransition] = useTransition();

  // Basic & Professional Profile States
  const [name, setName] = useState(initialProfile.name || '');
  const [phone, setPhone] = useState(initialProfile.phone || '');
  const [headline, setHeadline] = useState(initialProfile.headline || initialProfile.instructorTitle || 'Senior Software Engineer & Lead Instructor');
  const [bio, setBio] = useState(initialProfile.bio || '');
  const [organization, setOrganization] = useState(initialProfile.organization || 'Tech Academy / Independent');
  const [experienceYears, setExperienceYears] = useState<number>(initialProfile.experienceYears || 3);
  const [academicBackground, setAcademicBackground] = useState(
    initialProfile.academicBackground || 'Computer Science & Engineering (CSE)'
  );

  // Social & Online Presence
  const [website, setWebsite] = useState(initialProfile.website || '');
  const [github, setGithub] = useState(initialProfile.github || '');
  const [linkedin, setLinkedin] = useState(initialProfile.linkedin || '');
  const [twitter, setTwitter] = useState(initialProfile.twitter || '');

  // Teaching & Expertise States
  const [targetTrack, setTargetTrack] = useState(initialProfile.targetTrack || 'Fullstack Web Development');
  const [weeklyGoalHours, setWeeklyGoalHours] = useState(initialProfile.weeklyGoalHours || 12);
  const [expertise, setExpertise] = useState<string[]>(
    initialProfile.expertise && initialProfile.expertise.length > 0
      ? initialProfile.expertise
      : ['Fullstack Web Development', 'System Design & Distributed Systems', 'Data Structures & Algorithms']
  );
  const [skills, setSkills] = useState<string[]>(
    initialProfile.skills && initialProfile.skills.length > 0
      ? initialProfile.skills
      : ['JavaScript', 'TypeScript', 'React', 'Next.js', 'Node.js']
  );

  const [availableExpertise, setAvailableExpertise] = useState<string[]>(() => {
    return Array.from(new Set([...DEFAULT_EXPERTISE_DOMAINS, ...(initialProfile.expertise || [])]));
  });
  const [availableSkills, setAvailableSkills] = useState<string[]>(() => {
    return Array.from(new Set([...DEFAULT_INSTRUCTOR_SKILLS, ...(initialProfile.skills || [])]));
  });

  const [customExpertise, setCustomExpertise] = useState('');
  const [customSkill, setCustomSkill] = useState('');

  // Financial & Payout States
  const [payoutMethod, setPayoutMethod] = useState<'BKASH' | 'NAGAD' | 'ROCKET' | 'BANK'>(
    initialProfile.payoutMethod || 'BKASH'
  );
  const [payoutNumber, setPayoutNumber] = useState(initialProfile.payoutNumber || initialProfile.phone || '');
  const [bankName, setBankName] = useState(initialProfile.bankName || '');
  const [bankBranch, setBankBranch] = useState(initialProfile.bankBranch || '');
  const [bankAccountName, setBankAccountName] = useState(initialProfile.bankAccountName || initialProfile.name || '');

  // Password States
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Notification states
  const [courseReviewNotif, setCourseReviewNotif] = useState(true);
  const [studentQuestionNotif, setStudentQuestionNotif] = useState(true);
  const [enrollmentNotif, setEnrollmentNotif] = useState(true);

  // Feedback states
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  const [teachingSuccess, setTeachingSuccess] = useState<string | null>(null);
  const [teachingError, setTeachingError] = useState<string | null>(null);

  const [payoutSuccess, setPayoutSuccess] = useState<string | null>(null);
  const [payoutError, setPayoutError] = useState<string | null>(null);

  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Handlers for tags
  const handleAddExpertise = () => {
    const trimmed = customExpertise.trim();
    if (!trimmed) return;
    const existing = availableExpertise.find((i) => i.toLowerCase() === trimmed.toLowerCase());
    const itemToAdd = existing || trimmed;

    setAvailableExpertise((prev) => (prev.includes(itemToAdd) ? prev : [...prev, itemToAdd]));
    setExpertise((prev) => (prev.includes(itemToAdd) ? prev : [...prev, itemToAdd]));
    setCustomExpertise('');
  };

  const handleRemoveCustomExpertise = (e: React.MouseEvent, item: string) => {
    e.stopPropagation();
    setExpertise((prev) => prev.filter((i) => i !== item));
    setAvailableExpertise((prev) => prev.filter((i) => i !== item));
  };

  const handleAddSkill = () => {
    const trimmed = customSkill.trim();
    if (!trimmed) return;
    const existing = availableSkills.find((s) => s.toLowerCase() === trimmed.toLowerCase());
    const itemToAdd = existing || trimmed;

    setAvailableSkills((prev) => (prev.includes(itemToAdd) ? prev : [...prev, itemToAdd]));
    setSkills((prev) => (prev.includes(itemToAdd) ? prev : [...prev, itemToAdd]));
    setCustomSkill('');
  };

  const handleRemoveCustomSkill = (e: React.MouseEvent, item: string) => {
    e.stopPropagation();
    setSkills((prev) => prev.filter((s) => s !== item));
    setAvailableSkills((prev) => prev.filter((s) => s !== item));
  };

  // Save Handlers
  const handleSaveProfile = () => {
    setProfileSuccess(null);
    setProfileError(null);

    startTransition(async () => {
      const res = await updateInstructorProfileAction({
        name,
        phone,
        headline,
        instructorTitle: headline,
        bio,
        organization,
        experienceYears,
        academicBackground,
        website,
        github,
        linkedin,
        twitter,
      });

      if (res.error) {
        setProfileError(res.error);
      } else {
        setProfileSuccess(
          language === 'en'
            ? 'Instructor profile updated successfully!'
            : 'ইন্সট্রাক্টর প্রোফাইল তথ্য সফলভাবে সংরক্ষিত হয়েছে!'
        );
        setTimeout(() => setProfileSuccess(null), 4000);
      }
    });
  };

  const handleSaveTeaching = () => {
    setTeachingSuccess(null);
    setTeachingError(null);

    startTransition(async () => {
      const res = await updateInstructorProfileAction({
        targetTrack,
        weeklyGoalHours,
        expertise,
        skills,
      });

      if (res.error) {
        setTeachingError(res.error);
      } else {
        setTeachingSuccess(
          language === 'en'
            ? 'Teaching domains and technical skills updated successfully!'
            : 'শিক্ষণ ক্ষেত্র এবং টেকনিক্যাল স্কিল সফলভাবে সংরক্ষিত হয়েছে!'
        );
        setTimeout(() => setTeachingSuccess(null), 4000);
      }
    });
  };

  const handleSavePayout = () => {
    setPayoutSuccess(null);
    setPayoutError(null);

    startTransition(async () => {
      const res = await updateInstructorProfileAction({
        payoutMethod,
        payoutNumber,
        bankName,
        bankBranch,
        bankAccountName,
      });

      if (res.error) {
        setPayoutError(res.error);
      } else {
        setPayoutSuccess(
          language === 'en'
            ? 'Payout and financial settings updated successfully!'
            : 'উইথড্রয়াল ও পেমেন্ট সেটিংস সফলভাবে সংরক্ষিত হয়েছে!'
        );
        setTimeout(() => setPayoutSuccess(null), 4000);
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

    if (newPassword.length < 6) {
      setPasswordError(
        language === 'en'
          ? 'Password must be at least 6 characters long.'
          : 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।'
      );
      return;
    }

    startTransition(async () => {
      const res = await updateInstructorPasswordAction({
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

  return (
    <div className="space-y-6 pb-12 max-w-5xl mx-auto">
      {/* ── Instructor Header Profile Card ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 sm:p-8 text-white shadow-xl border border-indigo-900/50">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 h-48 w-48 rounded-full bg-indigo-500/10 blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-10 h-40 w-40 rounded-full bg-emerald-500/10 blur-2xl pointer-events-none" />

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div className="relative">
              <div className="h-20 w-20 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 p-0.5 shadow-lg flex items-center justify-center">
                <div className="h-full w-full rounded-[14px] bg-slate-900 flex items-center justify-center text-2xl font-black text-indigo-400">
                  {name ? name.charAt(0).toUpperCase() : 'I'}
                </div>
              </div>
              <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white shadow ring-2 ring-slate-900">
                <CheckCircle2 className="h-3.5 w-3.5" />
              </span>
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                  {name || 'Instructor'}
                </h1>
                <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5">
                  <Shield className="h-3 w-3 mr-1" />
                  {language === 'en' ? 'Verified Instructor' : 'ভেরিফাইড ইন্সট্রাক্টর'}
                </Badge>
              </div>

              <p className="text-xs sm:text-sm text-indigo-200/90 font-medium max-w-xl">
                {headline || 'Lead Technology Instructor'}
              </p>

              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 pt-1">
                <span className="flex items-center gap-1">
                  <Building className="h-3.5 w-3.5 text-indigo-400" />
                  {organization || 'Tech Academy'}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Award className="h-3.5 w-3.5 text-amber-400" />
                  {experienceYears} {language === 'en' ? 'Years Experience' : 'বছরের শিক্ষকতা অভিজ্ঞতা'}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 bg-white/5 border border-white/10 p-3 sm:p-4 rounded-xl backdrop-blur-xs">
            <div className="text-center px-2 py-1">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block flex items-center justify-center gap-1">
                <BookOpen className="h-3 w-3 text-indigo-400" />
                {language === 'en' ? 'Courses' : 'কোর্স'}
              </span>
              <span className="text-base sm:text-lg font-black text-white">
                {initialProfile.publishedCourses || initialProfile.totalCourses || 0}
              </span>
            </div>

            <div className="text-center px-2 py-1 border-l border-white/10">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block flex items-center justify-center gap-1">
                <Users className="h-3 w-3 text-emerald-400" />
                {language === 'en' ? 'Students' : 'শিক্ষার্থী'}
              </span>
              <span className="text-base sm:text-lg font-black text-emerald-400">
                {initialProfile.totalStudents || 0}
              </span>
            </div>

            <div className="text-center px-2 py-1 border-l border-white/10">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block flex items-center justify-center gap-1">
                <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
                {language === 'en' ? 'Rating' : 'রেটিং'}
              </span>
              <span className="text-base sm:text-lg font-black text-amber-400">
                {initialProfile.averageRating ? initialProfile.averageRating.toFixed(1) : '4.9'}
              </span>
            </div>

            <div className="text-center px-2 py-1 border-l border-white/10">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block flex items-center justify-center gap-1">
                <Wallet className="h-3 w-3 text-violet-400" />
                {language === 'en' ? 'Balance' : 'ব্যালেন্স'}
              </span>
              <span className="text-base sm:text-lg font-black text-violet-300">
                ৳{initialProfile.availableBalance || 0}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Navigation Tabs ── */}
      <div className="flex border-b border-gray-200 overflow-x-auto scrollbar-none gap-2">
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2 py-3 px-4 text-xs sm:text-sm font-bold border-b-2 transition whitespace-nowrap ${
            activeTab === 'profile'
              ? 'border-indigo-600 text-indigo-700 bg-indigo-50/40 rounded-t-lg'
              : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-t-lg'
          }`}
        >
          <User className="h-4 w-4" />
          <span>{language === 'en' ? 'Instructor Profile' : 'ইন্সট্রাক্টর প্রোফাইল'}</span>
        </button>

        <button
          onClick={() => setActiveTab('teaching')}
          className={`flex items-center gap-2 py-3 px-4 text-xs sm:text-sm font-bold border-b-2 transition whitespace-nowrap ${
            activeTab === 'teaching'
              ? 'border-indigo-600 text-indigo-700 bg-indigo-50/40 rounded-t-lg'
              : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-t-lg'
          }`}
        >
          <Layers className="h-4 w-4" />
          <span>{language === 'en' ? 'Teaching & Expertise' : 'শিক্ষা ও বিশেষজ্ঞতা'}</span>
        </button>

        <button
          onClick={() => setActiveTab('payout')}
          className={`flex items-center gap-2 py-3 px-4 text-xs sm:text-sm font-bold border-b-2 transition whitespace-nowrap ${
            activeTab === 'payout'
              ? 'border-indigo-600 text-indigo-700 bg-indigo-50/40 rounded-t-lg'
              : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-t-lg'
          }`}
        >
          <CreditCard className="h-4 w-4" />
          <span>{language === 'en' ? 'Payouts & Banking' : 'উইথড্রয়াল ও পেমেন্ট'}</span>
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`flex items-center gap-2 py-3 px-4 text-xs sm:text-sm font-bold border-b-2 transition whitespace-nowrap ${
            activeTab === 'security'
              ? 'border-indigo-600 text-indigo-700 bg-indigo-50/40 rounded-t-lg'
              : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-t-lg'
          }`}
        >
          <KeyRound className="h-4 w-4" />
          <span>{language === 'en' ? 'Security & Password' : 'নিরাপত্তা ও পাসওয়ার্ড'}</span>
        </button>

        <button
          onClick={() => setActiveTab('preferences')}
          className={`flex items-center gap-2 py-3 px-4 text-xs sm:text-sm font-bold border-b-2 transition whitespace-nowrap ${
            activeTab === 'preferences'
              ? 'border-indigo-600 text-indigo-700 bg-indigo-50/40 rounded-t-lg'
              : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-t-lg'
          }`}
        >
          <Bell className="h-4 w-4" />
          <span>{language === 'en' ? 'Preferences' : 'পছন্দ ও নোটিফিকেশন'}</span>
        </button>
      </div>

      {/* ── TAB 1: INSTRUCTOR PROFILE ── */}
      {activeTab === 'profile' && (
        <div className="space-y-6">
          <Card className="border-gray-200/80 shadow-xs">
            <CardHeader className="pb-4 border-b border-gray-100">
              <CardTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-indigo-600" />
                <span>{language === 'en' ? 'Professional Identity & Bio' : 'পেশাগত পরিচিতি ও বায়ো'}</span>
              </CardTitle>
              <CardDescription className="text-xs text-gray-500">
                {language === 'en'
                  ? 'This information appears on your public instructor profile and course landing pages.'
                  : 'এই তথ্যগুলো আপনার পাবলিক ইন্সট্রাক্টর প্রোফাইল এবং কোর্স বিবরণী পাতায় প্রদর্শিত হবে।'}
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-6 space-y-5">
              {profileSuccess && (
                <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200/80 p-3.5 text-xs text-emerald-800 font-semibold animate-in fade-in">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>{profileSuccess}</span>
                </div>
              )}

              {profileError && (
                <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200/80 p-3.5 text-xs text-rose-800 font-semibold animate-in fade-in">
                  <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                  <span>{profileError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Full Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5 text-indigo-600" />
                    <span>{language === 'en' ? 'Full Name *' : 'পূর্ণ নাম *'}</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Tanvir Ahmed"
                    className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-xs text-gray-900 outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition"
                  />
                </div>

                {/* Email (Read-only) */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-gray-500" />
                    <span>{language === 'en' ? 'Email Address (Locked)' : 'ইমেইল অ্যাড্রেস (লকড)'}</span>
                  </label>
                  <input
                    type="email"
                    disabled
                    value={initialProfile.email}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50/80 px-3.5 py-2.5 text-xs text-gray-500 cursor-not-allowed select-none font-mono"
                  />
                </div>

                {/* Contact Phone */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-indigo-600" />
                    <span>{language === 'en' ? 'Contact Phone (BD Format)' : 'মোবাইল নম্বর (যেমন: 017XXXXXXXX)'}</span>
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="017XXXXXXXX"
                    className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-xs text-gray-900 outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition"
                  />
                </div>

                {/* Professional Headline */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                    <Briefcase className="h-3.5 w-3.5 text-indigo-600" />
                    <span>{language === 'en' ? 'Professional Title / Designation *' : 'পদবি ও প্রফেশনাল হেডলাইন *'}</span>
                  </label>
                  <input
                    type="text"
                    value={headline}
                    onChange={(e) => setHeadline(e.target.value)}
                    placeholder="e.g. Senior Software Engineer @ TechCorp | Lead Instructor"
                    className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-xs text-gray-900 outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition"
                  />
                </div>

                {/* Organization */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                    <Building className="h-3.5 w-3.5 text-indigo-600" />
                    <span>{language === 'en' ? 'Organization / Company / Institute' : 'প্রতিষ্ঠান / কোম্পানি / বিশ্ববিদ্যালয়'}</span>
                  </label>
                  <input
                    type="text"
                    value={organization}
                    onChange={(e) => setOrganization(e.target.value)}
                    placeholder="e.g. Brain Station 23 / BUET"
                    className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-xs text-gray-900 outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition"
                  />
                </div>

                {/* Teaching Experience in Years */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                    <Award className="h-3.5 w-3.5 text-indigo-600" />
                    <span>{language === 'en' ? 'Years of Teaching Experience' : 'শিক্ষকতার অভিজ্ঞতা (বছর)'}</span>
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={50}
                    value={experienceYears}
                    onChange={(e) => setExperienceYears(Number(e.target.value) || 0)}
                    className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-xs text-gray-900 outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition"
                  />
                </div>
              </div>

              {/* Academic Background */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                  <GraduationCap className="h-3.5 w-3.5 text-indigo-600" />
                  <span>{language === 'en' ? 'Academic Background & Degree' : 'শিক্ষাগত যোগ্যতা ও ডিগ্রি'}</span>
                </label>
                <input
                  type="text"
                  value={academicBackground}
                  onChange={(e) => setAcademicBackground(e.target.value)}
                  placeholder="e.g. B.Sc in Computer Science & Engineering, BUET"
                  className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-xs text-gray-900 outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition"
                />
              </div>

              {/* Bio & Teaching Philosophy */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                  <BookOpen className="h-3.5 w-3.5 text-indigo-600" />
                  <span>{language === 'en' ? 'Instructor Bio & Teaching Philosophy' : 'ইন্সট্রাক্টর বায়ো ও শিক্ষণ দর্শন'}</span>
                </label>
                <textarea
                  rows={4}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder={
                    language === 'en'
                      ? 'Share your background, industry experience, and what students will gain by learning from you...'
                      : 'আপনার ব্যাকগ্রাউন্ড, ইন্ডাস্ট্রির কাজের অভিজ্ঞতা এবং আপনার কোর্স থেকে শিক্ষার্থীরা কী শিখবে তা সংক্ষেপে লিখুন...'
                  }
                  className="w-full rounded-xl border border-gray-200 p-3.5 text-xs text-gray-900 outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition leading-relaxed"
                />
              </div>

              {/* Social & Portfolio Links */}
              <div className="pt-2 border-t border-gray-100 space-y-3">
                <h3 className="text-xs font-bold text-gray-900 flex items-center gap-2">
                  <Globe className="h-4 w-4 text-indigo-600" />
                  <span>{language === 'en' ? 'Online Presence & Social Links' : 'অনলাইন উপস্থিতি ও সোশ্যাল প্রোফাইল লিঙ্ক'}</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex items-center rounded-xl border border-gray-200 px-3 bg-white focus-within:border-indigo-600 focus-within:ring-1 focus-within:ring-indigo-600">
                    <Globe className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                    <input
                      type="url"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      placeholder="https://yourportfolio.dev"
                      className="w-full border-0 px-2.5 py-2 text-xs text-gray-900 outline-none bg-transparent"
                    />
                  </div>

                  <div className="flex items-center rounded-xl border border-gray-200 px-3 bg-white focus-within:border-indigo-600 focus-within:ring-1 focus-within:ring-indigo-600">
                    <Github className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                    <input
                      type="url"
                      value={github}
                      onChange={(e) => setGithub(e.target.value)}
                      placeholder="https://github.com/username"
                      className="w-full border-0 px-2.5 py-2 text-xs text-gray-900 outline-none bg-transparent"
                    />
                  </div>

                  <div className="flex items-center rounded-xl border border-gray-200 px-3 bg-white focus-within:border-indigo-600 focus-within:ring-1 focus-within:ring-indigo-600">
                    <Linkedin className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                    <input
                      type="url"
                      value={linkedin}
                      onChange={(e) => setLinkedin(e.target.value)}
                      placeholder="https://linkedin.com/in/username"
                      className="w-full border-0 px-2.5 py-2 text-xs text-gray-900 outline-none bg-transparent"
                    />
                  </div>

                  <div className="flex items-center rounded-xl border border-gray-200 px-3 bg-white focus-within:border-indigo-600 focus-within:ring-1 focus-within:ring-indigo-600">
                    <Twitter className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                    <input
                      type="url"
                      value={twitter}
                      onChange={(e) => setTwitter(e.target.value)}
                      placeholder="https://x.com/username"
                      className="w-full border-0 px-2.5 py-2 text-xs text-gray-900 outline-none bg-transparent"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-3">
                <Button
                  onClick={handleSaveProfile}
                  disabled={isPending}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold gap-2 px-6"
                >
                  {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  <span>{language === 'en' ? 'Save Profile Details' : 'প্রোফাইল তথ্য সংরক্ষণ করুন'}</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── TAB 2: TEACHING & EXPERTISE ── */}
      {activeTab === 'teaching' && (
        <div className="space-y-6">
          <Card className="border-gray-200/80 shadow-xs">
            <CardHeader className="pb-4 border-b border-gray-100">
              <CardTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Layers className="h-5 w-5 text-indigo-600" />
                <span>{language === 'en' ? 'Teaching Domains & Technical Mastery' : 'শিক্ষণ বিষয় ও কারিগরি দক্ষতা'}</span>
              </CardTitle>
              <CardDescription className="text-xs text-gray-500">
                {language === 'en'
                  ? 'Define the fields you specialize in, courses you instruct, and technologies you teach students.'
                  : 'আপনি যে বিষয়গুলোতে স্পেশালাইজড এবং যেসব প্রযুক্তি শিক্ষার্থীদের শেখান তা নির্বাচন করুন।'}
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-6 space-y-6">
              {teachingSuccess && (
                <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200/80 p-3.5 text-xs text-emerald-800 font-semibold animate-in fade-in">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>{teachingSuccess}</span>
                </div>
              )}

              {teachingError && (
                <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200/80 p-3.5 text-xs text-rose-800 font-semibold animate-in fade-in">
                  <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                  <span>{teachingError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Primary Teaching Track */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 block">
                    {language === 'en' ? 'Primary Instructional Track' : 'প্রধান শিক্ষণ ট্র্যাক'}
                  </label>
                  <select
                    value={targetTrack}
                    onChange={(e) => setTargetTrack(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-xs text-gray-900 outline-none bg-white focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition"
                  >
                    <option value="Fullstack Web Development">Fullstack Web Development (React & Node.js)</option>
                    <option value="Competitive Programming & DSA">Competitive Programming & Data Structures</option>
                    <option value="Machine Learning & AI">Artificial Intelligence & Machine Learning</option>
                    <option value="System Design & Cloud Architecture">System Design & Cloud Architecture</option>
                    <option value="Mobile App Development">Mobile App Development (React Native / Flutter)</option>
                    <option value="DevOps & Site Reliability">DevOps, Docker & Kubernetes Engineering</option>
                    <option value="Cyber Security">Cyber Security & Application Hardening</option>
                  </select>
                </div>

                {/* Weekly Mentorship Hours */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-gray-700">
                      {language === 'en' ? 'Weekly Mentorship & Live QA Target' : 'সাপ্তাহিক লাইভ ক্লাস ও মেন্টরশিপ সময়'}
                    </label>
                    <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                      {weeklyGoalHours} {language === 'en' ? 'hrs/week' : 'ঘণ্টা/সপ্তাহ'}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={2}
                    max={40}
                    step={1}
                    value={weeklyGoalHours}
                    onChange={(e) => setWeeklyGoalHours(Number(e.target.value))}
                    className="w-full accent-indigo-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-gray-400 font-semibold px-0.5">
                    <span>2 hrs</span>
                    <span>15 hrs</span>
                    <span>40 hrs</span>
                  </div>
                </div>
              </div>

              {/* Teaching Domains (Tags) */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4 text-amber-500" />
                    <span>{language === 'en' ? 'Teaching Domains & Topics' : 'শিক্ষাদানের ক্ষেত্র ও বিষয়সমূহ'}</span>
                  </label>
                  <span className="text-[11px] text-gray-500 font-medium">
                    {expertise.length} {language === 'en' ? 'selected' : 'টি নির্বাচিত'}
                  </span>
                </div>

                {/* Tag Input */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customExpertise}
                    onChange={(e) => setCustomExpertise(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddExpertise())}
                    placeholder={
                      language === 'en'
                        ? 'Type a domain (e.g. Distributed Databases) and click Add'
                        : 'নতুন কোনো ক্ষেত্র যোগ করতে লিখুন (যেমন: Distributed Databases)'
                    }
                    className="flex-1 rounded-xl border border-gray-200 px-3.5 py-2 text-xs text-gray-900 outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                  />
                  <Button
                    type="button"
                    onClick={handleAddExpertise}
                    className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-xl text-xs font-bold px-4"
                  >
                    {language === 'en' ? 'Add' : 'যোগ করুন'}
                  </Button>
                </div>

                {/* Chips Grid */}
                <div className="flex flex-wrap gap-2 pt-1">
                  {availableExpertise.map((item) => {
                    const isSelected = expertise.includes(item);
                    return (
                      <button
                        key={item}
                        type="button"
                        onClick={() => {
                          setExpertise((prev) =>
                            isSelected ? prev.filter((i) => i !== item) : [...prev, item]
                          );
                        }}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer border ${
                          isSelected
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                            : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        <span>{item}</span>
                        {isSelected && (
                          <X
                            className="h-3 w-3 hover:text-indigo-200"
                            onClick={(e) => handleRemoveCustomExpertise(e, item)}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Technical Stack & Tools (Skills) */}
              <div className="space-y-3 pt-3 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                    <BookOpen className="h-4 w-4 text-emerald-600" />
                    <span>{language === 'en' ? 'Technologies & Frameworks Taught' : 'যেসব প্রযুক্তি ও ফ্রেমওয়ার্ক শেখান'}</span>
                  </label>
                  <span className="text-[11px] text-gray-500 font-medium">
                    {skills.length} {language === 'en' ? 'selected' : 'টি নির্বাচিত'}
                  </span>
                </div>

                {/* Tag Input */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customSkill}
                    onChange={(e) => setCustomSkill(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
                    placeholder={
                      language === 'en'
                        ? 'Type a skill (e.g. Rust, Redis) and click Add'
                        : 'নতুন কোনো স্কিল যোগ করতে লিখুন (যেমন: Rust, Redis)'
                    }
                    className="flex-1 rounded-xl border border-gray-200 px-3.5 py-2 text-xs text-gray-900 outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                  />
                  <Button
                    type="button"
                    onClick={handleAddSkill}
                    className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-xl text-xs font-bold px-4"
                  >
                    {language === 'en' ? 'Add' : 'যোগ করুন'}
                  </Button>
                </div>

                {/* Chips Grid */}
                <div className="flex flex-wrap gap-2 pt-1">
                  {availableSkills.map((item) => {
                    const isSelected = skills.includes(item);
                    return (
                      <button
                        key={item}
                        type="button"
                        onClick={() => {
                          setSkills((prev) =>
                            isSelected ? prev.filter((i) => i !== item) : [...prev, item]
                          );
                        }}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer border ${
                          isSelected
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                            : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        <span>{item}</span>
                        {isSelected && (
                          <X
                            className="h-3 w-3 hover:text-emerald-200"
                            onClick={(e) => handleRemoveCustomSkill(e, item)}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end pt-3">
                <Button
                  onClick={handleSaveTeaching}
                  disabled={isPending}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold gap-2 px-6"
                >
                  {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  <span>{language === 'en' ? 'Save Teaching Settings' : 'শিক্ষণ সেটিংস সংরক্ষণ করুন'}</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── TAB 3: PAYOUT & BANKING ── */}
      {activeTab === 'payout' && (
        <div className="space-y-6">
          <Card className="border-gray-200/80 shadow-xs">
            <CardHeader className="pb-4 border-b border-gray-100">
              <CardTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Wallet className="h-5 w-5 text-indigo-600" />
                <span>{language === 'en' ? 'Earnings & Payout Setup' : 'আয় ও উইথড্রয়াল সেটিংস'}</span>
              </CardTitle>
              <CardDescription className="text-xs text-gray-500">
                {language === 'en'
                  ? 'Configure where and how your course sale revenues will be deposited.'
                  : 'কোর্স বিক্রয়লব্ধ আয় কোন একাউন্টে গ্রহণ করবেন তা নিরাপদে সেট করুন।'}
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-6 space-y-6">
              {payoutSuccess && (
                <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200/80 p-3.5 text-xs text-emerald-800 font-semibold animate-in fade-in">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>{payoutSuccess}</span>
                </div>
              )}

              {payoutError && (
                <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200/80 p-3.5 text-xs text-rose-800 font-semibold animate-in fade-in">
                  <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                  <span>{payoutError}</span>
                </div>
              )}

              {/* Earnings Overview Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-5 space-y-1">
                  <span className="text-xs font-bold text-indigo-900/80 uppercase tracking-wider block">
                    {language === 'en' ? 'Available Withdrawable Balance' : 'উত্তোলনযোগ্য ব্যালেন্স'}
                  </span>
                  <div className="text-3xl font-black text-indigo-700">
                    ৳{initialProfile.availableBalance || 0}
                  </div>
                  <p className="text-[11px] text-indigo-600">
                    {language === 'en'
                      ? 'Funds ready to be transferred to your selected account.'
                      : 'এই অর্থ সরাসরি আপনার একাউন্টে ট্রান্সফারের জন্য প্রস্তুত।'}
                  </p>
                </div>

                <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-5 space-y-1">
                  <span className="text-xs font-bold text-emerald-900/80 uppercase tracking-wider block">
                    {language === 'en' ? 'Lifetime Total Earnings' : 'সর্বমোট অর্জিত আয়'}
                  </span>
                  <div className="text-3xl font-black text-emerald-700">
                    ৳{initialProfile.totalEarnings || 0}
                  </div>
                  <p className="text-[11px] text-emerald-600">
                    {language === 'en'
                      ? 'Total revenue generated across all your active courses.'
                      : 'আপনার সকল কোর্স থেকে প্ল্যাটফর্মে আজ পর্যন্ত মোট আয়।'}
                  </p>
                </div>
              </div>

              {/* Select Payout Method */}
              <div className="space-y-3 pt-2">
                <label className="text-xs font-bold text-gray-800 block">
                  {language === 'en' ? 'Select Preferred Payout Provider' : 'পছন্দের উইথড্রয়াল মেথড নির্বাচন করুন'}
                </label>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {(['BKASH', 'NAGAD', 'ROCKET', 'BANK'] as const).map((method) => {
                    const isSelected = payoutMethod === method;
                    return (
                      <button
                        key={method}
                        type="button"
                        onClick={() => setPayoutMethod(method)}
                        className={`p-3.5 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition text-xs font-bold ${
                          isSelected
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                            : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <CreditCard className="h-4 w-4" />
                        <span>{method}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Payout Details Input Form */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 block">
                    {payoutMethod === 'BANK'
                      ? language === 'en'
                        ? 'Bank Account Number *'
                        : 'ব্যাংক হিসাব নম্বর *'
                      : language === 'en'
                      ? `${payoutMethod} Wallet Number *`
                      : `${payoutMethod} ওয়ালেট নম্বর *`}
                  </label>
                  <input
                    type="text"
                    value={payoutNumber}
                    onChange={(e) => setPayoutNumber(e.target.value)}
                    placeholder={payoutMethod === 'BANK' ? 'e.g. 150.120.345678' : '017XXXXXXXX'}
                    className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-xs text-gray-900 outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition font-mono"
                  />
                </div>

                {payoutMethod === 'BANK' && (
                  <>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-700 block">
                        {language === 'en' ? 'Account Holder Name' : 'একাউন্ট হোল্ডারের নাম'}
                      </label>
                      <input
                        type="text"
                        value={bankAccountName}
                        onChange={(e) => setBankAccountName(e.target.value)}
                        placeholder="e.g. Tanvir Ahmed"
                        className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-xs text-gray-900 outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-700 block">
                        {language === 'en' ? 'Bank Name' : 'ব্যাংকের নাম'}
                      </label>
                      <input
                        type="text"
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        placeholder="e.g. Dutch Bangla Bank Ltd (DBBL)"
                        className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-xs text-gray-900 outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-700 block">
                        {language === 'en' ? 'Branch Name' : 'শাখার নাম'}
                      </label>
                      <input
                        type="text"
                        value={bankBranch}
                        onChange={(e) => setBankBranch(e.target.value)}
                        placeholder="e.g. Dhanmondi Branch"
                        className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-xs text-gray-900 outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition"
                      />
                    </div>
                  </>
                )}
              </div>

              <div className="flex justify-end pt-3">
                <Button
                  onClick={handleSavePayout}
                  disabled={isPending}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold gap-2 px-6"
                >
                  {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  <span>{language === 'en' ? 'Save Payout Details' : 'উইথড্রয়াল তথ্য সংরক্ষণ করুন'}</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── TAB 4: SECURITY & PASSWORD ── */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          <Card className="border-gray-200/80 shadow-xs">
            <CardHeader className="pb-4 border-b border-gray-100">
              <CardTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
                <KeyRound className="h-5 w-5 text-indigo-600" />
                <span>{language === 'en' ? 'Change Password & Credentials' : 'পাসওয়ার্ড ও অ্যাকাউন্ট নিরাপত্তা'}</span>
              </CardTitle>
              <CardDescription className="text-xs text-gray-500">
                {language === 'en'
                  ? 'Keep your instructor account safe by using a strong, unique password.'
                  : 'আপনার ইন্সট্রাক্টর একাউন্ট সুরক্ষিত রাখতে শক্তিশালী ও অনন্য পাসওয়ার্ড ব্যবহার করুন।'}
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-6 space-y-5">
              {passwordSuccess && (
                <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200/80 p-3.5 text-xs text-emerald-800 font-semibold animate-in fade-in">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>{passwordSuccess}</span>
                </div>
              )}

              {passwordError && (
                <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200/80 p-3.5 text-xs text-rose-800 font-semibold animate-in fade-in">
                  <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                  <span>{passwordError}</span>
                </div>
              )}

              <div className="space-y-4 max-w-md">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 block">
                    {language === 'en' ? 'Current Password' : 'বর্তমান পাসওয়ার্ড'}
                  </label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-xs text-gray-900 outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 block">
                    {language === 'en' ? 'New Password (min 6 characters)' : 'নতুন পাসওয়ার্ড (কমপক্ষে ৬ অক্ষর)'}
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-xs text-gray-900 outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 block">
                    {language === 'en' ? 'Confirm New Password' : 'নতুন পাসওয়ার্ড নিশ্চিত করুন'}
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-xs text-gray-900 outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition"
                  />
                </div>

                <div className="pt-2">
                  <Button
                    onClick={handleUpdatePassword}
                    disabled={isPending}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold gap-2 px-6"
                  >
                    {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    <span>{language === 'en' ? 'Update Password' : 'পাসওয়ার্ড পরিবর্তন করুন'}</span>
                  </Button>
                </div>
              </div>

              {/* Account Status Card */}
              <div className="pt-6 border-t border-gray-100 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-gray-900">
                    {language === 'en' ? 'Account Role & Status' : 'অ্যাকাউন্ট রোল ও স্ট্যাটাস'}
                  </h4>
                  <p className="text-[11px] text-gray-500">
                    {language === 'en'
                      ? 'Your account currently holds verified instructor privileges.'
                      : 'আপনার অ্যাকাউন্টটি অনুমোদিত ইন্সট্রাক্টর সুবিধা সম্পন্ন।'}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs font-bold">
                    {initialProfile.status || 'APPROVED'}
                  </Badge>
                  <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 text-xs font-bold">
                    {initialProfile.role || 'INSTRUCTOR'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── TAB 5: PREFERENCES ── */}
      {activeTab === 'preferences' && (
        <div className="space-y-6">
          <Card className="border-gray-200/80 shadow-xs">
            <CardHeader className="pb-4 border-b border-gray-100">
              <CardTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Bell className="h-5 w-5 text-indigo-600" />
                <span>{language === 'en' ? 'Alerts & System Preferences' : 'নোটিফিকেশন ও প্ল্যাটফর্ম প্রেফারেন্স'}</span>
              </CardTitle>
              <CardDescription className="text-xs text-gray-500">
                {language === 'en'
                  ? 'Manage your communication alerts and app appearance.'
                  : 'কোর্স ও প্ল্যাটফর্ম সম্পর্কিত নোটিফিকেশন নিয়ন্ত্রণ করুন।'}
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-6 space-y-6">
              <div className="divide-y divide-gray-100">
                {/* Course Review Alerts */}
                <div className="py-4 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-gray-900 block">
                      {language === 'en' ? 'Course Review & Approval Notifications' : 'কোর্স রিভিউ ও অনুমোদন নোটিফিকেশন'}
                    </span>
                    <span className="text-[11px] text-gray-500">
                      {language === 'en'
                        ? 'Receive email when your submitted course is approved or requires edits.'
                        : 'কোর্স অনুমোদিত হলে বা এডিটের নির্দেশনা এলে ইমেইল পাবেন।'}
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={courseReviewNotif}
                      onChange={(e) => setCourseReviewNotif(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>

                {/* Student Q&A Alerts */}
                <div className="py-4 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-gray-900 block">
                      {language === 'en' ? 'Student Q&A & Discussion Alerts' : 'শিক্ষার্থীদের প্রশ্নোত্তর ও আলোচনা নোটিফিকেশন'}
                    </span>
                    <span className="text-[11px] text-gray-500">
                      {language === 'en'
                        ? 'Notify you when students post new questions in your lectures.'
                        : 'লেকচারে শিক্ষার্থীরা প্রশ্ন করলে নোটিফিকেশন পাবেন।'}
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={studentQuestionNotif}
                      onChange={(e) => setStudentQuestionNotif(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>

                {/* New Enrollment Alerts */}
                <div className="py-4 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-gray-900 block">
                      {language === 'en' ? 'New Course Enrollment Alerts' : 'নতুন শিক্ষার্থী এনরোলমেন্ট সতর্কতা'}
                    </span>
                    <span className="text-[11px] text-gray-500">
                      {language === 'en'
                        ? 'Get notified whenever a student enrolls in your premium courses.'
                        : 'কোর্সে নতুন শিক্ষার্থী ভর্তি হলে নোটিফিকেশন পাবেন।'}
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={enrollmentNotif}
                      onChange={(e) => setEnrollmentNotif(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>

                {/* Language Switch */}
                <div className="py-4 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-gray-900 block">
                      {language === 'en' ? 'Platform Language' : 'প্ল্যাটফর্ম ভাষা'}
                    </span>
                    <span className="text-[11px] text-gray-500">
                      {language === 'en'
                        ? 'Switch between English and Bengali across the entire interface.'
                        : 'পুরো ইন্টারফেসে বাংলা ও ইংরেজির মধ্যে পরিবর্তন করুন।'}
                    </span>
                  </div>
                  <LanguageToggle />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export default InstructorSettingsClient;
