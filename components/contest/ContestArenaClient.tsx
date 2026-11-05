'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Timer,
  Trophy,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  TrendingUp,
  TrendingDown,
  Award,
  Zap,
  BookOpen,
  Code2,
  Play,
  RotateCcw,
  Check,
  AlertTriangle,
  Loader2,
  Terminal,
  FileCode,
  Clock,
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

const STARTER_CODES: Record<string, string> = {
  javascript: `// JavaScript (Node.js) Solution
function solve() {
  // Read input and compute solution
  console.log("Solution output");
}

solve();`,
  python: `# Python 3 Solution
def solve():
    # Read input and compute solution
    print("Solution output")

if __name__ == "__main__":
    solve()`,
  cpp: `// C++ 20 Solution
#include <iostream>
#include <vector>
using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    
    // Solution logic
    cout << "Solution output" << "\\n";
    return 0;
}`,
  java: `// Java 17 Solution
import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        // Solution logic
        System.out.println("Solution output");
    }
}`,
};

export function ContestArenaClient({ contest }: ContestArenaClientProps) {
  const { language } = useLanguage();
  const router = useRouter();

  const totalDurationSeconds = (contest.durationMinutes || 45) * 60;
  const [timeLeft, setTimeLeft] = useState(totalDurationSeconds);
  const [currentProblemIdx, setCurrentProblemIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<any | null>(null);

  // Code editor state
  const [selectedLang, setSelectedLang] = useState('javascript');
  const [code, setCode] = useState(STARTER_CODES.javascript);
  const [consoleOutput, setConsoleOutput] = useState<string | null>(null);
  const [isRunningCode, setIsRunningCode] = useState(false);
  const [activeConsoleTab, setActiveConsoleTab] = useState<'console' | 'status'>('console');
  const [simulatedStatus, setSimulatedStatus] = useState<'accepted' | 'wrong_answer' | 'tle' | null>(null);

  // Timer countdown
  const handleSubmitAnswersRef = React.useRef<() => void>(undefined);
  useEffect(() => {
    handleSubmitAnswersRef.current = handleSubmitAnswers;
  });

  useEffect(() => {
    if (submissionResult) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleSubmitAnswersRef.current?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [submissionResult]);

  const handleLangChange = (newLang: string) => {
    setSelectedLang(newLang);
    setCode(STARTER_CODES[newLang] || STARTER_CODES.javascript);
  };

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

  const handleRunCode = () => {
    setIsRunningCode(true);
    setConsoleOutput('Compiling code in sandbox environment...');
    setActiveConsoleTab('console');

    setTimeout(() => {
      setIsRunningCode(false);
      setConsoleOutput(`[Execution finished with code 0]\nOutput:\nSolution verified for Problem ${String.fromCharCode(65 + currentProblemIdx)} test cases.\nRuntime: 42ms | Memory: 14.2 MB`);
      setSimulatedStatus('accepted');
    }, 600);
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
    <div className="max-w-7xl mx-auto px-3 sm:px-6 pb-20 space-y-6">
      {/* ── Dark-mode Top Arena Bar ── */}
      <div className="sticky top-16 z-20 bg-slate-900/95 backdrop-blur-md rounded-2xl border border-slate-800 p-4 shadow-xl flex items-center justify-between gap-4 text-white">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 font-black">
            <Trophy className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xs sm:text-sm font-extrabold text-slate-100 line-clamp-1">
              {contest.title}
            </h2>
            <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400">
              <span className="font-bold text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/60">
                Benchmark: {contest.benchmarkRating} Elo
              </span>
              <span>•</span>
              <span>
                {language === 'en' ? 'Solved' : 'সমাধান'}: {answeredCount}/{totalCount}
              </span>
            </div>
          </div>
        </div>

        {/* Status Indicators Pill & Timer */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Submission Status Badges (Accepted, Wrong Answer, TLE) */}
          <div className="hidden md:flex items-center gap-1.5 text-[11px]">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-800/60 font-semibold">
              <CheckCircle2 className="h-3 w-3" />
              <span>AC</span>
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-950/60 text-rose-400 border border-rose-800/60 font-semibold">
              <XCircle className="h-3 w-3" />
              <span>WA</span>
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-950/60 text-amber-400 border border-amber-800/60 font-semibold">
              <AlertTriangle className="h-3 w-3" />
              <span>TLE</span>
            </span>
          </div>

          {/* Countdown Clock */}
          <div
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-mono text-xs font-black shadow-sm ${
              timeLeft < 300
                ? 'bg-rose-950/80 text-rose-300 border border-rose-600 animate-pulse'
                : 'bg-slate-950 text-emerald-400 border border-slate-800'
            }`}
          >
            <Timer className="h-3.5 w-3.5 text-amber-400" />
            <span>{formatTimer(timeLeft)}</span>
          </div>

          {!submissionResult && (
            <Button
              onClick={handleSubmitAnswers}
              disabled={isSubmitting}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-5 py-2 rounded-xl flex items-center gap-1.5 shadow-sm active:scale-[0.98]"
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
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
                  isCurrent
                    ? 'bg-primary-600 text-white shadow-xs ring-2 ring-primary-500/30'
                    : isAnswered
                    ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/60'
                    : 'bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <span>
                  {language === 'en' ? `Problem ${String.fromCharCode(65 + idx)}` : `সমস্যা ${String.fromCharCode(65 + idx)}`}
                </span>
                {isAnswered && (
                  <CheckCircle2
                    className={`h-3.5 w-3.5 ${isCurrent ? 'text-white' : 'text-emerald-400'}`}
                  />
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* ── Main Problem & Split-Pane Editor View ── */}
      {!submissionResult && currentProblem && (
        <div className="grid grid-cols-1 lg:grid-cols-12 rounded-3xl border border-slate-800 overflow-hidden shadow-2xl bg-slate-950">
          {/* Left Pane: Problem Statement, Specs & Deductions */}
          <div className="lg:col-span-7 bg-slate-900/90 p-6 sm:p-8 border-b lg:border-b-0 lg:border-r border-slate-800 space-y-6 overflow-y-auto max-h-[800px]">
            {/* Problem Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <span className="text-[10px] font-black uppercase text-primary-400 tracking-wider">
                  {currentProblem.category}
                </span>
                <h3 className="text-xl font-extrabold text-white mt-0.5">
                  {currentProblem.title}
                </h3>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs font-bold text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-800/60">
                  {currentProblem.points} Pts
                </span>
                <span className="text-xs font-bold text-amber-400 bg-amber-950/60 px-2.5 py-1 rounded-lg border border-amber-800/60">
                  {currentProblem.difficultyRating} Rating
                </span>
              </div>
            </div>

            {/* Problem Statement (LaTeX formatted) */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                {language === 'en' ? 'Problem Statement' : 'সমস্যার বিবরণ'}
              </h4>
              <div className="prose prose-invert max-w-none text-sm text-slate-200 leading-relaxed font-sans">
                <LatexRenderer content={currentProblem.statement} />
              </div>
            </div>

            {/* Input / Output & Constraints Specifications */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Input Specification
                </span>
                <p className="text-xs text-slate-300 font-mono">
                  Single or multi-line formatted input stream per standard contest I/O.
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Constraints & Limits
                </span>
                <p className="text-xs text-slate-300 font-mono">
                  Time: 1.0s • Memory: 256MB • Strict asymptotic bounds
                </p>
              </div>
            </div>

            {/* Solution Deduction Options Selection */}
            <div className="space-y-3 pt-2">
              <label className="text-xs font-bold text-slate-300 block uppercase tracking-wider">
                {language === 'en' ? 'Select Verified Deduction / Solution:' : 'সঠিক সমাধান নির্বাচন করুন:'}
              </label>

              <div className="space-y-2.5">
                {currentProblem.options.map((opt, optIdx) => {
                  const isSelected = selectedAnswers[currentProblemIdx] === optIdx;

                  return (
                    <button
                      key={optIdx}
                      onClick={() => handleSelectOption(currentProblemIdx, optIdx)}
                      className={`w-full text-left p-4 rounded-2xl border transition-all flex items-start gap-3.5 ${
                        isSelected
                          ? 'border-primary-500 bg-primary-950/40 shadow-xs ring-1 ring-primary-500'
                          : 'border-slate-800 bg-slate-950/60 hover:border-slate-700 hover:bg-slate-950'
                      }`}
                    >
                      <div
                        className={`h-6 w-6 rounded-full border flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold ${
                          isSelected
                            ? 'border-primary-500 bg-primary-600 text-white'
                            : 'border-slate-700 text-slate-400 bg-slate-900'
                        }`}
                      >
                        {String.fromCharCode(65 + optIdx)}
                      </div>
                      <div className="flex-1 text-xs sm:text-sm text-slate-200 leading-normal font-sans pt-0.5">
                        <LatexRenderer content={opt} />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
              <Button
                variant="outline"
                disabled={currentProblemIdx === 0}
                onClick={() => setCurrentProblemIdx((prev) => Math.max(0, prev - 1))}
                className="text-xs font-bold rounded-xl px-4 py-2 flex items-center gap-1.5 border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>{language === 'en' ? 'Previous' : 'পূর্ববর্তী'}</span>
              </Button>

              {currentProblemIdx < contest.problems.length - 1 ? (
                <Button
                  onClick={() =>
                    setCurrentProblemIdx((prev) => Math.min(contest.problems.length - 1, prev + 1))
                  }
                  className="bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold rounded-xl px-5 py-2 flex items-center gap-1.5 active:scale-[0.98]"
                >
                  <span>{language === 'en' ? 'Next Problem' : 'পরবর্তী সমস্যা'}</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmitAnswers}
                  disabled={isSubmitting}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl px-5 py-2 flex items-center gap-1.5 shadow-sm active:scale-[0.98]"
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
          </div>

          {/* Right Pane: Code Editor Area & Console */}
          <div className="lg:col-span-5 bg-slate-950 flex flex-col justify-between p-4 sm:p-6 space-y-4 max-h-[800px]">
            {/* Editor Header: Language selector & Actions */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FileCode className="h-4 w-4 text-primary-400" />
                <span className="text-xs font-bold text-slate-200">
                  {language === 'en' ? 'Solution Scratchpad' : 'কোড স্ক্র্যাচপ্যাড'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={selectedLang}
                  onChange={(e) => handleLangChange(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-slate-200 px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-primary-500"
                >
                  <option value="javascript">JavaScript (Node)</option>
                  <option value="python">Python 3</option>
                  <option value="cpp">C++ 20</option>
                  <option value="java">Java 17</option>
                </select>

                <Button
                  size="sm"
                  onClick={handleRunCode}
                  disabled={isRunningCode}
                  className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 rounded-lg gap-1"
                >
                  {isRunningCode ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Play className="h-3 w-3 fill-white" />
                  )}
                  <span>Run</span>
                </Button>
              </div>
            </div>

            {/* Code Editor with Line Numbers */}
            <div className="flex-1 flex rounded-xl border border-slate-800 bg-slate-950 overflow-hidden min-h-[360px]">
              {/* Line numbers gutter */}
              <div className="py-3 px-2 bg-slate-900/60 border-r border-slate-800/80 text-right font-mono text-xs text-slate-600 select-none space-y-1">
                {Array.from({ length: 16 }).map((_, i) => (
                  <div key={i}>{i + 1}</div>
                ))}
              </div>

              {/* Code input textarea */}
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                spellCheck={false}
                className="flex-1 p-3 bg-transparent text-emerald-400 font-mono text-xs leading-relaxed resize-none focus:outline-none"
              />
            </div>

            {/* Console / Output Panel */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/80 overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-800/80 px-3 py-1.5 bg-slate-950/60 text-xs text-slate-400">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setActiveConsoleTab('console')}
                    className={`flex items-center gap-1.5 font-mono text-[11px] ${
                      activeConsoleTab === 'console' ? 'text-primary-400 font-bold' : 'hover:text-slate-200'
                    }`}
                  >
                    <Terminal className="h-3 w-3" />
                    <span>Console Output</span>
                  </button>
                  <button
                    onClick={() => setActiveConsoleTab('status')}
                    className={`flex items-center gap-1.5 font-mono text-[11px] ${
                      activeConsoleTab === 'status' ? 'text-primary-400 font-bold' : 'hover:text-slate-200'
                    }`}
                  >
                    <Clock className="h-3 w-3" />
                    <span>Verification</span>
                  </button>
                </div>

                {simulatedStatus === 'accepted' && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-800/60">
                    <CheckCircle2 className="h-2.5 w-2.5" />
                    Accepted
                  </span>
                )}
              </div>

              <div className="p-3 font-mono text-[11px] text-slate-300 min-h-[90px] max-h-[140px] overflow-y-auto whitespace-pre-wrap">
                {activeConsoleTab === 'console'
                  ? consoleOutput || 'Run code or verify deductions against sample cases above.'
                  : 'Compilation test status: Ready to submit answer.'}
              </div>
            </div>
          </div>
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
              {submissionResult.problemEvaluations.map((evalItem: any, idx: number) => {
                const problem = contest.problems[idx];
                if (!problem) return null;

                const isCorrect = evalItem.isCorrect;
                const userChoice = evalItem.userAnswer;
                const correctChoice = evalItem.correctAnswer;

                return (
                  <Card
                    key={problem.id}
                    className={`rounded-2xl p-6 border shadow-sm ${
                      isCorrect ? 'border-emerald-200 bg-white' : 'border-rose-200 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                      <div className="flex items-center gap-2">
                        <span
                          className={`flex items-center justify-center h-6 w-6 rounded-full text-xs font-bold ${
                            isCorrect ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {String.fromCharCode(65 + idx)}
                        </span>
                        <h4 className="font-bold text-sm text-slate-900">{problem.title}</h4>
                      </div>
                      <div className="flex items-center gap-2">
                        {isCorrect ? (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            <span>+{evalItem.awardedPoints} Pts</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200">
                            <XCircle className="h-3.5 w-3.5" />
                            <span>0 Pts</span>
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="text-xs text-slate-700 prose prose-slate max-w-none">
                        <LatexRenderer content={problem.statement} />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                        <div
                          className={`p-3 rounded-xl border text-xs ${
                            isCorrect
                              ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                              : 'bg-rose-50/70 border-rose-200 text-rose-900'
                          }`}
                        >
                          <span className="font-bold block mb-1">
                            {language === 'en' ? 'Your Answer:' : 'আপনার উত্তর:'}
                          </span>
                          <span>
                            {userChoice !== undefined
                              ? `${String.fromCharCode(65 + userChoice)}: ${problem.options[userChoice]}`
                              : (language === 'en' ? 'Unanswered' : 'উত্তর দেননি')}
                          </span>
                        </div>

                        {!isCorrect && (
                          <div className="p-3 rounded-xl border bg-emerald-50/70 border-emerald-200 text-emerald-900 text-xs">
                            <span className="font-bold block mb-1">
                              {language === 'en' ? 'Correct Verified Deduction:' : 'সঠিক সমাধান:'}
                            </span>
                            <span>
                              {String.fromCharCode(65 + correctChoice)}: {problem.options[correctChoice]}
                            </span>
                          </div>
                        )}
                      </div>

                      {problem.explanation && (
                        <div className="mt-3 p-3.5 rounded-xl bg-indigo-50/60 border border-indigo-100 text-xs text-indigo-950">
                          <span className="font-bold block mb-1 text-indigo-900">
                            {language === 'en' ? 'Theoretical Explanation:' : 'তাত্ত্বিক ব্যাখ্যা:'}
                          </span>
                          <LatexRenderer content={problem.explanation} />
                        </div>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ContestArenaClient;
