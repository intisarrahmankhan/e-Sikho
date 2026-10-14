'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Sparkles,
  Target,
  ArrowRight,
  Star,
  Clock,
  Layers,
  CheckCircle2,
  SlidersHorizontal,
  Flame,
  Award,
  Zap,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useLanguage } from '@/context/LanguageContext';
import { RecommendedCourseItem } from '@/actions/recommendations';

interface PersonalizedRecommendationsProps {
  recommendations: RecommendedCourseItem[];
  studentProfile?: {
    targetTrack: string;
    elo: number;
    interests: string[];
    skills: string[];
    academicBackground?: string;
  };
}

export function PersonalizedRecommendations({
  recommendations,
  studentProfile,
}: PersonalizedRecommendationsProps) {
  const { language } = useLanguage();

  if (!recommendations || recommendations.length === 0) {
    return null;
  }

  const track = studentProfile?.targetTrack || 'Fullstack Web Development';
  const elo = studentProfile?.elo || 1200;

  return (
    <div className="space-y-4 rounded-3xl bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-950 p-6 md:p-8 text-white shadow-xl relative overflow-hidden border border-indigo-500/20">
      {/* Decorative backdrop elements */}
      <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 -mb-12 w-80 h-80 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10 border-b border-white/10 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-extrabold uppercase tracking-wider">
              <Sparkles className="h-3.5 w-3.5 text-amber-400 animate-pulse" />
              <span>{language === 'en' ? 'AI Smart Recommendations' : 'স্মার্ট কোর্স রেকমেন্ডেশন'}</span>
            </span>

            <span className="text-xs text-slate-400 hidden sm:inline">•</span>

            <span className="text-xs text-slate-300 font-medium hidden sm:inline">
              {language === 'en' ? 'Track: ' : 'ট্র্যাক: '}
              <strong className="text-indigo-200">{track}</strong>
            </span>
          </div>

          <h2 className="text-xl md:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            {language === 'en' ? 'Curated Specifically for Your Skill Level' : 'আপনার আগ্রহ ও স্কিল লেভেলের জন্য বিশেষ কোর্সসমূহ'}
          </h2>
          <p className="text-xs text-slate-300 max-w-2xl">
            {language === 'en'
              ? `Calculated using your target track, rating tier (${elo} Elo), and academic background for optimal career progression.`
              : `আপনার ক্যারিয়ার লক্ষ্য, বর্তমান রেটিং টিয়ার (${elo} Elo) এবং পছন্দের বিষয়ের ওপর ভিত্তি করে সর্বোচ্চ ম্যাচিং স্কোর প্রাপ্ত কোর্স।`}
          </p>
        </div>

        {/* Action to refine profile */}
        <div className="shrink-0">
          <Link href="/student/settings">
            <Button
              variant="outline"
              size="sm"
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs font-bold rounded-xl gap-2 backdrop-blur-sm"
            >
              <SlidersHorizontal className="h-3.5 w-3.5 text-indigo-300" />
              <span>{language === 'en' ? 'Tune Interests & Skills' : 'আগ্রহ ও স্কিল পরিবর্তন'}</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Recommendations Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10 pt-2">
        {recommendations.map((course) => {
          const isTop = course.isTopPick;
          const displayTitle = language === 'en' && course.titleEn ? course.titleEn : course.title;
          const displayTagline = language === 'en' && course.taglineEn ? course.taglineEn : course.tagline;
          const displayCategory = language === 'en'
            ? (course.category === 'web-dev' ? 'Web Development'
              : course.category === 'data-science' ? 'Data Science & AI'
              : course.category === 'programming' ? 'Programming & DSA'
              : course.category === 'system-design' ? 'System Design'
              : course.category === 'app-dev' ? 'App Development'
              : course.categoryBangla)
            : course.categoryBangla;

          // Match pill color
          const matchColor =
            course.matchScore >= 90
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40'
              : course.matchScore >= 75
              ? 'bg-indigo-500/20 text-indigo-300 border-indigo-400/40'
              : 'bg-amber-500/20 text-amber-300 border-amber-400/40';

          return (
            <div
              key={course.id}
              className={`rounded-2xl flex flex-col justify-between transition-all duration-300 backdrop-blur-md overflow-hidden ${
                isTop
                  ? 'bg-white/10 border-2 border-indigo-400 shadow-lg shadow-indigo-500/10 hover:bg-white/15'
                  : 'bg-white/5 border border-white/10 hover:border-white/20 hover:bg-white/10'
              }`}
            >
              {/* Card Image Banner */}
              <div className="relative aspect-video w-full overflow-hidden bg-slate-800">
                <img
                  src={course.thumbnailUrl}
                  alt={displayTitle}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />

                {/* Match percentage pill */}
                <div className="absolute top-2.5 right-2.5">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black border backdrop-blur-md shadow-md ${matchColor}`}
                  >
                    <Zap className="h-3 w-3 fill-current" />
                    <span>{course.matchScore}% {language === 'en' ? 'Match' : 'ম্যাচ'}</span>
                  </span>
                </div>

                {isTop && (
                  <div className="absolute top-2.5 left-2.5">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-600 text-white text-[10px] font-extrabold uppercase tracking-wide shadow-md">
                      <Flame className="h-3 w-3 fill-current" />
                      <span>{language === 'en' ? 'TOP TRACK PICK' : 'সেরা পছন্দ'}</span>
                    </span>
                  </div>
                )}
              </div>

              {/* Card Content */}
              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span className="text-indigo-300 font-semibold">{displayCategory}</span>
                    <span className="flex items-center gap-1 text-amber-400 font-bold">
                      <Star className="h-3 w-3 fill-current" />
                      <span>{course.rating}</span>
                    </span>
                  </div>

                  <h3 className="font-bold text-sm text-white line-clamp-2 leading-snug group-hover:text-indigo-300 transition">
                    {displayTitle}
                  </h3>

                  <p className="text-[11px] text-slate-300 line-clamp-2 leading-relaxed">
                    {displayTagline || course.description}
                  </p>

                  {/* Why it matches tags */}
                  <div className="space-y-1 pt-1">
                    {course.matchReasons.slice(0, 2).map((r, i) => (
                      <div
                        key={i}
                        className="text-[10px] text-indigo-200/90 bg-indigo-950/60 border border-indigo-500/30 rounded-lg px-2 py-1 flex items-start gap-1.5"
                      >
                        <CheckCircle2 className="h-3 w-3 text-emerald-400 shrink-0 mt-0.5" />
                        <span className="line-clamp-1">{language === 'en' ? r.en : r.bn}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer price & CTA */}
                <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-2">
                  <div>
                    <div className="text-base font-black text-white">৳{course.price}</div>
                    {course.originalPrice > course.price && (
                      <div className="text-[10px] text-slate-400 line-through">
                        ৳{course.originalPrice}
                      </div>
                    )}
                  </div>

                  <Link href={`/courses/${course.id}`} className="shrink-0">
                    <Button
                      size="sm"
                      className={`text-xs font-bold rounded-xl px-3.5 py-1.5 flex items-center gap-1.5 ${
                        isTop
                          ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30'
                          : 'bg-white text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      <span>{language === 'en' ? 'View Course' : 'বিস্তারিত'}</span>
                      <ArrowRight className="h-3 w-3" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
