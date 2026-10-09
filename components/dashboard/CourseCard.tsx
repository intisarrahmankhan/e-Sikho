'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  PlayCircle,
  Calendar,
  CheckCircle2,
  Sliders,
  Zap,
  RotateCcw,
  Sparkles,
  Target,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { RescheduleModal } from '@/components/modals/RescheduleModal';
import { useLanguage } from '@/context/LanguageContext';
import { GeneratedSchedulePlan } from '@/lib/routine-scheduler';

export interface CourseProps {
  id: string;
  title: string;
  titleEn?: string;
  thumbnailUrl: string;
  thumbnailUrlEn?: string;
  progressPercentage: number;
  targetCompletionDate: string;
  paceMode?: string;
}

export function CourseCard({ course }: { course: CourseProps }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [targetDate, setTargetDate] = useState(course.targetCompletionDate);
  const [currentPaceMode, setCurrentPaceMode] = useState<string | undefined>(course.paceMode);
  const { language } = useLanguage();

  const displayTitle = language === 'en' && course.titleEn ? course.titleEn : course.title;
  const displayThumbnail =
    language === 'en' && course.thumbnailUrlEn ? course.thumbnailUrlEn : course.thumbnailUrl;

  const handleRescheduleSuccess = (newPlan: GeneratedSchedulePlan) => {
    setTargetDate(newPlan.targetCompletionDate);
    setCurrentPaceMode(newPlan.paceMode);
  };

  return (
    <>
      <Card className="overflow-hidden border border-slate-200/90 rounded-2xl bg-white hover:shadow-lg transition-all duration-300 flex flex-col group">
        {/* Thumbnail banner */}
        <div className="relative h-40 w-full overflow-hidden bg-slate-100">
          <img
            src={displayThumbnail}
            alt={displayTitle}
            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 items-center">
            <Badge className="bg-primary-600 text-white font-semibold text-[11px] shadow-sm">
              {language === 'en' ? 'Enrolled' : 'এনরোল্ড'}
            </Badge>

            {currentPaceMode === 'ACCELERATED' && (
              <Badge className="bg-amber-400 text-slate-950 font-bold text-[10px] shadow-xs flex items-center gap-1">
                <Zap className="h-3 w-3 fill-slate-950" />
                <span>{language === 'en' ? '1-Mo Sprint' : '১ মাসে শেষ'}</span>
              </Badge>
            )}

            {currentPaceMode === 'REBALANCED_CATCHUP' && (
              <Badge className="bg-emerald-400 text-slate-950 font-bold text-[10px] shadow-xs flex items-center gap-1">
                <RotateCcw className="h-3 w-3" />
                <span>{language === 'en' ? 'Rebalanced' : 'রুটিন অ্যাডজাস্টেড'}</span>
              </Badge>
            )}
          </div>

          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-xs">
            <span className="font-semibold text-emerald-300 flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" />
              {course.progressPercentage}% {language === 'en' ? 'Completed' : 'সম্পন্ন'}
            </span>

            <Link
              href={`/student/goals?courseId=${course.id}`}
              className="text-[11px] font-semibold text-slate-200 hover:text-white flex items-center gap-1 bg-black/40 px-2.5 py-1 rounded-full backdrop-blur-xs transition"
            >
              <Target className="h-3 w-3" />
              <span>{language === 'en' ? 'Daily Routine' : 'দৈনিক রুটিন'}</span>
            </Link>
          </div>
        </div>

        {/* Content */}
        <CardContent className="p-5 flex-1 flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <h3 className="font-bold text-slate-900 text-base line-clamp-2 leading-snug group-hover:text-primary-600 transition-colors">
              {displayTitle}
            </h3>

            {/* Progress Bar */}
            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between text-xs text-slate-500 font-medium">
                <span>{language === 'en' ? 'Learning Progress' : 'শেখার অগ্রগতি'}</span>
                <span className="text-primary-600 font-bold">{course.progressPercentage}%</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary-500 to-indigo-600 transition-all duration-500 rounded-full"
                  style={{ width: `${Math.max(course.progressPercentage, 5)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Target Date & Reschedule Action */}
          <div className="pt-2 border-t border-slate-100 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-indigo-500" />
                <span>
                  {language === 'en' ? 'Target: ' : 'টার্গেট: '}
                  <strong className="text-slate-800">
                    {new Date(targetDate).toLocaleDateString(language === 'en' ? 'en-US' : 'bn-BD', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </strong>
                </span>
              </span>

              <button
                onClick={() => setIsModalOpen(true)}
                className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition"
              >
                <Sliders className="h-3 w-3" />
                <span>{language === 'en' ? 'Adjust Routine' : 'রুটিন পরিবর্তন'}</span>
              </button>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-1">
              <Link href={`/courses/${course.id}`} className="flex-1">
                <Button className="w-full gap-1.5 bg-primary-600 hover:bg-primary-700 text-white font-semibold text-xs py-2 rounded-xl shadow-sm">
                  <PlayCircle className="h-4 w-4" />
                  <span>{language === 'en' ? 'Start Class' : 'ক্লাস শুরু করুন'}</span>
                </Button>
              </Link>
              <Button
                variant="outline"
                className="px-3 text-xs border-indigo-200 text-indigo-700 hover:bg-indigo-50 rounded-xl"
                onClick={() => setIsModalOpen(true)}
                title={language === 'en' ? 'Reschedule Routine' : 'রুটিন স্বয়ংক্রিয় সমন্বয়'}
              >
                <Sliders className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <RescheduleModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        courseId={course.id}
        currentTargetDate={targetDate}
        courseTitle={displayTitle}
        onSuccess={handleRescheduleSuccess}
      />
    </>
  );
}

export default CourseCard;
