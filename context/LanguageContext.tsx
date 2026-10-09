'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'bn' | 'en';

export interface Translations {
  [key: string]: {
    bn: string;
    en: string;
  };
}

export const translations: Translations = {
  // ── Navigation ──
  'nav.home': { bn: 'হোম', en: 'Home' },
  'nav.courses': { bn: 'সকল কোর্স', en: 'All Courses' },
  'nav.exams': { bn: 'পরীক্ষা ও কুইজ', en: 'Exams & Quizzes' },
  'nav.dashboard': { bn: 'ড্যাশবোর্ড', en: 'Dashboard' },
  'nav.login': { bn: 'লগইন', en: 'Log In' },
  'nav.signup': { bn: 'সাইন আপ', en: 'Sign Up' },
  'nav.logout': { bn: 'লগআউট', en: 'Log Out' },
  'nav.loggingOut': { bn: 'লগআউট...', en: 'Logging out...' },
  'nav.searchPlaceholder': { bn: 'কোর্স সার্চ করুন...', en: 'Search courses...' },
  'nav.goals': { bn: 'গোলস ও ট্র্যাকিং', en: 'Goals & Tracking' },
  'nav.settings': { bn: 'সেটিংস', en: 'Settings' },

  // ── Sidebar ──
  'sidebar.navigation': { bn: 'নেভিগেশন', en: 'Navigation' },
  'sidebar.home': { bn: 'হোম পেজ', en: 'Home Page' },
  'sidebar.courses': { bn: 'কোর্সসমূহ', en: 'Courses' },
  'sidebar.dashboard': { bn: 'ড্যাশবোর্ড', en: 'Dashboard' },
  'sidebar.goals': { bn: 'গোলস ও ট্র্যাকিং', en: 'Goals & Tracking' },
  'sidebar.settings': { bn: 'সেটিংস', en: 'Settings' },
  'sidebar.saveProgress': { bn: 'অগ্রগতি সংরক্ষণ করুন', en: 'Save Your Progress' },
  'sidebar.guestDesc': { bn: 'কোর্স এনরোলমেন্ট ও কুইজ ট্র্যাক করতে সাইন ইন করুন।', en: 'Sign in to track course enrollments and quizzes.' },
  'sidebar.loginBtn': { bn: 'লগইন করুন', en: 'Log In' },

  // ── Auth - General ──
  'auth.brandSubtitle': { bn: 'সহজেই সাইন ইন বা রেজিস্ট্রেশন করুন', en: 'Easily sign in or register' },
  'auth.googleSignIn': { bn: 'Google দিয়ে সাইন ইন করুন', en: 'Sign in with Google' },
  'auth.googleConnecting': { bn: 'Google-এ সংযুক্ত হচ্ছে...', en: 'Connecting to Google...' },
  'auth.orPhone': { bn: 'অথবা মোবাইল নম্বর দিয়ে', en: 'Or with mobile number' },
  'auth.tabSignUp': { bn: 'মোবাইল দিয়ে সাইন আপ', en: 'Sign Up with Mobile' },
  'auth.tabLogin': { bn: 'মোবাইল দিয়ে লগইন', en: 'Log In with Mobile' },
  'auth.paymentAlert': { bn: 'কোর্সটি কিনতে আগে লগইন করুন', en: 'Please login first to enroll in this course' },
  'auth.termsPrefix': { bn: 'সাইন ইন করার মাধ্যমে আপনি আমাদের ', en: 'By signing in, you agree to our ' },
  'auth.termsOfService': { bn: 'Terms of Service', en: 'Terms of Service' },
  'auth.and': { bn: ' ও ', en: ' and ' },
  'auth.privacyPolicy': { bn: 'Privacy Policy', en: 'Privacy Policy' },
  'auth.termsSuffix': { bn: '-তে সম্মত হচ্ছেন।', en: '.' },
  'auth.browseWithoutLogin': { bn: 'লগইন না করে কোর্সগুলো দেখুন', en: 'Browse courses without logging in' },

  // ── Auth - Fields ──
  'auth.accountType': { bn: 'অ্যাকাউন্টের ধরন', en: 'Account Type' },
  'auth.roleStudent': { bn: 'শিক্ষার্থী', en: 'Student' },
  'auth.roleInstructor': { bn: 'ইন্সট্রাক্টর', en: 'Instructor' },
  'auth.fullName': { bn: 'পুরো নাম', en: 'Full Name' },
  'auth.namePlaceholder': { bn: 'আপনার পূর্ণ নাম লিখুন', en: 'Enter your full name' },
  'auth.phone': { bn: 'মোবাইল নম্বর', en: 'Mobile Number' },
  'auth.phoneOrEmail': { bn: 'মোবাইল নম্বর অথবা ইমেইল', en: 'Mobile Number or Email' },
  'auth.password': { bn: 'পাসওয়ার্ড', en: 'Password' },
  'auth.passwordPlaceholderSignup': { bn: 'কমপক্ষে ৬ অক্ষরের পাসওয়ার্ড', en: 'At least 6 characters password' },
  'auth.passwordPlaceholderLogin': { bn: 'আপনার পাসওয়ার্ড দিন', en: 'Enter your password' },
  'auth.sendOtpBtn': { bn: 'ওটিপি কোড পাঠান', en: 'Send OTP Code' },

  // ── Auth - Actions ──
  'auth.signUpBtn': { bn: 'সাইন আপ করুন', en: 'Sign Up' },
  'auth.signUpWithOtpBtn': { bn: 'ওটিপি যাচাই করে সুরক্ষিত সাইন আপ', en: 'Sign Up with Secure OTP' },
  'auth.signingUp': { bn: 'অ্যাকাউন্ট তৈরি হচ্ছে...', en: 'Creating account...' },
  'auth.loginBtn': { bn: 'লগইন করুন', en: 'Log In' },
  'auth.loggingIn': { bn: 'পাসওয়ার্ড যাচাই ও ওটিপি পাঠানো হচ্ছে...', en: 'Verifying password & sending OTP...' },
  'auth.alreadyAccount': { bn: 'ইতিমধ্যেই অ্যাকাউন্ট আছে?', en: 'Already have an account?' },
  'auth.newAccount': { bn: 'নতুন ব্যবহারকারী?', en: 'New user?' },

  // ── Auth - 2FA / OTP Verification ──
  'auth.otpVerifyTitle': { bn: 'মোবাইল নম্বর যাচাইকরণ', en: 'Phone Number Verification' },
  'auth.otpVerifyTitle2FA': { bn: '২-ধাপের নিরাপত্তা যাচাই (2FA)', en: '2-Step Verification (2FA)' },
  'auth.otpSentMsg': { bn: 'আমরা আপনার মোবাইল নম্বরে একটি ৬ ডিজিটের ভেরিফিকেশন কোড পাঠিয়েছি।', en: 'We have sent a 6-digit verification code to your mobile number.' },
  'auth.otpSent2FAMsg': { bn: 'পাসওয়ার্ড সঠিক হয়েছে! আপনার মোবাইল নম্বরে পাঠানো ৬ ডিজিটের ওটিপি কোডটি দিন।', en: 'Password verified! Enter the 6-digit OTP code sent to your mobile number.' },
  'auth.changeNumber': { bn: 'নম্বর পরিবর্তন করুন', en: 'Change Number' },
  'auth.backToLoginForm': { bn: 'লগইন ফর্মে ফিরে যান', en: 'Back to Login Form' },
  'auth.enterOtpLabel': { bn: '৬ ডিজিটের ওটিপি কোড লিখুন', en: 'Enter 6-digit OTP Code' },
  'auth.resendOtpIn': { bn: 'পুনরায় ওটিপি পাঠান', en: 'Resend OTP in' },
  'auth.resendCode': { bn: 'কোড পুনরায় পাঠান', en: 'Resend Code' },
  'auth.verifyAndSignUp': { bn: 'যাচাই সম্পন্ন ও সাইন আপ করুন', en: 'Verify & Complete Sign Up' },
  'auth.verifyAndLogin': { bn: 'যাচাই সম্পন্ন করে প্রবেশ করুন', en: 'Verify & Enter' },
  'auth.verifying': { bn: 'যাচাই করা হচ্ছে...', en: 'Verifying...' },
  'auth.devOtpBadge': { bn: 'টেস্ট ওটিপি কোড:', en: 'Test OTP Code:' },
  'auth.autoFill': { bn: 'স্বয়ংক্রিয় বসান', en: 'Auto Fill' },

  // ── Auth - Feedback Messages ──
  'auth.nameRequired': { bn: 'অনুগ্রহ করে আপনার পুরো নাম লিখুন।', en: 'Please enter your full name.' },
  'auth.phoneRequired': { bn: 'অনুগ্রহ করে সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন (যেমন: 017XXXXXXXX)।', en: 'Please provide a valid 11-digit mobile number (e.g. 017XXXXXXXX).' },
  'auth.passwordLength': { bn: 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।', en: 'Password must be at least 6 characters.' },
  'auth.otpSentSuccess': { bn: 'ভেরিফিকেশন কোড পাঠানো হয়েছে!', en: 'Verification code sent successfully!' },
  'auth.otpInvalid': { bn: 'অনুগ্রহ করে সঠিক ৬ ডিজিটের ওটিপি দিন।', en: 'Please enter a valid 6-digit OTP.' },
  'auth.loginFailed': { bn: 'লগইন ব্যর্থ হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।', en: 'Login failed. Please try again.' },

  // ── Home Page ──
  'home.badge': { bn: 'বাংলাদেশের প্রফেশনাল লার্নিং প্ল্যাটফর্ম', en: 'Bangladesh\'s Leading Professional Learning Platform' },
  'home.heroTitle1': { bn: 'প্রফেশনাল স্কিল শিখুন, ', en: 'Learn Professional Skills, ' },
  'home.heroTitle2': { bn: 'ক্যারিয়ারে এগিয়ে যান', en: 'Advance Your Career' },
  'home.heroDesc': { bn: 'ইন্ডাস্ট্রি এক্সপার্টদের সাথে শিখুন ফুলস্ট্যাক ডেভেলপমেন্ট, ডাটা সায়েন্স, এআই এবং সিস্টেম আর্কিটেকচার। হ্যান্ডস-অন প্রজেক্ট তৈরি করে নিজেকে চাকরির জন্য প্রস্তুত করুন।', en: 'Learn Fullstack Development, Data Science, AI, and System Architecture from industry experts. Build hands-on projects to get job-ready.' },
  'home.viewCourses': { bn: 'কোর্সগুলো দেখুন', en: 'Browse Courses' },
  'home.login': { bn: 'লগইন করুন', en: 'Log In' },
  'home.heroCheck1': { bn: 'প্রজেক্ট ভিত্তিক পাঠ্যক্রম', en: 'Project-based curriculum' },
  'home.heroCheck2': { bn: 'লাইফটাইম অ্যাক্সেস', en: 'Lifetime access' },
  'home.heroCheck3': { bn: 'ইন্ডাস্ট্রি সার্টিফিকেট', en: 'Industry certificate' },
  'home.liveDashboard': { bn: 'লাইভ লার্নিং ড্যাশবোর্ড', en: 'Live Learning Dashboard' },
  'home.realtimeProgress': { bn: 'রিয়েল-টাইম প্রোগ্রেস ও কুইজ', en: 'Real-time progress & quizzes' },
  'home.completed': { bn: 'সম্পন্ন', en: 'completed' },
  'home.browseCatalog': { bn: 'কোর্স ক্যাটালগে ব্রাউজ করুন →', en: 'Browse course catalog →' },
  'home.statsStudents': { bn: 'সক্রিয় শিক্ষার্থী', en: 'Active Students' },
  'home.statsCourses': { bn: 'এক্সক্লুসিভ কোর্স', en: 'Exclusive Courses' },
  'home.statsRating': { bn: 'গড় রেটিং', en: 'Average Rating' },
  'home.statsInstructors': { bn: 'ইন্ডাস্ট্রি মেন্টরস', en: 'Industry Mentors' },
  'home.popularCategories': { bn: 'জনপ্রিয় ক্যাটাগরি', en: 'Popular Categories' },
  'home.viewAllCourses': { bn: 'সব কোর্স দেখুন', en: 'View All Courses' },
  'home.featuredCourses': { bn: 'ফিচার্ড কোর্সসমূহ', en: 'Featured Courses' },
  'home.howTitle': { bn: 'কিভাবে শিখবেন?', en: 'How It Works' },
  'home.howSubtitle': { bn: 'সহজ ৪টি ধাপে প্রফেশনাল লার্নিং যাত্রা শুরু করুন', en: 'Start your professional learning journey in 4 easy steps' },
  'home.testimonials': { bn: 'শিক্ষার্থীদের মতামত', en: 'Student Testimonials' },
  'home.testimonialsSubtitle': { bn: 'আমাদের প্ল্যাটফর্মে শিখে যারা এগিয়ে গেছেন বিভিন্ন শীর্ষ প্রতিষ্ঠানে', en: 'Those who advanced to top tech firms learning on our platform' },
  'home.ctaTitle': { bn: 'আজই শুরু করুন আপনার লার্নিং জার্নি', en: 'Start Your Learning Journey Today' },
  'home.ctaDesc': { bn: 'হাজারো শিক্ষার্থীর সাথে যোগ দিন এবং আপনার পছন্দের বিষয়ে দক্ষতা অর্জন করুন।', en: 'Join thousands of students and master your skills.' },
  'home.freeRegister': { bn: 'বিনামূল্যে রেজিস্ট্রেশন করুন', en: 'Register for Free' },
  'home.quickLinks': { bn: 'কুইক লিংক', en: 'Quick Links' },
  'home.categoriesLink': { bn: 'ক্যাটাগরি', en: 'Categories' },
  'home.rights': { bn: 'সর্বস্বত্ব সংরক্ষিত।', en: 'All rights reserved.' },

  // ── Courses Catalog ──
  'courses.explore': { bn: 'এক্সপ্লোর করুন', en: 'Explore' },
  'courses.catalogTitle': { bn: 'কোর্স ক্যাটালগ', en: 'Course Catalog' },
  'courses.catalogSubtitle': { bn: 'প্রফেশনাল সফটওয়্যার ক্যারিয়ারের জন্য তৈরি আমাদের হ্যান্ডস-অন কোর্সগুলো ব্রাউজ করুন এবং আপনার উপযুক্ত কোর্সটি বেছে নিন।', en: 'Browse hands-on courses designed for professional software careers and pick the right one for you.' },
  'courses.allCourses': { bn: 'সকল কোর্স', en: 'All Courses' },
  'courses.searchPlaceholder': { bn: 'কোর্স বা ইন্সট্রাক্টরের নাম দিয়ে সার্চ করুন...', en: 'Search by course or instructor name...' },
  'courses.allLevels': { bn: 'সকল লেভেল', en: 'All Levels' },
  'courses.beginner': { bn: 'বিগিনার', en: 'Beginner' },
  'courses.intermediate': { bn: 'ইন্টারমিডিয়েট', en: 'Intermediate' },
  'courses.advanced': { bn: 'অ্যাডভান্সড', en: 'Advanced' },
  'courses.webDev': { bn: 'ওয়েব ডেভেলপমেন্ট', en: 'Web Development' },
  'courses.dataScience': { bn: 'ডাটা সায়েন্স ও এআই', en: 'Data Science & AI' },
  'courses.programming': { bn: 'প্রোগ্রামিং ও ডিএসএ', en: 'Programming & DSA' },
  'courses.systemDesign': { bn: 'সিস্টেম ডিজাইন', en: 'System Design' },
  'courses.appDev': { bn: 'অ্যাপ ডেভেলপমেন্ট', en: 'App Development' },
  'courses.sortPopular': { bn: 'জনপ্রিয়তা (এনরোলমেন্ট)', en: 'Most Popular' },
  'courses.sortNewest': { bn: 'নতুন কোর্স', en: 'Newest' },
  'courses.sortPriceLow': { bn: 'মূল্য: কম থেকে বেশি', en: 'Price: Low to High' },
  'courses.sortPriceHigh': { bn: 'মূল্য: বেশি থেকে কম', en: 'Price: High to Low' },
  'courses.sortRating': { bn: 'সর্বোচ্চ রেটিং', en: 'Highest Rated' },
  'courses.resetFilters': { bn: 'ফিল্টার রিসেট', en: 'Reset Filters' },
  'courses.showingCount': { bn: 'টি কোর্স দেখানো হচ্ছে', en: 'courses found' },
  'courses.noCourses': { bn: 'কোনো কোর্স পাওয়া যায়নি', en: 'No courses found' },
  'courses.tryDifferentFilter': { bn: 'অন্য কোনো কি-ওয়ার্ড দিয়ে সার্চ করুন অথবা ফিল্টার পরিবর্তন করুন।', en: 'Try searching with different keywords or clear filters.' },
  'courses.enrollNow': { bn: 'এনরোল করুন', en: 'Enroll Now' },
  'courses.free': { bn: 'ফ্রি', en: 'Free' },
  'courses.lessons': { bn: 'টি লেসন', en: 'lessons' },
  'courses.hours': { bn: 'ঘণ্টা', en: 'hours' },
  'courses.students': { bn: 'শিক্ষার্থী', en: 'students' },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: string, fallback?: string) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'bn',
  setLanguage: () => {},
  toggleLanguage: () => {},
  t: (key: string, fallback?: string) => fallback || key,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('bn');

  // Load saved preference from localStorage on mount
  useEffect(() => {
    try {
      const savedLang = localStorage.getItem('esikho_language') as Language;
      if (savedLang === 'en' || savedLang === 'bn') {
        setLanguageState(savedLang);
        document.documentElement.lang = savedLang;
      }
    } catch {
      // localStorage unavailable or private browsing
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem('esikho_language', lang);
      document.documentElement.lang = lang;
    } catch {
      // safe fallback
    }
  };

  const toggleLanguage = () => {
    setLanguage(language === 'bn' ? 'en' : 'bn');
  };

  const t = (key: string, fallback?: string): string => {
    const entry = translations[key];
    if (entry && entry[language]) {
      return entry[language];
    }
    return fallback || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
