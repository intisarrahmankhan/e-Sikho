import React from 'react';
import Link from 'next/link';
import { getExamsAction, seedSampleExamsAction } from '@/actions/exam';
import { ExamCard } from '@/components/exam/ExamCard';
import { LatexPlayground } from '@/components/exam/LatexPlayground';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  FileQuestion,
  PlusCircle,
  Sparkles,
  Calculator,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function ExamsPage() {

  // Seed sample exams if database is empty so users have instant access to rich LaTeX questions
  await seedSampleExamsAction();

  const res = await getExamsAction();
  const exams = res.exams || [];

  return (
    <div className="space-y-8 pb-12">
      {/* Header Banner */}
      <div className="relative rounded-3xl bg-gradient-to-r from-primary-900 via-primary-800 to-slate-900 p-6 sm:p-10 text-white overflow-hidden shadow-lg">
        <div className="relative z-10 space-y-4 max-w-2xl">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="bg-primary-500/30 text-primary-200 border-primary-400/30 text-xs px-3 py-1 font-semibold backdrop-blur-xs">
              <Calculator className="w-3.5 h-3.5 mr-1" />
              LaTeX ম্যাথ রেন্ডারিং সাপোর্টেড
            </Badge>
            <Badge className="bg-white/10 text-white border-white/20 text-xs px-3 py-1 font-semibold">
              স্বয়ংক্রিয় মূল্যায়ন (Auto-Grading)
            </Badge>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
            অনলাইন পরীক্ষা ও কুইজ মডিউল
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            উচ্চতর গণিত, কম্পিউটার সায়েন্স ও বিজ্ঞানের বিভিন্ন বিষয়ের উপর ইন্টারেক্টিভ পরীক্ষা দিন।
            জটিল সমীকরণ, ক্যালকুলাস ও ম্যাট্রিক্সের মতো গাণিতিক সমস্যাগুলোর সঠিক সমাধান শিখুন।
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link href="/exams/create">
              <Button className="bg-primary-500 hover:bg-primary-600 text-white font-bold text-xs px-4 py-2.5 rounded-xl gap-2 shadow-sm">
                <PlusCircle className="w-4 h-4" />
                <span>নতুন পরীক্ষা তৈরি করুন</span>
              </Button>
            </Link>

            <a href="#latex-playground">
              <Button
                variant="outline"
                className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs px-4 py-2.5 rounded-xl gap-2"
              >
                <Sparkles className="w-4 h-4 text-yellow-300" />
                <span>LaTeX সূত্র পরীক্ষাগার</span>
              </Button>
            </a>
          </div>
        </div>

        {/* Decorative background geometry */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 flex items-center justify-center pointer-events-none select-none font-mono text-9xl font-black text-white">
          ∫∑√
        </div>
      </div>

      {/* Available Exams Section */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <FileQuestion className="w-5 h-5 text-primary-600" />
              <span>উপলব্ধ পরীক্ষাসমূহ ({exams.length} টি)</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              যেকোনো পরীক্ষায় অংশ নিয়ে তাৎক্ষণিক ফলাফল ও সমাধান বিশ্লেষণ দেখুন
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/exams/create">
              <Button
                variant="outline"
                className="text-xs rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 gap-1.5"
              >
                <PlusCircle className="w-3.5 h-3.5 text-primary-600" />
                <span>প্রশ্নপত্র প্রণয়ন</span>
              </Button>
            </Link>
          </div>
        </div>

        {exams.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 space-y-3">
            <FileQuestion className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-700">কোনো পরীক্ষা পাওয়া যায়নি</h3>
            <p className="text-xs text-slate-500">প্রথম পরীক্ষা তৈরি করতে উপরের বাটনে ক্লিক করুন।</p>
            <Link href="/exams/create">
              <Button className="bg-primary-600 hover:bg-primary-700 text-white text-xs mt-2 rounded-xl">
                পরীক্ষা তৈরি করুন
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {exams.map((exam: any) => (
              <ExamCard
                key={exam.id}
                id={exam.id}
                title={exam.title}
                description={exam.description}
                courseTitle={exam.courseTitle}
                category={exam.category}
                duration={exam.duration}
                totalMarks={exam.totalMarks}
                passMarks={exam.passMarks}
                questionCount={exam.questionCount}
              />
            ))}
          </div>
        )}
      </div>

      {/* LaTeX Formula Testing Playground */}
      <div id="latex-playground" className="pt-6">
        <div className="space-y-3 mb-4">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <span>ইন্টারেক্টিভ LaTeX ম্যাথ প্রিভিউ ও শর্টকাট টেস্ট</span>
          </h2>
          <p className="text-xs text-slate-500">
            শিক্ষক ও শিক্ষার্থী উভয়ই এখানে বিভিন্ন গাণিতিক সমীকরণ লিখে KaTeX রেন্ডারিং পরীক্ষা করে দেখতে পারবেন।
          </p>
        </div>

        <LatexPlayground />
      </div>
    </div>
  );
}
