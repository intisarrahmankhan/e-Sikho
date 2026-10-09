'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import {
  Calendar,
  CheckCircle2,
  Clock,
  BookOpen,
  Video,
  FileQuestion,
  Zap,
  RotateCcw,
  Sliders,
  Sparkles,
  Target,
  ArrowRight,
  Flame,
  Award,
  ChevronRight,
  Loader2,
  Filter,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { RescheduleModal } from '@/components/modals/RescheduleModal';
import { useLanguage } from '@/context/LanguageContext';
import { toggleRoutineItemAction } from '@/actions/routine';
import { GeneratedSchedulePlan, GeneratedRoutineItem } from '@/lib/routine-scheduler';

interface EnrolledCourseSummary {
  id: string;
  title: string;
  titleEn?: string;
  thumbnailUrl: string;
  progressPercentage: number;
  targetCompletionDate: string;
  paceMode?: string;
  initialPlan: GeneratedSchedulePlan;
}

interface StudentGoalsClientProps {
  courses: EnrolledCourseSummary[];
  defaultCourseId?: string;
}

export function StudentGoalsClient({ courses, defaultCourseId }: StudentGoalsClientProps) {
  const { language } = useLanguage();
  const [isPending, startTransition] = useTransition();

  const [selectedCourseId, setSelectedCourseId] = useState<string>(
    defaultCourseId || (courses.length > 0 ? courses[0].id : '')
  );

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [plansState, setPlansState] = useState<Record<string, GeneratedSchedulePlan>>(() => {
    const map: Record<string, GeneratedSchedulePlan> = {};
    courses.forEach((c) => {
      map[c.id] = c.initialPlan;
    });
    return map;
  });

  const [itemFilter, setItemFilter] = useState<'ALL' | 'LECTURE' | 'LIVE_CLASS' | 'EXAM' | 'PENDING'>('ALL');
  const [togglingItemId, setTogglingItemId] = useState<string | null>(null);

  const selectedCourse = courses.find((c) => c.id === selectedCourseId) || courses[0];
  const activePlan = selectedCourse ? plansState[selectedCourse.id] : null;

  if (courses.length === 0) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 text-center space-y-4">
        <div className="h-16 w-16 mx-auto rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
          <Target className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">
          {language === 'en' ? 'No Active Course Routines' : 'কোনো সক্রিয় কোর্স রুটিন নেই'}
        </h2>
        <p className="text-sm text-slate-500 max-w-md mx-auto">
          {language === 'en'
            ? 'Enroll in a course to get an auto-generated personalized daily routine with deadlines and live class schedules.'
            : 'কোর্সে ভর্তি হয়ে স্বয়ংক্রিয় ব্যক্তিগত দৈনিক রুটিন ও পরীক্ষার শিডিউল পান।'}
        </p>
        <Link href="/courses">
          <Button className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-6 py-2.5 rounded-xl">
            {language === 'en' ? 'Browse Courses' : 'কোর্সসমূহ দেখুন'}
          </Button>
        </Link>
      </div>
    );
  }

  const handleToggleItem = (itemId: string, currentStatus: boolean) => {
    if (!selectedCourse) return;
    setTogglingItemId(itemId);

    startTransition(async () => {
      const newStatus = !currentStatus;
      const res = await toggleRoutineItemAction(selectedCourse.id, itemId, newStatus);
      if (res.success) {
        setPlansState((prev) => {
          const curPlan = prev[selectedCourse.id];
          if (!curPlan) return prev;
          const updatedItems = curPlan.items.map((it) =>
            it.id === itemId ? { ...it, completed: newStatus } : it
          );
          const completedLectures = updatedItems.filter(
            (i) => i.itemType === 'LECTURE' && i.completed
          ).length;
          return {
            ...prev,
            [selectedCourse.id]: {
              ...curPlan,
              completedLectures,
              remainingLectures: curPlan.totalLectures - completedLectures,
              items: updatedItems,
            },
          };
        });
      }
      setTogglingItemId(null);
    });
  };

  const handleRescheduleSuccess = (newPlan: GeneratedSchedulePlan) => {
    if (!selectedCourse) return;
    setPlansState((prev) => ({
      ...prev,
      [selectedCourse.id]: newPlan,
    }));
  };

  // Filter items
  const allItems = activePlan?.items || [];
  const filteredItems = allItems.filter((item) => {
    if (itemFilter === 'ALL') return true;
    if (itemFilter === 'PENDING') return !item.completed;
    return item.itemType === itemFilter;
  });

  // Group items by week
  const weeksMap: Record<number, GeneratedRoutineItem[]> = {};
  filteredItems.forEach((item) => {
    const w = item.weekNumber || 1;
    if (!weeksMap[w]) weeksMap[w] = [];
    weeksMap[w].push(item);
  });
  const weekNumbers = Object.keys(weeksMap)
    .map(Number)
    .sort((a, b) => a - b);

  const completedCount = allItems.filter((i) => i.completed).length;
  const progressPercent = allItems.length > 0 ? Math.round((completedCount / allItems.length) * 100) : 0;

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-16">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 shadow-xl border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/15 px-3 py-1 text-xs font-semibold">
              <Target className="h-3.5 w-3.5 text-indigo-300" />
              <span>{language === 'en' ? 'Smart Adaptive Routine' : 'অ্যাডাপ্টিভ স্টাডি রুটিন ও গোলস'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {language === 'en' ? 'Course Routine & Daily Schedule' : 'কোর্স রুটিন ও দৈনিক সময়সূচি'}
            </h1>
            <p className="text-slate-300 text-sm max-w-xl leading-relaxed">
              {language === 'en'
                ? 'Your learning routine is auto-adjusted by the system. Accelerate to finish in 1 month, or rebalance after missing live classes.'
                : 'আপনার সুবিধাজনক সময়ে কোর্স শেষ করতে সিস্টেম স্বয়ংক্রিয়ভাবে রুটিন নির্ধারণ করে দেয়। ১ মাসে দ্রুত শেষ করতে পারেন বা মিস হওয়া ক্লাস পুনরায় অ্যাডজাস্ট করতে পারেন।'}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Button
              onClick={() => setIsModalOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm px-5 py-3 rounded-xl shadow-lg gap-2"
            >
              <Sliders className="h-4 w-4" />
              <span>{language === 'en' ? 'Reschedule / Adjust Routine' : 'রুটিন স্বয়ংক্রিয় রি-শিডিউল'}</span>
            </Button>
          </div>
        </div>

        {/* Course Switcher Pills */}
        {courses.length > 1 && (
          <div className="mt-6 pt-5 border-t border-white/10 flex flex-wrap gap-2">
            <span className="text-xs text-slate-400 self-center mr-1">
              {language === 'en' ? 'Switch Course:' : 'কোর্স পরিবর্তন:'}
            </span>
            {courses.map((c) => {
              const isSelected = c.id === selectedCourseId;
              return (
                <button
                  key={c.id}
                  onClick={() => setSelectedCourseId(c.id)}
                  className={`text-xs font-semibold px-3.5 py-1.5 rounded-xl transition ${
                    isSelected
                      ? 'bg-white text-indigo-950 font-bold shadow-sm'
                      : 'bg-white/10 text-slate-300 hover:bg-white/20'
                  }`}
                >
                  {language === 'en' && c.titleEn ? c.titleEn : c.title}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {activePlan && (
        <>
          {/* Routine Status Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Pacing Mode */}
            <Card className="p-5 border-slate-200 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  {language === 'en' ? 'Pacing Mode' : 'রুটিন মোড'}
                </span>
                {activePlan.paceMode === 'ACCELERATED' ? (
                  <Zap className="h-4 w-4 text-indigo-600" />
                ) : activePlan.paceMode === 'REBALANCED_CATCHUP' ? (
                  <RotateCcw className="h-4 w-4 text-amber-600" />
                ) : (
                  <Sliders className="h-4 w-4 text-emerald-600" />
                )}
              </div>
              <div className="text-lg font-black text-slate-900">
                {activePlan.paceMode === 'ACCELERATED'
                  ? language === 'en'
                    ? '1-Month Sprint ⚡'
                    : '১ মাসে শেষ ⚡'
                  : activePlan.paceMode === 'REBALANCED_CATCHUP'
                  ? language === 'en'
                    ? 'Catch-Up Rebalance 🔄'
                    : 'ক্যাচ-আপ অ্যাডজাস্ট 🔄'
                  : language === 'en'
                  ? 'Custom Schedule 🎯'
                  : 'কাস্টম শিডিউল 🎯'}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                {activePlan.daysSaved > 0
                  ? language === 'en'
                    ? `${activePlan.daysSaved} days shrunk from deadline`
                    : `ডেডলাইন ${activePlan.daysSaved} দিন সংকুচিত হয়েছে`
                  : language === 'en'
                  ? 'Standard pacing'
                  : 'স্বাভাবিক গতিতে চলমান'}
              </p>
            </Card>

            {/* Daily Pace */}
            <Card className="p-5 border-slate-200 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  {language === 'en' ? 'Daily Assignment' : 'প্রতিদিনের লক্ষ্য'}
                </span>
                <BookOpen className="h-4 w-4 text-indigo-600" />
              </div>
              <div className="text-lg font-black text-slate-900">
                {activePlan.averageLecturesPerDay}{' '}
                <span className="text-xs font-semibold text-slate-500">
                  {language === 'en' ? 'lectures/day' : 'টি লেকচার / দিন'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                {language === 'en'
                  ? `${activePlan.daysPerWeek} active study days / week`
                  : `সপ্তাহে ${activePlan.daysPerWeek} দিন পড়ার পরিকল্পনা`}
              </p>
            </Card>

            {/* Target Completion */}
            <Card className="p-5 border-slate-200 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  {language === 'en' ? 'Target Completion' : 'টার্গেট সমাপনী'}
                </span>
                <Calendar className="h-4 w-4 text-amber-600" />
              </div>
              <div className="text-base sm:text-lg font-black text-slate-900 truncate">
                {new Date(activePlan.targetCompletionDate).toLocaleDateString(
                  language === 'en' ? 'en-US' : 'bn-BD',
                  { year: 'numeric', month: 'short', day: 'numeric' }
                )}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                {activePlan.totalCalendarDays} {language === 'en' ? 'days total timeframe' : 'দিনের সময়সীমা'}
              </p>
            </Card>

            {/* Milestone Progress */}
            <Card className="p-5 border-slate-200 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  {language === 'en' ? 'Overall Progress' : 'মোট অগ্রগতি'}
                </span>
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              </div>
              <div className="text-lg font-black text-emerald-600">{progressPercent}%</div>
              <div className="w-full h-1.5 bg-slate-100 rounded-full mt-2 overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                  style={{ width: `${Math.max(progressPercent, 4)}%` }}
                />
              </div>
            </Card>
          </div>

          {/* Routine Timeline & Filter Bar */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-5 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-indigo-600" />
                  <span>{language === 'en' ? 'Assigned Routine Timeline' : 'অ্যাসাইন করা রুটিন টাইমলাইন'}</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {language === 'en'
                    ? `Click checkboxes to mark lectures completed as you study.`
                    : 'লেকচার বা পরীক্ষা সম্পন্ন হলে টিক চিহ্ন দিয়ে অগ্রগতি আপডেট করুন।'}
                </p>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-1.5">
                {(
                  [
                    { key: 'ALL', labelEn: 'All', labelBn: 'সকল' },
                    { key: 'PENDING', labelEn: 'Pending', labelBn: 'বাকি আছে' },
                    { key: 'LECTURE', labelEn: 'Lectures', labelBn: 'লেকচার' },
                    { key: 'LIVE_CLASS', labelEn: 'Live Classes', labelBn: 'লাইভ ক্লাস' },
                    { key: 'EXAM', labelEn: 'Exams', labelBn: 'পরীক্ষা' },
                  ] as const
                ).map((f) => (
                  <button
                    key={f.key}
                    onClick={() => setItemFilter(f.key)}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition ${
                      itemFilter === f.key
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {language === 'en' ? f.labelEn : f.labelBn}
                  </button>
                ))}
              </div>
            </div>

            {/* Weeks Accordion / List */}
            {weekNumbers.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-sm">
                {language === 'en' ? 'No routine items match filter.' : 'ফিল্টারে কোনো আইটেম পাওয়া যায়নি।'}
              </div>
            ) : (
              <div className="space-y-6">
                {weekNumbers.map((weekNum) => {
                  const weekItems = weeksMap[weekNum];
                  const weekCompleted = weekItems.filter((i) => i.completed).length;

                  return (
                    <div
                      key={weekNum}
                      className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/30"
                    >
                      <div className="bg-slate-100/70 px-4 py-2.5 flex items-center justify-between border-b border-slate-200">
                        <span className="font-bold text-xs sm:text-sm text-slate-800 flex items-center gap-2">
                          <span className="h-6 w-6 rounded-md bg-indigo-600 text-white flex items-center justify-center text-xs font-black">
                            W{weekNum}
                          </span>
                          <span>
                            {language === 'en' ? `Week ${weekNum} Schedule` : `সপ্তাহ ${weekNum} রুটিন`}
                          </span>
                        </span>
                        <span className="text-xs font-semibold text-slate-500">
                          {weekCompleted} / {weekItems.length}{' '}
                          {language === 'en' ? 'Completed' : 'সম্পন্ন'}
                        </span>
                      </div>

                      <div className="divide-y divide-slate-100 bg-white">
                        {weekItems.map((item) => {
                          const isToggling = togglingItemId === item.id;
                          return (
                            <div
                              key={item.id}
                              className={`p-3.5 sm:px-4 flex items-center justify-between gap-3 transition ${
                                item.completed ? 'bg-emerald-50/30' : 'hover:bg-slate-50'
                              }`}
                            >
                              <div className="flex items-center gap-3 min-w-0 flex-1">
                                <button
                                  type="button"
                                  disabled={isToggling}
                                  onClick={() => handleToggleItem(item.id, item.completed)}
                                  className={`h-5 w-5 rounded-md border flex items-center justify-center transition shrink-0 ${
                                    item.completed
                                      ? 'bg-emerald-600 border-emerald-600 text-white'
                                      : 'border-slate-300 hover:border-indigo-500 bg-white'
                                  }`}
                                >
                                  {isToggling ? (
                                    <Loader2 className="h-3 w-3 animate-spin text-slate-400" />
                                  ) : item.completed ? (
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                  ) : null}
                                </button>

                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2">
                                    <span
                                      className={`text-xs sm:text-sm font-semibold truncate ${
                                        item.completed
                                          ? 'line-through text-slate-400'
                                          : 'text-slate-900'
                                      }`}
                                    >
                                      {item.title}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-0.5">
                                    <span>
                                      {language === 'en' ? `Day ${item.dayNumber}` : `দিন ${item.dayNumber}`}
                                    </span>
                                    <span>•</span>
                                    <span>
                                      {new Date(item.scheduledDate).toLocaleDateString(
                                        language === 'en' ? 'en-US' : 'bn-BD',
                                        { month: 'short', day: 'numeric', weekday: 'short' }
                                      )}
                                    </span>
                                    <span>•</span>
                                    <span>{item.duration}</span>
                                  </div>
                                </div>
                              </div>

                              <div className="shrink-0 flex items-center gap-2">
                                {item.itemType === 'LECTURE' && (
                                  <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 text-[10px] font-bold">
                                    {language === 'en' ? 'Lecture' : 'লেকচার'}
                                  </Badge>
                                )}
                                {item.itemType === 'LIVE_CLASS' && (
                                  <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-[10px] font-bold flex items-center gap-1">
                                    <Video className="h-3 w-3" />
                                    <span>{language === 'en' ? 'Live Session' : 'লাইভ ক্লাস'}</span>
                                  </Badge>
                                )}
                                {item.itemType === 'EXAM' && (
                                  <Badge className="bg-rose-50 text-rose-700 border-rose-200 text-[10px] font-bold flex items-center gap-1">
                                    <FileQuestion className="h-3 w-3" />
                                    <span>{language === 'en' ? 'Exam / Quiz' : 'পরীক্ষা'}</span>
                                  </Badge>
                                )}

                                <Link href={`/courses/${selectedCourse.id}`}>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-[11px] h-7 px-2.5 rounded-lg border-slate-200 hover:bg-slate-100"
                                  >
                                    <span>{language === 'en' ? 'Open' : 'শুরু'}</span>
                                  </Button>
                                </Link>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {/* Reschedule Modal */}
      {selectedCourse && (
        <RescheduleModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          courseId={selectedCourse.id}
          currentTargetDate={selectedCourse.targetCompletionDate}
          courseTitle={language === 'en' && selectedCourse.titleEn ? selectedCourse.titleEn : selectedCourse.title}
          onSuccess={handleRescheduleSuccess}
        />
      )}
    </div>
  );
}

export default StudentGoalsClient;
