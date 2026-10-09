'use client';

import React from 'react';
import Link from 'next/link';
import {
  Trophy,
  Flame,
  Timer,
  Award,
  Users,
  CheckCircle2,
  ArrowRight,
  ShieldAlert,
  Sparkles,
  Zap,
  TrendingUp,
  TrendingDown,
  BookOpen,
  ArrowLeft,
  Code2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { useLanguage } from '@/context/LanguageContext';

interface ContestDetailClientProps {
  contest: any;
  hasSubmitted: boolean;
  submission: any;
}

export function ContestDetailClient({ contest, hasSubmitted, submission }: ContestDetailClientProps) {
  const { language } = useLanguage();

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-20 px-4 sm:px-6">
      {/* Back button */}
      <div>
        <Link
          href="/contests"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>{language === 'en' ? 'Back to All Contests' : 'সকল কনটেস্টে ফিরে যান'}</span>
        </Link>
      </div>

      {/* Hero Header */}
      <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-8 sm:p-10 shadow-xl border border-slate-800 space-y-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-extrabold uppercase px-3 py-1 rounded-full bg-amber-400 text-slate-900">
            {contest.category}
          </span>
          <span className="text-[11px] font-bold text-emerald-300 bg-emerald-500/20 border border-emerald-500/30 px-3 py-1 rounded-full flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            LIVE ARENA
          </span>
          <span className="text-[11px] font-bold text-indigo-300 bg-white/10 px-3 py-1 rounded-full">
            {contest.difficulty} DIFFICULTY
          </span>
        </div>

        <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight">
          {contest.title}
        </h1>

        <p className="text-sm sm:text-base text-slate-300 max-w-3xl leading-relaxed">
          {contest.description}
        </p>

        {/* Target Backgrounds */}
        <div className="pt-2 flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-400">
            {language === 'en' ? 'Target Disciplines:' : 'টার্গেট ডিসিপ্লিন:'}
          </span>
          {(contest.targetBackgrounds || []).map((bg: string) => (
            <span
              key={bg}
              className="text-xs font-extrabold text-amber-300 bg-amber-400/10 border border-amber-400/20 px-2.5 py-1 rounded-lg"
            >
              {bg}
            </span>
          ))}
        </div>
      </div>

      {/* If previously completed, display result banner */}
      {hasSubmitted && submission && (
        <div className="rounded-2xl border border-indigo-200 bg-indigo-50/70 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="h-6 w-6 text-emerald-600 shrink-0" />
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  {language === 'en' ? 'Contest Completed & Evaluated' : 'কনটেস্ট সম্পন্ন ও মূল্যায়িত হয়েছে'}
                </h3>
                <p className="text-xs text-slate-500">
                  {new Date(submission.submittedAt).toLocaleString()}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`text-xs font-black px-3 py-1.5 rounded-xl flex items-center gap-1 shadow-sm ${
                  submission.eloChange >= 0
                    ? 'bg-emerald-600 text-white'
                    : 'bg-rose-600 text-white'
                }`}
              >
                {submission.eloChange >= 0 ? (
                  <TrendingUp className="h-4 w-4" />
                ) : (
                  <TrendingDown className="h-4 w-4" />
                )}
                <span>
                  {submission.eloChange >= 0 ? `+${submission.eloChange}` : submission.eloChange} Elo Rating Delta
                </span>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="bg-white p-3 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-400 font-bold block uppercase">Score</span>
              <span className="text-lg font-black text-slate-900">
                {submission.totalScore} / {submission.maxScore}
              </span>
            </div>
            <div className="bg-white p-3 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-400 font-bold block uppercase">Accuracy</span>
              <span className="text-lg font-black text-indigo-600">{submission.accuracy}%</span>
            </div>
            <div className="bg-white p-3 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-400 font-bold block uppercase">Competitive MMR</span>
              <span className="text-lg font-black text-amber-600">{submission.newCompetitiveElo}</span>
            </div>
            <div className="bg-white p-3 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-400 font-bold block uppercase">Total Elo</span>
              <span className="text-lg font-black text-slate-900">{submission.newCompositeElo}</span>
            </div>
          </div>

          <p className="text-xs text-slate-600 font-medium italic">
            "{submission.performanceSummary}"
          </p>
        </div>
      )}

      {/* Main Grid: Details + Stakes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left: Information & Rules */}
        <div className="md:col-span-2 space-y-6">
          <Card className="rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Award className="h-5 w-5 text-amber-500" />
              <span>{language === 'en' ? 'Competition Blueprint & Problem Set' : 'কনটেস্ট ব্লুপ্রিন্ট ও বিষয়বস্তু'}</span>
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              {contest.shortSummary || contest.description}
            </p>

            <div className="mt-5 space-y-3">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                {language === 'en' ? 'Rules & Instructions' : 'নিয়মাবলী ও নির্দেশিকা'}
              </h4>
              <ul className="space-y-2 text-xs text-slate-600">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>
                    {language === 'en'
                      ? 'Questions are mathematically formalized using LaTeX notation.'
                      : 'গাণিতিক সূত্রসমূহ ল্যাটেক (LaTeX) ফরম্যাটে সুস্পষ্টভাবে উপস্থাপিত।'}
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>
                    {language === 'en'
                      ? 'The countdown timer starts as soon as you enter the arena.'
                      : 'অ্যারেনায় প্রবেশের সাথে সাথে নির্দিষ্ট সময় গণনা শুরু হবে।'}
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>
                    {language === 'en'
                      ? 'Instant evaluation: Your new rating is computed immediately upon submission.'
                      : 'ইনস্ট্যান্ট ইভালুয়েশন: সাবমিট করার সাথে সাথেই নতুন ইলো রেটিং গণনা সম্পন্ন হবে।'}
                  </span>
                </li>
              </ul>
            </div>
          </Card>

          {/* Elo Dynamics Explainer Card */}
          <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-6 space-y-3">
            <h4 className="text-sm font-bold text-amber-900 flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-600" />
              <span>{language === 'en' ? 'Two-Way Rating Fluctuations' : 'দুইমুখী রেটিং পরিবর্তনের নিয়ম'}</span>
            </h4>
            <p className="text-xs text-amber-800 leading-relaxed">
              {language === 'en'
                ? `This contest is calibrated to a benchmark rating of ${contest.benchmarkRating} Elo. If your accuracy and solve speed exceed expected performance, your rating increases. If your performance drops below expected benchmark, your Elo will decrease accordingly.`
                : `এই কনটেস্টটি ${contest.benchmarkRating} ইলো বেঞ্চমার্কে ক্যালিব্রেট করা হয়েছে। প্রত্যাশার চেয়ে ভালো করলে রেটিং বাড়বে (+), আর খারাপ করলে রেটিং হ্রাস পাবে (-)।`}
            </p>
          </div>
        </div>

        {/* Right: Quick Stats & Action Panel */}
        <div className="space-y-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900">
              {language === 'en' ? 'Arena Parameters' : 'অ্যারেনা প্যারামিটার'}
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-slate-500">{language === 'en' ? 'Benchmark Rating' : 'বেঞ্চমার্ক রেটিং'}</span>
                <span className="font-extrabold text-amber-700">{contest.benchmarkRating} Elo</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-slate-500">{language === 'en' ? 'Time Duration' : 'সময়কাল'}</span>
                <span className="font-bold text-slate-800">{contest.durationMinutes} Minutes</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-slate-500">{language === 'en' ? 'Total Problems' : 'সমস্যা সংখ্যা'}</span>
                <span className="font-bold text-slate-800">{contest.problems?.length || 3} Questions</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-slate-500">{language === 'en' ? 'Active Competitors' : 'প্রতিযোগী সংখ্যা'}</span>
                <span className="font-bold text-slate-800">{contest.totalParticipants || 15} Students</span>
              </div>
              {contest.prizePool && (
                <div className="flex items-center justify-between pt-1">
                  <span className="text-slate-500">{language === 'en' ? 'Prize Pool' : 'পুরস্কার'}</span>
                  <span className="font-extrabold text-emerald-700">{contest.prizePool}</span>
                </div>
              )}
            </div>

            <div className="pt-3">
              <Link href={`/contests/${contest.slug}/arena`}>
                <Button className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold text-sm py-3 rounded-xl flex items-center justify-center gap-2 shadow-md">
                  <Code2 className="h-4 w-4" />
                  <span>
                    {hasSubmitted
                      ? language === 'en'
                        ? 'Retake / Practice Arena'
                        : 'পুনরায় অনুশীলন করুন'
                      : language === 'en'
                      ? 'Enter Contest Arena'
                      : 'অ্যারেনায় প্রবেশ করুন'}
                  </span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
