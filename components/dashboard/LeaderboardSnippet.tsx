import React from "react";
import { Trophy, Medal, Flame } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

interface StudentScore {
  id: string;
  name: string;
  elo: number;
}

export function LeaderboardSnippet({ topStudents }: { topStudents: StudentScore[] }) {
  return (
    <Card className="border border-slate-200/90 rounded-2xl bg-white shadow-sm overflow-hidden">
      <CardHeader className="p-5 pb-3 border-b border-slate-100 bg-slate-50/50">
        <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-500" />
            টপ লিডারবোর্ড
          </span>
          <span className="text-[10px] text-slate-400 font-semibold">Weekly Rank</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-5 space-y-2.5">
        {topStudents.map((student, index) => {
          const isUser = student.name === "You";
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
                <span className="text-xs font-semibold">{student.name}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black text-primary-600">{student.elo}</span>
                <span className="text-[10px] text-slate-400 font-medium">Elo</span>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
