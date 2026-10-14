'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Trophy,
  Flame,
  Award,
  Timer,
  Users,
  ArrowRight,
  Sparkles,
  Zap,
  CheckCircle2,
  Filter,
  Search,
  BrainCircuit,
  Code2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useLanguage } from '@/context/LanguageContext';
import { RATING_TIERS } from '@/lib/elo';

interface ContestItem {
  id: string;
  title: string;
  slug: string;
  description: string;
  shortSummary: string;
  category: string;
  targetBackgrounds: string[];
  difficulty: string;
  benchmarkRating: number;
  durationMinutes: number;
  status: string;
  totalParticipants: number;
  prizePool?: string;
  problemCount: number;
  priority: 'HIGH' | 'NORMAL' | 'LOW';
  priorityScore: number;
  badgeTextEn: string;
  badgeTextBn: string;
  isDirectMatch: boolean;
}

interface ContestsListClientProps {
  contests: ContestItem[];
  userBackground?: string;
}

export function ContestsListClient({ contests, userBackground = 'Computer Science & Engineering (CSE)' }: ContestsListClientProps) {
  const { language } = useLanguage();
  const [search, setSearch] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('ALL');

  const filters = [
    { id: 'ALL', labelEn: 'All Arenas', labelBn: 'সকল অ্যারেনা' },
    { id: 'CSE', labelEn: 'Computer Science (CS/SWE)', labelBn: 'কম্পিউটার সায়েন্স (CS/SWE)' },
    { id: 'DATA_SCIENCE', labelEn: 'Data Science & AI', labelBn: 'ডাটা সায়েন্স ও এআই' },
    { id: 'BUSINESS', labelEn: 'Business & FinTech', labelBn: 'বিজনেস ও ফিনটেক' },
    { id: 'GENERAL', labelEn: 'General Logic & Aptitude', labelBn: 'জেনারেল লজিক' },
  ];

  const filtered = contests.filter((c) => {
    const matchesSearch =
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.description.toLowerCase().includes(search.toLowerCase()) ||
      c.category.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;
    if (selectedFilter === 'ALL') return true;

    const bgs = (c.targetBackgrounds || []).map((b) => b.toUpperCase());
    return bgs.includes(selectedFilter);
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16 px-4 sm:px-6">
      {/* ── Header ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-white p-8 sm:p-10 shadow-2xl border border-slate-800">
        <div className="pointer-events-none absolute -top-16 -right-16 h-72 w-72 rounded-full bg-amber-500/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-10 left-1/3 h-52 w-52 rounded-full bg-indigo-500/10 blur-xl" />

        <div className="relative max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-amber-400/10 border border-amber-400/20 px-3.5 py-1 text-xs font-bold text-amber-300">
            <Trophy className="h-4 w-4 text-amber-400" />
            <span>{language === 'en' ? 'National Competitive Problem Solving Arena' : 'জাতীয় কম্পিটিটিভ প্রবলেম সলভিং অ্যারেনা'}</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white leading-tight">
            {language === 'en' ? 'Skill Contests & Dynamic Elo Battles' : 'স্কিল কনটেস্ট ও রিয়েল-টাইম ইলো রেটিং যুদ্ধ'}
          </h1>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            {language === 'en'
              ? 'Compete in high-stakes problem-solving arenas with live mathematical derivations, algorithmic duels, and system architectures. Your Elo rating rises on beating benchmarks, and decreases if your score falls below expectations.'
              : 'অ্যালগরিদমিক চ্যালেঞ্জ, ম্যাথমেটিক্যাল প্রুফ এবং হাই-স্কেল সিস্টেম ডিজাইনের রিয়েল-টাইম কনটেস্টে অংশ নিন। আপনার পারফরম্যান্স অনুযায়ী রেটিং বৃদ্ধি বা হ্রাস পাবে।'}
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-4 text-xs text-slate-300">
            <div className="flex items-center gap-1.5 bg-white/10 border border-white/10 px-3 py-1.5 rounded-xl">
              <Flame className="h-4 w-4 text-rose-400" />
              <span>
                {language === 'en' ? `Prioritized for: ${userBackground}` : `আপনার ট্র্যাক: ${userBackground}`}
              </span>
            </div>
            <div className="flex items-center gap-1.5 bg-white/10 border border-white/10 px-3 py-1.5 rounded-xl">
              <Zap className="h-4 w-4 text-amber-400" />
              <span>{language === 'en' ? 'Two-way Elo MMR (Up/Down)' : 'ডাইনামিক ইলো রেটিং (+/-)'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Search & Filter Controls ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {filters.map((f) => (
            <button
              key={f.id}
              onClick={() => setSelectedFilter(f.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition shrink-0 ${
                selectedFilter === f.id
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              {language === 'en' ? f.labelEn : f.labelBn}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={language === 'en' ? 'Search contest topics...' : 'কনটেস্ট বা বিষয় খুঁজুন...'}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-600"
          />
        </div>
      </div>

      {/* ── Contest Cards Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((c) => {
          const isHigh = c.priority === 'HIGH';

          return (
            <div
              key={c.id}
              className={`rounded-3xl p-6 transition-all duration-200 flex flex-col justify-between ${
                isHigh
                  ? 'bg-gradient-to-br from-amber-50/50 via-white to-orange-50/30 border-2 border-amber-400 shadow-md hover:shadow-xl'
                  : 'bg-white border border-slate-200 hover:border-slate-300 shadow-sm hover:shadow-md'
              }`}
            >
              <div>
                {/* Priority & Status Header */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span
                    className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full ${
                      isHigh
                        ? 'bg-rose-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {isHigh ? (language === 'en' ? '🔥 TOP PRIORITY' : '🔥 শীর্ষ অগ্রাধিকার') : (language === 'en' ? 'OPEN TRACK' : 'উন্মুক্ত ট্র্যাক')}
                  </span>

                  <span className="text-[11px] font-extrabold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                    {c.benchmarkRating} Benchmark Elo
                  </span>
                </div>

                <h3 className="text-base font-extrabold text-slate-900 leading-snug">
                  {c.title}
                </h3>

                <p className="text-xs text-slate-600 mt-2 line-clamp-3 leading-relaxed">
                  {c.shortSummary || c.description}
                </p>

                {/* Specs Box */}
                <div className="mt-5 grid grid-cols-2 gap-2 text-xs">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] text-slate-400 block font-medium">
                      {language === 'en' ? 'Duration' : 'সময়কাল'}
                    </span>
                    <span className="font-bold text-slate-800 mt-0.5 block flex items-center gap-1">
                      <Timer className="h-3.5 w-3.5 text-indigo-500" />
                      {c.durationMinutes} {language === 'en' ? 'Minutes' : 'মিনিট'}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] text-slate-400 block font-medium">
                      {language === 'en' ? 'Problem Set' : 'সমস্যা সংখ্যা'}
                    </span>
                    <span className="font-bold text-slate-800 mt-0.5 block flex items-center gap-1">
                      <Code2 className="h-3.5 w-3.5 text-emerald-500" />
                      {c.problemCount || 3} {language === 'en' ? 'Complex Qs' : 'টি প্রশ্ন'}
                    </span>
                  </div>
                </div>

                {c.prizePool && (
                  <div className="mt-3 text-xs font-semibold text-amber-800 bg-amber-50/80 border border-amber-200/60 rounded-xl px-3 py-1.5 flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                    <span>{c.prizePool}</span>
                  </div>
                )}
              </div>

              {/* Action */}
              <div className="pt-5 mt-5 border-t border-slate-100 flex items-center justify-between gap-3">
                <span className="text-[11px] text-slate-500 flex items-center gap-1">
                  <Users className="h-3.5 w-3.5 text-slate-400" />
                  <span>{c.totalParticipants || 18} {language === 'en' ? 'Competitors' : 'জন প্রতিযোগী'}</span>
                </span>

                <Link href={`/contests/${c.slug}`}>
                  <Button
                    className={`font-bold text-xs rounded-xl px-5 py-2.5 flex items-center gap-2 ${
                      isHigh
                        ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-md'
                        : 'bg-primary-600 hover:bg-primary-700 text-white'
                    }`}
                  >
                    <span>{language === 'en' ? 'Enter Contest' : 'অ্যারেনায় প্রবেশ'}</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Elo Tiers Reference Guide ── */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-4">
        <div className="border-b border-slate-100 pb-3">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-500" />
            <span>{language === 'en' ? 'Official Elo Rating Tiers & Titles' : 'অফিসিয়াল ইলো রেটিং টিয়ার ও পদবী'}</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {language === 'en'
              ? 'Your title upgrades dynamically as your composite rating crosses tier thresholds.'
              : 'আপনার রেটিং পয়েন্ট বৃদ্ধির সাথে সাথে পদবী ও ব্যাজ স্বয়ংক্রিয়ভাবে আপগ্রেড হবে।'}
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {RATING_TIERS.map((t) => (
            <div
              key={t.tier}
              className={`p-3.5 rounded-2xl border ${t.badgeBg} ${t.borderColor} text-center space-y-1`}
            >
              <span className={`text-xs font-black uppercase ${t.badgeColor} block`}>
                {language === 'en' ? t.titleEn : t.titleBn}
              </span>
              <span className="text-xs font-bold text-slate-700 block">
                {t.minElo === 2000 ? '2000+' : `${t.minElo} - ${t.maxElo}`}
              </span>
              <span className="text-[10px] text-slate-400 block">Elo Rating</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
