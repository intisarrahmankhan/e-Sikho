import React from "react"
import { Trophy } from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card"

interface StudentScore {
  id: string
  name: string
  elo: number
}

export function LeaderboardSnippet({ topStudents }: { topStudents: StudentScore[] }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-2">
          <Trophy className="w-4 h-4" />
          Top Students
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        {topStudents.map((student, index) => (
          <div key={student.id} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className={`text-sm font-bold ${index === 0 ? 'text-amber-500' : index === 1 ? 'text-slate-400' : index === 2 ? 'text-amber-700' : 'text-slate-300'}`}>
                #{index + 1}
              </span>
              <span className="text-sm font-medium text-slate-700">{student.name}</span>
            </div>
            <span className="text-sm font-semibold text-primary-600">{student.elo}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
