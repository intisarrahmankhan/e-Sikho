import React from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { CourseCard } from "@/components/dashboard/CourseCard";
import { UpcomingExamsWidget } from "@/components/dashboard/UpcomingExamsWidget";
import { LeaderboardSnippet } from "@/components/dashboard/LeaderboardSnippet";
import { EmptyEnrollments } from "@/components/dashboard/EmptyEnrollments";
import { auth } from "@/auth";
import dbConnect from "@/lib/mongoose";
import Enrollment from "@/models/Enrollment";
import InstructorRequest from "@/models/InstructorRequest";
import { redirect } from "next/navigation";
import Link from "next/link";
import { 
  Flame, 
  Trophy, 
  BookOpen, 
  Clock, 
  Award, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2,
  TrendingUp,
  Target
} from "lucide-react";
import InstructorRequestForm from './InstructorRequestForm';

// Mock Data for other widgets
const MOCK_EXAMS = [
  { id: "e1", title: "সিস্টেম ডিজাইন মিডটার্ম পরীক্ষা", date: "2024-10-15", daysLeft: 7 },
  { id: "e2", title: "রিয়েক্ট পারফরম্যান্স কুইজ", date: "2024-10-25", daysLeft: 17 }
];

const MOCK_LEADERBOARD = [
  { id: "s1", name: "তানজিম আহমেদ", elo: 1620 },
  { id: "s2", name: "নুসরাত জাহান", elo: 1585 },
  { id: "s3", name: "রাকিবুল হাসান", elo: 1540 },
  { id: "s4", name: "You", elo: 1450 },
  { id: "s5", name: "সাদিয়া আফরিন", elo: 1425 },
];

export default async function StudentDashboardPage() {
  const session = await auth();
  
  if (!session || !session.user) {
    redirect('/login');
  }
  
  const userId = (session.user as any).id;
  
  if (!userId) {
    redirect('/login');
  }

  // Fetch actual enrolled courses for this user
  await dbConnect();
  const enrollmentsList = await Enrollment.find({
    userId: userId,
    paymentStatus: 'success', // Only show fully paid / successful enrollments
  }).populate('course').lean();
  
  const req = await InstructorRequest.findOne({ userId }).lean();
  
  const enrollments: any[] = enrollmentsList || [];
  const instructorRequest: any = req || null;

  // Format to match what the component expects
  const enrolledCourses = enrollments.map(e => ({
    id: e.course._id ? e.course._id.toString() : e.course.id,
    title: e.course.title,
    thumbnailUrl: e.course.thumbnailUrl,
    progressPercentage: 35, // Demo progress percentage
    targetCompletionDate: new Date(new Date().setMonth(new Date().getMonth() + 2)).toISOString().split('T')[0]
  }));

  const hasEnrollments = enrolledCourses.length > 0;
  const elo = 1450;
  const streak = 12;

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* ─── Welcome Hero Banner ─── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-primary-950 to-slate-900 text-white p-6 sm:p-8 md:p-10 shadow-xl border border-slate-800">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-primary-500/20 text-primary-300 border border-primary-500/30">
                Student Portal
              </span>
              <span className="text-xs text-slate-400">
                {new Date().toLocaleDateString('bn-BD', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-white">
              স্বাগতম, {session.user.name || 'শিক্ষার্থী'}! 👋
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
              আপনার লার্নিং ড্যাশবোর্ডে কোর্সসমূহ চালিয়ে যান এবং সাপ্তাহিক লক্ষ্য পূরণ করুন।
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2.5 bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/10">
              <div className="h-9 w-9 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400">
                <Trophy className="h-5 w-5" />
              </div>
              <div>
                <div className="text-[11px] text-slate-400 font-medium">Elo Rating</div>
                <div className="text-lg font-black text-amber-400 leading-tight">{elo}</div>
              </div>
            </div>

            <div className="flex items-center gap-2.5 bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/10">
              <div className="h-9 w-9 rounded-xl bg-rose-500/20 flex items-center justify-center text-rose-400">
                <Flame className="h-5 w-5" />
              </div>
              <div>
                <div className="text-[11px] text-slate-400 font-medium">Study Streak</div>
                <div className="text-lg font-black text-rose-400 leading-tight">{streak} দিন 🔥</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Metric Counter Cards ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {[
          { label: 'এনরোল করা কোর্স', value: enrolledCourses.length, icon: BookOpen, color: 'text-blue-600 bg-blue-50 border-blue-100' },
          { label: 'চলমান লেসন', value: hasEnrollments ? '৮টি' : '০টি', icon: Clock, color: 'text-indigo-600 bg-indigo-50 border-indigo-100' },
          { label: 'সম্পন্ন কুইজ', value: '১২টি', icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
          { label: 'অর্জিত সার্টিফিকেট', value: '১টি', icon: Award, color: 'text-purple-600 bg-purple-50 border-purple-100' },
        ].map((stat, i) => (
          <div key={i} className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 hover:shadow-md transition">
            <div className={`h-11 w-11 rounded-xl flex items-center justify-center ${stat.color} border shrink-0`}>
              <stat.icon className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">{stat.value}</div>
              <div className="text-xs text-slate-500 font-medium mt-0.5">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ─── Main Content Grid ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Active Enrollments */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900">
                আমার চলমান কোর্সসমূহ
              </h2>
              <Badge variant="outline" className="text-xs font-semibold text-primary-700 bg-primary-50 border-primary-200">
                {enrolledCourses.length} টি সক্রিয়
              </Badge>
            </div>
            <Link href="/courses" className="text-xs font-semibold text-primary-600 hover:text-primary-700 inline-flex items-center gap-1">
              <span>নতুন কোর্স এক্সপ্লোর</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {!hasEnrollments ? (
            <EmptyEnrollments />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {enrolledCourses.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          )}

          {/* Daily Learning Goal Banner */}
          <div className="p-6 rounded-2xl bg-gradient-to-r from-primary-50 to-indigo-50 border border-primary-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="h-10 w-10 rounded-xl bg-primary-600 text-white flex items-center justify-center shrink-0">
                <Target className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">আজকের পড়ার লক্ষ্যমাত্রা</h4>
                <p className="text-xs text-slate-500">৪৫ মিনিটের মধ্যে ৩০ মিনিট সম্পন্ন হয়েছে (৬৭%)</p>
              </div>
            </div>
            <Link href="/courses">
              <Button size="sm" className="bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold px-4 rounded-xl shadow-sm">
                পড়া চালিয়ে যান
              </Button>
            </Link>
          </div>
        </div>

        {/* Right Column: Widgets */}
        <div className="space-y-6">
          <UpcomingExamsWidget exams={MOCK_EXAMS} />
          <LeaderboardSnippet topStudents={MOCK_LEADERBOARD} />
        </div>
      </div>

      <section className="rounded-2xl border border-indigo-100 bg-indigo-50 p-6">
        <h2 className="text-lg font-bold text-slate-900">Become an instructor</h2>
        <p className="mt-1 mb-4 text-sm text-slate-600">Share your knowledge on e-Sikho. Your request must be approved by both an admin and the superadmin.</p>
        <InstructorRequestForm status={instructorRequest?.status} />
      </section>
    </div>
  );
}
