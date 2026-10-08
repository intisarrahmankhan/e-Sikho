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
    answers: Record<number, number>,
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

  const handleRetake = () => {
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
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
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
              </div>

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
                    প্রতিটি প্রশ্নের জন্য ৪টি করে বিকল্প থাকবে, যার মধ্যে সঠিক উত্তরটি নির্বাচন করতে হবে।
                  </li>
                  <li>
                    পরীক্ষা শুরু করার পর টাইমার স্বয়ংক্রিয়ভাবে চালু হবে এবং নির্ধারিত সময় শেষে স্বয়ংক্রিয়ভাবে জমা হবে।
                  </li>
                  <li>
                    পরীক্ষা শেষে প্রতিটি প্রশ্নের সঠিক উত্তর এবং বিস্তারিত ব্যাখ্যা দেখতে পাবেন।
                  </li>
                </ul>
              </div>

              {/* Start Button */}
              <div className="pt-4">
                <Button
                  onClick={() => setExamState('TAKING')}
                  size="lg"
                  className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold text-sm py-6 rounded-2xl shadow-md gap-2"
                >
                  <span>পরীক্ষা শুরু করুন</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
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
          onSubmit={handleSubmitExam}
          isSubmitting={isSubmitting}
        />
      )}

      {/* Screen 3: Post Exam Result & Solution Review */}
      {examState === 'RESULT' && resultData && (
        <ExamResultCard
          score={resultData.score}
          totalMarks={resultData.totalMarks}
          percentage={resultData.percentage}
          passed={resultData.passed}
          timeTakenSeconds={resultData.timeTakenSeconds}
          breakdown={resultData.breakdown}
          onRetake={handleRetake}
        />
      )}
    </div>
  );
}
