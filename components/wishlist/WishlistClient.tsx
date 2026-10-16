'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Heart,
  BookOpen,
  Clock,
  Star,
  ArrowRight,
  Sparkles,
  ShoppingBag,
  Trash2,
} from 'lucide-react';
import { Course } from '@/lib/courses-data';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useLanguage, formatBilingualDuration } from '@/context/LanguageContext';
import { WishlistButton } from '@/components/courses/WishlistButton';

interface WishlistClientProps {
  initialCourses: Course[];
  isLoggedIn: boolean;
}

export function WishlistClient({ initialCourses, isLoggedIn }: WishlistClientProps) {
  const { language, t } = useLanguage();
  const [courses, setCourses] = useState<Course[]>(initialCourses);

  const handleRemove = (courseId: string) => {
    setCourses((prev) => prev.filter((c) => c.id !== courseId));
  };

  if (!isLoggedIn) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="h-16 w-16 mx-auto rounded-2xl bg-rose-50 flex items-center justify-center text-rose-500 mb-4 shadow-sm border border-rose-100">
          <Heart className="h-8 w-8 fill-rose-500" />
        </div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          {language === 'en' ? 'Sign in to access your Wishlist' : 'আপনার উইশলিস্ট দেখতে লগইন করুন'}
        </h1>
        <p className="text-xs text-slate-500 max-w-md mx-auto mt-2">
          {language === 'en'
            ? 'Save courses you want to study later, compare curriculum, and monitor enrollment deadlines.'
            : 'পছন্দের কোর্সগুলো উইশলিস্টে সংরক্ষণ করে রাখুন এবং পরবর্তীতে সুবিধামতো সময়ে ভর্তি হোন।'}
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/login?callbackUrl=/wishlist">
            <Button className="bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold rounded-xl px-5 py-2.5">
              {language === 'en' ? 'Log In Now' : 'এখনই লগইন করুন'}
            </Button>
          </Link>
          <Link href="/courses">
            <Button variant="outline" className="border-slate-200 text-xs font-bold rounded-xl px-5 py-2.5">
              {language === 'en' ? 'Browse Courses' : 'সকল কোর্স দেখুন'}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-rose-50 text-rose-500 rounded-xl border border-rose-100">
              <Heart className="h-5 w-5 fill-rose-500" />
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {language === 'en' ? 'My Saved Wishlist' : 'আমার সংরক্ষিত উইশলিস্ট'}
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1.5">
            {language === 'en'
              ? `You have saved ${courses.length} course${courses.length === 1 ? '' : 's'} to enroll in later.`
              : `আপনি পরবর্তীতে অধ্যয়নের জন্য ${courses.length} টি কোর্স উইশলিস্টে যুক্ত রেখেছেন।`}
          </p>
        </div>

        {courses.length > 0 && (
          <Link href="/courses">
            <Button
              variant="outline"
              size="sm"
              className="text-xs font-bold rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50"
            >
              <span>{language === 'en' ? 'Explore More Courses' : 'আরও কোর্স খুঁজুন'}</span>
              <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
            </Button>
          </Link>
        )}
      </div>

      {/* Course Cards Grid or Empty State */}
      {courses.length === 0 ? (
        <div className="text-center py-20 px-4 bg-slate-50/70 border border-slate-200/80 rounded-3xl max-w-xl mx-auto">
          <div className="h-16 w-16 mx-auto rounded-2xl bg-white flex items-center justify-center text-slate-300 shadow-sm border border-slate-200 mb-4">
            <Heart className="h-8 w-8 text-slate-300" />
          </div>
          <h2 className="text-lg font-bold text-slate-800">
            {language === 'en' ? 'Your wishlist is currently empty' : 'আপনার উইশলিস্ট এখন ফাঁকা'}
          </h2>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 leading-relaxed">
            {language === 'en'
              ? 'Explore our course catalog and click the heart icon on any course to bookmark it here.'
              : 'আমাদের কোর্স ক্যাটালগ ঘুরে দেখুন এবং পছন্দের কোর্সের হার্ট আইকনে ক্লিক করে উইশলিস্টে রাখুন।'}
          </p>
          <div className="mt-6">
            <Link href="/courses">
              <Button className="bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold rounded-xl px-5 py-2.5 shadow-sm">
                <ShoppingBag className="h-4 w-4 mr-2" />
                <span>{language === 'en' ? 'Browse Catalog' : 'কোর্স ক্যাটালগ দেখুন'}</span>
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => {
            const discount = course.originalPrice && course.originalPrice > course.price
              ? Math.round(((course.originalPrice - course.price) / course.originalPrice) * 100)
              : 0;

            const displayTitle = language === 'en' && course.titleEn ? course.titleEn : course.title;
            const displayTagline = language === 'en' && course.taglineEn ? course.taglineEn : course.tagline;
            const displayThumbnail = language === 'en' && course.thumbnailUrlEn ? course.thumbnailUrlEn : course.thumbnailUrl;
            const displayCategory = language === 'en'
              ? (course.category === 'web-dev' ? 'Web Development' : course.category === 'data-science' ? 'Data Science' : course.category === 'programming' ? 'Programming' : course.category === 'system-design' ? 'System Design' : course.category === 'app-dev' ? 'App Development' : course.categoryBangla)
              : course.categoryBangla;

            return (
              <Card
                key={course.id}
                className="overflow-hidden border border-slate-200 rounded-2xl hover:border-primary-300 hover:shadow-lg transition-all duration-300 flex flex-col bg-white group"
              >
                {/* Thumbnail banner */}
                <div className="relative h-48 w-full overflow-hidden bg-slate-100">
                  <img
                    src={displayThumbnail}
                    alt={displayTitle}
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-3 left-3">
                    <span className="text-xs font-bold bg-primary-600 text-white px-2.5 py-1 rounded-lg shadow-sm">
                      {displayCategory}
                    </span>
                  </div>

                  {/* Wishlist Button on top right */}
                  <div className="absolute top-3 right-3 flex items-center gap-2">
                    {discount > 0 && (
                      <span className="text-xs font-black bg-rose-500 text-white px-2 py-1 rounded-lg shadow-sm">
                        {discount}% OFF
                      </span>
                    )}
                    <WishlistButton
                      courseId={course.id}
                      initialWishlisted={true}
                      size="sm"
                      onToggle={(isNowWishlisted) => {
                        if (!isNowWishlisted) {
                          handleRemove(course.id);
                        }
                      }}
                    />
                  </div>

                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                    <span className="text-xs bg-black/60 backdrop-blur-xs text-white px-2.5 py-1 rounded-md font-semibold">
                      {course.level}
                    </span>
                    <span className="flex items-center gap-1 text-xs bg-black/60 backdrop-blur-xs text-white px-2.5 py-1 rounded-md font-semibold">
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                      {course.rating.toFixed(1)}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <CardContent className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <h3 className="font-bold text-slate-900 text-base leading-snug line-clamp-2 group-hover:text-primary-600 transition">
                      {displayTitle}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {displayTagline}
                    </p>
                  </div>

                  {/* Instructor & Meta */}
                  <div className="pt-3 border-t border-slate-100 space-y-3">
                    <div className="flex items-center gap-2">
                      <img
                        src={course.instructor.avatar}
                        alt={course.instructor.name}
                        className="h-7 w-7 rounded-full object-cover border border-slate-200"
                      />
                      <span className="text-xs font-semibold text-slate-700 truncate">
                        {course.instructor.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-slate-400" />
                        {formatBilingualDuration(course.duration, course.durationEn, language)}
                      </span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <BookOpen className="h-3.5 w-3.5 text-slate-400" />
                        {course.totalLessons} {language === 'en' ? 'lessons' : 'লেসন'}
                      </span>
                    </div>

                    {/* Price and CTA */}
                    <div className="flex items-center justify-between pt-2">
                      <div>
                        <span className="text-lg font-black text-primary-700">
                          {language === 'en' ? `BDT ${course.price.toLocaleString()}` : `৳${course.price.toLocaleString('bn-BD')}`}
                        </span>
                        {course.originalPrice > course.price && (
                          <span className="text-xs text-slate-400 line-through ml-2">
                            {language === 'en' ? `BDT ${course.originalPrice.toLocaleString()}` : `৳${course.originalPrice.toLocaleString('bn-BD')}`}
                          </span>
                        )}
                      </div>

                      <Link href={`/courses/${course.id}`}>
                        <Button
                          size="sm"
                          className="bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-xs"
                        >
                          {language === 'en' ? 'View Details' : 'বিস্তারিত'}
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

export default WishlistClient;
