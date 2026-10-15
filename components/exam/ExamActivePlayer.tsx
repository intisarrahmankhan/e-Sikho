'use client';

import React, { useState, useEffect, useRef } from 'react';
import { LatexRenderer } from './LatexRenderer';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  Flag,
  RotateCcw,
  Send,
  Loader2,
  BookOpen,
  Code2,
  Play,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Terminal,
  Type,
  ToggleLeft,
  CheckSquare,
} from 'lucide-react';
import { runSampleCodeAction } from '@/actions/exam';
import { ExamQuestionType } from '@/models/Exam';
import { useLanguage } from '@/context/LanguageContext';

export interface ExamQuestionView {
  id: string;
  index: number;
  type?: ExamQuestionType;
  question: string;
  options?: string[];
  marks: number;
  codeTemplate?: string;
  codeLanguage?: string;
  testCases?: { input: string; expectedOutput: string; isHidden?: boolean }[];
}

export interface StudentAnswerItem {
  selectedOption?: number;
  textAnswer?: string;
  codeAnswer?: string;
}

export interface ExamActivePlayerProps {
  examId: string;
  title: string;
  courseTitle?: string | null;
  durationMinutes: number;
  totalMarks: number;
  questions: ExamQuestionView[];
  onSubmit: (answers: Record<number, any>, timeTakenSeconds: number) => Promise<void>;
  isSubmitting: boolean;
  hasNegativeMarking?: boolean;
  negativeMarkingValue?: number;
}

export function ExamActivePlayer({
  examId,
  title,
  courseTitle,
  durationMinutes,
  totalMarks,
  questions,
  onSubmit,
  isSubmitting,
  hasNegativeMarking,
  negativeMarkingValue,
}: ExamActivePlayerProps) {
  const { language } = useLanguage();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, StudentAnswerItem>>({});
  const [markedForReview, setMarkedForReview] = useState<Record<number, boolean>>({});
  const [secondsLeft, setSecondsLeft] = useState(durationMinutes * 60);
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  // Coding execution test states
  const [testingCode, setTestingCode] = useState(false);
  const [codeTestResults, setCodeTestResults] = useState<any | null>(null);

  const initialSeconds = durationMinutes * 60;
  const deadlineStorageKey = `eshikho_exam_deadline_${examId}`;
  const answersStorageKey = `eshikho_exam_answers_${examId}`;

  const answersRef = useRef(answers);
  answersRef.current = answers;

  const onSubmitRef = useRef(onSubmit);
  onSubmitRef.current = onSubmit;

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const hasAutoSubmittedRef = useRef(false);

  // Clean submission helper that cleans storage keys
  const triggerSubmit = (answersToSubmit: Record<number, StudentAnswerItem>, timeTaken: number) => {
    if (hasAutoSubmittedRef.current) return;
    hasAutoSubmittedRef.current = true;
    try {
      localStorage.removeItem(deadlineStorageKey);
      localStorage.removeItem(answersStorageKey);
    } catch {}
    onSubmitRef.current(answersToSubmit, timeTaken);
  };

  // Restore saved answers from previous tab / crash if available
  useEffect(() => {
    try {
      const cached = localStorage.getItem(answersStorageKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && typeof parsed === 'object') {
          setAnswers((prev) => ({ ...prev, ...parsed }));
        }
      }
    } catch {}
  }, [answersStorageKey]);

  // Persist answers on every change
  useEffect(() => {
    if (Object.keys(answers).length > 0) {
      try {
        localStorage.setItem(answersStorageKey, JSON.stringify(answers));
      } catch {}
    }
  }, [answers, answersStorageKey]);

  // Initialize starter code in answers if not present
  useEffect(() => {
    questions.forEach((q, idx) => {
      if (q.type === 'CODE' && q.codeTemplate) {
        setAnswers((prev) => {
          if (!prev[idx]?.codeAnswer) {
            return {
              ...prev,
              [idx]: {
                ...prev[idx],
                codeAnswer: q.codeTemplate,
              },
            };
          }
          return prev;
        });
      }
    });
  }, [questions]);

  // Strict Countdown Timer Effect: Enforces strict deadline across interrupted/closed tabs
  useEffect(() => {
    // 1. Establish or retrieve persistent deadline
    let deadline: number;
    try {
      const stored = localStorage.getItem(deadlineStorageKey);
      if (stored) {
        deadline = Number(stored);
      } else {
        deadline = Date.now() + durationMinutes * 60 * 1000;
        localStorage.setItem(deadlineStorageKey, String(deadline));
      }
    } catch {
      deadline = Date.now() + durationMinutes * 60 * 1000;
    }

    const checkAndTick = () => {
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((deadline - now) / 1000));
      setSecondsLeft(remaining);

      // Auto-submit strictly when time expires (even after tab is restored)
      if (remaining <= 0) {
        if (timerRef.current) clearInterval(timerRef.current);
        triggerSubmit(answersRef.current, initialSeconds);
      }
    };

    // Immediate check on mount
    checkAndTick();

    // Regular interval
    timerRef.current = setInterval(checkAndTick, 1000);

    // Visibility change handler: immediately re-check deadline when tab becomes visible again
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkAndTick();
      }
    };

    // Cross-tab storage synchronization
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === deadlineStorageKey && e.newValue) {
        deadline = Number(e.newValue);
        checkAndTick();
      }
    };

    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [examId, durationMinutes, initialSeconds, deadlineStorageKey]);

  const currentQuestion = questions[currentIndex] || questions[0];
  const qType = currentQuestion?.type || 'MCQ';

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const isTimeCritical = secondsLeft < 120; // under 2 mins
  const isTimeWarning = secondsLeft < 300 && !isTimeCritical; // under 5 mins

  const handleSelectOption = (optionIndex: number) => {
    setAnswers((prev) => ({
      ...prev,
      [currentIndex]: {
        ...prev[currentIndex],
        selectedOption: optionIndex,
      },
    }));
  };

  const handleTextAnswerChange = (val: string) => {
    setAnswers((prev) => ({
      ...prev,
      [currentIndex]: {
        ...prev[currentIndex],
        textAnswer: val,
      },
    }));
  };

  const handleCodeAnswerChange = (val: string) => {
    setAnswers((prev) => ({
      ...prev,
      [currentIndex]: {
        ...prev[currentIndex],
        codeAnswer: val,
      },
    }));
  };

  const handleClearAnswer = () => {
    setAnswers((prev) => {
      const copy = { ...prev };
      delete copy[currentIndex];
      return copy;
    });
    setCodeTestResults(null);
  };

  const handleToggleReview = () => {
    setMarkedForReview((prev) => ({
      ...prev,
      [currentIndex]: !prev[currentIndex],
    }));
  };

  const handleRunSampleCode = async () => {
    const code = answers[currentIndex]?.codeAnswer || currentQuestion.codeTemplate || '';
    const sampleCases = (currentQuestion.testCases || []).filter((tc) => !tc.isHidden);

    if (sampleCases.length === 0) {
      alert(language === 'en' ? 'No public test cases available to test.' : 'যাচাই করার মতো কোনো পাবলিক টেস্ট-কেস নেই।');
      return;
    }

    setTestingCode(true);
    setCodeTestResults(null);

    try {
      const res = await runSampleCodeAction({
        code,
        testCases: sampleCases,
        language: currentQuestion.codeLanguage || 'javascript',
      });

      if (res.success && res.outcome) {
        setCodeTestResults(res.outcome);
      } else {
        alert(res.error || (language === 'en' ? 'Error executing code.' : 'কোড রান করতে ত্রুটি হয়েছে।'));
      }
    } catch (err: any) {
      alert(err.message || (language === 'en' ? 'Problem testing code.' : 'কোড টেস্ট করতে সমস্যা হয়েছে।'));
    } finally {
      setTestingCode(false);
    }
  };

  // Check whether a question is answered
  const isQuestionAnswered = (idx: number) => {
    const ans = answers[idx];
    if (!ans) return false;
    const q = questions[idx];
    const type = q?.type || 'MCQ';

    if (type === 'SHORT_ANSWER') {
      return !!ans.textAnswer?.trim();
    }
    if (type === 'CODE') {
      return !!ans.codeAnswer?.trim();
    }
    return ans.selectedOption !== undefined && ans.selectedOption >= 0;
  };

  const answeredCount = questions.filter((_, idx) => isQuestionAnswered(idx)).length;
  const unansweredCount = questions.length - answeredCount;
  const reviewCount = Object.values(markedForReview).filter(Boolean).length;

  return (
    <div className="space-y-6">
      {/* Top Floating Control Bar */}
      <div className="sticky top-20 z-20 bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900 truncate max-w-md">{title}</h2>
            {hasNegativeMarking && (
              <Badge className="bg-rose-100 text-rose-800 border-rose-300 font-bold text-[11px] flex items-center gap-1 shadow-2xs">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping inline-block" />
                <span>
                  {language === 'en'
                    ? `Negative Marking: -${negativeMarkingValue || 0.25} (0 if skipped)`
                    : `নেগেটিভ মার্কিং: -${negativeMarkingValue || 0.25} (এড়িয়ে গেলে ০)`}
                </span>
              </Badge>
            )}
          </div>
          {courseTitle && (
            <p className="text-xs text-primary-600 font-medium flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5" />
              <span>{courseTitle}</span>
            </p>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Timer Display */}
          <div
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl border font-mono font-bold text-sm transition ${
              isTimeCritical
                ? 'bg-rose-50 text-rose-600 border-rose-200 animate-pulse'
                : isTimeWarning
                ? 'bg-amber-50 text-amber-700 border-amber-200'
                : 'bg-slate-50 text-slate-700 border-slate-200'
            }`}
          >
            <Clock className={`w-4 h-4 ${isTimeCritical ? 'text-rose-600' : 'text-primary-600'}`} />
            <span>
              {language === 'en'
                ? `Time Remaining: ${formatTime(secondsLeft)}`
                : `অবশিষ্ট সময়: ${formatTime(secondsLeft)}`}
            </span>
          </div>

          <Button
            onClick={() => setShowSubmitModal(true)}
            disabled={isSubmitting}
            className="bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-sm gap-1.5"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{language === 'en' ? 'Submitting...' : 'জমা দেওয়া হচ্ছে...'}</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>{language === 'en' ? 'Submit Exam' : 'পরীক্ষা জমা দিন'}</span>
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Left Column: Question Area */}
        <div className="lg:col-span-3 space-y-4">
          <Card className="border border-slate-200 rounded-2xl bg-white shadow-sm overflow-hidden">
            {/* Question Header */}
            <CardHeader className="p-5 pb-3 border-b border-slate-100 bg-slate-50/50 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge className="bg-primary-600 text-white text-xs font-bold px-2.5 py-0.5">
                  {language === 'en'
                    ? `Question ${currentIndex + 1} / ${questions.length}`
                    : `প্রশ্ন ${currentIndex + 1} / ${questions.length}`}
                </Badge>

                <Badge
                  variant="outline"
                  className={`text-[11px] font-semibold flex items-center gap-1 ${
                    qType === 'CODE'
                      ? 'border-indigo-300 text-indigo-700 bg-indigo-50'
                      : qType === 'SHORT_ANSWER'
                      ? 'border-amber-300 text-amber-700 bg-amber-50'
                      : qType === 'TRUE_FALSE'
                      ? 'border-emerald-300 text-emerald-700 bg-emerald-50'
                      : 'border-slate-300 text-slate-700 bg-white'
                  }`}
                >
                  {qType === 'CODE' && <Code2 className="w-3 h-3" />}
                  {qType === 'SHORT_ANSWER' && <Type className="w-3 h-3" />}
                  {qType === 'TRUE_FALSE' && <ToggleLeft className="w-3 h-3" />}
                  {qType === 'MCQ' && <CheckSquare className="w-3 h-3" />}
                  <span>
                    {qType === 'CODE'
                      ? language === 'en' ? 'Coding Problem' : 'কোডিং সমস্যা'
                      : qType === 'SHORT_ANSWER'
                      ? language === 'en' ? 'Short Answer' : 'সংক্ষিপ্ত উত্তর'
                      : qType === 'TRUE_FALSE'
                      ? language === 'en' ? 'True / False' : 'সত্য/মিথ্যা'
                      : language === 'en' ? 'Multiple Choice (MCQ)' : 'বহুনির্বাচনী (MCQ)'}
                  </span>
                </Badge>

                <span className="text-xs text-slate-500 font-medium">
                  {language === 'en' ? `Marks: ${currentQuestion.marks}` : `মান: ${currentQuestion.marks} নম্বর`}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleToggleReview}
                  className={`text-xs px-2.5 py-1 rounded-lg border flex items-center gap-1.5 transition ${
                    markedForReview[currentIndex]
                      ? 'bg-amber-50 text-amber-700 border-amber-200 font-semibold'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <Flag className="w-3.5 h-3.5" />
                  <span>
                    {markedForReview[currentIndex]
                      ? language === 'en' ? 'Marked for Review' : 'রিভিউতে চিহ্নিত'
                      : language === 'en' ? 'Mark for Review' : 'রিভিউয়ের জন্য রাখুন'}
                  </span>
                </button>
              </div>
            </CardHeader>

            <CardContent className="p-6 space-y-6">
              {/* Question Text with LaTeX Renderer */}
              <div className="text-slate-900 font-medium text-base sm:text-lg leading-relaxed bg-slate-50/40 p-4 rounded-xl border border-slate-100">
                <LatexRenderer content={currentQuestion.question} />
              </div>

              {/* FORMAT 1: MCQ Options */}
              {qType === 'MCQ' && (
                <div className="space-y-3">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                    {language === 'en' ? 'Select the correct option:' : 'সঠিক উত্তরটি নির্বাচন করুন:'}
                  </span>

                  <div className="space-y-2.5">
                    {(currentQuestion.options || []).map((option, optIdx) => {
                      const isSelected = answers[currentIndex]?.selectedOption === optIdx;
                      const optionLetter = String.fromCharCode(65 + optIdx); // A, B, C, D

                      return (
                        <div
                          key={optIdx}
                          onClick={() => handleSelectOption(optIdx)}
                          className={`flex items-start gap-3.5 p-4 rounded-xl border cursor-pointer transition ${
                            isSelected
                              ? 'bg-primary-50/80 border-primary-500 text-primary-950 ring-1 ring-primary-500/50 shadow-xs'
                              : 'bg-white border-slate-200/90 hover:bg-slate-50/80 text-slate-700 hover:border-slate-300'
                          }`}
                        >
                          <div
                            className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 transition ${
                              isSelected
                                ? 'bg-primary-600 text-white shadow-xs'
                                : 'bg-slate-100 text-slate-600 border border-slate-200'
                            }`}
                          >
                            {optionLetter}
                          </div>

                          <div className="text-sm sm:text-base flex-1 pt-0.5 leading-snug">
                            <LatexRenderer content={option} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* FORMAT 2: TRUE_FALSE */}
              {qType === 'TRUE_FALSE' && (
                <div className="space-y-3">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                    {language === 'en'
                      ? 'Select whether the statement is true or false:'
                      : 'বিবৃতিটি সত্য নাকি মিথ্যা নির্বাচন করুন:'}
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => handleSelectOption(0)}
                      className={`p-5 rounded-2xl border text-left transition flex items-center gap-4 ${
                        answers[currentIndex]?.selectedOption === 0
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-950 ring-2 ring-emerald-500/30 shadow-sm'
                          : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-800'
                      }`}
                    >
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold shrink-0 ${
                          answers[currentIndex]?.selectedOption === 0
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="font-bold text-sm block">
                          {language === 'en' ? 'True' : 'সত্য (True)'}
                        </span>
                        <span className="text-xs text-slate-500">
                          {language === 'en' ? 'Statement is correct' : 'বিবৃতিটি সঠিক'}
                        </span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSelectOption(1)}
                      className={`p-5 rounded-2xl border text-left transition flex items-center gap-4 ${
                        answers[currentIndex]?.selectedOption === 1
                          ? 'bg-rose-50 border-rose-500 text-rose-950 ring-2 ring-rose-500/30 shadow-sm'
                          : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-800'
                      }`}
                    >
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold shrink-0 ${
                          answers[currentIndex]?.selectedOption === 1
                            ? 'bg-rose-600 text-white shadow-xs'
                            : 'bg-rose-100 text-rose-700'
                        }`}
                      >
                        <XCircle className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="font-bold text-sm block">
                          {language === 'en' ? 'False' : 'মিথ্যা (False)'}
                        </span>
                        <span className="text-xs text-slate-500">
                          {language === 'en' ? 'Statement is incorrect' : 'বিবৃতিটি ভুল'}
                        </span>
                      </div>
                    </button>
                  </div>
                </div>
              )}

              {/* FORMAT 3: SHORT_ANSWER */}
              {qType === 'SHORT_ANSWER' && (
                <div className="space-y-3 bg-amber-50/30 p-5 rounded-2xl border border-amber-200/80">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 uppercase tracking-wider">
                    <Type className="w-4 h-4 text-amber-600" />
                    <span>
                      {language === 'en' ? 'Write your short answer:' : 'আপনার সংক্ষিপ্ত উত্তরটি লিখুন:'}
                    </span>
                  </label>
                  <Input
                    value={answers[currentIndex]?.textAnswer || ''}
                    onChange={(e) => handleTextAnswerChange(e.target.value)}
                    placeholder={language === 'en' ? 'e.g.: Queue or O(n log n)...' : 'যেমন: Queue অথবা O(n log n)...'}
                    className="rounded-xl border-amber-300 bg-white text-sm p-3 focus:ring-amber-500"
                  />
                  <p className="text-[11px] text-slate-500">
                    {language === 'en'
                      ? 'Your answer will be automatically evaluated case-insensitively.'
                      : 'উত্তর জমা দেওয়ার পর স্বয়ংক্রিয়ভাবে কেস-ইনসেনসিটিভ নিয়মে যাচাই ও গ্রেডিং করা হবে।'}
                  </p>
                </div>
              )}

              {/* FORMAT 4: CODE EVALUATION */}
              {qType === 'CODE' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5 uppercase tracking-wider">
                      <Terminal className="w-4 h-4 text-indigo-600" />
                      <span>
                        {language === 'en'
                          ? 'JavaScript Code Editor (Solution):'
                          : 'জাভাস্ক্রিপ্ট কোড এডিটর (JavaScript Solution):'}
                      </span>
                    </span>

                    <button
                      type="button"
                      onClick={handleRunSampleCode}
                      disabled={testingCode}
                      className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition shadow-xs disabled:opacity-50"
                    >
                      {testingCode ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>{language === 'en' ? 'Testing...' : 'যাচাই হচ্ছে...'}</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5 fill-white" />
                          <span>
                            {language === 'en'
                              ? 'Run Sample Tests'
                              : 'কোড যাচাই করুন (Run Sample Tests)'}
                          </span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-950 shadow-md">
                    <div className="bg-slate-900 px-4 py-2 flex items-center justify-between border-b border-slate-800">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                        <span className="text-xs font-mono text-slate-400 ml-2">solution.js</span>
                      </div>
                      <span className="text-[11px] text-slate-500 font-mono">JS VM Sandbox</span>
                    </div>

                    <textarea
                      value={answers[currentIndex]?.codeAnswer ?? currentQuestion.codeTemplate ?? ''}
                      onChange={(e) => handleCodeAnswerChange(e.target.value)}
                      rows={10}
                      className="w-full bg-slate-950 text-emerald-400 font-mono text-xs sm:text-sm p-4 outline-none resize-y leading-relaxed"
                      placeholder="function solve(input) { ... }"
                      spellCheck={false}
                    />
                  </div>

                  {/* Public Sample Test Cases & Test Results */}
                  <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-3">
                    <span className="text-xs font-bold text-slate-700 block">
                      {language === 'en'
                        ? 'Sample Test Cases:'
                        : 'পাবলিক টেস্ট কেস নমুনা (Sample Test Cases):'}
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                      {(currentQuestion.testCases || [])
                        .filter((tc) => !tc.isHidden)
                        .map((tc, tcIdx) => (
                          <div key={tcIdx} className="bg-white p-2.5 rounded-lg border border-slate-200 space-y-1">
                            <div>
                              <span className="text-slate-400 font-semibold">Input: </span>
                              <span className="text-slate-800">{tc.input}</span>
                            </div>
                            <div>
                              <span className="text-slate-400 font-semibold">Expected: </span>
                              <span className="text-emerald-700 font-bold">{tc.expectedOutput}</span>
                            </div>
                          </div>
                        ))}
                    </div>

                    {/* Live Test Run Feedback */}
                    {codeTestResults && (
                      <div
                        className={`p-3.5 rounded-xl border space-y-2 mt-2 ${
                          codeTestResults.allPassed
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                            : 'bg-rose-50 border-rose-300 text-rose-950'
                        }`}
                      >
                        <div className="flex items-center justify-between font-bold text-xs">
                          <span className="flex items-center gap-1.5">
                            {codeTestResults.allPassed ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <XCircle className="w-4 h-4 text-rose-600" />
                            )}
                            {codeTestResults.allPassed
                              ? language === 'en'
                                ? `Congratulations! All sample test cases passed (${codeTestResults.passedCount}/${codeTestResults.totalCount})`
                                : `অভিনন্দন! সকল পাবলিক টেস্ট-কেস পাস করেছে (${codeTestResults.passedCount}/${codeTestResults.totalCount})`
                              : language === 'en'
                              ? `Some test cases failed (${codeTestResults.passedCount}/${codeTestResults.totalCount} passed)`
                              : `কিছু টেস্ট-কেসে ভুল হয়েছে (${codeTestResults.passedCount}/${codeTestResults.totalCount} পাস)`}
                          </span>
                        </div>

                        <div className="space-y-1 text-[11px] font-mono">
                          {codeTestResults.results.map((r: any, rIdx: number) => (
                            <div
                              key={rIdx}
                              className={`p-2 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-1 ${
                                r.passed ? 'bg-emerald-100/60 border-emerald-200' : 'bg-rose-100/60 border-rose-200'
                              }`}
                            >
                              <div>
                                <span>{language === 'en' ? `Case #${rIdx + 1}: ` : `কেস #${rIdx + 1}: `}</span>
                                <span>Input: {r.input} | Output: {r.actualOutput || 'Empty'}</span>
                                {r.errorMessage && <p className="text-rose-700">{r.errorMessage}</p>}
                              </div>
                              <span className={`font-bold ${r.passed ? 'text-emerald-700' : 'text-rose-700'}`}>
                                {r.passed ? 'PASSED ✓' : 'FAILED ✗'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Option Actions (Clear selection) */}
              {isQuestionAnswered(currentIndex) && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleClearAnswer}
                    className="text-xs text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1 transition"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>{language === 'en' ? 'Clear Answer' : 'উত্তর মুছে ফেলুন'}</span>
                  </button>
                </div>
              )}
            </CardContent>

            {/* Navigation Footer */}
            <CardFooter className="p-5 border-t border-slate-100 bg-slate-50/30 flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setCurrentIndex((prev) => Math.max(0, prev - 1));
                  setCodeTestResults(null);
                }}
                disabled={currentIndex === 0}
                className="gap-1 border-slate-200 text-xs rounded-xl"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>{language === 'en' ? 'Previous' : 'পূর্ববর্তী'}</span>
              </Button>

              <span className="text-xs font-semibold text-slate-500">
                {language === 'en'
                  ? `${currentIndex + 1} of ${questions.length}`
                  : `${currentIndex + 1} এর ${questions.length}`}
              </span>

              {currentIndex < questions.length - 1 ? (
                <Button
                  size="sm"
                  onClick={() => {
                    setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1));
                    setCodeTestResults(null);
                  }}
                  className="bg-primary-600 hover:bg-primary-700 text-white gap-1 text-xs rounded-xl"
                >
                  <span>{language === 'en' ? 'Next' : 'পরবর্তী'}</span>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={() => setShowSubmitModal(true)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1 text-xs rounded-xl"
                >
                  <span>{language === 'en' ? 'Review & Submit' : 'পর্যালোচনা ও জমা'}</span>
                  <Send className="w-3.5 h-3.5" />
                </Button>
              )}
            </CardFooter>
          </Card>
        </div>

        {/* Right Column: Question Palette */}
        <div className="space-y-4">
          <Card className="border border-slate-200 rounded-2xl bg-white shadow-sm p-5 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              {language === 'en' ? 'Question Palette' : 'প্রশ্নের তালিকা (Question Palette)'}
            </h3>

            {/* Question numbers grid */}
            <div className="grid grid-cols-5 gap-2">
              {questions.map((q, idx) => {
                const isCurrent = currentIndex === idx;
                const isAnswered = isQuestionAnswered(idx);
                const isMarked = markedForReview[idx];

                let bgClass = 'bg-slate-100 text-slate-600 border-slate-200';
                if (isAnswered && isMarked) {
                  bgClass = 'bg-amber-500 text-white border-amber-600';
                } else if (isAnswered) {
                  bgClass = 'bg-emerald-600 text-white border-emerald-700';
                } else if (isMarked) {
                  bgClass = 'bg-amber-100 text-amber-800 border-amber-300';
                }

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setCurrentIndex(idx);
                      setCodeTestResults(null);
                    }}
                    className={`h-9 rounded-xl font-bold text-xs border transition flex items-center justify-center relative ${bgClass} ${
                      isCurrent ? 'ring-2 ring-primary-600 ring-offset-2' : ''
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="pt-3 border-t border-slate-100 space-y-2 text-[11px] text-slate-600">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-md bg-emerald-600 shrink-0" />
                <span>
                  {language === 'en'
                    ? `Answered (${answeredCount})`
                    : `উত্তর দেওয়া হয়েছে (${answeredCount})`}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-md bg-amber-500 shrink-0" />
                <span>
                  {language === 'en'
                    ? `Marked for Review (${reviewCount})`
                    : `রিভিউ সহ উত্তর (${reviewCount})`}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-md bg-slate-200 shrink-0" />
                <span>
                  {language === 'en'
                    ? `Unanswered (${unansweredCount})`
                    : `উত্তর বাকি রয়েছে (${unansweredCount})`}
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Confirmation Modal before Submit */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <Card className="max-w-md w-full border border-slate-200 rounded-3xl bg-white shadow-xl p-6 space-y-5 animate-in fade-in zoom-in-95">
            <h3 className="text-base font-bold text-slate-900">
              {language === 'en'
                ? 'Are you sure you want to submit your exam?'
                : 'আপনি কি নিশ্চিত যে পরীক্ষা জমা দিতে চান?'}
            </h3>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>{language === 'en' ? 'Total Questions:' : 'মোট প্রশ্ন:'}</span>
                <span className="font-bold text-slate-900">
                  {language === 'en' ? `${questions.length}` : `${questions.length} টি`}
                </span>
              </div>
              <div className="flex justify-between text-emerald-700">
                <span>{language === 'en' ? 'Answered:' : 'উত্তর দেওয়া হয়েছে:'}</span>
                <span className="font-bold">
                  {language === 'en' ? `${answeredCount}` : `${answeredCount} টি`}
                </span>
              </div>
              <div className="flex justify-between text-rose-700">
                <span>{language === 'en' ? 'Unanswered:' : 'উত্তর বাকি রয়েছে:'}</span>
                <span className="font-bold">
                  {language === 'en' ? `${unansweredCount}` : `${unansweredCount} টি`}
                </span>
              </div>
              {reviewCount > 0 && (
                <div className="flex justify-between text-amber-700">
                  <span>{language === 'en' ? 'Marked for Review:' : 'রিভিউয়ের জন্য চিহ্নিত:'}</span>
                  <span className="font-bold">
                    {language === 'en' ? `${reviewCount}` : `${reviewCount} টি`}
                  </span>
                </div>
              )}
            </div>

            <p className="text-xs text-slate-500">
              {language === 'en'
                ? 'Once submitted, your answers will be automatically graded and your result will be displayed instantly.'
                : 'জমা দেওয়ার পর আপনার উত্তরপত্র সার্ভার দ্বারা স্বয়ংক্রিয়ভাবে যাচাই (Auto-Grading) হবে এবং তাৎক্ষণিক ফলাফল দেখতে পাবেন।'}
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSubmitModal(false)}
                disabled={isSubmitting}
                className="rounded-xl text-xs"
              >
                {language === 'en' ? 'Back to Exam' : 'পরীক্ষায় ফিরে যান'}
              </Button>

              <Button
                size="sm"
                onClick={() => {
                  setShowSubmitModal(false);
                  const timeTaken = initialSeconds - secondsLeft;
                  triggerSubmit(answers, timeTaken);
                }}
                disabled={isSubmitting}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl px-5"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <span>{language === 'en' ? 'Yes, Submit' : 'হ্যাঁ, জমা দিন'}</span>
                )}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
