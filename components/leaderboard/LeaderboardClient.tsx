'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Trophy,
  Medal,
  Globe,
  BookOpen,
  Search,
  ChevronRight,
  Flame,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  LeaderboardStudent,
  CourseLeaderboardStudent,
  getGlobalLeaderboardAction,
  getCourseLeaderboardAction,
} from '@/actions/leaderboard';

interface CourseOption {
  id: string;
  title: string;
  category: string;
  enrolledCount: number;
}

interface LeaderboardClientProps {
  initialGlobalStudents: LeaderboardStudent[];
  initialTotalGlobal: number;
  initialUserGlobalRank: LeaderboardStudent | null;
  courses: CourseOption[];
  initialSelectedCourseId?: string;
  initialCourseData?: {
    course: { id: string; title: string; category: string };
    students: CourseLeaderboardStudent[];
    totalEnrolled: number;
    currentUserCourseRank: CourseLeaderboardStudent | null;
  } | null;
}

export function LeaderboardClient({
  initialGlobalStudents,
  initialTotalGlobal,
  initialUserGlobalRank,
  courses,
  initialSelectedCourseId,
  initialCourseData,
}: LeaderboardClientProps) {
  // Modes: 'GLOBAL' | 'COURSE'
  const [mode, setMode] = useState<'GLOBAL' | 'COURSE'>(
    initialSelectedCourseId && initialCourseData ? 'COURSE' : 'GLOBAL'
  );

  // Global Leaderboard Filters
  const [selectedTrack, setSelectedTrack] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Global State
  const [globalStudents, setGlobalStudents] = useState<LeaderboardStudent[]>(initialGlobalStudents);
  const [totalGlobal, setTotalGlobal] = useState(initialTotalGlobal);
  const [userGlobalRank, setUserGlobalRank] = useState<LeaderboardStudent | null>(initialUserGlobalRank);

  // Course Cohort State
  const [selectedCourseId, setSelectedCourseId] = useState<string>(
    initialSelectedCourseId || (courses.length > 0 ? courses[0].id : '')
  );
  const [courseData, setCourseData] = useState(initialCourseData);
  const [courseSearchQuery, setCourseSearchQuery] = useState('');

  // Handle Global Filters Fetch
  const fetchGlobalLeaderboard = async (track: string, query: string, page: number) => {
    setIsLoading(true);
    try {
      const res = await getGlobalLeaderboardAction({
        track,
        searchQuery: query,
        page,
        limit: 20,
      });
      if (res.success && res.students) {
        setGlobalStudents(res.students);
        setTotalGlobal(res.totalStudents || 0);
        if (res.currentUserRank) {
          setUserGlobalRank(res.currentUserRank);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Course Cohort Fetch
  const fetchCourseLeaderboard = async (cId: string) => {
    if (!cId) return;
    setIsLoading(true);
    try {
      const res = await getCourseLeaderboardAction(cId);
      if (res.success && res.course) {
        setCourseData({
          course: res.course,
          students: res.students || [],
          totalEnrolled: res.totalEnrolled || 0,
          currentUserCourseRank: res.currentUserCourseRank || null,
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTrackChange = (track: string) => {
    setSelectedTrack(track);
    setCurrentPage(1);
    fetchGlobalLeaderboard(track, searchQuery, 1);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchGlobalLeaderboard(selectedTrack, searchQuery, 1);
  };

  const handleCourseChange = (cId: string) => {
    setSelectedCourseId(cId);
    fetchCourseLeaderboard(cId);
  };

  // Top 3 for Podium
  const topThreeGlobal = globalStudents.slice(0, 3);
  const topThreeCourse = (courseData?.students || []).slice(0, 3);

  // Filtered course students by search
  const filteredCourseStudents = (courseData?.students || []).filter((s) => {
    if (!courseSearchQuery.trim()) return true;
    return s.name.toLowerCase().includes(courseSearchQuery.toLowerCase());
  });

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-primary-950 p-8 sm:p-10 text-white shadow-xl">
        <div className="relative z-10 space-y-4 max-w-3xl">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="bg-amber-400/20 text-amber-300 border-amber-300/30 text-xs px-3 py-1 font-bold gap-1.5 backdrop-blur-xs">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span>Elo & Percentile Ranking Engine</span>
            </Badge>
            <Badge variant="outline" className="text-white/80 border-white/20 text-xs">
              সার্বজনীন ও কোর্স ভিত্তিক র‍্যাংকিং
            </Badge>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
            ই-শিখো লিডারবোর্ড ও পার্সেন্টাইল র‍্যাংকিং
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            আপনার অ্যাকাডেমিক দক্ষতা ও প্রবলেম সলভিং পারফরম্যান্সের ভিত্তিতে রিয়েল-টাইম এলো (Elo) রেটিং ও পার্সেন্টাইল পরিমাপ করা হয়।
            সারাদেশের শিক্ষার্থীদের সাথে সার্বজনীনভাবে অথবা নিজের কোর্সের ব্যাচমেটদের সাথে স্থানীয়ভাবে প্রতিযোগিতা করুন।
          </p>
        </div>

        {/* Ambient glow decoration */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-primary-500/20 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 -mb-16 w-60 h-60 rounded-full bg-amber-500/15 blur-2xl pointer-events-none" />
      </div>

      {/* Mode Switcher Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="flex items-center p-1 bg-slate-100 rounded-2xl border border-slate-200/80 shadow-2xs">
          <button
            onClick={() => setMode('GLOBAL')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${mode === 'GLOBAL'
                ? 'bg-white text-indigo-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
              }`}
          >
            <Globe className="w-4 h-4 text-primary-600" />
            <span>সার্বজনীন লিডারবোর্ড (Global)</span>
            <Badge className="ml-1 bg-primary-100 text-primary-700 text-[10px] py-0 px-1.5">
              {totalGlobal}
            </Badge>
          </button>

          <button
            onClick={() => {
              setMode('COURSE');
              if (!courseData && selectedCourseId) {
                fetchCourseLeaderboard(selectedCourseId);
              }
            }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${mode === 'COURSE'
                ? 'bg-white text-indigo-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
              }`}
          >
            <BookOpen className="w-4 h-4 text-emerald-600" />
            <span>কোর্স ব্যাচ লিডারবোর্ড (Course Cohort)</span>
          </button>
        </div>

        {/* Right contextual info */}
        <div className="text-xs text-slate-500 font-medium hidden sm:block">
          {mode === 'GLOBAL'
            ? 'সারাদেশের সকল শিক্ষার্থীর সামগ্রিক অবস্থান'
            : 'নির্দিষ্ট কোর্সে এনরোল্ড শিক্ষার্থীদের পারফরম্যান্স র‍্যাংকিং'}
        </div>
      </div>

      {/* MODE 1: GLOBAL LEADERBOARD */}
      {mode === 'GLOBAL' && (
        <div className="space-y-6">
          {/* Track Filters & Search Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Academic Track Pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { key: 'ALL', label: 'সকল ট্র্যাক (All)' },
                { key: 'CSE', label: 'Computer Science (CSE)' },
                { key: 'DATA_SCIENCE', label: 'Data Science & AI' },
                { key: 'WEB_DEV', label: 'Web Development' },
                { key: 'EEE', label: 'EEE & Hardware' },
                { key: 'BUSINESS', label: 'Business & Finance' },
              ].map((trk) => (
                <button
                  key={trk.key}
                  onClick={() => handleTrackChange(trk.key)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition border ${selectedTrack === trk.key
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                >
                  {trk.label}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <form onSubmit={handleSearchSubmit} className="relative w-full md:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="শিক্ষার্থীর নাম দিয়ে খুঁজুন..."
                className="pl-9 text-xs rounded-xl border-slate-200 bg-white"
              />
            </form>
          </div>

          {/* Current User Spotlight Banner (If logged in) */}
          {userGlobalRank && (
            <Card className="border-2 border-indigo-200 bg-gradient-to-r from-indigo-50/90 via-white to-primary-50/70 rounded-2xl shadow-xs overflow-hidden">
              <CardContent className="p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-sm shadow-md shadow-indigo-200">
                    #{userGlobalRank.rank}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-slate-900 text-sm sm:text-base">
                        আপনার বর্তমান অবস্থান ({userGlobalRank.name})
                      </span>
                      <Badge className="bg-indigo-600 text-white text-[10px]">
                        টপ {userGlobalRank.topPercentage}%
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5">
                      মোট {totalGlobal} জন শিক্ষার্থীর মধ্যে <strong>{userGlobalRank.percentile}তম পার্সেন্টাইল</strong> | ট্র্যাক: {userGlobalRank.targetTrack}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 sm:gap-6">
                  <div className="text-center">
                    <span className="text-[10px] text-slate-400 block font-semibold">এলো রেটিং</span>
                    <span className="text-base font-black text-indigo-700">{userGlobalRank.elo}</span>
                  </div>
                  <div className="text-center">
                    <span className="text-[10px] text-slate-400 block font-semibold">টায়ার</span>
                    <Badge variant="outline" className={`text-xs font-bold ${userGlobalRank.tier.badgeBg} ${userGlobalRank.tier.badgeColor}`}>
                      {userGlobalRank.tier.titleBn}
                    </Badge>
                  </div>
                  {userGlobalRank.streak ? (
                    <div className="text-center">
                      <span className="text-[10px] text-slate-400 block font-semibold">স্ট্রিক</span>
                      <span className="text-xs font-bold text-amber-600 flex items-center justify-center gap-0.5">
                        <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                        <span>{userGlobalRank.streak} দিন</span>
                      </span>
                    </div>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Top 3 Podium (Global) */}
          {topThreeGlobal.length >= 3 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              {/* #2 Silver (Left) */}
              <div className="order-2 md:order-1 bg-gradient-to-b from-slate-100/90 to-white border border-slate-200 rounded-3xl p-5 text-center shadow-xs flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="relative inline-block">
                    <div className="w-16 h-16 rounded-full mx-auto bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xl border-2 border-slate-300 shadow-sm">
                      {topThreeGlobal[1].name.charAt(0)}
                    </div>
                    <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-slate-500 text-white text-xs font-black flex items-center justify-center shadow-xs">
                      2
                    </span>
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900 truncate">
                      {topThreeGlobal[1].name}
                    </h3>
                    <p className="text-[11px] text-slate-500 truncate">{topThreeGlobal[1].headline}</p>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 mt-4 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">পার্সেন্টাইল:</span>
                    <span className="font-bold text-slate-900">টপ {topThreeGlobal[1].topPercentage}% ({topThreeGlobal[1].percentile}th)</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">এলো রেটিং:</span>
                    <span className="font-black text-slate-800">{topThreeGlobal[1].elo} Elo</span>
                  </div>
                  <Badge className={`w-full justify-center text-[10px] ${topThreeGlobal[1].tier.badgeBg} ${topThreeGlobal[1].tier.badgeColor}`}>
                    {topThreeGlobal[1].tier.titleBn} ({topThreeGlobal[1].tier.titleEn})
                  </Badge>
                </div>
              </div>

              {/* #1 Gold Champion (Center - Higher elevation) */}
              <div className="order-1 md:order-2 bg-gradient-to-b from-amber-50/80 via-white to-amber-50/40 border-2 border-amber-300 rounded-3xl p-6 text-center shadow-md flex flex-col justify-between relative -translate-y-1">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-white text-[10px] font-black px-3 py-0.5 rounded-full shadow-sm flex items-center gap-1 uppercase tracking-wider">
                  <CrownIcon />
                  <span>জাতীয় চ্যাম্পিয়ন (Rank 1)</span>
                </div>

                <div className="space-y-3 pt-2">
                  <div className="relative inline-block">
                    <div className="w-20 h-20 rounded-full mx-auto bg-gradient-to-tr from-amber-400 to-amber-200 text-amber-950 flex items-center justify-center font-black text-2xl border-4 border-white shadow-md">
                      {topThreeGlobal[0].name.charAt(0)}
                    </div>
                    <span className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-amber-500 text-white text-xs font-black flex items-center justify-center shadow-xs border-2 border-white">
                      1
                    </span>
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-slate-900 truncate">
                      {topThreeGlobal[0].name}
                    </h3>
                    <p className="text-xs text-amber-900/80 truncate font-medium">
                      {topThreeGlobal[0].headline}
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-amber-200 mt-4 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600">পার্সেন্টাইল:</span>
                    <span className="font-extrabold text-amber-800">টপ ১% (১০০তম পার্সেন্টাইল)</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600">এলো রেটিং:</span>
                    <span className="font-black text-lg text-amber-700">{topThreeGlobal[0].elo} Elo</span>
                  </div>
                  <Badge className={`w-full justify-center text-[11px] font-bold ${topThreeGlobal[0].tier.badgeBg} ${topThreeGlobal[0].tier.badgeColor}`}>
                    {topThreeGlobal[0].tier.titleBn} ({topThreeGlobal[0].tier.titleEn})
                  </Badge>
                </div>
              </div>

              {/* #3 Bronze (Right) */}
              <div className="order-3 bg-gradient-to-b from-amber-50/30 to-white border border-amber-200/80 rounded-3xl p-5 text-center shadow-xs flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="relative inline-block">
                    <div className="w-16 h-16 rounded-full mx-auto bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xl border-2 border-amber-200 shadow-sm">
                      {topThreeGlobal[2].name.charAt(0)}
                    </div>
                    <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-amber-700 text-white text-xs font-black flex items-center justify-center shadow-xs">
                      3
                    </span>
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900 truncate">
                      {topThreeGlobal[2].name}
                    </h3>
                    <p className="text-[11px] text-slate-500 truncate">{topThreeGlobal[2].headline}</p>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 mt-4 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">পার্সেন্টাইল:</span>
                    <span className="font-bold text-slate-900">টপ {topThreeGlobal[2].topPercentage}% ({topThreeGlobal[2].percentile}th)</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">এলো রেটিং:</span>
                    <span className="font-black text-slate-800">{topThreeGlobal[2].elo} Elo</span>
                  </div>
                  <Badge className={`w-full justify-center text-[10px] ${topThreeGlobal[2].tier.badgeBg} ${topThreeGlobal[2].tier.badgeColor}`}>
                    {topThreeGlobal[2].tier.titleBn} ({topThreeGlobal[2].tier.titleEn})
                  </Badge>
                </div>
              </div>
            </div>
          )}

          {/* Leaderboard Table */}
          <Card className="border border-slate-200 rounded-3xl bg-white shadow-xs overflow-hidden">
            <CardHeader className="p-5 pb-3 border-b border-slate-100 bg-slate-50/60 flex flex-row items-center justify-between">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <Trophy className="w-4 h-4 text-primary-600" />
                <span>র‍্যাংক তালিকা ও পার্সেন্টাইল ব্রেকডাউন</span>
              </CardTitle>
              <span className="text-xs text-slate-500 font-semibold">
                মোট {totalGlobal} জন শিক্ষার্থী
              </span>
            </CardHeader>

            <div className="divide-y divide-slate-100 overflow-x-auto">
              {globalStudents.length === 0 ? (
                <div className="py-16 text-center text-slate-500 text-xs">
                  কোনো শিক্ষার্থী পাওয়া যায়নি।
                </div>
              ) : (
                globalStudents.map((st) => (
                  <div
                    key={st.id}
                    className={`flex items-center justify-between p-4 px-5 hover:bg-slate-50/80 transition ${st.isCurrentUser ? 'bg-primary-50/50 border-l-4 border-l-primary-600' : ''
                      }`}
                  >
                    {/* Left: Rank & Avatar & Info */}
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-8 text-center shrink-0">
                        {st.rank === 1 ? (
                          <span className="inline-flex w-7 h-7 rounded-full bg-amber-100 text-amber-700 items-center justify-center font-black text-xs">
                            🥇
                          </span>
                        ) : st.rank === 2 ? (
                          <span className="inline-flex w-7 h-7 rounded-full bg-slate-100 text-slate-700 items-center justify-center font-black text-xs">
                            🥈
                          </span>
                        ) : st.rank === 3 ? (
                          <span className="inline-flex w-7 h-7 rounded-full bg-amber-50 text-amber-800 items-center justify-center font-black text-xs">
                            🥉
                          </span>
                        ) : (
                          <span className="text-xs font-bold text-slate-500">#{st.rank}</span>
                        )}
                      </div>

                      <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0">
                        {st.name.charAt(0)}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                            {st.name}
                          </span>
                          {st.isCurrentUser && (
                            <Badge className="bg-primary-600 text-white text-[9px] px-1.5 py-0">
                              আপনি
                            </Badge>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 truncate">{st.headline}</p>
                      </div>
                    </div>

                    {/* Right: Elo, Percentile, Tier */}
                    <div className="flex items-center gap-3 sm:gap-6 shrink-0 text-right">
                      {/* Percentile Pill */}
                      <div className="hidden sm:block text-right">
                        <Badge
                          variant="outline"
                          className="bg-emerald-50 text-emerald-800 border-emerald-200 text-[11px] font-bold"
                        >
                          টপ {st.topPercentage}%
                        </Badge>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          {st.percentile}th percentile
                        </span>
                      </div>

                      {/* Tier Badge */}
                      <div className="hidden md:block">
                        <Badge
                          variant="outline"
                          className={`text-[11px] font-bold ${st.tier.badgeBg} ${st.tier.badgeColor}`}
                        >
                          {st.tier.titleBn}
                        </Badge>
                      </div>

                      {/* Elo Rating */}
                      <div className="w-20 text-right">
                        <span className="text-sm font-black text-slate-900 block">{st.elo}</span>
                        <span className="text-[10px] text-slate-400 font-medium">Elo Rating</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      )}

      {/* MODE 2: LOCAL (COURSE-LEVEL) LEADERBOARD */}
      {mode === 'COURSE' && (
        <div className="space-y-6">
          {/* Course Selector Dropdown & Search */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-emerald-600" />
                  <span>কোর্স নির্বাচন করুন (Select Course for Cohort Leaderboard):</span>
                </label>
                <p className="text-[11px] text-slate-500">
                  নির্দিষ্ট কোর্সের সহপাঠীদের সাথে আপনার কুইজ স্কোর, লেকচার সমাপ্তি ও অবস্থান পর্যালোচনা করুন।
                </p>
              </div>

              {/* Course Dropdown */}
              <select
                value={selectedCourseId}
                onChange={(e) => handleCourseChange(e.target.value)}
                className="rounded-xl border border-slate-300 p-2.5 text-xs text-slate-800 font-semibold bg-slate-50/50 outline-none focus:border-emerald-500 w-full sm:w-80"
              >
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title} ({c.enrolledCount} জন শিক্ষার্থী)
                  </option>
                ))}
              </select>
            </div>

            {/* Live Search inside Course */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                value={courseSearchQuery}
                onChange={(e) => setCourseSearchQuery(e.target.value)}
                placeholder="এই কোর্সের সহপাঠী খুঁজুন..."
                className="pl-9 text-xs rounded-xl border-slate-200 bg-white"
              />
            </div>
          </div>

          {/* Current User Course Cohort Banner (If enrolled in this course) */}
          {courseData?.currentUserCourseRank ? (
            <Card className="border-2 border-emerald-300 bg-gradient-to-r from-emerald-50/80 via-white to-teal-50/60 rounded-2xl shadow-xs overflow-hidden">
              <CardContent className="p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black text-sm shadow-md shadow-emerald-200">
                    #{courseData.currentUserCourseRank.courseRank}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-slate-900 text-sm sm:text-base">
                        কোর্সে আপনার বর্তমান অবস্থান
                      </span>
                      <Badge className="bg-emerald-600 text-white text-[10px]">
                        টপ {courseData.currentUserCourseRank.topPercentage}% ব্যাচমেট
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5">
                      মোট {courseData.totalEnrolled} জন সহপাঠীর মধ্যে <strong>{courseData.currentUserCourseRank.coursePercentile}তম পার্সেন্টাইল</strong>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 sm:gap-6">
                  <div className="text-center">
                    <span className="text-[10px] text-slate-400 block font-semibold">অর্জিত স্কোর</span>
                    <span className="text-base font-black text-emerald-700">
                      {courseData.currentUserCourseRank.totalCourseScore}
                    </span>
                  </div>
                  <div className="text-center">
                    <span className="text-[10px] text-slate-400 block font-semibold">পাসকৃত পরীক্ষা</span>
                    <span className="text-xs font-bold text-slate-800">
                      {courseData.currentUserCourseRank.examsPassedCount} টি
                    </span>
                  </div>
                  <div className="text-center">
                    <span className="text-[10px] text-slate-400 block font-semibold">সমাপ্ত লেকচার</span>
                    <span className="text-xs font-bold text-indigo-700">
                      {courseData.currentUserCourseRank.completedLecturesCount} টি
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 text-slate-600 text-xs flex items-center justify-between gap-2">
              <span>আপনি এই কোর্সে এখনও তালিকাভুক্ত নন অথবা পরীক্ষা দেননি।</span>
              <Link href={`/courses/${selectedCourseId}`}>
                <Button size="sm" variant="outline" className="rounded-xl text-xs gap-1 border-slate-300">
                  <span>কোর্স বিস্তারিত দেখুন</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </div>
          )}

          {/* Top 3 Course Cohort Podium */}
          {topThreeCourse.length >= 3 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              {/* #2 Silver */}
              <div className="order-2 md:order-1 bg-gradient-to-b from-slate-100/90 to-white border border-slate-200 rounded-3xl p-5 text-center shadow-xs flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="relative inline-block">
                    <div className="w-16 h-16 rounded-full mx-auto bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xl border-2 border-slate-300 shadow-sm">
                      {topThreeCourse[1].name.charAt(0)}
                    </div>
                    <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-slate-500 text-white text-xs font-black flex items-center justify-center shadow-xs">
                      2
                    </span>
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900 truncate">
                      {topThreeCourse[1].name}
                    </h3>
                    <p className="text-[11px] text-slate-500 truncate">{topThreeCourse[1].academicBackground}</p>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 mt-4 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">কোর্স স্কোর:</span>
                    <span className="font-bold text-slate-900">{topThreeCourse[1].totalCourseScore} Marks</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">পার্সেন্টাইল:</span>
                    <Badge variant="outline" className="text-[10px] bg-slate-100">
                      টপ {topThreeCourse[1].topPercentage}%
                    </Badge>
                  </div>
                </div>
              </div>

              {/* #1 Gold Course Leader */}
              <div className="order-1 md:order-2 bg-gradient-to-b from-emerald-50/90 via-white to-emerald-50/40 border-2 border-emerald-400 rounded-3xl p-6 text-center shadow-md flex flex-col justify-between relative -translate-y-1">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-600 text-white text-[10px] font-black px-3 py-0.5 rounded-full shadow-sm flex items-center gap-1 uppercase tracking-wider">
                  <CrownIcon />
                  <span>কোর্স টপার (Top 1)</span>
                </div>

                <div className="space-y-3 pt-2">
                  <div className="relative inline-block">
                    <div className="w-20 h-20 rounded-full mx-auto bg-gradient-to-tr from-emerald-400 to-teal-200 text-emerald-950 flex items-center justify-center font-black text-2xl border-4 border-white shadow-md">
                      {topThreeCourse[0].name.charAt(0)}
                    </div>
                    <span className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-emerald-600 text-white text-xs font-black flex items-center justify-center shadow-xs border-2 border-white">
                      1
                    </span>
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-slate-900 truncate">
                      {topThreeCourse[0].name}
                    </h3>
                    <p className="text-xs text-emerald-800 truncate font-semibold">
                      {topThreeCourse[0].academicBackground}
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-emerald-200 mt-4 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">কোর্স স্কোর:</span>
                    <span className="font-black text-lg text-emerald-700">{topThreeCourse[0].totalCourseScore} Marks</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">পার্সেন্টাইল:</span>
                    <Badge className="bg-emerald-600 text-white text-[10px]">
                      টপ ১% ব্যাচ লিডার
                    </Badge>
                  </div>
                </div>
              </div>

              {/* #3 Bronze */}
              <div className="order-3 bg-gradient-to-b from-amber-50/30 to-white border border-amber-200/80 rounded-3xl p-5 text-center shadow-xs flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="relative inline-block">
                    <div className="w-16 h-16 rounded-full mx-auto bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xl border-2 border-amber-200 shadow-sm">
                      {topThreeCourse[2].name.charAt(0)}
                    </div>
                    <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-amber-700 text-white text-xs font-black flex items-center justify-center shadow-xs">
                      3
                    </span>
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900 truncate">
                      {topThreeCourse[2].name}
                    </h3>
                    <p className="text-[11px] text-slate-500 truncate">{topThreeCourse[2].academicBackground}</p>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 mt-4 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">কোর্স স্কোর:</span>
                    <span className="font-bold text-slate-900">{topThreeCourse[2].totalCourseScore} Marks</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">পার্সেন্টাইল:</span>
                    <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-800 border-amber-200">
                      টপ {topThreeCourse[2].topPercentage}%
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Course Cohort Table */}
          <Card className="border border-slate-200 rounded-3xl bg-white shadow-xs overflow-hidden">
            <CardHeader className="p-5 pb-3 border-b border-slate-100 bg-slate-50/60 flex flex-row items-center justify-between">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <Medal className="w-4 h-4 text-emerald-600" />
                <span>{courseData?.course?.title || 'কোর্স'} — সহপাঠী র‍্যাংক তালিকা</span>
              </CardTitle>
              <span className="text-xs text-slate-500 font-semibold">
                মোট {courseData?.totalEnrolled || 0} জন সহপাঠী
              </span>
            </CardHeader>

            <div className="divide-y divide-slate-100 overflow-x-auto">
              {filteredCourseStudents.length === 0 ? (
                <div className="py-16 text-center text-slate-500 text-xs">
                  এই কোর্সের কোনো তালিকাভুক্ত সহপাঠী বা ফলাফল পাওয়া যায়নি।
                </div>
              ) : (
                filteredCourseStudents.map((st) => (
                  <div
                    key={st.id}
                    className={`flex items-center justify-between p-4 px-5 hover:bg-slate-50/80 transition ${st.isCurrentUser ? 'bg-emerald-50/60 border-l-4 border-l-emerald-600' : ''
                      }`}
                  >
                    {/* Left: Course Rank & Avatar & Name */}
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-8 text-center shrink-0">
                        {st.courseRank === 1 ? (
                          <span className="inline-flex w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 items-center justify-center font-black text-xs">
                            🥇
                          </span>
                        ) : st.courseRank === 2 ? (
                          <span className="inline-flex w-7 h-7 rounded-full bg-slate-100 text-slate-700 items-center justify-center font-black text-xs">
                            🥈
                          </span>
                        ) : st.courseRank === 3 ? (
                          <span className="inline-flex w-7 h-7 rounded-full bg-amber-50 text-amber-800 items-center justify-center font-black text-xs">
                            🥉
                          </span>
                        ) : (
                          <span className="text-xs font-bold text-slate-500">#{st.courseRank}</span>
                        )}
                      </div>

                      <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0">
                        {st.name.charAt(0)}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                            {st.name}
                          </span>
                          {st.isCurrentUser && (
                            <Badge className="bg-emerald-600 text-white text-[9px] px-1.5 py-0">
                              আপনি
                            </Badge>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 truncate">{st.academicBackground}</p>
                      </div>
                    </div>

                    {/* Right: Score, Percentile, Completed Lectures */}
                    <div className="flex items-center gap-3 sm:gap-6 shrink-0 text-right">
                      {/* Percentile Pill */}
                      <div className="text-right">
                        <Badge
                          variant="outline"
                          className="bg-emerald-50 text-emerald-800 border-emerald-200 text-[11px] font-bold"
                        >
                          টপ {st.topPercentage}%
                        </Badge>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          {st.coursePercentile}th percentile
                        </span>
                      </div>

                      {/* Completed Lectures */}
                      <div className="hidden sm:block text-right">
                        <span className="text-xs font-bold text-indigo-700 block">
                          {st.completedLecturesCount} টি
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">সমাপ্ত লেকচার</span>
                      </div>

                      {/* Total Course Exam Score */}
                      <div className="w-24 text-right">
                        <span className="text-sm font-black text-emerald-700 block">
                          {st.totalCourseScore}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">কোর্স কুইজ মার্কস</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

function CrownIcon() {
  return (
    <svg className="w-3 h-3 text-amber-200 fill-amber-200" viewBox="0 0 24 24">
      <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5m14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z" />
    </svg>
  );
}
