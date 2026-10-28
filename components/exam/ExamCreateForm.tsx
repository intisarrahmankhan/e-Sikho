'use client';

import AssessmentPublishingFields from './AssessmentPublishingFields';
import { AssessmentAudience, emptyAudience } from '@/lib/assessment-policy';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';
import { LatexRenderer, LatexFormulaToolbar } from './LatexRenderer';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import {
  Plus,
  Trash2,
  Sparkles,
  Eye,
  CheckCircle,
  HelpCircle,
  Layers,
  Loader2,
  FileQuestion,
  Code2,
  CheckSquare,
  Type,
  ToggleLeft,
  RotateCcw,
} from 'lucide-react';
import { createExamAction } from '@/actions/exam';
import { ExamQuestionType } from '@/models/Exam';

interface TestCaseDraft {
  input: string;
  expectedOutput: string;
  isHidden?: boolean;
}

interface QuestionDraft {
  type: ExamQuestionType;
  question: string;
  options: string[];
  correctAnswer: number;
  acceptedAnswers: string[];
  codeTemplate: string;
  codeLanguage: string;
  testCases: TestCaseDraft[];
  explanation: string;
  marks: number;
}

export function ExamCreateForm({ courses = [], canCreateGlobal = false }: { courses?: { id: string; title: string; status?: string }[]; canCreateGlobal?: boolean }) {
  const router = useRouter();
  const { language } = useLanguage();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Computer Science');
  const [courseId, setCourseId] = useState(courses[0]?.id || 'none');
  const [scope, setScope] = useState<'COURSE' | 'GLOBAL'>('COURSE');
  const [audience, setAudience] = useState<AssessmentAudience>(emptyAudience);
  const [duration, setDuration] = useState(25);
  const [passMarks, setPassMarks] = useState(1);
  const [hasNegativeMarking, setHasNegativeMarking] = useState(false);
  const [negativeMarkingValue, setNegativeMarkingValue] = useState(0.25);
  const [maxAttempts, setMaxAttempts] = useState(3);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [questions, setQuestions] = useState<QuestionDraft[]>([{ type: 'MCQ', question: '', options: ['', '', '', ''], correctAnswer: 0, acceptedAnswers: [], codeTemplate: '', codeLanguage: 'javascript', testCases: [], explanation: '', marks: 1 }]);

  const handleAddQuestion = () => {
    const newIdx = questions.length;
    setQuestions((prev) => [
      ...prev,
      {
        type: 'MCQ',
        question: '',
        options: ['', '', '', ''],
        correctAnswer: 0,
        acceptedAnswers: [''],
        codeTemplate: 'function solve(input) {\n  // আপনার কোড এখানে লিখুন\n}',
        codeLanguage: 'javascript',
        testCases: [{ input: '', expectedOutput: '', isHidden: false }],
        explanation: '',
        marks: 1,
      },
    ]);

    setTimeout(() => {
      const el = document.getElementById(`question-card-${newIdx}`) || document.getElementById('questions-bottom');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 80);
  };

  const handleRemoveQuestion = (idx: number) => {
    if (questions.length <= 1) {
      alert('কমপক্ষে ১টি প্রশ্ন থাকতে হবে।');
      return;
    }
    setQuestions((prev) => prev.filter((_, i) => i !== idx));
  };



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!title.trim()) {
      setErrorMsg('পরীক্ষার শিরোনাম পূরণ করুন।');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await createExamAction({
        title,
        scope,
        audience,
        description,
        category,
        courseId: scope === 'COURSE' && courseId !== 'none' ? courseId : undefined,
        duration: Number(duration),
        passMarks: Number(passMarks),
        hasNegativeMarking,
        negativeMarkingValue: Number(negativeMarkingValue),
        maxAttempts: Number(maxAttempts) || 3,
        questions,
      });

      if (res.error) {
        setErrorMsg(res.error);
        setIsSubmitting(false);
      } else {
        router.push('/exams');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'পরীক্ষা তৈরিতে কোনো সমস্যা হয়েছে।');
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl mx-auto pb-12">
        <AssessmentPublishingFields kind="EXAM" courses={courses} canCreateGlobal={canCreateGlobal} scope={scope} onScopeChange={setScope} courseId={courseId} onCourseChange={setCourseId} audience={audience} onAudienceChange={setAudience} />

      {/* Basic Settings Card */}
      <Card className="border border-slate-200 rounded-2xl bg-white shadow-sm overflow-hidden">
        <CardHeader className="p-6 pb-4 border-b border-slate-100 bg-slate-50/50">
          <CardTitle className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
            <FileQuestion className="w-5 h-5 text-primary-600" />
            <span>
              {language === 'en'
                ? 'Multi-Format Exam & Quiz Builder (MCQ, Short-Answer & Code)'
                : 'মাল্টি-ফরম্যাট পরীক্ষা ও কুইজ বিল্ডার (MCQ, Short-Answer & Code)'}
            </span>
          </CardTitle>
          <p className="text-xs text-slate-500 mt-1">
            {language === 'en'
              ? 'Create exams with multiple choice (MCQ), short answer, and automated coding test cases.'
              : 'বহুনির্বাচনী (MCQ), সংক্ষিপ্ত উত্তর এবং কোডিং টেস্ট কেস সম্বলিত পরীক্ষা তৈরি করুন।'}
          </p>
        </CardHeader>

        <CardContent className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold">
              {errorMsg}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">পরীক্ষার শিরোনাম *</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="যেমন: কম্পিউটার সায়েন্স ও ডেটা স্ট্রাকচার পূর্ণাঙ্গ মডেল টেস্ট"
              className="rounded-xl border-slate-200 text-xs sm:text-sm"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">সংক্ষিপ্ত বিবরণ (ঐচ্ছিক)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="পরীক্ষার নিয়মাবলী ও বিষয়ভিত্তিক নির্দেশনাসমূহ..."
              className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800 outline-none focus:border-primary-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">ক্যাটাগরি</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800 outline-none bg-white focus:border-primary-500"
              >
                <option value="Computer Science">Computer Science & Algorithms</option>
                <option value="Mathematics">Mathematics & Calculus</option>
                <option value="Physics">Physics</option>
                <option value="Web Development">Web Development</option>
                <option value="General">সাধারণ জ্ঞান ও প্রস্তুতি</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">সময়সীমা (মিনিট)</label>
              <Input
                type="number"
                min={1}
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="rounded-xl border-slate-200 text-xs"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">পাস মার্ক</label>
              <Input
                type="number"
                min={1}
                value={passMarks}
                onChange={(e) => setPassMarks(Number(e.target.value))}
                className="rounded-xl border-slate-200 text-xs"
                required
              />
            </div>
          </div>

          {/* Configurable Fractional Negative Marking Section */}
          <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/40 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="negativeMarkingToggle"
                  checked={hasNegativeMarking}
                  onChange={(e) => setHasNegativeMarking(e.target.checked)}
                  className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 border-slate-300 cursor-pointer"
                />
                <label
                  htmlFor="negativeMarkingToggle"
                  className="text-xs font-bold text-slate-800 cursor-pointer flex items-center gap-1.5"
                >
                  <span>নেগেটিভ মার্কিং সক্রিয় করুন (Fractional Negative Marking Engine)</span>
                  {hasNegativeMarking && (
                    <Badge className="bg-rose-600 text-white text-[10px]">সক্রিয় (-{negativeMarkingValue})</Badge>
                  )}
                </label>
              </div>
            </div>

            {hasNegativeMarking && (
              <div className="pt-2 border-t border-rose-200/80 space-y-3 animate-in fade-in duration-200">
                <div className="space-y-1.5">
                  <span className="text-[11px] font-semibold text-slate-700 block">
                    প্রতিটি ভুল উত্তরের জন্য কর্তনযোগ্য নম্বর (Negative Mark per Wrong Answer):
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    {[0.25, 0.33, 0.5, 1.0].map((rate) => (
                      <button
                        key={rate}
                        type="button"
                        onClick={() => setNegativeMarkingValue(rate)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
                          negativeMarkingValue === rate
                            ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                            : 'bg-white text-slate-700 border-rose-200 hover:bg-rose-50'
                        }`}
                      >
                        -{rate} ({rate === 0.25 ? '২৫%' : rate === 0.33 ? '৩৩%' : rate === 0.5 ? '৫০%' : '১০০%'})
                      </button>
                    ))}
                    <div className="flex items-center gap-1.5 ml-2">
                      <span className="text-xs text-slate-500 font-semibold">কাস্টম:</span>
                      <Input
                        type="number"
                        step="0.05"
                        min="0"
                        max="5"
                        value={negativeMarkingValue}
                        onChange={(e) => setNegativeMarkingValue(Number(e.target.value))}
                        className="w-20 rounded-lg border-rose-200 text-xs font-bold text-rose-700 bg-white"
                      />
                    </div>
                  </div>
                </div>

                <p className="text-[11px] text-rose-800">
                  শিক্ষার্থী ভুল উত্তর দিলে নির্ধারিত নম্বর কাটা যাবে। তবে প্রশ্ন উত্তর না দিয়ে এড়িয়ে গেলে (Skipped) কোনো নম্বর কাটা যাবে না।
                </p>
              </div>
            )}
          </div>

          {/* Exam Retake Policy (Maximum Attempts Cap) */}
          <div className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/40 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-indigo-600" />
                <span className="text-xs font-bold text-slate-800">
                  পরীক্ষা পুনরায় দেওয়ার নীতি ও প্রচেষ্টার সীমা (Exam Retake Policy & Attempts Cap)
                </span>
              </div>
              <Badge className="bg-indigo-600 text-white text-[10px]">
                সর্বোচ্চ {maxAttempts} বার প্রচেষ্টা
              </Badge>
            </div>

            <div className="space-y-2 pt-1 border-t border-indigo-200/80">
              <span className="text-[11px] font-semibold text-slate-700 block">
                একজন শিক্ষার্থী এই পরীক্ষায় কতবার অংশ নিতে পারবে (Maximum Allowed Attempts):
              </span>
              <div className="flex flex-wrap items-center gap-2">
                {[1, 2, 3, 5, 10].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setMaxAttempts(num)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
                      maxAttempts === num
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-white text-slate-700 border-indigo-200 hover:bg-indigo-50'
                    }`}
                  >
                    {num === 1
                      ? '১ বার (Strict - No Retakes)'
                      : num === 3
                      ? '৩ বার (Standard Default)'
                      : `${num} বার`}
                  </button>
                ))}
                <div className="flex items-center gap-1.5 ml-2">
                  <span className="text-xs text-slate-500 font-semibold">কাস্টম:</span>
                  <Input
                    type="number"
                    min="1"
                    max="50"
                    value={maxAttempts}
                    onChange={(e) => setMaxAttempts(Math.max(1, Number(e.target.value)))}
                    className="w-20 rounded-lg border-indigo-200 text-xs font-bold text-indigo-700 bg-white"
                  />
                </div>
              </div>
              <p className="text-[11px] text-indigo-800">
                শিক্ষার্থী নির্ধারিত সীমার (ডিফল্ট: ৩ বার) বেশি প্রচেষ্টা করতে পারবে না। সীমা পূর্ণ হলে স্বয়ংক্রিয়ভাবে নতুন সাবমিশন ব্লক করা হবে।
              </p>
            </div>
          </div>


        </CardContent>
      </Card>

      {/* Questions Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Layers className="w-5 h-5 text-primary-600" />
            <span>প্রশ্নাবলি ({questions.length} টি)</span>
          </h3>

          <button
            type="button"
            id="add-new-question-btn"
            data-testid="add-new-question-btn"
            onClick={handleAddQuestion}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-primary-300 text-primary-700 bg-primary-50/70 hover:bg-primary-100 text-xs font-bold transition shadow-xs cursor-pointer active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{language === 'en' ? 'Add New Question' : 'নতুন প্রশ্ন যোগ করুন'}</span>
          </button>
        </div>

        {questions.map((q, qIdx) => (
          <Card
            key={qIdx}
            id={`question-card-${qIdx}`}
            className="border border-slate-200 rounded-2xl bg-white shadow-2xs overflow-hidden scroll-mt-24 transition-all"
          >
            <CardHeader className="p-4 sm:p-5 pb-3 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Badge className="bg-slate-800 text-white text-xs font-bold px-2.5 py-0.5">
                  প্রশ্ন {qIdx + 1}
                </Badge>

                {/* Question Format Selector Tabs */}
                <div className="inline-flex rounded-lg bg-white p-0.5 border border-slate-200 shadow-2xs text-[11px] font-semibold">
                  <button
                    type="button"
                    onClick={() => {
                      setQuestions((prev) => {
                        const copy = [...prev];
                        copy[qIdx].type = 'MCQ';
                        if (copy[qIdx].options.length < 2) {
                          copy[qIdx].options = ['', '', '', ''];
                        }
                        return copy;
                      });
                    }}
                    className={`px-2.5 py-1 rounded-md transition flex items-center gap-1 ${
                      q.type === 'MCQ'
                        ? 'bg-primary-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <CheckSquare className="w-3 h-3" />
                    <span>MCQ</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setQuestions((prev) => {
                        const copy = [...prev];
                        copy[qIdx].type = 'SHORT_ANSWER';
                        if (!copy[qIdx].acceptedAnswers.length) {
                          copy[qIdx].acceptedAnswers = [''];
                        }
                        return copy;
                      });
                    }}
                    className={`px-2.5 py-1 rounded-md transition flex items-center gap-1 ${
                      q.type === 'SHORT_ANSWER'
                        ? 'bg-primary-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Type className="w-3 h-3" />
                    <span>সংক্ষিপ্ত উত্তর</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setQuestions((prev) => {
                        const copy = [...prev];
                        copy[qIdx].type = 'CODE';
                        if (!copy[qIdx].codeTemplate) {
                          copy[qIdx].codeTemplate = 'function solve(input) {\n  // সমাধান লিখুন\n}';
                        }
                        if (!copy[qIdx].testCases.length) {
                          copy[qIdx].testCases = [{ input: '', expectedOutput: '', isHidden: false }];
                        }
                        return copy;
                      });
                    }}
                    className={`px-2.5 py-1 rounded-md transition flex items-center gap-1 ${
                      q.type === 'CODE'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-indigo-700 hover:text-indigo-900'
                    }`}
                  >
                    <Code2 className="w-3 h-3" />
                    <span>কোডিং (Code)</span>
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">


                <div className="flex items-center gap-1.5 text-xs text-slate-600">
                  <span className="font-semibold">মার্কস:</span>
                  <input
                    type="number"
                    min={1}
                    value={q.marks || 1}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setQuestions((prev) => {
                        const copy = [...prev];
                        copy[qIdx].marks = val;
                        return copy;
                      });
                    }}
                    className="w-12 rounded-md border border-slate-200 px-1.5 py-0.5 text-center text-xs font-bold"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => handleRemoveQuestion(qIdx)}
                  className="text-slate-400 hover:text-rose-600 p-1 rounded-lg transition"
                  title="প্রশ্ন মুছে ফেলুন"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </CardHeader>

            <CardContent className="p-5 sm:p-6 space-y-5">
              {/* Question Text Area */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span>প্রশ্নের বিষয়বস্তু (বাংলা + LaTeX $..$ বা $$..$$) *</span>
                </div>
                <textarea
                  value={q.question}
                  onChange={(e) => {
                    const val = e.target.value;
                    setQuestions((prev) => {
                      const copy = [...prev];
                      copy[qIdx].question = val;
                      return copy;
                    });
                  }}
                  rows={3}
                  placeholder="যেমন: মাস্টার থিওরেম অনুসারে টাইম কমপ্লেক্সিটি কত? অথবা একটি সমাধান ফাংশন লিখুন..."
                  className="w-full rounded-xl border border-slate-200 p-3 text-xs sm:text-sm font-mono text-slate-800 outline-none focus:border-primary-500"
                  required
                />

                {/* Math Shortcut Toolbar */}
                <LatexFormulaToolbar
                  onInsert={(formula) => {
                    setQuestions((prev) => {
                      const copy = [...prev];
                      copy[qIdx].question = (copy[qIdx].question || '') + ' ' + formula;
                      return copy;
                    });
                  }}
                />

                {/* Live Question Preview */}
                {q.question.trim() && (
                  <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 space-y-1">
                    <span className="text-[10px] uppercase tracking-wider font-bold text-emerald-700 flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      লাইভ প্রিভিউ:
                    </span>
                    <div className="text-xs sm:text-sm text-slate-900">
                      <LatexRenderer content={q.question} />
                    </div>
                  </div>
                )}
              </div>

              {/* FORMAT 1: MCQ */}
              {q.type === 'MCQ' && (
                <div className="space-y-3">
                  <span className="text-xs font-bold text-slate-700 block">
                    MCQ অপশনসমূহ ও সঠিক উত্তর নির্বাচন করুন (LaTeX $..$ সমর্থিত):
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {q.options.map((opt, optIdx) => {
                      const isSelected = q.correctAnswer === optIdx;
                      const letter = String.fromCharCode(65 + optIdx);

                      return (
                        <div
                          key={optIdx}
                          className={`p-3 rounded-xl border transition space-y-2 ${
                            isSelected
                              ? 'bg-emerald-50/60 border-emerald-400'
                              : 'bg-white border-slate-200'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="radio"
                                name={`correct-${qIdx}`}
                                checked={isSelected}
                                onChange={() => {
                                  setQuestions((prev) => {
                                    const copy = [...prev];
                                    copy[qIdx].correctAnswer = optIdx;
                                    return copy;
                                  });
                                }}
                                className="text-emerald-600 focus:ring-emerald-500"
                              />
                              <span className="text-xs font-bold text-slate-700">
                                অপশন {letter} {isSelected && '(সঠিক উত্তর)'}
                              </span>
                            </label>
                          </div>

                          <Input
                            value={opt}
                            onChange={(e) => {
                              const val = e.target.value;
                              setQuestions((prev) => {
                                const copy = [...prev];
                                copy[qIdx].options[optIdx] = val;
                                return copy;
                              });
                            }}
                            placeholder={`অপশন ${letter} এর মান (যেমন $x^2$)`}
                            className="text-xs rounded-lg border-slate-200 font-mono"
                            required
                          />

                          {opt.trim() && (
                            <div className="text-xs text-slate-800 bg-slate-50 p-1.5 rounded-md border border-slate-100 flex items-center gap-1.5">
                              <span className="text-[10px] text-slate-400 font-mono">প্রিভিউ:</span>
                              <LatexRenderer content={opt} inline />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* FORMAT 2: SHORT_ANSWER */}
              {q.type === 'SHORT_ANSWER' && (
                <div className="space-y-3 bg-amber-50/40 p-4 rounded-xl border border-amber-200">
                  <span className="text-xs font-bold text-amber-900 block">
                    গ্রহণযোগ্য সঠিক উত্তরসমূহ (Accepted Answers - কমা দিয়ে একাধিক সমার্থক শব্দ লিখুন):
                  </span>
                  <Input
                    value={(q.acceptedAnswers || []).join(', ')}
                    onChange={(e) => {
                      const arr = e.target.value.split(',').map((s) => s.trim());
                      setQuestions((prev) => {
                        const copy = [...prev];
                        copy[qIdx].acceptedAnswers = arr;
                        return copy;
                      });
                    }}
                    placeholder="যেমন: Queue, কিউ, সারিবদ্ধ তালিকা"
                    className="text-xs rounded-xl bg-white border-amber-200 text-slate-800"
                    required
                  />
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <span className="text-[11px] font-semibold text-amber-800 mr-1">শনাক্তকৃত উত্তর:</span>
                    {(q.acceptedAnswers || []).filter(Boolean).map((ans, aIdx) => (
                      <Badge key={aIdx} className="bg-amber-100 text-amber-900 text-[10px] border border-amber-300">
                        {ans}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-[11px] text-amber-800">
                    ইন্টেলিজেন্ট অটো-গ্রেডার শিক্ষার্থীর টেক্সট থেকে অপ্রয়োজনীয় স্পেস ও বড়/ছোট হাতের অক্ষরের ভিন্নতা (Case-insensitivity) উপেক্ষা করে স্বয়ংক্রিয় নম্বর প্রদান করবে।
                  </p>
                </div>
              )}

              {/* FORMAT 4: CODE EVALUATION */}
              {q.type === 'CODE' && (
                <div className="space-y-4 bg-indigo-50/40 p-4 rounded-xl border border-indigo-200">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                      <Code2 className="w-4 h-4 text-indigo-600" />
                      <span>কোডিং সমস্যা ও স্বয়ংক্রিয় টেস্ট-কেস যাচাইকরণ (Auto-Judge)</span>
                    </span>
                    <Badge className="bg-indigo-600 text-white text-[10px]">JavaScript Sandbox</Badge>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">
                      স্টার্টার কোড টেমপ্লেট (Starter Code Template):
                    </label>
                    <textarea
                      value={q.codeTemplate}
                      onChange={(e) => {
                        const val = e.target.value;
                        setQuestions((prev) => {
                          const copy = [...prev];
                          copy[qIdx].codeTemplate = val;
                          return copy;
                        });
                      }}
                      rows={5}
                      className="w-full rounded-xl border border-slate-300 bg-slate-900 text-emerald-400 font-mono text-xs p-3 outline-none focus:ring-1 focus:ring-indigo-500"
                      placeholder="function solve(input) { ... }"
                    />
                  </div>

                  {/* Test Cases Editor */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800">
                        ভেরিফিকেশন টেস্ট-কেসসমূহ ({q.testCases.length} টি):
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setQuestions((prev) => {
                            const copy = [...prev];
                            copy[qIdx].testCases.push({ input: '', expectedOutput: '', isHidden: false });
                            return copy;
                          });
                        }}
                        className="text-[11px] font-bold text-indigo-700 hover:text-indigo-900 flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>টেস্ট-কেস যোগ করুন</span>
                      </button>
                    </div>

                    <div className="space-y-2.5">
                      {q.testCases.map((tc, tcIdx) => (
                        <div
                          key={tcIdx}
                          className="p-3 bg-white rounded-xl border border-indigo-100 shadow-2xs space-y-2"
                        >
                          <div className="flex items-center justify-between text-[11px] font-bold text-slate-600">
                            <span>টেস্ট কেস #{tcIdx + 1}</span>
                            <div className="flex items-center gap-3">
                              <label className="flex items-center gap-1 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={tc.isHidden || false}
                                  onChange={(e) => {
                                    const checked = e.target.checked;
                                    setQuestions((prev) => {
                                      const copy = [...prev];
                                      copy[qIdx].testCases[tcIdx].isHidden = checked;
                                      return copy;
                                    });
                                  }}
                                  className="rounded text-indigo-600"
                                />
                                <span className="text-[10px] text-slate-500">লুকানো টেস্ট কেস (Hidden)</span>
                              </label>
                              {q.testCases.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setQuestions((prev) => {
                                      const copy = [...prev];
                                      copy[qIdx].testCases = copy[qIdx].testCases.filter((_, i) => i !== tcIdx);
                                      return copy;
                                    });
                                  }}
                                  className="text-rose-500 hover:text-rose-700"
                                >
                                  মুছুন
                                </button>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <div>
                              <span className="text-[10px] text-slate-500 font-semibold block mb-0.5">Input:</span>
                              <Input
                                value={tc.input}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setQuestions((prev) => {
                                    const copy = [...prev];
                                    copy[qIdx].testCases[tcIdx].input = val;
                                    return copy;
                                  });
                                }}
                                placeholder="যেমন: [5, 10] বা 5"
                                className="font-mono text-xs rounded-lg border-slate-200"
                                required
                              />
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-500 font-semibold block mb-0.5">
                                Expected Output:
                              </span>
                              <Input
                                value={tc.expectedOutput}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setQuestions((prev) => {
                                    const copy = [...prev];
                                    copy[qIdx].testCases[tcIdx].expectedOutput = val;
                                    return copy;
                                  });
                                }}
                                placeholder="যেমন: 15 বা 120"
                                className="font-mono text-xs rounded-lg border-slate-200"
                                required
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Explanation Field */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                  <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
                  <span>ব্যাখ্যা ও সমাধান (পরীক্ষার পর শিক্ষার্থী দেখতে পাবে, LaTeX সমর্থিত)</span>
                </label>
                <textarea
                  value={q.explanation}
                  onChange={(e) => {
                    const val = e.target.value;
                    setQuestions((prev) => {
                      const copy = [...prev];
                      copy[qIdx].explanation = val;
                      return copy;
                    });
                  }}
                  rows={2}
                  placeholder="যেমন: ডিফারেন্সিয়েশন সূত্র অনুযায়ী d/dx x^2 = 2x অথবা অ্যালগরিদমের লজিক..."
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800 outline-none focus:border-primary-500"
                />

                {q.explanation.trim() && (
                  <div className="bg-amber-50/50 border border-amber-200/60 rounded-xl p-2.5 space-y-0.5">
                    <span className="text-[10px] font-bold text-amber-800 flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      ব্যাখ্যা প্রিভিউ:
                    </span>
                    <div className="text-xs text-slate-900">
                      <LatexRenderer content={q.explanation} />
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Bottom Add Question Button */}
        <div id="questions-bottom" className="pt-2">
          <button
            type="button"
            id="add-question-bottom-btn"
            data-testid="add-question-bottom-btn"
            onClick={handleAddQuestion}
            className="w-full py-3.5 px-4 rounded-2xl border-2 border-dashed border-primary-300 hover:border-primary-500 bg-primary-50/40 hover:bg-primary-50/80 text-primary-700 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition shadow-2xs group cursor-pointer active:scale-[0.99]"
          >
            <div className="w-6 h-6 rounded-lg bg-primary-600 text-white flex items-center justify-center group-hover:scale-110 transition shrink-0">
              <Plus className="w-4 h-4" />
            </div>
            <span>{language === 'en' ? 'Add Another Question' : 'আরেকটি নতুন প্রশ্ন যোগ করুন'}</span>
          </button>
        </div>
      </div>

      <div className="pt-4 flex items-center justify-end gap-3">
        <Button
          type="button"
          onClick={() => router.back()}
          variant="outline"
          className="rounded-xl text-xs font-semibold"
        >
          {language === 'en' ? 'Cancel' : 'বাতিল করুন'}
        </Button>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="rounded-xl text-xs font-bold px-6 bg-primary-600 hover:bg-primary-700 text-white gap-2"
        >
          {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          <span>{language === 'en' ? 'Publish Multi-Format Exam' : 'মাল্টি-ফরম্যাট পরীক্ষা প্রকাশ করুন'}</span>
        </Button>
      </div>
    </form>
  );
}

export default ExamCreateForm;
