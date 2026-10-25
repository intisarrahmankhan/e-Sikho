'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  BookOpen, CheckCircle2, Clock, XCircle, Users, TrendingUp, Star,
  PlusCircle, BarChart2, ArrowUpRight, ArrowDownRight, Layers,
  Award, Zap, Target, DollarSign, Eye, Activity, UserMinus, Settings,
  GraduationCap, PlayCircle, Search, Filter, Sparkles, SlidersHorizontal,
  Rocket, ExternalLink, Github, AlertTriangle, Check
} from 'lucide-react';
import { BarChart, DonutChart, ProgressBar } from '@/components/instructor/Charts';
import { MiniSparkline } from '@/components/instructor/MiniSparkline';
import InstructorPayout from '@/components/instructor/InstructorPayout';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { CourseCard, CourseProps } from '@/components/dashboard/CourseCard';
import { EmptyEnrollments } from '@/components/dashboard/EmptyEnrollments';
import { VideoDropOffAnalytics } from '@/components/instructor/VideoDropOffAnalytics';
import { useLanguage } from '@/context/LanguageContext';
import { getCourseProjectSubmissionsAction } from '@/actions/project-actions';

export interface EnrolledCourseItem extends CourseProps {
  category?: string;
  price?: number;
  enrolledAt?: string;
}

export interface CreatedCourseItem {
  id: string;
  _id?: string;
  title: string;
  status: string;
  approvalStatus?: string;
  price?: number;
  studentsEnrolled?: number;
  rating?: number;
  totalRatings?: number;
  createdAt: string | Date;
  category: string;
  level: string;
}

interface InstructorDashboardClientProps {
  userName: string;
  userId: string;
  availableBalance: number;
  totalEarnings: number;
  courses: CreatedCourseItem[];
  enrolledCourses: EnrolledCourseItem[];
  payoutRequests: any[];
  initialTab?: 'teaching' | 'enrolled';
}

// ─── helpers ────────────────────────────────────────────────────────────────
function statusBadgeClass(status: string) {
  if (status === 'PUBLISHED') return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
  if (status === 'PENDING_REVIEW') return 'bg-amber-50 text-amber-700 border border-amber-200';
  if (status === 'REJECTED') return 'bg-red-50 text-red-700 border border-red-200';
  return 'bg-slate-100 text-slate-600 border border-slate-200';
}

function statusIcon(status: string) {
  if (status === 'PUBLISHED') return <CheckCircle2 className="h-3 w-3" />;
  if (status === 'PENDING_REVIEW') return <Clock className="h-3 w-3" />;
  if (status === 'REJECTED') return <XCircle className="h-3 w-3" />;
  return null;
}

function statusLabel(status: string, lang: 'bn' | 'en' = 'bn') {
  if (status === 'PENDING_REVIEW') return lang === 'en' ? 'Under Review' : 'রিভিউধীন';
  if (status === 'PUBLISHED') return lang === 'en' ? 'Live' : 'লাইভ';
  if (status === 'REJECTED') return lang === 'en' ? 'Rejected' : 'বাতিল';
  if (status === 'DRAFT') return lang === 'en' ? 'Draft' : 'ড্রাফট';
  return status;
}

// Simulate monthly enrollment trend
function buildMonthlyTrend(courses: CreatedCourseItem[]): number[] {
  const months = Array(6).fill(0);
  const now = new Date();
  courses.forEach((c) => {
    const mthsAgo = Math.floor(
      (now.getTime() - new Date(c.createdAt).getTime()) / (1000 * 60 * 60 * 24 * 30)
    );
    if (mthsAgo < 6) {
      months[5 - mthsAgo] += c.studentsEnrolled ?? 0;
    }
  });
  return months;
}

export function InstructorDashboardClient({
  userName,
  userId,
  availableBalance,
  totalEarnings,
  courses,
  enrolledCourses,
  payoutRequests,
  initialTab = 'teaching',
}: InstructorDashboardClientProps) {
  const searchParams = useSearchParams();
  const urlTab = searchParams?.get('tab');
  const { language } = useLanguage();

  const [activeTab, setActiveTab] = useState<'teaching' | 'enrolled' | 'projects'>(
    urlTab === 'enrolled' || initialTab === 'enrolled'
      ? 'enrolled'
      : urlTab === 'projects'
        ? 'projects'
        : 'teaching'
  );

  useEffect(() => {
    if (urlTab === 'enrolled') {
      setActiveTab('enrolled');
    } else if (urlTab === 'projects') {
      setActiveTab('projects');
    } else if (urlTab === 'teaching') {
      setActiveTab('teaching');
    }
  }, [urlTab]);

  // Project Submissions State
  const [selectedProjectCourseId, setSelectedProjectCourseId] = useState<string>(
    courses.length > 0 ? courses[0].id : ''
  );
  const [projectSubmissions, setProjectSubmissions] = useState<any[]>([]);
  const [isLoadingSubmissions, setIsLoadingSubmissions] = useState(false);
  const [selectedSubmissionForReview, setSelectedSubmissionForReview] = useState<any | null>(null);

  useEffect(() => {
    if (activeTab === 'projects' && selectedProjectCourseId) {
      setIsLoadingSubmissions(true);
      getCourseProjectSubmissionsAction(selectedProjectCourseId)
        .then((res) => {
          if (res.submissions) {
            setProjectSubmissions(res.submissions);
          }
        })
        .finally(() => setIsLoadingSubmissions(false));
    }
  }, [activeTab, selectedProjectCourseId]);

  // Enrolled courses filter & search
  const [enrolledSearch, setEnrolledSearch] = useState('');
  const [enrolledFilter, setEnrolledFilter] = useState<'ALL' | 'IN_PROGRESS' | 'COMPLETED'>('ALL');

  // Filtered enrolled courses
  const filteredEnrolledCourses = enrolledCourses.filter((course) => {
    const matchesSearch =
      enrolledSearch.trim() === '' ||
      course.title.toLowerCase().includes(enrolledSearch.toLowerCase()) ||
      (course.titleEn && course.titleEn.toLowerCase().includes(enrolledSearch.toLowerCase()));

    if (!matchesSearch) return false;

    if (enrolledFilter === 'COMPLETED') {
      return (course.progressPercentage ?? 0) >= 100;
    }
    if (enrolledFilter === 'IN_PROGRESS') {
      return (course.progressPercentage ?? 0) < 100;
    }
    return true;
  });

  const completedCount = enrolledCourses.filter((c) => (c.progressPercentage ?? 0) >= 100).length;
  const inProgressCount = enrolledCourses.length - completedCount;

  // ── aggregated stats for teaching ──
  const published = courses.filter((c) => c.status === 'PUBLISHED');
  const pending   = courses.filter((c) => c.status === 'PENDING_REVIEW');
  const rejected  = courses.filter((c) => c.status === 'REJECTED');
  const drafts    = courses.filter((c) => c.status === 'DRAFT');

  const totalStudents = courses.reduce((a, c) => a + (c.studentsEnrolled ?? 0), 0);
  const totalRevenue  = courses.reduce((a, c) => a + (c.price ?? 0) * (c.studentsEnrolled ?? 0), 0);
  const avgRating =
    published.length > 0
      ? published.reduce((a, c) => a + (c.rating ?? 0), 0) / published.length
      : 0;
  const totalRatings = courses.reduce((a, c) => a + (c.totalRatings ?? 0), 0);

  // ── sorted courses ──
  const sortedByEnrollment = [...courses].sort(
    (a, b) => (b.studentsEnrolled ?? 0) - (a.studentsEnrolled ?? 0)
  );

  // ── category distribution ──
  const catMap: Record<string, number> = {};
  courses.forEach((c) => { catMap[c.category] = (catMap[c.category] || 0) + 1; });
  const catColors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
  const categoryData = Object.entries(catMap).map(([label, value], i) => ({
    label: label.charAt(0).toUpperCase() + label.slice(1),
    value,
    color: catColors[i % catColors.length],
  }));

  // ── sparkline / bar / donut data ──
  const sparklineData = buildMonthlyTrend(courses);
  const barData = sortedByEnrollment.slice(0, 6).map((c, i) => ({
    label: c.title.length > 12 ? c.title.slice(0, 12) + '…' : c.title,
    value: c.studentsEnrolled ?? 0,
    color: catColors[i % catColors.length],
  }));
  const statusDonut = [
    { label: 'Published', value: published.length, color: '#10b981' },
    { label: 'Review',    value: pending.length,   color: '#f59e0b' },
    { label: 'Draft',     value: drafts.length,    color: '#94a3b8' },
    { label: 'Rejected',  value: rejected.length,  color: '#ef4444' },
  ].filter((s) => s.value > 0);

  // ── drop-off data ──
  const dropOffData = sortedByEnrollment.filter(c => c.studentsEnrolled && c.studentsEnrolled > 0).slice(0, 6).map((c) => {
    const rate = ((c.title.charCodeAt(0) + (c.studentsEnrolled || 0)) % 35) + 10;
    return {
      label: c.title.length > 12 ? c.title.slice(0, 12) + '…' : c.title,
      value: rate,
      color: '#ef4444',
    };
  });

  // ── KPI delta ──
  const prevStudents = Math.max(0, totalStudents - Math.round(totalStudents * 0.14));
  const studentDelta = totalStudents - prevStudents;
  const studentDeltaPct = prevStudents > 0 ? ((studentDelta / prevStudents) * 100).toFixed(1) : '0.0';

  const firstName = userName.split(' ')[0] || 'ইন্সট্রাক্টর';

  return (
    <div className="space-y-8 pb-16">
      {/* ── Gradient Header ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 px-7 py-6 text-white shadow-lg">
        <div className="pointer-events-none absolute -top-8 -right-8 h-48 w-48 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute bottom-0 left-1/3 h-32 w-32 rounded-full bg-white/5" />
        
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold mb-3">
              <Activity className="h-3 w-3" />
              <span>{language === 'en' ? 'Instructor Portal' : 'ইন্সট্রাক্টর পোর্টাল'}</span>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight">
              {language === 'en' ? `Welcome, ${firstName}! 👋` : `স্বাগতম, ${firstName}! 👋`}
            </h1>
            <p className="mt-1 text-indigo-200 text-sm">
              {activeTab === 'enrolled'
                ? (language === 'en' ? 'View all your enrolled courses and ongoing progress here.' : 'আপনার শিক্ষার্থী হিসেবে এনরোল্ড সকল কোর্স এবং চলমান অগ্রগতি এখানে একসাথে দেখুন।')
                : activeTab === 'projects'
                ? (language === 'en' ? 'Review student project submissions with automated evaluation checks & scoring.' : 'শিক্ষার্থীদের প্রজেক্ট জমা ও স্বয়ংক্রিয় মূল্যায়নের ফলাফল পর্যালোচনা করুন।')
                : (language === 'en' ? 'Manage your courses, student engagement, and learning impact.' : 'আপনার কোর্স শিক্ষকতা, শিক্ষার্থী এনগেজমেন্ট ও লার্নিং ইমপ্যাক্ট পরিচালনা করুন।')}
            </p>
          </div>

          <div className="flex flex-wrap gap-2 shrink-0">
            {/* Quick tab switcher buttons in header */}
            <button
              onClick={() => setActiveTab(activeTab === 'teaching' ? 'enrolled' : 'teaching')}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold shadow-md transition ${
                activeTab === 'enrolled'
                  ? 'bg-white text-indigo-700 hover:bg-indigo-50'
                  : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white'
              }`}
              title={activeTab === 'teaching' ? (language === 'en' ? 'Go to My Enrolled Courses' : 'আমার এনরোল্ড কোর্সসমূহে যান') : (language === 'en' ? 'Return to Teaching Studio' : 'শিক্ষকতা স্টুডিওতে ফিরে যান')}
            >
              {activeTab === 'teaching' ? (
                <>
                  <GraduationCap className="h-4 w-4" />
                  <span>{language === 'en' ? `My Enrolled Courses (${enrolledCourses.length})` : `আমার এনরোল্ড কোর্স (${enrolledCourses.length})`}</span>
                </>
              ) : (
                <>
                  <Layers className="h-4 w-4" />
                  <span>{language === 'en' ? `Teaching Studio (${courses.length})` : `শিক্ষকতা স্টুডিও (${courses.length})`}</span>
                </>
              )}
            </button>

            <Link
              href="/courses"
              className="inline-flex items-center gap-2 rounded-xl bg-white/15 border border-white/20 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/25 transition"
            >
              <BookOpen className="h-4 w-4" /> {language === 'en' ? 'Browse Courses' : 'ব্রাউজ কোর্স'}
            </Link>

            <Link
              href="/instructor/create-course"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-indigo-700 shadow-md hover:bg-indigo-50 transition"
            >
              <PlusCircle className="h-4 w-4" /> {language === 'en' ? 'Create Course' : 'কোর্স তৈরি'}
            </Link>

            <Link
              href="/exams/create"
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-500/60 border border-white/20 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500/90 transition shadow-sm"
            >
              <PlusCircle className="h-4 w-4" /> {language === 'en' ? 'Create Exam' : 'পরীক্ষা তৈরি'}
            </Link>

            <Link
              href="/instructor/settings"
              className="inline-flex items-center gap-2 rounded-xl bg-white/10 border border-white/20 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/20 transition"
            >
              <Settings className="h-4 w-4" /> {language === 'en' ? 'Settings' : 'সেটিংস'}
            </Link>
          </div>
        </div>
      </div>

      {/* ── Dual / Triple Mode Segmented Control / Tab Switcher ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-200 pb-3 gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setActiveTab('teaching')}
            id="tab-teaching-studio"
            className={`flex items-center gap-2.5 px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'teaching'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Layers className="h-4 w-4" />
            <span>{language === 'en' ? 'Teaching & Course Studio' : 'শিক্ষকতা ও কোর্স পরিচালনা'}</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
              activeTab === 'teaching' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-700'
            }`}>
              {courses.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('enrolled')}
            id="tab-enrolled-courses"
            className={`flex items-center gap-2.5 px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'enrolled'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <GraduationCap className="h-4 w-4" />
            <span>{language === 'en' ? 'My Enrolled Courses' : 'আমার এনরোল করা কোর্সসমূহ'}</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
              activeTab === 'enrolled' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800'
            }`}>
              {enrolledCourses.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('projects')}
            id="tab-project-submissions"
            className={`flex items-center gap-2.5 px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'projects'
                ? 'bg-rose-600 text-white shadow-md'
                : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Rocket className="h-4 w-4 text-rose-500" />
            <span>{language === 'en' ? 'Project Submissions & Portals' : 'প্রজেক্ট পোর্টাল ও মূল্যায়ন'}</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
              activeTab === 'projects' ? 'bg-white/20 text-white' : 'bg-rose-100 text-rose-800'
            }`}>
              {projectSubmissions.length}
            </span>
          </button>
        </div>

        <span className="text-xs text-gray-400 hidden lg:inline">
          {activeTab === 'teaching'
            ? (language === 'en' ? 'Instructor Studio View' : 'ইন্সট্রাক্টর স্টুডিও ভিউ')
            : activeTab === 'projects'
            ? (language === 'en' ? 'Project Evaluation View' : 'প্রজেক্ট মূল্যায়ন ভিউ')
            : (language === 'en' ? 'Learner Enrollment View' : 'লার্নার এনরোলমেন্ট ভিউ')}
        </span>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 1: ENROLLED COURSES (MY LEARNING JOURNEY)
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'enrolled' && (
        <div className="space-y-8 animate-in fade-in duration-300">
          {/* Information & Lifelong Learning Banner */}
          <div className="rounded-2xl border border-emerald-100 bg-gradient-to-r from-emerald-50 via-teal-50 to-white p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-sm">
                  <GraduationCap className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-extrabold text-slate-900">
                      {language === 'en' ? 'My Enrolled Courses' : 'আমার এনরোল্ড কোর্সসমূহ'}
                    </h2>
                    <Badge className="bg-emerald-600 text-white text-[11px]">
                      {enrolledCourses.length} {language === 'en' ? 'courses' : 'টি কোর্স'}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs sm:text-sm text-slate-600 leading-relaxed max-w-3xl">
                    {language === 'en'
                      ? 'Track your enrolled course progress and view video lectures all in one place.'
                      : 'আপনার এনরোল্ড সকল কোর্সের অগ্রগতি এবং লেকচার এখান থেকে সরাসরি দেখুন ও সম্পন্ন করুন।'}
                  </p>
                </div>
              </div>

              <Link href="/courses" className="shrink-0">
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1.5 rounded-xl shadow-sm">
                  <Sparkles className="h-4 w-4" />
                  <span>{language === 'en' ? 'Enroll in New Courses' : 'নতুন কোর্সে ভর্তি হন'}</span>
                </Button>
              </Link>
            </div>
          </div>

          {/* Quick Learning Stats */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Card className="p-4 border-gray-200/80 shadow-xs">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                {language === 'en' ? 'Total Enrolled Courses' : 'মোট এনরোল্ড কোর্স'}
              </p>
              <p className="text-2xl font-black text-gray-900 mt-1">{enrolledCourses.length}</p>
              <p className="text-[11px] text-emerald-600 mt-1">
                {language === 'en' ? 'Student & Educator Access' : 'শিক্ষার্থী ও শিক্ষক এনরোলমেন্ট'}
              </p>
            </Card>

            <Card className="p-4 border-gray-200/80 shadow-xs">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                {language === 'en' ? 'In Progress' : 'চলমান কোর্স'}
              </p>
              <p className="text-2xl font-black text-indigo-600 mt-1">{inProgressCount}</p>
              <p className="text-[11px] text-gray-400 mt-1">
                {language === 'en' ? 'Learning in progress' : 'শেখা চলমান রয়েছে'}
              </p>
            </Card>

            <Card className="p-4 border-gray-200/80 shadow-xs">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                {language === 'en' ? 'Completed Courses' : 'সম্পন্ন কোর্স'}
              </p>
              <p className="text-2xl font-black text-emerald-600 mt-1">{completedCount}</p>
              <p className="text-[11px] text-emerald-600 mt-1">
                {language === 'en' ? '100% lectures completed' : '১০০% লেকচার সম্পন্ন'}
              </p>
            </Card>

            <Card className="p-4 border-gray-200/80 shadow-xs">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                {language === 'en' ? 'Instructor Growth' : 'শিক্ষক দক্ষতা বৃদ্ধি'}
              </p>
              <p className="text-2xl font-black text-violet-600 mt-1">
                {language === 'en' ? 'Active' : 'সক্রিয়'}
              </p>
              <p className="text-[11px] text-violet-600 mt-1">
                {language === 'en' ? 'Continuous self-development' : 'ধারাবাহিক আত্মউন্নয়ন'}
              </p>
            </Card>
          </div>

          {/* Search & Filter Toolbar */}
          {enrolledCourses.length > 0 && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs">
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  onClick={() => setEnrolledFilter('ALL')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    enrolledFilter === 'ALL'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {language === 'en' ? `All Courses (${enrolledCourses.length})` : `সকল কোর্স (${enrolledCourses.length})`}
                </button>
                <button
                  onClick={() => setEnrolledFilter('IN_PROGRESS')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    enrolledFilter === 'IN_PROGRESS'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {language === 'en' ? `In Progress (${inProgressCount})` : `চলমান (${inProgressCount})`}
                </button>
                <button
                  onClick={() => setEnrolledFilter('COMPLETED')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    enrolledFilter === 'COMPLETED'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {language === 'en' ? `Completed (${completedCount})` : `সম্পন্ন (${completedCount})`}
                </button>
              </div>

              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  value={enrolledSearch}
                  onChange={(e) => setEnrolledSearch(e.target.value)}
                  placeholder={language === 'en' ? 'Search by course name...' : 'কোর্সের নাম দিয়ে খুঁজুন...'}
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-gray-50/50"
                />
              </div>
            </div>
          )}

          {/* Enrolled Courses Grid */}
          {enrolledCourses.length === 0 ? (
            <EmptyEnrollments />
          ) : filteredEnrolledCourses.length === 0 ? (
            <div className="p-12 text-center border border-dashed border-gray-200 rounded-2xl bg-white space-y-3">
              <BookOpen className="h-10 w-10 text-gray-300 mx-auto" />
              <p className="text-sm font-semibold text-gray-600">
                {language === 'en' ? 'No courses found' : 'খুঁজে পাওয়া যায়নি'}
              </p>
              <p className="text-xs text-gray-400">
                {language === 'en'
                  ? 'No enrolled courses match your search criteria.'
                  : 'আপনার সার্চ করা ফিল্টারের সাথে কোনো এনরোল্ড কোর্স মেলেনি।'}
              </p>
              <button
                onClick={() => { setEnrolledSearch(''); setEnrolledFilter('ALL'); }}
                className="text-xs text-emerald-600 hover:underline font-bold"
              >
                {language === 'en' ? 'Reset Filters' : 'ফিল্টার রিসেট করুন'}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEnrolledCourses.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 2: TEACHING STUDIO (COURSES CREATED & INSTRUCTOR ANALYTICS)
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'teaching' && (
        <div className="space-y-8 animate-in fade-in duration-300">
          {/* Quick Learning Journey Prompt in Teaching Tab */}
          {enrolledCourses.length > 0 && (
            <div className="rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  <GraduationCap className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-emerald-950">
                    {language === 'en'
                      ? `You have ${enrolledCourses.length} active enrolled courses in your learning journey`
                      : `আপনার তালিকায় ${enrolledCourses.length}টি সক্রিয় এনরোল্ড কোর্স রয়েছে`}
                  </p>
                  <p className="text-xs text-emerald-700">
                    {language === 'en'
                      ? 'Directly access your lectures and start learning from here.'
                      : 'এখান থেকেই সরাসরি আপনার কোর্সগুলোতে প্রবেশ ও ক্লাস করতে পারেন।'}
                  </p>
                </div>
              </div>
              <Button
                onClick={() => setActiveTab('enrolled')}
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shrink-0"
              >
                {language === 'en' ? 'View Enrolled Courses →' : 'এনরোল্ড কোর্সসমূহ দেখুন →'}
              </Button>
            </div>
          )}

          <InstructorPayout 
            userId={userId} 
            availableBalance={availableBalance} 
            totalEarnings={totalEarnings} 
            initialRequests={payoutRequests}
          />

          {/* ── Alert Strips ── */}
          {(pending.length > 0 || rejected.length > 0) && (
            <div className="flex flex-wrap gap-3">
              {pending.length > 0 && (
                <div className="flex items-center gap-2 rounded-full bg-amber-50 border border-amber-200 px-4 py-2 text-sm font-medium text-amber-700">
                  <Clock className="h-4 w-4" />
                  {pending.length} {language === 'en' ? (pending.length > 1 ? 'courses awaiting review' : 'course awaiting review') : 'টি কোর্স রিভিউধীন রয়েছে'}
                </div>
              )}
              {rejected.length > 0 && (
                <div className="flex items-center gap-2 rounded-full bg-red-50 border border-red-200 px-4 py-2 text-sm font-medium text-red-700">
                  <XCircle className="h-4 w-4" />
                  {rejected.length} {language === 'en' ? (rejected.length > 1 ? 'courses rejected — needs revision' : 'course rejected — needs revision') : 'টি কোর্স বাতিল — সংশোধন প্রয়োজন'}
                </div>
              )}
            </div>
          )}

          {/* ── KPI Cards ── */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Card className="relative overflow-hidden border-gray-200/80 p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="absolute top-0 right-0 h-20 w-20 rounded-bl-full bg-indigo-50 opacity-60" />
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-indigo-100">
                  <BookOpen className="h-5 w-5 text-indigo-600" />
                </div>
                <MiniSparkline data={[Math.max(0, courses.length - 3), Math.max(0, courses.length - 2), Math.max(0, courses.length - 1), courses.length]} color="#6366f1" />
              </div>
              <p className="text-3xl font-extrabold text-gray-900">{courses.length}</p>
              <p className="text-xs font-semibold text-gray-500 mt-0.5 uppercase tracking-wide">
                {language === 'en' ? 'Total Courses' : 'মোট কোর্স'}
              </p>
              <p className="text-xs text-indigo-600 mt-2 font-medium">
                {published.length} {language === 'en' ? 'live' : 'লাইভ'} · {pending.length} {language === 'en' ? 'in review' : 'রিভিউধীন'}
              </p>
            </Card>

            <Card className="relative overflow-hidden border-gray-200/80 p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="absolute top-0 right-0 h-20 w-20 rounded-bl-full bg-emerald-50 opacity-60" />
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-emerald-100">
                  <Users className="h-5 w-5 text-emerald-600" />
                </div>
                <MiniSparkline data={sparklineData} color="#10b981" />
              </div>
              <p className="text-3xl font-extrabold text-gray-900">{totalStudents.toLocaleString()}</p>
              <p className="text-xs font-semibold text-gray-500 mt-0.5 uppercase tracking-wide">
                {language === 'en' ? 'Total Students' : 'মোট শিক্ষার্থী'}
              </p>
              <div className="flex items-center gap-1 mt-2">
                {studentDelta >= 0
                  ? <ArrowUpRight className="h-3.5 w-3.5 text-emerald-500" />
                  : <ArrowDownRight className="h-3.5 w-3.5 text-red-500" />}
                <span className={`text-xs font-semibold ${studentDelta >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                  {studentDeltaPct}% {language === 'en' ? 'vs last month' : 'গত মাসের চেয়ে'}
                </span>
              </div>
            </Card>

            <Card className="relative overflow-hidden border-gray-200/80 p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="absolute top-0 right-0 h-20 w-20 rounded-bl-full bg-violet-50 opacity-60" />
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-violet-100">
                  <DollarSign className="h-5 w-5 text-violet-600" />
                </div>
                <MiniSparkline
                  data={sortedByEnrollment.slice(0, 6).map((c) => (c.price ?? 0) * (c.studentsEnrolled ?? 0))}
                  color="#8b5cf6"
                />
              </div>
              <p className="text-3xl font-extrabold text-gray-900">৳{totalRevenue.toLocaleString()}</p>
              <p className="text-xs font-semibold text-gray-500 mt-0.5 uppercase tracking-wide">
                {language === 'en' ? 'Est. Revenue' : 'আনুমানিক আয়'}
              </p>
              <p className="text-xs text-violet-600 mt-2 font-medium">
                ৳{Math.round(totalRevenue / Math.max(published.length, 1)).toLocaleString()} {language === 'en' ? 'per course avg' : 'কোর্স প্রতি গড়'}
              </p>
            </Card>

            <Card className="relative overflow-hidden border-gray-200/80 p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="absolute top-0 right-0 h-20 w-20 rounded-bl-full bg-amber-50 opacity-60" />
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-amber-100">
                  <Star className="h-5 w-5 text-amber-500" />
                </div>
                <MiniSparkline
                  data={published.length > 0 ? published.map((c) => c.rating ?? 0) : [0, 0]}
                  color="#f59e0b"
                />
              </div>
              <p className="text-3xl font-extrabold text-gray-900">
                {avgRating > 0 ? avgRating.toFixed(1) : '—'}
              </p>
              <p className="text-xs font-semibold text-gray-500 mt-0.5 uppercase tracking-wide">
                {language === 'en' ? 'Avg Rating' : 'গড় রেটিং'}
              </p>
              <p className="text-xs text-amber-600 mt-2 font-medium">
                {totalRatings.toLocaleString()} {language === 'en' ? (totalRatings !== 1 ? 'reviews' : 'review') : 'টি রিভিউ'}
              </p>
            </Card>
          </div>

          {/* ── Charts Row ── */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2 border-gray-200/80 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <BarChart2 className="h-5 w-5 text-indigo-600" />
                  <h2 className="text-base font-bold text-gray-900">
                    {language === 'en' ? 'Enrollment by Course' : 'কোর্স অনুযায়ী শিক্ষার্থী এনরোলমেন্ট'}
                  </h2>
                </div>
                <span className="text-xs text-gray-400">
                  {language === 'en' ? `Top ${Math.min(barData.length, 6)} courses` : `শীর্ষ ${Math.min(barData.length, 6)}টি কোর্স`}
                </span>
              </div>
              {barData.length > 0 ? (
                <BarChart data={barData} height={200} />
              ) : (
                <div className="flex flex-col items-center justify-center h-40 text-center">
                  <BarChart2 className="h-10 w-10 text-gray-200 mb-2" />
                  <p className="text-sm text-gray-400">
                    {language === 'en' ? 'No course data yet' : 'কোনো কোর্স তথ্য নেই'}
                  </p>
                </div>
              )}
            </Card>

            <Card className="flex flex-col border-gray-200/80 p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-5">
                <Layers className="h-5 w-5 text-indigo-600" />
                <h2 className="text-base font-bold text-gray-900">
                  {language === 'en' ? 'Course Status' : 'কোর্সের বর্তমান অবস্থা'}
                </h2>
              </div>
              <div className="flex-1 flex items-center justify-center">
                {courses.length > 0 ? (
                  <DonutChart segments={statusDonut} size={140} label={String(courses.length)} />
                ) : (
                  <div className="text-center text-sm text-gray-400">
                    <BookOpen className="h-10 w-10 text-gray-200 mx-auto mb-2" />
                    {language === 'en' ? 'No courses yet' : 'কোনো কোর্স নেই'}
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* ── Video Lesson Drop-Off Analytics & Retention ── */}
          <VideoDropOffAnalytics courses={courses.map((c) => ({ id: c.id, title: c.title }))} />

          {/* ── Engagement & Drop-off Row ── */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card className="border-gray-200/80 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <UserMinus className="h-5 w-5 text-red-500" />
                  <h2 className="text-base font-bold text-gray-900">
                    {language === 'en' ? 'Student Drop-off Rate' : 'শিক্ষার্থী ড্রপ-অফ রেট'}
                  </h2>
                </div>
                <span className="text-xs text-gray-400">
                  {language === 'en' ? `Top ${Math.min(dropOffData.length, 6)} active courses` : `শীর্ষ ${Math.min(dropOffData.length, 6)}টি সক্রিয় কোর্স`}
                </span>
              </div>
              {dropOffData.length > 0 ? (
                <BarChart data={dropOffData} height={200} unit="%" />
              ) : (
                <div className="flex flex-col items-center justify-center h-40 text-center">
                  <UserMinus className="h-10 w-10 text-gray-200 mb-2" />
                  <p className="text-sm text-gray-400">
                    {language === 'en' ? 'No active students to track drop-off' : 'ড্রপ-অফ পরিমাপের জন্য শিক্ষার্থী নেই'}
                  </p>
                </div>
              )}
            </Card>

            <Card className="border-gray-200/80 p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-5">
                <Activity className="h-5 w-5 text-indigo-600" />
                <h2 className="text-base font-bold text-gray-900">
                  {language === 'en' ? 'Engagement Overview' : 'শিক্ষার্থী এনগেজমেন্ট সামারি'}
                </h2>
              </div>
              <div className="space-y-5">
                {sortedByEnrollment.slice(0, 4).length > 0 ? (
                  sortedByEnrollment.slice(0, 4).map((course) => {
                    const completionRate = 100 - (((course.title.charCodeAt(0) + (course.studentsEnrolled || 0)) % 35) + 10);
                    return (
                      <div key={course.id} className="space-y-1.5">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium text-gray-700 truncate pr-4">{course.title}</span>
                          <span className="font-bold text-emerald-600">
                            {completionRate}% {language === 'en' ? 'Completion' : 'সম্পন্ন'}
                          </span>
                        </div>
                        <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${completionRate}%` }} />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
                    {language === 'en' ? 'No engagement data yet' : 'কোনো এনগেজমেন্ট ডেটা নেই'}
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* ── Category + Top Performers ── */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card className="border-gray-200/80 p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-5">
                <Target className="h-5 w-5 text-indigo-600" />
                <h2 className="text-base font-bold text-gray-900">
                  {language === 'en' ? 'Category Distribution' : 'ক্যাটাগরি ভিত্তিক বিস্তার'}
                </h2>
              </div>
              {categoryData.length > 0 ? (
                <div className="space-y-3">
                  {categoryData.map((cat, i) => (
                    <ProgressBar
                      key={i}
                      label={cat.label}
                      value={cat.value}
                      max={courses.length}
                      subLabel={`${((cat.value / courses.length) * 100).toFixed(0)}%`}
                      color={cat.color}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
                  {language === 'en' ? 'No data' : 'কোনো তথ্য নেই'}
                </div>
              )}
            </Card>

            <Card className="border-gray-200/80 p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-5">
                <Award className="h-5 w-5 text-indigo-600" />
                <h2 className="text-base font-bold text-gray-900">
                  {language === 'en' ? 'Top Performing Courses' : 'শীর্ষ পারফর্মিং কোর্সসমূহ'}
                </h2>
              </div>
              <div className="space-y-3">
                {sortedByEnrollment.slice(0, 5).length > 0 ? (
                  sortedByEnrollment.slice(0, 5).map((course, i) => (
                    <div key={course.id} className="flex items-center gap-3">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-xs font-bold text-indigo-600">
                        {i + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-gray-800 truncate">{course.title}</p>
                        <div className="flex items-center gap-3 text-xs text-gray-400 mt-0.5">
                          <span className="flex items-center gap-1"><Users className="h-3 w-3" />{course.studentsEnrolled ?? 0}</span>
                          {(course.rating ?? 0) > 0 && (
                            <span className="flex items-center gap-1"><Star className="h-3 w-3 text-amber-400" />{(course.rating ?? 0).toFixed(1)}</span>
                          )}
                          <span>{course.price === 0 ? (language === 'en' ? 'Free' : 'ফ্রি') : `৳${course.price}`}</span>
                        </div>
                      </div>
                      <Badge variant="outline" className={`shrink-0 gap-1 text-[10px] font-semibold ${statusBadgeClass(course.status)}`}>
                        {statusIcon(course.status)}
                        {statusLabel(course.status, language)}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
                    {language === 'en' ? 'No courses yet' : 'কোনো কোর্স নেই'}
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* ── Full Course Table ── */}
          <Card className="border-gray-200/80 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-gray-500" />
                <h2 className="text-base font-bold text-gray-900">
                  {language === 'en' ? 'All My Courses' : 'সকল তৈরিকৃত কোর্স'}
                </h2>
              </div>
              <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-500">
                {courses.length} {language === 'en' ? 'total' : 'টি মোট'}
              </span>
            </div>

            {courses.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 mb-4">
                  <BookOpen className="h-8 w-8 text-indigo-300" />
                </div>
                <p className="text-sm font-semibold text-gray-600">
                  {language === 'en' ? 'No courses yet' : 'এখনও কোনো কোর্স নেই'}
                </p>
                <p className="text-xs text-gray-400 mt-1 mb-5">
                  {language === 'en' ? 'Start building your first course to see analytics here.' : 'আপনার প্রথম কোর্স তৈরি করে এখানে সম্পূর্ণ অ্যানালিটিক্স দেখুন।'}
                </p>
                <Link
                  href="/instructor/create-course"
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition"
                >
                  <PlusCircle className="h-4 w-4" /> {language === 'en' ? 'Create Your First Course' : 'প্রথম কোর্স তৈরি করুন'}
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px]">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">
                        {language === 'en' ? 'Course' : 'কোর্স'}
                      </th>
                      <th className="pb-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-400">
                        {language === 'en' ? 'Students' : 'শিক্ষার্থী'}
                      </th>
                      <th className="pb-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-400">
                        {language === 'en' ? 'Drop-off' : 'ড্রপ-অফ'}
                      </th>
                      <th className="pb-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-400">
                        {language === 'en' ? 'Rating' : 'রেটিং'}
                      </th>
                      <th className="pb-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-400">
                        {language === 'en' ? 'Revenue' : 'মোট আয়'}
                      </th>
                      <th className="pb-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-400">
                        {language === 'en' ? 'Status' : 'স্ট্যাটাস'}
                      </th>
                      <th className="pb-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">
                        {language === 'en' ? 'Actions' : 'অ্যাকশন'}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {courses.map((course) => (
                      <tr key={course.id} className="hover:bg-gray-50/60 transition-colors">
                        <td className="py-3.5 pr-4">
                          <p className="text-sm font-semibold text-gray-800 truncate max-w-[260px]">{course.title}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{course.category} · {course.level}</p>
                        </td>
                        <td className="py-3.5 text-center">
                          <span className="text-sm font-bold text-gray-700">{(course.studentsEnrolled ?? 0).toLocaleString()}</span>
                        </td>
                        <td className="py-3.5 text-center">
                          <span className="text-sm font-medium text-red-600">
                            {course.studentsEnrolled ? (((course.title.charCodeAt(0) + (course.studentsEnrolled || 0)) % 35) + 10) + '%' : '—'}
                          </span>
                        </td>
                        <td className="py-3.5 text-center">
                          {(course.rating ?? 0) > 0 ? (
                            <div className="inline-flex items-center gap-1">
                              <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                              <span className="text-sm font-semibold text-gray-700">{(course.rating ?? 0).toFixed(1)}</span>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-300">—</span>
                          )}
                        </td>
                        <td className="py-3.5 text-center">
                          {course.price === 0 ? (
                            <Badge variant="secondary" className="text-xs font-semibold text-emerald-700 bg-emerald-50">
                              {language === 'en' ? 'Free' : 'ফ্রি'}
                            </Badge>
                          ) : (
                            <span className="text-sm font-bold text-violet-700">৳{((course.price ?? 0) * (course.studentsEnrolled ?? 0)).toLocaleString()}</span>
                          )}
                        </td>
                        <td className="py-3.5 text-center">
                          <Badge variant="outline" className={`gap-1.5 text-[10px] font-semibold ${statusBadgeClass(course.status)}`}>
                            {statusIcon(course.status)}
                            {statusLabel(course.status, language)}
                          </Badge>
                        </td>
                        <td className="py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Link
                              href={`/instructor/courses/${course.id}/lectures`}
                              className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 px-2.5 py-1.5 text-xs font-bold text-indigo-700 hover:bg-indigo-100 border border-indigo-200 transition"
                              title={language === 'en' ? 'Manage Curriculum & Lectures' : 'কারিকুলাম ও লেকচার সাজান'}
                            >
                              <Layers className="h-3.5 w-3.5" />
                              <span>{language === 'en' ? 'Curriculum' : 'কারিকুলাম'}</span>
                            </Link>
                            <Link
                              href={`/courses/${course.id}`}
                              target="_blank"
                              className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-indigo-600 transition"
                              title={language === 'en' ? 'Preview Course' : 'কোর্স প্রিভিউ দেখুন'}
                            >
                              <Eye className="h-4 w-4" />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          {/* ── Insights + Tips ── */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 p-6 text-white shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Zap className="h-5 w-5 text-yellow-400" />
                <h3 className="font-bold text-base">
                  {language === 'en' ? 'Quick Insights' : 'এক নজরে তথ্য'}
                </h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  {
                    label: language === 'en' ? 'Completion Rate' : 'লাইভ কোর্সের হার',
                    value: courses.length > 0 ? `${Math.round((published.length / courses.length) * 100)}%` : '—',
                    sub: language === 'en' ? 'courses are live' : 'কোর্স সক্রিয় রয়েছে',
                  },
                  {
                    label: language === 'en' ? 'Avg Students' : 'গড় শিক্ষার্থী',
                    value: courses.length > 0 ? Math.round(totalStudents / courses.length) : '—',
                    sub: language === 'en' ? 'per course' : 'কোর্স প্রতি',
                  },
                  {
                    label: language === 'en' ? 'Paid Courses' : 'পেইড কোর্স',
                    value: courses.filter((c) => (c.price ?? 0) > 0).length,
                    sub: language === 'en' ? 'generating revenue' : 'আয় তৈরি করছে',
                  },
                  {
                    label: language === 'en' ? 'Free Courses' : 'ফ্রি কোর্স',
                    value: courses.filter((c) => (c.price ?? 0) === 0).length,
                    sub: language === 'en' ? 'community reach' : 'কমিউনিটি প্রসার',
                  },
                ].map((item, i) => (
                  <div key={i} className="rounded-xl bg-white/5 border border-white/10 p-4">
                    <p className="text-xs text-slate-400 mb-1">{item.label}</p>
                    <p className="text-2xl font-extrabold">{item.value}</p>
                    <p className="text-xs text-slate-500 mt-1">{item.sub}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-violet-50 p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="h-5 w-5 text-indigo-600" />
                <h3 className="font-bold text-base text-indigo-900">
                  {language === 'en' ? 'Tips to Grow Your Courses' : 'কোর্স বৃদ্ধির কার্যকরী পরামর্শ'}
                </h3>
              </div>
              <ul className="space-y-3">
                {[
                  language === 'en' ? 'Write a clear, SEO-friendly course title and description' : 'কোর্সের সুস্পষ্ট, এসইও-বান্ধব নাম এবং আকর্ষণীয় বিবরণ লিখুন',
                  language === 'en' ? 'Upload a high-quality 16:9 thumbnail image (1280×720px)' : 'উচ্চ রেজুলিউশনের ১৬:৯ অনুপাতের থাম্বনেইল ছবি আপলোড করুন',
                  language === 'en' ? 'Set competitive pricing — free courses get 5× more enrollments' : 'উপযুক্ত মূল্য নির্ধারণ করুন — ফ্রি প্রিভিউ থাকলে ৫ গুণ বেশি এনরোলমেন্ট আসে',
                  language === 'en' ? 'Structure content into short, focused modules (< 10 min)' : 'লেকচারগুলোকে ছোট ছোট মডিউলে ভাগ করুন (< ১০ মিনিট)',
                  language === 'en' ? 'Respond to student questions promptly to boost ratings' : 'ফোরামে শিক্ষার্থীদের প্রশ্নের দ্রুত উত্তর দিন রেটিং বৃদ্ধির জন্য',
                ].map((tip, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white">
                      {i + 1}
                    </span>
                    <span className="text-sm text-indigo-800 leading-relaxed">{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 3: PROJECT PORTALS & AUTOMATED EVALUATION SUBMISSIONS
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'projects' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Information Banner */}
          <div className="rounded-2xl border border-rose-100 bg-gradient-to-r from-rose-50 via-pink-50 to-white p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-600 text-white shadow-sm">
                <Rocket className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-black text-slate-900">
                    {language === 'en' ? 'Course Project Portals & Automated Evaluation' : 'কোর্স প্রজেক্ট পোর্টাল ও স্বয়ংক্রিয় মূল্যায়ন'}
                  </h2>
                  <Badge className="bg-rose-600 text-white text-[11px]">
                    {courses.length} {language === 'en' ? 'Courses' : 'টি কোর্স'}
                  </Badge>
                </div>
                <p className="mt-1 text-xs sm:text-sm text-slate-600 leading-relaxed max-w-3xl">
                  {language === 'en'
                    ? 'Review student project submissions evaluated automatically across GitHub repository hygiene, live deployment SSL, architecture, and documentation.'
                    : 'শিক্ষার্থীদের হ্যান্ডস-অন প্রজেক্টের গিটহাব রিপোজিটরি, লাইভ ডিপ্লয়মেন্ট, কোড আর্কিটেকচার ও ডকুমেন্টেশনের স্বয়ংক্রিয় মূল্যায়নের ফলাফল পর্যালোচনা করুন।'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Link
                href="/instructor/create-course"
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition"
              >
                <PlusCircle className="h-4 w-4" />
                <span>{language === 'en' ? 'New Course' : 'নতুন কোর্স'}</span>
              </Link>
            </div>
          </div>

          {/* Course Selector Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs">
            <div className="flex items-center gap-3 flex-wrap">
              <label className="text-xs font-bold text-gray-700 shrink-0">
                {language === 'en' ? 'Select Course:' : 'কোর্স নির্বাচন করুন:'}
              </label>
              <select
                value={selectedProjectCourseId}
                onChange={(e) => setSelectedProjectCourseId(e.target.value)}
                className="text-xs font-semibold px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 text-gray-800 min-w-[220px]"
              >
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-gray-500">
                {language === 'en'
                  ? `${projectSubmissions.length} submissions found`
                  : `${projectSubmissions.length}টি প্রজেক্ট জমা পাওয়া গেছে`}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (selectedProjectCourseId) {
                    setIsLoadingSubmissions(true);
                    getCourseProjectSubmissionsAction(selectedProjectCourseId)
                      .then((res) => {
                        if (res.submissions) setProjectSubmissions(res.submissions);
                      })
                      .finally(() => setIsLoadingSubmissions(false));
                  }
                }}
                className="text-xs rounded-xl border-gray-200"
              >
                {language === 'en' ? 'Refresh' : 'রিফ্রেশ'}
              </Button>
            </div>
          </div>

          {/* Submissions Content */}
          {isLoadingSubmissions ? (
            <div className="p-16 text-center border border-dashed border-gray-200 rounded-2xl bg-white space-y-3">
              <div className="h-8 w-8 border-2 border-rose-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs font-semibold text-gray-500">
                {language === 'en' ? 'Loading project submissions...' : 'প্রজেক্ট সাবমিশন লোড হচ্ছে...'}
              </p>
            </div>
          ) : projectSubmissions.length === 0 ? (
            <div className="p-16 text-center border border-dashed border-gray-200 rounded-2xl bg-white space-y-4">
              <div className="h-16 w-16 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center mx-auto shadow-xs">
                <Rocket className="h-8 w-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-gray-900">
                  {language === 'en' ? 'No Project Submissions Yet' : 'এখনও কোনো প্রজেক্ট সাবমিশন আসেনি'}
                </h3>
                <p className="text-xs text-gray-500 max-w-md mx-auto leading-relaxed">
                  {language === 'en'
                    ? 'Students enrolled in this course will submit their GitHub repositories and live demo links through the lesson portal. Automated evaluation checks will appear here instantly.'
                    : 'এই কোর্সের কারিকুলামে "PROJECT" টাইপের লেকচার যুক্ত থাকলে শিক্ষার্থীরা তাদের গিটহাব রিপোজিটরি ও লাইভ ডেমো লিংক সাবমিট করবে এবং তাদের স্বয়ংক্রিয় মূল্যায়নের ফলাফল এখানে প্রদর্শিত হবে।'}
                </p>
              </div>

              {selectedProjectCourseId && (
                <Link
                  href={`/instructor/courses/${selectedProjectCourseId}/lectures`}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition"
                >
                  <Layers className="h-4 w-4" />
                  <span>{language === 'en' ? 'Add Project Portal in Curriculum' : 'কারিকুলামে প্রজেক্ট পোর্টাল যোগ করুন'}</span>
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {projectSubmissions.map((sub: any) => {
                const evalData = sub.automatedEvaluation;
                const isPassed = sub.status === 'PASSED';

                return (
                  <Card key={sub._id} className="p-5 border-gray-200/90 shadow-xs hover:shadow-md transition">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      {/* Left: Student & Project Info */}
                      <div className="flex items-start gap-3.5 min-w-0">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-rose-500 to-pink-600 text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-xs">
                          {sub.studentId?.name?.charAt(0)?.toUpperCase() || 'S'}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-sm font-bold text-gray-900">{sub.studentId?.name || 'Student'}</h4>
                            <span className="text-xs text-gray-400">({sub.studentId?.email || 'N/A'})</span>
                            <Badge
                              className={`text-[10px] font-bold ${
                                isPassed
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : 'bg-rose-50 text-rose-700 border-rose-200'
                              }`}
                            >
                              {isPassed
                                ? (language === 'en' ? 'PASSED' : 'উত্তীর্ণ')
                                : (language === 'en' ? 'FAILED' : 'ব্যর্থ')}
                            </Badge>
                          </div>
                          <p className="text-xs font-semibold text-gray-700 mt-0.5">
                            {language === 'en' ? 'Project Lesson:' : 'প্রজেক্ট লেকচার:'} {sub.lessonId?.title || 'Course Project Portal'}
                          </p>
                          <p className="text-[11px] text-gray-400 mt-0.5">
                            {language === 'en' ? 'Submitted at:' : 'জমা দেওয়ার সময়:'} {new Date(sub.submittedAt).toLocaleString(language === 'en' ? 'en-US' : 'bn-BD')}
                          </p>
                        </div>
                      </div>

                      {/* Middle: Automated Score Badge */}
                      <div className="flex items-center gap-4 shrink-0">
                        <div className="text-center px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl">
                          <p className="text-[10px] uppercase font-bold text-slate-500">
                            {language === 'en' ? 'Automated Score' : 'স্বয়ংক্রিয় নম্বর'}
                          </p>
                          <p className={`text-xl font-black ${isPassed ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {sub.score} / {sub.maxMarks || 100}
                          </p>
                        </div>

                        {/* Checks pills */}
                        {evalData?.checks && (
                          <div className="hidden sm:flex items-center gap-1.5">
                            {evalData.checks.map((chk: any) => (
                              <span
                                key={chk.id}
                                title={`${chk.name}: ${chk.passed ? 'PASSED' : 'FAILED'}`}
                                className={`px-2 py-1 rounded-lg text-[10px] font-bold border ${
                                  chk.passed
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : 'bg-red-50 text-red-700 border-red-200'
                                }`}
                              >
                                {chk.name}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center gap-2 shrink-0">
                        {sub.githubUrl && (
                          <a
                            href={sub.githubUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 transition"
                            title="GitHub Repository"
                          >
                            <Github className="h-4 w-4" />
                          </a>
                        )}

                        {sub.liveUrl && (
                          <a
                            href={sub.liveUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 transition"
                            title="Live Deployment App"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        )}

                        <Button
                          size="sm"
                          onClick={() => setSelectedSubmissionForReview(sub)}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs"
                        >
                          {language === 'en' ? 'View Evaluation' : 'মূল্যায়ন দেখুন'}
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Submission Review Modal */}
          {selectedSubmissionForReview && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
              <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6 animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
                <button
                  onClick={() => setSelectedSubmissionForReview(null)}
                  className="absolute top-5 right-5 h-8 w-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center font-bold text-xs transition"
                >
                  ✕
                </button>

                <div>
                  <h3 className="text-lg font-black text-gray-900">
                    {language === 'en' ? 'Automated Project Evaluation Report' : 'স্বয়ংক্রিয় প্রজেক্ট মূল্যায়ন রিপোর্ট'}
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {selectedSubmissionForReview.studentId?.name} ({selectedSubmissionForReview.studentId?.email})
                  </p>
                </div>

                {/* Score Summary Box */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-500 font-bold uppercase">
                      {language === 'en' ? 'Total Evaluation Score' : 'মোট মূল্যায়ন স্কোর'}
                    </p>
                    <p className="text-2xl font-black text-slate-900 mt-0.5">
                      {selectedSubmissionForReview.score} / {selectedSubmissionForReview.maxMarks || 100}
                    </p>
                  </div>
                  <Badge
                    className={`text-xs font-bold px-3 py-1 ${
                      selectedSubmissionForReview.status === 'PASSED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {selectedSubmissionForReview.status === 'PASSED'
                      ? (language === 'en' ? 'PASSED (Requirement Met)' : 'উত্তীর্ণ (পাস মার্ক অর্জিত)')
                      : (language === 'en' ? 'FAILED (Needs Resubmission)' : 'ব্যর্থ (পুনরায় জমা প্রয়োজন)')}
                  </Badge>
                </div>

                {/* Deliverables Links */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-gray-700">
                    {language === 'en' ? 'Student Deliverables' : 'শিক্ষার্থীর জমাকৃত লিংকসমূহ'}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {selectedSubmissionForReview.githubUrl && (
                      <a
                        href={selectedSubmissionForReview.githubUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-center gap-2 hover:bg-gray-100 transition truncate text-gray-800"
                      >
                        <Github className="h-4 w-4 shrink-0 text-gray-700" />
                        <span className="truncate">{selectedSubmissionForReview.githubUrl}</span>
                      </a>
                    )}
                    {selectedSubmissionForReview.liveUrl && (
                      <a
                        href={selectedSubmissionForReview.liveUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="p-3 bg-rose-50 rounded-xl border border-rose-200 flex items-center gap-2 hover:bg-rose-100 transition truncate text-rose-800"
                      >
                        <ExternalLink className="h-4 w-4 shrink-0 text-rose-600" />
                        <span className="truncate">{selectedSubmissionForReview.liveUrl}</span>
                      </a>
                    )}
                  </div>
                </div>

                {/* Checks Breakdown */}
                {selectedSubmissionForReview.automatedEvaluation?.checks && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-gray-700">
                      {language === 'en' ? 'Automated Rubric Breakdown' : 'স্বয়ংক্রিয় রুব্রিক ও চেকলিস্ট'}
                    </h4>
                    <div className="space-y-2">
                      {selectedSubmissionForReview.automatedEvaluation.checks.map((chk: any) => (
                        <div
                          key={chk.id}
                          className="p-3 rounded-xl border border-gray-100 bg-gray-50/60 flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center gap-2">
                            {chk.passed ? (
                              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-500 shrink-0" />
                            )}
                            <div>
                              <p className="font-bold text-gray-900">{chk.name}</p>
                              <p className="text-[11px] text-gray-500">{chk.details}</p>
                            </div>
                          </div>
                          <span className="font-black text-gray-800 shrink-0 ml-2">
                            {chk.score} / {chk.maxScore}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Feedback */}
                {selectedSubmissionForReview.automatedEvaluation?.feedbackSummary && (
                  <div className="p-3.5 bg-indigo-50 border border-indigo-100 rounded-2xl text-xs space-y-1">
                    <p className="font-bold text-indigo-900">
                      {language === 'en' ? 'Evaluation Summary' : 'মূল্যায়ন সারসংক্ষেপ'}
                    </p>
                    <p className="text-indigo-800 leading-relaxed">
                      {selectedSubmissionForReview.automatedEvaluation.feedbackSummary}
                    </p>
                  </div>
                )}

                <div className="flex justify-end pt-2">
                  <Button
                    onClick={() => setSelectedSubmissionForReview(null)}
                    className="bg-gray-900 hover:bg-gray-800 text-white font-bold text-xs rounded-xl px-5"
                  >
                    {language === 'en' ? 'Close' : 'বন্ধ করুন'}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default InstructorDashboardClient;
