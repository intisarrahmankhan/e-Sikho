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
  GraduationCap,
  Download,
  HelpCircle,
  FileDown,
  ShieldCheck,
  Rocket,
  Code2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import VideoEmbedPlayer from '@/components/instructor/VideoEmbedPlayer';
import { useLanguage } from '@/context/LanguageContext';
import {
  addCourseLecture,
  addCourseModule,
  updateCourseLecture,
  deleteCourseLecture,
} from '@/actions/instructor';

export interface QuizOption {
  id: string;
  _id?: string;
  title: string;
  totalMarks?: number;
  duration?: number;
  questionCount?: number;
}

export interface Lesson {
  _id: string;
  id?: string;
  title: string;
  content?: string;
  duration: string;
  isFree?: boolean;
  order: number;
  videoUrl?: string;
  pdfUrl?: string;
  pdfName?: string;
  quizId?: any;
  type?: 'VIDEO' | 'PDF' | 'QUIZ' | 'PROJECT';
  isDownloadable?: boolean;
  bunnyVideoId?: string;
  bunnyLibraryId?: string;
  projectInstructions?: string;
  maxMarks?: number;
  passMarks?: number;
  githubRequired?: boolean;
  liveUrlRequired?: boolean;
}

export interface Module {
  _id: string;
  id?: string;
  title: string;
  duration: string;
  order: number;
  lessons: Lesson[];
}

export interface Course {
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

export interface LectureManagerProps {
  course: Course;
  quizzes?: QuizOption[];
}

export default function LectureManager({
  course: initialCourse,
  quizzes = [],
}: LectureManagerProps) {
  const { language } = useLanguage();
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
  const [lectureType, setLectureType] = useState<'VIDEO' | 'PDF' | 'QUIZ' | 'PROJECT'>('VIDEO');

  // Project Portal States (Add)
  const [projectInstructions, setProjectInstructions] = useState('');
  const [maxMarks, setMaxMarks] = useState(100);
  const [passMarks, setPassMarks] = useState(60);
  const [githubRequired, setGithubRequired] = useState(true);
  const [liveUrlRequired, setLiveUrlRequired] = useState(true);

  // Video states
  const [videoMode, setVideoMode] = useState<'url' | 'file' | 'bunny'>('url');
  const [videoUrl, setVideoUrl] = useState('');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreviewSrc, setVideoPreviewSrc] = useState('');
  const [bunnyVideoId, setBunnyVideoId] = useState('');
  const [bunnyLibraryId, setBunnyLibraryId] = useState('345678');
  const [uploadToBunny, setUploadToBunny] = useState(true);

  // PDF states
  const [pdfMode, setPdfMode] = useState<'file' | 'url'>('file');
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfUrl, setPdfUrl] = useState('');
  const [pdfName, setPdfName] = useState('');
  const [isDownloadable, setIsDownloadable] = useState(false); // false = View-Only by default

  // Quiz state
  const [selectedQuizId, setSelectedQuizId] = useState<string>(
    quizzes.length > 0 ? quizzes[0].id || quizzes[0]._id || '' : ''
  );

  // Edit states
  const [editLectureType, setEditLectureType] = useState<'VIDEO' | 'PDF' | 'QUIZ' | 'PROJECT'>('VIDEO');
  const [editProjectInstructions, setEditProjectInstructions] = useState('');
  const [editMaxMarks, setEditMaxMarks] = useState(100);
  const [editPassMarks, setEditPassMarks] = useState(60);
  const [editGithubRequired, setEditGithubRequired] = useState(true);
  const [editLiveUrlRequired, setEditLiveUrlRequired] = useState(true);
  const [editPdfFile, setEditPdfFile] = useState<File | null>(null);
  const [editPdfUrl, setEditPdfUrl] = useState('');
  const [editPdfName, setEditPdfName] = useState('');
  const [editIsDownloadable, setEditIsDownloadable] = useState(false);
  const [editQuizId, setEditQuizId] = useState('');
  const [editBunnyVideoId, setEditBunnyVideoId] = useState('');
  const [editBunnyLibraryId, setEditBunnyLibraryId] = useState('345678');

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

  const handlePdfFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPdfFile(file);
      if (!pdfName) setPdfName(file.name);
    }
  };

  const handleEditPdfFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setEditPdfFile(file);
      if (!editPdfName) setEditPdfName(file.name);
    }
  };

  const openAddLectureModal = (moduleId?: string) => {
    if (moduleId) setTargetModuleId(moduleId);
    else if (modules.length > 0) setTargetModuleId(modules[0]._id || modules[0].id || '');
    setLectureTitle('');
    setLectureContent('');
    setLectureDuration('15:00');
    setLectureIsFree(false);
    setLectureType('VIDEO');
    setProjectInstructions('');
    setMaxMarks(100);
    setPassMarks(60);
    setGithubRequired(true);
    setLiveUrlRequired(true);
    setVideoMode('url');
    setVideoUrl('');
    setVideoFile(null);
    setVideoPreviewSrc('');
    setBunnyVideoId('');
    setBunnyLibraryId('345678');
    setUploadToBunny(true);
    setPdfMode('file');
    setPdfFile(null);
    setPdfUrl('');
    setPdfName('');
    setIsDownloadable(false);
    setSelectedQuizId(quizzes.length > 0 ? quizzes[0].id || quizzes[0]._id || '' : '');
    setStatusMessage(null);
    setIsAddLectureOpen(true);
  };

  const openEditLectureModal = (lesson: Lesson) => {
    setActiveLectureForEdit(lesson);
    const resolvedType =
      lesson.type || (lesson.quizId ? 'QUIZ' : lesson.pdfUrl ? 'PDF' : 'VIDEO');
    setEditLectureType(resolvedType);
    setEditProjectInstructions(lesson.projectInstructions || lesson.content || '');
    setEditMaxMarks(lesson.maxMarks || 100);
    setEditPassMarks(lesson.passMarks || 60);
    setEditGithubRequired(lesson.githubRequired !== false);
    setEditLiveUrlRequired(lesson.liveUrlRequired !== false);
    setVideoFile(null);
    setEditBunnyVideoId(lesson.bunnyVideoId || '');
    setEditBunnyLibraryId(lesson.bunnyLibraryId || '345678');
    setEditPdfFile(null);
    setEditPdfUrl(lesson.pdfUrl || '');
    setEditPdfName(lesson.pdfName || '');
    setEditIsDownloadable(!!lesson.isDownloadable);
    const qId =
      typeof lesson.quizId === 'object'
        ? lesson.quizId?._id || lesson.quizId?.id || ''
        : lesson.quizId || '';
    setEditQuizId(qId);
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
      setStatusMessage({ text: language === 'en' ? 'Module created successfully!' : 'মডিউল সফলভাবে তৈরি হয়েছে!' });
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
    formData.append('type', lectureType);
    formData.append('isDownloadable', String(isDownloadable));

    // Project portal details
    if (lectureType === 'PROJECT') {
      formData.append('projectInstructions', projectInstructions.trim());
      formData.append('maxMarks', String(maxMarks));
      formData.append('passMarks', String(passMarks));
      formData.append('githubRequired', String(githubRequired));
      formData.append('liveUrlRequired', String(liveUrlRequired));
    }

    // Video details
    if (lectureType === 'VIDEO') {
      if (videoMode === 'url' && videoUrl.trim()) {
        formData.append('videoUrl', videoUrl.trim());
      } else if (videoMode === 'file' && videoFile) {
        formData.append('videoFile', videoFile);
        if (uploadToBunny) {
          formData.append('videoProvider', 'bunny');
        }
      } else if (videoMode === 'bunny' && bunnyVideoId.trim()) {
        formData.append('bunnyVideoId', bunnyVideoId.trim());
        formData.append('bunnyLibraryId', bunnyLibraryId.trim());
        formData.append('videoUrl', `https://iframe.mediadelivery.net/embed/${bunnyLibraryId.trim() || '345678'}/${bunnyVideoId.trim()}`);
      }
    }

    // PDF attachment (allowed for PDF type or optional slide with VIDEO)
    if (lectureType === 'PDF' || pdfFile || pdfUrl) {
      if (pdfMode === 'url' && pdfUrl.trim()) {
        formData.append('pdfUrl', pdfUrl.trim());
      } else if (pdfMode === 'file' && pdfFile) {
        formData.append('pdfFile', pdfFile);
      }
      if (pdfName.trim()) {
        formData.append('pdfName', pdfName.trim());
      }
    }

    // Quiz attachment
    if (lectureType === 'QUIZ' && selectedQuizId) {
      formData.append('quizId', selectedQuizId);
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
              lessons: [...(m.lessons || []), newLesson],
            };
          }
          return m;
        })
      );
      setIsAddLectureOpen(false);
      setStatusMessage({ text: language === 'en' ? 'Lesson created successfully!' : 'পাঠ / লেকচার সফলভাবে যুক্ত হয়েছে!' });
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
    formData.append('type', editLectureType);
    formData.append('isDownloadable', String(editIsDownloadable));

    if (editLectureType === 'PROJECT') {
      formData.append('projectInstructions', editProjectInstructions.trim());
      formData.append('maxMarks', String(editMaxMarks));
      formData.append('passMarks', String(editPassMarks));
      formData.append('githubRequired', String(editGithubRequired));
      formData.append('liveUrlRequired', String(editLiveUrlRequired));
    }

    if (activeLectureForEdit.videoUrl) {
      formData.append('videoUrl', activeLectureForEdit.videoUrl);
    }
    if (videoFile) {
      formData.append('videoFile', videoFile);
    }
    if (editBunnyVideoId) {
      formData.append('bunnyVideoId', editBunnyVideoId.trim());
      formData.append('bunnyLibraryId', editBunnyLibraryId.trim());
      formData.append('videoUrl', `https://iframe.mediadelivery.net/embed/${editBunnyLibraryId.trim() || '345678'}/${editBunnyVideoId.trim()}`);
    }

    if (editPdfFile) {
      formData.append('pdfFile', editPdfFile);
    } else if (editPdfUrl) {
      formData.append('pdfUrl', editPdfUrl);
    }
    if (editPdfName) {
      formData.append('pdfName', editPdfName);
    }

    if (editLectureType === 'QUIZ' && editQuizId) {
      formData.append('quizId', editQuizId);
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
      setStatusMessage({ text: language === 'en' ? 'Lesson updated successfully!' : 'লেকচার সফলভাবে আপডেট হয়েছে!' });
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
                <Layers className="h-3.5 w-3.5" /> কোর্স কারিকুলাম ও কন্টেন্ট বিল্ডার
              </span>
              <Badge variant="outline" className="border-white/30 text-white text-xs">
                {course.categoryBangla || 'কোর্স'}
              </Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {course.title}
            </h1>
            <p className="text-xs sm:text-sm text-indigo-200">
              মোট {modules.length} টি মডিউল / সেকশন • {totalLessonsCount} টি পাঠ (ভিডিও, পিডিএফ ও কুইজ)
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <Button
              onClick={() => setIsAddModuleOpen(true)}
              className="bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold text-xs sm:text-sm gap-1.5 shadow-sm"
            >
              <PlusCircle className="h-4 w-4" />
              <span>নতুন মডিউল যোগ করুন</span>
            </Button>

            <Button
              onClick={() => openAddLectureModal()}
              className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs sm:text-sm gap-1.5 shadow-md"
            >
              <PlusCircle className="h-4 w-4" />
              <span>+ লেকচার যোগ করুন</span>
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
            <Layers className="h-8 w-8 text-indigo-600" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">এখনো কোনো লেকচার বা মডিউল যোগ করা হয়নি</h3>
          <p className="text-sm text-gray-500 max-w-md mx-auto mb-6">
            কোর্সের পাঠ সাজাতে প্রথমে একটি মডিউল তৈরি করুন অথবা সরাসরি লেকচার, ভিডিও বা পিডিএফ স্লাইডস যোগ করুন।
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
                        <span>{mod.lessons?.length || 0} টি লেকচার ও আইটেম</span>
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
                        এই মডিউলে এখনো কোনো পাঠ নেই। &quot;লেকচার যোগ করুন&quot; বাটনে ক্লিক করে ভিডিও, পিডিএফ বা কুইজ যুক্ত করুন।
                      </div>
                    ) : (
                      mod.lessons.map((lesson, lIdx) => {
                        const lId = lesson._id || lesson.id || '';
                        const hasVideo = !!lesson.videoUrl;
                        const hasPdf = !!lesson.pdfUrl;
                        const hasQuiz = !!lesson.quizId;
                        const isQuiz = lesson.type === 'QUIZ' || hasQuiz;
                        const isPdf = lesson.type === 'PDF' || (hasPdf && !hasVideo);
                        const isBunny =
                          !!lesson.bunnyVideoId ||
                          (!!lesson.videoUrl &&
                            (lesson.videoUrl.includes('mediadelivery.net') ||
                              lesson.videoUrl.includes('bunny')));

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

                                  {/* Media Badges */}
                                  {lesson.type === 'PROJECT' ? (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-0.5 text-[10px] font-bold text-indigo-700 border border-indigo-200">
                                      <Rocket className="h-3 w-3 text-indigo-600" /> {language === 'en' ? 'Project Portal (Automated Eval)' : 'প্রজেক্ট পোর্টাল (স্বয়ংক্রিয় মূল্যায়ন)'}
                                    </span>
                                  ) : isQuiz ? (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2 py-0.5 text-[10px] font-bold text-purple-700 border border-purple-200">
                                      <GraduationCap className="h-3 w-3" /> {language === 'en' ? 'Quiz / Exam' : 'কুইজ / পরীক্ষা'}
                                    </span>
                                  ) : isPdf ? (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 border border-amber-200">
                                      <FileText className="h-3 w-3" /> {language === 'en' ? 'PDF Slides' : 'PDF লেকচার নোটস'}
                                    </span>
                                  ) : hasVideo ? (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700 border border-blue-200">
                                      <Video className="h-3 w-3" /> {language === 'en' ? 'Video Class' : 'ভিডিও লেকচার'}
                                    </span>
                                  ) : (
                                    <span className="rounded-full bg-gray-50 px-2 py-0.5 text-[10px] font-medium text-gray-500 border border-gray-200">
                                      {language === 'en' ? 'Text Lesson' : 'টেক্সট পাঠ'}
                                    </span>
                                  )}

                                  {isBunny && (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                                      <ShieldCheck className="h-3 w-3 text-emerald-600" /> Bunny DRM
                                    </span>
                                  )}

                                  {hasPdf && hasVideo && (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                                      <FileDown className="h-3 w-3" /> PDF সংযুক্ত
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
                                  <span>ভিডিও</span>
                                </button>
                              )}

                              {hasPdf && (
                                <a
                                  href={lesson.pdfUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition"
                                  title="পিডিএফ ফাইল দেখুন"
                                >
                                  <FileText className="h-3.5 w-3.5" />
                                  <span>পিডিএফ</span>
                                </a>
                              )}

                              {isQuiz && (
                                <Link
                                  href={`/exams/${
                                    typeof lesson.quizId === 'object'
                                      ? lesson.quizId?._id || lesson.quizId?.id
                                      : lesson.quizId
                                  }`}
                                  target="_blank"
                                  className="inline-flex items-center gap-1 rounded-lg bg-purple-50 px-2.5 py-1.5 text-xs font-semibold text-purple-700 hover:bg-purple-100 transition"
                                  title="কুইজ প্রশ্ন ও সেটিংস"
                                >
                                  <GraduationCap className="h-3.5 w-3.5" />
                                  <span>কুইজ প্রিভিউ</span>
                                </Link>
                              )}

                              <button
                                type="button"
                                onClick={() => openEditLectureModal(lesson)}
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
                  <PlusCircle className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">নতুন লেকচার বা পাঠ যোগ করুন</h3>
                  <p className="text-xs text-gray-500">ভিডিও ক্লাস, পিডিএফ স্লাইডস বা কুইজ অ্যাসেসমেন্ট সংযুক্ত করুন</p>
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

              {/* Content Type Selector */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  {language === 'en' ? 'Content Type *' : 'পাঠের প্রধান ধরন (Content Type) *'}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => setLectureType('VIDEO')}
                    className={`flex items-center justify-center gap-2 rounded-xl p-3 border text-xs font-bold transition ${
                      lectureType === 'VIDEO'
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700 ring-2 ring-indigo-200'
                        : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Video className="h-4 w-4 text-indigo-600" />
                    <span>{language === 'en' ? 'Video' : 'ভিডিও লেকচার'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setLectureType('PDF')}
                    className={`flex items-center justify-center gap-2 rounded-xl p-3 border text-xs font-bold transition ${
                      lectureType === 'PDF'
                        ? 'border-amber-600 bg-amber-50 text-amber-800 ring-2 ring-amber-200'
                        : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <FileText className="h-4 w-4 text-amber-600" />
                    <span>{language === 'en' ? 'PDF Slides' : 'পিডিএফ স্লাইডস'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setLectureType('QUIZ')}
                    className={`flex items-center justify-center gap-2 rounded-xl p-3 border text-xs font-bold transition ${
                      lectureType === 'QUIZ'
                        ? 'border-purple-600 bg-purple-50 text-purple-800 ring-2 ring-purple-200'
                        : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <GraduationCap className="h-4 w-4 text-purple-600" />
                    <span>{language === 'en' ? 'Quiz / Exam' : 'কুইজ / পরীক্ষা'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setLectureType('PROJECT')}
                    className={`flex items-center justify-center gap-2 rounded-xl p-3 border text-xs font-bold transition ${
                      lectureType === 'PROJECT'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-200 shadow-xs'
                        : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Rocket className="h-4 w-4 text-emerald-600" />
                    <span>{language === 'en' ? 'Project Portal' : 'প্রজেক্ট পোর্টাল'}</span>
                  </button>
                </div>
              </div>

              {/* Lecture Title */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  পাঠ বা লেকচারের শিরোনাম *
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

              {/* Video Source (shown if VIDEO) */}
              {lectureType === 'VIDEO' && (
                <div className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-900 uppercase tracking-wider">
                      ভিডিও সোর্স (Video Source)
                    </span>
                    <div className="inline-flex rounded-lg bg-white p-1 border border-indigo-200 shadow-sm text-xs">
                      <button
                        type="button"
                        onClick={() => setVideoMode('url')}
                        className={`px-2.5 py-1 rounded-md font-semibold transition ${
                          videoMode === 'url' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        <LinkIcon className="inline h-3 w-3 mr-1" />
                        ইউআরএল (YouTube/Vimeo)
                      </button>
                      <button
                        type="button"
                        onClick={() => setVideoMode('file')}
                        className={`px-2.5 py-1 rounded-md font-semibold transition ${
                          videoMode === 'file' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        <Upload className="inline h-3 w-3 mr-1" />
                        ভিডিও আপলোড
                      </button>
                      <button
                        type="button"
                        onClick={() => setVideoMode('bunny')}
                        className={`px-2.5 py-1 rounded-md font-semibold transition flex items-center gap-1 ${
                          videoMode === 'bunny' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                        Bunny DRM
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
                  ) : videoMode === 'file' ? (
                    <div className="space-y-2">
                      <input
                        type="file"
                        accept="video/*"
                        onChange={handleVideoFileChange}
                        className="w-full text-xs text-gray-500 file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-600 file:px-4 file:py-2 file:text-xs file:font-semibold file:text-white hover:file:bg-indigo-700 cursor-pointer"
                      />
                      <label className="flex items-center gap-2 cursor-pointer bg-white p-2 rounded-lg border border-indigo-100">
                        <input
                          type="checkbox"
                          checked={uploadToBunny}
                          onChange={(e) => setUploadToBunny(e.target.checked)}
                          className="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500 border-gray-300"
                        />
                        <span className="text-xs font-semibold text-gray-700 flex items-center gap-1">
                          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 inline" />
                          Bunny.net DRM স্বয়ংক্রিয় এনক্রিপশন সহ আপলোড করুন (ভিডিও ডাউনলোড প্রতিরোধে HLS AES-128)
                        </span>
                      </label>
                      <p className="text-[11px] text-gray-500">
                        সরাসরি এমপি৪, ওয়েবএম ভিডিও ফাইল নির্বাচন করুন। ক্লাউডফ্লেয়ার বা Bunny.net মাধ্যমে এনক্রিপ্ট হবে।
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3 bg-white p-3.5 rounded-xl border border-indigo-200">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700">
                        <ShieldCheck className="h-4 w-4 text-emerald-600" />
                        <span>Bunny.net DRM এনক্রিপ্টেড স্ট্রিমিং (Token-signed HLS)</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div>
                          <label className="block text-[11px] font-bold text-gray-700 mb-1">
                            Bunny Video ID *
                          </label>
                          <input
                            type="text"
                            value={bunnyVideoId}
                            onChange={(e) => {
                              setBunnyVideoId(e.target.value);
                              if (e.target.value.trim()) {
                                setVideoPreviewSrc(`https://iframe.mediadelivery.net/embed/${bunnyLibraryId || '345678'}/${e.target.value.trim()}`);
                              }
                            }}
                            placeholder="যেমন: 8a7c2b1e-3f90-4d56-a123-abcdef012345"
                            className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-xs outline-none focus:border-indigo-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-gray-700 mb-1">
                            Library ID (ঐচ্ছিক)
                          </label>
                          <input
                            type="text"
                            value={bunnyLibraryId}
                            onChange={(e) => setBunnyLibraryId(e.target.value)}
                            placeholder="যেমন: 345678"
                            className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-xs outline-none focus:border-indigo-500"
                          />
                        </div>
                      </div>
                      <p className="text-[11px] text-gray-500">
                        Bunny Stream ড্যাশবোর্ড থেকে ভিডিও আইডি দিলে এটি ছাত্রছাত্রীদের কাছে টাইম-লিমিটেড টোকেন এবং ডাইনামিক ওয়াটারমার্ক সহ সুরক্ষিতভাবে এনক্রিপ্টেড চলবে। ডাউনলোড করা অসম্ভব।
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
              )}

              {/* PDF Slides Section (shown if PDF or as optional attachment for VIDEO) */}
              {(lectureType === 'PDF' || lectureType === 'VIDEO') && (
                <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                      <FileText className="h-4 w-4 text-amber-600" />
                      {lectureType === 'PDF'
                        ? 'পিডিএফ স্লাইডস ও লেকচার নোটস *'
                        : 'ঐচ্ছিক পিডিএফ স্লাইডস সংযুক্তি (Optional Slides)'}
                    </span>
                    <div className="inline-flex rounded-lg bg-white p-1 border border-amber-200 shadow-sm text-xs">
                      <button
                        type="button"
                        onClick={() => setPdfMode('file')}
                        className={`px-2.5 py-1 rounded-md font-semibold transition ${
                          pdfMode === 'file' ? 'bg-amber-600 text-white' : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        <Upload className="inline h-3 w-3 mr-1" />
                        ফাইল আপলোড
                      </button>
                      <button
                        type="button"
                        onClick={() => setPdfMode('url')}
                        className={`px-2.5 py-1 rounded-md font-semibold transition ${
                          pdfMode === 'url' ? 'bg-amber-600 text-white' : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        <LinkIcon className="inline h-3 w-3 mr-1" />
                        লিংক
                      </button>
                    </div>
                  </div>

                  {pdfMode === 'file' ? (
                    <div>
                      <input
                        type="file"
                        accept="application/pdf"
                        onChange={handlePdfFileChange}
                        className="w-full text-xs text-gray-500 file:mr-3 file:rounded-lg file:border-0 file:bg-amber-600 file:px-4 file:py-2 file:text-xs file:font-semibold file:text-white hover:file:bg-amber-700 cursor-pointer"
                      />
                      <p className="text-[11px] text-gray-500 mt-1">
                        পিডিএফ ফাইল আপলোড করুন (সর্বোচ্চ ৫০ এমবি)।
                      </p>
                    </div>
                  ) : (
                    <div>
                      <input
                        type="url"
                        value={pdfUrl}
                        onChange={(e) => setPdfUrl(e.target.value)}
                        placeholder="https://.../lecture-notes.pdf"
                        className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm shadow-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                      পিডিএফ ফাইলের নাম / ডিসপ্লে লেবেল
                    </label>
                    <input
                      type="text"
                      value={pdfName}
                      onChange={(e) => setPdfName(e.target.value)}
                      placeholder="যেমন: লেকচার ১ স্লাইডস ও রিসোর্স গাইড.pdf"
                      className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs shadow-sm outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl border border-amber-200 bg-amber-50/80">
                    <div>
                      <div className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-amber-600" />
                        <span>শিক্ষার্থীদের ডাউনলোড অনুমতি (Allow Download)</span>
                      </div>
                      <p className="text-[11px] text-amber-800 mt-0.5">
                        {isDownloadable
                          ? 'ডাউনলোড সক্রিয়: শিক্ষার্থীরা মূল পিডিএফ ফাইল সরাসরি ডাউনলোড করতে পারবে।'
                          : 'ডিফল্ট ভিউ-অনলি: মেধা সম্পদ সুরক্ষায় শিক্ষার্থীদের জন্য ডাউনলোড বন্ধ থাকবে (ভিউ-অনলি DRM)।'}
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-3">
                      <input
                        type="checkbox"
                        checked={isDownloadable}
                        onChange={(e) => setIsDownloadable(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-600"></div>
                    </label>
                  </div>
                </div>
              )}

              {/* Quiz Selection Section (shown if QUIZ) */}
              {lectureType === 'QUIZ' && (
                <div className="rounded-xl border border-purple-200 bg-purple-50/40 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-purple-900 uppercase tracking-wider flex items-center gap-1.5">
                      <GraduationCap className="h-4 w-4 text-purple-600" />
                      কুইজ / পরীক্ষা নির্বাচন করুন *
                    </span>
                    <Link
                      href="/exams/create"
                      target="_blank"
                      className="inline-flex items-center gap-1 text-xs font-bold text-purple-700 hover:text-purple-900"
                    >
                      <PlusCircle className="h-3.5 w-3.5" />
                      <span>নতুন কুইজ তৈরি করুন</span>
                    </Link>
                  </div>

                  {quizzes.length > 0 ? (
                    <div>
                      <select
                        value={selectedQuizId}
                        onChange={(e) => setSelectedQuizId(e.target.value)}
                        className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm shadow-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
                      >
                        {quizzes.map((q) => (
                          <option key={q.id || q._id} value={q.id || q._id}>
                            {q.title} ({q.questionCount || 0} টি প্রশ্ন • {q.totalMarks || 0} নম্বর • {q.duration || 15} মিনিট)
                          </option>
                        ))}
                      </select>
                      <p className="text-[11px] text-gray-500 mt-1">
                        এই পাঠটি সম্পন্ন করতে শিক্ষার্থীকে এই কুইজে অংশগ্রহণ করতে হবে।
                      </p>
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-white border border-dashed border-purple-200 text-center space-y-2">
                      <p className="text-xs text-gray-600">
                        এই কোর্সের সাথে সংযুক্ত কোনো কুইজ পাওয়া যায়নি।
                      </p>
                      <Link
                        href="/exams/create"
                        target="_blank"
                        className="inline-flex items-center gap-1.5 rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-purple-700 transition"
                      >
                        <PlusCircle className="h-3.5 w-3.5" />
                        <span>এখনই কুইজ তৈরি করুন</span>
                      </Link>
                    </div>
                  )}
                </div>
              )}

              {/* Project Portal Section (shown if PROJECT) */}
              {lectureType === 'PROJECT' && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-950 uppercase tracking-wider flex items-center gap-1.5">
                      <Rocket className="h-4 w-4 text-emerald-600" />
                      {language === 'en' ? 'Project Submission Portal & Automated Evaluation' : 'প্রজেক্ট সাবমিশন পোর্টাল ও স্বয়ংক্রিয় মূল্যায়ন কনফিগারেশন'}
                    </span>
                    <Badge className="bg-emerald-600 text-white text-[10px] font-bold">
                      {language === 'en' ? 'Automated Checks' : 'অটোমেটেড মূল্যায়ন'}
                    </Badge>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">
                      {language === 'en' ? 'Project Requirements & Instructions *' : 'প্রজেক্ট নির্দেশনাবলী ও প্রয়োজনীয় ফিচারসমূহ *'}
                    </label>
                    <textarea
                      rows={3}
                      value={projectInstructions}
                      onChange={(e) => setProjectInstructions(e.target.value)}
                      placeholder={
                        language === 'en'
                          ? 'e.g. Build an E-Commerce or AI web app with Next.js & MongoDB. Deploy live and submit GitHub + live URL.'
                          : 'যেমন: Next.js ও MongoDB ব্যবহার করে একটি সম্পূর্ণ ফুলস্ট্যাক প্রজেক্ট তৈরি করুন। Vercel বা অন্য হোস্টিংয়ে লাইভ করে গিটহাব ও লাইভ লিংক দিন।'
                      }
                      className="w-full rounded-xl border border-gray-200 bg-white p-3 text-xs shadow-sm outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-1">
                        {language === 'en' ? 'Maximum Marks' : 'সর্বোচ্চ নম্বর'}
                      </label>
                      <input
                        type="number"
                        value={maxMarks}
                        onChange={(e) => setMaxMarks(Number(e.target.value))}
                        className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs shadow-sm outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-1">
                        {language === 'en' ? 'Pass Marks' : 'পাস নম্বর'}
                      </label>
                      <input
                        type="number"
                        value={passMarks}
                        onChange={(e) => setPassMarks(Number(e.target.value))}
                        className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs shadow-sm outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  {/* Automated Evaluation Checklist Highlight */}
                  <div className="p-3 bg-white rounded-xl border border-emerald-100 space-y-2">
                    <p className="text-[11px] font-bold text-emerald-900 flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                      {language === 'en' ? 'Automated Evaluation Suite Enabled:' : 'স্বয়ংক্রিয় মূল্যায়ন সিস্টেমের চেকলিস্ট:'}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-600">
                      <label className="flex items-center gap-2">
                        <input type="checkbox" checked={githubRequired} onChange={(e) => setGithubRequired(e.target.checked)} className="rounded text-emerald-600" />
                        <span>{language === 'en' ? 'GitHub Repo Inspection (25 Marks)' : 'পাবলিক গিটহাব রিপোজিটরি যাচাই (২৫ নম্বর)'}</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input type="checkbox" checked={liveUrlRequired} onChange={(e) => setLiveUrlRequired(e.target.checked)} className="rounded text-emerald-600" />
                        <span>{language === 'en' ? 'Live Deployment Ping Check (25 Marks)' : 'লাইভ ডেপ্লয়মেন্ট পিং যাচাই (২৫ নম্বর)'}</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input type="checkbox" checked readOnly className="rounded text-emerald-600" />
                        <span>{language === 'en' ? 'Code Architecture & Stack (25 Marks)' : 'কোড আর্কিটেকচার ও টেক স্ট্যাক (২৫ নম্বর)'}</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input type="checkbox" checked readOnly className="rounded text-emerald-600" />
                        <span>{language === 'en' ? 'Docs & README Spec (25 Marks)' : 'ডকুমেন্টেশন ও রিডমি মানদণ্ড (২৫ নম্বর)'}</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Duration and Free preview checkbox */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    সময়কাল (Duration)
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
                      ফ্রি প্রিভিউ লেকচার (ভর্তি ছাড়াও উন্মুক্ত)
                    </span>
                  </label>
                </div>
              </div>

              {/* Lecture Content / Notes */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  লেকচারের বিবরণ ও সহায়ক নোট
                </label>
                <textarea
                  rows={3}
                  value={lectureContent}
                  onChange={(e) => setLectureContent(e.target.value)}
                  placeholder="এই পাঠের মূল বিষয়, লিংক বা রেফারেন্স নোট..."
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
                      <span>লেকচার সংরক্ষণ করুন</span>
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
              <h3 className="font-bold text-gray-900 text-base">নতুন কোর্স মডিউল / সেকশন তৈরি করুন</h3>
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
                  placeholder="যেমন: মডিউল ২: স্টেট ম্যানেজমেন্ট ও এপিআই ইন্টিগ্রেশন"
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
              <h3 className="text-lg font-bold text-gray-900">লেকচার ও কন্টেন্ট সম্পাদন করুন</h3>
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

              {/* Type Switcher */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  {language === 'en' ? 'Lesson Type' : 'পাঠের ধরন'}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditLectureType('VIDEO')}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                      editLectureType === 'VIDEO'
                        ? 'bg-indigo-50 border-indigo-600 text-indigo-700'
                        : 'bg-white border-gray-200 text-gray-600'
                    }`}
                  >
                    <Video className="h-3.5 w-3.5" />
                    <span>{language === 'en' ? 'Video' : 'ভিডিও'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditLectureType('PDF')}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                      editLectureType === 'PDF'
                        ? 'bg-amber-50 border-amber-600 text-amber-800'
                        : 'bg-white border-gray-200 text-gray-600'
                    }`}
                  >
                    <FileText className="h-3.5 w-3.5" />
                    <span>{language === 'en' ? 'PDF' : 'পিডিএফ'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditLectureType('QUIZ')}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                      editLectureType === 'QUIZ'
                        ? 'bg-purple-50 border-purple-600 text-purple-800'
                        : 'bg-white border-gray-200 text-gray-600'
                    }`}
                  >
                    <GraduationCap className="h-3.5 w-3.5" />
                    <span>{language === 'en' ? 'Quiz / Exam' : 'কুইজ'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditLectureType('PROJECT')}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                      editLectureType === 'PROJECT'
                        ? 'bg-emerald-50 border-emerald-600 text-emerald-800'
                        : 'bg-white border-gray-200 text-gray-600'
                    }`}
                  >
                    <Rocket className="h-3.5 w-3.5" />
                    <span>{language === 'en' ? 'Project' : 'প্রজেক্ট'}</span>
                  </button>
                </div>
              </div>

              {/* Video inputs */}
              {editLectureType === 'VIDEO' && (
                <div className="space-y-3 rounded-xl border border-indigo-100 bg-indigo-50/40 p-4">
                  <div>
                    <label className="block text-xs font-bold text-indigo-900 uppercase tracking-wider mb-1.5">
                      ভিডিও ইউআরএল (YouTube, Vimeo, বা এমপি৪ লিংক)
                    </label>
                    <input
                      type="text"
                      value={activeLectureForEdit.videoUrl || ''}
                      onChange={(e) =>
                        setActiveLectureForEdit({ ...activeLectureForEdit, videoUrl: e.target.value })
                      }
                      placeholder="https://www.youtube.com/watch?v=..."
                      className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-indigo-900 uppercase tracking-wider mb-1.5">
                      অথবা নতুন ভিডিও ফাইল নির্বাচন করুন (অপশনাল)
                    </label>
                    <input
                      type="file"
                      accept="video/*"
                      onChange={handleVideoFileChange}
                      className="w-full text-xs text-gray-500 file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-600 file:px-4 file:py-2 file:text-xs file:font-semibold file:text-white hover:file:bg-indigo-700 cursor-pointer"
                    />
                  </div>

                  {/* Bunny DRM inputs in Edit Modal */}
                  <div className="rounded-lg border border-indigo-200 bg-white p-3 space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700">
                      <ShieldCheck className="h-4 w-4 text-emerald-600" />
                      <span>Bunny.net DRM সিকিউর স্ট্রিমিং আইডি (অপশনাল)</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                          Bunny Video ID
                        </label>
                        <input
                          type="text"
                          value={editBunnyVideoId}
                          onChange={(e) => setEditBunnyVideoId(e.target.value)}
                          placeholder="8a7c2b1e-3f90-4d56-a123-abcdef012345"
                          className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-xs outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                          Library ID
                        </label>
                        <input
                          type="text"
                          value={editBunnyLibraryId}
                          onChange={(e) => setEditBunnyLibraryId(e.target.value)}
                          placeholder="345678"
                          className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-xs outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>
                  </div>

                  {activeLectureForEdit.videoUrl && (
                    <div>
                      <p className="text-xs font-semibold text-gray-600 mb-1.5">বর্তমান ভিডিও প্রিভিউ:</p>
                      <VideoEmbedPlayer url={activeLectureForEdit.videoUrl} title={activeLectureForEdit.title} />
                    </div>
                  )}
                </div>
              )}

              {/* PDF inputs */}
              {(editLectureType === 'PDF' || editLectureType === 'VIDEO') && (
                <div className="space-y-3 rounded-xl border border-amber-200 bg-amber-50/40 p-4">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                      <FileText className="h-4 w-4 text-amber-600" />
                      পিডিএফ স্লাইডস / লেকচার নোটস
                    </label>
                    {editPdfUrl && (
                      <a
                        href={editPdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-bold text-amber-700 hover:underline"
                      >
                        বর্তমান ফাইল দেখুন
                      </a>
                    )}
                  </div>

                  <div>
                    <input
                      type="file"
                      accept="application/pdf"
                      onChange={handleEditPdfFileChange}
                      className="w-full text-xs text-gray-500 file:mr-3 file:rounded-lg file:border-0 file:bg-amber-600 file:px-4 file:py-2 file:text-xs file:font-semibold file:text-white hover:file:bg-amber-700 cursor-pointer"
                    />
                  </div>

                  <div>
                    <input
                      type="text"
                      value={editPdfName}
                      onChange={(e) => setEditPdfName(e.target.value)}
                      placeholder="পিডিএফ শিরোনাম (যেমন: মডিউল স্লাইড.pdf)"
                      className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl border border-amber-200 bg-amber-50/80">
                    <div>
                      <div className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-amber-600" />
                        <span>শিক্ষার্থীদের ডাউনলোড অনুমতি (Allow Download)</span>
                      </div>
                      <p className="text-[11px] text-amber-800 mt-0.5">
                        {editIsDownloadable
                          ? 'ডাউনলোড সক্রিয়: শিক্ষার্থীরা মূল ফাইল সরাসরি ডাউনলোড করতে পারবে।'
                          : 'ডিফল্ট ভিউ-অনলি: শিক্ষার্থীদের জন্য ডাউনলোড বন্ধ থাকবে (মেধা সম্পদ সুরক্ষিত)।'}
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-3">
                      <input
                        type="checkbox"
                        checked={editIsDownloadable}
                        onChange={(e) => setEditIsDownloadable(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-600"></div>
                    </label>
                  </div>
                </div>
              )}

              {/* Quiz inputs */}
              {editLectureType === 'QUIZ' && (
                <div className="space-y-3 rounded-xl border border-purple-200 bg-purple-50/40 p-4">
                  <label className="block text-xs font-bold text-purple-900 uppercase tracking-wider">
                    সংযুক্ত কুইজ / পরীক্ষা নির্বাচন করুন
                  </label>
                  {quizzes.length > 0 ? (
                    <select
                      value={editQuizId}
                      onChange={(e) => setEditQuizId(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
                    >
                      <option value="">-- কুইজ নির্বাচন করুন --</option>
                      {quizzes.map((q) => (
                        <option key={q.id || q._id} value={q.id || q._id}>
                          {q.title} ({q.questionCount || 0} টি প্রশ্ন • {q.totalMarks || 0} নম্বর)
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-xs text-gray-500">কোনো কুইজ পাওয়া যায়নি।</p>
                  )}
                </div>
              )}

              {/* Project Portal Section (shown if PROJECT) */}
              {editLectureType === 'PROJECT' && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-950 uppercase tracking-wider flex items-center gap-1.5">
                      <Rocket className="h-4 w-4 text-emerald-600" />
                      {language === 'en' ? 'Project Submission Portal & Automated Evaluation' : 'প্রজেক্ট সাবমিশন পোর্টাল ও স্বয়ংক্রিয় মূল্যায়ন কনফিগারেশন'}
                    </span>
                    <Badge className="bg-emerald-600 text-white text-[10px] font-bold">
                      {language === 'en' ? 'Automated Checks' : 'অটোমেটেড মূল্যায়ন'}
                    </Badge>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">
                      {language === 'en' ? 'Project Requirements & Instructions *' : 'প্রজেক্ট নির্দেশনাবলী ও প্রয়োজনীয় ফিচারসমূহ *'}
                    </label>
                    <textarea
                      rows={3}
                      value={editProjectInstructions}
                      onChange={(e) => setEditProjectInstructions(e.target.value)}
                      placeholder={
                        language === 'en'
                          ? 'e.g. Build an E-Commerce or AI web app with Next.js & MongoDB. Deploy live and submit GitHub + live URL.'
                          : 'যেমন: Next.js ও MongoDB ব্যবহার করে একটি সম্পূর্ণ ফুলস্ট্যাক প্রজেক্ট তৈরি করুন। Vercel বা অন্য হোস্টিংয়ে লাইভ করে গিটহাব ও লাইভ লিংক দিন।'
                      }
                      className="w-full rounded-xl border border-gray-200 bg-white p-3 text-xs shadow-sm outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-1">
                        {language === 'en' ? 'Maximum Marks' : 'সর্বোচ্চ নম্বর'}
                      </label>
                      <input
                        type="number"
                        value={editMaxMarks}
                        onChange={(e) => setEditMaxMarks(Number(e.target.value))}
                        className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs shadow-sm outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-1">
                        {language === 'en' ? 'Pass Marks' : 'পাস নম্বর'}
                      </label>
                      <input
                        type="number"
                        value={editPassMarks}
                        onChange={(e) => setEditPassMarks(Number(e.target.value))}
                        className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs shadow-sm outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  {/* Automated Evaluation Checklist Highlight */}
                  <div className="p-3 bg-white rounded-xl border border-emerald-100 space-y-2">
                    <p className="text-[11px] font-bold text-emerald-900 flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                      {language === 'en' ? 'Automated Evaluation Suite Enabled:' : 'স্বয়ংক্রিয় মূল্যায়ন সিস্টেমের চেকলিস্ট:'}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-600">
                      <label className="flex items-center gap-2">
                        <input type="checkbox" checked={editGithubRequired} onChange={(e) => setEditGithubRequired(e.target.checked)} className="rounded text-emerald-600" />
                        <span>{language === 'en' ? 'GitHub Repo Inspection (25 Marks)' : 'পাবলিক গিটহাব রিপোজিটরি যাচাই (২৫ নম্বর)'}</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input type="checkbox" checked={editLiveUrlRequired} onChange={(e) => setEditLiveUrlRequired(e.target.checked)} className="rounded text-emerald-600" />
                        <span>{language === 'en' ? 'Live Deployment Ping Check (25 Marks)' : 'লাইভ ডেপ্লয়মেন্ট পিং যাচাই (২৫ নম্বর)'}</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input type="checkbox" checked readOnly className="rounded text-emerald-600" />
                        <span>{language === 'en' ? 'Code Architecture & Stack (25 Marks)' : 'কোড আর্কিটেকচার ও টেক স্ট্যাক (২৫ নম্বর)'}</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input type="checkbox" checked readOnly className="rounded text-emerald-600" />
                        <span>{language === 'en' ? 'Docs & README Spec (25 Marks)' : 'ডকুমেন্টেশন ও রিডমি মানদণ্ড (২৫ নম্বর)'}</span>
                      </label>
                    </div>
                  </div>
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
