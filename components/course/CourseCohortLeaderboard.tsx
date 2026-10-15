'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Trophy,
  Medal,
  Award,
  BookOpen,
  ArrowRight,
  Loader2,
  CheckCircle2,
  Users,
  Target,
  Sparkles,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  CourseLeaderboardStudent,
  getCourseLeaderboardAction,
} from '@/actions/leaderboard';

export function CourseCohortLeaderboard({ courseId }: { courseId: string }) {
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<CourseLeaderboardStudent[]>([]);
  const [totalEnrolled, setTotalEnrolled] = useState(0);
  const [currentUserRank, setCurrentUserRank] = useState<CourseLeaderboardStudent | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const res = await getCourseLeaderboardAction(courseId);
        if (res.success) {
          setStudents(res.students || []);
          setTotalEnrolled(res.totalEnrolled || 0);
          setCurrentUserRank(res.currentUserCourseRank || null);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    if (courseId) loadData();
  }, [courseId]);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-12 border border-slate-200 text-center space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600 mx-auto" />
        <p className="text-xs text-slate-500 font-medium">কোর্স ব্যাচ লিডারবোর্ড লোড হচ্ছে...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 md:p-8 border border-slate-200 shadow-sm space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              কোর্স ব্যাচমেট পারফরম্যান্স লিডারবোর্ড (Cohort Ranking)
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            এই কোর্সের এনরোল্ড শিক্ষার্থীদের কুইজ স্কোর, লেকচার অগ্রগতি ও স্থানীয় পার্সেন্টাইল ব্রেকডাউন।
          </p>
        </div>

        <Link href={`/leaderboard?courseId=${courseId}`}>
          <Button variant="outline" size="sm" className="rounded-xl text-xs gap-1.5 border-slate-300">
            <span>সার্বজনীন লিডারবোর্ডে দেখুন</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </Link>
      </div>

      {/* Current User Course Cohort Banner (If enrolled and has data) */}
      {currentUserRank ? (
        <div className="p-4 sm:p-5 rounded-2xl border-2 border-emerald-300 bg-gradient-to-r from-emerald-50/90 via-white to-teal-50/70 flex flex-wrap items-center justify-between gap-4 shadow-2xs">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black text-sm shadow-md shadow-emerald-200">
              #{currentUserRank.courseRank}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-slate-900 text-xs sm:text-sm">
                  এই কোর্সে আপনার অবস্থান
                </span>
                <Badge className="bg-emerald-600 text-white text-[10px]">
                  টপ {currentUserRank.topPercentage}%
                </Badge>
              </div>
              <p className="text-[11px] text-slate-600 mt-0.5">
                কোর্সের {totalEnrolled} জন সহপাঠীর মধ্যে <strong>{currentUserRank.coursePercentile}তম পার্সেন্টাইল</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 sm:gap-6 text-right">
            <div>
              <span className="text-[10px] text-slate-400 block font-semibold">কুইজ স্কোর</span>
              <span className="text-sm font-black text-emerald-700">{currentUserRank.totalCourseScore}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-semibold">পাসকৃত পরীক্ষা</span>
              <span className="text-xs font-bold text-slate-800">{currentUserRank.examsPassedCount} টি</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-semibold">সমাপ্ত লেকচার</span>
              <span className="text-xs font-bold text-indigo-700">{currentUserRank.completedLecturesCount} টি</span>
            </div>
          </div>
        </div>
      ) : null}

      {/* Cohort Ranking Table */}
      <div className="border border-slate-200 rounded-2xl overflow-hidden">
        <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between text-xs font-bold text-slate-700">
          <span>সহপাঠীর নাম ও তথ্য</span>
          <span>স্কোর ও পার্সেন্টাইল</span>
        </div>

        <div className="divide-y divide-slate-100">
          {students.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              এই কোর্সে এখনও কোনো পরীক্ষার ফলাফল রেকর্ড করা হয়নি।
            </div>
          ) : (
            students.map((st) => (
              <div
                key={st.id}
                className={`p-3.5 sm:p-4 flex items-center justify-between hover:bg-slate-50/80 transition ${
                  st.isCurrentUser ? 'bg-emerald-50/50 border-l-4 border-l-emerald-600' : ''
                }`}
              >
                {/* Left: Rank & Name */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-7 text-center shrink-0">
                    {st.courseRank === 1 ? (
                      <span className="inline-flex w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 items-center justify-center font-black text-xs">
                        🥇
                      </span>
                    ) : st.courseRank === 2 ? (
                      <span className="inline-flex w-6 h-6 rounded-full bg-slate-100 text-slate-700 items-center justify-center font-black text-xs">
                        🥈
                      </span>
                    ) : st.courseRank === 3 ? (
                      <span className="inline-flex w-6 h-6 rounded-full bg-amber-50 text-amber-800 items-center justify-center font-black text-xs">
                        🥉
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-slate-400">#{st.courseRank}</span>
                    )}
                  </div>

                  <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0">
                    {st.name.charAt(0)}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-xs text-slate-900 truncate">{st.name}</span>
                      {st.isCurrentUser && (
                        <Badge className="bg-emerald-600 text-white text-[9px] px-1 py-0">আপনি</Badge>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 block truncate">
                      {st.academicBackground || 'Student'}
                    </span>
                  </div>
                </div>

                {/* Right: Percentile & Score */}
                <div className="flex items-center gap-3 sm:gap-6 text-right shrink-0">
                  <div className="hidden sm:block text-right">
                    <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-200 text-[10px] font-bold">
                      টপ {st.topPercentage}%
                    </Badge>
                    <span className="text-[9px] text-slate-400 block mt-0.5">
                      {st.coursePercentile}th percentile
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-xs sm:text-sm font-black text-emerald-700 block">
                      {st.totalCourseScore}
                    </span>
                    <span className="text-[9px] text-slate-400 font-medium">কুইজ মার্কস</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
