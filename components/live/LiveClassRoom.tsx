'use client';

import React, { useState, useEffect, useTransition } from 'react';
import Link from 'next/link';
import {
  Video,
  Radio,
  Users,
  MessageSquare,
  ThumbsUp,
  Pin,
  CheckCircle2,
  ExternalLink,
  Send,
  Loader2,
  RefreshCw,
  Maximize2,
  Sparkles,
  HelpCircle,
  Clock,
  ArrowLeft,
  Share2,
  Check,
  Shield,
  Lock,
  Save,
  Film,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useLanguage } from '@/context/LanguageContext';
import {
  LiveQuestionItem,
  LiveSessionData,
  submitLiveQuestionAction,
  toggleUpvoteLiveQuestionAction,
  answerLiveQuestionAction,
  pinLiveQuestionAction,
  getLiveQuestionsAction,
  completeLiveSessionAndSaveToModuleAction,
} from '@/actions/live-class';

interface LiveClassRoomProps {
  initialSession: LiveSessionData;
  initialQuestions: LiveQuestionItem[];
  isInstructorOrAdmin: boolean;
  currentUserId?: string;
}

type QuestionTab = 'top' | 'all' | 'unanswered' | 'answered';

export function LiveClassRoom({
  initialSession,
  initialQuestions,
  isInstructorOrAdmin,
  currentUserId,
}: LiveClassRoomProps) {
  const { language } = useLanguage();

  const [session, setSession] = useState<LiveSessionData>(initialSession);
  const [questions, setQuestions] = useState<LiveQuestionItem[]>(initialQuestions);
  const [activeTab, setActiveTab] = useState<QuestionTab>('top');
  const [questionText, setQuestionText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [replyInputId, setReplyInputId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isAnswering, setIsAnswering] = useState(false);
  const viewerCount = initialSession.viewerCount || 0;
  const [copiedLink, setCopiedLink] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Archive and Recording states
  const [archiveModalOpen, setArchiveModalOpen] = useState(false);
  const [recordingInputUrl, setRecordingInputUrl] = useState(initialSession.recordingUrl || initialSession.streamUrl || '');
  const [isArchiving, setIsArchiving] = useState(false);
  const [archiveSuccessMsg, setArchiveSuccessMsg] = useState<string | null>(null);

  // Background question polling every 7 seconds
  useEffect(() => {
    const pollInterval = setInterval(async () => {
      const res = await getLiveQuestionsAction(session.id);
      if (res.success && res.questions) {
        setQuestions((prevQuestions) => {
          // Preserve local optimistic states if any
          return res.questions;
        });
      }
    }, 7000);

    return () => clearInterval(pollInterval);
  }, [session.id]);

  const handleRefreshQuestions = async () => {
    setIsRefreshing(true);
    try {
      const res = await getLiveQuestionsAction(session.id);
      if (res.success && res.questions) {
        setQuestions(res.questions);
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSubmitQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const trimmed = questionText.trim();
    if (trimmed.length < 5) {
      setErrorMsg(
        language === 'en'
          ? 'Question must be at least 5 characters long.'
          : 'প্রশ্নটি কমপক্ষে ৫টি অক্ষরের হতে হবে।'
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await submitLiveQuestionAction({
        sessionId: session.id,
        courseId: session.courseId,
        question: trimmed,
      });

      if (res.success && res.question) {
        setQuestions([res.question, ...questions]);
        setQuestionText('');
      } else if (res.error) {
        setErrorMsg(res.error);
      }
    } catch {
      setErrorMsg(
        language === 'en'
          ? 'Failed to post question. Please try again.'
          : 'প্রশ্ন পোস্ট করতে ব্যর্থ হয়েছে। পুনরায় চেষ্টা করুন।'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleUpvote = async (questionId: string) => {
    // Optimistic UI update
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id === questionId) {
          const nextHasUpvoted = !q.hasUpvoted;
          const nextCount = nextHasUpvoted ? q.upvoteCount + 1 : Math.max(0, q.upvoteCount - 1);
          return {
            ...q,
            hasUpvoted: nextHasUpvoted,
            upvoteCount: nextCount,
          };
        }
        return q;
      })
    );

    try {
      const res = await toggleUpvoteLiveQuestionAction(questionId);
      if (!res.success) {
        // Revert on failure
        handleRefreshQuestions();
      }
    } catch {
      handleRefreshQuestions();
    }
  };

  const handleToggleAnswer = async (questionId: string, currentStatus: boolean) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === questionId ? { ...q, isAnswered: !currentStatus } : q))
    );

    await answerLiveQuestionAction({
      questionId,
      isAnswered: !currentStatus,
    });
  };

  const handlePostReply = async (questionId: string) => {
    if (!replyText.trim()) return;
    setIsAnswering(true);
    try {
      const res = await answerLiveQuestionAction({
        questionId,
        isAnswered: true,
        instructorReply: replyText.trim(),
      });

      if (res.success) {
        setQuestions((prev) =>
          prev.map((q) =>
            q.id === questionId
              ? { ...q, isAnswered: true, instructorReply: replyText.trim() }
              : q
          )
        );
        setReplyInputId(null);
        setReplyText('');
      }
    } finally {
      setIsAnswering(false);
    }
  };

  const handleTogglePin = async (questionId: string) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === questionId ? { ...q, isPinned: !q.isPinned } : q))
    );

    await pinLiveQuestionAction(questionId);
  };

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 3000);
    }
  };

  const handleArchiveLiveSession = async () => {
    setIsArchiving(true);
    setArchiveSuccessMsg(null);
    try {
      const res = await completeLiveSessionAndSaveToModuleAction({
        sessionId: session.id,
        recordingUrl: recordingInputUrl,
      });
      if (res.error) {
        alert(res.error);
      } else {
        setSession((prev) => ({
          ...prev,
          status: 'COMPLETED',
          recordingUrl: recordingInputUrl || prev.streamUrl,
        }));
        setArchiveSuccessMsg(res.message || 'লাইভ ক্লাস সম্পন্ন হয়েছে এবং কোর্স মডিউলে সংরক্ষিত হয়েছে!');
        setTimeout(() => setArchiveModalOpen(false), 2200);
      }
    } catch (err: any) {
      alert(err.message || 'ক্লাস সংরক্ষণ ব্যর্থ হয়েছে।');
    } finally {
      setIsArchiving(false);
    }
  };

  // Filter and sort questions based on active tab
  const filteredQuestions = [...questions].filter((q) => {
    if (activeTab === 'unanswered') return !q.isAnswered;
    if (activeTab === 'answered') return q.isAnswered;
    return true;
  });

  if (activeTab === 'top') {
    filteredQuestions.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return b.upvoteCount - a.upvoteCount;
    });
  } else {
    filteredQuestions.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }

  const isLive = session.status === 'LIVE_NOW';
  const displayTitle = language === 'en' && session.titleEn ? session.titleEn : session.title;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* ── Top Header Navigation Bar ── */}
      <header className="bg-slate-900/90 border-b border-slate-800 backdrop-blur-md sticky top-0 z-40 px-4 sm:px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href={`/courses/${session.courseId}`}
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition px-2.5 py-1.5 rounded-lg hover:bg-slate-800"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>{language === 'en' ? 'Back to Course' : 'কোর্সে ফিরে যান'}</span>
            </Link>

            <span className="text-slate-700">|</span>

            <div className="flex items-center gap-2">
              {isLive ? (
                <span className="flex items-center gap-1.5 bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs px-2.5 py-0.5 rounded-full font-black animate-pulse">
                  <Radio className="h-3.5 w-3.5 text-rose-500" />
                  <span>{language === 'en' ? 'LIVE NOW' : 'লাইভ ক্লাস'}</span>
                </span>
              ) : (
                <span className="text-xs bg-slate-800 text-slate-300 px-2.5 py-0.5 rounded-full font-bold">
                  {session.status}
                </span>
              )}

              <span className="flex items-center gap-1 text-xs text-slate-400 font-medium">
                <Users className="h-3.5 w-3.5 text-indigo-400" />
                <strong className="text-white">{viewerCount}</strong>
                <span>{language === 'en' ? 'watching' : 'শিক্ষার্থী'}</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isInstructorOrAdmin && session.status !== 'COMPLETED' && (
              <Button
                size="sm"
                onClick={() => setArchiveModalOpen(true)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl gap-1.5 shadow-md shadow-emerald-600/20"
              >
                <Film className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">
                  {language === 'en' ? 'End & Archive Class' : 'ক্লাস সম্পন্ন ও সংরক্ষণ'}
                </span>
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={handleShare}
              className="bg-slate-800/80 hover:bg-slate-700 text-slate-200 border-slate-700 text-xs font-bold rounded-xl gap-1.5"
            >
              {copiedLink ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Share2 className="h-3.5 w-3.5" />}
              <span>{copiedLink ? (language === 'en' ? 'Link Copied!' : 'লিঙ্ক কপি হয়েছে!') : (language === 'en' ? 'Share' : 'শেয়ার')}</span>
            </Button>

            {session.meetUrl && (
              <a href={session.meetUrl} target="_blank" rel="noopener noreferrer">
                <Button
                  size="sm"
                  className="bg-primary-600 hover:bg-primary-500 text-white text-xs font-bold rounded-xl gap-1.5 shadow-md shadow-primary-600/20"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{language === 'en' ? 'Join Google Meet' : 'মিটে যুক্ত হন'}</span>
                </Button>
              </a>
            )}
          </div>
        </div>
      </header>

      {/* ── Main Content Area: Video Stream + Real-Time Q&A Panel ── */}
      <main className="max-w-7xl w-full mx-auto p-4 sm:p-6 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Video Player & Stream Details (8 cols) */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-4">
          {/* Video Container */}
          <div className="rounded-2xl overflow-hidden border border-slate-800 bg-black aspect-video relative shadow-2xl group select-none">
            {/* DRM Anti-Piracy Watermark Overlay for Recorded Live Classes */}
            {session.status === 'COMPLETED' && (
              <div
                className="pointer-events-none absolute inset-0 z-20 flex flex-wrap items-center justify-around opacity-20 overflow-hidden p-6 select-none"
                aria-hidden="true"
              >
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="rotate-[-25deg] text-center font-mono text-xs font-bold text-white tracking-widest my-6">
                    <div>e-Shikho Enrollment-Restricted Recording</div>
                    <div>User: {currentUserId || 'Enrolled Student'}</div>
                    <div className="text-[10px]">Restricted Enrollment Playback</div>
                  </div>
                ))}
              </div>
            )}

            {session.streamUrl || session.recordingUrl ? (
              <iframe
                src={`${session.recordingUrl || session.streamUrl}${(session.recordingUrl || session.streamUrl || '').includes('?') ? '&' : '?'}autoplay=1&mute=0`}
                title={displayTitle}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 text-center p-6 space-y-3">
                <Radio className="h-12 w-12 text-rose-500 animate-pulse" />
                <h3 className="text-lg font-bold text-white">
                  {language === 'en' ? 'Class Streaming In Progress' : 'লাইভ ক্লাস চলমান রয়েছে'}
                </h3>
                <p className="text-xs text-slate-400 max-w-md">
                  {language === 'en'
                    ? 'Connect through the embedded interactive channel or join the audio conference.'
                    : 'ইন্টারেক্টিভ ভিডিও স্ট্রিমে যুক্ত হন এবং ডানপাশের প্যানেলে রিয়েল-টাইম প্রশ্ন করুন।'}
                </p>
                {session.meetUrl && (
                  <a href={session.meetUrl} target="_blank" rel="noopener noreferrer">
                    <Button className="bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold rounded-xl gap-2 mt-2">
                      <ExternalLink className="h-4 w-4" />
                      <span>{language === 'en' ? 'Open Stream in Google Meet' : 'গুগল মিট কনফারেন্স ওপেন করুন'}</span>
                    </Button>
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Session Information Card */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="space-y-1.5 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="bg-indigo-600/20 text-indigo-300 border-indigo-500/30 text-[11px] font-bold">
                    {session.topic || (language === 'en' ? 'Interactive Lecture' : 'ইন্টারেক্টিভ লেকচার')}
                  </Badge>

                  {session.duration && (
                    <span className="text-xs text-slate-400 flex items-center gap-1 font-medium">
                      <Clock className="h-3.5 w-3.5 text-slate-500" />
                      <span>{session.duration}</span>
                    </span>
                  )}
                </div>

                <h1 className="text-lg sm:text-xl font-black text-white leading-snug">
                  {displayTitle}
                </h1>

                {session.description && (
                  <p className="text-xs text-slate-400 leading-relaxed pt-1">
                    {session.description}
                  </p>
                )}
              </div>

              {/* Instructor Capsule */}
              <div className="flex items-center gap-3 bg-slate-800/80 border border-slate-700/60 px-4 py-2.5 rounded-xl shrink-0">
                <img
                  src={
                    session.instructorAvatar ||
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop'
                  }
                  alt={session.instructorName}
                  className="h-10 w-10 rounded-full object-cover border border-indigo-400/50"
                />
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                    {language === 'en' ? 'Instructor & Mentor' : 'কোর্স মেন্টর'}
                  </div>
                  <div className="text-xs font-bold text-white">{session.instructorName}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Real-Time Interactive Q&A Panel (4 cols) */}
        <div className="lg:col-span-5 xl:col-span-4 flex flex-col rounded-2xl border border-slate-800 bg-slate-900/90 shadow-2xl overflow-hidden h-[720px] max-h-[85vh]">
          {/* Q&A Header */}
          <div className="p-4 border-b border-slate-800 bg-slate-900/90 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <MessageSquare className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-sm font-extrabold text-white flex items-center gap-1.5">
                    <span>{language === 'en' ? 'Live Q&A Queue' : 'লাইভ প্রশ্নোত্তর বোর্ড'}</span>
                    <Badge variant="outline" className="text-[10px] font-bold text-indigo-300 bg-indigo-950/60 border-indigo-500/40">
                      {questions.length}
                    </Badge>
                  </h2>
                  <p className="text-[10px] text-slate-400">
                    {language === 'en' ? 'Upvote top questions for instructor response' : 'শিক্ষার্থীরা আপভোট দিয়ে সেরা প্রশ্ন উপরে তুলুন'}
                  </p>
                </div>
              </div>

              <button
                onClick={handleRefreshQuestions}
                disabled={isRefreshing}
                title="Refresh Questions"
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin text-indigo-400' : ''}`} />
              </button>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-[11px] font-bold">
              {[
                { id: 'top', label: language === 'en' ? '🔥 Top' : '🔥 সেরা' },
                { id: 'all', label: language === 'en' ? 'All' : 'সকল' },
                { id: 'unanswered', label: language === 'en' ? 'Unanswered' : 'অনুত্তরিত' },
                { id: 'answered', label: language === 'en' ? 'Answered' : 'উত্তরপ্রাপ্ত' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as QuestionTab)}
                  className={`flex-1 py-1.5 rounded-lg transition text-center ${
                    activeTab === tab.id
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Questions Scrollable Feed */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-slate-800">
            {filteredQuestions.length === 0 ? (
              <div className="text-center py-12 px-4 space-y-2">
                <HelpCircle className="h-8 w-8 text-slate-600 mx-auto" />
                <p className="text-xs font-semibold text-slate-400">
                  {language === 'en' ? 'No questions in this filter yet.' : 'এই ফিল্টারে এখনো কোনো প্রশ্ন নেই।'}
                </p>
                <p className="text-[11px] text-slate-500">
                  {language === 'en' ? 'Be the first to ask the instructor below!' : 'নিচে আপনার প্রশ্নটি লিখে সবার আগে সাবমিট করুন!'}
                </p>
              </div>
            ) : (
              filteredQuestions.map((q) => {
                const isReplyingThis = replyInputId === q.id;

                return (
                  <div
                    key={q.id}
                    className={`rounded-xl p-3.5 border transition-all space-y-2.5 ${
                      q.isPinned
                        ? 'bg-amber-950/20 border-amber-500/40 ring-1 ring-amber-500/30'
                        : q.isAnswered
                        ? 'bg-slate-900/40 border-emerald-500/30'
                        : 'bg-slate-800/50 border-slate-700/60 hover:border-slate-600'
                    }`}
                  >
                    {/* Question Header: Student name & badges */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <img
                          src={q.studentAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${q.studentName}`}
                          alt={q.studentName}
                          className="h-6 w-6 rounded-full bg-slate-700 object-cover"
                        />
                        <div>
                          <div className="text-xs font-bold text-slate-200 leading-tight">
                            {q.studentName}
                          </div>
                          <div className="text-[9px] text-slate-500">
                            {new Date(q.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        {q.isPinned && (
                          <span className="flex items-center gap-1 text-[9px] font-extrabold px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            <Pin className="h-2.5 w-2.5" />
                            <span>{language === 'en' ? 'PINNED' : 'পিন'}</span>
                          </span>
                        )}

                        {q.isAnswered && (
                          <span className="flex items-center gap-1 text-[9px] font-extrabold px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            <CheckCircle2 className="h-2.5 w-2.5" />
                            <span>{language === 'en' ? 'ANSWERED' : 'উত্তর দেওয়া হয়েছে'}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Question Text */}
                    <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap font-medium">
                      {q.question}
                    </p>

                    {/* Instructor Reply Callout */}
                    {q.instructorReply && (
                      <div className="rounded-lg bg-indigo-950/40 border border-indigo-500/30 p-2.5 space-y-1">
                        <div className="text-[10px] font-black text-indigo-300 flex items-center gap-1">
                          <Sparkles className="h-3 w-3 text-indigo-400" />
                          <span>{language === 'en' ? 'Instructor Response:' : 'ইন্সট্রাক্টরের উত্তর:'}</span>
                        </div>
                        <p className="text-xs text-indigo-100 leading-normal">
                          {q.instructorReply}
                        </p>
                      </div>
                    )}

                    {/* Card Actions: Upvote & Instructor moderation buttons */}
                    <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
                      <button
                        onClick={() => handleToggleUpvote(q.id)}
                        className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-lg transition border ${
                          q.hasUpvoted
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-xs'
                            : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white hover:bg-slate-700'
                        }`}
                      >
                        <ThumbsUp className={`h-3.5 w-3.5 ${q.hasUpvoted ? 'fill-current text-amber-400' : ''}`} />
                        <span>{q.upvoteCount}</span>
                      </button>

                      {/* Instructor Controls */}
                      {isInstructorOrAdmin && (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleTogglePin(q.id)}
                            title={q.isPinned ? 'Unpin question' : 'Pin to top'}
                            className={`p-1.5 rounded-lg border text-xs transition ${
                              q.isPinned
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                            }`}
                          >
                            <Pin className="h-3 w-3" />
                          </button>

                          <button
                            onClick={() => handleToggleAnswer(q.id, q.isAnswered)}
                            className={`px-2 py-1 rounded-lg border text-[10px] font-bold transition ${
                              q.isAnswered
                                ? 'bg-slate-800 text-slate-400 border-slate-700'
                                : 'bg-emerald-600/20 text-emerald-300 border-emerald-500/30 hover:bg-emerald-600/30'
                            }`}
                          >
                            {q.isAnswered ? (language === 'en' ? 'Unmark' : 'বাতিল') : (language === 'en' ? 'Mark Answered' : 'উত্তর হয়েছে')}
                          </button>

                          <button
                            onClick={() => {
                              setReplyInputId(isReplyingThis ? null : q.id);
                              setReplyText(q.instructorReply || '');
                            }}
                            className="px-2 py-1 rounded-lg bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-bold hover:bg-indigo-600/30 transition"
                          >
                            {language === 'en' ? 'Reply' : 'রিপ্লাই'}
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Instructor Reply Input Dropdown */}
                    {isReplyingThis && (
                      <div className="pt-2 border-t border-slate-700/60 space-y-2">
                        <textarea
                          rows={2}
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder={language === 'en' ? 'Type instructor answer/notes...' : 'ইন্সট্রাক্টরের উত্তর লিখুন...'}
                          className="w-full text-xs rounded-lg bg-slate-950 border border-slate-700 p-2 text-white focus:outline-none focus:border-indigo-500"
                        />
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setReplyInputId(null)}
                            className="text-[10px] h-7 px-2.5 bg-slate-800 text-slate-300 border-slate-700"
                          >
                            {language === 'en' ? 'Cancel' : 'বাতিল'}
                          </Button>
                          <Button
                            size="sm"
                            disabled={isAnswering || !replyText.trim()}
                            onClick={() => handlePostReply(q.id)}
                            className="text-[10px] h-7 px-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold"
                          >
                            {isAnswering ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3 mr-1" />}
                            <span>{language === 'en' ? 'Save Response' : 'সংরক্ষণ করুন'}</span>
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Real-Time Question Submission Form Footer */}
          <div className="p-3 border-t border-slate-800 bg-slate-900/95 space-y-2">
            {errorMsg && (
              <div className="text-[11px] text-rose-400 bg-rose-950/40 border border-rose-800/60 px-2.5 py-1.5 rounded-lg">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmitQuestion} className="space-y-2">
              <div className="relative">
                <textarea
                  rows={2}
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  placeholder={
                    language === 'en'
                      ? 'Ask the instructor something live (min 5 chars)...'
                      : 'ইন্সট্রাক্টরকে লাইভ প্রশ্ন করুন (কমপক্ষে ৫ অক্ষর)...'
                  }
                  className="w-full text-xs rounded-xl bg-slate-950 border border-slate-800 p-2.5 pr-10 text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition resize-none"
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span>{questionText.length}/500</span>

                <Button
                  type="submit"
                  size="sm"
                  disabled={isSubmitting || questionText.trim().length < 5}
                  className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl px-4 py-1.5 flex items-center gap-1.5 shadow-md shadow-indigo-600/20"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Send className="h-3.5 w-3.5" />
                  )}
                  <span>{language === 'en' ? 'Submit Question' : 'প্রশ্ন পাঠান'}</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      </main>

      {/* ── Complete & Archive Live Class Modal (For Instructor) ── */}
      {archiveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-white font-bold text-base">
                <Film className="w-5 h-5 text-emerald-400" />
                <span>{language === 'en' ? 'Complete Live Class & Archive' : 'লাইভ ক্লাস সম্পন্ন ও মডিউলে সংরক্ষণ'}</span>
              </div>
              <button
                onClick={() => setArchiveModalOpen(false)}
                className="text-slate-400 hover:text-white transition"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {language === 'en'
                ? 'Marking this class as completed will automatically generate a recorded lecture inside the course module. Enrolled and absent students will receive an instant notification to watch the course recording.'
                : 'এই ক্লাসটি সম্পন্ন করলে স্বয়ংক্রিয়ভাবে সংশ্লিষ্ট কোর্স মডিউলে এর রেকর্ডিং তৈরি হয়ে যাবে। অনুপস্থিত শিক্ষার্থীসহ সকল এনরোল্ড শিক্ষার্থী তাৎক্ষণিক নোটিফিকেশন পাবেন এবং সুরক্ষিতভাবে রেকর্ডিং দেখতে পারবেন।'}
            </p>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-300">
                {language === 'en' ? 'Recording / Stream Embed URL:' : 'ক্লাস রেকর্ডিং / স্ট্রিম লিঙ্ক:'}
              </label>
              <input
                type="url"
                value={recordingInputUrl}
                onChange={(e) => setRecordingInputUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=... অথবা Bunny Stream URL"
                className="w-full text-xs rounded-xl bg-slate-950 border border-slate-800 p-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              <span className="text-[11px] text-slate-500 block">
                {language === 'en'
                  ? 'Default will use the live broadcast feed link.'
                  : 'খালি রাখলে বর্তমান লাইভ স্ট্রিম ফিড স্বয়ংক্রিয়ভাবে রেকর্ডিং হিসেবে ব্যবহৃত হবে।'}
              </span>
            </div>

            {archiveSuccessMsg && (
              <div className="p-3 bg-emerald-950/60 border border-emerald-800/80 rounded-xl text-emerald-300 text-xs font-semibold flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>{archiveSuccessMsg}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setArchiveModalOpen(false)}
                disabled={isArchiving}
                className="bg-slate-800 border-slate-700 text-slate-300 hover:text-white text-xs rounded-xl"
              >
                {language === 'en' ? 'Cancel' : 'বাতিল'}
              </Button>

              <Button
                size="sm"
                onClick={handleArchiveLiveSession}
                disabled={isArchiving}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl px-5 gap-1.5"
              >
                {isArchiving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>{language === 'en' ? 'Save to Module & Notify Students' : 'মডিউলে সংরক্ষণ ও নোটিফাই করুন'}</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
