import React from "react"
import { Badge } from "@/components/ui/Badge"
import { CourseCard } from "@/components/dashboard/CourseCard"
import { UpcomingExamsWidget } from "@/components/dashboard/UpcomingExamsWidget"
import { LeaderboardSnippet } from "@/components/dashboard/LeaderboardSnippet"
import { EmptyEnrollments } from "@/components/dashboard/EmptyEnrollments"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"

// Mock Data for other widgets
const MOCK_EXAMS = [
  { id: "e1", title: "System Design Midterm", date: "2024-07-20", daysLeft: 12 },
  { id: "e2", title: "React Performance Quiz", date: "2024-08-05", daysLeft: 28 }
]
const MOCK_LEADERBOARD = [
  { id: "s1", name: "Sarah J.", elo: 1620 },
  { id: "s2", name: "Michael T.", elo: 1585 },
  { id: "s3", name: "David L.", elo: 1540 },
  { id: "s4", name: "You", elo: 1450 },
  { id: "s5", name: "Emma W.", elo: 1425 },
]

export default async function StudentDashboardPage() {
  const session = await auth()
  
  if (!session || !session.user) {
    redirect('/login')
  }
  
  const userId = (session.user as any).id
  
  if (!userId) {
    redirect('/login')
  }

  // Fetch actual enrolled courses for this user
  const enrollments = await prisma.enrollment.findMany({
    where: {
      userId: userId,
      paymentStatus: 'success', // Only show fully paid / successful enrollments
    },
    include: {
      course: true,
    }
  })

  // Format to match what the component expects
  const enrolledCourses = enrollments.map(e => ({
    id: e.course.id,
    title: e.course.title,
    thumbnailUrl: e.course.thumbnailUrl,
    progressPercentage: 0, // Hardcoded for now until progress tracking is added
    targetCompletionDate: new Date(new Date().setMonth(new Date().getMonth() + 2)).toISOString().split('T')[0] // Dummy 2 months ahead
  }))

  const hasEnrollments = enrolledCourses.length > 0
  const elo = 1450 // Mock Elo for now

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
            Welcome back, {session.user.name}
          </h1>
          <p className="text-slate-500 mt-1 text-sm md:text-base">
            Continue where you left off and hit your weekly goals.
          </p>
        </div>
        <div>
          <Badge variant="outline" className="px-3 py-1.5 text-sm bg-white shadow-sm">
            <span className="text-slate-500 mr-2">Elo Rating:</span>
            <span className="font-bold text-primary-600">{elo}</span>
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
              {enrolledCourses.map((course) => (
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
