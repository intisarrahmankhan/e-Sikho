import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { 
  BookOpen, 
  Clock, 
  Star, 
  Users, 
  CheckCircle2, 
  Award, 
  ChevronLeft, 
  PlayCircle, 
  FileText, 
  ShieldCheck, 
  Share2,
  Lock,
  Sparkles
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { getCourseById, COURSES_DATA } from "@/lib/courses-data";

interface Props {
  params: {
    id: string;
  };
}

export function generateStaticParams() {
  return COURSES_DATA.map((course) => ({
    id: course.id,
  }));
}

export default function CourseDetailsPage({ params }: Props) {
  const course = getCourseById(params.id);

  if (!course) {
    notFound();
  }

  const discountPercent = Math.round(
    ((course.originalPrice - course.price) / course.originalPrice) * 100
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-16">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Link 
          href="/courses" 
          className="inline-flex items-center gap-1 hover:text-primary-600 transition"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>সকল কোর্সসমূহ</span>
        </Link>
        <span>/</span>
        <span className="text-slate-900 font-medium truncate">{course.title}</span>
      </div>

      {/* Main Grid: Content (Left 2 cols) & Sidebar (Right 1 col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column: Details, Syllabus, Outcomes */}
        <div className="lg:col-span-2 space-y-8">
          {/* Header Banner */}
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-primary-600 text-white font-medium text-xs px-3 py-1">
                {course.categoryBangla}
              </Badge>
              <Badge variant="outline" className="text-slate-700 bg-white border-slate-200">
                লেভেল: {course.level}
              </Badge>
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 leading-tight">
              {course.title}
            </h1>

            <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
              {course.tagline}
            </p>

            {/* Quick Metrics */}
            <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-sm text-slate-600 pt-2 border-t border-slate-200">
              <div className="flex items-center gap-1.5 font-semibold text-amber-600">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                <span>{course.rating}</span>
                <span className="text-slate-400 font-normal">({course.totalRatings} রিভিউ)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Users className="h-4 w-4 text-slate-400" />
                <span>{course.studentsEnrolled.toLocaleString("bn-BD")} জন শিক্ষার্থী</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-slate-400" />
                <span>{course.duration}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <BookOpen className="h-4 w-4 text-slate-400" />
                <span>{course.totalLessons} টি লেসন</span>
              </div>
            </div>
          </div>

          {/* Video Preview / Hero Image */}
          <div className="relative rounded-2xl overflow-hidden shadow-md aspect-video bg-slate-900 border border-slate-200 group">
            <img
              src={course.thumbnailUrl}
              alt={course.title}
              className="w-full h-full object-cover opacity-85 group-hover:scale-102 transition duration-300"
            />
            <div className="absolute inset-0 bg-slate-900/40 flex items-center justify-center">
              <div className="flex flex-col items-center gap-2 text-white">
                <div className="h-14 w-14 rounded-full bg-primary-600/90 text-white flex items-center justify-center shadow-lg transform transition group-hover:scale-110">
                  <PlayCircle className="h-8 w-8 ml-0.5" />
                </div>
                <span className="text-xs font-semibold tracking-wide bg-slate-900/60 px-3 py-1 rounded-full backdrop-blur-sm">
                  কোর্স প্রিভিউ ভিডিও দেখুন
                </span>
              </div>
            </div>
          </div>

          {/* Course Overview / Description */}
          <div className="bg-white rounded-2xl p-6 md:p-8 border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary-600" />
              <span>কোর্স সম্পর্কে বিস্তারিত</span>
            </h2>
            <p className="text-slate-600 leading-relaxed text-sm md:text-base">
              {course.description}
            </p>
          </div>

          {/* Learning Outcomes */}
          <div className="bg-white rounded-2xl p-6 md:p-8 border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-xl font-bold text-slate-900">
              কোর্সটি থেকে আপনি যা যা শিখবেন
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              {course.learningOutcomes.map((outcome, idx) => (
                <div key={idx} className="flex items-start gap-3 text-sm text-slate-700">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{outcome}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Curriculum / Syllabus */}
          <div className="bg-white rounded-2xl p-6 md:p-8 border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">কোর্স কারিকুলাম ও সিলেবাস</h2>
                <p className="text-xs text-slate-500 mt-1">
                  মোট {course.modules.length} টি মডিউল • {course.totalLessons} টি লেসন
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {course.modules.map((module, mIdx) => (
                <div key={module.id} className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="bg-slate-50 px-5 py-3.5 flex items-center justify-between border-b border-slate-200">
                    <span className="font-semibold text-slate-900 text-sm md:text-base">
                      {module.title}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      {module.duration}
                    </span>
                  </div>
                  <div className="divide-y divide-slate-100 bg-white">
                    {module.lessons.map((lesson) => (
                      <div
                        key={lesson.id}
                        className="px-5 py-3 flex items-center justify-between text-xs sm:text-sm hover:bg-slate-50 transition"
                      >
                        <div className="flex items-center gap-3">
                          {lesson.isFree ? (
                            <PlayCircle className="h-4 w-4 text-primary-600" />
                          ) : (
                            <Lock className="h-4 w-4 text-slate-400" />
                          )}
                          <span className={lesson.isFree ? "font-medium text-slate-900" : "text-slate-600"}>
                            {lesson.title}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          {lesson.isFree && (
                            <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 text-[10px] font-semibold border-emerald-200">
                              ফ্রি প্রিভিউ
                            </Badge>
                          )}
                          <span className="text-slate-400 text-xs">{lesson.duration}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Prerequisites */}
          <div className="bg-white rounded-2xl p-6 md:p-8 border border-slate-200 shadow-sm space-y-3">
            <h2 className="text-xl font-bold text-slate-900">কোর্সের পূর্বশর্ত</h2>
            <ul className="list-disc list-inside space-y-1.5 text-sm text-slate-600">
              {course.prerequisites.map((req, idx) => (
                <li key={idx}>{req}</li>
              ))}
            </ul>
          </div>

          {/* Instructor Bio */}
          <div className="bg-white rounded-2xl p-6 md:p-8 border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-xl font-bold text-slate-900">ইন্সট্রাক্টর পরিচিতি</h2>
            <div className="flex items-start gap-4">
              <img
                src={course.instructor.avatar}
                alt={course.instructor.name}
                className="h-16 w-16 rounded-full object-cover border-2 border-primary-100 shadow-sm"
              />
              <div className="space-y-1">
                <h3 className="font-bold text-slate-900 text-lg">{course.instructor.name}</h3>
                <p className="text-xs text-primary-600 font-semibold">{course.instructor.role}</p>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed pt-1">
                  {course.instructor.bio}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Sticky Pricing & Enrollment Card */}
        <div className="lg:sticky lg:top-6 space-y-6">
          <Card className="border-slate-200 shadow-xl overflow-hidden bg-white">
            <div className="bg-gradient-to-r from-primary-600 to-primary-800 p-6 text-white text-center">
              <span className="text-xs font-medium uppercase tracking-wider text-primary-100">
                কোর্স ফি ও ভর্তি
              </span>
              <div className="flex items-baseline justify-center gap-2 mt-2">
                <span className="text-3xl sm:text-4xl font-black">
                  ৳{course.price.toLocaleString("bn-BD")}
                </span>
                {course.originalPrice > course.price && (
                  <span className="text-sm line-through text-primary-200">
                    ৳{course.originalPrice.toLocaleString("bn-BD")}
                  </span>
                )}
              </div>
              {discountPercent > 0 && (
                <div className="inline-block mt-2 bg-yellow-400 text-slate-900 text-xs font-bold px-2.5 py-0.5 rounded-full">
                  সীমিত সময়ের জন্য {discountPercent}% ছাড়!
                </div>
              )}
            </div>

            <CardContent className="p-6 space-y-6">
              <Button size="lg" className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold text-base shadow-md py-6">
                এখনই কোর্সে ভর্তি হোন
              </Button>

              <div className="space-y-3 pt-2 border-t border-slate-100">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  এই কোর্সে যা যা পাচ্ছেন:
                </h4>
                <div className="space-y-2.5 text-xs sm:text-sm text-slate-600">
                  <div className="flex items-center gap-2.5">
                    <Clock className="h-4 w-4 text-primary-600" />
                    <span>{course.duration} অন-ডিমান্ড রেকর্ডেড ভিডিও</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <FileText className="h-4 w-4 text-primary-600" />
                    <span>রিসোর্স ফাইল ও সোর্স কোড ডাউনলোড</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Award className="h-4 w-4 text-primary-600" />
                    <span>কোর্স সমাপ্তি সার্টিফিকেট</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Users className="h-4 w-4 text-primary-600" />
                    <span>ডেডিকেটেড ডিসকর্ড/কমিউনিটি সাপোর্ট</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-primary-600" />
                    <span>আজীবন (Lifetime) অ্যাক্সেস</span>
                  </div>
                </div>
              </div>

              <div className="rounded-xl bg-slate-50 p-4 border border-slate-200 text-center space-y-1">
                <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-800">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  <span>৭ দিনের মানিব্যাক গ্যারান্টি</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  কোর্স পছন্দ না হলে কোনো প্রশ্ন ছাড়াই সম্পূর্ণ রিফান্ড পাবেন।
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
