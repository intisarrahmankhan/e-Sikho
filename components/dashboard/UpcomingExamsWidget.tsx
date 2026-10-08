import React from "react";
import Link from "next/link";
import { Clock, Calendar, AlertCircle, ArrowRight } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

interface Exam {
  id: string;
  title: string;
  date: string;
  daysLeft: number;
}

export function UpcomingExamsWidget({ exams }: { exams: Exam[] }) {
  return (
    <Card className="border border-slate-200/90 rounded-2xl bg-white shadow-sm overflow-hidden">
      <CardHeader className="p-5 pb-3 border-b border-slate-100 bg-slate-50/50">
        <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center justify-between">
          <Link href="/exams" className="flex items-center gap-2 hover:text-primary-600 transition">
            <Clock className="w-4 h-4 text-primary-600" />
            <span>আসন্ন পরীক্ষা ও কুইজ</span>
          </Link>
          <Link href="/exams" className="flex items-center gap-1 text-[11px] font-semibold text-primary-600 hover:text-primary-700">
            <span>সকল পরীক্ষা</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-5 space-y-3.5">
        {exams.length === 0 ? (
          <p className="text-xs text-slate-500 py-3 text-center">কোনো আসন্ন পরীক্ষা নেই।</p>
        ) : (
          exams.map((exam) => (
            <Link
              key={exam.id}
              href="/exams"
              className="flex justify-between items-center p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-primary-200 hover:bg-primary-50/30 transition group"
            >
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-slate-800 group-hover:text-primary-700 transition">{exam.title}</p>
                <p className="text-[11px] text-slate-400 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {new Date(exam.date).toLocaleDateString()}
                </p>
              </div>
              <div>
                <span className="inline-flex items-center rounded-lg bg-rose-50 px-2.5 py-1 text-[11px] font-bold text-rose-600 border border-rose-100">
                  {exam.daysLeft} দিন বাকি
                </span>
              </div>
            </Link>
          ))
        )}
      </CardContent>
    </Card>
  );
}
