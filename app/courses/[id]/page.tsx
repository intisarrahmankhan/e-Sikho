'use client';

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { notFound, useRouter, useParams } from "next/navigation";
import {
  BookOpen,
  Clock,
  Star,
  Users,
  CheckCircle2,
  Award,
  ChevronLeft,
  PlayCircle,
  FileText,
  ShieldCheck,
  Lock,
  Sparkles,
  Loader2,
  CreditCard,
  HelpCircle,
  MessageSquare,
  Video,
  Download,
  ExternalLink,
  Calendar,
  Radio,
  Check,
  RotateCcw,
  GraduationCap,
  Trophy,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Course, getCourseById } from "@/lib/courses-data";
import { useLanguage, formatBilingualDuration, translateCategory, translateLevel } from "@/context/LanguageContext";
import { CourseRoutineBanner } from "@/components/courses/CourseRoutineBanner";
import DiscussionBoard from "@/components/courses/DiscussionBoard";
import NotesAndResources from "@/components/courses/NotesAndResources";
import SecureVideoPlayer from "@/components/video/SecureVideoPlayer";
import { CourseCohortLeaderboard } from "@/components/course/CourseCohortLeaderboard";
import {
  getCourseAccessDetails,
  toggleLessonProgressAction,
  getCourseResourcesAction,
  getCourseLiveSessionsAction,
  CourseAccessResult,
  CourseResourceItem,
  LiveSessionItem,
} from "@/actions/course-access";

function parseArrayField(val: unknown): string[] {
  if (Array.isArray(val)) return val.map(String).filter(Boolean);
  if (typeof val === 'string' && val.trim()) {
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean);
      if (typeof parsed === 'string' && parsed.trim()) return [parsed.trim()];
    } catch {
      return val.split(/\r?\n|,/).map((s) => s.trim()).filter(Boolean);
    }
  }
  return [];
}

const DEFAULT_CATEGORY_VIDEOS: Record<string, string> = {
  'fullstack-nextjs': 'https://www.youtube.com/watch?v=wm5gMKuwSYk',
  'python-machine-learning': 'https://www.youtube.com/watch?v=7eh4d6sabA0',
  'dsa-in-bangla': 'https://www.youtube.com/watch?v=8hly31xKli0',
  'system-design-architecture': 'https://www.youtube.com/watch?v=m8Icp_Cid5o',
};

export default function CourseDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params?.id as string;
  const { language } = useLanguage();
  const { data: session } = useSession();

  // Tab state: syllabus, live, resources, qa, notes, leaderboard
  const [courseTab, setCourseTab] = useState<'syllabus' | 'live' | 'resources' | 'qa' | 'notes' | 'leaderboard'>('syllabus');
  const [activeLessonId, setActiveLessonId] = useState<string>('');
  const [activeModuleId, setActiveModuleId] = useState<string>('');

  // Course access & progress state
  const [accessDetails, setAccessDetails] = useState<CourseAccessResult>({
    isLoggedIn: false,
    isEnrolled: false,
    canAccessAll: false,
    completedLessonIds: [],
    totalLessons: 0,
    progressPercentage: 0,
  });
  const [resources, setResources] = useState<CourseResourceItem[]>([]);
  const [liveSessions, setLiveSessions] = useState<LiveSessionItem[]>([]);
  const [isLockedModalOpen, setIsLockedModalOpen] = useState(false);
  const [lockedLessonTitle, setLockedLessonTitle] = useState('');
  const [togglingLessonId, setTogglingLessonId] = useState<string | null>(null);

  const getEmbedUrl = (url?: string) => {
    if (!url) return '';
    if (url.includes('watch?v=')) {
      const vid = url.split('watch?v=')[1]?.split('&')[0];
      return `https://www.youtube.com/embed/${vid}`;
    }
    return url;
  };

  // Track button loading state while navigating to the payment gateway
  const [enrolling, setEnrolling] = useState(false);
  const [course, setCourse] = useState<Course | null>(() => {
    const staticMatch = getCourseById(courseId);
    if (!staticMatch) return null;
    return {
      ...staticMatch,
      learningOutcomes: parseArrayField(staticMatch.learningOutcomes),
      prerequisites: parseArrayField(staticMatch.prerequisites),
      modules: Array.isArray(staticMatch.modules) ? staticMatch.modules : [],
    };
  });
  const [loading, setLoading] = useState(!course);
  const [activeVideo, setActiveVideo] = useState<{
    lessonId?: string;
    title: string;
    videoUrl: string;
  } | null>(null);

  // 1. Fetch Course Details from DB or API
  useEffect(() => {
    if (course && Array.isArray(course.learningOutcomes)) return;

    let isMounted = true;
    fetch(`/api/courses/${courseId}`)
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (!isMounted) return;
        if (data && !data.error) {
          setCourse({
            ...data,
            id: data.id || data._id || courseId,
            learningOutcomes: parseArrayField(data.learningOutcomes),
            prerequisites: parseArrayField(data.prerequisites),
            modules: Array.isArray(data.modules) ? data.modules : [],
          });
        }
      })
      .catch((err) => {
        console.error('Failed to load course details:', err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [course, courseId]);

  // 2. Fetch User Enrollment Access & Lesson Progress
  useEffect(() => {
    let isMounted = true;
    if (!courseId) return;

    async function loadAccess() {
      try {
        const [accessRes, resRes, liveRes] = await Promise.all([
          getCourseAccessDetails(courseId),
          getCourseResourcesAction(courseId),
          getCourseLiveSessionsAction(courseId),
        ]);

        if (isMounted) {
          setAccessDetails(accessRes);
          if (resRes.success) setResources(resRes.resources);
          if (liveRes.success) setLiveSessions(liveRes.liveSessions);
        }
      } catch (err) {
        console.error('Error loading course access info:', err);
      }
    }

    loadAccess();
    return () => {
      isMounted = false;
    };
  }, [courseId, session]);

  if (loading) {
    return (
      <div className="py-12 text-center text-slate-500">
        {language === 'en' ? 'Loading course...' : 'কোর্স লোড হচ্ছে...'}
      </div>
    );
  }

  if (!course) {
    notFound();
  }

  const learningOutcomes = parseArrayField(
    language === 'en' && course.learningOutcomesEn && course.learningOutcomesEn.length > 0
      ? course.learningOutcomesEn
      : course.learningOutcomes
  );
  const prerequisites = parseArrayField(
    language === 'en' && course.prerequisitesEn && course.prerequisitesEn.length > 0
      ? course.prerequisitesEn
      : course.prerequisites
  );
  const modules = Array.isArray(course.modules) ? course.modules : [];
  const instructor = {
    name: course.instructor?.name || 'e-Shikho Faculty',
    role: (language === 'en' && course.instructor?.roleEn)
      ? course.instructor.roleEn
      : (course.instructor?.role || (language === 'en' ? 'Instructor' : 'ইন্সট্রাক্টর')),
    avatar:
      course.instructor?.avatar ||
      'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
    bio: (language === 'en' && course.instructor?.bioEn)
      ? course.instructor.bioEn
      : (course.instructor?.bio ||
        (language === 'en'
          ? 'Experienced course instructor and industry mentor.'
          : 'অভিজ্ঞ কোর্স ইন্সট্রাক্টর ও ইন্ডাস্ট্রি মেন্টর।')),
  };

  const originalPrice = Number(course.originalPrice) || Number(course.price) || 0;
  const currentPrice = Number(course.price) || 0;
  const discountPercent =
    originalPrice > currentPrice && originalPrice > 0
      ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100)
      : 0;

  const totalLessons =
    course.totalLessons ||
    modules.reduce((acc, m) => acc + (Array.isArray(m.lessons) ? m.lessons.length : 0), 0);

  const displayTitle = language === 'en' && course.titleEn ? course.titleEn : course.title;
  const displayTagline = language === 'en' && course.taglineEn ? course.taglineEn : course.tagline;
  const displayDescription = language === 'en' && course.descriptionEn ? course.descriptionEn : course.description;
  const displayThumbnail = language === 'en' && course.thumbnailUrlEn ? course.thumbnailUrlEn : course.thumbnailUrl;

  const canAccessAll = accessDetails.canAccessAll;

  /** Navigate to the SSLCommerz-style payment gateway for this course. */
  function handleEnroll() {
    setEnrolling(true);
    router.push(`/payment/${courseId}`);
  }

  /** Plays lesson, opens PDF, navigates to quiz, or prompts lock modal if not enrolled */
  function handlePlayLesson(lesson: {
    id?: string;
    title: string;
    videoUrl?: string;
    isFree?: boolean;
    type?: string;
    pdfUrl?: string;
    quizId?: any;
  }) {
    const isUnlocked = lesson.isFree || canAccessAll;
    if (!isUnlocked) {
      setLockedLessonTitle(lesson.title);
      setIsLockedModalOpen(true);
      return;
    }

    if (lesson.type === 'QUIZ' || lesson.quizId) {
      const qId = typeof lesson.quizId === 'object' ? lesson.quizId?._id || lesson.quizId?.id : lesson.quizId;
      if (qId) {
        router.push(`/exams/${qId}`);
        return;
      }
    }

    if ((lesson.type === 'PDF' || lesson.pdfUrl) && !lesson.videoUrl) {
      if (lesson.pdfUrl) {
        window.open(lesson.pdfUrl, '_blank');
        return;
      }
    }

    const fallbackUrl = DEFAULT_CATEGORY_VIDEOS[course?.id || ''] || course?.previewVideoUrl || 'https://www.youtube.com/watch?v=wm5gMKuwSYk';
    setActiveVideo({
      lessonId: lesson.id,
      title: lesson.title,
      videoUrl: lesson.videoUrl || fallbackUrl,
    });
  }

  /** Toggle lesson completion status in MongoDB */
  async function handleToggleLesson(lessonId: string, e?: React.MouseEvent) {
    if (e) e.stopPropagation();
    if (!canAccessAll) return;

    setTogglingLessonId(lessonId);
    try {
      const res = await toggleLessonProgressAction(courseId, lessonId);
      if (res.success) {
        setAccessDetails((prev) => {
          const isNowCompleted = res.isCompleted;
          let updated = [...prev.completedLessonIds];
          if (isNowCompleted && !updated.includes(lessonId)) {
            updated.push(lessonId);
          } else if (!isNowCompleted) {
            updated = updated.filter((id) => id !== lessonId);
          }
          const percentage = totalLessons > 0 ? Math.round((updated.length / totalLessons) * 100) : 0;
          return {
            ...prev,
            completedLessonIds: updated,
            progressPercentage: percentage,
          };
        });
      }
    } catch (err) {
      console.error('Failed to toggle lesson status:', err);
    } finally {
      setTogglingLessonId(null);
    }
  }

  /** Finds the next uncompleted lesson and launches player */
  function handleContinueLearning() {
    const allLessons = modules.flatMap((m) => (Array.isArray(m?.lessons) ? m.lessons : []));
    const nextUnfinished = allLessons.find((l) => !accessDetails.completedLessonIds.includes(l.id || (l as any)._id));
    const target = nextUnfinished || allLessons[0];
    if (target) {
      handlePlayLesson(target);
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-16">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Link
          href="/courses"
          className="inline-flex items-center gap-1 hover:text-primary-600 transition"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>{language === 'en' ? 'All Courses' : 'সকল কোর্সসমূহ'}</span>
        </Link>
        <span>/</span>
        <span className="text-slate-900 font-medium truncate">{displayTitle}</span>
      </div>

      {/* Main Grid: Content (Left 2 cols) & Sidebar (Right 1 col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column: Details, Syllabus, Outcomes */}
        <div className="lg:col-span-2 space-y-8">
          {/* Header Banner */}
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-primary-600 text-white font-medium text-xs px-3 py-1">
                {language === 'en'
                  ? (course.categoryEn || translateCategory(course.category || course.categoryBangla, 'en'))
                  : (course.categoryBangla || course.category)}
              </Badge>
              <Badge variant="outline" className="text-slate-700 bg-white border-slate-200">
                {language === 'en'
                  ? `Level: ${course.levelEn || translateLevel(course.level, 'en')}`
                  : `লেভেল: ${course.level}`}
              </Badge>
              {canAccessAll && (
                <Badge className="bg-emerald-600 text-white font-semibold text-xs px-3 py-1 flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>{language === 'en' ? 'Enrolled' : 'ভর্তি সম্পন্ন'}</span>
                </Badge>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 leading-tight">
              {displayTitle}
            </h1>

            <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
              {displayTagline}
            </p>

            {/* Quick Metrics */}
            <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-sm text-slate-600 pt-2 border-t border-slate-200">
              <div className="flex items-center gap-1.5 font-semibold text-amber-600">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                <span>{course.rating || 5.0}</span>
                <span className="text-slate-400 font-normal">
                  {language === 'en' ? `(${course.totalRatings || 0} reviews)` : `(${course.totalRatings || 0} রিভিউ)`}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Users className="h-4 w-4 text-slate-400" />
                <span>
                  {language === 'en'
                    ? `${(course.studentsEnrolled || 0).toLocaleString()} students`
                    : `${(course.studentsEnrolled || 0).toLocaleString('bn-BD')} জন শিক্ষার্থী`}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-slate-400" />
                <span>{formatBilingualDuration(course.duration, course.durationEn, language)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <BookOpen className="h-4 w-4 text-slate-400" />
                <span>
                  {language === 'en' ? `${totalLessons} lessons` : `${totalLessons} টি লেসন`}
                </span>
              </div>
            </div>
          </div>

          {/* Student Personalized Routine Banner */}
          <CourseRoutineBanner
            courseId={course.id || courseId}
            courseTitle={displayTitle}
          />

          {/* Video Preview / Hero Image */}
          <div className="relative rounded-2xl overflow-hidden shadow-md aspect-video bg-slate-900 border border-slate-200 group">
            {course.previewVideoUrl ? (
              course.previewVideoUrl.includes('youtube.com') || course.previewVideoUrl.includes('youtu.be') ? (
                <iframe
                  src={getEmbedUrl(course.previewVideoUrl)}
                  title={displayTitle}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full border-0"
                />
              ) : (
                <video src={course.previewVideoUrl} controls className="w-full h-full object-cover" />
              )
            ) : (
              <>
                <img
                  src={displayThumbnail}
                  alt={displayTitle}
                  className="w-full h-full object-cover opacity-85 group-hover:scale-102 transition duration-300"
                />
                <div
                  onClick={() => {
                    const firstVideoLesson = modules
                      .flatMap((m) => (Array.isArray(m?.lessons) ? m.lessons : []))
                      .find((l) => l?.videoUrl);
                    if (firstVideoLesson?.videoUrl) {
                      setActiveVideo({ title: firstVideoLesson.title, videoUrl: firstVideoLesson.videoUrl });
                    } else {
                      const fallback = DEFAULT_CATEGORY_VIDEOS[course?.id || ''] || 'https://www.youtube.com/watch?v=wm5gMKuwSYk';
                      setActiveVideo({ title: displayTitle, videoUrl: fallback });
                    }
                  }}
                  className="absolute inset-0 bg-slate-900/40 flex items-center justify-center cursor-pointer"
                >
                  <div className="flex flex-col items-center gap-2 text-white">
                    <div className="h-14 w-14 rounded-full bg-primary-600/90 text-white flex items-center justify-center shadow-lg transform transition group-hover:scale-110">
                      <PlayCircle className="h-8 w-8 ml-0.5" />
                    </div>
                    <span className="text-xs font-semibold tracking-wide bg-slate-900/60 px-3 py-1 rounded-full backdrop-blur-sm">
                      {language === 'en' ? 'Watch Course Preview Video' : 'কোর্স প্রিভিউ ভিডিও দেখুন'}
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Course Overview / Description */}
          <div className="bg-white rounded-2xl p-6 md:p-8 border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary-600" />
              <span>{language === 'en' ? 'Course Details & Overview' : 'কোর্স সম্পর্কে বিস্তারিত'}</span>
            </h2>
            <p className="text-slate-600 leading-relaxed text-sm md:text-base">
              {displayDescription}
            </p>
          </div>

          {/* Learning Outcomes */}
          {learningOutcomes.length > 0 && (
            <div className="bg-white rounded-2xl p-6 md:p-8 border border-slate-200 shadow-sm space-y-4">
              <h2 className="text-xl font-bold text-slate-900">
                {language === 'en' ? 'What You Will Learn From This Course' : 'কোর্সটি থেকে আপনি যা যা শিখবেন'}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                {learningOutcomes.map((outcome, idx) => (
                  <div key={idx} className="flex items-start gap-3 text-sm text-slate-700">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{outcome}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Interactive Learning Experience Tabs */}
          <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
            <button
              onClick={() => setCourseTab('syllabus')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
                courseTab === 'syllabus'
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <BookOpen className="h-4 w-4" />
              <span>{language === 'en' ? 'Curriculum & Lessons' : 'কারিকুলাম ও সিলেবাস'}</span>
            </button>

            <button
              onClick={() => setCourseTab('live')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
                courseTab === 'live'
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Video className="h-4 w-4" />
              <span>{language === 'en' ? 'Live Classes' : 'লাইভ ক্লাস'}</span>
              {liveSessions.some((s) => s.status === 'LIVE_NOW') && (
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                </span>
              )}
            </button>

            <button
              onClick={() => setCourseTab('resources')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
                courseTab === 'resources'
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <FileText className="h-4 w-4" />
              <span>{language === 'en' ? 'Lecture Slides & PDFs' : 'লেকচার স্লাইডস ও পিডিএফ'}</span>
            </button>

            <button
              onClick={() => setCourseTab('qa')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
                courseTab === 'qa'
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <MessageSquare className="h-4 w-4" />
              <span>{language === 'en' ? 'Lecture Q&A / Community' : 'লেকচার প্রশ্নোত্তর ও ফোরাম'}</span>
            </button>

            <button
              onClick={() => setCourseTab('notes')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
                courseTab === 'notes'
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Sparkles className="h-4 w-4" />
              <span>{language === 'en' ? 'Study Notes & Tips' : 'স্টাডি নোটস'}</span>
            </button>

            <button
              onClick={() => setCourseTab('leaderboard')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
                courseTab === 'leaderboard'
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Trophy className="h-4 w-4 text-amber-500" />
              <span>{language === 'en' ? 'Cohort Leaderboard' : 'কোর্স লিডারবোর্ড'}</span>
            </button>
          </div>

          {/* TAB 1: Curriculum / Syllabus */}
          {courseTab === 'syllabus' && (
            <div className="bg-white rounded-2xl p-6 md:p-8 border border-slate-200 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    {language === 'en' ? 'Course Curriculum & Lessons' : 'কোর্স কারিকুলাম ও লেসনসমূহ'}
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    {language === 'en'
                      ? `Total ${modules.length} modules • ${totalLessons} lessons`
                      : `মোট ${modules.length} টি মডিউল • ${totalLessons} টি লেসন`}
                  </p>
                </div>

                {canAccessAll && (
                  <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 px-3.5 py-1.5 rounded-xl">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span className="text-xs font-semibold text-emerald-800">
                      {accessDetails.completedLessonIds.length} / {totalLessons} {language === 'en' ? 'completed' : 'সম্পন্ন'} ({accessDetails.progressPercentage}%)
                    </span>
                  </div>
                )}
              </div>

              {modules.length > 0 ? (
                <div className="space-y-4">
                  {modules.map((module, mIdx) => (
                    <div key={module.id || (module as any)._id || mIdx} className="border border-slate-200 rounded-xl overflow-hidden">
                      <div className="bg-slate-50 px-5 py-3.5 flex items-center justify-between border-b border-slate-200">
                        <span className="font-semibold text-slate-900 text-sm md:text-base">
                          {language === 'en' && module.titleEn ? module.titleEn : module.title}
                        </span>
                        <span className="text-xs text-slate-500 font-medium">
                          {formatBilingualDuration(module.duration, module.durationEn, language)}
                        </span>
                      </div>
                      <div className="divide-y divide-slate-100 bg-white">
                        {(module.lessons || []).map((lesson, lIdx) => {
                          const lessonKey = lesson.id || (lesson as any)._id || `l-${mIdx}-${lIdx}`;
                          const isCompleted = accessDetails.completedLessonIds.includes(lessonKey);
                          const isUnlocked = lesson.isFree || canAccessAll;
                          const isQuiz = (lesson as any).type === 'QUIZ' || !!(lesson as any).quizId;
                          const isPdf = (lesson as any).type === 'PDF' || (!!(lesson as any).pdfUrl && !lesson.videoUrl);
                          const lessonDisplayTitle = language === 'en' && lesson.titleEn ? lesson.titleEn : lesson.title;

                          return (
                            <div
                              key={lessonKey}
                              onClick={() =>
                                handlePlayLesson({
                                  id: lessonKey,
                                  title: lessonDisplayTitle,
                                  videoUrl: lesson.videoUrl,
                                  isFree: lesson.isFree,
                                  type: (lesson as any).type,
                                  pdfUrl: (lesson as any).pdfUrl,
                                  quizId: (lesson as any).quizId,
                                })
                              }
                              className={`px-5 py-3.5 flex items-center justify-between text-xs sm:text-sm transition ${
                                isUnlocked ? 'hover:bg-primary-50/50 cursor-pointer' : 'hover:bg-slate-50 cursor-pointer opacity-90'
                              }`}
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                {isUnlocked ? (
                                  isCompleted ? (
                                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                                  ) : isQuiz ? (
                                    <GraduationCap className="h-4 w-4 text-purple-600 shrink-0" />
                                  ) : isPdf ? (
                                    <FileText className="h-4 w-4 text-amber-600 shrink-0" />
                                  ) : (
                                    <PlayCircle className="h-4 w-4 text-primary-600 shrink-0" />
                                  )
                                ) : (
                                  <Lock className="h-4 w-4 text-slate-400 shrink-0" />
                                )}
                                <span className={isUnlocked ? (isCompleted ? "font-medium text-slate-700 line-through decoration-slate-400" : "font-medium text-slate-900 truncate") : "text-slate-600 truncate"}>
                                  {lessonDisplayTitle}
                                </span>
                              </div>

                              <div className="flex items-center gap-2.5 shrink-0">
                                {lesson.isFree ? (
                                  <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 text-[10px] font-semibold border-emerald-200">
                                    {language === 'en' ? 'Free Preview' : 'ফ্রি প্রিভিউ'}
                                  </Badge>
                                ) : !canAccessAll ? (
                                  <Badge variant="outline" className="text-slate-400 text-[10px] font-medium border-slate-200 flex items-center gap-1">
                                    <Lock className="h-3 w-3" />
                                    <span>{language === 'en' ? 'Locked' : 'লকড'}</span>
                                  </Badge>
                                ) : isQuiz ? (
                                  <Badge variant="secondary" className="bg-purple-50 text-purple-700 text-[10px] font-semibold border-purple-200">
                                    {language === 'en' ? 'Quiz / Assessment' : 'কুইজ / পরীক্ষা'}
                                  </Badge>
                                ) : isPdf ? (
                                  <Badge variant="secondary" className="bg-amber-50 text-amber-700 text-[10px] font-semibold border-amber-200">
                                    {language === 'en' ? 'PDF Slides' : 'পিডিএফ নোটস'}
                                  </Badge>
                                ) : (
                                  <Badge variant="secondary" className="bg-blue-50 text-blue-700 text-[10px] font-semibold border-blue-200">
                                    {language === 'en' ? 'Video Class' : 'ভিডিও ক্লাস'}
                                  </Badge>
                                )}

                                {canAccessAll && (
                                  <button
                                    onClick={(e) => handleToggleLesson(lessonKey, e)}
                                    disabled={togglingLessonId === lessonKey}
                                    title={isCompleted ? 'Mark as Incomplete' : 'Mark as Complete'}
                                    className={`p-1.5 rounded-lg border transition ${
                                      isCompleted
                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                        : 'bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100 hover:text-slate-700'
                                    }`}
                                  >
                                    <Check className="h-3.5 w-3.5" />
                                  </button>
                                )}

                                <span className="text-slate-400 text-xs hidden sm:inline">
                                  {formatBilingualDuration(lesson.duration, lesson.durationEn, language)}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-slate-500 border border-dashed border-slate-200 rounded-xl text-sm">
                  {language === 'en' ? 'Curriculum details will be updated soon.' : 'কারিকুলাম শীঘ্রই হালনাগাদ করা হবে।'}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Live Classes & Webinars */}
          {courseTab === 'live' && (
            <div className="bg-white rounded-2xl p-6 md:p-8 border border-slate-200 shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <Video className="h-5 w-5 text-blue-600" />
                    <span>{language === 'en' ? 'Interactive Live Classes & Webinars' : 'লাইভ ক্লাস ও প্রশ্নোত্তর সেশন'}</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    {language === 'en'
                      ? 'Weekly live problem solving, project mentoring, and Q&A sessions with the instructor.'
                      : 'ইন্সট্রাক্টরের সাথে সাপ্তাহিক লাইভ ডাউট সলভিং, প্রজেক্ট মেন্টরিং ও ইন্টারঅ্যাক্টিভ ক্লাস।'}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {liveSessions.map((sessionItem) => {
                  const isLive = sessionItem.status === 'LIVE_NOW';
                  const isCompleted = sessionItem.status === 'COMPLETED';

                  return (
                    <div
                      key={sessionItem.id}
                      className={`p-5 rounded-2xl border transition-all ${
                        isLive
                          ? 'border-rose-300 bg-rose-50/30 ring-1 ring-rose-300'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            {isLive ? (
                              <Badge className="bg-rose-600 text-white font-bold text-xs px-2.5 py-0.5 animate-pulse flex items-center gap-1">
                                <Radio className="h-3.5 w-3.5" />
                                <span>{language === 'en' ? 'LIVE NOW' : 'এখন লাইভ'}</span>
                              </Badge>
                            ) : isCompleted ? (
                              <Badge variant="outline" className="text-slate-600 border-slate-200 text-xs">
                                {language === 'en' ? 'Recorded Class' : 'রেকর্ডেড সেশন'}
                              </Badge>
                            ) : (
                              <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-xs font-semibold">
                                {language === 'en' ? 'Upcoming Class' : 'আসন্ন লাইভ ক্লাস'}
                              </Badge>
                            )}

                            <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5" />
                              <span>
                                {new Date(sessionItem.scheduledTime).toLocaleDateString(
                                  language === 'en' ? 'en-US' : 'bn-BD',
                                  { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }
                                )}
                              </span>
                            </span>
                            <span className="text-xs text-slate-400">• {sessionItem.duration}</span>
                          </div>

                          <h3 className="font-bold text-slate-900 text-base">
                            {language === 'en' && sessionItem.titleEn ? sessionItem.titleEn : sessionItem.title}
                          </h3>

                          <p className="text-xs text-slate-600">
                            {language === 'en' ? 'Mentor: ' : 'ইন্সট্রাক্টর: '}
                            <strong className="text-slate-800">{sessionItem.instructorName}</strong>
                          </p>
                        </div>

                        {/* Action buttons */}
                        <div className="shrink-0 flex items-center flex-wrap gap-2">
                          <Link href={`/live/${sessionItem.id}`}>
                            <Button
                              size="sm"
                              className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs gap-1.5 rounded-xl shadow-sm"
                            >
                              <Radio className="h-3.5 w-3.5 animate-pulse" />
                              <span>{language === 'en' ? 'Interactive Live Class & Q&A' : 'লাইভ ক্লাস ও প্রশ্নোত্তর রুম'}</span>
                            </Button>
                          </Link>

                          {isCompleted && sessionItem.recordingUrl ? (
                            <Button
                              onClick={() => {
                                if (canAccessAll) {
                                  setActiveVideo({
                                    title: sessionItem.title,
                                    videoUrl: sessionItem.recordingUrl!,
                                  });
                                } else {
                                  setLockedLessonTitle(sessionItem.title);
                                  setIsLockedModalOpen(true);
                                }
                              }}
                              variant="outline"
                              size="sm"
                              className="text-xs gap-1.5 border-slate-200 rounded-xl"
                            >
                              <PlayCircle className="h-4 w-4 text-primary-600" />
                              <span>{language === 'en' ? 'Watch Recording' : 'রেকর্ডিং দেখুন'}</span>
                            </Button>
                          ) : canAccessAll ? (
                            <a
                              href={sessionItem.meetUrl || 'https://meet.google.com/esh-ikho-live'}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-slate-200 text-slate-700 font-bold text-xs gap-1.5 rounded-xl shadow-sm"
                              >
                                <ExternalLink className="h-4 w-4" />
                                <span>{language === 'en' ? 'Google Meet' : 'গুগল মিট'}</span>
                              </Button>
                            </a>
                          ) : (
                            <Button
                              onClick={() => {
                                setLockedLessonTitle(sessionItem.title);
                                setIsLockedModalOpen(true);
                              }}
                              variant="outline"
                              size="sm"
                              className="text-xs gap-1.5 border-slate-200 text-slate-600 rounded-xl"
                            >
                              <Lock className="h-3.5 w-3.5 text-slate-400" />
                              <span>{language === 'en' ? 'Enroll to Join' : 'যোগ দিতে ভর্তি হন'}</span>
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: Lecture Slides & PDFs */}
          {courseTab === 'resources' && (
            <div className="bg-white rounded-2xl p-6 md:p-8 border border-slate-200 shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-amber-600" />
                    <span>{language === 'en' ? 'Official Lecture Slides & PDF Resources' : 'অফিসিয়াল লেকচার স্লাইডস ও পিডিএফ নোটস'}</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    {language === 'en'
                      ? 'Download high-quality slides, cheatsheets, and project starter boilerplates.'
                      : 'কোর্সের প্রতিটি মডিউলের হাই-কোয়ালিটি স্লাইড, চিটশিট ও সোর্স কোড ডাউনলোড করুন।'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {resources.map((resItem) => {
                  const isAvailable = resItem.isFreePreview || canAccessAll;

                  return (
                    <div
                      key={resItem.id}
                      className="p-5 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 transition-all flex flex-col justify-between space-y-4"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-md border border-amber-200 uppercase tracking-wider">
                            {resItem.fileType.toUpperCase()} • {resItem.fileSize}
                          </span>
                          {resItem.isFreePreview && (
                            <Badge className="bg-emerald-50 text-emerald-700 text-[10px] font-semibold border-emerald-200">
                              {language === 'en' ? 'Free Preview' : 'ফ্রি প্রিভিউ'}
                            </Badge>
                          )}
                        </div>
                        <h3 className="font-bold text-slate-900 text-sm leading-snug">
                          {language === 'en' && resItem.titleEn ? resItem.titleEn : resItem.title}
                        </h3>
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                        {isAvailable ? (
                          <a
                            href={resItem.downloadUrl}
                            download
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full"
                          >
                            <Button
                              size="sm"
                              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs gap-1.5 rounded-xl"
                            >
                              <Download className="h-4 w-4" />
                              <span>{language === 'en' ? 'Download PDF Document' : 'পিডিএফ ডাউনলোড করুন'}</span>
                            </Button>
                          </a>
                        ) : (
                          <Button
                            onClick={() => {
                              setLockedLessonTitle(resItem.title);
                              setIsLockedModalOpen(true);
                            }}
                            variant="outline"
                            size="sm"
                            className="w-full text-xs gap-1.5 border-slate-200 text-slate-600 rounded-xl"
                          >
                            <Lock className="h-3.5 w-3.5 text-slate-400" />
                            <span>{language === 'en' ? 'Enroll to Download' : 'ডাউনলোড করতে ভর্তি হন'}</span>
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 4: Discussion Board */}
          {courseTab === 'qa' && (
            <div className="space-y-4">
              <DiscussionBoard
                lessonId={activeLessonId || (modules[0]?.lessons?.[0]?.id || (modules[0]?.lessons?.[0] as any)?._id || 'general-course-qa')}
                currentUserId={(session?.user as any)?.id || 'guest-learner'}
              />
            </div>
          )}

          {/* TAB 5: Notes & Resources */}
          {courseTab === 'notes' && (
            <div className="space-y-4">
              <NotesAndResources
                moduleId={activeModuleId || (modules[0]?.id || (modules[0] as any)?._id || 'general-course-module')}
                currentUserId={(session?.user as any)?.id || 'guest-learner'}
              />
            </div>
          )}

          {/* TAB 6: Course Cohort Leaderboard */}
          {courseTab === 'leaderboard' && (
            <CourseCohortLeaderboard courseId={courseId} />
          )}

          {/* Prerequisites */}
          {prerequisites.length > 0 && (
            <div className="bg-white rounded-2xl p-6 md:p-8 border border-slate-200 shadow-sm space-y-3">
              <h2 className="text-xl font-bold text-slate-900">
                {language === 'en' ? 'Course Prerequisites' : 'কোর্সের পূর্বশর্ত'}
              </h2>
              <ul className="list-disc list-inside space-y-1.5 text-sm text-slate-600">
                {prerequisites.map((req, idx) => (
                  <li key={idx}>{req}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Instructor Bio */}
          <div className="bg-white rounded-2xl p-6 md:p-8 border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-xl font-bold text-slate-900">
              {language === 'en' ? 'Instructor Profile' : 'ইন্সট্রাক্টর পরিচিতি'}
            </h2>
            <div className="flex items-start gap-4">
              <img
                src={instructor.avatar}
                alt={instructor.name}
                className="h-16 w-16 rounded-full object-cover border-2 border-primary-100 shadow-sm"
              />
              <div className="space-y-1">
                <h3 className="font-bold text-slate-900 text-lg">{instructor.name}</h3>
                <p className="text-xs text-primary-600 font-semibold">{instructor.role}</p>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed pt-1">
                  {instructor.bio}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Sticky Pricing or Enrolled Student Panel */}
        <div className="lg:sticky lg:top-6 space-y-6">
          {canAccessAll ? (
            <Card className="border-slate-200 shadow-xl overflow-hidden bg-white">
              <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-6 text-white text-center">
                <div className="inline-flex items-center gap-1.5 bg-white/20 px-3 py-1 rounded-full text-xs font-bold text-white mb-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-200" />
                  <span>{language === 'en' ? 'Active Enrollment' : 'এনরোল্ড শিক্ষার্থী'}</span>
                </div>
                <h3 className="text-xl font-black">
                  {language === 'en' ? 'Welcome to your Course!' : 'আপনার কোর্সে স্বাগতম!'}
                </h3>
                <p className="text-xs text-emerald-100 mt-1">
                  {language === 'en'
                    ? 'All videos, PDFs, and live classes unlocked'
                    : 'সকল ভিডিও, পিডিএফ এবং লাইভ ক্লাস আনলকড'}
                </p>
              </div>

              <CardContent className="p-6 space-y-6">
                {/* Progress Widget */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-semibold text-slate-700">
                    <span>{language === 'en' ? 'Overall Progress' : 'কোর্স সম্পন্ন'}</span>
                    <span className="text-emerald-600 font-bold">{accessDetails.progressPercentage}%</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(accessDetails.progressPercentage, 5)}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-slate-400">
                    {accessDetails.completedLessonIds.length} / {totalLessons} {language === 'en' ? 'lessons completed' : 'টি লেসন সম্পন্ন'}
                  </p>
                </div>

                {/* Primary Action: Continue Learning */}
                <Button
                  size="lg"
                  onClick={handleContinueLearning}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md py-6 gap-2 rounded-2xl"
                >
                  <PlayCircle className="h-5 w-5" />
                  <span>{language === 'en' ? 'Continue Learning' : 'পড়া চালিয়ে যান'}</span>
                </Button>

                {/* Quick Shortcuts */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <Button
                    variant="outline"
                    onClick={() => setCourseTab('live')}
                    className="text-xs py-2 h-auto flex flex-col gap-1 items-center border-slate-200 hover:bg-slate-50 rounded-xl"
                  >
                    <Video className="h-4 w-4 text-blue-600" />
                    <span>{language === 'en' ? 'Live Classes' : 'লাইভ ক্লাস'}</span>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setCourseTab('resources')}
                    className="text-xs py-2 h-auto flex flex-col gap-1 items-center border-slate-200 hover:bg-slate-50 rounded-xl"
                  >
                    <FileText className="h-4 w-4 text-amber-600" />
                    <span>{language === 'en' ? 'PDF Slides' : 'পিডিএফ নোটস'}</span>
                  </Button>
                </div>

                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    {language === 'en' ? 'Your Enrolled Privileges:' : 'আপনার বিশেষ সুবিধাসমূহ:'}
                  </h4>
                  <div className="space-y-2 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      <span>{language === 'en' ? 'Full streaming access to all lessons' : 'সকল লেসনের পূর্ণ ভিডিও অ্যাক্সেস'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      <span>{language === 'en' ? 'Direct download for PDF slides & code' : 'পিডিএফ ও সোর্স কোড ডাউনলোড'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      <span>{language === 'en' ? 'Weekly live Google Meet Q&A' : 'সাপ্তাহিক লাইভ গুগল মিট সেশন'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      <span>{language === 'en' ? 'Chapter quizzes & certificate on pass' : 'কুইজ ও সমাপনী সার্টিফিকেট'}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-slate-200 shadow-xl overflow-hidden bg-white">
              <div className="bg-gradient-to-r from-primary-600 to-primary-800 p-6 text-white text-center">
                <span className="text-xs font-medium uppercase tracking-wider text-primary-100">
                  {language === 'en' ? 'Course Fee & Enrollment' : 'কোর্স ফি ও ভর্তি'}
                </span>
                <div className="flex items-baseline justify-center gap-2 mt-2">
                  <span className="text-3xl sm:text-4xl font-black">
                    {language === 'en' ? `BDT ${currentPrice.toLocaleString()}` : `৳${currentPrice.toLocaleString("bn-BD")}`}
                  </span>
                  {originalPrice > currentPrice && (
                    <span className="text-sm line-through text-primary-200">
                      {language === 'en' ? `BDT ${originalPrice.toLocaleString()}` : `৳${originalPrice.toLocaleString("bn-BD")}`}
                    </span>
                  )}
                </div>
                {discountPercent > 0 && (
                  <div className="inline-block mt-2 bg-yellow-400 text-slate-900 text-xs font-bold px-2.5 py-0.5 rounded-full">
                    {language === 'en' ? `Limited time ${discountPercent}% OFF!` : `সীমিত সময়ের জন্য ${discountPercent}% ছাড়!`}
                  </div>
                )}
              </div>

              <CardContent className="p-6 space-y-6">
                <Button
                  id="btn-enroll-now"
                  size="lg"
                  onClick={handleEnroll}
                  disabled={enrolling}
                  className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold text-base shadow-md py-6 gap-2"
                >
                  {enrolling ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>{language === 'en' ? 'Redirecting to payment…' : 'পেমেন্ট পেইজে যাওয়া হচ্ছে…'}</span>
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-5 w-5" />
                      <span>
                        {language === 'en'
                          ? `Enroll Now — BDT ${currentPrice.toLocaleString()}`
                          : `এখনই ভর্তি হন — ৳${currentPrice.toLocaleString('bn-BD')}`}
                      </span>
                    </>
                  )}
                </Button>

                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    {language === 'en' ? 'This course includes:' : 'এই কোর্সে যা যা পাচ্ছেন:'}
                  </h4>
                  <div className="space-y-2.5 text-xs sm:text-sm text-slate-600">
                    <div className="flex items-center gap-2.5">
                      <Clock className="h-4 w-4 text-primary-600" />
                      <span>
                        {language === 'en'
                          ? `${formatBilingualDuration(course.duration, course.durationEn, 'en')} on-demand video`
                          : `${course.duration || '১০ ঘণ্টা'} অন-ডিমান্ড রেকর্ডেড ভিডিও`}
                      </span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <FileText className="h-4 w-4 text-primary-600" />
                      <span>
                        {language === 'en'
                          ? 'Downloadable lecture slides, PDFs & source code'
                          : 'লেকচার স্লাইডস, পিডিএফ ও সোর্স কোড ডাউনলোড'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Video className="h-4 w-4 text-primary-600" />
                      <span>
                        {language === 'en'
                          ? 'Interactive live classes & doubt solving'
                          : 'সরাসরি লাইভ ক্লাস ও ডাউট সলভিং সেশন'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Award className="h-4 w-4 text-primary-600" />
                      <span>
                        {language === 'en' ? 'Verified Certificate of Completion' : 'ভেরিফায়েড কোর্স সমাপ্তি সার্টিফিকেট'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-primary-600" />
                      <span>
                        {language === 'en' ? 'Full Lifetime Access' : 'আজীবন (Lifetime) অ্যাক্সেস'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <HelpCircle className="h-4 w-4 text-primary-600" />
                      <span>
                        {language === 'en'
                          ? 'Chapter quizzes and online assessments'
                          : 'LaTeX সূত্রসহ কুইজ ও অনলাইন মূল্যায়ন'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl bg-slate-50 p-4 border border-slate-200 text-center space-y-1">
                  <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-800">
                    <ShieldCheck className="h-4 w-4 text-emerald-600" />
                    <span>
                      {language === 'en' ? '7-Day Money-Back Guarantee' : '৭ দিনের মানিব্যাক গ্যারান্টি'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    {language === 'en'
                      ? 'Get a full refund if not satisfied with no questions asked.'
                      : 'কোর্স পছন্দ না হলে কোনো প্রশ্ন ছাড়াই সম্পূর্ণ রিফান্ড পাবেন।'}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Cloudflare R2 / YouTube / MP4 Video Player Modal */}
      {activeVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-4xl overflow-hidden rounded-2xl bg-slate-900 shadow-2xl border border-slate-700">
            <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
              <div className="flex items-center gap-2 text-white truncate max-w-[70%]">
                <PlayCircle className="h-5 w-5 text-primary-500 shrink-0" />
                <h3 className="font-bold text-sm sm:text-base truncate">{activeVideo.title}</h3>
              </div>
              <div className="flex items-center gap-3">
                {canAccessAll && activeVideo.lessonId && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleToggleLesson(activeVideo.lessonId!)}
                    disabled={togglingLessonId === activeVideo.lessonId}
                    className={`text-xs h-8 px-3 rounded-xl border-slate-700 ${
                      accessDetails.completedLessonIds.includes(activeVideo.lessonId)
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                        : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                    }`}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                    <span>
                      {accessDetails.completedLessonIds.includes(activeVideo.lessonId)
                        ? language === 'en' ? 'Completed' : 'সম্পন্ন হয়েছে'
                        : language === 'en' ? 'Mark Complete' : 'সম্পন্ন চিহ্নিত করুন'}
                    </span>
                  </Button>
                )}
                <button
                  onClick={() => setActiveVideo(null)}
                  className="rounded-lg bg-slate-800 p-1.5 text-slate-400 hover:bg-slate-700 hover:text-white transition"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="aspect-video bg-black flex items-center justify-center">
              {activeVideo.lessonId ? (
                <SecureVideoPlayer
                  courseId={courseId}
                  lessonId={activeVideo.lessonId}
                  initialTitle={activeVideo.title}
                  onLocked={() => {
                    setActiveVideo(null);
                    setLockedLessonTitle(activeVideo.title);
                    setIsLockedModalOpen(true);
                  }}
                />
              ) : activeVideo.videoUrl ? (
                activeVideo.videoUrl.includes('youtube.com') || activeVideo.videoUrl.includes('youtu.be') ? (
                  <iframe
                    src={getEmbedUrl(activeVideo.videoUrl)}
                    title={activeVideo.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full border-0"
                  />
                ) : (
                  <video
                    src={activeVideo.videoUrl}
                    controls
                    controlsList="nodownload"
                    onContextMenu={(e) => e.preventDefault()}
                    autoPlay
                    className="w-full h-full object-contain"
                  />
                )
              ) : (
                <p className="text-sm text-slate-400">
                  {language === 'en' ? 'No video URL available for this lesson.' : 'এই লেসনের কোনো ভিডিও ইউআরএল পাওয়া যায়নি।'}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Locked Lesson Upsell Modal */}
      {isLockedModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl border border-slate-200 p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="h-12 w-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto shadow-sm">
              <Lock className="h-6 w-6" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="font-bold text-lg text-slate-900">
                {language === 'en' ? 'Course Content Locked' : 'কন্টেন্টটি লক করা রয়েছে'}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {lockedLessonTitle ? `"${lockedLessonTitle}" ` : ''}
                {language === 'en'
                  ? 'is exclusively available to enrolled students. Enroll now to get lifetime access to all recorded videos, downloadable lecture PDFs, and interactive live classes!'
                  : 'শুধুমাত্র এনরোল করা শিক্ষার্থীদের জন্য উন্মুক্ত। সম্পূর্ণ ভিডিও, পিডিএফ লেকচার শিট এবং লাইভ ক্লাসে অংশ নিতে কোর্সে ভর্তি হন!'}
              </p>
            </div>
            <div className="space-y-2">
              <Button
                onClick={() => {
                  setIsLockedModalOpen(false);
                  handleEnroll();
                }}
                className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold text-sm py-5 rounded-2xl shadow-md gap-2"
              >
                <CreditCard className="h-4 w-4" />
                <span>
                  {language === 'en'
                    ? `Enroll Now — BDT ${currentPrice.toLocaleString()}`
                    : `এখনই ভর্তি হন — ৳${currentPrice.toLocaleString('bn-BD')}`}
                </span>
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsLockedModalOpen(false)}
                className="w-full text-xs border-slate-200 text-slate-600 rounded-2xl py-3"
              >
                {language === 'en' ? 'Close' : 'বন্ধ করুন'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
