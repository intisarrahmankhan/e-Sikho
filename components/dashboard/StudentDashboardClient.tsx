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
  TrendingUp,
  TrendingDown,
  Layers,
  Zap,
  Code2,
  ExternalLink,
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
import { getRatingTier } from '@/lib/elo';

interface StudentDashboardClientProps {
  userName: string;
  enrolledCourses: any[];
  upcomingExams: any[];
  topStudents: any[];
  instructorRequest: any;
  elo: number;
  competitiveElo?: number;
  problemsSolved?: number;
  completedCoursesCount?: number;
  academicBackground?: string;
  eloHistory?: any[];
  prioritizedContests?: any[];
  streak: number;
  ongoingLessonsCount?: number;
  completedQuizzesCount?: number;
  earnedCertificatesCount?: number;
}

export function StudentDashboardClient({
  userName,
  enrolledCourses,
  upcomingExams,
  topStudents,
  instructorRequest,
  elo,
  competitiveElo = 1200,
  problemsSolved = 0,
  completedCoursesCount = 0,
  academicBackground = 'Computer Science & Engineering (CSE)',
  eloHistory = [],
  prioritizedContests = [],
  streak,
  ongoingLessonsCount = 0,
  completedQuizzesCount = 0,
  earnedCertificatesCount = 0,
}: StudentDashboardClientProps) {
  const { language } = useLanguage();

  const tier = getRatingTier(elo);
  const courseBonus = Math.min(150, completedCoursesCount * 25);
  const problemBonus = Math.min(100, Math.floor(problemsSolved * 2));
  const latestEloChange = eloHistory.length > 0 ? eloHistory[0] : null;

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
      value: ongoingLessonsCount,
      icon: Play,
      bg: 'bg-violet-50',
      iconColor: 'text-violet-600',
      border: 'border-violet-100',
    },
    {
      label: language === 'en' ? 'Completed Quizzes' : 'সম্পন্ন কুইজ',
      value: completedQuizzesCount,
      icon: CheckCircle2,
      bg: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
      border: 'border-emerald-100',
    },
    {
      label: language === 'en' ? 'Earned Certificates' : 'অর্জিত সার্টিফিকেট',
      value: earnedCertificatesCount,
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
            <div className="flex items-center gap-3 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-md px-4 py-3 shadow-inner">
              <div className="h-10 w-10 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-300">
                <Trophy className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-slate-300 font-medium">Elo Rating</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30">
                    {language === 'en' ? tier.titleEn : tier.titleBn}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xl font-black text-amber-300 leading-tight">{elo}</span>
                  {latestEloChange && (
                    <span
                      className={`text-[11px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5 ${
                        latestEloChange.delta >= 0
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      }`}
                    >
                      {latestEloChange.delta >= 0 ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />
                      )}
                      <span>
                        {latestEloChange.delta >= 0 ? `+${latestEloChange.delta}` : latestEloChange.delta}
                      </span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2.5 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-md px-4 py-3">
              <div className="h-10 w-10 rounded-xl bg-rose-500/20 border border-rose-400/30 flex items-center justify-center text-rose-300">
                <Flame className="h-5 w-5" />
              </div>
              <div>
                <div className="text-[11px] text-slate-300 font-medium">
                  {language === 'en' ? 'Streak' : 'স্ট্রিক'}
                </div>
                <div className="text-xl font-extrabold text-rose-300 leading-tight">
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

      {/* ── Elo Performance & Mastery Engine Breakdown ── */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <Trophy className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">
                  {language === 'en' ? 'Elo Skill Rating & MMR Engine' : 'ইলো রেটিং ও স্কিল ইঞ্জিন বিশদ'}
                </h3>
                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${tier.badgeBg} ${tier.badgeColor} ${tier.borderColor}`}>
                  {language === 'en' ? tier.titleEn : tier.titleBn}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {language === 'en'
                  ? 'Competitive rating rises or drops dynamically based on contest performance. Course completion & problem solving provide cumulative mastery bonuses.'
                  : 'প্রতিযোগিতায় পারফরম্যান্স অনুযায়ী রেটিং বৃদ্ধি বা হ্রাস পায়। কোর্স সম্পন্ন ও সমস্যা সমাধানে স্থায়ী অভিজ্ঞতা বোনাস যুক্ত হয়।'}
              </p>
            </div>
          </div>

          <Link href="/contests">
            <Button size="sm" className="bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-sm">
              <Code2 className="h-3.5 w-3.5" />
              <span>{language === 'en' ? 'Enter Problem Arena' : 'কনটেস্ট অ্যারেনায় যান'}</span>
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-1">
          {/* 1. Pure Competitive Rating */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span className="font-medium">{language === 'en' ? 'Competitive MMR' : 'প্রতিযোগিতামূলক MMR'}</span>
              <Zap className="h-3.5 w-3.5 text-amber-500" />
            </div>
            <div className="text-xl font-extrabold text-slate-900">{competitiveElo}</div>
            <p className="text-[10px] text-slate-400 mt-1">
              {language === 'en' ? 'Dynamic: increases on win, drops on poor score' : 'ডাইনামিক: পারফরম্যান্সের ভিত্তিতে কমবে বা বাড়বে'}
            </p>
          </div>

          {/* 2. Course Completion Bonus */}
          <div className="p-3.5 rounded-xl bg-indigo-50/50 border border-indigo-100">
            <div className="flex items-center justify-between text-xs text-indigo-700 mb-1">
              <span className="font-medium">{language === 'en' ? 'Courses Bonus' : 'কোর্স মাস্টার বোনাস'}</span>
              <BookOpen className="h-3.5 w-3.5 text-indigo-500" />
            </div>
            <div className="text-xl font-extrabold text-indigo-900">+{courseBonus}</div>
            <p className="text-[10px] text-indigo-600 mt-1">
              {completedCoursesCount} {language === 'en' ? 'enrolled tracks (+25/course, max 150)' : 'কোর্স সম্পন্ন (+২৫/কোর্স)'}
            </p>
          </div>

          {/* 3. Problems Solved Volume Bonus */}
          <div className="p-3.5 rounded-xl bg-emerald-50/50 border border-emerald-100">
            <div className="flex items-center justify-between text-xs text-emerald-700 mb-1">
              <span className="font-medium">{language === 'en' ? 'Solved Problems Bonus' : 'সমস্যা সমাধান বোনাস'}</span>
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
            </div>
            <div className="text-xl font-extrabold text-emerald-900">+{problemBonus}</div>
            <p className="text-[10px] text-emerald-600 mt-1">
              {problemsSolved} {language === 'en' ? 'problems solved (+2/problem, max 100)' : 'সমস্যা সমাধান (+২/সমস্যা)'}
            </p>
          </div>

          {/* 4. Total Composite Elo */}
          <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200">
            <div className="flex items-center justify-between text-xs text-amber-800 mb-1">
              <span className="font-bold">{language === 'en' ? 'Effective Elo' : 'কার্যকর মোট ইলো'}</span>
              <Award className="h-3.5 w-3.5 text-amber-600" />
            </div>
            <div className="text-2xl font-black text-amber-700 leading-none mt-0.5">{elo}</div>
            <p className="text-[10px] text-amber-800/80 mt-1.5 font-medium">
              = {competitiveElo} + {courseBonus} + {problemBonus}
            </p>
          </div>
        </div>

        {/* Recent rating delta trail */}
        {eloHistory && eloHistory.length > 0 && (
          <div className="pt-2 border-t border-slate-100 flex items-center gap-2 flex-wrap text-xs">
            <span className="text-slate-400 font-medium text-[11px]">
              {language === 'en' ? 'Recent rating changes:' : 'সাম্প্রতিক রেটিং পরিবর্তন:'}
            </span>
            {eloHistory.slice(0, 3).map((h: any, idx: number) => (
              <span
                key={idx}
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold ${
                  h.delta >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                }`}
              >
                {h.delta >= 0 ? `+${h.delta}` : h.delta} ({h.contestTitle ? h.contestTitle.substring(0, 18) + '...' : 'Contest'})
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ── Prioritized Contests Arena for Current Student Background ── */}
      {prioritizedContests && prioritizedContests.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Flame className="h-5 w-5 text-rose-500" />
                <h3 className="text-base font-bold text-slate-900">
                  {language === 'en'
                    ? 'Problem Solving Contests Prioritized for Your Track'
                    : 'আপনার পড়াশোনার ট্র্যাকের জন্য অগ্রাধিকারপ্রাপ্ত কনটেস্ট'}
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {language === 'en'
                  ? `Curated based on: ${academicBackground}. Top contests offer maximum relevance and rating stakes.`
                  : `${academicBackground} ব্যাকগ্রাউন্ডের ভিত্তিতে সাজানো হয়েছে। শীর্ষে থাকা কনটেস্টে অংশ নিয়ে রেটিং বৃদ্ধি করুন।`}
              </p>
            </div>
            <Link
              href="/contests"
              className="text-xs font-bold text-primary-600 hover:text-primary-700 flex items-center gap-1"
            >
              <span>{language === 'en' ? 'All Contests' : 'সকল কনটেস্ট'}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {prioritizedContests.slice(0, 2).map((c: any) => {
              const isHigh = c.priority === 'HIGH';
              return (
                <div
                  key={c.id}
                  className={`rounded-2xl p-5 border transition hover:shadow-md flex flex-col justify-between ${
                    isHigh
                      ? 'bg-gradient-to-br from-amber-50/40 via-white to-orange-50/20 border-amber-300'
                      : 'bg-white border-slate-200'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2.5">
                      <span
                        className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                          isHigh
                            ? 'bg-rose-600 text-white shadow-sm'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {isHigh ? '🔥 TOP PRIORITY' : 'OPEN TRACK'}
                      </span>
                      <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">
                        Benchmark: {c.benchmarkRating} Elo
                      </span>
                    </div>

                    <h4 className="font-bold text-sm text-slate-900 group-hover:text-primary-600 transition leading-snug">
                      {c.title}
                    </h4>

                    <p className="text-xs text-slate-600 mt-1.5 line-clamp-2 leading-relaxed">
                      {c.shortSummary || c.description}
                    </p>
                  </div>

                  <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                    <div className="text-[11px] text-slate-500 font-medium">
                      ⏱ {c.durationMinutes} mins • {c.problemCount || 3} complex problems
                    </div>

                    <Link href={`/contests/${c.slug}`}>
                      <Button
                        size="sm"
                        className={`text-xs font-bold rounded-xl px-4 py-2 flex items-center gap-1.5 ${
                          isHigh
                            ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-sm'
                            : 'bg-slate-900 hover:bg-slate-800 text-white'
                        }`}
                      >
                        <span>{language === 'en' ? 'Compete' : 'অংশগ্রহণ'}</span>
                        <ArrowRight className="h-3 w-3" />
                      </Button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

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
        <Link href="/student/goals">
          <Button size="sm" className="bg-white text-indigo-700 hover:bg-indigo-50 font-bold text-xs px-5 py-2.5 rounded-xl shadow-sm shrink-0">
            {language === 'en' ? 'View Daily Routine →' : 'দৈনিক রুটিন দেখুন →'}
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
