"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  BookOpen, 
  Clock, 
  Star, 
  Users, 
  Search, 
  CheckCircle2, 
  GraduationCap, 
  Award, 
  Sparkles,
  ArrowRight,
  Filter,
  Loader2
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Loader } from "@/components/ui/Loader";
import { COURSES_DATA, Course } from "@/lib/courses-data";

export default function CoursesPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [loadingCourseId, setLoadingCourseId] = useState<string | null>(null);

  const categories = [
    { id: "all", label: "সকল কোর্স" },
    { id: "web-dev", label: "ওয়েব ডেভেলপমেন্ট" },
    { id: "data-science", label: "ডাটা সায়েন্স ও এআই" },
    { id: "programming", label: "প্রোগ্রামিং ফান্ডামেন্টালস" },
    { id: "system-design", label: "সিস্টেম ডিজাইন" },
    { id: "app-dev", label: "অ্যাপ ডেভেলপমেন্ট" },
  ];

  const filteredCourses = useMemo(() => {
    return COURSES_DATA.filter((course) => {
      const matchesCategory =
        selectedCategory === "all" || course.category === selectedCategory;
      const matchesSearch =
        course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.tagline.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.instructor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.categoryBangla.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [searchQuery, selectedCategory]);

  const handleCourseClick = (courseId: string) => {
    setLoadingCourseId(courseId);
    router.push(`/courses/${courseId}`);
  };

  return (
    <div className="space-y-8 pb-12 max-w-7xl mx-auto">
      {/* Hero Banner in Bangla */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary-900 via-primary-700 to-slate-900 text-white p-8 md:p-12 shadow-xl">
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold backdrop-blur-md text-primary-100 border border-white/20">
            <Sparkles className="h-3.5 w-3.5 text-yellow-300" />
            <span>প্রফেশনাল স্কিল ডেভেলপমেন্ট প্ল্যাটফর্ম</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight leading-tight">
            নিজের ভাষায় শিখুন, ক্যারিয়ার গড়ুন বিশ্বমানের
          </h1>
          <p className="text-slate-200 text-base md:text-lg leading-relaxed">
            শীর্ষস্থানীয় ইন্ডাস্ট্রি এক্সপার্টদের সাথে বাংলায় শিখুন প্রোগ্রামিং, ডাটা সায়েন্স এবং সিস্টেম আর্কিটেকচার।
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-white/15">
            <div className="flex items-center gap-2 text-sm text-slate-200">
              <GraduationCap className="h-5 w-5 text-primary-200" />
              <span>রিয়েল-লাইফ প্রজেক্ট</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-200">
              <Users className="h-5 w-5 text-primary-200" />
              <span>২৪/৭ মেন্টর সাপোর্ট</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-200">
              <Award className="h-5 w-5 text-primary-200" />
              <span>ভেরিফাইড সার্টিফিকেট</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-200">
              <CheckCircle2 className="h-5 w-5 text-primary-200" />
              <span>লাইফটাইম অ্যাক্সেস</span>
            </div>
          </div>
        </div>

        {/* Decorative background glows */}
        <div className="absolute right-0 top-0 -mr-16 -mt-16 h-72 w-72 rounded-full bg-primary-500/20 blur-3xl pointer-events-none" />
        <div className="absolute right-32 bottom-0 h-48 w-48 rounded-full bg-blue-400/15 blur-2xl pointer-events-none" />
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="কোর্স বা ইন্সট্রাক্টরের নাম দিয়ে খুঁজুন..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-4 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-primary-600 focus:outline-none focus:ring-1 focus:ring-primary-600 transition"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-thin">
          <Filter className="h-4 w-4 text-slate-400 hidden sm:block shrink-0" />
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`whitespace-nowrap px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                selectedCategory === cat.id
                  ? "bg-primary-600 text-white shadow-sm font-semibold"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Course Count */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900">
          উপলব্ধ কোর্সসমূহ ({filteredCourses.length})
        </h2>
      </div>

      {/* Courses Grid */}
      {filteredCourses.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <BookOpen className="mx-auto h-12 w-12 text-slate-300 mb-3" />
          <h3 className="text-lg font-semibold text-slate-800">কোনো কোর্স পাওয়া যায়নি</h3>
          <p className="text-sm text-slate-500 mt-1">
            অনুগ্রহ করে অন্য কি-ওয়ার্ড বা ক্যাটাগরি দিয়ে চেষ্টা করুন।
          </p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => {
              setSearchQuery("");
              setSelectedCategory("all");
            }}
          >
            ফিল্টার রিসেট করুন
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => (
            <CourseCardItem 
              key={course.id} 
              course={course} 
              isLoading={loadingCourseId === course.id}
              onClick={() => handleCourseClick(course.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function CourseCardItem({ 
  course, 
  isLoading, 
  onClick 
}: { 
  course: Course; 
  isLoading?: boolean;
  onClick: () => void;
}) {
  const discountPercent = Math.round(
    ((course.originalPrice - course.price) / course.originalPrice) * 100
  );

  return (
    <Card 
      onClick={onClick}
      className="relative flex flex-col h-full overflow-hidden hover:shadow-lg transition-all duration-200 border-slate-200 group bg-white cursor-pointer select-none"
    >
      {/* Loading Overlay */}
      {isLoading && (
        <Loader 
          overlay 
          text="কোর্স লোড হচ্ছে..." 
          subtext="একটু অপেক্ষা করুন" 
          size="md" 
        />
      )}

      {/* Course Thumbnail */}
      <div className="relative aspect-video w-full overflow-hidden bg-slate-100">
        <img
          src={course.thumbnailUrl}
          alt={course.title}
          className="h-full w-full object-cover group-hover:scale-105 transition duration-300"
          loading="lazy"
        />
        <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap">
          <Badge className="bg-primary-600 text-white font-medium text-xs px-2.5 py-0.5">
            {course.categoryBangla}
          </Badge>
          <Badge variant="secondary" className="bg-white/90 text-slate-800 backdrop-blur-sm text-xs font-semibold">
            {course.level}
          </Badge>
        </div>
        {discountPercent > 0 && (
          <div className="absolute top-3 right-3 bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow">
            {discountPercent}% ছাড়
          </div>
        )}
      </div>

      {/* Card Content */}
      <CardContent className="flex flex-col flex-1 p-5 space-y-4">
        <div className="flex-1 space-y-2">
          <h3 className="font-bold text-slate-900 text-lg leading-snug group-hover:text-primary-600 transition line-clamp-2">
            {course.title}
          </h3>
          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
            {course.tagline}
          </p>
        </div>

        {/* Instructor Info */}
        <div className="flex items-center gap-2.5 pt-2 border-t border-slate-100">
          <img
            src={course.instructor.avatar}
            alt={course.instructor.name}
            className="h-7 w-7 rounded-full object-cover border border-slate-200"
          />
          <div className="text-xs">
            <span className="text-slate-400">প্রশিক্ষক: </span>
            <span className="font-medium text-slate-700">{course.instructor.name}</span>
          </div>
        </div>

        {/* Meta details (Duration, Lessons, Rating) */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
          <div className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5 text-slate-400" />
            <span>{course.duration}</span>
          </div>
          <div className="flex items-center gap-1">
            <BookOpen className="h-3.5 w-3.5 text-slate-400" />
            <span>{course.totalLessons} টি লেসন</span>
          </div>
          <div className="flex items-center gap-1 font-semibold text-amber-600">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            <span>{course.rating}</span>
            <span className="text-slate-400 font-normal">({course.totalRatings})</span>
          </div>
        </div>

        {/* Price & Action */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100 mt-auto">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-extrabold text-primary-900">
                ৳{course.price.toLocaleString("bn-BD")}
              </span>
              {course.originalPrice > course.price && (
                <span className="text-xs text-slate-400 line-through">
                  ৳{course.originalPrice.toLocaleString("bn-BD")}
                </span>
              )}
            </div>
          </div>

          <Button 
            size="sm" 
            disabled={isLoading}
            className="gap-1 bg-primary-600 hover:bg-primary-700 text-white font-medium"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>লোড হচ্ছে...</span>
              </>
            ) : (
              <>
                <span>বিস্তারিত</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
