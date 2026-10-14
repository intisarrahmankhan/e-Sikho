'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Trophy,
  Flame,
  ArrowRight,
  Sparkles,
  Zap,
  Timer,
  CheckCircle2,
  Users,
  Award,
  ChevronRight,
  TrendingUp,
  BrainCircuit,
  Code2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useLanguage } from '@/context/LanguageContext';
import { getHomepageContestsAction } from '@/actions/contest';

export function HomeContestsSection() {
  const { language } = useLanguage();
  const [contests, setContests] = useState<any[]>([]);
  const [userBackground, setUserBackground] = useState<string>('Computer Science & Engineering (CSE)');
  const [activeFilter, setActiveFilter] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadContests() {
      try {
        const res = await getHomepageContestsAction();
        if (res.success && res.contests) {
          setContests(res.contests);
          if (res.userBackground) {
            setUserBackground(res.userBackground);
          }
        }
      } catch (err) {
        console.error('Failed to load homepage contests:', err);
      } finally {
        setLoading(false);
      }
    }
    loadContests();
  }, []);

  const filters = [
    { id: 'ALL', labelEn: 'All Arenas', labelBn: 'সকল অ্যারেনা' },
    { id: 'CSE', labelEn: 'Computer Science (CS/SWE)', labelBn: 'কম্পিউটার সায়েন্স (CS/SWE)' },
    { id: 'DATA_SCIENCE', labelEn: 'Data Science & AI', labelBn: 'ডাটা সায়েন্স ও এআই' },
    { id: 'BUSINESS', labelEn: 'FinTech & Analytics', labelBn: 'ফিনটেক ও অ্যানালিটিক্স' },
    { id: 'GENERAL', labelEn: 'General Logic & Aptitude', labelBn: 'জেনারেল লজিক ও অ্যাপ্টিটিউড' },
  ];

  const filteredContests = contests.filter((c) => {
    if (activeFilter === 'ALL') return true;
    const tg = (c.targetBackgrounds || []).map((t: string) => t.toUpperCase());
    return tg.includes(activeFilter);
  });

  return (
    <section className="space-y-6 pt-4">
      {/* ── Section Header ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 border border-amber-200/80 px-3 py-1 text-xs font-bold text-amber-800 mb-2">
            <Trophy className="h-3.5 w-3.5 text-amber-600" />
            <span>
              {language === 'en'
                ? 'Competitive Problem Solving Arena & Grand Prix'
                : 'কম্পিটিটিভ প্রবলেম সলভিং অ্যারেনা ও জাতীয় কনটেস্ট'}
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            {language === 'en' ? 'Live Skill Contests & Elo Battles' : 'লাইভ স্কিল কনটেস্ট ও ইলো রেটিং যুদ্ধ'}
          </h2>
          <p className="mt-1.5 text-sm text-gray-600 max-w-2xl leading-relaxed">
            {language === 'en'
              ? 'Tackle complex algorithmic puzzles, systems architecture challenges, and quantitative models. Your Elo rating fluctuates (+/-) dynamically based on performance against problem benchmarks!'
              : 'জটিল অ্যালগরিদম, সিস্টেম ডিজাইন ও ডাটা সায়েন্সের সমস্যার সমাধান করুন। পারফরম্যান্স অনুযায়ী আপনার ইলো রেটিং কমবে বা বাড়বে।'}
          </p>
        </div>

        <Link href="/contests">
          <Button
            variant="outline"
            className="border-primary-200 text-primary-700 hover:bg-primary-50 font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 shrink-0"
          >
            <span>{language === 'en' ? 'View All Contests' : 'সকল কনটেস্ট দেখুন'}</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>

      {/* ── Personalization Notice Banner ── */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-4.5 sm:p-5 shadow-lg border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="h-10 w-10 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400 shrink-0">
            <Flame className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-slate-300">
                {language === 'en' ? 'Discipline-Aware Prioritization:' : 'একাডেমিক ট্র্যাক ভিত্তিক অগ্রাধিকার:'}
              </span>
              <span className="text-xs font-black text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded-md">
                {userBackground}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {language === 'en'
                ? 'Contests matched to your academic background are prioritized at the very top of your feed with special badges.'
                : 'আপনার ব্যাকগ্রাউন্ডের সাথে সামঞ্জস্যপূর্ণ কনটেস্টসমূহ শীর্ষে অগ্রাধিকার দিয়ে প্রদর্শিত হচ্ছে।'}
            </p>
          </div>
        </div>

        <Link href="/student/settings" className="shrink-0">
          <span className="text-xs font-bold text-indigo-300 hover:text-white underline underline-offset-4 transition">
            {language === 'en' ? 'Change Background →' : 'ব্যাকগ্রাউন্ড পরিবর্তন →'}
          </span>
        </Link>
      </div>

      {/* ── Discipline Filter Pills ── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {filters.map((f) => (
          <button
            key={f.id}
            onClick={() => setActiveFilter(f.id)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
              activeFilter === f.id
                ? 'bg-primary-600 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            {language === 'en' ? f.labelEn : f.labelBn}
          </button>
        ))}
      </div>

      {/* ── Contests Cards Grid ── */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 rounded-2xl bg-slate-100 animate-pulse border border-slate-200" />
          ))}
        </div>
      ) : filteredContests.length === 0 ? (
        <div className="py-12 text-center bg-white rounded-2xl border border-slate-200 p-8">
          <Trophy className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-800">
            {language === 'en' ? 'No contests in this discipline filter' : 'এই ক্যাটাগরিতে কোনো কনটেস্ট পাওয়া যায়নি'}
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            {language === 'en' ? 'Select "All Arenas" to explore other problem sets.' : 'অন্যান্য সমস্যা দেখতে "সকল অ্যারেনা" নির্বাচন করুন।'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredContests.map((c) => {
            const isHighPriority = c.priority === 'HIGH';

            return (
              <div
                key={c.id}
                className={`relative rounded-2xl p-5.5 transition-all duration-200 flex flex-col justify-between ${
                  isHighPriority
                    ? 'bg-gradient-to-br from-amber-50/50 via-white to-orange-50/30 border-2 border-amber-400 shadow-md hover:shadow-lg'
                    : 'bg-white border border-slate-200 hover:border-slate-300 shadow-sm hover:shadow-md'
                }`}
              >
                {/* Priority ribbon badge */}
                {isHighPriority && (
                  <div className="absolute -top-3 left-4 bg-gradient-to-r from-rose-600 to-amber-600 text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-sm flex items-center gap-1">
                    <Flame className="h-3 w-3" />
                    <span>{language === 'en' ? 'TOP PRIORITY MATCH' : 'টপ প্রায়োরিটি ট্র্যাক'}</span>
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between gap-2 mb-3 pt-1">
                    <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md">
                      {c.category}
                    </span>

                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      LIVE
                    </span>
                  </div>

                  <h3 className="font-extrabold text-base text-slate-900 leading-snug group-hover:text-primary-600 transition">
                    {c.title}
                  </h3>

                  <p className="text-xs text-slate-600 mt-2 line-clamp-2 leading-relaxed">
                    {c.shortSummary || c.description}
                  </p>

                  {/* Benchmark & Specs */}
                  <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="text-[10px] text-slate-400 font-medium">
                        {language === 'en' ? 'Difficulty Benchmark' : 'বেঞ্চমার্ক ইলো'}
                      </div>
                      <div className="font-extrabold text-slate-800 mt-0.5 flex items-center gap-1">
                        <Award className="h-3.5 w-3.5 text-amber-500" />
                        <span>{c.benchmarkRating} Elo</span>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="text-[10px] text-slate-400 font-medium">
                        {language === 'en' ? 'Duration & Problems' : 'সময় ও সমস্যা'}
                      </div>
                      <div className="font-extrabold text-slate-800 mt-0.5 flex items-center gap-1">
                        <Timer className="h-3.5 w-3.5 text-indigo-500" />
                        <span>{c.durationMinutes}m • {c.problemCount || 3}Q</span>
                      </div>
                    </div>
                  </div>

                  {c.prizePool && (
                    <div className="mt-3 text-xs font-semibold text-amber-800 bg-amber-50/80 border border-amber-200/60 rounded-xl px-3 py-1.5 flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                      <span>{c.prizePool}</span>
                    </div>
                  )}
                </div>

                {/* Footer CTA */}
                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                  <div className="text-[11px] text-slate-500 flex items-center gap-1">
                    <Users className="h-3.5 w-3.5 text-slate-400" />
                    <span>{c.totalParticipants || 24} {language === 'en' ? 'competing' : 'অংশগ্রহণকারী'}</span>
                  </div>

                  <Link href={`/contests/${c.slug}`}>
                    <Button
                      size="sm"
                      className={`text-xs font-bold rounded-xl px-4 py-2 flex items-center gap-1.5 transition ${
                        isHighPriority
                          ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-sm'
                          : 'bg-primary-600 hover:bg-primary-700 text-white'
                      }`}
                    >
                      <span>{language === 'en' ? 'Enter Arena' : 'অংশগ্রহণ করুন'}</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Dynamic Elo Logic Explainer ── */}
      <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/70 via-white to-violet-50/70 p-5 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="h-9 w-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shrink-0 mt-0.5">
            <Zap className="h-4.5 w-4.5" />
          </div>
          <div>
            <h4 className="font-bold text-xs text-indigo-950 uppercase tracking-wide">
              {language === 'en' ? 'How the Competitive Elo Rating System Works' : 'ইলো রেটিং সিস্টেমের কার্যপ্রণালী'}
            </h4>
            <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
              {language === 'en'
                ? 'Your rating is not just an accumulating XP counter! It calculates your expected performance against each contest benchmark. Scoring above expectation increases your Elo (+), while dropping below expectation decreases your rating (-). Completed courses and problem solve counts permanently elevate your mastery base.'
                : 'এটি কেবল সাধারণ এক্সপি নয়! প্রতিটি কনটেস্টের বেঞ্চমার্কের তুলনায় আপনার পারফরম্যান্স পরিমাপ করা হয়। ভালো করলে রেটিং বাড়বে (+), আর প্রত্যাশার চেয়ে খারাপ হলে রেটিং কমবে (-)। কোর্স সমাপ্তি ও সমস্যা সমাধান স্থায়ী অভিজ্ঞতা নিশ্চিত করে।'}
            </p>
          </div>
        </div>

        <Link href="/contests" className="shrink-0">
          <Button
            size="sm"
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-sm"
          >
            {language === 'en' ? 'Join Competitions →' : 'প্রতিযোগিতায় নামুন →'}
          </Button>
        </Link>
      </div>
    </section>
  );
}
