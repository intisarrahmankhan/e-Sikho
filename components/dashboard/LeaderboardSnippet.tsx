'use client';

import React from "react";
import Link from "next/link";
import { Trophy } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { useLanguage } from "@/context/LanguageContext";

interface StudentScore {
  id: string;
  name: string;
  elo: number;
}

export function LeaderboardSnippet({ topStudents }: { topStudents: StudentScore[] }) {
  const { language } = useLanguage();

  return (
    <Card className="border border-slate-200/90 rounded-2xl bg-white shadow-sm overflow-hidden">
      <CardHeader className="p-5 pb-3 border-b border-slate-100 bg-slate-50/50">
        <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-500" />
            {language === 'en' ? 'Top Leaderboard' : 'টপ লিডারবোর্ড'}
          </span>
          <span className="text-[10px] text-slate-400 font-semibold">
            {language === 'en' ? 'Weekly Rank' : 'সাপ্তাহিক র‍্যাংক'}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-5 space-y-2.5">
        {topStudents.map((student, index) => {
          const isUser = student.name === "You" || student.name === "আপনি";
          const displayName = isUser
            ? language === 'en' ? 'You' : 'আপনি'
            : student.name;

          return (
            <div
              key={student.id}
              className={`flex items-center justify-between p-2.5 rounded-xl transition ${
                isUser
                  ? "bg-primary-50 border border-primary-200 text-primary-900 font-bold"
                  : "hover:bg-slate-50 text-slate-700"
              }`}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`w-6 text-center text-xs font-black ${
                    index === 0
                      ? "text-amber-500"
                      : index === 1
                      ? "text-slate-400"
                      : index === 2
                      ? "text-amber-700"
                      : "text-slate-400"
                  }`}
                >
                  #{index + 1}
                </span>
                <span className="text-xs font-semibold">{displayName}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black text-primary-600">{student.elo}</span>
                <span className="text-[10px] text-slate-400 font-medium">Elo</span>
              </div>
            </div>
          );
        })}

        <div className="pt-2 border-t border-slate-100">
          <Link
            href="/leaderboard"
            className="w-full py-2 px-3 text-center block text-xs font-bold text-primary-600 hover:text-primary-700 bg-primary-50/60 hover:bg-primary-50 rounded-xl transition"
          >
            {language === 'en' ? 'View Full Leaderboard & Percentiles →' : 'সম্পূর্ণ লিডারবোর্ড ও পার্সেন্টাইল দেখুন →'}
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

export default LeaderboardSnippet;
