"use client"

import React, { useState } from "react"
import { PlayCircle, Calendar } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { RescheduleModal } from "@/components/modals/RescheduleModal"

export interface CourseProps {
  id: string
  title: string
  thumbnailUrl: string
  progressPercentage: number
  targetCompletionDate: string
}

export function CourseCard({ course }: { course: CourseProps }) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <>
      <Card className="overflow-hidden flex flex-col">
        <div 
          className="h-32 w-full bg-slate-200 bg-cover bg-center" 
          style={{ backgroundImage: `url(${course.thumbnailUrl})` }}
        />
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-lg line-clamp-2">{course.title}</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-2 flex-1 flex flex-col justify-between space-y-4">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500 font-medium">Progress</span>
              <span className="font-semibold">{course.progressPercentage}%</span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary-500 transition-all duration-300"
                style={{ width: `${course.progressPercentage}%` }}
              />
            </div>
          </div>
          
          <div className="flex items-center text-sm text-slate-500 gap-1.5">
            <Calendar className="w-4 h-4" />
            <span>Target: {new Date(course.targetCompletionDate).toLocaleDateString()}</span>
          </div>
          
          <div className="flex gap-2 pt-2">
            <Button className="flex-1 gap-2">
              <PlayCircle className="w-4 h-4" />
              Resume Lesson
            </Button>
            <Button 
              variant="outline" 
              className="px-3" 
              title="Adjust Pace"
              onClick={() => setIsModalOpen(true)}
            >
              Adjust Pace
            </Button>
          </div>
        </CardContent>
      </Card>

      <RescheduleModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        currentTargetDate={course.targetCompletionDate}
        courseTitle={course.title}
      />
    </>
  )
}
