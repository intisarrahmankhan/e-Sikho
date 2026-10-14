'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Video,
  PlusCircle,
  PlayCircle,
  Trash2,
  Edit3,
  CheckCircle2,
  Clock,
  Layers,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Loader2,
  FileText,
  Upload,
  Link as LinkIcon,
  Eye,
  X,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import VideoEmbedPlayer from '@/components/instructor/VideoEmbedPlayer';
import {
  addCourseLecture,
  addCourseModule,
  updateCourseLecture,
  deleteCourseLecture,
} from '@/actions/instructor';

interface Lesson {
  _id: string;
  id?: string;
  title: string;
  content?: string;
  duration: string;
  isFree?: boolean;
  order: number;
  videoUrl?: string;
}

interface Module {
  _id: string;
  id?: string;
  title: string;
  duration: string;
  order: number;
  lessons: Lesson[];
}

interface Course {
  _id: string;
  id?: string;
  title: string;
  categoryBangla?: string;
  level?: string;
  price?: number;
  thumbnailUrl?: string;
  previewVideoUrl?: string;
  totalLessons?: number;
  modules: Module[];
}

interface LectureManagerProps {
  course: Course;
}

export default function LectureManager({ course: initialCourse }: LectureManagerProps) {
  const [course, setCourse] = useState<Course>(initialCourse);
  const [modules, setModules] = useState<Module[]>(initialCourse.modules || []);
  const [openModules, setOpenModules] = useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {};
    (initialCourse.modules || []).forEach((m) => {
      map[m._id || m.id || ''] = true;
    });
    return map;
  });

  // Modal states
  const [isAddLectureOpen, setIsAddLectureOpen] = useState(false);
  const [isAddModuleOpen, setIsAddModuleOpen] = useState(false);
  const [activeLectureForEdit, setActiveLectureForEdit] = useState<Lesson | null>(null);
  const [activePreviewVideo, setActivePreviewVideo] = useState<{ title: string; url: string } | null>(null);

  // Form states for adding lecture
  const [targetModuleId, setTargetModuleId] = useState<string>(
    modules.length > 0 ? modules[0]._id || modules[0].id || '' : ''
  );
  const [lectureTitle, setLectureTitle] = useState('');
  const [lectureContent, setLectureContent] = useState('');
  const [lectureDuration, setLectureDuration] = useState('15:00');
  const [lectureIsFree, setLectureIsFree] = useState(false);
  const [videoMode, setVideoMode] = useState<'url' | 'file'>('url');
  const [videoUrl, setVideoUrl] = useState('');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreviewSrc, setVideoPreviewSrc] = useState('');

  // Form states for adding module
  const [newModuleTitle, setNewModuleTitle] = useState('');
  const [newModuleDuration, setNewModuleDuration] = useState('১ ঘণ্টা');

  // Loading states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; error?: boolean } | null>(null);

  const courseId = course._id || course.id || '';

  const toggleModule = (modId: string) => {
    setOpenModules((prev) => ({ ...prev, [modId]: !prev[modId] }));
  };

  const handleVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVideoFile(file);
      const blobUrl = URL.createObjectURL(file);
      setVideoPreviewSrc(blobUrl);
    }
  };

  const openAddLectureModal = (moduleId?: string) => {
    if (moduleId) setTargetModuleId(moduleId);
    else if (modules.length > 0) setTargetModuleId(modules[0]._id || modules[0].id || '');
    setLectureTitle('');
    setLectureContent('');
    setLectureDuration('15:00');
    setLectureIsFree(false);
    setVideoUrl('');
    setVideoFile(null);
    setVideoPreviewSrc('');
    setStatusMessage(null);
    setIsAddLectureOpen(true);
  };

  const handleAddModule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newModuleTitle.trim()) return;
    setIsSubmitting(true);
    setStatusMessage(null);

    const res = await addCourseModule(courseId, newModuleTitle, newModuleDuration);
    if (res.error) {
      setStatusMessage({ text: res.error, error: true });
    } else if (res.module) {
      const addedMod: Module = { ...res.module, lessons: [] };
      setModules((prev) => [...prev, addedMod]);
      setOpenModules((prev) => ({ ...prev, [addedMod._id]: true }));
      setNewModuleTitle('');
      setIsAddModuleOpen(false);
      setStatusMessage({ text: 'মডিউল সফলভাবে তৈরি হয়েছে!' });
    }
    setIsSubmitting(false);
  };

  const handleAddLecture = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lectureTitle.trim()) return;
    setIsSubmitting(true);
    setStatusMessage(null);

    const formData = new FormData();
    formData.append('courseId', courseId);
    formData.append('moduleId', targetModuleId);
    formData.append('title', lectureTitle.trim());
    formData.append('content', lectureContent.trim());
    formData.append('duration', lectureDuration.trim());
    formData.append('isFree', String(lectureIsFree));

    if (videoMode === 'url' && videoUrl.trim()) {
      formData.append('videoUrl', videoUrl.trim());
    } else if (videoMode === 'file' && videoFile) {
      formData.append('videoFile', videoFile);
    }

    const res = await addCourseLecture(formData);
    if (res.error) {
      setStatusMessage({ text: res.error, error: true });
    } else if (res.lesson) {
      const newLesson = res.lesson;
      setModules((prev) =>
        prev.map((m) => {
          const mId = m._id || m.id;
          if (mId === targetModuleId) {
            return {
              ...m,
              lessons: [...m.lessons, newLesson],
            };
          }
          return m;
        })
      );
      setIsAddLectureOpen(false);
      setStatusMessage({ text: 'ভিডিও ও লেকচার সফলভাবে যুক্ত হয়েছে!' });
    }
    setIsSubmitting(false);
  };

  const handleUpdateLecture = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeLectureForEdit) return;
    setIsSubmitting(true);
    setStatusMessage(null);

    const formData = new FormData();
    formData.append('lessonId', activeLectureForEdit._id || activeLectureForEdit.id || '');
    formData.append('courseId', courseId);
    formData.append('title', activeLectureForEdit.title);
    formData.append('content', activeLectureForEdit.content || '');
    formData.append('duration', activeLectureForEdit.duration || '15:00');
    formData.append('isFree', String(activeLectureForEdit.isFree || false));
    if (activeLectureForEdit.videoUrl) {
      formData.append('videoUrl', activeLectureForEdit.videoUrl);
    }
    if (videoFile) {
      formData.append('videoFile', videoFile);
    }

    const res = await updateCourseLecture(formData);
    if (res.error) {
      setStatusMessage({ text: res.error, error: true });
    } else if (res.lesson) {
      const updated = res.lesson;
      setModules((prev) =>
        prev.map((m) => ({
          ...m,
          lessons: m.lessons.map((l) =>
            (l._id || l.id) === (updated._id || updated.id) ? updated : l
          ),
        }))
      );
      setActiveLectureForEdit(null);
      setStatusMessage({ text: 'লেকচার সফলভাবে আপডেট হয়েছে!' });
    }
    setIsSubmitting(false);
  };

  const handleDeleteLecture = async (lessonId: string) => {
    if (!window.confirm('আপনি কি এই লেকচারটি মুছে ফেলতে চান?')) return;
    const res = await deleteCourseLecture(lessonId, courseId);
    if (res.error) {
      alert(res.error);
    } else {
      setModules((prev) =>
        prev.map((m) => ({
          ...m,
          lessons: m.lessons.filter((l) => (l._id || l.id) !== lessonId),
        }))
      );
    }
  };

  const totalLessonsCount = modules.reduce((acc, m) => acc + (m.lessons?.length || 0), 0);

  return (
    <div className="space-y-6">
      {/* ── Top Header Banner ── */}
      <div className="rounded-2xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 p-6 sm:p-8 text-white shadow-xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-0.5 text-xs font-semibold backdrop-blur-sm">
                <Video className="h-3.5 w-3.5" /> কোর্স কারিকুলাম ও ভিডিও স্টুডিও
              </span>
              <Badge variant="outline" className="border-white/30 text-white text-xs">
                {course.categoryBangla || 'কোর্স'}
              </Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {course.title}
            </h1>
            <p className="text-xs sm:text-sm text-indigo-200">
              মোট {modules.length} টি মডিউল • {totalLessonsCount} টি ভিডিও লেকচার
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <Button
              onClick={() => setIsAddModuleOpen(true)}
              className="bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold text-xs sm:text-sm gap-1.5 shadow-sm"
            >
              <PlusCircle className="h-4 w-4" />
              <span>নতুন মডিউল</span>
            </Button>

            <Button
              onClick={() => openAddLectureModal()}
              className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs sm:text-sm gap-1.5 shadow-md"
            >
              <PlusCircle className="h-4 w-4" />
              <span>+ লেকচার ও ভিডিও যোগ করুন</span>
            </Button>

            <Link
              href={`/courses/${courseId}`}
              target="_blank"
              className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3.5 py-2 text-xs sm:text-sm font-semibold text-indigo-900 hover:bg-indigo-50 shadow-sm transition"
            >
              <Eye className="h-4 w-4" />
              <span>শিক্ষার্থী ভিউ</span>
            </Link>
          </div>
        </div>
      </div>

      {statusMessage && (
        <div
          className={`p-4 rounded-xl text-sm font-medium flex items-center justify-between shadow-sm ${
            statusMessage.error
              ? 'bg-red-50 text-red-700 border border-red-200'
              : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
          }`}
        >
          <span>{statusMessage.text}</span>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ── Curriculum Modules & Lectures List ── */}
      {modules.length === 0 ? (
        <Card className="p-12 text-center border-dashed border-2 border-indigo-200 bg-indigo-50/30 rounded-2xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-100 mb-4">
            <Video className="h-8 w-8 text-indigo-600" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">এখনো কোনো লেকচার বা মডিউল যোগ করা হয়নি</h3>
          <p className="text-sm text-gray-500 max-w-md mx-auto mb-6">
            কোর্সে ভিডিও লেকচার যুক্ত করতে প্রথমে একটি মডিউল তৈরি করুন অথবা সরাসরি লেকচার যোগ করুন।
          </p>
          <div className="flex justify-center gap-3">
            <Button
              onClick={() => setIsAddModuleOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              নতুন মডিউল তৈরি করুন
            </Button>
            <Button
              onClick={() => openAddLectureModal()}
              variant="outline"
              className="font-semibold"
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              প্রথম লেকচার যোগ করুন
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {modules.map((mod, modIdx) => {
            const mId = mod._id || mod.id || '';
            const isOpen = openModules[mId] ?? true;

            return (
              <div
                key={mId || modIdx}
                className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:border-indigo-200"
              >
                {/* Module Header */}
                <div
                  onClick={() => toggleModule(mId)}
                  className="flex items-center justify-between bg-gradient-to-r from-gray-50 to-indigo-50/30 px-6 py-4 cursor-pointer select-none"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white text-xs font-bold shadow-sm">
                      {modIdx + 1}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-base sm:text-lg">
                        {mod.title}
                      </h3>
                      <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                        <span>{mod.duration || '১ ঘণ্টা'}</span>
                        <span>•</span>
                        <span>{mod.lessons?.length || 0} টি লেকচার</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        openAddLectureModal(mId);
                      }}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold h-8 rounded-lg"
                    >
                      <PlusCircle className="h-3.5 w-3.5 mr-1" />
                      লেকচার যোগ করুন
                    </Button>
                    <div className="text-gray-400 p-1">
                      {isOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                    </div>
                  </div>
                </div>

                {/* Lessons in Module */}
                {isOpen && (
                  <div className="divide-y divide-gray-100 border-t border-gray-100">
                    {mod.lessons?.length === 0 ? (
                      <div className="p-6 text-center text-sm text-gray-400">
                        এই মডিউলে কোনো লেকচার নেই। &quot;লেকচার যোগ করুন&quot; বাটনে ক্লিক করুন।
                      </div>
                    ) : (
                      mod.lessons.map((lesson, lIdx) => {
                        const lId = lesson._id || lesson.id || '';
                        const hasVideo = !!lesson.videoUrl;

                        return (
                          <div
                            key={lId || lIdx}
                            className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:px-6 hover:bg-indigo-50/20 transition gap-3"
                          >
                            <div className="flex items-start sm:items-center gap-3 min-w-0">
                              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-100 text-[11px] font-semibold text-gray-600">
                                {lIdx + 1}
                              </span>
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <h4 className="font-semibold text-gray-900 text-sm truncate">
                                    {lesson.title}
                                  </h4>
                                  {lesson.isFree && (
                                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                                      ফ্রি প্রিভিউ
                                    </span>
                                  )}
                                  {hasVideo ? (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700 border border-blue-200">
                                      <Video className="h-3 w-3" /> ভিডিও সংযুক্ত
                                    </span>
                                  ) : (
                                    <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700 border border-amber-200">
                                      ভিডিও নেই
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" /> {lesson.duration || '15:00'}
                                  </span>
                                  {lesson.content && (
                                    <span className="truncate max-w-xs text-gray-500">
                                      {lesson.content}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Lecture Action Buttons */}
                            <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                              {hasVideo && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setActivePreviewVideo({
                                      title: lesson.title,
                                      url: lesson.videoUrl!,
                                    })
                                  }
                                  className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 px-2.5 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition"
                                >
                                  <PlayCircle className="h-3.5 w-3.5" />
                                  <span>ভিডিও দেখুন</span>
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => {
                                  setActiveLectureForEdit(lesson);
                                  setVideoFile(null);
                                }}
                                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-indigo-600 transition"
                                title="এডিট করুন"
                              >
                                <Edit3 className="h-4 w-4" />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeleteLecture(lId)}
                                className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 transition"
                                title="মুছে ফেলুন"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Modal: Add New Lecture ── */}
      {isAddLectureOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-2xl rounded-2xl bg-white p-6 sm:p-8 shadow-2xl border border-gray-100 my-8">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-6">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white">
                  <Video className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">নতুন ভিডিও লেকচার যোগ করুন</h3>
                  <p className="text-xs text-gray-500">লেকচারের তথ্য এবং ভিডিও লিংক বা ফাইল আপলোড করুন</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddLectureOpen(false)}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddLecture} className="space-y-5">
              {/* Module selection */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  মডিউল নির্বাচন করুন *
                </label>
                <select
                  value={targetModuleId}
                  onChange={(e) => setTargetModuleId(e.target.value)}
                  required
                  className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm shadow-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                >
                  {modules.map((m) => (
                    <option key={m._id || m.id} value={m._id || m.id}>
                      {m.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Lecture Title */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  লেকচারের শিরোনাম *
                </label>
                <input
                  type="text"
                  required
                  value={lectureTitle}
                  onChange={(e) => setLectureTitle(e.target.value)}
                  placeholder="যেমন: ১.১ - প্রতিক্রিয়া হুক পরিচিতি (React Hooks Intro)"
                  className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm shadow-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              {/* Video Source Tabs */}
              <div className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-900 uppercase tracking-wider">
                    ভিডিও সোর্স (Video Source)
                  </span>
                  <div className="inline-flex rounded-lg bg-white p-1 border border-indigo-200 shadow-sm text-xs">
                    <button
                      type="button"
                      onClick={() => setVideoMode('url')}
                      className={`px-3 py-1 rounded-md font-semibold transition ${
                        videoMode === 'url' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <LinkIcon className="inline h-3 w-3 mr-1" />
                      ইউআরএল লিংক (YouTube / Vimeo / MP4)
                    </button>
                    <button
                      type="button"
                      onClick={() => setVideoMode('file')}
                      className={`px-3 py-1 rounded-md font-semibold transition ${
                        videoMode === 'file' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <Upload className="inline h-3 w-3 mr-1" />
                      ভিডিও ফাইল আপলোড
                    </button>
                  </div>
                </div>

                {videoMode === 'url' ? (
                  <div>
                    <input
                      type="url"
                      value={videoUrl}
                      onChange={(e) => {
                        setVideoUrl(e.target.value);
                        setVideoPreviewSrc(e.target.value);
                      }}
                      placeholder="https://www.youtube.com/watch?v=... বা ভিমিও লিংক বা সরাসরি এমপি৪ লিংক"
                      className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm shadow-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                    />
                    <p className="text-[11px] text-gray-500 mt-1">
                      YouTube (unlisted বা public), Vimeo অথবা যেকোনো পাবলিক এমপি৪ ভিডিও সাপোর্ট করে।
                    </p>
                  </div>
                ) : (
                  <div>
                    <input
                      type="file"
                      accept="video/*"
                      onChange={handleVideoFileChange}
                      className="w-full text-xs text-gray-500 file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-600 file:px-4 file:py-2 file:text-xs file:font-semibold file:text-white hover:file:bg-indigo-700 cursor-pointer"
                    />
                    <p className="text-[11px] text-gray-500 mt-1">
                      সরাসরি এমপি৪, ওয়েবএম ভিডিও ফাইল নির্বাচন করুন (লোকাল স্টোরেজ অথবা Cloudflare R2-তে সংরক্ষিত হবে)।
                    </p>
                  </div>
                )}

                {/* Instant Video Preview Box */}
                {(videoUrl || videoPreviewSrc) && (
                  <div className="pt-2">
                    <p className="text-xs font-semibold text-gray-600 mb-1.5">ভিডিও প্রিভিউ:</p>
                    <VideoEmbedPlayer url={videoPreviewSrc || videoUrl} title={lectureTitle} />
                  </div>
                )}
              </div>

              {/* Duration and Free preview checkbox */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    ভিডিওর দৈর্ঘ্য (Duration)
                  </label>
                  <input
                    type="text"
                    value={lectureDuration}
                    onChange={(e) => setLectureDuration(e.target.value)}
                    placeholder="যেমন: 15:30 বা 20 mins"
                    className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm shadow-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>

                <div className="flex items-center pt-6">
                  <label className="relative flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={lectureIsFree}
                      onChange={(e) => setLectureIsFree(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-xs font-semibold text-gray-700">
                      ফ্রি প্রিভিউ লেকচার হিসেবে সেট করুন (বিনা মূল্যে উন্মুক্ত)
                    </span>
                  </label>
                </div>
              </div>

              {/* Lecture Content / Notes */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  লেকচারের বিবরণ ও রিসোর্স নোট
                </label>
                <textarea
                  rows={3}
                  value={lectureContent}
                  onChange={(e) => setLectureContent(e.target.value)}
                  placeholder="এই লেকচারের প্রয়োজনীয় লিংক, কোড স্নিপেট বা ব্যাখ্যা..."
                  className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm shadow-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddLectureOpen(false)}
                  disabled={isSubmitting}
                >
                  বাতিল
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold gap-2 px-6"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>সংরক্ষণ করা হচ্ছে…</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      <span>লেকচার যোগ করুন</span>
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Add New Module ── */}
      {isAddModuleOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-gray-100">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
              <h3 className="font-bold text-gray-900 text-base">নতুন কোর্স মডিউল তৈরি করুন</h3>
              <button
                onClick={() => setIsAddModuleOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddModule} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  মডিউল শিরোনাম *
                </label>
                <input
                  type="text"
                  required
                  value={newModuleTitle}
                  onChange={(e) => setNewModuleTitle(e.target.value)}
                  placeholder="যেমন: মডিউল ২: স্টেট ম্যানেজমেন্ট ও এপিআই"
                  className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm shadow-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  আনুমানিক সময়
                </label>
                <input
                  type="text"
                  value={newModuleDuration}
                  onChange={(e) => setNewModuleDuration(e.target.value)}
                  placeholder="যেমন: ২ ঘণ্টা ৩০ মিনিট"
                  className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm shadow-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddModuleOpen(false)}
                  disabled={isSubmitting}
                >
                  বাতিল
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'মডিউল তৈরি করুন'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Edit Existing Lecture ── */}
      {activeLectureForEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-2xl rounded-2xl bg-white p-6 sm:p-8 shadow-2xl border border-gray-100 my-8">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-6">
              <h3 className="text-lg font-bold text-gray-900">লেকচার ও ভিডিও সম্পাদন করুন</h3>
              <button
                onClick={() => setActiveLectureForEdit(null)}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateLecture} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  লেকচারের শিরোনাম *
                </label>
                <input
                  type="text"
                  required
                  value={activeLectureForEdit.title}
                  onChange={(e) =>
                    setActiveLectureForEdit({ ...activeLectureForEdit, title: e.target.value })
                  }
                  className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  ভিডিও ইউআরএল (YouTube, Vimeo, বা এমপি৪ লিংক)
                </label>
                <input
                  type="text"
                  value={activeLectureForEdit.videoUrl || ''}
                  onChange={(e) =>
                    setActiveLectureForEdit({ ...activeLectureForEdit, videoUrl: e.target.value })
                  }
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  অথবা নতুন ভিডিও ফাইল নির্বাচন করুন (অপশনাল)
                </label>
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleVideoFileChange}
                  className="w-full text-xs text-gray-500 file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-600 file:px-4 file:py-2 file:text-xs file:font-semibold file:text-white hover:file:bg-indigo-700 cursor-pointer"
                />
              </div>

              {activeLectureForEdit.videoUrl && (
                <div>
                  <p className="text-xs font-semibold text-gray-600 mb-1.5">বর্তমান ভিডিও প্রিভিউ:</p>
                  <VideoEmbedPlayer url={activeLectureForEdit.videoUrl} title={activeLectureForEdit.title} />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    দৈর্ঘ্য (Duration)
                  </label>
                  <input
                    type="text"
                    value={activeLectureForEdit.duration || ''}
                    onChange={(e) =>
                      setActiveLectureForEdit({
                        ...activeLectureForEdit,
                        duration: e.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>

                <div className="flex items-center pt-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={activeLectureForEdit.isFree || false}
                      onChange={(e) =>
                        setActiveLectureForEdit({
                          ...activeLectureForEdit,
                          isFree: e.target.checked,
                        })
                      }
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-xs font-semibold text-gray-700">ফ্রি প্রিভিউ হিসেবে সেট করুন</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  বিবরণ ও রিসোর্স নোট
                </label>
                <textarea
                  rows={3}
                  value={activeLectureForEdit.content || ''}
                  onChange={(e) =>
                    setActiveLectureForEdit({
                      ...activeLectureForEdit,
                      content: e.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setActiveLectureForEdit(null)}
                  disabled={isSubmitting}
                >
                  বাতিল
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                >
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'আপডেট করুন'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Preview Video Player ── */}
      {activePreviewVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-4xl rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
              <div className="flex items-center gap-2 text-white">
                <PlayCircle className="h-5 w-5 text-indigo-400" />
                <h3 className="font-bold text-sm sm:text-base truncate">
                  {activePreviewVideo.title}
                </h3>
              </div>
              <button
                onClick={() => setActivePreviewVideo(null)}
                className="rounded-lg bg-slate-800 p-1.5 text-slate-400 hover:bg-slate-700 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4 bg-black">
              <VideoEmbedPlayer
                url={activePreviewVideo.url}
                title={activePreviewVideo.title}
                autoPlay={true}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
