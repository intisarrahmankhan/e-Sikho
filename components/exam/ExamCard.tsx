'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardFooter } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Clock, BookOpen, ArrowRight } from 'lucide-react';

export interface ExamCardProps {
  id: string;
  title: string;
  description: string;
  courseTitle?: string | null;
  category: string;
  duration: number;
  totalMarks: number;
  passMarks: number;
  questionCount: number;
}

export function ExamCard({
  id,
  title,
  description,
  courseTitle,
  category,
  duration,
  totalMarks,
  passMarks,
  questionCount,
}: ExamCardProps) {
  return (
    <Card className="border border-slate-200/90 rounded-2xl bg-white shadow-sm hover:shadow-md transition duration-200 flex flex-col justify-between overflow-hidden group">
      <div>
        <div className="p-5 pb-3 bg-gradient-to-r from-slate-50 to-white border-b border-slate-100 flex items-center justify-between">
          <Badge
            variant="secondary"
            className="bg-primary-50 text-primary-700 border-primary-200 text-xs font-semibold px-2.5 py-0.5"
          >
            {category}
          </Badge>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>{duration} মিনিট</span>
          </div>
        </div>

        <CardContent className="p-5 space-y-3">
          <h3 className="text-base font-bold text-slate-900 group-hover:text-primary-600 transition leading-snug">
            {title}
          </h3>

          {courseTitle && (
            <p className="text-xs text-primary-600 font-medium flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5" />
              <span>{courseTitle}</span>
            </p>
          )}

          <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
            {description || 'এই পরীক্ষায় অংশগ্রহণ করে আপনার মেধা যাচাই করুন।'}
          </p>

          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100 text-center">
            <div className="bg-slate-50 rounded-xl p-2 border border-slate-100">
              <span className="text-[10px] text-slate-400 block font-medium">মোট প্রশ্ন</span>
              <span className="text-sm font-bold text-slate-800">{questionCount} টি</span>
            </div>
            <div className="bg-slate-50 rounded-xl p-2 border border-slate-100">
              <span className="text-[10px] text-slate-400 block font-medium">পূর্ণমান</span>
              <span className="text-sm font-bold text-slate-800">{totalMarks}</span>
            </div>
            <div className="bg-slate-50 rounded-xl p-2 border border-slate-100">
              <span className="text-[10px] text-slate-400 block font-medium">পাস মার্ক</span>
              <span className="text-sm font-bold text-emerald-600">{passMarks}</span>
            </div>
          </div>
        </CardContent>
      </div>

      <CardFooter className="p-5 pt-0">
        <Link href={`/exams/${id}`} className="w-full">
          <Button className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold text-xs py-2.5 rounded-xl gap-2 shadow-sm transition">
            <span>পরীক্ষা শুরু করুন</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}

export default ExamCard;
