'use client';

import React, { useState, useEffect, useTransition } from 'react';
import {
  Rocket,
  Github,
  Globe,
  FileCode2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  ExternalLink,
  Loader2,
  Award,
  ShieldCheck,
  ChevronRight,
  RotateCcw,
  BookOpen,
  Info,
  Check,
  X,
  AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { useLanguage } from '@/context/LanguageContext';
import {
  submitProjectAndEvaluateAction,
  getStudentProjectSubmissionAction,
} from '@/actions/project-actions';
import type { AutomatedEvaluationReport } from '@/lib/project-evaluator';

interface ProjectSubmissionPortalProps {
  courseId: string;
  lessonId: string;
  lessonTitle: string;
  projectInstructions?: string;
  maxMarks?: number;
  passMarks?: number;
  githubRequired?: boolean;
  liveUrlRequired?: boolean;
  onEvaluationComplete?: (score: number, passed: boolean) => void;
  onClose?: () => void;
}

export function ProjectSubmissionPortal({
  courseId,
  lessonId,
  lessonTitle,
  projectInstructions,
  maxMarks = 100,
  passMarks = 60,
  githubRequired = true,
  liveUrlRequired = true,
  onEvaluationComplete,
  onClose,
}: ProjectSubmissionPortalProps) {
  const { language } = useLanguage();
  const [activeTab, setActiveTab] = useState<'brief' | 'submit' | 'report'>('brief');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evalStep, setEvalStep] = useState(0);

  // Form states
  const [githubUrl, setGithubUrl] = useState('');
  const [liveUrl, setLiveUrl] = useState('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');

  // Status and evaluation state
  const [isLoading, setIsLoading] = useState(true);
  const [existingSubmission, setExistingSubmission] = useState<any>(null);
  const [evaluationReport, setEvaluationReport] = useState<AutomatedEvaluationReport | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load existing submission on mount
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setIsLoading(true);
      try {
        const res = await getStudentProjectSubmissionAction(courseId, lessonId);
        if (isMounted && res.submission) {
          setExistingSubmission(res.submission);
          setGithubUrl(res.submission.githubUrl || '');
          setLiveUrl(res.submission.liveUrl || '');
          setDescription(res.submission.description || '');
          setNotes(res.submission.notes || '');
          if (res.submission.automatedEvaluation) {
            setEvaluationReport(res.submission.automatedEvaluation);
            setActiveTab('report');
          }
        }
      } catch (err) {
        console.error('Failed to load submission:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, [courseId, lessonId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!githubUrl.trim()) {
      setErrorMessage(
        language === 'en'
          ? 'Please provide a valid GitHub repository URL.'
          : 'অনুগ্রহ করে সঠিক GitHub রিপোজিটরি লিংক দিন।'
      );
      return;
    }

    if (liveUrlRequired && !liveUrl.trim()) {
      setErrorMessage(
        language === 'en'
          ? 'Live deployment URL is required for project evaluation.'
          : 'প্রজেক্ট মূল্যায়নের জন্য লাইভ ডেপ্লয়মেন্ট লিংক আবশ্যক।'
      );
      return;
    }

    setIsEvaluating(true);
    setEvalStep(1);

    // Simulate animated step progression for rich UX feedback
    const stepTimer1 = setTimeout(() => setEvalStep(2), 700);
    const stepTimer2 = setTimeout(() => setEvalStep(3), 1400);

    try {
      const res = await submitProjectAndEvaluateAction({
        courseId,
        lessonId,
        githubUrl: githubUrl.trim(),
        liveUrl: liveUrl.trim(),
        description: description.trim(),
        notes: notes.trim(),
      });

      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);

      if (res.error) {
        setErrorMessage(res.error);
        setIsEvaluating(false);
        setEvalStep(0);
        return;
      }

      if (res.submission && res.evaluation) {
        setExistingSubmission(res.submission);
        setEvaluationReport(res.evaluation);
        setActiveTab('report');
        if (onEvaluationComplete) {
          onEvaluationComplete(res.evaluation.overallScore, res.evaluation.status === 'PASSED');
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Automated evaluation failed. Please try again.');
    } finally {
      setIsEvaluating(false);
      setEvalStep(0);
    }
  };

  const isPassed = evaluationReport ? evaluationReport.overallScore >= passMarks : false;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden max-w-4xl mx-auto my-4 transition-all">
      {/* ── Header Banner ── */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 h-40 w-40 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold mb-2 border border-indigo-400/20">
              <Rocket className="h-3.5 w-3.5" />
              <span>{language === 'en' ? 'Project Submission & Evaluation Portal' : 'প্রজেক্ট সাবমিশন ও স্বয়ংক্রিয় মূল্যায়ন পোর্টাল'}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              {lessonTitle}
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
              {language === 'en'
                ? 'Submit your GitHub code & live application. Our automated evaluation engine checks your repository structure, deployment status, and code architecture instantly.'
                : 'আপনার গিটহাব কোড ও লাইভ প্রজেক্ট লিংক জমা দিন। স্বয়ংক্রিয় সিস্টেম মুহূর্তেই রিপোজিটরি স্ট্রাকচার, ডিপ্লয়মেন্ট স্ট্যাটাস ও কোড আর্কিটেকচার পরীক্ষা করবে।'}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="bg-white/10 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/15 text-center">
              <span className="text-[10px] text-slate-300 block uppercase font-bold tracking-wider">
                {language === 'en' ? 'Pass Criteria' : 'পাস নম্বর'}
              </span>
              <span className="text-base font-black text-emerald-400">
                {passMarks} / {maxMarks}
              </span>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Segmented Navigation Tabs ── */}
      <div className="flex border-b border-slate-200 bg-slate-50/70 px-6 pt-3 gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('brief')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition ${
            activeTab === 'brief'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <BookOpen className="h-4 w-4" />
          <span>{language === 'en' ? 'Project Brief & Rubric' : 'প্রজেক্ট নির্দেশিকা ও রুব্রিক'}</span>
        </button>

        <button
          onClick={() => setActiveTab('submit')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition ${
            activeTab === 'submit'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Rocket className="h-4 w-4" />
          <span>{language === 'en' ? 'Submit Project' : 'প্রজেক্ট জমা দিন'}</span>
        </button>

        {evaluationReport && (
          <button
            onClick={() => setActiveTab('report')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition ${
              activeTab === 'report'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Award className="h-4 w-4" />
            <span>
              {language === 'en' ? 'Evaluation Report' : 'মূল্যায়ন ফলাফল'} ({evaluationReport.overallScore}/100)
            </span>
          </button>
        )}
      </div>

      {/* ── Tab Content ── */}
      <div className="p-6">
        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
            <Loader2 className="h-7 w-7 animate-spin text-indigo-600" />
            <span className="text-xs">{language === 'en' ? 'Loading project details...' : 'প্রজেক্ট লোড হচ্ছে...'}</span>
          </div>
        ) : (
          <>
            {/* TAB 1: Project Brief & Rubric */}
            {activeTab === 'brief' && (
              <div className="space-y-6">
                <div className="p-5 rounded-2xl bg-indigo-50/50 border border-indigo-100 space-y-3">
                  <h3 className="text-sm font-bold text-indigo-950 flex items-center gap-2">
                    <Info className="h-4 w-4 text-indigo-600" />
                    <span>{language === 'en' ? 'Project Objectives & Instructions' : 'প্রজেক্টের লক্ষ্য ও নির্দেশনাবলী'}</span>
                  </h3>
                  <p className="text-xs text-indigo-900/80 leading-relaxed whitespace-pre-line">
                    {projectInstructions ||
                      (language === 'en'
                        ? 'Build an end-to-end working software project implementing the patterns taught in this module. Your submission must be hosted on a public GitHub repository and deployed to a working production cloud service (Vercel, Netlify, Render, etc.).'
                        : 'এই মডিউলে শেখানো প্যাটার্নগুলো ব্যবহার করে একটি পূর্ণাঙ্গ কার্যকর সফটওয়্যার প্রজেক্ট তৈরি করুন। আপনার প্রজেক্টটি একটি পাবলিক গিটহাব রিপোজিটরিতে থাকতে হবে এবং লাইভ ক্লাউড হোস্টিংয়ে ডেপ্লয় করা থাকতে হবে।')}
                  </p>
                </div>

                {/* Rubric Breakdown Grid */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                    {language === 'en' ? 'Automated Evaluation Criteria (100 Marks)' : 'স্বয়ংক্রিয় মূল্যায়ন মানদণ্ড (১০০ নম্বর)'}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                          <Github className="h-4 w-4 text-slate-700" />
                          <span>{language === 'en' ? '1. Git & GitHub Architecture' : '১. গিট ও রিপোজিটরি স্ট্রাকচার'}</span>
                        </span>
                        <Badge className="bg-indigo-50 text-indigo-700 font-bold text-[10px]">25 Marks</Badge>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        {language === 'en'
                          ? 'Valid public repository, commit hygiene, and standard branch structure.'
                          : 'সঠিক পাবলিক রিপোজিটরি, নিয়মতান্ত্রিক গিট কমিট এবং ব্র্যাঞ্চিং স্ট্রাকচার।'}
                      </p>
                    </div>

                    <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                          <Globe className="h-4 w-4 text-emerald-600" />
                          <span>{language === 'en' ? '2. Live Production Deployment' : '২. লাইভ ক্লাউড ডেপ্লয়মেন্ট'}</span>
                        </span>
                        <Badge className="bg-emerald-50 text-emerald-700 font-bold text-[10px]">25 Marks</Badge>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        {language === 'en'
                          ? 'Accessible HTTPS endpoint, zero console crash on launch, and fast load.'
                          : 'কার্যকর HTTPS লাইভ লিংক এবং পাবলিক ক্লাউড এন্ডপয়েন্ট সক্রিয়তা।'}
                      </p>
                    </div>

                    <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                          <FileCode2 className="h-4 w-4 text-purple-600" />
                          <span>{language === 'en' ? '3. Code Quality & Modularity' : '৩. কোড কোয়ালিটি ও আর্কিটেকচার'}</span>
                        </span>
                        <Badge className="bg-purple-50 text-purple-700 font-bold text-[10px]">25 Marks</Badge>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        {language === 'en'
                          ? 'Component hierarchy, state management, modular APIs, and modern libraries.'
                          : 'কম্পোনেন্ট হায়ারার্কি, স্টেট ম্যানেজমেন্ট ও আধুনিক ফ্রেমওয়ার্ক কনভেনশন।'}
                      </p>
                    </div>

                    <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                          <ShieldCheck className="h-4 w-4 text-amber-600" />
                          <span>{language === 'en' ? '4. Readme & Engineering Specs' : '৪. ডকুমেন্টেশন ও রিডমি গাইড'}</span>
                        </span>
                        <Badge className="bg-amber-50 text-amber-700 font-bold text-[10px]">25 Marks</Badge>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        {language === 'en'
                          ? 'Detailed README.md with setup instructions, features list, and environment keys.'
                          : 'সেটআপ গাইড, ফিচার তালিকা এবং পরিবেশ ভেরিয়েবলসহ বিস্তারিত README.md।'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button
                    onClick={() => setActiveTab('submit')}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl px-5 py-2.5 flex items-center gap-2 shadow-sm"
                  >
                    <span>{language === 'en' ? 'Proceed to Submission' : 'প্রজেক্ট জমার ফর্মে যান'}</span>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* TAB 2: Submission Form */}
            {activeTab === 'submit' && (
              <form onSubmit={handleSubmit} className="space-y-5">
                {errorMessage && (
                  <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Github className="h-3.5 w-3.5 text-slate-700" />
                        <span>{language === 'en' ? 'GitHub Repository URL *' : 'গিটহাব রিপোজিটরি লিংক *'}</span>
                      </span>
                      <span className="text-[10px] text-indigo-600 font-normal">Public repo</span>
                    </label>
                    <input
                      type="url"
                      required
                      value={githubUrl}
                      onChange={(e) => setGithubUrl(e.target.value)}
                      placeholder="https://github.com/username/project-repo"
                      className="w-full text-xs rounded-xl border border-slate-200 px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Globe className="h-3.5 w-3.5 text-emerald-600" />
                        <span>{language === 'en' ? 'Live Deployment URL *' : 'লাইভ ডেপ্লয়মেন্ট লিংক *'}</span>
                      </span>
                      <span className="text-[10px] text-emerald-600 font-normal">HTTPS live</span>
                    </label>
                    <input
                      type="url"
                      required={liveUrlRequired}
                      value={liveUrl}
                      onChange={(e) => setLiveUrl(e.target.value)}
                      placeholder="https://my-project.vercel.app"
                      className="w-full text-xs rounded-xl border border-slate-200 px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <FileCode2 className="h-3.5 w-3.5 text-purple-600" />
                    <span>{language === 'en' ? 'Project Description & Architecture Notes *' : 'প্রজেক্ট বিবরণ ও প্রযুক্তিগত নোট *'}</span>
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={
                      language === 'en'
                        ? 'Briefly describe your project, key features implemented, technologies used (e.g. Next.js, MongoDB, Tailwind), and how to test it...'
                        : 'প্রজেক্টের মূল ফিচারসমূহ, ব্যবহৃত প্রযুক্তি (যেমন: Next.js, MongoDB, Tailwind) এবং কীভাবে টেস্ট করতে হবে তা সংক্ষেপে লিখুন...'
                    }
                    className="w-full text-xs rounded-xl border border-slate-200 p-3.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
                  />
                  <p className="text-[10px] text-slate-400">
                    {language === 'en'
                      ? 'Tip: Listing your tech stack and key APIs helps our automated engine analyze architecture points.'
                      : 'টিপস: টেক স্ট্যাক ও ফিচার বিস্তারিত লিখলে স্বয়ংক্রিয় সিস্টেম আর্কিটেকচার মূল্যায়নে সর্বোচ্চ নম্বর দিতে পারে।'}
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    {language === 'en' ? 'Additional Notes for Instructor (Optional)' : 'ইন্সট্রাক্টরের জন্য অতিরিক্ত মন্তব্য (ঐচ্ছিক)'}
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder={
                      language === 'en'
                        ? 'Test credentials (if protected), known edge cases, or special highlights'
                        : 'টেস্ট লগইন তথ্য (যদি থাকে) অথবা বিশেষ কোনো তথ্যের উল্লেখ'
                    }
                    className="w-full text-xs rounded-xl border border-slate-200 px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
                  />
                </div>

                {/* Submit button with animated evaluation feedback */}
                <div className="pt-3 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500 flex items-center gap-1">
                    <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                    <span>{language === 'en' ? 'Checked by automated AI evaluation' : 'স্বয়ংক্রিয় এআই সিস্টেম দ্বারা মূল্যায়িত হবে'}</span>
                  </span>

                  <Button
                    type="submit"
                    disabled={isEvaluating}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl px-6 py-2.5 flex items-center gap-2 shadow-md transition"
                  >
                    {isEvaluating ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>
                          {evalStep === 1
                            ? (language === 'en' ? 'Verifying GitHub repository...' : 'গিটহাব রিপোজিটরি যাচাই হচ্ছে...')
                            : evalStep === 2
                            ? (language === 'en' ? 'Testing live deployment endpoint...' : 'লাইভ ডেপ্লয়মেন্ট এন্ডপয়েন্ট চেক হচ্ছে...')
                            : (language === 'en' ? 'Generating evaluation report...' : 'মূল্যায়ন রিপোর্ট তৈরি হচ্ছে...')}
                        </span>
                      </>
                    ) : (
                      <>
                        <Rocket className="h-4 w-4" />
                        <span>{language === 'en' ? 'Submit & Run Automated Evaluation' : 'জমা দিন ও স্বয়ংক্রিয় মূল্যায়ন চালান'}</span>
                      </>
                    )}
                  </Button>
                </div>
              </form>
            )}

            {/* TAB 3: Evaluation Report */}
            {activeTab === 'report' && evaluationReport && (
              <div className="space-y-6">
                {/* Result Hero Card */}
                <div
                  className={`p-6 rounded-2xl border text-white relative overflow-hidden shadow-md ${
                    isPassed
                      ? 'bg-gradient-to-br from-emerald-600 via-teal-700 to-emerald-800 border-emerald-500'
                      : 'bg-gradient-to-br from-amber-600 via-orange-700 to-amber-800 border-amber-500'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold mb-2">
                        {isPassed ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}
                        <span>
                          {isPassed
                            ? (language === 'en' ? 'PASSED & APPROVED' : 'উত্তীর্ণ ও অনুমোদিত')
                            : (language === 'en' ? 'REVISIONS REQUIRED' : 'সংশোধন প্রয়োজন')}
                        </span>
                      </div>
                      <h3 className="text-xl font-black">
                        {isPassed
                          ? (language === 'en' ? 'Congratulations! Project Passed Evaluation' : 'অভিনন্দন! আপনার প্রজেক্ট সফলভাবে উত্তীর্ণ হয়েছে')
                          : (language === 'en' ? 'Project Evaluation Needs Attention' : 'প্রজেক্টটিতে কিছু প্রয়োজনীয় সংস্কার প্রয়োজন')}
                      </h3>
                      <p className="text-xs text-white/90 mt-1.5 max-w-xl leading-relaxed">
                        {evaluationReport.feedbackSummary}
                      </p>
                    </div>

                    <div className="bg-white text-slate-900 rounded-2xl p-4 text-center shrink-0 shadow-lg min-w-[120px]">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                        {language === 'en' ? 'Total Score' : 'প্রাপ্ত নম্বর'}
                      </span>
                      <span className={`text-3xl font-black ${isPassed ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {evaluationReport.overallScore}
                      </span>
                      <span className="text-xs font-bold text-slate-400"> / {maxMarks}</span>
                    </div>
                  </div>
                </div>

                {/* Submitted Links Quick View */}
                <div className="flex flex-wrap items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                  <span className="font-bold text-slate-700">{language === 'en' ? 'Submitted Links:' : 'জমা দেওয়া লিংকসমূহ:'}</span>
                  {githubUrl && (
                    <a
                      href={githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-semibold text-indigo-600 hover:underline bg-white px-3 py-1.5 rounded-lg border border-slate-200"
                    >
                      <Github className="h-3.5 w-3.5" />
                      <span>{language === 'en' ? 'Repository Code' : 'রিপোজিটরি কোড'}</span>
                      <ExternalLink className="h-3 w-3 ml-0.5 text-slate-400" />
                    </a>
                  )}
                  {liveUrl && (
                    <a
                      href={liveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-semibold text-emerald-600 hover:underline bg-white px-3 py-1.5 rounded-lg border border-slate-200"
                    >
                      <Globe className="h-3.5 w-3.5" />
                      <span>{language === 'en' ? 'Live Application' : 'লাইভ অ্যাপ্লিকেশন'}</span>
                      <ExternalLink className="h-3 w-3 ml-0.5 text-slate-400" />
                    </a>
                  )}
                </div>

                {/* Automated Check Breakdown */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    {language === 'en' ? 'Detailed Automated Evaluation Checks' : 'স্বয়ংক্রিয় মূল্যায়নের বিস্তারিত ফলাফল'}
                  </h4>

                  <div className="space-y-2.5">
                    {evaluationReport.checks.map((check, idx) => (
                      <div
                        key={idx}
                        className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                          check.status === 'PASSED'
                            ? 'bg-emerald-50/40 border-emerald-200'
                            : check.status === 'WARNING'
                            ? 'bg-amber-50/40 border-amber-200'
                            : 'bg-rose-50/40 border-rose-200'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 shrink-0">
                            {check.status === 'PASSED' ? (
                              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                            ) : check.status === 'WARNING' ? (
                              <AlertTriangle className="h-4 w-4 text-amber-600" />
                            ) : (
                              <X className="h-4 w-4 text-rose-600" />
                            )}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-800">{check.name}</p>
                            <p className="text-[11px] text-slate-600 mt-0.5">{check.feedback}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                          <span className="text-xs font-black text-slate-800">
                            {check.score} / {check.maxScore}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Strengths & Improvements */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {evaluationReport.strengths && evaluationReport.strengths.length > 0 && (
                    <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-100 space-y-2">
                      <h5 className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                        <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                        <span>{language === 'en' ? 'Key Strengths' : 'প্রধান শক্তিমত্তা'}</span>
                      </h5>
                      <ul className="space-y-1 text-[11px] text-emerald-800">
                        {evaluationReport.strengths.map((s, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <Check className="h-3 w-3 text-emerald-600 mt-0.5 shrink-0" />
                            <span>{s}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {evaluationReport.improvements && evaluationReport.improvements.length > 0 && (
                    <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-100 space-y-2">
                      <h5 className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                        <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
                        <span>{language === 'en' ? 'Recommended Improvements' : 'উন্নতির সুযোগ'}</span>
                      </h5>
                      <ul className="space-y-1 text-[11px] text-amber-800">
                        {evaluationReport.improvements.map((imp, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <span className="text-amber-600 font-bold">•</span>
                            <span>{imp}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                  <Button
                    variant="outline"
                    onClick={() => setActiveTab('submit')}
                    className="text-xs border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl flex items-center gap-1.5"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>{language === 'en' ? 'Resubmit Project' : 'পুনরায় জমা দিন'}</span>
                  </Button>

                  {onClose && (
                    <Button
                      onClick={onClose}
                      className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl px-5 py-2"
                    >
                      {language === 'en' ? 'Done & Return' : 'সম্পন্ন ও ফিরে যান'}
                    </Button>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default ProjectSubmissionPortal;
