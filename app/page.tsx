import React from 'react';
import Link from 'next/link';
import { 
  BookOpen, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  Star, 
  Users, 
  Clock, 
  GraduationCap, 
  ShieldCheck, 
  Code2, 
  Laptop, 
  Trophy,
  PlayCircle
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { COURSES_DATA } from '@/lib/courses-data';

export default function HomePage() {
  const featuredCourses = COURSES_DATA.slice(0, 3);

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-primary-950 to-slate-900 text-white p-8 md:p-14 lg:p-16 shadow-2xl border border-slate-800">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-primary-600/20 via-transparent to-transparent"></div>
        <div className="relative z-10 max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary-500/10 border border-primary-500/30 text-primary-300 text-xs font-semibold backdrop-blur-sm">
            <Sparkles className="h-3.5 w-3.5 text-primary-400" />
            <span>আধুনিক স্কিল শিখুন নিজের মাতৃভাষায়</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
            দক্ষতা অর্জন করুন, <br />
            <span className="bg-gradient-to-r from-primary-400 via-sky-300 to-indigo-300 bg-clip-text text-transparent">
              নিজের ভবিষ্যৎ গড়ুন
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-300 max-w-2xl leading-relaxed">
            e-Shikho তে এক্সপার্ট ইন্সট্রাক্টরদের কাছ থেকে শিখুন ওয়েব ডেভেলপমেন্ট, ডাটা সায়েন্স, সিস্টেম ডিজাইন এবং সফটওয়্যার ইঞ্জিনিয়ারিং। প্রজেক্ট ভিত্তিক শিক্ষা নিয়ে ক্যারিয়ারে এগিয়ে থাকুন।
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <Link href="/courses">
              <Button size="lg" className="bg-primary-600 hover:bg-primary-500 text-white font-semibold px-6 py-3 shadow-lg shadow-primary-600/30 flex items-center gap-2 text-base">
                <BookOpen className="h-5 w-5" />
                <span>সকল কোর্স দেখুন</span>
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg" className="bg-white/10 hover:bg-white/20 text-white border-white/20 font-medium px-6 py-3 backdrop-blur-sm text-base">
                <span>লগইন করুন</span>
              </Button>
            </Link>
          </div>

          {/* Quick trust metrics */}
          <div className="pt-6 border-t border-white/10 flex flex-wrap items-center gap-6 sm:gap-10 text-xs sm:text-sm text-slate-300">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span>১০০% প্রজেক্ট ভিত্তিক শিক্ষা</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span>লাইফটাইম কোর্স অ্যাক্সেস</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span>ইন্ডাস্ট্রি রিকগনাইজড সার্টিফিকেট</span>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Counter Section */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
        {[
          { label: 'সক্রিয় শিক্ষার্থী', value: '১০,০০০+', icon: Users, color: 'text-blue-600' },
          { label: 'প্রফেশনাল কোর্স', value: '৫০+', icon: Laptop, color: 'text-indigo-600' },
          { label: 'শিক্ষার্থী সন্তুষ্টি', value: '৯৮%', icon: Star, color: 'text-amber-500' },
          { label: 'মেন্টর সাপোর্ট', value: '২৪/৭', icon: Trophy, color: 'text-emerald-600' },
        ].map((stat, i) => (
          <Card key={i} className="p-6 bg-white border border-slate-200/80 shadow-sm text-center hover:shadow-md transition">
            <div className={`h-10 w-10 mx-auto rounded-full bg-slate-50 flex items-center justify-center ${stat.color} mb-3`}>
              <stat.icon className="h-5 w-5" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">{stat.value}</div>
            <div className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">{stat.label}</div>
          </Card>
        ))}
      </section>

      {/* Featured Courses Section */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <Badge className="bg-primary-50 text-primary-700 border-primary-200 mb-2 font-medium">
              জনপ্রিয় কোর্সসমূহ
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
              আমাদের সেরা কোর্সগুলো এক্সপ্লোর করুন
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              যেকোনো কোর্স বেছে নিয়ে বিস্তারিত জানুন এবং এনরোল করুন
            </p>
          </div>
          <Link href="/courses">
            <Button variant="outline" className="border-slate-300 text-slate-700 hover:text-primary-600 hover:border-primary-600 flex items-center gap-1.5 text-sm">
              <span>সকল কোর্স ({COURSES_DATA.length}টি)</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredCourses.map((course) => {
            const discount = Math.round(
              ((course.originalPrice - course.price) / course.originalPrice) * 100
            );

            return (
              <Card
                key={course.id}
                className="overflow-hidden border border-slate-200 hover:border-primary-300 hover:shadow-lg transition-all duration-300 flex flex-col bg-white group"
              >
                {/* Thumbnail */}
                <div className="relative h-48 w-full overflow-hidden bg-slate-100">
                  <img
                    src={course.thumbnailUrl}
                    alt={course.title}
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3 flex gap-2">
                    <Badge className="bg-primary-600 text-white font-semibold text-xs shadow">
                      {course.categoryBangla}
                    </Badge>
                  </div>
                  <div className="absolute top-3 right-3">
                    <Badge className="bg-rose-500 text-white font-bold text-xs shadow">
                      {discount}% ছাড়
                    </Badge>
                  </div>
                </div>

                {/* Content */}
                <CardContent className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span className="flex items-center gap-1 text-amber-500 font-semibold">
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                        {course.rating.toFixed(1)} ({course.totalRatings})
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5 text-slate-400" />
                        {course.studentsEnrolled.toLocaleString()} জন শিক্ষার্থী
                      </span>
                    </div>

                    <h3 className="font-bold text-slate-900 text-base line-clamp-2 group-hover:text-primary-600 transition-colors">
                      {course.title}
                    </h3>

                    <p className="text-xs text-slate-500 line-clamp-2">
                      {course.tagline}
                    </p>
                  </div>

                  {/* Metadata & Pricing */}
                  <div className="pt-3 border-t border-slate-100 space-y-3">
                    <div className="flex items-center justify-between text-xs text-slate-600">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-slate-400" />
                        {course.duration}
                      </span>
                      <span className="flex items-center gap-1">
                        <BookOpen className="h-3.5 w-3.5 text-slate-400" />
                        {course.totalLessons} টি লেসন
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-baseline gap-2">
                        <span className="text-xl font-extrabold text-primary-700">
                          ৳{course.price.toLocaleString()}
                        </span>
                        <span className="text-xs text-slate-400 line-through">
                          ৳{course.originalPrice.toLocaleString()}
                        </span>
                      </div>

                      <Link href={`/courses/${course.id}`}>
                        <Button size="sm" className="bg-primary-600 hover:bg-primary-700 text-white font-medium text-xs px-3">
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
      </section>

      {/* Feature Highlights Section */}
      <section className="bg-slate-50 rounded-2xl p-8 md:p-12 border border-slate-200/80 space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <Badge className="bg-primary-100 text-primary-800 border-primary-200">
            কেন e-Shikho বেছে নেবেন?
          </Badge>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
            প্রফেশনাল স্কিল ডেভেলপমেন্টের সেরা সমাধান
          </h2>
          <p className="text-sm text-slate-500">
            আমরা শুধু থিওরি নয়, বাস্তব প্রজেক্ট তৈরির মাধ্যমে শিক্ষার্থীদের ইন্ডাস্ট্রির জন্য যোগ্য করে তুলি।
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <div className="h-10 w-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
              <Code2 className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-lg">হ্যান্ডস-অন প্রজেক্ট</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              প্রতিটি কোর্সের সাথে রয়েছে একাধিক রিয়েল-ওয়ার্ল্ড প্রজেক্ট যা আপনার পোর্টফোলিওকে সমৃদ্ধ করবে।
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <div className="h-10 w-10 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <GraduationCap className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-lg">ভেরিফায়েড সার্টিফিকেট</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              কোর্স ও কুইজ সফলভাবে সম্পন্ন করার পর পাবেন ইউনিক ভেরিফিকেশন কোডসহ ইন্ডাস্ট্রি রিকগনাইজড সার্টিফিকেট।
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <div className="h-10 w-10 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-lg">সহজ ও নিরাপদ পেমেন্ট</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              bKash, Nagad, কার্ড এবং অনলাইন ব্যাংকিংয়ের মাধ্যমে যেকোনো সময় নিরাপদে কোর্স ক্রয় করতে পারবেন।
            </p>
          </div>
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="bg-gradient-to-r from-primary-600 to-indigo-700 rounded-2xl text-white p-8 md:p-12 text-center space-y-6 shadow-xl">
        <div className="max-w-2xl mx-auto space-y-3">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold">
            আজই আপনার পছন্দের কোর্স শুরু করুন
          </h2>
          <p className="text-primary-100 text-sm sm:text-base">
            হাজারো শিক্ষার্থীর সাথে যুক্ত হয়ে আপনার ক্যারিয়ারকে নিয়ে যান অনন্য উচ্চতায়।
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-4">
          <Link href="/courses">
            <Button size="lg" className="bg-white text-primary-700 hover:bg-slate-100 font-bold px-8 shadow-md">
              কোর্সসমূহ ব্রাউজ করুন
            </Button>
          </Link>
          <Link href="/login">
            <Button variant="outline" size="lg" className="bg-transparent border-white text-white hover:bg-white/10 font-semibold px-8">
              লগইন / সাইন ইন
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
