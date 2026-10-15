'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getExamByIdAction, submitExamAction } from '@/actions/exam';
import { ExamActivePlayer } from '@/components/exam/ExamActivePlayer';
import { ExamResultCard } from '@/components/exam/ExamResultCard';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  Clock,
  HelpCircle,
  Award,
  ChevronLeft,
  ArrowRight,
  ShieldCheck,
  Loader2,
  Lock,
  CreditCard,
  RotateCcw,
  XCircle,
} from 'lucide-react';

export default function ExamTakingPage() {
  const params = useParams();
  const examId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [exam, setExam] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Exam flow states: 'INTRO' | 'TAKING' | 'RESULT'
  const [examState, setExamState] = useState<'INTRO' | 'TAKING' | 'RESULT'>('INTRO');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resultData, setResultData] = useState<any>(null);

  useEffect(() => {
    async function loadExam() {
      try {
        setLoading(true);
        const res = await getExamByIdAction(examId, true);
        if (res.error) {
          setError(res.error);
        } else {
          setExam(res.exam);
        }
      } catch (err: any) {
        setError(err.message || 'পরীক্ষার তথ্য লোড করা যায়নি।');
      } finally {
        setLoading(false);
      }
    }
    if (examId) loadExam();
  }, [examId]);

  const handleSubmitExam = async (
    answers: Record<number, any>,
    timeTakenSeconds: number
  ) => {
    setIsSubmitting(true);
    try {
      const res = await submitExamAction({
        examId,
        answers,
        timeTakenSeconds,
      });

      if (res.error) {
        alert(res.error);
        setIsSubmitting(false);
      } else {
        setResultData(res.result);
        setExamState('RESULT');
        setIsSubmitting(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (err: any) {
      alert(err.message || 'উত্তর জমা দিতে ব্যর্থ হয়েছে।');
      setIsSubmitting(false);
    }
  };

  const handleRetake = async () => {
    try {
      const res = await getExamByIdAction(examId, true);
      if (res.exam) {
        setExam(res.exam);
      }
    } catch (_) {}
    setResultData(null);
    setExamState('INTRO');
  };

  if (loading) {
    return (
      <div className="py-24 text-center space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600 mx-auto" />
        <p className="text-xs text-slate-500 font-medium">পরীক্ষার প্রশ্নপত্র লোড হচ্ছে...</p>
      </div>
    );
  }

  if (error || !exam) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <div className="p-4 bg-rose-50 text-rose-700 rounded-2xl border border-rose-200 text-xs font-semibold">
          {error || 'পরীক্ষাটি খুঁজে পাওয়া যায়নি।'}
        </div>
        <Link href="/exams">
          <Button variant="outline" className="rounded-xl text-xs gap-1.5">
            <ChevronLeft className="w-4 h-4" />
            <span>সকল পরীক্ষায় ফিরে যান</span>
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Link
          href="/exams"
          className="inline-flex items-center gap-1 hover:text-primary-600 transition"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>সকল পরীক্ষাসমূহ</span>
        </Link>
        <span>/</span>
        <span className="text-slate-900 font-medium truncate">{exam.title}</span>
      </div>

      {/* Screen 1: Exam Introduction & Start Rules */}
      {examState === 'INTRO' && (
        <div className="max-w-3xl mx-auto space-y-6">
          <Card className="border border-slate-200 rounded-3xl bg-white shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-primary-900 via-primary-800 to-slate-900 p-8 text-white space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="bg-primary-500/30 text-primary-200 border-primary-400/30 text-xs px-2.5 py-0.5">
                  {exam.category}
                </Badge>
                {exam.courseTitle && (
                  <Badge variant="outline" className="text-white border-white/20 text-xs">
                    {exam.courseTitle}
                  </Badge>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                {exam.title}
              </h1>

              {exam.description && (
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {exam.description}
                </p>
              )}
            </div>

            <CardContent className="p-6 sm:p-8 space-y-6">
              {/* Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                  <Clock className="w-5 h-5 text-primary-600 mx-auto mb-1" />
                  <span className="text-[11px] text-slate-400 block font-medium">সময়সীমা</span>
                  <span className="text-base font-bold text-slate-800">{exam.duration} মিনিট</span>
                </div>
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                  <HelpCircle className="w-5 h-5 text-primary-600 mx-auto mb-1" />
                  <span className="text-[11px] text-slate-400 block font-medium">মোট প্রশ্ন</span>
                  <span className="text-base font-bold text-slate-800">
                    {exam.questions.length} টি
                  </span>
                </div>
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                  <Award className="w-5 h-5 text-primary-600 mx-auto mb-1" />
                  <span className="text-[11px] text-slate-400 block font-medium">পূর্ণমান</span>
                  <span className="text-base font-bold text-slate-800">{exam.totalMarks}</span>
                </div>
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                  <ShieldCheck className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
                  <span className="text-[11px] text-slate-400 block font-medium">পাস মার্ক</span>
                  <span className="text-base font-bold text-emerald-600">{exam.passMarks}</span>
                </div>
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 col-span-2 sm:col-span-1">
                  <RotateCcw className="w-5 h-5 text-indigo-600 mx-auto mb-1" />
                  <span className="text-[11px] text-slate-400 block font-medium">প্রচেষ্টার সীমা</span>
                  <span className="text-base font-bold text-indigo-700">
                    {exam.attemptsCount ?? 0} / {exam.maxAttempts ?? 3}
                  </span>
                </div>
              </div>

              {/* Retake Policy & Attempt Tracking Banner */}
              {exam.canAttempt === false ? (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-rose-800 text-xs">
                  <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                  <div>
                    <span className="font-bold block text-sm">সর্বোচ্চ প্রচেষ্টার সীমা সমাপ্ত (Attempt Limit Reached)</span>
                    <span className="text-[11px]">
                      আপনি এই পরীক্ষার জন্য নির্ধারিত সর্বোচ্চ {exam.maxAttempts ?? 3} টি প্রচেষ্টা ইতিমধ্যে সম্পন্ন করেছেন। নতুন করে পুনরায় অংশ নেওয়ার সুযোগ নেই।
                    </span>
                  </div>
                </div>
              ) : exam.attemptsCount > 0 ? (
                <div className="p-3.5 bg-indigo-50 border border-indigo-200 rounded-2xl flex flex-wrap items-center justify-between gap-2 text-xs text-indigo-900">
                  <div className="flex items-center gap-2 font-semibold">
                    <RotateCcw className="w-4 h-4 text-indigo-600" />
                    <span>
                      আপনি ইতিমধ্যে {exam.attemptsCount} বার পরীক্ষা দিয়েছেন। আপনার আর <strong>{exam.remainingAttempts}</strong> বার প্রচেষ্টা বাকি আছে।
                    </span>
                  </div>
                  <Badge variant="outline" className="bg-white border-indigo-300 text-indigo-800 text-[10px] shrink-0">
                    সর্বোচ্চ {exam.maxAttempts ?? 3} বার
                  </Badge>
                </div>
              ) : null}

              {/* Negative Marking Policy Banner */}
              {exam.hasNegativeMarking ? (
                <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 text-amber-900 font-semibold">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                    <span>
                      নেগেটিভ মার্কিং সক্রিয়: ভুল উত্তরের জন্য <strong>-{exam.negativeMarkingValue ?? 0.25}</strong> নম্বর কর্তন করা হবে।
                    </span>
                  </div>
                  <Badge variant="outline" className="bg-white border-amber-300 text-amber-800 text-[10px] shrink-0">
                    এড়িয়ে গেলে ০ পেনাল্টি
                  </Badge>
                </div>
              ) : (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center gap-2 text-xs text-slate-600">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>এই পরীক্ষায় কোনো নেগেটিভ মার্কিং নেই। প্রতিটি ভুল উত্তরের জন্য ০ নম্বর।</span>
                </div>
              )}

              {/* Instructions */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  পরীক্ষার নিয়মাবলি ও নির্দেশিকা:
                </h3>
                <ul className="space-y-2 text-xs text-slate-600 list-disc list-inside">
                  <li>
                    প্রশ্নপত্রে গাণিতিক ও বৈজ্ঞানিক সূত্রসমূহ <span className="font-semibold text-primary-700">LaTeX / KaTeX</span> ফরম্যাটে সঠিকভাবে রেন্ডার করা হয়েছে।
                  </li>
                  <li>
                    পরীক্ষাটিতে MCQ, সত্য/মিথ্যা, সংক্ষিপ্ত উত্তর ও কোডিং ভেরিফিকেশন প্রশ্ন অন্তর্ভুক্ত থাকতে পারে।
                  </li>
                  <li>
                    এই পরীক্ষায় একজন শিক্ষার্থী সর্বোচ্চ <strong className="text-indigo-700">{exam.maxAttempts ?? 3} বার</strong> অংশ নিতে পারবেন।
                  </li>
                  {exam.hasNegativeMarking ? (
                    <li className="text-amber-800 font-medium">
                      নেগেটিভ মার্কিং থাকায় নিশ্চিত না হয়ে উত্তর দেওয়া পরিহার করুন। যে প্রশ্নটির উত্তর আপনি দেবেন না (এড়িয়ে যাবেন), সেটিতে কোনো নম্বর কাটা হবে না।
                    </li>
                  ) : (
                    <li>
                      ভুল উত্তরের জন্য কোনো নম্বর কাটা হবে না।
                    </li>
                  )}
                  <li>
                    পরীক্ষা শুরু করার পর টাইমার স্বয়ংক্রিয়ভাবে চালু হবে এবং নির্ধারিত সময় শেষে স্বয়ংক্রিয়ভাবে জমা হবে।
                  </li>
                  <li>
                    পরীক্ষা শেষে প্রতিটি প্রশ্নের সঠিক উত্তর এবং বিস্তারিত ব্যাখ্যা দেখতে পাবেন।
                  </li>
                </ul>
              </div>

              {/* Start Button or Enrollment Requirement */}
              <div className="pt-4">
                {exam.isCooldownActive ? (
                  <div className="space-y-4">
                    <div className="p-5 bg-gradient-to-br from-indigo-50 to-blue-50 border border-blue-200 rounded-3xl space-y-3">
                      <div className="flex items-center gap-2.5 text-blue-900 font-bold text-sm">
                        <Clock className="w-5 h-5 text-blue-600" />
                        <span>বাধ্যতামূলক ২৪ ঘণ্টার কুলডাউন বিরতি (24-Hour Cooldown)</span>
                      </div>
                      <p className="text-xs text-blue-800 leading-relaxed">
                        ইন্সট্রাক্টরের নিয়ম অনুসারে পরীক্ষার প্রতিটি প্রচেষ্টার পর শিক্ষার্থীদের ভুল পর্যালোচনা নিশ্চিত করতে ২৪ ঘণ্টা বিরতি বাধ্যতামূলক। অনুগ্রহ করে পূর্ববর্তী পরীক্ষার ভুলগুলো পর্যালোচনা করুন।
                      </p>
                      <div className="flex items-center justify-between p-3 bg-white/90 rounded-2xl border border-blue-100 text-xs">
                        <span className="font-semibold text-slate-700">পরবর্তী প্রচেষ্টার সুযোগ:</span>
                        <span className="font-mono font-bold text-blue-700 bg-blue-100/80 px-2.5 py-1 rounded-lg">
                          আর {exam.cooldownRemainingHours || 0} ঘণ্টা {exam.cooldownRemainingMinutes || 0} মিনিট
                        </span>
                      </div>
                    </div>
                    <Button
                      disabled
                      size="lg"
                      className="w-full bg-slate-200 text-slate-500 font-bold text-sm py-6 rounded-2xl cursor-not-allowed shadow-none"
                    >
                      <Lock className="w-4 h-4 mr-2" />
                      <span>২৪ ঘণ্টার বিরতি সক্রিয় (লকড)</span>
                    </Button>
                    <div className="text-center">
                      <Link href="/exams" className="inline-block text-xs text-primary-600 hover:underline font-semibold">
                        সকল পরীক্ষায় ফিরে যান
                      </Link>
                    </div>
                  </div>
                ) : exam.canAttempt === false ? (
                  <div className="space-y-3 text-center">
                    <Button
                      disabled
                      size="lg"
                      className="w-full bg-slate-200 text-slate-500 font-bold text-sm py-6 rounded-2xl cursor-not-allowed shadow-none"
                    >
                      <span>সর্বোচ্চ প্রচেষ্টার সীমা সমাপ্ত ({exam.attemptsCount}/{exam.maxAttempts ?? 3})</span>
                    </Button>
                    <Link href="/exams" className="inline-block text-xs text-primary-600 hover:underline font-semibold">
                      সকল পরীক্ষায় ফিরে যান
                    </Link>
                  </div>
                ) : exam.requiresEnrollment && !exam.isEnrolledInCourse ? (
                  <div className="space-y-3">
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-3 text-amber-800 text-xs">
                      <Lock className="w-5 h-5 text-amber-600 shrink-0" />
                      <span>
                        এই পরীক্ষাটি <strong className="font-semibold">{exam.courseTitle || 'কোর্স'}</strong> এর শিক্ষার্থীদের জন্য সংরক্ষিত। পরীক্ষায় অংশ নিতে অনুগ্রহ করে সংশ্লিষ্ট কোর্সে ভর্তি হন।
                      </span>
                    </div>
                    <Link href={`/courses/${exam.courseId || ''}`} className="block">
                      <Button
                        size="lg"
                        className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold text-sm py-6 rounded-2xl shadow-md gap-2"
                      >
                        <CreditCard className="w-4 h-4" />
                        <span>কোর্সে ভর্তি হন (Enroll Now)</span>
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <Button
                    onClick={() => setExamState('TAKING')}
                    size="lg"
                    className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold text-sm py-6 rounded-2xl shadow-md gap-2"
                  >
                    <span>
                      {exam.attemptsCount > 0
                        ? `পুনরায় পরীক্ষা শুরু করুন (প্রচেষ্টা #${exam.attemptsCount + 1})`
                        : 'পরীক্ষা শুরু করুন'}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Screen 2: Active Exam Mode */}
      {examState === 'TAKING' && (
        <ExamActivePlayer
          examId={exam.id}
          title={exam.title}
          courseTitle={exam.courseTitle}
          durationMinutes={exam.duration}
          totalMarks={exam.totalMarks}
          questions={exam.questions}
          hasNegativeMarking={exam.hasNegativeMarking}
          negativeMarkingValue={exam.negativeMarkingValue}
          onSubmit={handleSubmitExam}
          isSubmitting={isSubmitting}
        />
      )}

      {/* Screen 3: Post Exam Result & Solution Review */}
      {examState === 'RESULT' && resultData && (
        <ExamResultCard
          score={resultData.score}
          rawEarnedScore={resultData.rawEarnedScore}
          totalMarks={resultData.totalMarks}
          percentage={resultData.percentage}
          passed={resultData.passed}
          timeTakenSeconds={resultData.timeTakenSeconds}
          hasNegativeMarking={resultData.hasNegativeMarking}
          negativeMarkingRate={resultData.negativeMarkingRate}
          negativeMarksDeducted={resultData.negativeMarksDeducted}
          totalCorrect={resultData.totalCorrect}
          totalWrong={resultData.totalWrong}
          totalSkipped={resultData.totalSkipped}
          attemptNumber={resultData.attemptNumber}
          maxAttempts={resultData.maxAttempts ?? exam.maxAttempts}
          attemptsRemaining={resultData.attemptsRemaining}
          canRetake={resultData.canRetake}
          breakdown={resultData.breakdown}
          onRetake={handleRetake}
        />
      )}
    </div>
  );
}
