import React from 'react';
import Link from 'next/link';
import {
  BookOpen,
  ArrowRight,
  CheckCircle2,
  Star,
  Users,
  Clock,
  GraduationCap,
  Code2,
  Laptop,
  Trophy,
  TrendingUp,
  BrainCircuit,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { COURSES_DATA } from '@/lib/courses-data';

export default function HomePage() {
  const featuredCourses = COURSES_DATA.slice(0, 3);

  const categories = [
    { id: 'web-dev',      name: 'ওয়েব ডেভেলপমেন্ট',    count: '১২টি কোর্স', icon: Code2,       iconColor: 'text-blue-600',    bg: 'bg-blue-50'    },
    { id: 'data-science', name: 'ডাটা সায়েন্স ও এআই',  count: '৮টি কোর্স',  icon: BrainCircuit, iconColor: 'text-violet-600', bg: 'bg-violet-50'  },
    { id: 'system-design',name: 'সিস্টেম ডিজাইন',       count: '৬টি কোর্স',  icon: Layers,       iconColor: 'text-teal-600',   bg: 'bg-teal-50'    },
    { id: 'programming',  name: 'প্রোগ্রামিং ও ডিএসএ', count: '১৫টি কোর্স', icon: Laptop,       iconColor: 'text-amber-600',  bg: 'bg-amber-50'   },
  ];

  const testimonials = [
    {
      name: 'আরিফুল ইসলাম',
      role: 'জুনিয়র সফটওয়্যার ইঞ্জিনিয়ার, Brain Station 23',
      content: 'e-Shikho এর ফুলস্ট্যাক কোর্সটি আমার ক্যারিয়ার বদলে দিয়েছে। প্রজেক্ট ভিত্তিক শিক্ষা আর মেন্টরদের গাইডেন্স অসাধারণ!',
      rating: 5,
      course: 'Next.js Fullstack',
    },
    {
      name: 'সামিয়া রহমান',
      role: 'ডাটা অ্যানালিস্ট, Optimizely',
      content: 'পাইথন এবং ডাটা সায়েন্স বুটক্যাম্পের রিয়েল-লাইফ ডেটাসেট নিয়ে কাজ করার অভিজ্ঞতা আমাকে ইন্টারভিউতে এগিয়ে রেখেছে।',
      rating: 5,
      course: 'Python & Data Science',
    },
    {
      name: 'মাহমুদুল হাসান',
      role: 'কম্পিটিটিভ প্রোগ্রামার (ক্যান্ডিডেট মাস্টার)',
      content: 'বাংলায় সি++ এবং ডেটা স্ট্রাকচারের এত গভীর ও গোছানো কনটেন্ট আগে কোথাও পাইনি।',
      rating: 5,
      course: 'Competitive Programming',
    },
  ];

  const steps = [
    { step: '01', title: 'কোর্স বেছে নিন',    desc: 'আপনার পছন্দের ট্র্যাক অনুযায়ী বিগিনার বা অ্যাডভান্সড কোর্স সিলেক্ট করুন।' },
    { step: '02', title: 'হ্যান্ডস-অন লার্নিং', desc: 'ইন্টারেক্টিভ ভিডিও এবং প্রজেক্টের মাধ্যমে কোডিং প্র্যাকটিস করুন।' },
    { step: '03', title: 'কুইজ ও টেস্ট',      desc: 'মডিউল ভিত্তিক কুইজ দিয়ে নিজের দক্ষতা মূল্যায়ন ও রেটিং বৃদ্ধি করুন।' },
    { step: '04', title: 'সার্টিফিকেট ও জব',  desc: 'সার্টিফিকেট অর্জন করুন এবং পোর্টফোলিও দিয়ে চাকরির জন্য আবেদন করুন।' },
  ];

  return (
    <div className="pb-20 max-w-7xl mx-auto space-y-16 px-4 sm:px-6">

      {/* ── Hero ── */}
      <section className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div className="space-y-6">
          <span className="inline-flex items-center gap-2 bg-primary-50 border border-primary-200 text-primary-700 text-xs font-semibold px-3 py-1.5 rounded-full">
            <GraduationCap className="h-3.5 w-3.5" />
            বাংলাদেশের প্রফেশনাল লার্নিং প্ল্যাটফর্ম
          </span>

          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 leading-tight tracking-tight">
            প্রফেশনাল স্কিল শিখুন,{' '}
            <span className="text-primary-600">ক্যারিয়ারে এগিয়ে যান</span>
          </h1>

          <p className="text-base text-gray-500 leading-relaxed max-w-lg">
            ইন্ডাস্ট্রি এক্সপার্টদের সাথে শিখুন ফুলস্ট্যাক ডেভেলপমেন্ট, ডাটা সায়েন্স, এআই এবং সিস্টেম আর্কিটেকচার। হ্যান্ডস-অন প্রজেক্ট তৈরি করে নিজেকে চাকরির জন্য প্রস্তুত করুন।
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <Link href="/courses">
              <Button className="bg-primary-600 hover:bg-primary-700 text-white font-semibold px-6 py-2.5 rounded-lg flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                কোর্সগুলো দেখুন
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold px-6 py-2.5 rounded-lg">
                লগইন করুন
              </Button>
            </Link>
          </div>

          <div className="flex flex-wrap gap-4 pt-2 text-sm text-gray-500">
            {['প্রজেক্ট ভিত্তিক পাঠ্যক্রম', 'লাইফটাইম অ্যাক্সেস', 'ইন্ডাস্ট্রি সার্টিফিকেট'].map((item) => (
              <span key={item} className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                {item}
              </span>
            ))}
          </div>
        </div>

        {/* Hero right — stat card */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-card space-y-5">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <div>
              <p className="font-semibold text-gray-900 text-sm">লাইভ লার্নিং ড্যাশবোর্ড</p>
              <p className="text-xs text-gray-400 mt-0.5">রিয়েল-টাইম প্রোগ্রেস ও কুইজ</p>
            </div>
            <span className="text-xs font-semibold text-green-700 bg-green-50 border border-green-200 px-2.5 py-1 rounded-full">Active</span>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs text-gray-600">
              <span>ফুলস্ট্যাক Next.js বুটক্যাম্প</span>
              <span className="font-semibold text-primary-600">৭৮% সম্পন্ন</span>
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-primary-600 rounded-full w-[78%]" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Elo Rating', value: '১৪৫০', color: 'text-amber-600' },
              { label: 'Study Streak 🔥', value: '১২ দিন', color: 'text-green-600' },
            ].map((s) => (
              <div key={s.label} className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-center">
                <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
                <div className="text-[11px] text-gray-400 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>

          <Link href="/courses" className="block">
            <div className="w-full py-2.5 rounded-lg border border-primary-200 text-primary-600 text-xs font-semibold text-center hover:bg-primary-50 transition">
              কোর্স ক্যাটালগে ব্রাউজ করুন →
            </div>
          </Link>
        </div>
      </section>

      {/* ── Stats Bar ── */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'সক্রিয় শিক্ষার্থী',         value: '১০,০০০+',   icon: Users,       color: 'text-blue-600 bg-blue-50'     },
          { label: 'ইন্ডাস্ট্রি স্ট্যান্ডার্ড কোর্স', value: '৫০+',       icon: Laptop,      color: 'text-indigo-600 bg-indigo-50'  },
          { label: 'শিক্ষার্থী সন্তুষ্টি রেটিং',   value: '৪.৯ / ৫.০', icon: Star,        color: 'text-amber-600 bg-amber-50'    },
          { label: 'ডেডিকেটেড মেন্টর সাপোর্ট',    value: '২৪/৭',      icon: Trophy,      color: 'text-green-600 bg-green-50'    },
        ].map((stat, i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-xl p-5 text-center shadow-card">
            <div className={`h-10 w-10 mx-auto rounded-lg flex items-center justify-center mb-3 ${stat.color}`}>
              <stat.icon className="h-5 w-5" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
            <div className="text-xs text-gray-500 mt-1">{stat.label}</div>
          </div>
        ))}
      </section>

      {/* ── Categories ── */}
      <section className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-primary-600 uppercase tracking-wider mb-1">বিষয়সমূহ</p>
            <h2 className="text-2xl font-bold text-gray-900">যে বিষয়ে আপনি শিখতে চান</h2>
          </div>
          <Link href="/courses" className="text-sm font-semibold text-primary-600 hover:text-primary-700 inline-flex items-center gap-1">
            সব দেখুন <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {categories.map((cat) => (
            <Link key={cat.id} href={`/courses?category=${cat.id}`}>
              <div className="bg-white border border-gray-200 rounded-xl p-4 hover:border-primary-300 hover:shadow-card-hover transition flex items-center gap-4 group">
                <div className={`h-11 w-11 rounded-lg ${cat.bg} flex items-center justify-center shrink-0`}>
                  <cat.icon className={`h-5 w-5 ${cat.iconColor}`} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm group-hover:text-primary-600 transition">{cat.name}</h3>
                  <p className="text-xs text-gray-400 mt-0.5">{cat.count}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Featured Courses ── */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-primary-600 uppercase tracking-wider mb-1">সেরা কোর্সসমূহ</p>
            <h2 className="text-2xl font-bold text-gray-900">জনপ্রিয় ও হাই-ডিমান্ড কোর্স</h2>
            <p className="text-sm text-gray-400 mt-1">যেকোনো কোর্স বেছে নিয়ে সম্পূর্ণ সিলেবাস দেখুন ও এখনই এনরোল করুন</p>
          </div>
          <Link href="/courses">
            <Button variant="outline" className="border-gray-300 text-gray-700 hover:border-primary-600 hover:text-primary-600 font-semibold gap-1.5 text-sm shrink-0">
              সকল কোর্স ({COURSES_DATA.length}টি) <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredCourses.map((course) => {
            const discount = Math.round(((course.originalPrice - course.price) / course.originalPrice) * 100);
            return (
              <Card key={course.id} className="overflow-hidden border border-gray-200 rounded-xl hover:shadow-card-hover hover:border-primary-200 transition-all duration-200 flex flex-col bg-white group">
                {/* Thumbnail */}
                <div className="relative h-48 w-full overflow-hidden bg-gray-100">
                  <img src={course.thumbnailUrl} alt={course.title} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  <div className="absolute top-3 left-3">
                    <span className="text-xs font-semibold bg-primary-600 text-white px-2.5 py-1 rounded-md">
                      {course.categoryBangla}
                    </span>
                  </div>
                  <div className="absolute top-3 right-3">
                    <span className="text-xs font-bold bg-red-500 text-white px-2 py-1 rounded-md">
                      {discount}% OFF
                    </span>
                  </div>
                </div>

                <CardContent className="p-5 flex-1 flex flex-col gap-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 text-base leading-snug line-clamp-2 group-hover:text-primary-600 transition">
                      {course.title}
                    </h3>
                    <p className="text-xs text-gray-400 mt-1 line-clamp-2 leading-relaxed">{course.tagline}</p>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-gray-500 pt-1 border-t border-gray-100">
                    <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{course.duration}</span>
                    <span className="text-gray-300">·</span>
                    <span className="flex items-center gap-1"><BookOpen className="h-3.5 w-3.5" />{course.totalLessons} লেসন</span>
                    <span className="text-gray-300">·</span>
                    <span className="flex items-center gap-1"><Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />{course.rating.toFixed(1)}</span>
                  </div>

                  <div className="flex items-center justify-between mt-auto">
                    <div>
                      <span className="text-xl font-bold text-primary-700">৳{course.price.toLocaleString()}</span>
                      <span className="text-xs text-gray-400 line-through ml-2">৳{course.originalPrice.toLocaleString()}</span>
                    </div>
                    <Link href={`/courses/${course.id}`}>
                      <Button className="bg-primary-600 hover:bg-primary-700 text-white font-semibold text-xs px-4 py-2 rounded-lg">
                        বিস্তারিত দেখুন
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* ── How it Works ── */}
      <section className="bg-white border border-gray-200 rounded-2xl p-8 sm:p-12 space-y-10">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <p className="text-xs font-semibold text-primary-600 uppercase tracking-wider">লার্নিং প্রসেস</p>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">যেভাবে আপনি সফল হবেন</h2>
          <p className="text-sm text-gray-500">একটি সুশৃঙ্খল ও প্রমাণিত পদ্ধতির মাধ্যমে আমরা প্রতিটি শিক্ষার্থীকে ইন্ডাস্ট্রি উপযোগী করে তুলি।</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {steps.map((item, i) => (
            <div key={i} className="space-y-3">
              <div className="text-3xl font-black text-gray-100">{item.step}</div>
              <h3 className="font-semibold text-gray-900 text-sm">{item.title}</h3>
              <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="space-y-8">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <p className="text-xs font-semibold text-primary-600 uppercase tracking-wider">শিক্ষার্থীদের মতামত</p>
          <h2 className="text-2xl font-bold text-gray-900">আমাদের সফল শিক্ষার্থীদের অভিজ্ঞতা</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t, idx) => (
            <div key={idx} className="bg-white border border-gray-200 rounded-xl p-6 shadow-card flex flex-col gap-4">
              <div className="flex gap-0.5">
                {[...Array(t.rating)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-sm text-gray-600 leading-relaxed flex-1">&quot;{t.content}&quot;</p>
              <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{t.name}</p>
                  <p className="text-xs text-gray-400">{t.role}</p>
                </div>
                <span className="text-[11px] text-primary-600 border border-primary-200 bg-primary-50 px-2 py-1 rounded-md font-medium">{t.course}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Bottom CTA ── */}
      <section className="bg-primary-700 rounded-2xl text-white p-8 sm:p-14 text-center space-y-6">
        <h2 className="text-2xl sm:text-3xl font-bold max-w-xl mx-auto leading-snug">
          আজই আপনার ভবিষ্যৎ গড়ার প্রথম পদক্ষেপ নিন
        </h2>
        <p className="text-primary-200 text-sm">
          হাজারো শিক্ষার্থীর সাথে যুক্ত হয়ে নতুন টেক স্কিল অর্জন করুন নিজের ভাষায়।
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/courses">
            <Button className="bg-white text-primary-700 hover:bg-gray-100 font-bold px-8 py-2.5 rounded-lg">
              কোর্সগুলো ব্রাউজ করুন
            </Button>
          </Link>
          <Link href="/login">
            <Button variant="outline" className="border-white/40 text-white hover:bg-white/10 font-semibold px-8 py-2.5 rounded-lg">
              লগইন / রেজিস্টার
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
