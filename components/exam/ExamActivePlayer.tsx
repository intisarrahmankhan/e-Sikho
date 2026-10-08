'use client';

import React, { useState, useEffect, useRef } from 'react';
import { LatexRenderer } from './LatexRenderer';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  Flag,
  RotateCcw,
  Send,
  Loader2,
  BookOpen,
} from 'lucide-react';

export interface ExamQuestionView {
  id: string;
  index: number;
  question: string;
  options: string[];
  marks: number;
}

export interface ExamActivePlayerProps {
  examId: string;
  title: string;
  courseTitle?: string | null;
  durationMinutes: number;
  totalMarks: number;
  questions: ExamQuestionView[];
  onSubmit: (answers: Record<number, number>, timeTakenSeconds: number) => Promise<void>;
  isSubmitting: boolean;
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
}: ExamActivePlayerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [markedForReview, setMarkedForReview] = useState<Record<number, boolean>>({});
  const [secondsLeft, setSecondsLeft] = useState(durationMinutes * 60);
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  const initialSeconds = durationMinutes * 60;
  const answersRef = useRef(answers);
  answersRef.current = answers;

  const onSubmitRef = useRef(onSubmit);
  onSubmitRef.current = onSubmit;

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Timer effect
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          onSubmitRef.current(answersRef.current, initialSeconds);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [initialSeconds]);

  const handleManualSubmit = () => {
    const timeTaken = initialSeconds - secondsLeft;
    onSubmit(answers, timeTaken);
  };

  const currentQuestion = questions[currentIndex];

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
      [currentIndex]: optionIndex,
    }));
  };

  const handleClearOption = () => {
    setAnswers((prev) => {
      const copy = { ...prev };
      delete copy[currentIndex];
      return copy;
    });
  };

  const handleToggleReview = () => {
    setMarkedForReview((prev) => ({
      ...prev,
      [currentIndex]: !prev[currentIndex],
    }));
  };

  const answeredCount = Object.keys(answers).length;
  const unansweredCount = questions.length - answeredCount;
  const reviewCount = Object.values(markedForReview).filter(Boolean).length;

  return (
    <div className="space-y-6">
      {/* Top Floating Control Bar */}
      <div className="sticky top-20 z-20 bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-0.5">
          <h2 className="text-base font-bold text-slate-900 truncate max-w-md">{title}</h2>
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
            <span>অবশিষ্ট সময়: {formatTime(secondsLeft)}</span>
          </div>

          <Button
            onClick={() => setShowSubmitModal(true)}
            disabled={isSubmitting}
            className="bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-sm gap-1.5"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>জমা দেওয়া হচ্ছে...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>পরীক্ষা জমা দিন</span>
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
                  প্রশ্ন {currentIndex + 1} / {questions.length}
                </Badge>
                <span className="text-xs text-slate-500 font-medium">
                  মান: {currentQuestion.marks} নম্বর
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
                    {markedForReview[currentIndex] ? 'রিভিউতে চিহ্নিত' : 'রিভিউয়ের জন্য রাখুন'}
                  </span>
                </button>
              </div>
            </CardHeader>

            <CardContent className="p-6 space-y-6">
              {/* Question Text with LaTeX Renderer */}
              <div className="text-slate-900 font-medium text-base sm:text-lg leading-relaxed bg-slate-50/40 p-4 rounded-xl border border-slate-100">
                <LatexRenderer content={currentQuestion.question} />
              </div>

              {/* Options with LaTeX Rendering */}
              <div className="space-y-3">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                  সঠিক উত্তরটি নির্বাচন করুন:
                </span>

                <div className="space-y-2.5">
                  {currentQuestion.options.map((option, optIdx) => {
                    const isSelected = answers[currentIndex] === optIdx;
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

              {/* Option Actions (Clear selection) */}
              {answers[currentIndex] !== undefined && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleClearOption}
                    className="text-xs text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1 transition"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>উত্তর মুছে ফেলুন</span>
                  </button>
                </div>
              )}
            </CardContent>

            {/* Navigation Footer */}
            <CardFooter className="p-5 border-t border-slate-100 bg-slate-50/30 flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                disabled={currentIndex === 0}
                className="gap-1 border-slate-200 text-xs rounded-xl"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>পূর্ববর্তী</span>
              </Button>

              <span className="text-xs font-semibold text-slate-500">
                {currentIndex + 1} এর {questions.length}
              </span>

              {currentIndex < questions.length - 1 ? (
                <Button
                  size="sm"
                  onClick={() => setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))}
                  className="bg-primary-600 hover:bg-primary-700 text-white gap-1 text-xs rounded-xl"
                >
                  <span>পরবর্তী</span>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={() => setShowSubmitModal(true)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1 text-xs rounded-xl"
                >
                  <span>পর্যালোচনা ও জমা</span>
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
              প্রশ্নের তালিকা (Question Palette)
            </h3>

            {/* Question numbers grid */}
            <div className="grid grid-cols-5 gap-2">
              {questions.map((q, idx) => {
                const isCurrent = currentIndex === idx;
                const isAnswered = answers[idx] !== undefined;
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
                    onClick={() => setCurrentIndex(idx)}
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
                <span>উত্তর দেওয়া হয়েছে ({answeredCount})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-md bg-amber-500 shrink-0" />
                <span>রিভিউ সহ উত্তর ({reviewCount})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-md bg-slate-200 shrink-0" />
                <span>উত্তর বাকি রয়েছে ({unansweredCount})</span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Confirmation Submit Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-5 border border-slate-200 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="space-y-1.5 text-center">
              <div className="w-12 h-12 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center mx-auto mb-2">
                <Send className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">পরীক্ষা জমা দিতে চান?</h3>
              <p className="text-xs text-slate-500">
                একবার জমা দিলে আর পরিবর্তন করা যাবে না। আপনার সামগ্রিক ফলাফল সাথে সাথে দেখা যাবে।
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
              <div>
                <span className="text-[10px] text-slate-400 font-medium block">মোট প্রশ্ন</span>
                <span className="text-sm font-bold text-slate-800">{questions.length}</span>
              </div>
              <div>
                <span className="text-[10px] text-emerald-600 font-medium block">উত্তর দেওয়া</span>
                <span className="text-sm font-bold text-emerald-600">{answeredCount}</span>
              </div>
              <div>
                <span className="text-[10px] text-rose-500 font-medium block">বাকি</span>
                <span className="text-sm font-bold text-rose-600">{unansweredCount}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => setShowSubmitModal(false)}
                disabled={isSubmitting}
                className="w-1/2 border-slate-200 rounded-xl text-xs py-2.5"
              >
                ফিরে যান
              </Button>
              <Button
                onClick={handleManualSubmit}
                disabled={isSubmitting}
                className="w-1/2 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl text-xs py-2.5 gap-1.5 shadow-sm"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>জমা হচ্ছে...</span>
                  </>
                ) : (
                  <span>হ্যাঁ, জমা দিন</span>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ExamActivePlayer;
