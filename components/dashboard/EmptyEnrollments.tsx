import React from "react"
import { Search } from "lucide-react"
import { Button } from "@/components/ui/Button"

export function EmptyEnrollments() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
      <div className="bg-white p-4 rounded-full shadow-sm mb-4 border border-slate-100">
        <Search className="w-8 h-8 text-slate-400" />
      </div>
      <h3 className="text-lg font-semibold text-slate-900 mb-2">No Active Courses</h3>
      <p className="text-slate-500 mb-6 max-w-sm">
        You are not currently enrolled in any courses. Browse the catalog to start learning and tracking your progress.
      </p>
      <Button>Browse Catalog</Button>
    </div>
  )
}
