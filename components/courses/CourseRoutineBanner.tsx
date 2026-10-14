'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import {
  Calendar,
  Clock,
  Sparkles,
  Zap,
  RotateCcw,
  Sliders,
  CheckCircle2,
  Video,
  FileQuestion,
  Target,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { RescheduleModal } from '@/components/modals/RescheduleModal';
import { useLanguage } from '@/context/LanguageContext';
import { getCourseRoutineAction } from '@/actions/routine';
import { GeneratedSchedulePlan } from '@/lib/routine-scheduler';

interface CourseRoutineBannerProps {
  courseId: string;
  courseTitle: string;
}

export function CourseRoutineBanner({ courseId, courseTitle }: CourseRoutineBannerProps) {
  const { data: session, status } = useSession();
  const { language } = useLanguage();

  const [routinePlan, setRoutinePlan] = useState<GeneratedSchedulePlan | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (status !== 'authenticated' || !courseId) return;

    let isMounted = true;
    setIsLoading(true);

    getCourseRoutineAction(courseId)
      .then((res) => {
        if (!isMounted) return;
        if (res.success && res.routine) {
          setRoutinePlan(res.routine);
        }
      })
      .catch((err) => {
        console.error('Error fetching routine for course banner:', err);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [courseId, status]);

  if (status !== 'authenticated' || !routinePlan) {
    return null;
  }

  const handleRescheduleSuccess = (newPlan: GeneratedSchedulePlan) => {
    setRoutinePlan(newPlan);
  };

  return (
    <>
      <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/90 via-white to-violet-50/70 p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-slate-900">
                  {language === 'en'
                    ? 'Your Personalized Study Routine'
                    : 'আপনার ব্যক্তিগত স্টাডি রুটিন ও সময়সূচি'}
                </h3>
                {routinePlan.paceMode === 'ACCELERATED' && (
                  <Badge className="bg-amber-400 text-slate-950 font-bold text-[10px] flex items-center gap-1">
                    <Zap className="h-3 w-3 fill-slate-950" />
                    <span>{language === 'en' ? '1-Mo Sprint' : '১ মাসে শেষ'}</span>
                  </Badge>
                )}
                {routinePlan.paceMode === 'REBALANCED_CATCHUP' && (
                  <Badge className="bg-emerald-500 text-white font-bold text-[10px] flex items-center gap-1">
                    <RotateCcw className="h-3 w-3" />
                    <span>{language === 'en' ? 'Rebalanced' : 'রুটিন অ্যাডজাস্টেড'}</span>
                  </Badge>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {language === 'en'
                  ? 'Adaptive pacing auto-assigns lectures, live classes, and exams.'
                  : 'সিস্টেম স্বয়ংক্রিয়ভাবে আপনার সুবিধাজনক সময়সীমায় লেকচার ও পরীক্ষা বরাদ্দ করেছে।'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              size="sm"
              onClick={() => setIsModalOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl px-4 py-2 gap-1.5 shadow-xs"
            >
              <Sliders className="h-3.5 w-3.5" />
              <span>{language === 'en' ? 'Reschedule Course' : 'রুটিন স্বয়ংক্রিয় রি-শিডিউল'}</span>
            </Button>
            <Link href={`/student/goals?courseId=${courseId}`}>
              <Button
                variant="outline"
                size="sm"
                className="text-xs font-semibold text-indigo-700 border-indigo-200 hover:bg-indigo-50 rounded-xl px-3 py-2"
              >
                <Target className="h-3.5 w-3.5" />
                <span>{language === 'en' ? 'Full Routine' : 'পূর্ণাঙ্গ রুটিন'}</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Metric Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t border-indigo-100/60">
          <div className="rounded-xl bg-white/80 p-2.5 border border-indigo-50">
            <span className="text-[10px] font-medium text-slate-400 block">
              {language === 'en' ? 'Target Date' : 'সমাপ্তির তারিখ'}
            </span>
            <span className="text-xs font-bold text-slate-800">
              {new Date(routinePlan.targetCompletionDate).toLocaleDateString(
                language === 'en' ? 'en-US' : 'bn-BD',
                { month: 'short', day: 'numeric', year: 'numeric' }
              )}
            </span>
          </div>

          <div className="rounded-xl bg-white/80 p-2.5 border border-indigo-50">
            <span className="text-[10px] font-medium text-slate-400 block">
              {language === 'en' ? 'Daily Pace' : 'দৈনিক লেকচার'}
            </span>
            <span className="text-xs font-bold text-slate-800">
              {routinePlan.averageLecturesPerDay} {language === 'en' ? 'lec/day' : 'টি / দিন'}
            </span>
          </div>

          <div className="rounded-xl bg-white/80 p-2.5 border border-indigo-50">
            <span className="text-[10px] font-medium text-slate-400 block">
              {language === 'en' ? 'Live Classes' : 'লাইভ ক্লাস'}
            </span>
            <span className="text-xs font-bold text-blue-600">
              {routinePlan.totalLiveClasses} {language === 'en' ? 'sessions' : 'টি সেশন'}
            </span>
          </div>

          <div className="rounded-xl bg-white/80 p-2.5 border border-indigo-50">
            <span className="text-[10px] font-medium text-slate-400 block">
              {language === 'en' ? 'Deadline Shrunk' : 'ডেডলাইন সংকুচিত'}
            </span>
            <span className="text-xs font-bold text-emerald-600">
              {routinePlan.daysSaved > 0
                ? `${routinePlan.daysSaved} ${language === 'en' ? 'days saved' : 'দিন সাশ্রয়'}`
                : language === 'en'
                ? 'Standard'
                : 'স্বাভাবিক'}
            </span>
          </div>
        </div>
      </div>

      <RescheduleModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        courseId={courseId}
        currentTargetDate={routinePlan.targetCompletionDate}
        courseTitle={courseTitle}
        onSuccess={handleRescheduleSuccess}
      />
    </>
  );
}

export default CourseRoutineBanner;
