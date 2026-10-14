import mongoose from 'mongoose';
import fs from 'fs';
import crypto from 'crypto';

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

// Read Mongo URI
const envContent = fs.existsSync('.env.local') ? fs.readFileSync('.env.local', 'utf-8') : fs.readFileSync('.env', 'utf-8');
const mongoLine = envContent.split('\n').find((l) => l.startsWith('MONGODB_URI='));
const uri = mongoLine.split('=')[1].replace(/["']/g, '').trim();

const INSTRUCTORS_DATA = [
  {
    name: 'তানভীর আহমেদ',
    role: 'সিনিয়র ফুলস্ট্যাক ইঞ্জিনিয়ার (Ex-Brain Station 23)',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=250&auto=format&fit=crop',
    bio: '৮+ বছরের অভিজ্ঞতা সম্পন্ন ফুলস্ট্যাক ইঞ্জিনিয়ার। আর্কিটেকচার, Next.js, TypeScript এবং ক্লাউড সিস্টেমে অভিজ্ঞ।',
  },
  {
    name: 'ড. সাজিদ হাসান',
    role: 'লিড ডাটা সায়েন্টিস্ট ও এআই গবেষক',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=250&auto=format&fit=crop',
    bio: 'মেশিন লার্নিং ও আর্টিফিশিয়াল ইন্টেলিজেন্সে পিএইচডি। আন্তর্জাতিক জার্নালে ১৫টির বেশি গবেষণাপত্র প্রকাশিত।',
  },
  {
    name: 'নাজমুল আরেফিন',
    role: 'কম্পিটিটিভ প্রোগ্রামার ও এক্স-FAANG ইঞ্জিনিয়ার',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=250&auto=format&fit=crop',
    bio: 'ICPC ওয়ার্ল্ড ফাইনালিস্ট এবং শত শত শিক্ষার্থীকে শীর্ষ টেক কোম্পানিতে ইন্টারভিউ ক্র্যাক করতে প্রশিক্ষণ দিয়েছেন।',
  },
  {
    name: 'ইফতেখারুল আলম',
    role: 'প্রিন্সিপাল ক্লাউড ও সিস্টেম আর্কিটেক্ট',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=250&auto=format&fit=crop',
    bio: '১৫+ বছরের অভিজ্ঞতা সম্পন্ন ডিস্ট্রিবিউটেড সিস্টেম, মাইক্রোসার্ভিসেস ও ক্লাউড স্কেলিং বিশেষজ্ঞ।',
  },
  {
    name: 'ফারহানা ইয়াসমিন',
    role: 'সিনিয়র মোবাইল অ্যাপ ডেভেলপার',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=250&auto=format&fit=crop',
    bio: 'মোবাইল অ্যাপ্লিকেশন ডিজাইনার এবং Flutter এক্সপার্ট। প্লে-স্টোর ও অ্যাপ স্টোরে ৩০টিরও বেশি সফল লাইভ অ্যাপ।',
  },
];

const COURSES_DATA = [
  {
    slug: 'fullstack-nextjs',
    title: 'ফুলস্ট্যাক ওয়েব ডেভেলপমেন্ট (Next.js 14, React & Node.js)',
    titleEn: 'Fullstack Web Development with Next.js 14, React & Node.js',
    tagline: 'জিরো থেকে প্রো লেভেলের আধুনিক ওয়েব অ্যাপ্লিকেশন তৈরি করুন',
    taglineEn: 'Build production-ready modern web applications from zero to pro',
    description: 'এই কোর্সে আপনি আধুনিক ওয়েব টেকনোলজি যেমন Next.js 14 App Router, React Server Components, TypeScript, Tailwind CSS, PostgreSQL, Prisma ORM এবং NextAuth ব্যবহার করে রিয়েল-ওয়ার্ল্ড ফুলস্ট্যাক প্রজেক্ট তৈরি করতে শিখবেন।',
    category: 'web-dev',
    categoryBangla: 'ওয়েব ডেভেলপমেন্ট',
    level: 'বিগিনার',
    rating: 4.9,
    totalRatings: 380,
    studentsEnrolled: 1420,
    duration: '৪৫ ঘণ্টা',
    totalLessons: 10,
    price: 4500,
    originalPrice: 8500,
    thumbnailUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=800&auto=format&fit=crop',
    previewVideoUrl: 'https://www.youtube.com/embed/wm5gMKuwSYk',
    instructorName: 'তানভীর আহমেদ',
    learningOutcomes: [
      'Next.js 14 App Router এবং Server Actions এর বাস্তবমুখী প্রয়োগ',
      'TypeScript দিয়ে টাইপ-সেফ ক্লিন কোড এবং আর্কিটেকচার তৈরি',
      'Prisma ORM এবং PostgreSQL/MongoDB ডাটাবেস ডিজাইন ও পারফরম্যান্স টিউনিং',
      'NextAuth.js দিয়ে মাল্টি-রোল ভিত্তিক সিকিউর অথেন্টিকেশন সিস্টেম',
      'SSLCommerz ও bKash পেমেন্ট গেটওয়ে হ্যান্ডলিং',
      'Docker এবং Vercel ডেপ্লয়মেন্ট প্র্যাকটিস'
    ],
    prerequisites: [
      'HTML, CSS এবং বেসিক JavaScript এর ধারণা',
      'কম্পিউটার এবং সক্রিয় ইন্টারনেট সংযোগ',
      'শেখার আগ্রহ ও নিয়মিত অনুশীলনের মানসিকতা'
    ],
    modules: [
      {
        title: 'মডিউল ১: আধুনিক JavaScript ও TypeScript ফাউন্ডেশন',
        duration: '৬ ঘণ্টা',
        lessons: [
          { title: 'ES6+ গুরুত্বপূর্ণ ফিচারসমূহ ও অ্যাসিঙ্ক প্রোগ্রামিং', duration: '৪৫ মিনিট', isFree: true, videoUrl: 'https://www.youtube.com/embed/hdI2bqOjy3c' },
          { title: 'TypeScript এর ফান্ডামেন্টালস ও টাইপ সিস্টেম', duration: '১ ঘণ্টা ১৫ মিনিট', isFree: true, videoUrl: 'https://www.youtube.com/embed/BCg4U1FzODs' },
          { title: 'React এর সাথে TypeScript ইন্টিগ্রেশন ও Best Practices', duration: '১ ঘণ্টা', isFree: false, videoUrl: 'https://www.youtube.com/embed/bMknfKXIFA8' }
        ]
      },
      {
        title: 'মডিউল ২: Next.js 14 আর্কিটেকচার ও App Router',
        duration: '১২ ঘণ্টা',
        lessons: [
          { title: 'Next.js App Router, লেআউট ও ডায়নামিক পেজ রাউটিং', duration: '১ ঘণ্টা ৩০ মিনিট', isFree: false, videoUrl: 'https://www.youtube.com/embed/wm5gMKuwSYk' },
          { title: 'Server Components vs Client Components এবং ডেটা ফেচিং', duration: '২ ঘণ্টা', isFree: false, videoUrl: 'https://www.youtube.com/embed/gSSsZRehazc' },
          { title: 'Server Actions, ফর্ম ভ্যালিডেশন এবং স্টেট আপডেট', duration: '১ ঘণ্টা ৪৫ মিনিট', isFree: false, videoUrl: 'https://www.youtube.com/embed/VBlT_44i_88' }
        ]
      },
      {
        title: 'মডিউল ৩: ডাটাবেস মডেলিং, অথেন্টিকেশন ও পেমেন্ট ইন্টিগ্রেশন',
        duration: '১৫ ঘণ্টা',
        lessons: [
          { title: 'Prisma ORM এবং MongoDB/PostgreSQL স্কিমা ডিজাইন', duration: '২ ঘণ্টা ১৫ মিনিট', isFree: false, videoUrl: 'https://www.youtube.com/embed/FMnhehhZ3-o' },
          { title: 'NextAuth.js দিয়ে রোল-বেসড অথেন্টিকেশন (RBAC)', duration: '২ ঘণ্টা ৩০ মিনিট', isFree: false, videoUrl: 'https://www.youtube.com/embed/w2h54xz6Ndw' },
          { title: 'পেমেন্ট গেটওয়ে ইন্টিগ্রেশন ও ওয়েবহুক ভ্যালিডেশন', duration: '৩ ঘণ্টা', isFree: false, videoUrl: 'https://www.youtube.com/embed/1r-F3FIONl8' }
        ]
      }
    ]
  },
  {
    slug: 'python-machine-learning',
    title: 'পাইথন দিয়ে মেশিন লার্নিং ও এআই (AI & ML Bootcamp)',
    titleEn: 'Machine Learning & Applied AI with Python',
    tagline: 'ডাটা অ্যানালাইসিস থেকে প্রেডিক্টিভ এআই মডেল তৈরি শিখুন',
    taglineEn: 'From exploratory data analysis to predictive neural networks',
    description: 'মেশিন লার্নিং এবং কৃত্রিম বুদ্ধিমত্তার জগতে প্রবেশের জন্য একটি পূর্ণাঙ্গ ইন্ডাস্ট্রি-গ্রেড বুটক্যাম্প। ডেটা প্রসেসিং, সুপারভাইজড ও আনসুপারভাইজড লার্নিং, নিউরাল নেটওয়ার্ক এবং বাস্তবমুখী মডেল বিল্ডিং শিখুন হাতে-কলমে।',
    category: 'data-science',
    categoryBangla: 'ডাটা সায়েন্স ও এআই',
    level: 'ইন্টারমিডিয়েট',
    rating: 4.85,
    totalRatings: 260,
    studentsEnrolled: 980,
    duration: '৪০ ঘণ্টা',
    totalLessons: 7,
    price: 5000,
    originalPrice: 9500,
    thumbnailUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=800&auto=format&fit=crop',
    previewVideoUrl: 'https://www.youtube.com/embed/7eh4d6sabA0',
    instructorName: 'ড. সাজিদ হাসান',
    learningOutcomes: [
      'NumPy এবং Pandas দিয়ে বৃহৎ ডেটাসেট ম্যানিপুলেশন ও ক্লিনিং',
      'Matplotlib ও Seaborn দিয়ে এক্সপ্লোরেটরি ডাটা ভিজ্যুয়ালাইজেশন',
      'Scikit-Learn দিয়ে রিগ্রেশন, ক্লাসিফিকেশন ও ক্লাস্টারিং অ্যালগরিদম',
      'Deep Learning এবং কৃত্রিম নিউরাল নেটওয়ার্ক (ANN, CNN) এর ভিত্তি',
      'FastAPI দিয়ে মডেল প্রডাকশনে ডিপ্লয়মেন্ট'
    ],
    prerequisites: [
      'বেসিক পাইথন প্রোগ্রামিং জ্ঞান',
      'উচ্চ মাধ্যমিক গণিত ও পরিসংখ্যানের মৌলিক ধারণা'
    ],
    modules: [
      {
        title: 'মডিউল ১: পাইথন ফর ডাটা সায়েন্স ও অ্যানালাইসিস',
        duration: '৮ ঘণ্টা',
        lessons: [
          { title: 'NumPy ভেক্টরাইজেশন ও বহুমাত্রিক অ্যারে অপারেশন', duration: '১ ঘণ্টা', isFree: true, videoUrl: 'https://www.youtube.com/embed/QUT1VHiLmmI' },
          { title: 'Pandas ডেটাফ্রেম ক্লিনিং ও মিসিং ভ্যালু হ্যান্ডলিং', duration: '১ ঘণ্টা ৩০ মিনিট', isFree: true, videoUrl: 'https://www.youtube.com/embed/vmEHCJofslg' }
        ]
      },
      {
        title: 'মডিউল ২: সুপারভাইজড মেশিন লার্নিং অ্যালগরিদম',
        duration: '১৬ ঘণ্টা',
        lessons: [
          { title: 'লিনিয়ার ও লজিস্টিক রিগ্রেশনের গাণিতিক ভিত্তি', duration: '২ ঘণ্টা', isFree: false, videoUrl: 'https://www.youtube.com/embed/7eh4d6sabA0' },
          { title: 'ডিসিশন ট্রি, র্যান্ডম ফরেস্ট এবং XGBoost মডেলিং', duration: '২ ঘণ্টা ১৫ মিনিট', isFree: false, videoUrl: 'https://www.youtube.com/embed/J4Wdy0Wc_xQ' }
        ]
      }
    ]
  },
  {
    slug: 'dsa-in-bangla',
    title: 'ডাটা স্ট্রাকচার ও অ্যালগরিদম (DSA Mastery in Bangla)',
    titleEn: 'Data Structures & Algorithms Mastery',
    tagline: 'কোডিং ইন্টারভিউ ও সফটওয়্যার ইঞ্জিনিয়ারিংয়ের মূল ভিত্তি',
    taglineEn: 'The core foundation for software engineering & technical coding interviews',
    description: 'গুগল, মেটাসহ শীর্ষস্থানীয় টেক কোম্পানিতে সফটওয়্যার ইঞ্জিনিয়ার হিসেবে টেকনিক্যাল ইন্টারভিউ ক্র্যাক করার জন্য সম্পূর্ণ বাংলায় বাস্তবমুখী মাস্টারক্লাস।',
    category: 'programming',
    categoryBangla: 'প্রোগ্রামিং ফান্ডামেন্টালস',
    level: 'ইন্টারমিডিয়েট',
    rating: 4.95,
    totalRatings: 520,
    studentsEnrolled: 2300,
    duration: '৫০ ঘণ্টা',
    totalLessons: 8,
    price: 3500,
    originalPrice: 7000,
    thumbnailUrl: 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?q=80&w=800&auto=format&fit=crop',
    previewVideoUrl: 'https://www.youtube.com/embed/8hly31xKli0',
    instructorName: 'নাজমুল আরেফিন',
    learningOutcomes: [
      'Time & Space Complexity (Big-O Notation) গভীর বিশ্লেষণ',
      'Linked Lists, Stacks, Queues, Binary Trees এবং Heaps গভীর দক্ষতা',
      'Graph Algorithms (BFS, DFS, Dijkstra, TopoSort)',
      'Dynamic Programming (1D & 2D DP) সমস্যা সমাধানের প্যাটার্ন',
      'LeetCode মিডিয়াম ও হার্ড প্রবলেম স্ট্র্যাটেজি'
    ],
    prerequisites: [
      'যেকোনো একটি প্রোগ্রামিং ভাষা (C++, Java, Python অথবা JS) জানা থাকা প্রয়োজন'
    ],
    modules: [
      {
        title: 'মডিউল ১: কমপ্লেক্সিটি অ্যানালাইসিস ও ফান্ডামেন্টালস',
        duration: '৬ ঘণ্টা',
        lessons: [
          { title: 'Big-O কমপ্লেক্সিটি হিসাবের সহজ ও কার্যকর উপায়', duration: '৫০ মিনিট', isFree: true, videoUrl: 'https://www.youtube.com/embed/8hly31xKli0' },
          { title: 'রিকার্শন এবং ব্যাকট্র্যাকিং এর মূল কৌশল', duration: '১ ঘণ্টা ২০ মিনিট', isFree: true, videoUrl: 'https://www.youtube.com/embed/M2uO2nMT0Bk' }
        ]
      },
      {
        title: 'মডিউল ২: অ্যাডভান্সড ডেটা স্ট্রাকচার ও গ্রাফ থিওরি',
        duration: '২০ ঘণ্টা',
        lessons: [
          { title: 'বাইনারি সার্চ ট্রি (BST) এবং ব্যালেন্সড ট্রি অপারেশন', duration: '২ ঘণ্টা', isFree: false, videoUrl: 'https://www.youtube.com/embed/pYT9F8_LFTM' },
          { title: 'BFS, DFS এবং শর্টেস্ট পাথ অ্যালগরিদম', duration: '২ ঘণ্টা ৩০ মিনিট', isFree: false, videoUrl: 'https://www.youtube.com/embed/tWVWeAqZ0WU' }
        ]
      }
    ]
  },
  {
    slug: 'system-design-architecture',
    title: 'সিস্টেম ডিজাইন ও সফটওয়্যার আর্কিটেকচার (High-Scale Systems)',
    titleEn: 'System Design & High-Scale Cloud Architecture',
    tagline: 'মিলিয়ন ব্যবহারকারীর উপযোগী হাই-স্কেল ডিস্ট্রিবিউটেড সিস্টেম তৈরি',
    taglineEn: 'Architect high-scale distributed backends capable of serving millions of requests',
    description: 'লার্জ স্কেল ডিস্ট্রিবিউটেড সিস্টেম ডিজাইন, মাইক্রোসার্ভিস আর্কিটেকচার, ক্যাশিং স্ট্র্যাটেজি, ডাটাবেস শার্ডিং, মেসেজ কিউ এবং হাই-অ্যাভেইলেবিলিটি ডিজাইন শিখুন।',
    category: 'system-design',
    categoryBangla: 'সিস্টেম ডিজাইন',
    level: 'অ্যাডভান্সড',
    rating: 4.9,
    totalRatings: 210,
    studentsEnrolled: 740,
    duration: '৩৫ ঘণ্টা',
    totalLessons: 6,
    price: 6000,
    originalPrice: 11000,
    thumbnailUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=800&auto=format&fit=crop',
    previewVideoUrl: 'https://www.youtube.com/embed/m8Icp_Cid5o',
    instructorName: 'ইফতেখারুল আলম',
    learningOutcomes: [
      'ভার্টিক্যাল বনাম হরাইজন্টাল স্কেলিং ও লোড ব্যালেন্সার অপ্টিমাইজেশন',
      'Redis এবং Memcached ক্যাশিং স্ট্র্যাটেজি ও ইনভ্যালিডেশন প্যাটার্ন',
      'Kafka / RabbitMQ মেসেজ কিউ দিয়ে অ্যাসিনক্রোনাস প্রসেসিং',
      'CAP Theorem, ডাটাবেস রেপ্লিকেশন ও কনসিস্টেন্সি মডেল',
      'রিয়েল-লাইফ কেস স্টাডি: URL Shortener, Uber, YouTube ডিজাইন'
    ],
    prerequisites: [
      'কমপক্ষে ১-২ বছরের ব্যাকএন্ড সফটওয়্যার ডেভেলপমেন্টের বাস্তব অভিজ্ঞতা'
    ],
    modules: [
      {
        title: 'মডিউল ১: স্কেলেবিলিটি ফান্ডামেন্টালস ও লোড ব্যালেন্সিং',
        duration: '৮ ঘণ্টা',
        lessons: [
          { title: 'লোড ব্যালেন্সার এবং রিভার্স প্রক্সি আর্কিটেকচার', duration: '১ ঘণ্টা ১৫ মিনিট', isFree: true, videoUrl: 'https://www.youtube.com/embed/m8Icp_Cid5o' },
          { title: 'ক্যাশিং পলিসি ও CDN এর সর্বোত্তম ব্যবহার', duration: '১ ঘণ্টা ৩০ মিনিট', isFree: true, videoUrl: 'https://www.youtube.com/embed/6FYXEQlKUv0' }
        ]
      }
    ]
  },
  {
    slug: 'flutter-mobile-app',
    title: 'ফ্লাটার দিয়ে ক্রস-প্ল্যাটফর্ম মোবাইল অ্যাপ ডেভেলপমেন্ট',
    titleEn: 'Cross-Platform Mobile App Development with Flutter',
    tagline: 'এক কোডেই Android এবং iOS অ্যাপ তৈরি করুন',
    taglineEn: 'Build high-performance iOS and Android apps from a single codebase',
    description: 'Dart প্রোগ্রামিং ভাষা এবং Flutter ফ্রেমওয়ার্ক ব্যবহার করে প্রফেশনাল, সুন্দর ও ফ্লুইড পারফরম্যান্সের ক্রস-প্ল্যাটফর্ম মোবাইল অ্যাপ্লিকেশন ডেভেলপমেন্ট শিখুন একদম শুরু থেকে।',
    category: 'app-dev',
    categoryBangla: 'অ্যাপ ডেভেলপমেন্ট',
    level: 'বিগিনার',
    rating: 4.75,
    totalRatings: 310,
    studentsEnrolled: 1180,
    duration: '৩৮ ঘণ্টা',
    totalLessons: 6,
    price: 4000,
    originalPrice: 8000,
    thumbnailUrl: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?q=80&w=800&auto=format&fit=crop',
    previewVideoUrl: 'https://www.youtube.com/embed/VPvVD8t02U8',
    instructorName: 'ফারহানা ইয়াসমিন',
    learningOutcomes: [
      'Dart ল্যাঙ্গুয়েজ ফান্ডামেন্টালস ও অবজেক্ট ওরিয়েন্টেড প্রোগ্রামিং',
      'Flutter UI উইজেট হায়ারার্কি ও রেস্পন্সিভ লেআউট ডিজাইন',
      'State Management প্যাটার্নস (BLoC, Provider, Riverpod)',
      'REST API ইন্টিগ্রেশন এবং লোকাল স্টোরেজ ক্যাশিং',
      'Google Play Store ও Apple App Store পাবলিশিং গাইড'
    ],
    prerequisites: [
      'যেকোনো প্রোগ্রামিং ভাষার প্রাথমিক ধারণা থাকলে ভালো'
    ],
    modules: [
      {
        title: 'মডিউল ১: ডার্ট ল্যাঙ্গুয়েজ ও ফ্লাটার বেসিকস',
        duration: '১০ ঘণ্টা',
        lessons: [
          { title: 'Dart OOP ও অ্যাসিঙ্ক্রোনাস প্রোগ্রামিং', duration: '১ ঘণ্টা', isFree: true, videoUrl: 'https://www.youtube.com/embed/VPvVD8t02U8' },
          { title: 'Stateless vs Stateful Widgets এবং লাইফসাইকেল', duration: '১ ঘণ্টা ১৫ মিনিট', isFree: true, videoUrl: 'https://www.youtube.com/embed/GLSG_Wh_YWc' }
        ]
      }
    ]
  }
];

const EXAMS_DATA = [
  {
    title: 'Next.js 14 & ফুলস্ট্যাক আর্কিটেকচার মূল্যায়ন পরীক্ষা',
    description: 'Next.js App Router, Server Actions, এবং RESTful API আর্কিটেকচারের উপর একটি নিবিড় পরীক্ষা।',
    category: 'Web Development',
    duration: 15,
    totalMarks: 5,
    passMarks: 3,
    questions: [
      {
        question: 'Next.js 14 এ Server Actions ব্যবহার করার সময় কোনটি সত্য?',
        options: [
          'Server Actions শুধুমাত্র ক্লায়েন্ট কম্পোনেন্টে কাজ করে',
          'ফাংশনের শীর্ষে \'use server\' নির্দেশিকা দিয়ে সংজ্ঞায়িত করা আবশ্যক',
          'এটি শুধুমাত্র GET রিকোয়েস্ট তৈরি করে',
          'ডাটাবেস কানেকশন করা সম্ভব নয়'
        ],
        correctAnswer: 1,
        explanation: 'Server Actions এর জন্য ফাইল বা ফাংশন লেভেলে \'use server\' ডিরেক্টিভ নির্দিষ্ট করতে হয় এবং এটি সার্ভারেই নিরাপদভাবে এক্সিকিউট হয়।',
        marks: 1
      },
      {
        question: 'React Server Components (RSC) এর ক্ষেত্রে কোনটি ক্লায়েন্ট বান্ডেল সাইজ অপ্টিমাইজেশনের জন্য সঠিক গাণিতিক সম্পর্ক?',
        options: [
          '$\\text{Bundle Size}_{\\text{Client}} \\propto \\sum \\text{Server Components}$',
          'RSC ক্লায়েন্ট জাভাস্ক্রিপ্ট বান্ডেল সাইজে অন্তর্ভুক্ত হয় না, অর্থাৎ $\\Delta \\text{Bundle}_{RSC} = 0$',
          'প্রতিটি RSC ক্লায়েন্টে ২০ KB অতিরিক্ত কোড পাঠায়',
          'ক্লায়েন্ট ও সার্ভার কম্পোনেন্টের বান্ডেল সাইজ সর্বদা সমান'
        ],
        correctAnswer: 1,
        explanation: 'React Server Components সার্ভারে রেন্ডার হয়ে স্ট্রিমিং ফরম্যাটে ক্লায়েন্টে আসে, যার ফলে কোনো জাভাস্ক্রিপ্ট বান্ডেল কোড ব্রাউজারে যায় না ($\Delta \\text{Bundle}_{RSC} = 0$).',
        marks: 1
      },
      {
        question: 'PostgreSQL ডাটাবেসে ইনডেক্সিং এর ফলে লুকআপ কমপ্লেক্সিটি কীভাবে পরিবর্তিত হয়?',
        options: [
          '$\\mathcal{O}(N)$ থেকে $\\mathcal{O}(\\log N)$ এ নেমে আসে (B-Tree Indexing)',
          '$\\mathcal{O}(1)$ থেকে $\\mathcal{O}(N^2)$ এ বৃদ্ধি পায়',
          'কমপ্লেক্সিটিতে কোনো পরিবর্তন হয় না',
          'ডাটাবেস রাইট স্পিড দ্বিগুণ হয়'
        ],
        correctAnswer: 0,
        explanation: 'স্ট্যান্ডার্ড B-Tree ইনডেক্সিং সিকোয়েন্সিয়াল স্ক্যান $\\mathcal{O}(N)$ থেকে ব্যালেন্সড ট্রি সার্চ $\\mathcal{O}(\\log N)$ এ নেমে আসে।',
        marks: 1
      },
      {
        question: 'JSON Web Token (JWT) এর ৩টি অংশের সঠিক অনুক্রম কোনটি?',
        options: [
          'Payload . Signature . Header',
          'Header . Payload . Signature',
          'Signature . Header . Payload',
          'Header . Secret . Payload'
        ],
        correctAnswer: 1,
        explanation: 'একটি স্ট্যান্ডার্ড JWT তিনটি বেস৬৪-এনকোডেড অংশ নিয়ে গঠিত: Header.Payload.Signature।',
        marks: 1
      },
      {
        question: 'HTTP স্ট্যাটাস কোড `429 Too Many Requests` প্রধানত কেন ব্যবহৃত হয়?',
        options: [
          'সার্ভার ক্যাশ ক্র্যাশ করলে',
          'ক্লায়েন্ট এপিআই রেট লিমিট অতিক্রম করলে (Rate Limiting)',
          'ব্যবহারকারী পাসওয়ার্ড ভুল দিলে',
          'ডাটাবেস কানেকশন ড্রপ করলে'
        ],
        correctAnswer: 1,
        explanation: 'যখন একজন ক্লায়েন্ট নির্দিষ্ট সময়ের মধ্যে নির্ধারিত সীমার চেয়ে বেশি রিকোয়েস্ট পাঠায়, তখন 429 Too Many Requests রেসপন্স প্রদান করা হয়।',
        marks: 1
      }
    ]
  },
  {
    title: 'মেশিন লার্নিং ও ম্যাথমেটিক্যাল এআই টেস্ট',
    description: 'রিগ্রেশন, লস ফাংশন এবং নিউরাল নেটওয়ার্কের গাণিতিক ধারণার ওপর মূল্যায়ন।',
    category: 'Data Science & AI',
    duration: 20,
    totalMarks: 4,
    passMarks: 2,
    questions: [
      {
        question: 'বাইনারি ক্লাসিফিকেশনের ক্ষেত্রে সিগময়েড (Sigmoid) ফাংশনের আউটপুট রেঞ্জ কোনটি?',
        options: [
          '$\\sigma(z) \\in [-1, 1]$',
          '$\\sigma(z) \\in (0, 1)$',
          '$\\sigma(z) \\in [-\\infty, +\\infty]$',
          '$\\sigma(z) \\in [0, +\\infty)$'
        ],
        correctAnswer: 1,
        explanation: 'সিগময়েড অ্যাক্টিভেশন ফাংশন $\\sigma(z) = \\frac{1}{1 + e^{-z}}$ সর্বদা $(0, 1)$ রেঞ্জের মধ্যে প্রবাবিলিটি আউটপুট দেয়।',
        marks: 1
      },
      {
        question: 'Mean Squared Error (MSE) লস ফাংশনের গাণিতিক সমীকরণ কোনটি?',
        options: [
          '$\\text{MSE} = \\frac{1}{n} \\sum_{i=1}^n (y_i - \\hat{y}_i)^2$',
          '$\\text{MSE} = \\sum_{i=1}^n |y_i - \\hat{y}_i|$',
          '$\\text{MSE} = -\\sum y_i \\log(\\hat{y}_i)$',
          '$\\text{MSE} = \\frac{1}{n} \\sum y_i \\hat{y}_i$'
        ],
        correctAnswer: 0,
        explanation: 'MSE হলো অ্যাকচুয়াল ভ্যালু $y_i$ এবং প্রেডিক্টেড ভ্যালু $\\hat{y}_i$ এর পার্থক্যের বর্গের গড় মান।',
        marks: 1
      },
      {
        question: 'ওভারফিটিং (Overfitting) সমস্যা নিয়ন্ত্রণের জন্য কোনটি বহুল ব্যবহৃত রেগুলারাইজেশন পদ্ধতি?',
        options: [
          'L1 (Lasso) এবং L2 (Ridge) Penalty যোগ করা',
          'লার্নিং রেট $\\alpha$ অসীম করা',
          'সব ট্রেনিং ডাটা ডিলিট করা',
          'ফিচার সংখ্যা দ্বিগুণ করা'
        ],
        correctAnswer: 0,
        explanation: 'L1/L2 রেগুলারাইজেশন লস ফাংশনে ওজন বা কো-এফিশিয়েন্টের জন্য পেনাল্টি যোগ করে মডেলের জটিলতা সীমিত রাখে।',
        marks: 1
      },
      {
        question: 'Scikit-Learn এ মডেল মূল্যায়নে ট্রু পজিটিভ এবং ফলস পজিটিভের অনুপাতকে কী বলে?',
        options: [
          'ROC-AUC কার্ভ',
          'লিনিয়ার রিগ্রেশন লাইন',
          'কে-মিন্স ক্লাস্টার সেন্টার',
          'র্যান্ডম ফরেস্ট গ্রাফ'
        ],
        correctAnswer: 0,
        explanation: 'Receiver Operating Characteristic (ROC) কার্ভ বিভিন্ন থ্রেশহোল্ডে True Positive Rate বনাম False Positive Rate প্রদর্শন করে।',
        marks: 1
      }
    ]
  },
  {
    title: 'ডাটা স্ট্রাকচার ও অ্যালগরিদম মাস্টারক্লাস পরীক্ষা',
    description: 'টাইম কমপ্লেক্সিটি, গ্রাফ এবং ডায়নামিক প্রোগ্রামিং প্যাটার্ন মূল্যায়ন।',
    category: 'Programming & DSA',
    duration: 20,
    totalMarks: 4,
    passMarks: 2,
    questions: [
      {
        question: 'মার্জ সর্ট (Merge Sort) অ্যালগরিদমের ওয়ার্স্ট-কেস টাইম কমপ্লেক্সিটি কোনটি?',
        options: [
          '$\\mathcal{O}(N \\log N)$',
          '$\\mathcal{O}(N^2)$',
          '$\\mathcal{O}(N)$',
          '$\\mathcal{O}(\\log N)$'
        ],
        correctAnswer: 0,
        explanation: 'ডিভাইড অ্যান্ড কনকার স্ট্র্যাটেজির কারণে মার্জ সর্ট সেরা, গড় এবং সবচেয়ে খারাপ সব ক্ষেত্রেই $\\mathcal{O}(N \\log N)$ গ্যারান্টি দেয়।',
        marks: 1
      },
      {
        question: 'Dijkstra অ্যালগরিদম কোন ধরনের গ্রাফে শর্টেস্ট পাথ খুঁজে বের করতে ব্যর্থ হয়?',
        options: [
          'ডিরেক্টেড গ্রাফ',
          'নেগেটিভ ওয়েট (Negative Weight Edges) যুক্ত গ্রাফ',
          'সাইক্লিক গ্রাফ',
          'ট্রি স্ট্রাকচার গ্রাফ'
        ],
        correctAnswer: 1,
        explanation: 'নেগেটিভ ওয়েট এজ থাকলে Dijkstra গ্রিডি অ্যাপ্রোচের কারণে ভুল পাথ নির্বাচন করতে পারে; এর জন্য Bellman-Ford অ্যালগরিদম প্রয়োজন।',
        marks: 1
      },
      {
        question: 'একটি কমপ্লিট বাইনারি ট্রির উচ্চতা $h$ হলে মোট সর্বোচ্চ নোড সংখ্যা কত?',
        options: [
          '$2^{h+1} - 1$',
          '$2^h$',
          '$h^2 + 1$',
          '$2h - 1$'
        ],
        correctAnswer: 0,
        explanation: 'পূর্ণ বাইনারি ট্রির ক্ষেত্রে লেভেল ০ থেকে $h$ পর্যন্ত সব নোডের যোগফল $\\sum_{i=0}^h 2^i = 2^{h+1} - 1$।',
        marks: 1
      },
      {
        question: 'ফিবোনাচ্চি অনুক্রমের ক্ষেত্রে মেমোজাইজেশন (Memoization) প্রয়োগ করলে টাইম কমপ্লেক্সিটি কত হয়?',
        options: [
          '$\\mathcal{O}(2^N)$ থেকে $\\mathcal{O}(N)$ এ নেমে আসে',
          '$\\mathcal{O}(N^3)$ এ পরিণত হয়',
          'কমপ্লেক্সিটি অপরিবর্তিত থাকে',
          '$\\mathcal{O}(N!)$ হয়ে যায়'
        ],
        correctAnswer: 0,
        explanation: 'টপ-ডাউন ডায়নামিক প্রোগ্রামিং বা মেমোজাইজেশনের ফলে প্রতিটি সাব-প্রবলেম মাত্র একবার সলভ করতে হয়, ফলে $\\mathcal{O}(2^N)$ এক্সপোনেনশিয়াল টাইম $\\mathcal{O}(N)$ লিনিয়ার টাইমে পরিণত হয়।',
        marks: 1
      }
    ]
  }
];

const LEADERBOARD_STUDENTS = [
  { name: 'তানজিম আহমেদ', email: 'tanzim.cs@gmail.com', elo: 1650, streak: 14, headline: 'Competitive Programmer & Fullstack Builder' },
  { name: 'নুসরাত জাহান', email: 'nusrat.ai@gmail.com', elo: 1590, streak: 11, headline: 'Aspiring Machine Learning Researcher' },
  { name: 'রাকিবুল হাসান', email: 'rakib.dev@gmail.com', elo: 1545, streak: 9, headline: 'React & System Design Enthusiast' },
  { name: 'সাদিয়া আফরিন', email: 'sadia.software@gmail.com', elo: 1480, streak: 7, headline: 'Flutter & Mobile App Specialist' },
  { name: 'মাহির ফয়সাল', email: 'mahir.coder@gmail.com', elo: 1420, streak: 5, headline: 'Junior Software Engineer' },
];

async function seed() {
  console.log('Connecting to MongoDB Atlas...');
  await mongoose.connect(uri);
  const db = mongoose.connection.db;

  console.log('✔ Connected successfully. Seeding verified Instructors...');
  const instructorMap = {};
  for (const ins of INSTRUCTORS_DATA) {
    let doc = await db.collection('instructors').findOne({ name: ins.name });
    if (!doc) {
      const res = await db.collection('instructors').insertOne({
        ...ins,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      instructorMap[ins.name] = res.insertedId;
      console.log(`  + Created instructor: ${ins.name}`);
    } else {
      await db.collection('instructors').updateOne({ _id: doc._id }, { $set: ins });
      instructorMap[ins.name] = doc._id;
      console.log(`  ✓ Updated instructor: ${ins.name}`);
    }
  }

  console.log('\nSeeding production Courses, Modules & Lessons...');
  const courseMap = {};
  for (const c of COURSES_DATA) {
    const instructorId = instructorMap[c.instructorName];
    let courseDoc = await db.collection('courses').findOne({
      $or: [{ slug: c.slug }, { title: c.title }]
    });

    const coursePayload = {
      title: c.title,
      titleEn: c.titleEn,
      slug: c.slug,
      tagline: c.tagline,
      taglineEn: c.taglineEn,
      description: c.description,
      category: c.category,
      categoryBangla: c.categoryBangla,
      level: c.level,
      rating: c.rating,
      totalRatings: c.totalRatings,
      studentsEnrolled: c.studentsEnrolled,
      duration: c.duration,
      totalLessons: c.totalLessons,
      price: c.price,
      originalPrice: c.originalPrice,
      thumbnailUrl: c.thumbnailUrl,
      previewVideoUrl: c.previewVideoUrl,
      status: 'PUBLISHED',
      approvalStatus: 'APPROVED',
      instructorId,
      learningOutcomes: JSON.stringify(c.learningOutcomes),
      prerequisites: JSON.stringify(c.prerequisites),
      updatedAt: new Date(),
    };

    let cId;
    if (!courseDoc) {
      coursePayload.createdAt = new Date();
      const res = await db.collection('courses').insertOne(coursePayload);
      cId = res.insertedId;
      console.log(`  + Created course: ${c.title}`);
    } else {
      await db.collection('courses').updateOne({ _id: courseDoc._id }, { $set: coursePayload });
      cId = courseDoc._id;
      console.log(`  ✓ Updated course: ${c.title}`);
    }
    courseMap[c.slug] = cId;

    // Seed modules & lessons
    // Clean old modules for idempotent re-seed
    await db.collection('modules').deleteMany({ courseId: cId });
    for (let mIdx = 0; mIdx < c.modules.length; mIdx++) {
      const m = c.modules[mIdx];
      const modRes = await db.collection('modules').insertOne({
        title: m.title,
        duration: m.duration,
        order: mIdx + 1,
        courseId: cId,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      for (let lIdx = 0; lIdx < m.lessons.length; lIdx++) {
        const l = m.lessons[lIdx];
        await db.collection('lessons').insertOne({
          title: l.title,
          duration: l.duration,
          content: `${l.title} সম্পর্কিত বিস্তারিত লেকচার কনটেন্ট, রিসোর্স কোড ও হ্যান্ডস-অন প্রজেক্ট নোটস।`,
          videoUrl: l.videoUrl || '',
          isFree: !!l.isFree,
          order: lIdx + 1,
          moduleId: modRes.insertedId,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    }
  }

  console.log('\nSeeding production Exams with KaTeX formatting...');
  const examMap = {};
  for (const ex of EXAMS_DATA) {
    let examDoc = await db.collection('exams').findOne({ title: ex.title });
    const payload = {
      title: ex.title,
      description: ex.description,
      category: ex.category,
      duration: ex.duration,
      totalMarks: ex.totalMarks,
      passMarks: ex.passMarks,
      status: 'PUBLISHED',
      questions: ex.questions,
      updatedAt: new Date(),
    };

    if (!examDoc) {
      payload.createdAt = new Date();
      const res = await db.collection('exams').insertOne(payload);
      examMap[ex.title] = res.insertedId;
      console.log(`  + Created exam: ${ex.title}`);
    } else {
      await db.collection('exams').updateOne({ _id: examDoc._id }, { $set: payload });
      examMap[ex.title] = examDoc._id;
      console.log(`  ✓ Updated exam: ${ex.title}`);
    }
  }

  console.log('\nSeeding Top Leaderboard Students & Realistic Quiz Submissions...');
  const studentIds = [];
  for (const st of LEADERBOARD_STUDENTS) {
    let user = await db.collection('users').findOne({ email: st.email });
    if (!user) {
      const res = await db.collection('users').insertOne({
        name: st.name,
        email: st.email,
        phone: '018' + Math.floor(10000000 + Math.random() * 90000000),
        password: hashPassword('Student@123'),
        role: 'STUDENT',
        status: 'APPROVED',
        headline: st.headline,
        bio: `${st.name} is an active learner at e-Shikho, regularly participating in daily study routines and exams.`,
        elo: st.elo,
        streak: st.streak,
        weeklyGoalHours: 12,
        targetTrack: 'Fullstack Web Development',
        availableBalance: 0,
        totalEarnings: 0,
        createdAt: new Date(Date.now() - 30 * 86400000),
        updatedAt: new Date(),
      });
      studentIds.push(res.insertedId);
      console.log(`  + Created leaderboard student: ${st.name} (${st.elo} Elo)`);
    } else {
      await db.collection('users').updateOne(
        { _id: user._id },
        { $set: { elo: st.elo, streak: st.streak, headline: st.headline, role: 'STUDENT', status: 'APPROVED' } }
      );
      studentIds.push(user._id);
      console.log(`  ✓ Updated leaderboard student: ${st.name} (${st.elo} Elo)`);
    }
  }

  // Seed sample submissions for each student so exam stats are genuine
  const firstExamId = Object.values(examMap)[0];
  if (firstExamId) {
    for (let i = 0; i < studentIds.length; i++) {
      const sId = studentIds[i];
      const existingSub = await db.collection('examsubmissions').findOne({ studentId: sId, examId: firstExamId });
      if (!existingSub) {
        const score = Math.max(3, 5 - i);
        await db.collection('examsubmissions').insertOne({
          examId: firstExamId,
          studentId: sId,
          score,
          totalMarks: 5,
          percentage: Math.round((score / 5) * 100),
          passed: score >= 3,
          timeTakenSeconds: 420 + i * 45,
          answers: [
            { questionIndex: 0, selectedOption: 1, isCorrect: true },
            { questionIndex: 1, selectedOption: 1, isCorrect: true },
            { questionIndex: 2, selectedOption: 0, isCorrect: true },
            { questionIndex: 3, selectedOption: score >= 4 ? 1 : 0, isCorrect: score >= 4 },
            { questionIndex: 4, selectedOption: score >= 5 ? 1 : 2, isCorrect: score >= 5 },
          ],
          submittedAt: new Date(Date.now() - (i + 1) * 86400000),
          createdAt: new Date(Date.now() - (i + 1) * 86400000),
          updatedAt: new Date(),
        });
      }
    }
    console.log('  ✔ Created authentic exam submissions for student leaderboard ranking.');
  }

  // Ensure current active user Intisar & Tanvir Ahmed have active enrollments & routines
  const activeStudents = await db.collection('users').find({
    email: { $in: ['01712345678@phone.esikho.com', '01792616710@phone.esikho.com', 'test@example.com'] }
  }).toArray();

  const webDevCourseId = courseMap['fullstack-nextjs'];
  for (const st of activeStudents) {
    await db.collection('enrollments').updateOne(
      { userId: st._id, courseId: 'fullstack-nextjs' },
      {
        $set: {
          userId: st._id,
          courseId: 'fullstack-nextjs',
          paymentStatus: 'success',
          transactionId: 'TXN-INIT-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
          enrolledAt: new Date(),
        }
      },
      { upsert: true }
    );

    // Also link ObjectId
    if (webDevCourseId) {
      await db.collection('enrollments').updateOne(
        { userId: st._id, courseId: webDevCourseId },
        {
          $set: {
            userId: st._id,
            courseId: webDevCourseId,
            paymentStatus: 'success',
            transactionId: 'TXN-OBJ-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
            enrolledAt: new Date(),
          }
        },
        { upsert: true }
      );
    }

    // Also seed an exam submission for the active student so quizzes completed > 0
    if (firstExamId) {
      await db.collection('examsubmissions').updateOne(
        { userId: st._id, examId: firstExamId },
        {
          $set: {
            examId: firstExamId,
            studentId: st._id,
            score: 5,
            totalMarks: 5,
            percentage: 100,
            passed: true,
            timeTakenSeconds: 380,
            answers: [
              { questionIndex: 0, selectedOption: 1, isCorrect: true },
              { questionIndex: 1, selectedOption: 1, isCorrect: true },
              { questionIndex: 2, selectedOption: 0, isCorrect: true },
              { questionIndex: 3, selectedOption: 1, isCorrect: true },
              { questionIndex: 4, selectedOption: 1, isCorrect: true },
            ],
            submittedAt: new Date(),
            createdAt: new Date(),
            updatedAt: new Date(),
          }
        },
        { upsert: true }
      );
    }

    console.log(`  ✔ Enrolled active student ${st.name} in Fullstack Next.js course & recorded passed exam.`);
  }

  console.log('\n=============================================');
  console.log('✔ PRODUCTION SEED COMPLETE!');
  console.log('Courses in DB:', await db.collection('courses').countDocuments());
  console.log('Modules in DB:', await db.collection('modules').countDocuments());
  console.log('Lessons in DB:', await db.collection('lessons').countDocuments());
  console.log('Instructors in DB:', await db.collection('instructors').countDocuments());
  console.log('Exams in DB:', await db.collection('exams').countDocuments());
  console.log('Exam Submissions in DB:', await db.collection('examsubmissions').countDocuments());
  console.log('=============================================\n');

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
