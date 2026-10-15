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
  Code2,
  Type,
  ToggleLeft,
  CheckSquare,
  Terminal,
  HelpCircle,
} from 'lucide-react';
import { ExamQuestionType } from '@/models/Exam';

export interface QuestionBreakdown {
  index: number;
  type?: ExamQuestionType;
  question: string;
  options?: string[];
  selectedOption?: number;
  textAnswer?: string;
  codeAnswer?: string;
  codeExecutionResult?: {
    passedCount: number;
    totalCount: number;
    allPassed: boolean;
    details?: string;
  };
  correctAnswer?: number;
  acceptedAnswers?: string[];
  testCases?: { input: string; expectedOutput: string; isHidden?: boolean }[];
  isAttempted?: boolean;
  negativeMarks?: number;
  isCorrect: boolean;
  explanation?: string;
  marks: number;
}

export interface ExamResultCardProps {
  score: number;
  rawEarnedScore?: number;
  totalMarks: number;
  percentage: number;
  passed: boolean;
  timeTakenSeconds: number;
  hasNegativeMarking?: boolean;
  negativeMarkingRate?: number;
  negativeMarksDeducted?: number;
  totalCorrect?: number;
  totalWrong?: number;
  totalSkipped?: number;
  attemptNumber?: number;
  maxAttempts?: number;
  attemptsRemaining?: number;
  canRetake?: boolean;
  breakdown: QuestionBreakdown[];
  onRetake: () => void;
}

export function ExamResultCard({
  score,
  rawEarnedScore,
  totalMarks,
  percentage,
  passed,
  timeTakenSeconds,
  hasNegativeMarking = false,
  negativeMarkingRate = 0.25,
  negativeMarksDeducted = 0,
  totalCorrect,
  totalWrong,
  totalSkipped,
  attemptNumber,
  maxAttempts = 3,
  attemptsRemaining,
  canRetake = true,
  breakdown,
  onRetake,
}: ExamResultCardProps) {
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    if (m === 0) return `${s} সেকেন্ড`;
    return `${m} মিনিট ${s} সেকেন্ড`;
  };

  const correctCount =
    totalCorrect !== undefined
      ? totalCorrect
      : breakdown.filter((b) => b.isCorrect).length;
  const incorrectCount =
    totalWrong !== undefined
      ? totalWrong
      : breakdown.filter((b) => !b.isCorrect && b.isAttempted !== false).length;
  const skippedCount =
    totalSkipped !== undefined
      ? totalSkipped
      : breakdown.filter((b) => !b.isCorrect && b.isAttempted === false).length;

  const displayRawEarned =
    rawEarnedScore !== undefined
      ? rawEarnedScore
      : Math.round((score + negativeMarksDeducted) * 100) / 100;

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

          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Badge
                className={`text-xs font-bold px-3 py-1 ${
                  passed
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                    : 'bg-rose-100 text-rose-800 border-rose-300'
                }`}
              >
                {passed ? 'অভিনন্দন! আপনি উত্তীর্ণ হয়েছেন' : 'দুঃখিত! আরও প্রস্তুতি প্রয়োজন'}
              </Badge>

              {attemptNumber !== undefined && (
                <Badge
                  variant="outline"
                  className="bg-indigo-50 text-indigo-900 border-indigo-300 text-xs px-2.5 py-0.5 font-bold"
                >
                  প্রচেষ্টা: {attemptNumber} / {maxAttempts}
                </Badge>
              )}

              {hasNegativeMarking && (
                <Badge
                  variant="outline"
                  className="bg-amber-50 text-amber-900 border-amber-300 text-xs px-2.5 py-0.5 font-bold"
                >
                  নেগেটিভ মার্কিং সক্রিয় (-{negativeMarkingRate})
                </Badge>
              )}
            </div>

            <h2 className="text-3xl font-extrabold text-slate-900">
              আপনার নেট স্কোর: {score} / {totalMarks} ({percentage}%)
            </h2>

            {hasNegativeMarking && (
              <p className="text-xs font-medium text-slate-600 bg-slate-100 inline-block px-3 py-1 rounded-full border border-slate-200">
                অর্জিত স্কোর: <span className="font-bold text-emerald-700">+{displayRawEarned}</span> | 
                নেগেটিভ কর্তন: <span className="font-bold text-rose-700">-{negativeMarksDeducted}</span> | 
                নেট চূড়ান্ত স্কোর: <span className="font-bold text-slate-900">{score}</span>
              </p>
            )}

            <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto pt-1">
              {passed
                ? 'আপনি এই কুইজে চমৎকার দক্ষতা প্রদর্শন করেছেন। নিচে প্রতিটি প্রশ্নের বিস্তারিত সমাধান ও টেস্ট-কেস বিশ্লেষণ দেখুন।'
                : 'পরবর্তী প্রচেষ্টায় আরও ভালো করতে নিচের সমাধানগুলো ও টেস্ট-কেসের ফলাফল মনোযোগ দিয়ে পর্যালোচনা করুন।'}
            </p>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 max-w-3xl mx-auto pt-2">
            <div className="p-3.5 bg-white rounded-2xl border border-slate-200/80 shadow-2xs space-y-0.5">
              <span className="text-[11px] text-slate-500 font-semibold block">মোট প্রশ্ন</span>
              <span className="text-lg font-extrabold text-slate-900">{breakdown.length} টি</span>
            </div>

            <div className="p-3.5 bg-emerald-50/80 rounded-2xl border border-emerald-200 shadow-2xs space-y-0.5">
              <span className="text-[11px] text-emerald-700 font-semibold block">সঠিক উত্তর</span>
              <span className="text-lg font-extrabold text-emerald-800">{correctCount} টি</span>
            </div>

            <div className="p-3.5 bg-rose-50/80 rounded-2xl border border-rose-200 shadow-2xs space-y-0.5">
              <span className="text-[11px] text-rose-700 font-semibold block">ভুল উত্তর</span>
              <span className="text-lg font-extrabold text-rose-800">{incorrectCount} টি</span>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 shadow-2xs space-y-0.5">
              <span className="text-[11px] text-slate-500 font-semibold block">এড়িয়ে যাওয়া</span>
              <span className="text-lg font-extrabold text-slate-700">{skippedCount} টি</span>
            </div>

            {hasNegativeMarking ? (
              <div className="p-3.5 bg-amber-50/80 rounded-2xl border border-amber-300 shadow-2xs space-y-0.5">
                <span className="text-[11px] text-amber-800 font-semibold block">নেগেটিভ কর্তন</span>
                <span className="text-lg font-extrabold text-rose-700">-{negativeMarksDeducted}</span>
              </div>
            ) : (
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 shadow-2xs space-y-0.5">
                <span className="text-[11px] text-slate-500 font-semibold block">ব্যয়িত সময়</span>
                <span className="text-lg font-extrabold text-slate-900">
                  {formatTime(timeTakenSeconds)}
                </span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            {canRetake && (attemptsRemaining === undefined || attemptsRemaining > 0) ? (
              <Button
                variant="outline"
                onClick={onRetake}
                className="gap-2 border-indigo-200 text-indigo-700 bg-indigo-50/50 hover:bg-indigo-100 rounded-xl text-xs font-semibold"
              >
                <RotateCcw className="w-4 h-4 text-indigo-600" />
                <span>
                  পুনরায় পরীক্ষা দিন{' '}
                  {attemptsRemaining !== undefined
                    ? `(${attemptsRemaining} বার বাকি)`
                    : ''}
                </span>
              </Button>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 rounded-xl border border-slate-200 text-slate-500 text-xs font-semibold">
                <RotateCcw className="w-4 h-4 text-slate-400" />
                <span>
                  সর্বোচ্চ প্রচেষ্টার সীমা সম্পন্ন ({attemptNumber || maxAttempts}/{maxAttempts})
                </span>
              </div>
            )}

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
          {breakdown.map((item, qIdx) => {
            const qType = item.type || 'MCQ';

            return (
              <Card
                key={qIdx}
                className="border border-slate-200 rounded-2xl bg-white shadow-2xs overflow-hidden"
              >
                <CardHeader className="p-4 sm:p-5 pb-3 border-b border-slate-100 bg-slate-50/50 flex flex-row items-center justify-between">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-xs text-slate-700">প্রশ্ন {qIdx + 1}</span>

                    <Badge variant="outline" className="text-[10px] bg-white border-slate-300 text-slate-600">
                      {qType === 'CODE'
                        ? 'কোডিং'
                        : qType === 'SHORT_ANSWER'
                        ? 'সংক্ষিপ্ত উত্তর'
                        : qType === 'TRUE_FALSE'
                        ? 'সত্য/মিথ্যা'
                        : 'MCQ'}
                    </Badge>

                    {item.isCorrect ? (
                      <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[11px] font-bold gap-1 px-2 py-0.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>সঠিক (+{item.marks})</span>
                      </Badge>
                    ) : item.isAttempted === false ? (
                      <Badge className="bg-slate-100 text-slate-600 border-slate-300 text-[11px] font-bold gap-1 px-2 py-0.5">
                        <HelpCircle className="w-3.5 h-3.5" />
                        <span>এড়িয়ে যাওয়া (০ পেনাল্টি)</span>
                      </Badge>
                    ) : (
                      <Badge className="bg-rose-50 text-rose-700 border-rose-200 text-[11px] font-bold gap-1 px-2 py-0.5">
                        <XCircle className="w-3.5 h-3.5" />
                        <span>
                          ভুল {item.negativeMarks ? `(-${item.negativeMarks})` : '(০)'}
                        </span>
                      </Badge>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="p-5 sm:p-6 space-y-4">
                  {/* Question Text */}
                  <div className="text-slate-900 font-semibold text-sm sm:text-base leading-relaxed bg-slate-50/40 p-4 rounded-xl border border-slate-100">
                    <LatexRenderer content={item.question} />
                  </div>

                  {/* FORMAT 1: MCQ Options */}
                  {qType === 'MCQ' && item.options && item.options.length > 0 && (
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
                                  : 'bg-slate-100 text-slate-600 border border-slate-200'
                              }`}
                            >
                              {optionLetter}
                            </div>

                            <div className="text-xs sm:text-sm flex-1 pt-0.5 leading-snug">
                              <LatexRenderer content={opt} />
                            </div>

                            {badgeLabel}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* FORMAT 2: TRUE_FALSE */}
                  {qType === 'TRUE_FALSE' && (
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div
                        className={`p-3 rounded-xl border flex items-center justify-between ${
                          item.correctAnswer === 0
                            ? 'bg-emerald-50 border-emerald-400 text-emerald-900 font-bold'
                            : item.selectedOption === 0 && !item.isCorrect
                            ? 'bg-rose-50 border-rose-400 text-rose-900'
                            : 'bg-white border-slate-200 text-slate-600'
                        }`}
                      >
                        <span>সত্য (True)</span>
                        {item.correctAnswer === 0 && (
                          <Badge className="bg-emerald-600 text-white text-[10px]">সঠিক উত্তর</Badge>
                        )}
                        {item.selectedOption === 0 && !item.isCorrect && (
                          <Badge className="bg-rose-600 text-white text-[10px]">আপনার উত্তর</Badge>
                        )}
                      </div>

                      <div
                        className={`p-3 rounded-xl border flex items-center justify-between ${
                          item.correctAnswer === 1
                            ? 'bg-emerald-50 border-emerald-400 text-emerald-900 font-bold'
                            : item.selectedOption === 1 && !item.isCorrect
                            ? 'bg-rose-50 border-rose-400 text-rose-900'
                            : 'bg-white border-slate-200 text-slate-600'
                        }`}
                      >
                        <span>মিথ্যা (False)</span>
                        {item.correctAnswer === 1 && (
                          <Badge className="bg-emerald-600 text-white text-[10px]">সঠিক উত্তর</Badge>
                        )}
                        {item.selectedOption === 1 && !item.isCorrect && (
                          <Badge className="bg-rose-600 text-white text-[10px]">আপনার উত্তর</Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {/* FORMAT 3: SHORT_ANSWER */}
                  {qType === 'SHORT_ANSWER' && (
                    <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                      <div>
                        <span className="text-slate-500 font-semibold block mb-0.5">আপনার প্রদত্ত উত্তর:</span>
                        <div
                          className={`p-2.5 rounded-lg border font-mono font-bold flex items-center justify-between ${
                            item.isCorrect
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                              : 'bg-rose-50 border-rose-300 text-rose-900'
                          }`}
                        >
                          <span>{item.textAnswer || '(কোনো উত্তর দেওয়া হয়নি)'}</span>
                          <span className="text-[11px]">
                            {item.isCorrect ? '✓ পাস করেছে' : '✗ অমিল'}
                          </span>
                        </div>
                      </div>

                      {item.acceptedAnswers && item.acceptedAnswers.length > 0 && (
                        <div className="pt-1">
                          <span className="text-slate-500 font-semibold block mb-1">গ্রহণযোগ্য সঠিক উত্তরসমূহ:</span>
                          <div className="flex flex-wrap gap-1">
                            {item.acceptedAnswers.map((ans, aIdx) => (
                              <Badge key={aIdx} className="bg-emerald-100 text-emerald-800 text-[11px] border border-emerald-200">
                                {ans}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* FORMAT 4: CODE EVALUATION */}
                  {qType === 'CODE' && (
                    <div className="space-y-3 bg-slate-900 p-4 rounded-xl text-white text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-emerald-400 flex items-center gap-1.5 font-bold">
                          <Terminal className="w-4 h-4 text-indigo-400" />
                          <span>আপনার জমাকৃত জাভাস্ক্রিপ্ট কোড:</span>
                        </span>
                        {item.codeExecutionResult && (
                          <Badge
                            className={`text-[10px] ${
                              item.codeExecutionResult.allPassed
                                ? 'bg-emerald-600 text-white'
                                : 'bg-rose-600 text-white'
                            }`}
                          >
                            {item.codeExecutionResult.passedCount} / {item.codeExecutionResult.totalCount} টেস্ট কেস পাস
                          </Badge>
                        )}
                      </div>

                      <pre className="bg-slate-950 p-3 rounded-lg overflow-x-auto text-[11px] font-mono text-slate-300 border border-slate-800 leading-relaxed">
                        <code>{item.codeAnswer || '// কোনো কোড জমা দেওয়া হয়নি'}</code>
                      </pre>

                      {item.testCases && item.testCases.length > 0 && (
                        <div className="pt-2 border-t border-slate-800 space-y-1.5">
                          <span className="text-[11px] font-bold text-slate-400 block">
                            ভেরিফিকেশন টেস্ট-কেসের ফলাফল:
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px] font-mono">
                            {item.testCases.map((tc, tcIdx) => (
                              <div
                                key={tcIdx}
                                className="bg-slate-800/80 p-2 rounded border border-slate-700/80 space-y-0.5"
                              >
                                <div>
                                  <span className="text-slate-400">Input: </span>
                                  <span className="text-slate-200">{tc.input}</span>
                                </div>
                                <div>
                                  <span className="text-slate-400">Expected: </span>
                                  <span className="text-emerald-400 font-bold">{tc.expectedOutput}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Explanation Box */}
                  {item.explanation && (
                    <div className="bg-amber-50/60 border border-amber-200/80 rounded-xl p-4 space-y-1">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                        <Lightbulb className="w-4 h-4 text-amber-600" />
                        <span>সমাধান ও ব্যাখ্যা:</span>
                      </div>
                      <div className="text-xs sm:text-sm text-slate-800 leading-relaxed pl-5.5">
                        <LatexRenderer content={item.explanation} />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
