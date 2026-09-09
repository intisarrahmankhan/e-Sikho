import React from "react"
import { Clock } from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card"

interface Exam {
  id: string
  title: string
  date: string
  daysLeft: number
}

export function UpcomingExamsWidget({ exams }: { exams: Exam[] }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Upcoming Exams
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 space-y-4">
        {exams.length === 0 ? (
          <p className="text-sm text-slate-500">No upcoming exams.</p>
        ) : (
          exams.map((exam) => (
            <div key={exam.id} className="flex justify-between items-start border-b border-slate-100 pb-3 last:border-0 last:pb-0">
              <div>
                <p className="text-sm font-medium text-slate-900">{exam.title}</p>
                <p className="text-xs text-slate-500">{new Date(exam.date).toLocaleDateString()}</p>
              </div>
              <div className="text-right">
                <span className="inline-flex items-center rounded-md bg-rose-50 px-2 py-1 text-xs font-medium text-rose-700 ring-1 ring-inset ring-rose-600/10">
                  {exam.daysLeft} days left
                </span>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}
