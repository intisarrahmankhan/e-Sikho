/**
 * prisma/seed.ts
 *
 * Seeds the database with:
 *   1. Demo users  (SUPERADMIN, INSTRUCTOR, STUDENT)
 *   2. All courses from lib/courses-data.ts, including nested
 *      Instructors, Modules, and Lessons.
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const COURSES_DATA = [
  {
    id: "fullstack-nextjs",
    title: "ফুলস্ট্যাক ওয়েব ডেভেলপমেন্ট (Next.js, React & Node.js)",
    tagline: "জিরো থেকে প্রো লেভেলের আধুনিক ওয়েব অ্যাপ্লিকেশন তৈরি করুন",
    description: "এই কোর্সে আপনি আধুনিক ওয়েব টেকনোলজি যেমন Next.js 14, React, TypeScript, Tailwind CSS, Node.js, Prisma এবং PostgreSQL ব্যবহার করে রিয়েল-ওয়ার্ল্ড ফুলস্ট্যাক প্রজেক্ট তৈরি করতে শিখবেন। প্রজেক্ট ভিত্তিক শিক্ষার মাধ্যমে আপনি চাকরির জন্য প্রস্তুত পোর্টফোলিও তৈরি করতে পারবেন।",
    category: "web-dev",
    categoryBangla: "ওয়েব ডেভেলপমেন্ট",
    level: "বিগিনার",
    rating: 4.9,
    totalRatings: 340,
    studentsEnrolled: 1250,
    duration: "৪৫ ঘণ্টা",
    totalLessons: 68,
    price: 4500,
    originalPrice: 8000,
    thumbnailUrl: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=800&auto=format&fit=crop",
    instructor: {
      name: "তানভীর আহমেদ",
      role: "সিনিয়র ফুলস্ট্যাক ইঞ্জিনিয়ার",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop",
      bio: "৮+ বছরের অভিজ্ঞতা সম্পন্ন সফটওয়্যার ইঞ্জিনিয়ার। শীর্ষস্থানীয় আন্তর্জাতিক প্রতিষ্ঠানে কাজ করার অভিজ্ঞতা।"
    },
    learningOutcomes: [
      "Next.js App Router এবং Server Components এর বিস্তারিত ব্যবহার",
      "TypeScript দিয়ে ক্লিন ও টাইপ-সেফ কোড লেখা",
      "PostgreSQL ও Prisma ORM দিয়ে ব্যাকএন্ড ডাটাবেস ডিজাইন",
      "NextAuth এবং JWT ব্যবহার করে সিকিউর অথেন্টিকেশন সিস্টেম",
      "পেমেন্ট গেটওয়ে ইন্টিগ্রেশন (bKash, SSLCommerz ও Stripe)",
      "Vercel এবং Docker দিয়ে প্রজেক্ট ডেপ্লয়মেন্ট"
    ],
    prerequisites: [
      "HTML, CSS এবং বেসিক JavaScript এর ধারণা",
      "কম্পিউটার এবং ইন্টারনেট সংযোগ",
      "শেখার আগ্রহ ও নিয়মিত অনুশীলনের মানসিকতা"
    ],
    modules: [
      {
        id: "m1",
        title: "মডিউল ১: আধুনিক JavaScript ও TypeScript পরিচিতি",
        duration: "৬ ঘণ্টা",
        lessons: [
          { id: "l1", title: "ES6+ গুরুত্বপূর্ণ ফিচারসমূহ ও অ্যাসিঙ্ক প্রোগ্রামিং", duration: "৪৫ মিনিট", isFree: true },
          { id: "l2", title: "TypeScript এর ফান্ডামেন্টালস ও টাইপ সিস্টেম", duration: "১ ঘণ্টা ১৫ মিনিট", isFree: true },
          { id: "l3", title: "React এর সাথে TypeScript ইন্টিগ্রেশন", duration: "১ ঘণ্টা" }
        ]
      },
      {
        id: "m2",
        title: "মডিউল ২: Next.js 14 আর্কিটেকচার ও App Router",
        duration: "১২ ঘণ্টা",
        lessons: [
          { id: "l4", title: "Next.js App Router, লেআউট ও পেজ রাউটিং", duration: "১ ঘণ্টা ৩০ মিনিট" },
          { id: "l5", title: "Server vs Client Components এবং ডেটা ফেচিং", duration: "২ ঘণ্টা" },
          { id: "l6", title: "Server Actions ও ফর্ম হ্যান্ডলিং", duration: "১ ঘণ্টা ৪৫ মিনিট" }
        ]
      },
      {
        id: "m3",
        title: "মডিউল ৩: ডাটাবেস ও অথেন্টিকেশন",
        duration: "১৫ ঘণ্টা",
        lessons: [
          { id: "l7", title: "Prisma ORM এবং PostgreSQL স্কিমা ডিজাইন", duration: "২ ঘণ্টা ১৫ মিনিট" },
          { id: "l8", title: "NextAuth.js দিয়ে রোল-বেসড অথেন্টিকেশন", duration: "২ ঘণ্টা ৩০ মিনিট" },
          { id: "l9", title: "পেমেন্ট গেটওয়ে ইন্টিগ্রেশন ও অর্ডারিং সিস্টেম", duration: "৩ ঘণ্টা" }
        ]
      }
    ]
  },
  {
    id: "python-machine-learning",
    title: "পাইথন দিয়ে মেশিন লার্নিং ও এআই (AI & ML)",
    tagline: "ডাটা অ্যানালাইসিস থেকে প্রেডিক্টিভ এআই মডেল তৈরি শিখুন",
    description: "মেশিন লার্নিং এবং কৃত্রিম বুদ্ধিমত্তার জগতে প্রবেশের জন্য একটি পূর্ণাঙ্গ কোর্স। ডেটা প্রসেসিং, সুপারভাইজড ও আনসুপারভাইজড লার্নিং, ডিপ লার্নিং এবং প্র্যাকটিকাল এআই মডেল বিল্ডিং শিখুন হাতে-কলমে।",
    category: "data-science",
    categoryBangla: "ডাটা সায়েন্স ও এআই",
    level: "ইন্টারমিডিয়েট",
    rating: 4.8,
    totalRatings: 210,
    studentsEnrolled: 890,
    duration: "৪০ ঘণ্টা",
    totalLessons: 54,
    price: 5000,
    originalPrice: 9000,
    thumbnailUrl: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=800&auto=format&fit=crop",
    instructor: {
      name: "ড. সাজিদ হাসান",
      role: "লিড ডাটা সায়েন্টিস্ট",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop",
      bio: "মেশিন লার্নিং ও ডেটা সায়েন্সে পিএইচডি এবং আন্তর্জাতিক জার্নালে একাধিক রিসার্চ পাবলিকেশন রয়েছে।"
    },
    learningOutcomes: [
      "NumPy এবং Pandas দিয়ে ডাটা ম্যানিপুলেশন ও ক্লিনিং",
      "Matplotlib ও Seaborn দিয়ে ডাটা ভিজ্যুয়ালাইজেশন",
      "Scikit-Learn দিয়ে রিগ্রেশন, ক্লাসিফিকেশন ও ক্লাস্টারিং",
      "Neural Networks ও TensorFlow/Keras এর বেসিকস",
      "NLP এবং Computer Vision এর প্রজেক্ট"
    ],
    prerequisites: [
      "বেসিক পাইথন প্রোগ্রামিং জ্ঞান",
      "উচ্চ মাধ্যমিক পর্যায়ের গণিত ও পরিসংখ্যানের মৌলিক ধারণা"
    ],
    modules: [
      {
        id: "ml-m1",
        title: "মডিউল ১: পাইথন ফর ডাটা সায়েন্স",
        duration: "৮ ঘণ্টা",
        lessons: [
          { id: "ml-l1", title: "NumPy অ্যারে ও ম্যাট্রিক্স অপারেশন", duration: "১ ঘণ্টা", isFree: true },
          { id: "ml-l2", title: "Pandas ডেটাফ্রেম ও ডাটা ফিল্টারিং", duration: "১ ঘণ্টা ৩০ মিনিট" }
        ]
      },
      {
        id: "ml-m2",
        title: "মডিউল ২: সুপারভাইজড মেশিন লার্নিং অ্যালগরিদম",
        duration: "১৬ ঘণ্টা",
        lessons: [
          { id: "ml-l3", title: "লিনিয়ার রিগ্রেশন ও লজিস্টিক রিগ্রেশন", duration: "২ ঘণ্টা" },
          { id: "ml-l4", title: "ডিসিশন ট্রি ও র্যান্ডম ফরেস্ট মডেলিং", duration: "২ ঘণ্টা ১৫ মিনিট" }
        ]
      }
    ]
  },
  {
    id: "dsa-in-bangla",
    title: "ডাটা স্ট্রাকচার ও অ্যালগরিদম (DSA Mastery)",
    tagline: "কোডিং ইন্টারভিউ ও সফটওয়্যার ইঞ্জিনিয়ারিংয়ের মূল ভিত্তি",
    description: "গুগল, মেটাসহ শীর্ষস্থানীয় টেক কোম্পানিতে সফটওয়্যার ইঞ্জিনিয়ার হিসেবে কোডিং ইন্টারভিউ ক্র্যাক করার জন্য ডেটা স্ট্রাকচার ও অ্যালগরিদমের সম্পূর্ণ বাংলায় বাস্তবমুখী মাস্টারক্লাস।",
    category: "programming",
    categoryBangla: "প্রোগ্রামিং ফান্ডামেন্টালস",
    level: "ইন্টারমিডিয়েট",
    rating: 4.9,
    totalRatings: 480,
    studentsEnrolled: 2100,
    duration: "৫০ ঘণ্টা",
    totalLessons: 90,
    price: 3500,
    originalPrice: 6500,
    thumbnailUrl: "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?q=80&w=800&auto=format&fit=crop",
    instructor: {
      name: "নাজমুল আরেফিন",
      role: "কম্পিটিটিভ প্রোগ্রামার ও এক্স-FAANG ইঞ্জিনিয়ার",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&auto=format&fit=crop",
      bio: "ICPC ওয়ার্ল্ড ফাইনালিস্ট এবং শত শত শিক্ষার্থীকে কোডিং ইন্টারভিউতে সফল হতে সহায়তা করেছেন।"
    },
    learningOutcomes: [
      "Time & Space Complexity (Big-O Notation) গভীর বিশ্লেষণ",
      "Arrays, Linked Lists, Stacks, Queues, Trees, Graphs মাস্টার করা",
      "Dynamic Programming (DP), Greedy & Divide-and-Conquer কৌশল",
      "LeetCode এর ২০০+ গুরুত্বপূর্ণ সমস্যা সমাধান"
    ],
    prerequisites: [
      "যেকোনো একটি প্রোগ্রামিং ভাষা (C++, Java, Python অথবা JS) জানা থাকা প্রয়োজন"
    ],
    modules: [
      {
        id: "dsa-m1",
        title: "মডিউল ১: কমপ্লেক্সিটি অ্যানালাইসিস ও ফান্ডামেন্টালস",
        duration: "৬ ঘণ্টা",
        lessons: [
          { id: "dsa-l1", title: "টাইম ও স্পেস কমপ্লেক্সিটি হিসাবের সহজ উপায়", duration: "৫০ মিনিট", isFree: true },
          { id: "dsa-l2", title: "রিকার্শন এবং ব্যাকট্র্যাকিং এর মূল কৌশল", duration: "১ ঘণ্টা ২০ মিনিট" }
        ]
      },
      {
        id: "dsa-m2",
        title: "মডিউল ২: অ্যাডভান্সড ডেটা স্ট্রাকচার ও গ্রাফ থিওরি",
        duration: "২০ ঘণ্টা",
        lessons: [
          { id: "dsa-l3", title: "বাইনারি সার্চ ট্রি (BST) এবং AVL ট্রি", duration: "২ ঘণ্টা" },
          { id: "dsa-l4", title: "BFS, DFS এবং শর্টেস্ট পাথ অ্যালগরিদম", duration: "২ ঘণ্টা ৩০ মিনিট" }
        ]
      }
    ]
  },
  {
    id: "system-design-architecture",
    title: "সিস্টেম ডিজাইন ও সফটওয়্যার আর্কিটেকচার",
    tagline: "মিলিয়ন ব্যবহারকারীর উপযোগী হাই-স্কেল সিস্টেম তৈরি",
    description: "লার্জ স্কেল ডিস্ট্রিবিউটেড সিস্টেম তৈরি, মাইক্রোসার্ভিস আর্কিটেকচার, লোড ব্যালেন্সিং, ক্যাশিং, ডাটাবেস শার্ডিং এবং হাই-অ্যাভেইলেবিলিটি ডিজাইন শিখুন।",
    category: "system-design",
    categoryBangla: "সিস্টেম ডিজাইন",
    level: "অ্যাডভান্সড",
    rating: 4.9,
    totalRatings: 180,
    studentsEnrolled: 620,
    duration: "৩৫ ঘণ্টা",
    totalLessons: 45,
    price: 6000,
    originalPrice: 10000,
    thumbnailUrl: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=800&auto=format&fit=crop",
    instructor: {
      name: "ইফতেখারুল আলম",
      role: "প্রিন্সিপাল আর্কিটেক্ট",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=200&auto=format&fit=crop",
      bio: "১৫+ বছরের অভিজ্ঞতা সম্পন্ন ডিস্ট্রিবিউটেড সিস্টেম এবং ক্লাউড আর্কিটেকচার বিশেষজ্ঞ।"
    },
    learningOutcomes: [
      "মনোলিথিক বনাম মাইক্রোসার্ভিসেস আর্কিটেকচার নির্বাচন",
      "Redis, Memcached ক্যাশিং স্ট্র্যাটেজি ও মেসেজ কিউ (Kafka, RabbitMQ)",
      "ডাটাবেস রেপ্লিকেশন, পার্টিশনিং এবং CAP থিওরেম প্রয়োগ",
      "রিয়েল-লাইফ কেস স্টাডি: Uber, YouTube, Netflix সিস্টেম ডিজাইন"
    ],
    prerequisites: [
      "কমপক্ষে ১-২ বছরের সফটওয়্যার ডেভেলপমেন্টের বাস্তব অভিজ্ঞতা",
      "ডাটাবেস ও নেটওয়ার্কিংয়ের সাধারণ ধারণা"
    ],
    modules: [
      {
        id: "sd-m1",
        title: "মডিউল ১: স্কেলেবিলিটি ফান্ডামেন্টালস",
        duration: "৮ ঘণ্টা",
        lessons: [
          { id: "sd-l1", title: "ভার্টিক্যাল বনাম হরাইজন্টাল স্কেলিং ও লোড ব্যালেন্সার", duration: "১ ঘণ্টা ১৫ মিনিট", isFree: true },
          { id: "sd-l2", title: "ক্যাশিং পলিসি ও CDN এর সর্বোত্তম ব্যবহার", duration: "১ ঘণ্টা ৩০ মিনিট" }
        ]
      }
    ]
  },
  {
    id: "flutter-mobile-app",
    title: "ফ্লাটার দিয়ে ক্রস-প্ল্যাটফর্ম মোবাইল অ্যাপ ডেভেলপমেন্ট",
    tagline: "এক কোডেই Android এবং iOS অ্যাপ তৈরি করুন",
    description: "Dart প্রোগ্রামিং ভাষা এবং Flutter ফ্রেমওয়ার্ক ব্যবহার করে প্রফেশনাল, সুন্দর ও ফ্লুইড পারফরম্যান্সের মোবাইল অ্যাপস ডেভেলপমেন্ট শিখুন একদম শুরু থেকে।",
    category: "app-dev",
    categoryBangla: "অ্যাপ ডেভেলপমেন্ট",
    level: "বিগিনার",
    rating: 4.7,
    totalRatings: 290,
    studentsEnrolled: 1100,
    duration: "৩৮ ঘণ্টা",
    totalLessons: 60,
    price: 4000,
    originalPrice: 7500,
    thumbnailUrl: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?q=80&w=800&auto=format&fit=crop",
    instructor: {
      name: "ফারহানা ইয়াসমিন",
      role: "সিনিয়র মোবাইল অ্যাপ ডেভেলপার",
      avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=200&auto=format&fit=crop",
      bio: "মোবাইল অ্যাপ্লিকেশন ডিজাইনার এবং ডেভেলপার। প্লে-স্টোর ও অ্যাপ স্টোরে ৩০+ লাইভ অ্যাপ রয়েছে।"
    },
    learningOutcomes: [
      "Dart ভাষার মূল সিনট্যাক্স ও অবজেক্ট ওরিয়েন্টেড প্রোগ্রামিং",
      "Flutter UI উইজেট, স্টেট ম্যানেজমেন্ট (Bloc/Riverpod)",
      "REST API এবং Firebase ব্যাকএন্ড কানেকশন",
      "Google Play Store ও Apple App Store এ অ্যাপ রিলিজ"
    ],
    prerequisites: [
      "যেকোনো প্রোগ্রামিং ভাষার প্রাথমিক ধারণা থাকলে সুবিধা হবে"
    ],
    modules: [
      {
        id: "fl-m1",
        title: "মডিউল ১: ডার্ট ল্যাঙ্গুয়েজ ও ফ্লাটার বেসিকস",
        duration: "১০ ঘণ্টা",
        lessons: [
          { id: "fl-l1", title: "Dart OOP ও অ্যাসিঙ্ক্রোনাস প্রোগ্রামিং", duration: "১ ঘণ্টা", isFree: true },
          { id: "fl-l2", title: "Stateless vs Stateful Widgets", duration: "১ ঘণ্টা ১৫ মিনিট" }
        ]
      }
    ]
  }
];

function toJson(arr: string[]): string {
  return JSON.stringify(arr);
}

async function main() {
  // 1. Seed demo users
  const [adminPwd, instructorPwd, studentPwd] = await Promise.all([
    bcrypt.hash('admin123456', 10),
    bcrypt.hash('instructor123', 10),
    bcrypt.hash('student123', 10),
  ]);

  const admin = await prisma.user.upsert({
    where:  { email: 'admin@eshikho.com' },
    update: { password: adminPwd, role: 'SUPERADMIN' },
    create: { email: 'admin@eshikho.com', name: 'Super Admin', password: adminPwd, role: 'SUPERADMIN' },
  });

  const instructor = await prisma.user.upsert({
    where:  { email: 'instructor@eshikho.com' },
    update: { password: instructorPwd, role: 'INSTRUCTOR' },
    create: { email: 'instructor@eshikho.com', name: 'Tariq Instructor', password: instructorPwd, role: 'INSTRUCTOR' },
  });

  const student = await prisma.user.upsert({
    where:  { email: 'student@eshikho.com' },
    update: { password: studentPwd, role: 'STUDENT' },
    create: { email: 'student@eshikho.com', name: 'Rahim Student', password: studentPwd, role: 'STUDENT' },
  });

  console.log('\n✅ Seeded Users:');
  console.log(`   • ${admin.email}      (${admin.role})`);
  console.log(`   • ${instructor.email} (${instructor.role})`);
  console.log(`   • ${student.email}    (${student.role})`);

  // 2. Seed courses
  console.log('\n📚 Seeding Courses…');

  for (const course of COURSES_DATA) {
    const instructorRow = await prisma.instructor.upsert({
      where: {
        id: `${course.id}-instructor`,
      },
      update: {
        name:   course.instructor.name,
        role:   course.instructor.role,
        avatar: course.instructor.avatar,
        bio:    course.instructor.bio,
      },
      create: {
        id:     `${course.id}-instructor`,
        name:   course.instructor.name,
        role:   course.instructor.role,
        avatar: course.instructor.avatar,
        bio:    course.instructor.bio,
      },
    });

    await prisma.course.upsert({
      where:  { id: course.id },
      update: {
        title:            course.title,
        tagline:          course.tagline,
        description:      course.description,
        category:         course.category,
        categoryBangla:   course.categoryBangla,
        level:            course.level,
        rating:           course.rating,
        totalRatings:     course.totalRatings,
        studentsEnrolled: course.studentsEnrolled,
        duration:         course.duration,
        totalLessons:     course.totalLessons,
        price:            course.price,
        originalPrice:    course.originalPrice,
        thumbnailUrl:     course.thumbnailUrl,
        instructorId:     instructorRow.id,
        learningOutcomes: toJson(course.learningOutcomes),
        prerequisites:    toJson(course.prerequisites),
      },
      create: {
        id:               course.id,
        title:            course.title,
        tagline:          course.tagline,
        description:      course.description,
        category:         course.category,
        categoryBangla:   course.categoryBangla,
        level:            course.level,
        rating:           course.rating,
        totalRatings:     course.totalRatings,
        studentsEnrolled: course.studentsEnrolled,
        duration:         course.duration,
        totalLessons:     course.totalLessons,
        price:            course.price,
        originalPrice:    course.originalPrice,
        thumbnailUrl:     course.thumbnailUrl,
        instructorId:     instructorRow.id,
        learningOutcomes: toJson(course.learningOutcomes),
        prerequisites:    toJson(course.prerequisites),
      },
    });

    for (let mIdx = 0; mIdx < course.modules.length; mIdx++) {
      const mod = course.modules[mIdx];

      await prisma.module.upsert({
        where:  { id: mod.id },
        update: { title: mod.title, duration: mod.duration, order: mIdx },
        create: { id: mod.id, title: mod.title, duration: mod.duration, order: mIdx, courseId: course.id },
      });

      for (let lIdx = 0; lIdx < mod.lessons.length; lIdx++) {
        const lesson = mod.lessons[lIdx];

        await prisma.lesson.upsert({
          where:  { id: lesson.id },
          update: { title: lesson.title, duration: lesson.duration, isFree: lesson.isFree ?? false, order: lIdx },
          create: {
            id:       lesson.id,
            title:    lesson.title,
            duration: lesson.duration,
            isFree:   lesson.isFree ?? false,
            order:    lIdx,
            moduleId: mod.id,
          },
        });
      }
    }

    console.log(`   ✔ ${course.id}  (${course.modules.length} modules)`);
  }

  // 3. Summary
  const [courseCount, moduleCount, lessonCount] = await Promise.all([
    prisma.course.count(),
    prisma.module.count(),
    prisma.lesson.count(),
  ]);

  console.log('\n🎉 Seed complete!');
  console.log(`   Courses : ${courseCount}`);
  console.log(`   Modules : ${moduleCount}`);
  console.log(`   Lessons : ${lessonCount}`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
