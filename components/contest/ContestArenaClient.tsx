'use client';

import React, { useState, useEffect, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Timer,
  Trophy,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  HelpCircle,
  TrendingUp,
  TrendingDown,
  Award,
  Zap,
  BookOpen,
  RotateCcw,
  Sparkles,
  AlertTriangle,
  Loader2,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { LatexRenderer } from '@/components/exam/LatexRenderer';
import { submitContestAction } from '@/actions/contest';
import { useLanguage } from '@/context/LanguageContext';

interface ContestProblem {
  id: string;
  index: number;
  title: string;
  statement: string;
  category: string;
  difficultyRating: number;
  points: number;
  options: string[];
  explanation?: string;
  correctAnswer?: number;
}

interface ContestArenaClientProps {
  contest: {
    id: string;
    title: string;
    slug: string;
    benchmarkRating: number;
    durationMinutes: number;
    category: string;
    problems: ContestProblem[];
  };
}

export function ContestArenaClient({ contest }: ContestArenaClientProps) {
  const { language } = useLanguage();
  const router = useRouter();

  const totalDurationSeconds = (contest.durationMinutes || 45) * 60;
  const [timeLeft, setTimeLeft] = useState(totalDurationSeconds);
  const [currentProblemIdx, setCurrentProblemIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<any | null>(null);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  // Timer countdown
  useEffect(() => {
    if (submissionResult) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleSubmitAnswers();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [submissionResult]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSelectOption = (problemIdx: number, optionIdx: number) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [problemIdx]: optionIdx,
    }));
  };

  const handleSubmitAnswers = async () => {
    if (isSubmitting || submissionResult) return;
    setIsSubmitting(true);

    try {
      const timeTaken = totalDurationSeconds - timeLeft;
      const res = await submitContestAction({
        contestSlug: contest.slug,
        answers: selectedAnswers,
        timeTakenSeconds: timeTaken,
      });

      if (res.success && res.result) {
        setSubmissionResult(res.result);
      } else {
        alert(res.error || 'Failed to submit contest');
      }
    } catch (err) {
      console.error('Error submitting contest:', err);
      alert('Network error while evaluating submission.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentProblem = contest.problems[currentProblemIdx] || contest.problems[0];
  const answeredCount = Object.keys(selectedAnswers).length;
  const totalCount = contest.problems.length;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-20 space-y-6">
      {/* ── Top Bar ── */}
      <div className="sticky top-16 z-20 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200 p-4 shadow-sm flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 font-black">
            <Trophy className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xs sm:text-sm font-extrabold text-slate-900 line-clamp-1">
              {contest.title}
            </h2>
            <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500">
              <span className="font-bold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                Benchmark: {contest.benchmarkRating} Elo
              </span>
              <span>•</span>
              <span>
                {language === 'en' ? 'Answered' : 'উত্তর দিয়েছেন'}: {answeredCount}/{totalCount}
              </span>
            </div>
          </div>
        </div>

        {/* Timer & Submit */}
        <div className="flex items-center gap-3 shrink-0">
          <div
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-mono text-xs font-black shadow-sm ${
              timeLeft < 300
                ? 'bg-rose-50 text-rose-600 border border-rose-200 animate-pulse'
                : 'bg-slate-900 text-white'
            }`}
          >
            <Timer className="h-3.5 w-3.5" />
            <span>{formatTimer(timeLeft)}</span>
          </div>

          {!submissionResult && (
            <Button
              onClick={handleSubmitAnswers}
              disabled={isSubmitting}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-5 py-2 rounded-xl flex items-center gap-1.5 shadow-sm"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              <span>{language === 'en' ? 'Submit Arena' : 'সাবমিট করুন'}</span>
            </Button>
          )}
        </div>
      </div>

      {/* ── Problem Navigation Pills ── */}
      {!submissionResult && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {contest.problems.map((p, idx) => {
            const isAnswered = selectedAnswers[idx] !== undefined;
            const isCurrent = currentProblemIdx === idx;

            return (
              <button
                key={p.id}
                onClick={() => setCurrentProblemIdx(idx)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
                  isCurrent
                    ? 'bg-primary-600 text-white shadow-sm ring-2 ring-primary-500/20'
                    : isAnswered
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                <span>
                  {language === 'en' ? `Problem ${String.fromCharCode(65 + idx)}` : `সমস্যা ${String.fromCharCode(65 + idx)}`}
                </span>
                {isAnswered && (
                  <CheckCircle2
                    className={`h-3.5 w-3.5 ${isCurrent ? 'text-white' : 'text-emerald-600'}`}
                  />
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* ── Main Problem View (When NOT submitted) ── */}
      {!submissionResult && currentProblem && (
        <div className="space-y-6">
          <Card className="rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
            {/* Problem Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-black uppercase text-indigo-600 tracking-wider">
                  {currentProblem.category}
                </span>
                <h3 className="text-lg font-extrabold text-slate-900 mt-0.5">
                  {currentProblem.title}
                </h3>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                  {currentProblem.points} Pts
                </span>
                <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                  {currentProblem.difficultyRating} Diff
                </span>
              </div>
            </div>

            {/* LaTeX Statement */}
            <div className="prose prose-slate max-w-none text-sm text-slate-800 leading-relaxed font-sans">
              <LatexRenderer content={currentProblem.statement} />
            </div>

            {/* Options Selection */}
            <div className="space-y-3 pt-2">
              <label className="text-xs font-bold text-slate-700 block uppercase tracking-wider">
                {language === 'en' ? 'Select Verified Solution / Deduction:' : 'সঠিক সমাধান নির্বাচন করুন:'}
              </label>

              <div className="space-y-2.5">
                {currentProblem.options.map((opt, optIdx) => {
                  const isSelected = selectedAnswers[currentProblemIdx] === optIdx;

                  return (
                    <button
                      key={optIdx}
                      onClick={() => handleSelectOption(currentProblemIdx, optIdx)}
                      className={`w-full text-left p-4 rounded-2xl border transition flex items-start gap-3.5 ${
                        isSelected
                          ? 'border-primary-600 bg-primary-50/70 shadow-sm ring-1 ring-primary-600'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div
                        className={`h-6 w-6 rounded-full border flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold ${
                          isSelected
                            ? 'border-primary-600 bg-primary-600 text-white'
                            : 'border-slate-300 text-slate-500 bg-white'
                        }`}
                      >
                        {String.fromCharCode(65 + optIdx)}
                      </div>
                      <div className="flex-1 text-xs sm:text-sm text-slate-800 leading-normal font-sans pt-0.5">
                        <LatexRenderer content={opt} />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <Button
                variant="outline"
                disabled={currentProblemIdx === 0}
                onClick={() => setCurrentProblemIdx((prev) => Math.max(0, prev - 1))}
                className="text-xs font-bold rounded-xl px-4 py-2 flex items-center gap-1.5"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>{language === 'en' ? 'Previous' : 'পূর্ববর্তী'}</span>
              </Button>

              {currentProblemIdx < contest.problems.length - 1 ? (
                <Button
                  onClick={() =>
                    setCurrentProblemIdx((prev) => Math.min(contest.problems.length - 1, prev + 1))
                  }
                  className="bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold rounded-xl px-5 py-2 flex items-center gap-1.5"
                >
                  <span>{language === 'en' ? 'Next Problem' : 'পরবর্তী সমস্যা'}</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmitAnswers}
                  disabled={isSubmitting}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl px-5 py-2 flex items-center gap-1.5 shadow-sm"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                  <span>{language === 'en' ? 'Finish & Evaluate Elo' : 'সমাপ্ত ও রেটিং মূল্যায়ন'}</span>
                </Button>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* ── LIVE EVALUATION MODAL / RESULTS VIEW ── */}
      {submissionResult && (
        <div className="space-y-8 animate-in fade-in duration-200">
          {/* Result Highlight Card */}
          <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-8 sm:p-10 shadow-2xl border border-slate-800 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-amber-300 mb-2">
                  <Award className="h-4 w-4" />
                  <span>{language === 'en' ? 'Contest Evaluation Complete' : 'কনটেস্ট মূল্যায়ন সম্পন্ন'}</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-white">
                  {contest.title}
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 mt-1">
                  {submissionResult.performanceSummary}
                </p>
              </div>

              {/* RATING DELTA BADGE */}
              <div className="shrink-0 text-center sm:text-right">
                <div
                  className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl font-black text-base shadow-lg ${
                    submissionResult.ratingDelta >= 0
                      ? 'bg-emerald-500 text-white ring-4 ring-emerald-500/20'
                      : 'bg-rose-600 text-white ring-4 ring-rose-500/20'
                  }`}
                >
                  {submissionResult.ratingDelta >= 0 ? (
                    <TrendingUp className="h-6 w-6" />
                  ) : (
                    <TrendingDown className="h-6 w-6" />
                  )}
                  <span className="text-2xl font-black">
                    {submissionResult.ratingDelta >= 0
                      ? `+${submissionResult.ratingDelta}`
                      : submissionResult.ratingDelta}{' '}
                    Elo
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 block mt-1">
                  {submissionResult.ratingDelta >= 0
                    ? language === 'en'
                      ? 'Performance beat benchmark!'
                      : 'বেঞ্চমার্কের চেয়ে ভালো স্কোর করেছেন!'
                    : language === 'en'
                    ? 'Performance below expected benchmark'
                    : 'প্রত্যাশিত বেঞ্চমার্কের নিচে স্কোর হয়েছে'}
                </span>
              </div>
            </div>

            {/* Score & Rating Breakdown Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10">
                <span className="text-[10px] text-slate-300 font-bold block uppercase">
                  {language === 'en' ? 'Score' : 'স্কোর'}
                </span>
                <span className="text-2xl font-black text-white mt-1 block">
                  {submissionResult.score} / {submissionResult.maxScore}
                </span>
                <span className="text-[11px] text-emerald-400 font-bold mt-0.5 block">
                  {submissionResult.accuracy}% Accuracy
                </span>
              </div>

              <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10">
                <span className="text-[10px] text-slate-300 font-bold block uppercase">
                  {language === 'en' ? 'Competitive MMR' : 'প্রতিযোগিতামূলক MMR'}
                </span>
                <span className="text-2xl font-black text-amber-300 mt-1 block">
                  {submissionResult.newCompetitiveElo}
                </span>
                <span className="text-[11px] text-slate-400 block mt-0.5">
                  was {submissionResult.previousCompetitiveElo}
                </span>
              </div>

              <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10">
                <span className="text-[10px] text-slate-300 font-bold block uppercase">
                  {language === 'en' ? 'Courses & Problems Bonus' : 'কোর্স ও প্রবলেম বোনাস'}
                </span>
                <span className="text-2xl font-black text-indigo-300 mt-1 block">
                  +{submissionResult.courseBonus + submissionResult.problemsBonus}
                </span>
                <span className="text-[11px] text-indigo-300/80 block mt-0.5">
                  Courses: +{submissionResult.courseBonus} | Solved: +{submissionResult.problemsBonus}
                </span>
              </div>

              <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10">
                <span className="text-[10px] text-slate-300 font-bold block uppercase">
                  {language === 'en' ? 'New Composite Elo' : 'নতুন মোট ইলো'}
                </span>
                <span className="text-2xl font-black text-white mt-1 block">
                  {submissionResult.newCompositeElo}
                </span>
                <span className="text-[11px] font-extrabold text-amber-300 block mt-0.5">
                  Tier: {submissionResult.tier?.titleEn || 'Specialist'}
                </span>
              </div>
            </div>

            {/* Return action buttons */}
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <Link href="/student">
                <Button className="bg-white text-slate-900 hover:bg-slate-100 font-extrabold text-xs px-6 py-2.5 rounded-xl flex items-center gap-2 shadow-md">
                  <span>{language === 'en' ? 'Go to Student Dashboard' : 'ড্যাশবোর্ডে ফিরে যান'}</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/contests">
                <Button
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10 font-bold text-xs px-5 py-2.5 rounded-xl"
                >
                  {language === 'en' ? 'Explore More Contests' : 'আরও কনটেস্ট দেখুন'}
                </Button>
              </Link>
            </div>
          </div>

          {/* Detailed Problem by Problem Solution Review */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-indigo-600" />
              <span>{language === 'en' ? 'Detailed Problem Explanations & Solutions' : 'সমস্যাভিত্তিক সমাধান ও ব্যাখ্যা'}</span>
            </h3>

            <div className="space-y-4">
              {(submissionResult.problemsBreakdown || []).map((p: any) => (
                <div
                  key={p.index}
                  className={`rounded-2xl border p-6 transition ${
                    p.isCorrect
                      ? 'border-emerald-200 bg-emerald-50/30'
                      : 'border-rose-200 bg-rose-50/30'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      {p.isCorrect ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                      ) : (
                        <XCircle className="h-5 w-5 text-rose-600 shrink-0" />
                      )}
                      <h4 className="font-bold text-sm text-slate-900">
                        {p.title}
                      </h4>
                    </div>

                    <span
                      className={`text-xs font-black px-2.5 py-0.5 rounded-md ${
                        p.isCorrect
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {p.isCorrect ? `+${p.points} Pts` : '0 Pts'}
                    </span>
                  </div>

                  <div className="text-xs text-slate-700 leading-relaxed font-sans mb-4">
                    <LatexRenderer content={p.statement} />
                  </div>

                  {/* Answers summary */}
                  <div className="p-3.5 rounded-xl bg-white border border-slate-200/80 text-xs space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-500">
                        {language === 'en' ? 'Your Answer:' : 'আপনার উত্তর:'}
                      </span>
                      <span className={p.isCorrect ? 'text-emerald-700 font-bold' : 'text-rose-700 font-bold'}>
                        {p.selectedOption >= 0
                          ? `Option ${String.fromCharCode(65 + p.selectedOption)}: ${p.options[p.selectedOption] || ''}`
                          : language === 'en'
                          ? 'Unanswered'
                          : 'উত্তর দেওয়া হয়নি'}
                      </span>
                    </div>

                    {!p.isCorrect && (
                      <div className="flex items-center gap-2 text-emerald-700 font-bold">
                        <span>{language === 'en' ? 'Correct Answer:' : 'সঠিক উত্তর:'}</span>
                        <span>
                          Option {String.fromCharCode(65 + p.correctAnswer)}: {p.options[p.correctAnswer] || ''}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Explanation */}
                  {p.explanation && (
                    <div className="mt-3 p-3.5 rounded-xl bg-indigo-50/60 border border-indigo-100 text-xs">
                      <span className="font-bold text-indigo-950 block mb-1">
                        {language === 'en' ? 'Mathematical Proof & Explanation:' : 'গাণিতিক ব্যাখ্যা ও বিশ্লেষণ:'}
                      </span>
                      <div className="text-slate-700 leading-relaxed">
                        <LatexRenderer content={p.explanation} />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
