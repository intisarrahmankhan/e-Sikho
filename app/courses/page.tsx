"use client";

import React, { useState, useMemo, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
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
  SlidersHorizontal,
  X,
  Flame,
  Layers,
  Code2,
  BrainCircuit,
  Laptop
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { COURSES_DATA, Course } from "@/lib/courses-data";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

type SortOption = "popular" | "newest" | "price-low" | "price-high" | "rating";

function CoursesCatalog({ additionalCourses = [] }: { additionalCourses?: Course[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const initialCategory = searchParams.get("category") || "all";
  const initialSearch = searchParams.get("search") || "";

  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [selectedLevel, setSelectedLevel] = useState<string>("all");
  const [sortBy, setSortBy] = useState<SortOption>("popular");

  const categories = [
    { id: "all", label: "সকল কোর্স", icon: Layers },
    { id: "web-dev", label: "ওয়েব ডেভেলপমেন্ট", icon: Code2 },
    { id: "data-science", label: "ডাটা সায়েন্স ও এআই", icon: BrainCircuit },
    { id: "programming", label: "প্রোগ্রামিং ও ডিএসএ", icon: Laptop },
    { id: "system-design", label: "সিস্টেম ডিজাইন", icon: Layers },
    { id: "app-dev", label: "অ্যাপ ডেভেলপমেন্ট", icon: Sparkles },
  ];

  const levels = [
    { id: "all", label: "সকল লেভেল" },
    { id: "বিগিনার", label: "বিগিনার" },
    { id: "ইন্টারমিডিয়েট", label: "ইন্টারমিডিয়েট" },
    { id: "অ্যাডভান্সড", label: "অ্যাডভান্সড" },
  ];

  const filteredCourses = useMemo(() => {
    let result = [...COURSES_DATA, ...additionalCourses].filter((course) => {
      const matchesCategory =
        selectedCategory === "all" || course.category === selectedCategory;
      const matchesLevel = 
        selectedLevel === "all" || course.level === selectedLevel;
      const matchesSearch =
        course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.tagline.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.instructor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.categoryBangla.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesLevel && matchesSearch;
    });

    switch (sortBy) {
      case "price-low":
        result.sort((a, b) => a.price - b.price);
        break;
      case "price-high":
        result.sort((a, b) => b.price - a.price);
        break;
      case "rating":
        result.sort((a, b) => b.rating - a.rating);
        break;
      case "popular":
      default:
        result.sort((a, b) => b.studentsEnrolled - a.studentsEnrolled);
        break;
    }

    return result;
  }, [searchQuery, selectedCategory, selectedLevel, sortBy]);

  const resetFilters = () => {
    setSearchQuery("");
    setSelectedCategory("all");
    setSelectedLevel("all");
    setSortBy("popular");
  };

  const hasActiveFilters = searchQuery !== "" || selectedCategory !== "all" || selectedLevel !== "all" || sortBy !== "popular";

  return (
    <div className="space-y-10 pb-16 max-w-7xl mx-auto">
      {/* ─── Header Banner ─── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-primary-950 to-slate-900 text-white p-8 sm:p-12 shadow-xl border border-slate-800">
        <div className="relative z-10 max-w-2xl space-y-4">
          <Badge className="bg-primary-500/20 text-primary-300 border-primary-500/30 text-xs px-3 py-1">
            এক্সপ্লোর করুন
          </Badge>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white">
            কোর্স ক্যাটালগ
          </h1>
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            প্রফেশনাল সফটওয়্যার ক্যারিয়ারের জন্য তৈরি আমাদের হ্যান্ডস-অন কোর্সগুলো ব্রাউজ করুন এবং আপনার উপযুক্ত কোর্সটি বেছে নিন।
          </p>
        </div>

        {/* Floating Search Bar */}
        <div className="relative z-10 mt-8 max-w-2xl">
          <div className="relative flex items-center bg-white rounded-2xl shadow-lg p-1.5 border border-slate-200">
            <Search className="h-5 w-5 text-slate-400 ml-3 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="কোর্সের নাম, টপিক বা ইন্সট্রাক্টর সার্চ করুন..."
              className="w-full px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none bg-transparent"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 mr-1"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            <Button
              size="sm"
              className="bg-primary-600 hover:bg-primary-700 text-white font-medium px-4 py-2 rounded-xl text-xs shrink-0"
            >
              খুঁজুন
            </Button>
          </div>
        </div>
      </div>

      {/* ─── Category Chips ─── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer border ${
                isSelected
                  ? "bg-primary-600 text-white border-primary-600 shadow-sm scale-[1.02]"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300"
              }`}
            >
              <cat.icon className={`h-4 w-4 ${isSelected ? "text-white" : "text-slate-400"}`} />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* ─── Filter Bar & Sort Controls ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">লেভেল:</div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {levels.map((lvl) => (
              <button
                key={lvl.id}
                onClick={() => setSelectedLevel(lvl.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  selectedLevel === lvl.id
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {lvl.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-3 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">সর্ট করুন:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-primary-500"
            >
              <option value="popular">সর্বাধিক জনপ্রিয়</option>
              <option value="rating">সেরা রেটিং</option>
              <option value="price-low">কম মূল্য থেকে বেশি</option>
              <option value="price-high">বেশি মূল্য থেকে কম</option>
            </select>
          </div>

          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="text-xs text-rose-600 hover:text-rose-700 font-medium underline"
            >
              ফিল্টার মুছুন
            </button>
          )}
        </div>
      </div>

      {/* ─── Results Counter ─── */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-1">
        <span>মোট <strong className="text-slate-900 font-bold">{filteredCourses.length}</strong> টি কোর্স পাওয়া গেছে</span>
      </div>

      {/* ─── Courses Grid ─── */}
      {filteredCourses.length === 0 ? (
        <div className="p-12 text-center bg-white border border-slate-200 rounded-2xl space-y-4">
          <div className="h-14 w-14 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
            <Search className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">কোনো কোর্স পাওয়া যায়নি</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            আপনার অনুসন্ধান বা ফিল্টারের সাথে মিলে এমন কোনো কোর্স পাওয়া যায়নি। অনুগ্রহ করে ফিল্টার পরিবর্তন করুন।
          </p>
          <Button onClick={resetFilters} variant="outline" size="sm">
            সকল কোর্স দেখুন
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
          {filteredCourses.map((course) => {
            const discount = Math.round(
              ((course.originalPrice - course.price) / course.originalPrice) * 100
            );

            return (
              <Card
                key={course.id}
                className="overflow-hidden border border-slate-200/90 rounded-2xl hover:border-primary-300 hover:shadow-xl transition-all duration-300 flex flex-col bg-white group"
              >
                {/* Thumbnail */}
                <div className="relative h-48 w-full overflow-hidden bg-slate-100">
                  <img
                    src={course.thumbnailUrl}
                    alt={course.title}
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                  <div className="absolute top-3 left-3 flex gap-2">
                    <Badge className="bg-primary-600/90 backdrop-blur-sm text-white font-semibold text-xs px-2.5 py-1">
                      {course.categoryBangla}
                    </Badge>
                  </div>
                  <div className="absolute top-3 right-3">
                    <Badge className="bg-rose-500 text-white font-bold text-xs shadow-md">
                      {discount}% OFF
                    </Badge>
                  </div>

                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-xs">
                    <span className="bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-md font-medium">
                      লেভেল: {course.level}
                    </span>
                    <span className="flex items-center gap-1 bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-md font-semibold text-amber-300">
                      <Star className="h-3.5 w-3.5 fill-amber-300 text-amber-300" />
                      {course.rating.toFixed(1)} ({course.totalRatings})
                    </span>
                  </div>
                </div>

                {/* Content */}
                <CardContent className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <h3 className="font-bold text-slate-900 text-base leading-snug line-clamp-2 group-hover:text-primary-600 transition-colors">
                      {course.title}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {course.tagline}
                    </p>
                  </div>

                  {/* Instructor */}
                  <div className="flex items-center gap-2.5 pt-2 border-t border-slate-100">
                    <img
                      src={course.instructor.avatar}
                      alt={course.instructor.name}
                      className="h-8 w-8 rounded-full object-cover border border-slate-200"
                    />
                    <div className="text-xs">
                      <p className="font-semibold text-slate-800 leading-tight">{course.instructor.name}</p>
                      <p className="text-slate-400 text-[11px] truncate max-w-[180px]">{course.instructor.role}</p>
                    </div>
                  </div>

                  {/* Metadata & Pricing */}
                  <div className="pt-3 border-t border-slate-100 space-y-3">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-slate-400" />
                        {course.duration}
                      </span>
                      <span className="flex items-center gap-1">
                        <BookOpen className="h-3.5 w-3.5 text-slate-400" />
                        {course.totalLessons} টি লেসন
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <div>
                        <div className="text-xl font-black text-primary-700">
                          ৳{course.price.toLocaleString()}
                        </div>
                        <div className="text-xs text-slate-400 line-through">
                          ৳{course.originalPrice.toLocaleString()}
                        </div>
                      </div>

                      <Link href={`/courses/${course.id}`}>
                        <Button size="sm" className="bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs px-3.5 py-2 rounded-lg shadow-sm">
                          বিস্তারিত দেখুন
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default async function CoursesPage() {
  const submittedCourses = await prisma.course.findMany({ where: { approvalStatus: 'APPROVED' }, include: { instructor: true, modules: { include: { lessons: true }, orderBy: { order: 'asc' } } } });
  const additionalCourses: Course[] = submittedCourses.map((course) => ({
    id: course.id, title: course.title, tagline: course.tagline, description: course.description,
    category: (['web-dev', 'data-science', 'app-dev', 'programming', 'system-design'].includes(course.category) ? course.category : 'programming') as Course['category'],
    categoryBangla: course.categoryBangla, level: course.level as Course['level'], rating: course.rating, totalRatings: course.totalRatings,
    studentsEnrolled: course.studentsEnrolled, duration: course.duration, totalLessons: course.totalLessons, price: course.price,
    originalPrice: course.originalPrice, thumbnailUrl: course.thumbnailUrl, instructor: course.instructor,
    learningOutcomes: JSON.parse(course.learningOutcomes), prerequisites: JSON.parse(course.prerequisites), modules: course.modules,
  }));
  return (
    <Suspense fallback={
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    }>
      <CoursesCatalog additionalCourses={additionalCourses} />
    </Suspense>
  );
}
