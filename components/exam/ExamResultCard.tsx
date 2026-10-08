'use client';

import React from 'react';
import Link from 'next/link';
import { LatexRenderer } from './LatexRenderer';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  Trophy,
  CheckCircle2,
  XCircle,
  RotateCcw,
  BookOpen,
  ArrowRight,
  Lightbulb,
} from 'lucide-react';

export interface QuestionBreakdown {
  index: number;
  question: string;
  options: string[];
  selectedOption: number;
  correctAnswer: number;
  isCorrect: boolean;
  explanation?: string;
  marks: number;
}

export interface ExamResultCardProps {
  score: number;
  totalMarks: number;
  percentage: number;
  passed: boolean;
  timeTakenSeconds: number;
  breakdown: QuestionBreakdown[];
  onRetake: () => void;
}

export function ExamResultCard({
  score,
  totalMarks,
  percentage,
  passed,
  timeTakenSeconds,
  breakdown,
  onRetake,
}: ExamResultCardProps) {
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    if (m === 0) return `${s} সেকেন্ড`;
    return `${m} মিনিট ${s} সেকেন্ড`;
  };

  const correctCount = breakdown.filter((b) => b.isCorrect).length;
  const incorrectCount = breakdown.length - correctCount;

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Result Hero Banner */}
      <Card
        className={`border overflow-hidden rounded-3xl shadow-sm ${
          passed
            ? 'border-emerald-200 bg-gradient-to-b from-emerald-50/70 to-white'
            : 'border-rose-200 bg-gradient-to-b from-rose-50/70 to-white'
        }`}
      >
        <CardContent className="p-8 text-center space-y-6">
          <div
            className={`w-20 h-20 rounded-full mx-auto flex items-center justify-center shadow-md ${
              passed
                ? 'bg-emerald-600 text-white shadow-emerald-200'
                : 'bg-rose-500 text-white shadow-rose-200'
            }`}
          >
            {passed ? <Trophy className="w-10 h-10" /> : <XCircle className="w-10 h-10" />}
          </div>

          <div className="space-y-1.5">
            <Badge
              className={`text-xs font-bold px-3 py-1 ${
                passed
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                  : 'bg-rose-100 text-rose-800 border-rose-300'
              }`}
            >
              {passed ? 'অভিনন্দন! আপনি উত্তীর্ণ হয়েছেন' : 'দুঃখিত! আরও প্রস্তুতি প্রয়োজন'}
            </Badge>

            <h2 className="text-3xl font-extrabold text-slate-900">
              আপনার স্কোর: {score} / {totalMarks} ({percentage}%)
            </h2>

            <p className="text-xs sm:text-sm text-slate-600">
              {passed
                ? 'আপনি এই কুইজে চমৎকার দক্ষতা প্রদর্শন করেছেন। নিচে প্রতিটি প্রশ্নের বিস্তারিত সমাধান দেখুন।'
                : 'পরবর্তী প্রচেষ্টায় আরও ভালো করতে নিচের সমাধানগুলো মনোযোগ দিয়ে পর্যালোচনা করুন।'}
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto pt-2">
            <div className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-2xs">
              <span className="text-[11px] text-slate-400 font-medium block">সঠিক উত্তর</span>
              <span className="text-lg font-bold text-emerald-600">{correctCount} টি</span>
            </div>
            <div className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-2xs">
              <span className="text-[11px] text-slate-400 font-medium block">ভুল / বাদ</span>
              <span className="text-lg font-bold text-rose-600">{incorrectCount} টি</span>
            </div>
            <div className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-2xs">
              <span className="text-[11px] text-slate-400 font-medium block">সময় লেগেছে</span>
              <span className="text-lg font-bold text-slate-700">{formatTime(timeTakenSeconds)}</span>
            </div>
            <div className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-2xs">
              <span className="text-[11px] text-slate-400 font-medium block">সঠিকতার হার</span>
              <span className="text-lg font-bold text-primary-600">{percentage}%</span>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Button
              onClick={onRetake}
              variant="outline"
              className="gap-2 border-slate-300 rounded-xl text-xs px-5 py-2.5 font-semibold bg-white"
            >
              <RotateCcw className="w-4 h-4 text-slate-600" />
              <span>পুনরায় পরীক্ষা দিন</span>
            </Button>

            <Link href="/exams">
              <Button className="gap-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs px-5 py-2.5 font-semibold shadow-sm">
                <span>সকল পরীক্ষা দেখুন</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Solutions Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary-600" />
            <span>প্রশ্ন ও বিস্তারিত সমাধান পর্যালোচনা (Solutions & Explanations)</span>
          </h3>
          <span className="text-xs text-slate-500 font-medium">
            মোট {breakdown.length} টি প্রশ্ন
          </span>
        </div>

        <div className="space-y-5">
          {breakdown.map((item, qIdx) => (
            <Card
              key={qIdx}
              className="border border-slate-200 rounded-2xl bg-white shadow-2xs overflow-hidden"
            >
              <CardHeader className="p-4 sm:p-5 pb-3 border-b border-slate-100 bg-slate-50/50 flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-slate-700">প্রশ্ন {qIdx + 1}</span>
                  {item.isCorrect ? (
                    <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[11px] font-bold gap-1 px-2 py-0.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>সঠিক (+{item.marks})</span>
                    </Badge>
                  ) : (
                    <Badge className="bg-rose-50 text-rose-700 border-rose-200 text-[11px] font-bold gap-1 px-2 py-0.5">
                      <XCircle className="w-3.5 h-3.5" />
                      <span>ভুল (০)</span>
                    </Badge>
                  )}
                </div>
              </CardHeader>

              <CardContent className="p-5 sm:p-6 space-y-4">
                {/* Question Text */}
                <div className="text-slate-900 font-semibold text-sm sm:text-base leading-relaxed bg-slate-50/40 p-4 rounded-xl border border-slate-100">
                  <LatexRenderer content={item.question} />
                </div>

                {/* Options List */}
                <div className="space-y-2">
                  {item.options.map((opt, optIdx) => {
                    const isSelected = item.selectedOption === optIdx;
                    const isCorrect = item.correctAnswer === optIdx;
                    const optionLetter = String.fromCharCode(65 + optIdx);

                    let optionStyle = 'bg-white border-slate-200 text-slate-700';
                    let badgeLabel = null;

                    if (isCorrect) {
                      optionStyle = 'bg-emerald-50/70 border-emerald-400 text-emerald-950 font-medium';
                      badgeLabel = (
                        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md ml-auto shrink-0">
                          সঠিক উত্তর
                        </span>
                      );
                    } else if (isSelected && !item.isCorrect) {
                      optionStyle = 'bg-rose-50/70 border-rose-400 text-rose-950 font-medium';
                      badgeLabel = (
                        <span className="text-[11px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-md ml-auto shrink-0">
                          আপনার উত্তর
                        </span>
                      );
                    }

                    return (
                      <div
                        key={optIdx}
                        className={`flex items-start gap-3 p-3.5 rounded-xl border transition ${optionStyle}`}
                      >
                        <div
                          className={`w-6 h-6 rounded-md flex items-center justify-center font-bold text-xs shrink-0 ${
                            isCorrect
                              ? 'bg-emerald-600 text-white'
                              : isSelected
                              ? 'bg-rose-600 text-white'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {optionLetter}
                        </div>
                        <div className="text-xs sm:text-sm flex-1 pt-0.5">
                          <LatexRenderer content={opt} />
                        </div>
                        {badgeLabel}
                      </div>
                    );
                  })}
                </div>

                {/* Explanation */}
                {item.explanation && (
                  <div className="bg-amber-50/60 border border-amber-200/80 rounded-xl p-4 space-y-1.5 text-xs text-amber-950">
                    <div className="flex items-center gap-1.5 font-bold text-amber-900">
                      <Lightbulb className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>ব্যাখ্যা ও সমাধান (LaTeX সূত্রসহ):</span>
                    </div>
                    <div className="leading-relaxed pl-5 text-slate-800">
                      <LatexRenderer content={item.explanation} />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ExamResultCard;
