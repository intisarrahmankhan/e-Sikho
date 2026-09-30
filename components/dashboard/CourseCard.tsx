"use client";

import React, { useState } from "react";
import { PlayCircle, Calendar, Sparkles, Clock, CheckCircle2, Sliders } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { RescheduleModal } from "@/components/modals/RescheduleModal";

export interface CourseProps {
  id: string;
  title: string;
  thumbnailUrl: string;
  progressPercentage: number;
  targetCompletionDate: string;
}

export function CourseCard({ course }: { course: CourseProps }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <Card className="overflow-hidden border border-slate-200/90 rounded-2xl bg-white hover:shadow-lg transition-all duration-300 flex flex-col group">
        {/* Thumbnail banner */}
        <div className="relative h-40 w-full overflow-hidden bg-slate-100">
          <img
            src={course.thumbnailUrl}
            alt={course.title}
            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          
          <div className="absolute top-3 left-3">
            <Badge className="bg-primary-600 text-white font-semibold text-[11px] shadow-sm">
              Enrolled
            </Badge>
          </div>

          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-xs">
            <span className="font-semibold text-emerald-300 flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" />
              {course.progressPercentage}% Completed
            </span>
          </div>
        </div>

        {/* Content */}
        <CardContent className="p-5 flex-1 flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <h3 className="font-bold text-slate-900 text-base line-clamp-2 leading-snug group-hover:text-primary-600 transition-colors">
              {course.title}
            </h3>

            {/* Progress Bar */}
            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between text-xs text-slate-500 font-medium">
                <span>শেখার অগ্রগতি</span>
                <span className="text-primary-600 font-bold">{course.progressPercentage}%</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary-500 to-indigo-600 transition-all duration-500 rounded-full"
                  style={{ width: `${Math.max(course.progressPercentage, 5)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Target Date */}
          <div className="pt-2 border-t border-slate-100 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                <span>টার্গেট ডেট: {new Date(course.targetCompletionDate).toLocaleDateString()}</span>
              </span>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-1">
              <Button className="flex-1 gap-1.5 bg-primary-600 hover:bg-primary-700 text-white font-semibold text-xs py-2 rounded-xl shadow-sm">
                <PlayCircle className="h-4 w-4" />
                <span>ক্লাস শুরু করুন</span>
              </Button>
              <Button
                variant="outline"
                className="px-3 text-xs border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl"
                onClick={() => setIsModalOpen(true)}
                title="শিডিউল পরিবর্তন"
              >
                <Sliders className="h-3.5 w-3.5" />
              </Button>
            </div>
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
  );
}
