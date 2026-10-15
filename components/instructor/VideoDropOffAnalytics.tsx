'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  TrendingDown,
  Clock,
  Users,
  AlertTriangle,
  Lightbulb,
  Video,
  ChevronDown,
  ChevronUp,
  BarChart3,
  RefreshCw,
  Sparkles,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  getVideoLessonDropOffAnalyticsAction,
  VideoDropOffLessonStat,
} from '@/actions/instructor';

interface CourseOption {
  id: string;
  title: string;
}

interface VideoDropOffAnalyticsProps {
  courses: CourseOption[];
  initialCourseId?: string;
}

export function VideoDropOffAnalytics({
  courses,
  initialCourseId,
}: VideoDropOffAnalyticsProps) {
  const [selectedCourseId, setSelectedCourseId] = useState<string>(
    initialCourseId || (courses.length > 0 ? courses[0].id : '')
  );
  const [isLoading, setIsLoading] = useState(false);
  const [analyticsData, setAnalyticsData] = useState<{
    lessons: VideoDropOffLessonStat[];
    overallAvgDropOff: number;
    totalWatchedHours: number;
  }>({
    lessons: [],
    overallAvgDropOff: 0,
    totalWatchedHours: 0,
  });
  const [expandedLessonId, setExpandedLessonId] = useState<string | null>(null);

  const fetchAnalytics = async (courseId?: string) => {
    setIsLoading(true);
    try {
      const res = await getVideoLessonDropOffAnalyticsAction(courseId);
      if (res.success && res.lessons) {
        setAnalyticsData({
          lessons: res.lessons,
          overallAvgDropOff: res.overallAvgDropOff,
          totalWatchedHours: res.totalWatchedHours,
        });
        if (res.lessons.length > 0 && !expandedLessonId) {
          setExpandedLessonId(res.lessons[0].lessonId);
        }
      }
    } catch (err) {
      console.error('Failed to load video drop-off stats:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics(selectedCourseId || undefined);
  }, [selectedCourseId]);

  const toggleExpand = (lessonId: string) => {
    setExpandedLessonId((prev) => (prev === lessonId ? null : lessonId));
  };

  return (
    <Card className="border-slate-200/90 shadow-sm overflow-hidden bg-white">
      <CardHeader className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-400/30">
                <TrendingDown className="h-4 w-4" />
              </div>
              <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                <span>Video Lesson Drop-off Rates & Retention Analytics</span>
                <Badge className="bg-indigo-600/80 text-white text-[10px] border-none font-semibold">
                  Live Beacons
                </Badge>
              </CardTitle>
            </div>
            <p className="text-xs text-indigo-200/80">
              Pinpoint exact video timestamps where students stop watching to refine unengaging lecture segments.
            </p>
          </div>

          {/* Course Selector & Refresh */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            {courses.length > 0 && (
              <select
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(e.target.value)}
                className="bg-indigo-900/60 border border-indigo-700/50 text-white text-xs rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-400 max-w-[220px] truncate"
              >
                <option value="">All Courses (Aggregated)</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id} className="text-slate-900 bg-white">
                    {c.title}
                  </option>
                ))}
              </select>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchAnalytics(selectedCourseId || undefined)}
              disabled={isLoading}
              className="border-indigo-700/50 bg-indigo-900/40 text-indigo-200 hover:text-white hover:bg-indigo-800/50 text-xs h-8 px-2.5 rounded-xl"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {/* Aggregate KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-4 mt-2 border-t border-indigo-900/50">
          <div className="bg-white/5 border border-white/10 rounded-xl p-3">
            <span className="text-[11px] font-medium text-indigo-200">Avg. Drop-off Rate</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl font-black text-rose-400">
                {analyticsData.overallAvgDropOff}%
              </span>
              <span className="text-[10px] text-slate-400">across lessons</span>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl p-3">
            <span className="text-[11px] font-medium text-indigo-200">Total Hours Watched</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl font-black text-emerald-400">
                {analyticsData.totalWatchedHours} hrs
              </span>
              <span className="text-[10px] text-slate-400">enrolled watch-time</span>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl p-3 col-span-2 sm:col-span-1">
            <span className="text-[11px] font-medium text-indigo-200">Monitored Video Lessons</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl font-black text-amber-400">
                {analyticsData.lessons.length}
              </span>
              <span className="text-[10px] text-slate-400">lectures tracked</span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-4">
        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-3 text-slate-400">
            <RefreshCw className="h-6 w-6 animate-spin text-indigo-600" />
            <p className="text-xs">Analyzing video telemetry and student stop timestamps...</p>
          </div>
        ) : analyticsData.lessons.length === 0 ? (
          <div className="py-10 text-center space-y-2 border border-dashed border-slate-200 rounded-2xl">
            <Video className="h-8 w-8 text-slate-300 mx-auto" />
            <p className="text-sm font-semibold text-slate-700">No video lessons tracked yet</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Drop-off timestamps are recorded automatically when students pause or close course video lectures.
            </p>
          </div>
        ) : (
          <div className="space-y-3.5">
            {analyticsData.lessons.map((lesson) => {
              const isExpanded = expandedLessonId === lesson.lessonId;
              const hasCriticalSpike = !!lesson.criticalDropOffSegment;

              return (
                <div
                  key={lesson.lessonId}
                  className={`border rounded-2xl transition-all ${
                    isExpanded
                      ? 'border-indigo-200 bg-indigo-50/20 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  {/* Lesson Summary Row */}
                  <div
                    onClick={() => toggleExpand(lesson.lessonId)}
                    className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer select-none"
                  >
                    <div className="space-y-1.5 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge
                          variant="outline"
                          className="text-[10px] bg-slate-50 text-slate-600 border-slate-200 font-medium"
                        >
                          {lesson.moduleTitle}
                        </Badge>
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{lesson.duration || `${Math.round(lesson.durationSeconds / 60)} min`}</span>
                        </span>
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          <span>{lesson.totalViewers} viewers</span>
                        </span>
                      </div>

                      <h3 className="font-bold text-slate-900 text-sm sm:text-base leading-snug truncate">
                        {lesson.lessonTitle}
                      </h3>
                    </div>

                    {/* Rates & Progress */}
                    <div className="flex items-center gap-5 shrink-0">
                      <div className="text-right">
                        <div className="flex items-center gap-1.5 justify-end">
                          <span className="text-xs font-semibold text-slate-500">Drop-off:</span>
                          <span
                            className={`text-sm font-black ${
                              lesson.avgDropOffRate > 35
                                ? 'text-rose-600'
                                : lesson.avgDropOffRate > 20
                                ? 'text-amber-600'
                                : 'text-emerald-600'
                            }`}
                          >
                            {lesson.avgDropOffRate}%
                          </span>
                        </div>
                        <div className="w-24 sm:w-28 h-2 bg-slate-100 rounded-full mt-1.5 overflow-hidden flex">
                          <div
                            className="bg-emerald-500 h-full rounded-l-full"
                            style={{ width: `${lesson.completionRate}%` }}
                            title={`Completed: ${lesson.completionRate}%`}
                          />
                          <div
                            className="bg-rose-500 h-full rounded-r-full"
                            style={{ width: `${lesson.avgDropOffRate}%` }}
                            title={`Drop-off: ${lesson.avgDropOffRate}%`}
                          />
                        </div>
                      </div>

                      <button
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                        title={isExpanded ? 'Collapse' : 'View Timestamps'}
                      >
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Timestamp Breakdown & Improvement Insights */}
                  {isExpanded && (
                    <div className="px-4 pb-5 sm:px-5 pt-0 border-t border-slate-100/80 mt-1 space-y-4">
                      {/* Critical Spike Alert Box */}
                      {hasCriticalSpike && (
                        <div className="mt-3 p-3.5 bg-amber-50/80 border border-amber-200/80 rounded-xl flex items-start gap-3">
                          <div className="h-7 w-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 mt-0.5">
                            <AlertTriangle className="h-4 w-4" />
                          </div>
                          <div className="space-y-1 flex-1 text-xs">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-amber-900">
                                Unengaging Lecture Segment Detected at {lesson.criticalDropOffSegment?.formatted}
                              </span>
                              <Badge className="bg-amber-200 text-amber-900 text-[10px] font-semibold border-none">
                                {lesson.criticalDropOffSegment?.studentsStopped} Students Stopped
                              </Badge>
                            </div>
                            <p className="text-amber-800/90 leading-relaxed">
                              {lesson.criticalDropOffSegment?.insight}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Timestamps Histogram Table */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                          <span className="flex items-center gap-1.5">
                            <BarChart3 className="h-3.5 w-3.5 text-indigo-600" />
                            <span>Exact Stop Timestamps Distribution</span>
                          </span>
                          <span className="text-[11px] text-slate-400 font-normal">
                            Where students discontinued the video
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                          {lesson.stopTimestamps.map((t: any, idx: number) => (
                            <div
                              key={idx}
                              className="p-3 bg-white border border-slate-200/90 rounded-xl flex items-center justify-between shadow-2xs hover:border-indigo-300 transition"
                            >
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-1.5">
                                  <Clock className="h-3.5 w-3.5 text-slate-400" />
                                  <span className="font-mono font-bold text-xs text-slate-900">
                                    {t.formatted}
                                  </span>
                                </div>
                                <span className="text-[10px] text-slate-500">
                                  {t.percentageOfDropOffs}% of all drops
                                </span>
                              </div>

                              <Badge
                                variant="secondary"
                                className="bg-rose-50 text-rose-700 border-rose-200 text-xs font-bold font-mono"
                              >
                                {t.studentsStopped} stopped
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Actionable Recommendations */}
                      <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2 text-slate-700">
                          <Lightbulb className="h-4 w-4 text-amber-500 shrink-0" />
                          <span>
                            Tip: Inserting a 1-minute recap or summary slides around high drop-off timestamps increases course completion by up to <strong>34%</strong>.
                          </span>
                        </div>

                        {selectedCourseId && (
                          <Link
                            href={`/instructor/courses/${selectedCourseId}/lectures`}
                            className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-semibold text-xs shrink-0"
                          >
                            <span>Edit Lecture</span>
                            <ArrowRight className="h-3.5 w-3.5" />
                          </Link>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
