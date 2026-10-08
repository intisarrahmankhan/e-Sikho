'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
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
} from 'lucide-react';
import { createExamAction } from '@/actions/exam';

interface QuestionDraft {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  marks: number;
}

export function ExamCreateForm({ courses }: { courses?: { id: string; title: string }[] }) {
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Mathematics');
  const [courseId, setCourseId] = useState('none');
  const [duration, setDuration] = useState(20);
  const [passMarks, setPassMarks] = useState(3);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [questions, setQuestions] = useState<QuestionDraft[]>([
    {
      question: 'যদি $f(x) = \\int_{0}^{x} t^2 \\, dt$ হয়, তবে $f\'(2)$ এর মান কত?',
      options: ['$4$', '$8$', '$\\frac{8}{3}$', '$2$'],
      correctAnswer: 0,
      explanation: 'ক্যালকুলাসের মৌলিক উপপাদ্য (FTC) অনুযায়ী: $\\frac{d}{dx} \\int_{0}^{x} f(t) dt = f(x)$। সুতরাং $f\'(x) = x^2$ এবং $f\'(2) = 2^2 = 4$।',
      marks: 1,
    },
  ]);

  const handleAddQuestion = () => {
    setQuestions((prev) => [
      ...prev,
      {
        question: '',
        options: ['', '', '', ''],
        correctAnswer: 0,
        explanation: '',
        marks: 1,
      },
    ]);
  };

  const handleRemoveQuestion = (idx: number) => {
    if (questions.length <= 1) {
      alert('কমপক্ষে ১টি প্রশ্ন থাকতে হবে।');
      return;
    }
    setQuestions((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleInsertSample = (qIdx: number) => {
    const samples = [
      {
        question: 'নির্দিষ্ট সমাকলন $\\int_{0}^{1} x \\sqrt{1 - x^2} \\, dx$ এর মান নির্ণয় করুন:',
        options: ['$\\frac{1}{3}$', '$\\frac{2}{3}$', '$\\frac{1}{2}$', '$1$'],
        correctAnswer: 0,
        explanation: 'ধরি $u = 1 - x^2$, সুতরাং $du = -2x dx$। প্রতিস্থাপন করে মান পাওয়া যায় $\\frac{1}{3}$।',
        marks: 1,
      },
      {
        question: 'দ্বিঘাত বহুপদী $P(x) = x^2 - 5x + 6$ এর শূন্যদ্বয় (Roots) হলো:',
        options: ['$x = 2, 3$', '$x = -2, -3$', '$x = 1, 6$', '$x = -1, -6$'],
        correctAnswer: 0,
        explanation: 'উৎপাদকে বিশ্লেষণ: $(x - 2)(x - 3) = 0 \\implies x = 2, 3$।',
        marks: 1,
      },
    ];

    const pick = samples[Math.floor(Math.random() * samples.length)];
    setQuestions((prev) => {
      const copy = [...prev];
      copy[qIdx] = { ...pick };
      return copy;
    });
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
        description,
        category,
        courseId: courseId !== 'none' ? courseId : undefined,
        duration: Number(duration),
        passMarks: Number(passMarks),
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
      {/* Basic Settings Card */}
      <Card className="border border-slate-200 rounded-2xl bg-white shadow-sm overflow-hidden">
        <CardHeader className="p-6 pb-4 border-b border-slate-100 bg-slate-50/50">
          <CardTitle className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
            <FileQuestion className="w-5 h-5 text-primary-600" />
            <span>নতুন পরীক্ষা তৈরি করুন (LaTeX ম্যাথ সাপোর্টসহ)</span>
          </CardTitle>
          <p className="text-xs text-slate-500">
            প্রশ্ন ও অপশনে $...$ বা $$...$$ ব্যবহার করে সহজেই চমৎকার গাণিতিক সূত্র যোগ করুন।
          </p>
        </CardHeader>

        <CardContent className="p-6 space-y-5">
          {errorMsg && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3.5 rounded-xl font-medium">
              {errorMsg}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">পরীক্ষার নাম / শিরোনাম *</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="যেমন: উচ্চতর গণিত - ক্যালকুলাস ও ভেক্টর কুইজ"
              className="rounded-xl border-slate-200 text-xs sm:text-sm"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">সংক্ষিপ্ত বিবরণ</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="পরীক্ষার উদ্দেশ্য ও সিলেবাস সম্পর্কে কিছু লিখুন..."
              className="w-full rounded-xl border border-slate-200 p-3 text-xs sm:text-sm text-slate-800 outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
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
                <option value="Mathematics">Mathematics (গণিত)</option>
                <option value="Computer Science">Computer Science (সিএস)</option>
                <option value="Physics">Physics (পদার্থবিজ্ঞান)</option>
                <option value="Programming">Programming (প্রোগ্রামিং)</option>
                <option value="General">General (সাধারণ)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">সময়সীমা (মিনিট)</label>
              <Input
                type="number"
                min={1}
                max={180}
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

          {courses && courses.length > 0 && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">সম্পর্কিত কোর্স (ঐচ্ছিক)</label>
              <select
                value={courseId}
                onChange={(e) => setCourseId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800 outline-none bg-white focus:border-primary-500"
              >
                <option value="none">কোনো নির্দিষ্ট কোর্স নেই (সবার জন্য উন্মুক্ত)</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Questions Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Layers className="w-5 h-5 text-primary-600" />
            <span>প্রশ্নাবলি ({questions.length} টি)</span>
          </h3>

          <Button
            type="button"
            onClick={handleAddQuestion}
            variant="outline"
            className="text-xs border-primary-200 text-primary-700 bg-primary-50/50 hover:bg-primary-50 gap-1.5 rounded-xl font-semibold"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>নতুন প্রশ্ন যোগ করুন</span>
          </Button>
        </div>

        {questions.map((q, qIdx) => (
          <Card
            key={qIdx}
            className="border border-slate-200 rounded-2xl bg-white shadow-2xs overflow-hidden"
          >
            <CardHeader className="p-4 sm:p-5 pb-3 border-b border-slate-100 bg-slate-50/50 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge className="bg-slate-800 text-white text-xs font-bold px-2.5 py-0.5">
                  প্রশ্ন {qIdx + 1}
                </Badge>
                <button
                  type="button"
                  onClick={() => handleInsertSample(qIdx)}
                  className="text-[11px] text-primary-600 hover:text-primary-800 font-semibold flex items-center gap-1 bg-white px-2 py-0.5 rounded-md border border-primary-100 shadow-2xs"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>নমুনা গণিত প্রশ্ন বসান</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
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
                  placeholder="যেমন: সমাকলনটি সমাধান করো: $\int_{0}^{\pi} \cos(x) dx$"
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
                      লাইভ রেন্ডার প্রিভিউ:
                    </span>
                    <div className="text-xs sm:text-sm text-slate-900">
                      <LatexRenderer content={q.question} />
                    </div>
                  </div>
                )}
              </div>

              {/* Options */}
              <div className="space-y-3">
                <span className="text-xs font-bold text-slate-700 block">
                  অপশনসমূহ ও সঠিক উত্তর নির্বাচন করুন (প্রতিটি অপশনে LaTeX $..$ সমর্থিত):
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
                  placeholder="যেমন: ডিফারেন্সিয়েশন সূত্র অনুযায়ী $\frac{d}{dx} x^2 = 2x$"
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800 outline-none focus:border-primary-500"
                />

                {q.explanation.trim() && (
                  <div className="bg-amber-50/50 border border-amber-200/60 rounded-xl p-2.5 space-y-0.5">
                    <span className="text-[10px] font-bold text-amber-800 flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      ব্যাখ্যা প্রিভিউ:
                    </span>
                    <div className="text-xs text-slate-800">
                      <LatexRenderer content={q.explanation} />
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Form Submission Buttons */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/exams')}
          disabled={isSubmitting}
          className="rounded-xl border-slate-200 text-xs px-5 py-2.5"
        >
          বাতিল করুন
        </Button>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl text-xs px-6 py-2.5 shadow-sm gap-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>সংরক্ষণ করা হচ্ছে...</span>
            </>
          ) : (
            <>
              <CheckCircle className="w-4 h-4" />
              <span>পরীক্ষা প্রকাশ করুন</span>
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

export default ExamCreateForm;
