import React from 'react';
import { Loader } from '@/components/ui/Loader';

export default function CourseDetailsLoading() {
  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-16 animate-pulse">
      {/* Breadcrumb Skeleton */}
      <div className="h-5 w-48 bg-slate-200 rounded-md" />

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column Skeleton */}
        <div className="lg:col-span-2 space-y-8">
          <div className="space-y-4">
            <div className="flex gap-2">
              <div className="h-6 w-24 bg-slate-200 rounded-full" />
              <div className="h-6 w-28 bg-slate-200 rounded-full" />
            </div>
            <div className="h-10 w-3/4 bg-slate-200 rounded-lg" />
            <div className="h-5 w-full bg-slate-200 rounded-md" />
            <div className="h-5 w-2/3 bg-slate-200 rounded-md" />
          </div>

          {/* Loader Centered Box */}
          <div className="rounded-2xl border border-slate-200 bg-white p-12 shadow-sm flex items-center justify-center min-h-[300px]">
            <Loader 
              text="কোর্স বিবরণী লোড হচ্ছে..." 
              subtext="কন্টেন্ট প্রস্তুত করা হচ্ছে, অনুগ্রহ করে অপেক্ষা করুন" 
              size="lg" 
            />
          </div>

          {/* Syllabus Skeleton Cards */}
          <div className="space-y-4">
            <div className="h-7 w-40 bg-slate-200 rounded-md" />
            <div className="space-y-3">
              <div className="h-14 bg-slate-200 rounded-xl" />
              <div className="h-14 bg-slate-200 rounded-xl" />
              <div className="h-14 bg-slate-200 rounded-xl" />
            </div>
          </div>
        </div>

        {/* Right Sidebar Skeleton */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-md space-y-6">
          <div className="aspect-video w-full bg-slate-200 rounded-xl" />
          <div className="h-8 w-32 bg-slate-200 rounded-lg" />
          <div className="h-11 w-full bg-slate-200 rounded-xl" />
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <div className="h-4 w-full bg-slate-200 rounded-md" />
            <div className="h-4 w-3/4 bg-slate-200 rounded-md" />
            <div className="h-4 w-5/6 bg-slate-200 rounded-md" />
          </div>
        </div>
      </div>
    </div>
  );
}
