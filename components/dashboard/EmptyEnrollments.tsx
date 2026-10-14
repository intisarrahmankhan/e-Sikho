'use client';

import React from "react";
import { BookOpen, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";

export function EmptyEnrollments() {
  const { language } = useLanguage();

  return (
    <div className="flex flex-col items-center justify-center py-14 px-6 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50 space-y-4">
      <div className="h-16 w-16 rounded-2xl bg-primary-100/80 border border-primary-200/80 flex items-center justify-center text-primary-600 shadow-sm">
        <BookOpen className="w-8 h-8" />
      </div>
      <div className="space-y-1.5 max-w-md">
        <h3 className="text-lg font-bold text-slate-900">
          {language === 'en' ? 'No Enrolled Courses Yet' : 'এখনো কোনো কোর্সে এনরোল করেননি'}
        </h3>
        <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
          {language === 'en'
            ? 'Pick your favorite courses to start learning, and track your progress and quizzes on your dashboard.'
            : 'আপনার পছন্দমতো কোর্স বেছে নিয়ে শেখা শুরু করুন এবং ড্যাশবোর্ডে অগ্রগতি ও কুইজ ট্র্যাক করুন।'}
        </p>
      </div>
      <Link href="/courses">
        <Button className="bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md gap-2">
          <Sparkles className="h-4 w-4" />
          <span>{language === 'en' ? 'Explore Course Catalog' : 'কোর্স ক্যাটালগ দেখুন'}</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </Link>
    </div>
  );
}

export default EmptyEnrollments;
