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
  PlayCircle,
  TrendingUp,
  BrainCircuit,
  MessageSquare,
  Award,
  Flame,
  Layers,
  ChevronRight
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { COURSES_DATA } from '@/lib/courses-data';

export default function HomePage() {
  const featuredCourses = COURSES_DATA.slice(0, 3);

  const categories = [
    { id: 'web-dev', name: 'ওয়েব ডেভেলপমেন্ট', count: '১২টি কোর্স', icon: Code2, color: 'from-blue-500/20 to-cyan-500/20 text-blue-600' },
    { id: 'data-science', name: 'ডাটা সায়েন্স ও এআই', count: '৮টি কোর্স', icon: BrainCircuit, color: 'from-purple-500/20 to-indigo-500/20 text-purple-600' },
    { id: 'system-design', name: 'সিস্টেম ডিজাইন', count: '৬টি কোর্স', icon: Layers, color: 'from-emerald-500/20 to-teal-500/20 text-emerald-600' },
    { id: 'programming', name: 'প্রোগ্রামিং ও ডিএসএ', count: '১৫টি কোর্স', icon: Laptop, color: 'from-amber-500/20 to-orange-500/20 text-amber-600' },
  ];

  const testimonials = [
    {
      name: 'আরিফুল ইসলাম',
      role: 'জুনিয়র সফটওয়্যার ইঞ্জিনিয়ার, Brain Station 23',
      content: 'e-Shikho এর ফুলস্ট্যাক কোর্সটি আমার ক্যারিয়ার বদলে দিয়েছে। প্রজেক্ট ভিত্তিক শিক্ষা আর মেন্টরদের গাইডেন্স অসাধারণ!',
      rating: 5,
      course: 'Next.js Fullstack'
    },
    {
      name: 'সামিয়া রহমান',
      role: 'ডাটা অ্যানালিস্ট, Optimizely',
      content: 'পাইথন এবং ডাটা সায়েন্স বুটক্যাম্পের রিয়েল-লাইফ ডেটাসেট নিয়ে কাজ করার অভিজ্ঞতা আমাকে ইন্টারভিউতে এগিয়ে রেখেছে।',
      rating: 5,
      course: 'Python & Data Science'
    },
    {
      name: 'মাহমুদুল হাসান',
      role: 'কম্পিটিটিভ প্রোগ্রামার (ক্যান্ডিডেট মাস্টার)',
      content: 'বাংলায় সি++ এবং ডেটা স্ট্রাকচারের এত গভীর ও গোছানো কনটেন্ট আগে কোথাও পাইনি।',
      rating: 5,
      course: 'Competitive Programming'
    }
  ];

  return (
    <div className="space-y-20 pb-20 max-w-7xl mx-auto">
      {/* ─── Hero Section ─── */}
      <section className="relative overflow-hidden rounded-3xl bg-slate-950 text-white p-8 sm:p-12 md:p-16 lg:p-20 shadow-2xl border border-slate-800">
        {/* Ambient Glows */}
        <div className="absolute top-0 right-1/4 -mt-24 w-96 h-96 bg-primary-600/25 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 -mb-24 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary-500/10 border border-primary-400/20 text-primary-300 text-xs font-semibold backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5 text-primary-400" />
              <span>বাংলাদেশের ১ নম্বর প্রফেশনাল লার্নিং প্ল্যাটফর্ম</span>
            </div>

            <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight text-white leading-[1.15]">
              প্রফেশনাল স্কিল শিখুন, <br />
              <span className="bg-gradient-to-r from-primary-400 via-sky-300 to-indigo-300 bg-clip-text text-transparent">
                ক্যারিয়ারে সেরা হোন
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-300 max-w-xl leading-relaxed font-normal">
              e-Shikho তে ইন্ডাস্ট্রি এক্সপার্টদের সাথে শিখুন ফুলস্ট্যাক ডেভেলপমেন্ট, ডাটা সায়েন্স, এআই এবং সিস্টেম আর্কিটেকচার। হ্যান্ডস-অন প্রজেক্ট তৈরি করে নিজেকে চাকরির জন্য প্রস্তুত করুন।
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link href="/courses">
                <Button size="lg" className="bg-primary-600 hover:bg-primary-500 text-white font-bold px-7 py-3.5 rounded-xl shadow-lg shadow-primary-600/30 flex items-center gap-2 text-base transition-all hover:scale-[1.02]">
                  <BookOpen className="h-5 w-5" />
                  <span>কোর্সগুলো দেখুন</span>
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="outline" size="lg" className="bg-white/5 hover:bg-white/10 text-white border-white/20 font-semibold px-6 py-3.5 rounded-xl backdrop-blur-sm text-base transition">
                  <span>সাইন ইন / লগইন</span>
                </Button>
              </Link>
            </div>

            {/* Micro proof badges */}
            <div className="pt-6 border-t border-slate-800/80 grid grid-cols-3 gap-3 text-xs sm:text-sm text-slate-300">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>প্রজেক্ট ভিত্তিক পাঠ্যক্রম</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>লাইফটাইম অ্যাক্সেস</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>ইন্ডাস্ট্রি সার্টিফিকেট</span>
              </div>
            </div>
          </div>

          {/* Hero Right Visual Card */}
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-2xl bg-gradient-to-b from-slate-800/80 to-slate-900/90 border border-slate-700/60 p-6 shadow-2xl backdrop-blur-xl space-y-5">
              <div className="flex items-center justify-between border-b border-slate-700/60 pb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary-600/20 border border-primary-500/30 flex items-center justify-center text-primary-400 font-bold">
                    <Flame className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">লাইভ লার্নিং ড্যাশবোর্ড</h4>
                    <p className="text-xs text-slate-400">রিয়েল-টাইম প্রোগ্রেস ও কুইজ</p>
                  </div>
                </div>
                <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs">
                  Active
                </Badge>
              </div>

              {/* Mini Preview Box */}
              <div className="space-y-3">
                <div className="flex justify-between text-xs text-slate-300">
                  <span>ফুলস্ট্যাক Next.js বুটক্যাম্প</span>
                  <span className="font-semibold text-primary-400">৭৮% সম্পন্ন</span>
                </div>
                <div className="w-full h-2.5 bg-slate-700/60 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-primary-500 to-emerald-400 rounded-full w-[78%]" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="bg-slate-800/60 border border-slate-700/50 p-3 rounded-xl text-center">
                  <div className="text-lg font-black text-amber-400">১৪৫০</div>
                  <div className="text-[11px] text-slate-400 font-medium">Elo Rating</div>
                </div>
                <div className="bg-slate-800/60 border border-slate-700/50 p-3 rounded-xl text-center">
                  <div className="text-lg font-black text-emerald-400">১২ দিন</div>
                  <div className="text-[11px] text-slate-400 font-medium">Study Streak 🔥</div>
                </div>
              </div>

              <Link href="/courses" className="block">
                <div className="p-3 rounded-xl bg-primary-600/20 hover:bg-primary-600/30 border border-primary-500/30 text-center transition cursor-pointer flex items-center justify-center gap-2 text-xs font-semibold text-primary-300">
                  <PlayCircle className="h-4 w-4" />
                  <span>কোর্স ক্যাটালগে ব্রাউজ করুন</span>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Stats Bar ─── */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
        {[
          { label: 'সক্রিয় শিক্ষার্থী', value: '১০,০০০+', icon: Users, color: 'text-blue-600 bg-blue-50 border-blue-100' },
          { label: 'ইন্ডাস্ট্রি স্ট্যান্ডার্ড কোর্স', value: '৫০+', icon: Laptop, color: 'text-indigo-600 bg-indigo-50 border-indigo-100' },
          { label: 'শিক্ষার্থী সন্তুষ্টি রেটিং', value: '৪.৯ / ৫.০', icon: Star, color: 'text-amber-600 bg-amber-50 border-amber-100' },
          { label: 'ডেডিকেটেড মেন্টর সাপোর্ট', value: '২৪/৭', icon: Trophy, color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
        ].map((stat, i) => (
          <div key={i} className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm text-center hover:shadow-md transition">
            <div className={`h-12 w-12 mx-auto rounded-xl flex items-center justify-center ${stat.color} border mb-3`}>
              <stat.icon className="h-6 w-6" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">{stat.value}</div>
            <div className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">{stat.label}</div>
          </div>
        ))}
      </section>

      {/* ─── Popular Categories ─── */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Badge className="bg-primary-50 text-primary-700 border-primary-200 mb-1.5">
              ক্যাটাগরি
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
              যে বিষয়ে আপনি শিখতে চান
            </h2>
          </div>
          <Link href="/courses" className="text-sm font-semibold text-primary-600 hover:text-primary-700 inline-flex items-center gap-1">
            <span>সব দেখুন</span>
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {categories.map((cat) => (
            <Link key={cat.id} href={`/courses?category=${cat.id}`}>
              <div className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-primary-300 hover:shadow-md transition duration-200 flex items-center gap-4 group cursor-pointer">
                <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${cat.color} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
                  <cat.icon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm group-hover:text-primary-600 transition-colors">
                    {cat.name}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">{cat.count}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ─── Featured Courses Section ─── */}
      <section className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <Badge className="bg-primary-50 text-primary-700 border-primary-200 mb-1.5">
              সেরা কোর্সসমূহ
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
              জনপ্রিয় ও হাই-ডিমান্ড কোর্সসমূহ
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              যেকোনো কোর্স বেছে নিয়ে সম্পূর্ণ সিলেবাস দেখুন ও এখনই এনরোল করুন
            </p>
          </div>
          <Link href="/courses">
            <Button variant="outline" className="border-slate-300 hover:border-primary-600 hover:text-primary-600 font-semibold gap-1.5 text-sm">
              <span>সকল কোর্স ({COURSES_DATA.length}টি)</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
          {featuredCourses.map((course) => {
            const discount = Math.round(
              ((course.originalPrice - course.price) / course.originalPrice) * 100
            );

            return (
              <Card
                key={course.id}
                className="overflow-hidden border border-slate-200/90 rounded-2xl hover:border-primary-300 hover:shadow-xl transition-all duration-300 flex flex-col bg-white group"
              >
                {/* Thumbnail */}
                <div className="relative h-52 w-full overflow-hidden bg-slate-100">
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
                <CardContent className="p-6 flex-1 flex flex-col justify-between space-y-5">
                  <div className="space-y-3">
                    <h3 className="font-bold text-slate-900 text-lg leading-snug line-clamp-2 group-hover:text-primary-600 transition-colors">
                      {course.title}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {course.tagline}
                    </p>
                  </div>

                  {/* Instructor */}
                  <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
                    <img
                      src={course.instructor.avatar}
                      alt={course.instructor.name}
                      className="h-9 w-9 rounded-full object-cover border border-slate-200"
                    />
                    <div className="text-xs">
                      <p className="font-semibold text-slate-800">{course.instructor.name}</p>
                      <p className="text-slate-400">{course.instructor.role}</p>
                    </div>
                  </div>

                  {/* Metadata & Price */}
                  <div className="pt-3 border-t border-slate-100 space-y-4">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-slate-400" />
                        {course.duration}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <BookOpen className="h-3.5 w-3.5 text-slate-400" />
                        {course.totalLessons} টি লেসন
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <div>
                        <div className="text-2xl font-black text-primary-700">
                          ৳{course.price.toLocaleString()}
                        </div>
                        <div className="text-xs text-slate-400 line-through">
                          ৳{course.originalPrice.toLocaleString()}
                        </div>
                      </div>

                      <Link href={`/courses/${course.id}`}>
                        <Button className="bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs px-4 py-2 rounded-lg shadow-sm">
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

      {/* ─── How it Works / Learning Roadmap ─── */}
      <section className="bg-gradient-to-br from-slate-900 to-indigo-950 rounded-3xl p-8 sm:p-12 md:p-16 text-white space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <Badge className="bg-primary-500/20 text-primary-300 border-primary-500/30">
            লার্নিং প্রসেস
          </Badge>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white">
            যেভাবে আপনি সফল হবেন
          </h2>
          <p className="text-sm text-slate-300">
            একটি সুশৃঙ্খল ও প্রমাণিত পদ্ধতির মাধ্যমে আমরা প্রতিটি শিক্ষার্থীকে ইন্ডাস্ট্রি উপযোগী করে তুলি।
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
          {[
            { step: '০১', title: 'কোর্স বেছে নিন', desc: 'আপনার পছন্দের ট্র্যাক অনুযায়ী বিগিনার বা অ্যাডভান্সড কোর্স সিলেক্ট করুন।' },
            { step: '০২', title: 'হ্যান্ডস-অন লার্নিং', desc: 'ইন্টারেক্টিভ ভিডিও এবং প্রজেক্টের মাধ্যমে কোডিং প্র্যাকটিস করুন।' },
            { step: '০৩', title: 'কুইজ ও টেস্ট', desc: 'মডিউল ভিত্তিক কুইজ দিয়ে নিজের দক্ষতা মূল্যায়ন ও রেটিং বৃদ্ধি করুন।' },
            { step: '০৪', title: 'সার্টিফিকেট ও জব', desc: 'সার্টিফিকেট অর্জন করুন এবং পোর্টফোলিও দিয়ে চাকরির জন্য আবেদন করুন।' },
          ].map((item, index) => (
            <div key={index} className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm space-y-3 relative">
              <div className="text-3xl font-black text-primary-400/50">{item.step}</div>
              <h3 className="font-bold text-lg text-white">{item.title}</h3>
              <p className="text-xs text-slate-300 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Student Reviews ─── */}
      <section className="space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <Badge className="bg-primary-50 text-primary-700 border-primary-200">
            শিক্ষার্থীদের মতামত
          </Badge>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
            আমাদের সফল শিক্ষার্থীদের অভিজ্ঞতা
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t, idx) => (
            <Card key={idx} className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex text-amber-400">
                  {[...Array(t.rating)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-slate-600 leading-relaxed italic">
                  "{t.content}"
                </p>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{t.name}</h4>
                  <p className="text-xs text-slate-400">{t.role}</p>
                </div>
                <Badge variant="outline" className="text-[10px] text-primary-600 border-primary-200">
                  {t.course}
                </Badge>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* ─── Bottom CTA Banner ─── */}
      <section className="bg-gradient-to-r from-primary-600 via-indigo-600 to-primary-700 rounded-3xl text-white p-8 sm:p-14 text-center space-y-6 shadow-2xl relative overflow-hidden">
        <div className="max-w-2xl mx-auto space-y-3 relative z-10">
          <h2 className="text-2xl sm:text-4xl font-black">
            আজই আপনার ভবিষ্যৎ গড়ার প্রথম পদক্ষেপ নিন
          </h2>
          <p className="text-primary-100 text-sm sm:text-base">
            হাজারো শিক্ষার্থীর সাথে যুক্ত হয়ে নতুন টেক স্কিল অর্জন করুন নিজের ভাষায়।
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-4 relative z-10">
          <Link href="/courses">
            <Button size="lg" className="bg-white text-primary-700 hover:bg-slate-100 font-bold px-8 py-3.5 rounded-xl shadow-lg">
              কোর্সসমূহ ব্রাউজ করুন
            </Button>
          </Link>
          <Link href="/login">
            <Button variant="outline" size="lg" className="bg-transparent border-white/40 text-white hover:bg-white/10 font-bold px-8 py-3.5 rounded-xl">
              লগইন / রেজিস্টার
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
