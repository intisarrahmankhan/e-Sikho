'use client';

import React from 'react';
import Link from 'next/link';
import {
  Flame,
  Trophy,
  BookOpen,
  Award,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Target,
  GraduationCap,
  Play,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { CourseCard } from '@/components/dashboard/CourseCard';
import { UpcomingExamsWidget } from '@/components/dashboard/UpcomingExamsWidget';
import { LeaderboardSnippet } from '@/components/dashboard/LeaderboardSnippet';
import { EmptyEnrollments } from '@/components/dashboard/EmptyEnrollments';
import InstructorRequestForm from '@/components/dashboard/InstructorRequestForm';
import { useLanguage } from '@/context/LanguageContext';

interface StudentDashboardClientProps {
  userName: string;
  enrolledCourses: any[];
  upcomingExams: any[];
  topStudents: any[];
  instructorRequest: any;
  elo: number;
  streak: number;
}

export function StudentDashboardClient({
  userName,
  enrolledCourses,
  upcomingExams,
  topStudents,
  instructorRequest,
  elo,
  streak,
}: StudentDashboardClientProps) {
  const { language } = useLanguage();

  const firstName = userName ? userName.split(' ')[0] : language === 'en' ? 'Student' : 'শিক্ষার্থী';
  const hasEnrollments = enrolledCourses.length > 0;

  const statCards = [
    {
      label: language === 'en' ? 'Enrolled Courses' : 'এনরোল করা কোর্স',
      value: enrolledCourses.length,
      icon: BookOpen,
      bg: 'bg-blue-50',
      iconColor: 'text-blue-600',
      border: 'border-blue-100',
    },
    {
      label: language === 'en' ? 'Ongoing Lessons' : 'চলমান লেসন',
      value: hasEnrollments ? (language === 'en' ? '8' : '৮') : (language === 'en' ? '0' : '০'),
      icon: Play,
      bg: 'bg-violet-50',
      iconColor: 'text-violet-600',
      border: 'border-violet-100',
    },
    {
      label: language === 'en' ? 'Completed Quizzes' : 'সম্পন্ন কুইজ',
      value: language === 'en' ? '12' : '১২',
      icon: CheckCircle2,
      bg: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
      border: 'border-emerald-100',
    },
    {
      label: language === 'en' ? 'Earned Certificates' : 'অর্জিত সার্টিফিকেট',
      value: language === 'en' ? '1' : '১',
      icon: Award,
      bg: 'bg-amber-50',
      iconColor: 'text-amber-600',
      border: 'border-amber-100',
    },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* ── Hero Welcome Banner ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white px-7 py-7 shadow-xl border border-slate-800">
        <div className="pointer-events-none absolute -top-12 -right-12 h-64 w-64 rounded-full bg-indigo-600/10" />
        <div className="pointer-events-none absolute -bottom-8 left-1/3 h-40 w-40 rounded-full bg-violet-600/10" />

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/15 px-3 py-1 text-xs font-semibold mb-3">
              <Sparkles className="h-3.5 w-3.5 text-indigo-300" />
              <span>{language === 'en' ? 'Student Portal' : 'স্টুডেন্ট পোর্টাল'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {language === 'en' ? `Welcome, ${firstName}! 👋` : `স্বাগতম, ${firstName}! 👋`}
            </h1>
            <p className="mt-1.5 text-slate-300 text-sm max-w-md leading-relaxed">
              {language === 'en'
                ? 'Continue your courses on your learning dashboard and reach your weekly targets.'
                : 'আপনার লার্নিং ড্যাশবোর্ডে কোর্সসমূহ চালিয়ে যান এবং সাপ্তাহিক লক্ষ্য পূরণ করুন।'}
            </p>
            <p className="text-xs text-slate-500 mt-2">
              {new Date().toLocaleDateString(language === 'en' ? 'en-US' : 'bn-BD', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>

          {/* ELO + Streak badges */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <div className="flex items-center gap-2.5 rounded-2xl bg-white/8 border border-white/10 backdrop-blur-sm px-4 py-3">
              <div className="h-9 w-9 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400">
                <Trophy className="h-5 w-5" />
              </div>
              <div>
                <div className="text-[11px] text-slate-400 font-medium">Elo Rating</div>
                <div className="text-xl font-extrabold text-amber-400 leading-tight">{elo}</div>
              </div>
            </div>
            <div className="flex items-center gap-2.5 rounded-2xl bg-white/8 border border-white/10 backdrop-blur-sm px-4 py-3">
              <div className="h-9 w-9 rounded-xl bg-rose-500/20 flex items-center justify-center text-rose-400">
                <Flame className="h-5 w-5" />
              </div>
              <div>
                <div className="text-[11px] text-slate-400 font-medium">
                  {language === 'en' ? 'Streak' : 'স্ট্রিক'}
                </div>
                <div className="text-xl font-extrabold text-rose-400 leading-tight">
                  {language === 'en' ? `${streak} Days 🔥` : `${streak} দিন 🔥`}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── KPI Stat Cards ── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {statCards.map((stat, i) => (
          <Card key={i} className={`relative overflow-hidden border ${stat.border} p-5 shadow-sm hover:shadow-md transition-shadow`}>
            <div className={`absolute top-0 right-0 h-20 w-20 rounded-bl-full ${stat.bg} opacity-50`} />
            <div className={`flex items-center justify-center h-10 w-10 rounded-xl ${stat.bg} border ${stat.border} mb-3`}>
              <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
            </div>
            <div className="text-3xl font-extrabold text-gray-900">{stat.value}</div>
            <div className={`text-xs font-semibold uppercase tracking-wide mt-0.5 ${stat.iconColor}`}>{stat.label}</div>
          </Card>
        ))}
      </div>

      {/* ── Daily Goal Banner ── */}
      <div className="rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white p-5 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/20">
            <Target className="h-6 w-6 text-white" />
          </div>
          <div>
            <h4 className="text-sm font-bold">
              {language === 'en' ? "Today's Study Goal" : 'আজকের পড়ার লক্ষ্যমাত্রা'}
            </h4>
            <p className="text-xs text-indigo-200 mt-0.5">
              {language === 'en' ? '30 of 45 minutes completed' : '৪৫ মিনিটের মধ্যে ৩০ মিনিট সম্পন্ন হয়েছে'}
            </p>
            <div className="mt-2 flex items-center gap-2">
              <div className="h-2 flex-1 bg-white/20 rounded-full overflow-hidden max-w-[180px]">
                <div className="h-full w-[67%] bg-white rounded-full" />
              </div>
              <span className="text-xs font-bold text-white">67%</span>
            </div>
          </div>
        </div>
        <Link href="/courses">
          <Button size="sm" className="bg-white text-indigo-700 hover:bg-indigo-50 font-bold text-xs px-5 py-2.5 rounded-xl shadow-sm shrink-0">
            {language === 'en' ? 'Continue Learning →' : 'পড়া চালিয়ে যান →'}
          </Button>
        </Link>
      </div>

      {/* ── Main Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Enrolled Courses */}
        <div className="lg:col-span-2 space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-indigo-600" />
              <h2 className="text-base font-bold text-gray-900">
                {language === 'en' ? 'My Ongoing Courses' : 'আমার চলমান কোর্সসমূহ'}
              </h2>
              <Badge variant="outline" className="text-xs font-bold text-indigo-700 bg-indigo-50 border-indigo-200">
                {language === 'en' ? `${enrolledCourses.length} Active` : `${enrolledCourses.length} সক্রিয়`}
              </Badge>
            </div>
            <Link href="/courses" className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition">
              {language === 'en' ? 'Browse Courses' : 'নতুন কোর্স'} <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {!hasEnrollments ? (
            <EmptyEnrollments />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {enrolledCourses.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          )}
        </div>

        {/* Right: Widgets */}
        <div className="space-y-5">
          <UpcomingExamsWidget exams={upcomingExams} />
          <LeaderboardSnippet topStudents={topStudents} />
        </div>
      </div>

      {/* ── Become an Instructor ── */}
      <section className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-violet-50 p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white">
            <GraduationCap className="h-6 w-6" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-gray-900">
              {language === 'en' ? 'Become an Instructor' : 'ইন্সট্রাক্টর হোন'}
            </h2>
            <p className="mt-1 mb-4 text-sm text-gray-600 max-w-xl leading-relaxed">
              {language === 'en'
                ? 'Share your knowledge on e-Shikho and earn revenue from your courses. Your request requires approval from an Admin and SuperAdmin.'
                : 'e-Shikho-তে আপনার জ্ঞান শেয়ার করুন এবং আপনার কোর্স থেকে আয় করুন। আপনার আবেদনটি অ্যাডমিন ও সুপারঅ্যাডমিন দ্বারা অনুমোদিত হতে হবে।'}
            </p>
            <InstructorRequestForm status={instructorRequest?.status} />
          </div>
        </div>
      </section>
    </div>
  );
}
