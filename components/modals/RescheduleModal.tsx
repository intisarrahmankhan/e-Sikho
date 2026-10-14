'use client';

import React, { useState, useEffect, useTransition } from 'react';
import {
  Calendar,
  Loader2,
  X,
  Zap,
  RotateCcw,
  Sliders,
  CheckCircle2,
  Clock,
  BookOpen,
  Video,
  FileQuestion,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { useLanguage } from '@/context/LanguageContext';
import {
  previewRescheduleAction,
  saveCourseRoutineAction,
} from '@/actions/routine';
import {
  GeneratedSchedulePlan,
  GeneratedRoutineItem,
} from '@/lib/routine-scheduler';
import { RoutinePaceMode } from '@/models/CourseRoutine';

interface RescheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  courseId: string;
  courseTitle: string;
  currentTargetDate?: string;
  totalLessons?: number;
  onSuccess?: (plan: GeneratedSchedulePlan) => void;
}

export function RescheduleModal({
  isOpen,
  onClose,
  courseId,
  courseTitle,
  currentTargetDate,
  totalLessons = 24,
  onSuccess,
}: RescheduleModalProps) {
  const { language } = useLanguage();
  const [isPending, startTransition] = useTransition();

  // Mode Selection
  const [paceMode, setPaceMode] = useState<RoutinePaceMode>('ACCELERATED');
  const [elapsedMonths, setElapsedMonths] = useState<number>(2);
  const [targetMonths, setTargetMonths] = useState<number>(1);
  const [customTargetDate, setCustomTargetDate] = useState<string>('');
  const [daysPerWeek, setDaysPerWeek] = useState<number>(5);
  const [dailyHours, setDailyHours] = useState<number>(2);
  const [reason, setReason] = useState<string>('');

  // Generated Plan State
  const [plan, setPlan] = useState<GeneratedSchedulePlan | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState<boolean>(false);
  const [showFullTimeline, setShowFullTimeline] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Set default custom target date 1 month from now
  useEffect(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    setCustomTargetDate(d.toISOString().split('T')[0]);
  }, []);

  // Update preview when parameters change
  useEffect(() => {
    if (!isOpen || !courseId) return;

    let isMounted = true;
    setIsPreviewLoading(true);
    setErrorMessage('');

    const targetCompletionDate =
      paceMode === 'CUSTOM' && customTargetDate ? customTargetDate : undefined;

    previewRescheduleAction(courseId, {
      paceMode,
      targetDurationMonths: paceMode === 'ACCELERATED' ? 1 : paceMode === 'REBALANCED_CATCHUP' ? Math.max(1, 4 - elapsedMonths) : targetMonths,
      targetCompletionDate,
      elapsedMonths: paceMode === 'REBALANCED_CATCHUP' ? elapsedMonths : 0,
      daysPerWeek,
      dailyHours,
      rescheduleReason: reason,
    })
      .then((res) => {
        if (!isMounted) return;
        if (res.success && res.plan) {
          setPlan(res.plan);
        } else if (res.error) {
          setErrorMessage(res.error);
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error('Failed to preview reschedule:', err);
      })
      .finally(() => {
        if (isMounted) setIsPreviewLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [
    isOpen,
    courseId,
    paceMode,
    elapsedMonths,
    targetMonths,
    customTargetDate,
    daysPerWeek,
    dailyHours,
    reason,
  ]);

  if (!isOpen) return null;

  const handleApplySchedule = () => {
    startTransition(async () => {
      setErrorMessage('');
      const res = await saveCourseRoutineAction({
        courseId,
        paceMode,
        targetDurationMonths:
          paceMode === 'ACCELERATED'
            ? 1
            : paceMode === 'REBALANCED_CATCHUP'
            ? Math.max(1, 4 - elapsedMonths)
            : targetMonths,
        targetCompletionDate:
          paceMode === 'CUSTOM' && customTargetDate ? customTargetDate : undefined,
        elapsedMonths: paceMode === 'REBALANCED_CATCHUP' ? elapsedMonths : 0,
        daysPerWeek,
        dailyHours,
        rescheduleReason: reason,
      });

      if (res.success && res.plan) {
        setSaveSuccess(true);
        if (onSuccess) onSuccess(res.plan);
        setTimeout(() => {
          setSaveSuccess(false);
          onClose();
        }, 1200);
      } else {
        setErrorMessage(res.error || 'Failed to save schedule');
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      {/* Dark Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-2xl max-h-[92vh] flex flex-col rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-200 my-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-primary-500/20 border border-primary-400/30 flex items-center justify-center text-primary-300">
              <Sparkles className="w-5 h-5 text-indigo-300" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold leading-tight">
                {language === 'en'
                  ? 'Smart Course Auto-Reschedule'
                  : 'কোর্স রুটিন স্বয়ংক্রিয় রি-শিডিউল ও অ্যাডজাস্ট'}
              </h2>
              <p className="text-xs text-slate-300 line-clamp-1">{courseTitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 sm:p-6 space-y-6 overflow-y-auto flex-1">
          {/* Preset Mode Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
              {language === 'en' ? 'Select Rescheduling Strategy' : 'রি-শিডিউলিং কৌশল নির্বাচন করুন'}
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Option 1: 1-Month Accelerated Sprint */}
              <button
                type="button"
                onClick={() => {
                  setPaceMode('ACCELERATED');
                  setTargetMonths(1);
                }}
                className={`text-left p-3.5 rounded-xl border-2 transition-all flex flex-col justify-between ${
                  paceMode === 'ACCELERATED'
                    ? 'border-indigo-600 bg-indigo-50/60 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-white">
                      <Zap className="h-4 w-4" />
                    </span>
                    <Badge className="bg-indigo-100 text-indigo-700 text-[10px] font-bold">
                      {language === 'en' ? 'Fast Track' : '১ মাসে শেষ'}
                    </Badge>
                  </div>
                  <h3 className="font-bold text-xs sm:text-sm text-slate-900">
                    {language === 'en' ? '1-Month Fast Sprint' : '১ মাসে দ্রুত সমাপ্তি'}
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                    {language === 'en'
                      ? 'Compress entire course into 30 days. System auto-assigns lectures daily.'
                      : 'পুরো কোর্স ১ মাসে সম্পন্ন করতে সিস্টেম স্বয়ংক্রিয়ভাবে প্রতিদিনের লেকচার ও লাইভ ক্লাস বন্টন করবে।'}
                  </p>
                </div>
              </button>

              {/* Option 2: Fell Behind (Catch-up & Rebalance) */}
              <button
                type="button"
                onClick={() => {
                  setPaceMode('REBALANCED_CATCHUP');
                  setElapsedMonths(2);
                }}
                className={`text-left p-3.5 rounded-xl border-2 transition-all flex flex-col justify-between ${
                  paceMode === 'REBALANCED_CATCHUP'
                    ? 'border-amber-500 bg-amber-50/60 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500 text-white">
                      <RotateCcw className="h-4 w-4" />
                    </span>
                    <Badge className="bg-amber-100 text-amber-700 text-[10px] font-bold">
                      {language === 'en' ? 'Catch-Up' : 'ক্যাচ-আপ'}
                    </Badge>
                  </div>
                  <h3 className="font-bold text-xs sm:text-sm text-slate-900">
                    {language === 'en' ? 'Missed Classes Rebalance' : '২ মাস পর রুটিন অ্যাডজাস্ট'}
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                    {language === 'en'
                      ? 'Fell behind on live classes or exams? Reallocate rest of course into remaining duration.'
                      : 'পরীক্ষা বা লাইভ ক্লাস মিস হয়ে থাকলে বাকি লেকচারগুলো অবশিষ্ট সময়সীমায় রি-শিডিউল হবে।'}
                  </p>
                </div>
              </button>

              {/* Option 3: Custom Pacing */}
              <button
                type="button"
                onClick={() => setPaceMode('CUSTOM')}
                className={`text-left p-3.5 rounded-xl border-2 transition-all flex flex-col justify-between ${
                  paceMode === 'CUSTOM'
                    ? 'border-emerald-600 bg-emerald-50/60 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600 text-white">
                      <Sliders className="h-4 w-4" />
                    </span>
                    <Badge className="bg-emerald-100 text-emerald-700 text-[10px] font-bold">
                      {language === 'en' ? 'Custom' : 'কাস্টম'}
                    </Badge>
                  </div>
                  <h3 className="font-bold text-xs sm:text-sm text-slate-900">
                    {language === 'en' ? 'Custom Target & Routine' : 'কাস্টম লক্ষ্য ও সময়সীমা'}
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                    {language === 'en'
                      ? 'Pick your exact target date, study days, and hours per week.'
                      : 'নিজের সুবিধাজনক শেষ করার তারিখ এবং সাপ্তাহিক পড়ার দিন নির্ধারণ করুন।'}
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Context Details based on selected mode */}
          <div className="rounded-xl bg-slate-50 p-4 border border-slate-200 space-y-4">
            {paceMode === 'REBALANCED_CATCHUP' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700">
                    {language === 'en'
                      ? 'Course duration elapsed before falling behind:'
                      : 'কোর্স শুরুর কত সময় পর রি-শিডিউল করছেন?'}
                  </span>
                  <span className="font-bold text-amber-600">
                    {elapsedMonths} {language === 'en' ? 'Months' : 'মাস'}
                  </span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="3.5"
                  step="0.5"
                  value={elapsedMonths}
                  onChange={(e) => setElapsedMonths(parseFloat(e.target.value))}
                  className="w-full accent-amber-500"
                />
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>0.5 {language === 'en' ? 'mo' : 'মাস'}</span>
                  <span>1 {language === 'en' ? 'mo' : 'মাস'}</span>
                  <span className="font-bold text-amber-600">2 {language === 'en' ? 'mo (Mid-course)' : 'মাস (অর্ধেক)'}</span>
                  <span>3 {language === 'en' ? 'mo' : 'মাস'}</span>
                </div>
                <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-2.5">
                  💡 {language === 'en'
                    ? `System shrinks the course deadline to the remaining ${(4 - elapsedMonths).toFixed(1)} months and redistributes all missed lectures & exams!`
                    : `সিস্টেম কোর্স ডেডলাইন কমিয়ে অবশিষ্ট ${(4 - elapsedMonths).toFixed(1)} মাসে সংকুচিত করবে এবং মিস হওয়া সব লেকচার ও পরীক্ষা পুনরায় সাজাবে!`}
                </p>
              </div>
            )}

            {paceMode === 'ACCELERATED' && (
              <div className="flex items-center gap-3 text-xs text-indigo-900 bg-indigo-50/80 border border-indigo-200 rounded-lg p-3">
                <Zap className="h-5 w-5 text-indigo-600 shrink-0" />
                <div>
                  <span className="font-bold">
                    {language === 'en' ? 'Targeting completion in 30 Days:' : '৩০ দিনের ফাস্ট-ট্র্যাক লক্ষ্যমাত্রা:'}
                  </span>{' '}
                  {language === 'en'
                    ? '4-month course routine will be automatically compressed to 1 month with daily assigned lectures and milestone exams.'
                    : 'সাধারণ ৪ মাসের কোর্স রুটিন ১ মাসে সংকুচিত হয়ে যাবে। প্রতিদিন নির্দিষ্ট লেকচার ও প্রতি সপ্তাহে লাইভ সেশন অ্যাসাইন হবে।'}
                </div>
              </div>
            )}

            {paceMode === 'CUSTOM' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    {language === 'en' ? 'New Target Completion Date' : 'নতুন টার্গেট সমাপ্তির তারিখ'}
                  </label>
                  <Input
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    value={customTargetDate}
                    onChange={(e) => setCustomTargetDate(e.target.value)}
                    className="w-full text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    {language === 'en' ? 'Study Days / Week' : 'সপ্তাহে পড়ার দিন'}
                  </label>
                  <select
                    value={daysPerWeek}
                    onChange={(e) => setDaysPerWeek(parseInt(e.target.value, 10))}
                    className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs"
                  >
                    <option value={7}>{language === 'en' ? '7 Days (Everyday)' : '৭ দিন (প্রতিদিন)'}</option>
                    <option value={5}>{language === 'en' ? '5 Days (Weekdays)' : '৫ দিন (রেগুলার)'}</option>
                    <option value={3}>{language === 'en' ? '3 Days (Relaxed)' : '৩ দিন (রিলাক্সড)'}</option>
                  </select>
                </div>
              </div>
            )}

            {/* Common Pacing Controls */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-200/80">
              <div>
                <span className="text-[11px] text-slate-500 font-medium block">
                  {language === 'en' ? 'Study Days/Week' : 'পড়ার দিন / সপ্তাহ'}
                </span>
                <span className="text-xs font-bold text-slate-800">
                  {daysPerWeek} {language === 'en' ? 'days' : 'দিন'}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-slate-500 font-medium block">
                  {language === 'en' ? 'Daily Commitment' : 'প্রতিদিনের সময়'}
                </span>
                <span className="text-xs font-bold text-slate-800">
                  ~{dailyHours} {language === 'en' ? 'hours/day' : 'ঘণ্টা/দিন'}
                </span>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <span className="text-[11px] text-slate-500 font-medium block">
                  {language === 'en' ? 'Current Target' : 'বর্তমান টার্গেট'}
                </span>
                <span className="text-xs font-bold text-slate-800">
                  {currentTargetDate
                    ? new Date(currentTargetDate).toLocaleDateString(language === 'en' ? 'en-US' : 'bn-BD')
                    : language === 'en' ? '4 Months' : '৪ মাস'}
                </span>
              </div>
            </div>
          </div>

          {/* System Calculated Schedule Overview */}
          {plan && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>
                    {language === 'en'
                      ? 'System Generated Routine Summary'
                      : 'সিস্টেম জেনারেটেড রুটিন সারসংক্ষেপ'}
                  </span>
                </h4>
                {plan.shrinkPercentage > 0 && (
                  <Badge className="bg-emerald-100 text-emerald-800 font-bold text-xs border border-emerald-200">
                    ⚡ {plan.shrinkPercentage}% {language === 'en' ? 'Deadline Shrunk' : 'ডেডলাইন সংকুচিত'}
                  </Badge>
                )}
              </div>

              {/* Metric Cards Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-xs">
                  <div className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                    <BookOpen className="h-3 w-3 text-indigo-500" />
                    <span>{language === 'en' ? 'Daily Workload' : 'প্রতিদিনের লেকচার'}</span>
                  </div>
                  <div className="text-base sm:text-lg font-black text-slate-900 mt-0.5">
                    {plan.averageLecturesPerDay}{' '}
                    <span className="text-xs font-semibold text-slate-500">
                      {language === 'en' ? 'lec/day' : 'টি / দিন'}
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-xs">
                  <div className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-amber-500" />
                    <span>{language === 'en' ? 'Target Date' : 'সমাপ্তির তারিখ'}</span>
                  </div>
                  <div className="text-xs sm:text-sm font-bold text-slate-900 mt-1 truncate">
                    {new Date(plan.targetCompletionDate).toLocaleDateString(language === 'en' ? 'en-US' : 'bn-BD', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-xs">
                  <div className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                    <Video className="h-3 w-3 text-blue-500" />
                    <span>{language === 'en' ? 'Live Classes' : 'লাইভ ক্লাস'}</span>
                  </div>
                  <div className="text-base sm:text-lg font-black text-blue-600 mt-0.5">
                    {plan.totalLiveClasses}{' '}
                    <span className="text-xs font-semibold text-slate-500">
                      {language === 'en' ? 'sessions' : 'টি সেশন'}
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-xs">
                  <div className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                    <FileQuestion className="h-3 w-3 text-rose-500" />
                    <span>{language === 'en' ? 'Exams & Quizzes' : 'পরীক্ষা ও কুইজ'}</span>
                  </div>
                  <div className="text-base sm:text-lg font-black text-rose-600 mt-0.5">
                    {plan.totalExams}{' '}
                    <span className="text-xs font-semibold text-slate-500">
                      {language === 'en' ? 'tests' : 'টি'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Visual Routine Breakdown */}
              <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs">
                <button
                  type="button"
                  onClick={() => setShowFullTimeline(!showFullTimeline)}
                  className="w-full flex items-center justify-between p-3.5 bg-slate-50 hover:bg-slate-100/70 transition text-left"
                >
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-indigo-600" />
                    <span>
                      {language === 'en'
                        ? `Preview Auto-Assigned Routine (${plan.items.length} Timeline Milestones)`
                        : `অটো-অ্যাসাইন রুটিন প্রিভিউ (${plan.items.length} টি মাইলস্টোন)`}
                    </span>
                  </span>
                  <span className="text-xs text-indigo-600 font-semibold flex items-center gap-1">
                    {showFullTimeline ? (
                      <>
                        <span>{language === 'en' ? 'Hide' : 'সংকুচিত করুন'}</span>
                        <ChevronUp className="h-4 w-4" />
                      </>
                    ) : (
                      <>
                        <span>{language === 'en' ? 'View Schedule' : 'রুটিন দেখুন'}</span>
                        <ChevronDown className="h-4 w-4" />
                      </>
                    )}
                  </span>
                </button>

                {showFullTimeline && (
                  <div className="divide-y divide-slate-100 max-h-56 overflow-y-auto p-2 bg-slate-50/40">
                    {plan.items.map((item, idx) => (
                      <div
                        key={item.id || idx}
                        className="py-2 px-3 flex items-center justify-between text-xs hover:bg-white rounded-lg transition"
                      >
                        <div className="flex items-center gap-2.5 min-w-0 pr-2">
                          {item.itemType === 'LECTURE' && (
                            <BookOpen className="h-4 w-4 text-indigo-600 shrink-0" />
                          )}
                          {item.itemType === 'LIVE_CLASS' && (
                            <Video className="h-4 w-4 text-blue-600 shrink-0" />
                          )}
                          {item.itemType === 'EXAM' && (
                            <FileQuestion className="h-4 w-4 text-rose-600 shrink-0" />
                          )}
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-800 truncate">{item.title}</p>
                            <p className="text-[10px] text-slate-400">
                              {language === 'en' ? `Day ${item.dayNumber} · Week ${item.weekNumber}` : `দিন ${item.dayNumber} · সপ্তাহ ${item.weekNumber}`}
                            </p>
                          </div>
                        </div>
                        <div className="shrink-0 flex items-center gap-2">
                          <span className="text-[11px] text-slate-500 font-medium">
                            {new Date(item.scheduledDate).toLocaleDateString(
                              language === 'en' ? 'en-US' : 'bn-BD',
                              { month: 'short', day: 'numeric' }
                            )}
                          </span>
                          <Badge
                            className={`text-[9px] font-bold ${
                              item.itemType === 'LECTURE'
                                ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                : item.itemType === 'LIVE_CLASS'
                                ? 'bg-blue-50 text-blue-700 border-blue-200'
                                : 'bg-rose-50 text-rose-700 border-rose-200'
                            }`}
                          >
                            {item.itemType}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Optional reason / notes */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">
              {language === 'en' ? 'Reason / Notes for Adjustment (Optional)' : 'রি-শিডিউলের কারণ বা নোট (ঐচ্ছিক)'}
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={
                language === 'en'
                  ? 'e.g. Fell behind on live classes, shifting to accelerated pace...'
                  : 'যেমন: লাইভ ক্লাস ও পরীক্ষা মিস হওয়ায় নতুন সময়সীমায় রুটিন সেট করছি...'
              }
              rows={2}
              className="w-full text-xs rounded-xl border border-slate-200 p-2.5 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          {errorMessage && (
            <p className="text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200 p-2.5 rounded-xl">
              {errorMessage}
            </p>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-t border-slate-200">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isPending}
            className="text-xs"
          >
            {language === 'en' ? 'Cancel' : 'বাতিল'}
          </Button>

          <Button
            type="button"
            onClick={handleApplySchedule}
            disabled={isPending || !plan}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-md gap-2"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>{language === 'en' ? 'Assigning Routine…' : 'রুটিন বরাদ্দ হচ্ছে…'}</span>
              </>
            ) : saveSuccess ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span>{language === 'en' ? 'Routine Applied!' : 'রুটিন প্রয়োগ সম্পন্ন!'}</span>
              </>
            ) : (
              <>
                <Zap className="h-4 w-4" />
                <span>{language === 'en' ? 'Apply & Auto-Assign Routine' : 'স্বয়ংক্রিয় রুটিন প্রয়োগ করুন'}</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default RescheduleModal;
