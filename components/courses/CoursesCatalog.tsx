"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  BookOpen,
  Clock,
  Star,
  Search,
  Layers,
  Code2,
  BrainCircuit,
  Laptop,
  Sparkles,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { COURSES_DATA, Course } from "@/lib/courses-data";
import { useLanguage } from "@/context/LanguageContext";

type SortOption = "popular" | "newest" | "price-low" | "price-high" | "rating";

export function CoursesCatalog({ additionalCourses = [] }: { additionalCourses?: Course[] }) {
  const { t, language } = useLanguage();
  const searchParams = useSearchParams();

  const initialCategory = searchParams.get("category") || "all";
  const initialSearch = searchParams.get("search") || "";

  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [selectedLevel, setSelectedLevel] = useState<string>("all");
  const [sortBy, setSortBy] = useState<SortOption>("popular");

  const categories = [
    { id: "all", label: t("courses.allCourses", "সকল কোর্স"), icon: Layers },
    { id: "web-dev", label: t("courses.webDev", "ওয়েব ডেভেলপমেন্ট"), icon: Code2 },
    { id: "data-science", label: t("courses.dataScience", "ডাটা সায়েন্স ও এআই"), icon: BrainCircuit },
    { id: "programming", label: t("courses.programming", "প্রোগ্রামিং ও ডিএসএ"), icon: Laptop },
    { id: "system-design", label: t("courses.systemDesign", "সিস্টেম ডিজাইন"), icon: Layers },
    { id: "app-dev", label: t("courses.appDev", "অ্যাপ ডেভেলপমেন্ট"), icon: Sparkles },
  ];

  const levels = [
    { id: "all", label: t("courses.allLevels", "সকল লেভেল") },
    { id: "বিগিনার", label: t("courses.beginner", "বিগিনার") },
    { id: "ইন্টারমিডিয়েট", label: t("courses.intermediate", "ইন্টারমিডিয়েট") },
    { id: "অ্যাডভান্সড", label: t("courses.advanced", "অ্যাডভান্সড") },
  ];

  const filteredCourses = useMemo(() => {
    // Deduplicate courses by id/title, prioritizing dynamic DB courses
    const courseMap = new Map<string, Course>();
    for (const course of COURSES_DATA) {
      courseMap.set(course.id, course);
      courseMap.set(course.title, course);
    }
    for (const course of additionalCourses) {
      courseMap.set(course.id, course);
      courseMap.set(course.title, course);
    }
    const combinedCourses = Array.from(new Set(courseMap.values()));

    let result = combinedCourses.filter((course) => {
      const matchesCategory = selectedCategory === "all" || course.category === selectedCategory;
      const matchesLevel = selectedLevel === "all" || course.level === selectedLevel;
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        course.title.toLowerCase().includes(q) ||
        (course.titleEn && course.titleEn.toLowerCase().includes(q)) ||
        course.tagline.toLowerCase().includes(q) ||
        (course.taglineEn && course.taglineEn.toLowerCase().includes(q)) ||
        (course.instructor?.name && course.instructor.name.toLowerCase().includes(q)) ||
        (course.categoryBangla && course.categoryBangla.toLowerCase().includes(q));
      return matchesCategory && matchesLevel && matchesSearch;
    });

    switch (sortBy) {
      case "price-low": result.sort((a, b) => a.price - b.price); break;
      case "price-high": result.sort((a, b) => b.price - a.price); break;
      case "rating": result.sort((a, b) => b.rating - a.rating); break;
      default: result.sort((a, b) => b.studentsEnrolled - a.studentsEnrolled); break;
    }
    return result;
  }, [searchQuery, selectedCategory, selectedLevel, sortBy, additionalCourses]);

  const hasActiveFilters =
    searchQuery !== "" || selectedCategory !== "all" || selectedLevel !== "all" || sortBy !== "popular";

  const resetFilters = () => {
    setSearchQuery("");
    setSelectedCategory("all");
    setSelectedLevel("all");
    setSortBy("popular");
  };

  return (
    <div className="space-y-8 pb-16 max-w-7xl mx-auto px-4 sm:px-6">

      {/* ── Page Header ── */}
      <div className="pt-6 pb-2 border-b border-gray-200">
        <p className="text-xs font-semibold text-primary-600 uppercase tracking-wider mb-1">
          {t("courses.explore", "এক্সপ্লোর করুন")}
        </p>
        <h1 className="text-3xl font-bold text-gray-900">
          {t("courses.catalogTitle", "কোর্স ক্যাটালগ")}
        </h1>
        <p className="text-sm text-gray-500 mt-1 max-w-2xl">
          {t(
            "courses.catalogSubtitle",
            "প্রফেশনাল সফটওয়্যার ক্যারিয়ারের জন্য তৈরি আমাদের হ্যান্ডস-অন কোর্সগুলো ব্রাউজ করুন এবং আপনার উপযুক্ত কোর্সটি বেছে নিন।"
          )}
        </p>
      </div>

      {/* ── Search Bar ── */}
      <div className="relative flex items-center bg-white border border-gray-200 rounded-xl shadow-card overflow-hidden max-w-2xl">
        <Search className="h-4 w-4 text-gray-400 ml-3.5 shrink-0" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t("courses.searchPlaceholder", "কোর্সের নাম, টপিক বা ইন্সট্রাক্টর সার্চ করুন...")}
          className="w-full px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none bg-transparent"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 mr-1"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        <button className="bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold px-4 py-2.5 shrink-0">
          {language === "en" ? "Search" : "খুঁজুন"}
        </button>
      </div>

      {/* ── Category Chips ── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap border transition ${
                isSelected
                  ? "bg-primary-600 text-white border-primary-600"
                  : "bg-white text-gray-600 border-gray-200 hover:border-primary-300 hover:text-primary-600"
              }`}
            >
              <cat.icon className={`h-3.5 w-3.5 ${isSelected ? "text-white" : "text-gray-400"}`} />
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* ── Filter & Sort Bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-card">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            {language === "en" ? "Level:" : "লেভেল:"}
          </span>
          <div className="flex items-center gap-1.5 flex-wrap">
            {levels.map((lvl) => (
              <button
                key={lvl.id}
                onClick={() => setSelectedLevel(lvl.id)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${
                  selectedLevel === lvl.id
                    ? "bg-primary-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {lvl.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3 border-t sm:border-t-0 pt-3 sm:pt-0 border-gray-100">
          <span className="text-xs text-gray-500 font-medium">
            {language === "en" ? "Sort By:" : "সর্ট করুন:"}
          </span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="text-xs font-semibold bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-gray-700 focus:outline-none focus:ring-1 focus:ring-primary-500"
          >
            <option value="popular">{t("courses.sortPopular", "সর্বাধিক জনপ্রিয়")}</option>
            <option value="rating">{t("courses.sortRating", "সেরা রেটিং")}</option>
            <option value="price-low">{t("courses.sortPriceLow", "কম মূল্য থেকে বেশি")}</option>
            <option value="price-high">{t("courses.sortPriceHigh", "বেশি মূল্য থেকে কম")}</option>
          </select>

          {hasActiveFilters && (
            <button onClick={resetFilters} className="text-xs text-red-500 hover:text-red-600 font-medium underline">
              {t("courses.resetFilters", "ফিল্টার মুছুন")}
            </button>
          )}
        </div>
      </div>

      {/* ── Results Count ── */}
      <p className="text-xs text-gray-500 px-1">
        {language === "en" ? (
          <>Total <strong className="text-gray-900 font-bold">{filteredCourses.length}</strong> courses found</>
        ) : (
          <>মোট <strong className="text-gray-900 font-bold">{filteredCourses.length}</strong> টি কোর্স পাওয়া গেছে</>
        )}
      </p>

      {/* ── Courses Grid ── */}
      {filteredCourses.length === 0 ? (
        <div className="p-12 text-center bg-white border border-gray-200 rounded-xl space-y-4">
          <div className="h-12 w-12 mx-auto rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
            <Search className="h-5 w-5" />
          </div>
          <h3 className="text-base font-semibold text-gray-900">
            {t("courses.noCourses", "কোনো কোর্স পাওয়া যায়নি")}
          </h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            {t("courses.tryDifferentFilter", "আপনার অনুসন্ধান বা ফিল্টারের সাথে মিলে এমন কোনো কোর্স পাওয়া যায়নি।")}
          </p>
          <Button onClick={resetFilters} variant="outline" size="sm" className="border-gray-300 text-gray-700">
            {t("courses.allCourses", "সকল কোর্স দেখুন")}
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => {
            const discount = Math.round(((course.originalPrice - course.price) / course.originalPrice) * 100);
            const displayTitle = (language === 'en' && course.titleEn) ? course.titleEn : course.title;
            const displayTagline = (language === 'en' && course.taglineEn) ? course.taglineEn : course.tagline;
            const displayThumbnail = (language === 'en' && course.thumbnailUrlEn) ? course.thumbnailUrlEn : course.thumbnailUrl;
            const displayLevel = language === 'en'
              ? (course.level === 'বিগিনার' ? 'Beginner' : course.level === 'ইন্টারমিডিয়েট' ? 'Intermediate' : 'Advanced')
              : course.level;
            const displayCategory = language === 'en'
              ? (course.category === 'web-dev' ? 'Web Development' : course.category === 'data-science' ? 'Data Science' : course.category === 'programming' ? 'Programming' : course.category === 'system-design' ? 'System Design' : course.category === 'app-dev' ? 'App Development' : course.categoryBangla)
              : course.categoryBangla;

            return (
              <Card
                key={course.id}
                className="overflow-hidden border border-gray-200 rounded-xl hover:border-primary-300 hover:shadow-card-hover transition-all duration-200 flex flex-col bg-white group"
              >
                {/* Thumbnail */}
                <div className="relative h-48 w-full overflow-hidden bg-gray-100">
                  <img
                    src={displayThumbnail}
                    alt={displayTitle}
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-3 left-3">
                    <span className="text-xs font-semibold bg-primary-600 text-white px-2.5 py-1 rounded-md">
                      {displayCategory}
                    </span>
                  </div>
                  <div className="absolute top-3 right-3">
                    <span className="text-xs font-bold bg-red-500 text-white px-2 py-1 rounded-md">
                      {discount}% OFF
                    </span>
                  </div>
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                    <span className="text-xs bg-gray-900/70 text-white px-2.5 py-1 rounded-md font-medium">
                      {displayLevel}
                    </span>
                    <span className="flex items-center gap-1 text-xs bg-gray-900/70 text-white px-2.5 py-1 rounded-md">
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                      {course.rating.toFixed(1)} ({course.totalRatings})
                    </span>
                  </div>
                </div>

                {/* Content */}
                <CardContent className="p-5 flex-1 flex flex-col gap-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 text-base leading-snug line-clamp-2 group-hover:text-primary-600 transition">
                      {displayTitle}
                    </h3>
                    <p className="text-xs text-gray-400 mt-1 line-clamp-2 leading-relaxed">{displayTagline}</p>
                  </div>

                  {/* Instructor */}
                  <div className="flex items-center gap-2.5 pt-2 border-t border-gray-100">
                    <img
                      src={course.instructor.avatar}
                      alt={course.instructor.name}
                      className="h-8 w-8 rounded-full object-cover border border-gray-200"
                    />
                    <div className="text-xs">
                      <p className="font-semibold text-gray-800 leading-tight">{course.instructor.name}</p>
                      <p className="text-gray-400 text-[11px] truncate max-w-[180px]">{course.instructor.role}</p>
                    </div>
                  </div>

                  {/* Meta & Price */}
                  <div className="pt-3 border-t border-gray-100 space-y-3 mt-auto">
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{course.duration}</span>
                      <span className="text-gray-300">·</span>
                      <span className="flex items-center gap-1">
                        <BookOpen className="h-3.5 w-3.5" />
                        {course.totalLessons} {t("courses.lessons", "লেসন")}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xl font-bold text-primary-700">৳{course.price.toLocaleString()}</span>
                        <span className="text-xs text-gray-400 line-through ml-2">৳{course.originalPrice.toLocaleString()}</span>
                      </div>
                      <Link href={`/courses/${course.id}`}>
                        <Button size="sm" className="bg-primary-600 hover:bg-primary-700 text-white font-semibold text-xs px-4 py-2 rounded-lg">
                          {language === "en" ? "View Details" : "বিস্তারিত দেখুন"}
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

export default CoursesCatalog;
