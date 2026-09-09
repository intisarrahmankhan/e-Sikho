import React from "react"
import { Badge } from "@/components/ui/Badge"
import { CourseCard } from "@/components/dashboard/CourseCard"
import { UpcomingExamsWidget } from "@/components/dashboard/UpcomingExamsWidget"
import { LeaderboardSnippet } from "@/components/dashboard/LeaderboardSnippet"
import { EmptyEnrollments } from "@/components/dashboard/EmptyEnrollments"

// Mock Data
const MOCK_USER = { name: "Alex", elo: 1450 }
const MOCK_COURSES = [
  {
    id: "c1",
    title: "Advanced System Design",
    thumbnailUrl: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=600&auto=format&fit=crop",
    progressPercentage: 65,
    targetCompletionDate: "2024-08-15"
  },
  {
    id: "c2",
    title: "Frontend Architecture Patterns",
    thumbnailUrl: "https://images.unsplash.com/photo-1555099962-4199c345e5dd?q=80&w=600&auto=format&fit=crop",
    progressPercentage: 22,
    targetCompletionDate: "2024-09-01"
  }
]
const MOCK_EXAMS = [
  { id: "e1", title: "System Design Midterm", date: "2024-07-20", daysLeft: 12 },
  { id: "e2", title: "React Performance Quiz", date: "2024-08-05", daysLeft: 28 }
]
const MOCK_LEADERBOARD = [
  { id: "s1", name: "Sarah J.", elo: 1620 },
  { id: "s2", name: "Michael T.", elo: 1585 },
  { id: "s3", name: "David L.", elo: 1540 },
  { id: "s4", name: "Alex (You)", elo: 1450 },
  { id: "s5", name: "Emma W.", elo: 1425 },
]

export default function StudentDashboardPage() {
  const hasEnrollments = MOCK_COURSES.length > 0

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
            Welcome back, {MOCK_USER.name}
          </h1>
          <p className="text-slate-500 mt-1 text-sm md:text-base">
            Continue where you left off and hit your weekly goals.
          </p>
        </div>
        <div>
          <Badge variant="outline" className="px-3 py-1.5 text-sm bg-white shadow-sm">
            <span className="text-slate-500 mr-2">Elo Rating:</span>
            <span className="font-bold text-primary-600">{MOCK_USER.elo}</span>
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-lg font-semibold text-slate-900 border-b border-slate-200 pb-2">
            Active Enrollments
          </h2>
          
          {!hasEnrollments ? (
            <EmptyEnrollments />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {MOCK_COURSES.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          )}
        </div>

        {/* Right Sidebar Widgets */}
        <div className="space-y-6">
          <UpcomingExamsWidget exams={MOCK_EXAMS} />
          <LeaderboardSnippet topStudents={MOCK_LEADERBOARD} />
        </div>
      </div>
    </div>
  )
}
