export interface Lesson {
  id: string;
  title: string;
  titleEn?: string;
  duration: string;
  durationEn?: string;
  isFree?: boolean;
  videoUrl?: string;
}

export interface Module {
  id: string;
  title: string;
  titleEn?: string;
  duration: string;
  durationEn?: string;
  lessons: Lesson[];
}

export interface Course {
  id: string;
  title: string;
  titleEn?: string;
  tagline: string;
  taglineEn?: string;
  description: string;
  descriptionEn?: string;
  category: 'web-dev' | 'data-science' | 'app-dev' | 'programming' | 'system-design';
  categoryBangla: string;
  categoryEn?: string;
  level: 'বিগিনার' | 'ইন্টারমিডিয়েট' | 'অ্যাডভান্সড';
  levelEn?: string;
  rating: number;
  totalRatings: number;
  studentsEnrolled: number;
  duration: string;
  durationEn?: string;
  totalLessons: number;
  price: number;
  originalPrice: number;
  thumbnailUrl: string;
  thumbnailUrlEn?: string;
  previewVideoUrl?: string;
  instructor: {
    name: string;
    nameEn?: string;
    role: string;
    roleEn?: string;
    avatar: string;
    bio: string;
    bioEn?: string;
  };
  learningOutcomes: string[];
  learningOutcomesEn?: string[];
  prerequisites: string[];
  prerequisitesEn?: string[];
  modules: Module[];
}

export const COURSES_DATA: Course[] = [
  {
    id: "fullstack-nextjs",
    title: "ফুলস্ট্যাক ওয়েব ডেভেলপমেন্ট (Next.js, React & Node.js)",
    titleEn: "Fullstack Web Development (Next.js, React & Node.js)",
    tagline: "জিরো থেকে প্রো লেভেলের আধুনিক ওয়েব অ্যাপ্লিকেশন তৈরি করুন",
    taglineEn: "Build modern, production-ready web applications from zero to pro",
    description: "এই কোর্সে আপনি আধুনিক ওয়েব টেকনোলজি যেমন Next.js 14, React, TypeScript, Tailwind CSS, Node.js, Prisma এবং PostgreSQL ব্যবহার করে রিয়েল-ওয়ার্ল্ড ফুলস্ট্যাক প্রজেক্ট তৈরি করতে শিখবেন। প্রজেক্ট ভিত্তিক শিক্ষার মাধ্যমে আপনি চাকরির জন্য প্রস্তুত পোর্টফোলিও তৈরি করতে পারবেন।",
    descriptionEn: "Master modern full-stack web development using Next.js 14, React, TypeScript, Tailwind CSS, Node.js, Prisma, and PostgreSQL. Build industry-grade production applications with hands-on projects and craft a competitive job-ready portfolio.",
    category: "web-dev",
    categoryBangla: "ওয়েব ডেভেলপমেন্ট",
    categoryEn: "Web Development",
    level: "বিগিনার",
    levelEn: "Beginner",
    rating: 4.9,
    totalRatings: 340,
    studentsEnrolled: 1250,
    duration: "৪৫ ঘণ্টা",
    durationEn: "45 hours",
    totalLessons: 68,
    price: 4500,
    originalPrice: 8000,
    thumbnailUrl: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=800&auto=format&fit=crop",
    thumbnailUrlEn: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=800&auto=format&fit=crop",
    instructor: {
      name: "তানভীর আহমেদ",
      nameEn: "Tanveer Ahmed",
      role: "সিনিয়র ফুলস্ট্যাক ইঞ্জিনিয়ার",
      roleEn: "Senior Fullstack Engineer",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop",
      bio: "৮+ বছরের অভিজ্ঞতা সম্পন্ন সফটওয়্যার ইঞ্জিনিয়ার। শীর্ষস্থানীয় আন্তর্জাতিক প্রতিষ্ঠানে কাজ করার অভিজ্ঞতা।",
      bioEn: "Software engineer with 8+ years of industry experience building high-scale distributed web platforms."
    },
    learningOutcomes: [
      "Next.js App Router এবং Server Components এর বিস্তারিত ব্যবহার",
      "TypeScript দিয়ে ক্লিন ও টাইপ-সেফ কোড লেখা",
      "PostgreSQL ও Prisma ORM দিয়ে ব্যাকএন্ড ডাটাবেস ডিজাইন",
      "NextAuth এবং JWT ব্যবহার করে সিকিউর অথেন্টিকেশন সিস্টেম",
      "পেমেন্ট গেটওয়ে ইন্টিগ্রেশন (bKash, SSLCommerz ও Stripe)",
      "Vercel এবং Docker দিয়ে প্রজেক্ট ডেপ্লয়মেন্ট"
    ],
    learningOutcomesEn: [
      "Master Next.js App Router, Server Components & Actions",
      "Write clean, type-safe production code with TypeScript",
      "Architect relational databases with PostgreSQL and Prisma ORM",
      "Implement robust authentication using NextAuth.js and JWTs",
      "Integrate automated payment gateways (bKash, SSLCommerz & Stripe)",
      "Deploy scalable applications using Docker and Vercel"
    ],
    prerequisites: [
      "HTML, CSS এবং বেসিক JavaScript এর ধারণা",
      "কম্পিউটার এবং ইন্টারনেট সংযোগ",
      "শেখার আগ্রহ ও নিয়মিত অনুশীলনের মানসিকতা"
    ],
    prerequisitesEn: [
      "Basic understanding of HTML, CSS and foundational JavaScript",
      "A computer and steady internet connection",
      "Eagerness to practice hands-on coding and problem solving"
    ],
    modules: [
      {
        id: "m1",
        title: "মডিউল ১: আধুনিক JavaScript ও TypeScript পরিচিতি",
        titleEn: "Module 1: Modern JavaScript & TypeScript Fundamentals",
        duration: "৬ ঘণ্টা",
        durationEn: "6 hours",
        lessons: [
          { id: "l1", title: "ES6+ গুরুত্বপূর্ণ ফিচারসমূহ ও অ্যাসিঙ্ক প্রোগ্রামিং", titleEn: "ES6+ Core Features & Asynchronous Programming", duration: "৪৫ মিনিট", durationEn: "45 mins", isFree: true },
          { id: "l2", title: "TypeScript এর ফান্ডামেন্টালস ও টাইপ সিস্টেম", titleEn: "TypeScript Fundamentals & Static Type System", duration: "১ ঘণ্টা ১৫ মিনিট", durationEn: "1 hr 15 mins", isFree: true },
          { id: "l3", title: "React এর সাথে TypeScript ইন্টিগ্রেশন", titleEn: "Integrating React with TypeScript & Clean Hooks", duration: "১ ঘণ্টা", durationEn: "1 hour" }
        ]
      },
      {
        id: "m2",
        title: "মডিউল ২: Next.js 14 আর্কিটেকচার ও App Router",
        titleEn: "Module 2: Next.js 14 Architecture & App Router",
        duration: "১২ ঘণ্টা",
        durationEn: "12 hours",
        lessons: [
          { id: "l4", title: "Next.js App Router, লেআউট ও পেজ রাউটিং", titleEn: "Next.js App Router, Layouts & Nested Routing", duration: "১ ঘণ্টা ৩০ মিনিট", durationEn: "1 hr 30 mins" },
          { id: "l5", title: "Server vs Client Components এবং ডেটা ফেচিং", titleEn: "Server vs Client Components & Data Fetching Patterns", duration: "২ ঘণ্টা", durationEn: "2 hours" },
          { id: "l6", title: "Server Actions ও ফর্ম হ্যান্ডলিং", titleEn: "Server Actions, Mutations & Zod Validation", duration: "১ ঘণ্টা ৪৫ মিনিট", durationEn: "1 hr 45 mins" }
        ]
      },
      {
        id: "m3",
        title: "মডিউল ৩: ডাটাবেস ও অথেন্টিকেশন",
        titleEn: "Module 3: Database Design & Secure Authentication",
        duration: "১৫ ঘণ্টা",
        durationEn: "15 hours",
        lessons: [
          { id: "l7", title: "Prisma ORM এবং PostgreSQL স্কিমা ডিজাইন", titleEn: "Prisma ORM & PostgreSQL Relational Schema Design", duration: "২ ঘণ্টা ১৫ মিনিট", durationEn: "2 hrs 15 mins" },
          { id: "l8", title: "NextAuth.js দিয়ে রোল-বেসড অথেন্টিকেশন", titleEn: "Role-Based Access Control (RBAC) with NextAuth.js", duration: "২ ঘণ্টা ৩০ মিনিট", durationEn: "2 hrs 30 mins" },
          { id: "l9", title: "পেমেন্ট গেটওয়ে ইন্টিগ্রেশন ও অর্ডারিং সিস্টেম", titleEn: "Automated Payment Gateway Integration & Order Ledger", duration: "৩ ঘণ্টা", durationEn: "3 hours" }
        ]
      }
    ]
  },
  {
    id: "python-machine-learning",
    title: "পাইথন দিয়ে মেশিন লার্নিং ও এআই (AI & ML)",
    titleEn: "Machine Learning & AI with Python",
    tagline: "ডাটা অ্যানালাইসিস থেকে প্রেডিক্টিভ এআই মডেল তৈরি শিখুন",
    taglineEn: "From exploratory data analysis to predictive AI models",
    description: "মেশিন লার্নিং এবং কৃত্রিম বুদ্ধিমত্তার জগতে প্রবেশের জন্য একটি পূর্ণাঙ্গ কোর্স। ডেটা প্রসেসিং, সুপারভাইজড ও আনসুপারভাইজড লার্নিং, ডিপ লার্নিং এবং প্র্যাকটিকাল এআই মডেল বিল্ডিং শিখুন হাতে-কলমে।",
    descriptionEn: "A complete hands-on journey into machine learning and artificial intelligence. Learn exploratory data analysis, feature engineering, supervised/unsupervised algorithms, neural networks, and deploy real AI models into production.",
    category: "data-science",
    categoryBangla: "ডাটা সায়েন্স ও এআই",
    categoryEn: "Data Science & AI",
    level: "ইন্টারমিডিয়েট",
    levelEn: "Intermediate",
    rating: 4.8,
    totalRatings: 210,
    studentsEnrolled: 890,
    duration: "৪০ ঘণ্টা",
    durationEn: "40 hours",
    totalLessons: 54,
    price: 5000,
    originalPrice: 9000,
    thumbnailUrl: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=800&auto=format&fit=crop",
    thumbnailUrlEn: "https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?q=80&w=800&auto=format&fit=crop",
    instructor: {
      name: "ড. সাজিদ হাসান",
      nameEn: "Dr. Sajid Hasan",
      role: "লিড ডাটা সায়েন্টিস্ট",
      roleEn: "Lead Data Scientist",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop",
      bio: "মেশিন লার্নিং ও ডেটা সায়েন্সে পিএইচডি এবং আন্তর্জাতিক জার্নালে একাধিক রিসার্চ পাবলিকেশন রয়েছে।",
      bioEn: "Ph.D. in Machine Learning with top-tier international publications and 10+ years in industrial predictive modeling."
    },
    learningOutcomes: [
      "NumPy এবং Pandas দিয়ে ডাটা ম্যানিপুলেশন ও ক্লিনিং",
      "Matplotlib ও Seaborn দিয়ে ডাটা ভিজ্যুয়ালাইজেশন",
      "Scikit-Learn দিয়ে রিগ্রেশন, ক্লাসিফিকেশন ও ক্লাস্টারিং",
      "Neural Networks ও TensorFlow/Keras এর বেসিকস",
      "NLP এবং Computer Vision এর প্রজেক্ট"
    ],
    learningOutcomesEn: [
      "Data wrangling, cleaning and aggregation with NumPy & Pandas",
      "Exploratory statistical visualization with Matplotlib & Seaborn",
      "Supervised & unsupervised learning pipelines using Scikit-Learn",
      "Deep Learning foundations with TensorFlow & Keras",
      "Real-world NLP and Computer Vision capstone applications"
    ],
    prerequisites: [
      "বেসিক পাইথন প্রোগ্রামিং জ্ঞান",
      "উচ্চ মাধ্যমিক পর্যায়ের গণিত ও পরিসংখ্যানের মৌলিক ধারণা"
    ],
    prerequisitesEn: [
      "Basic Python programming syntax and data types",
      "Foundational high school algebra, calculus, and probability concepts"
    ],
    modules: [
      {
        id: "ml-m1",
        title: "মডিউল ১: পাইথন ফর ডাটা সায়েন্স",
        titleEn: "Module 1: Python for Data Science & EDA",
        duration: "৮ ঘণ্টা",
        durationEn: "8 hours",
        lessons: [
          { id: "ml-l1", title: "NumPy অ্যারে ও ম্যাট্রিক্স অপারেশন", titleEn: "NumPy Arrays & Vectorized Linear Algebra", duration: "১ ঘণ্টা", durationEn: "1 hour", isFree: true },
          { id: "ml-l2", title: "Pandas ডেটাফ্রেম ও ডাটা ফিল্টারিং", titleEn: "Pandas DataFrames, Cleaning & Advanced Filtering", duration: "১ ঘণ্টা ৩০ মিনিট", durationEn: "1 hr 30 mins" }
        ]
      },
      {
        id: "ml-m2",
        title: "মডিউল ২: সুপারভাইজড মেশিন লার্নিং অ্যালগরিদম",
        titleEn: "Module 2: Supervised Machine Learning Algorithms",
        duration: "১৬ ঘণ্টা",
        durationEn: "16 hours",
        lessons: [
          { id: "ml-l3", title: "লিনিয়ার রিগ্রেশন ও লজিস্টিক রিগ্রেশন", titleEn: "Linear & Logistic Regression with Cost Functions", duration: "২ ঘণ্টা", durationEn: "2 hours" },
          { id: "ml-l4", title: "ডিসিশন ট্রি ও র্যান্ডম ফরেস্ট মডেলিং", titleEn: "Decision Trees, Ensembles & Random Forest Tuning", duration: "২ ঘণ্টা ১৫ মিনিট", durationEn: "2 hrs 15 mins" }
        ]
      }
    ]
  },
  {
    id: "dsa-in-bangla",
    title: "ডাটা স্ট্রাকচার ও অ্যালগরিদম (DSA Mastery)",
    titleEn: "Data Structures & Algorithms Mastery",
    tagline: "কোডিং ইন্টারভিউ ও সফটওয়্যার ইঞ্জিনিয়ারিংয়ের মূল ভিত্তি",
    taglineEn: "The foundation of software engineering and coding interviews",
    description: "গুগল, মেটাসহ শীর্ষস্থানীয় টেক কোম্পানিতে সফটওয়্যার ইঞ্জিনিয়ার হিসেবে কোডিং ইন্টারভিউ ক্র্যাক করার জন্য ডেটা স্ট্রাকচার ও অ্যালগরিদমের সম্পূর্ণ বাংলায় বাস্তবমুখী মাস্টারক্লাস।",
    descriptionEn: "Master the fundamental data structures and algorithmic patterns required to pass technical interviews at Google, Meta, Amazon, and top tech firms worldwide. Includes 200+ curated practice problems.",
    category: "programming",
    categoryBangla: "প্রোগ্রামিং ফান্ডামেন্টালস",
    categoryEn: "Programming & DSA",
    level: "ইন্টারমিডিয়েট",
    levelEn: "Intermediate",
    rating: 4.9,
    totalRatings: 480,
    studentsEnrolled: 2100,
    duration: "৫০ ঘণ্টা",
    durationEn: "50 hours",
    totalLessons: 90,
    price: 3500,
    originalPrice: 6500,
    thumbnailUrl: "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?q=80&w=800&auto=format&fit=crop",
    thumbnailUrlEn: "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?q=80&w=800&auto=format&fit=crop",
    instructor: {
      name: "নাজমুল আরেফিন",
      nameEn: "Nazmul Arefin",
      role: "কম্পিটিটিভ প্রোগ্রামার ও এক্স-FAANG ইঞ্জিনিয়ার",
      roleEn: "Competitive Programmer & Ex-FAANG Engineer",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&auto=format&fit=crop",
      bio: "ICPC ওয়ার্ল্ড ফাইনালিস্ট এবং শত শত শিক্ষার্থীকে কোডিং ইন্টারভিউতে সফল হতে সহায়তা করেছেন।",
      bioEn: "ICPC World Finalist with years of algorithmic problem-solving mentorship for global tech interviews."
    },
    learningOutcomes: [
      "Time & Space Complexity (Big-O Notation) গভীর বিশ্লেষণ",
      "Arrays, Linked Lists, Stacks, Queues, Trees, Graphs মাস্টার করা",
      "Dynamic Programming (DP), Greedy & Divide-and-Conquer কৌশল",
      "LeetCode এর ২০০+ গুরুত্বপূর্ণ সমস্যা সমাধান"
    ],
    learningOutcomesEn: [
      "Rigorous Time & Space Complexity Analysis (Big-O, Big-Omega, Big-Theta)",
      "Master Arrays, Hash Tables, Linked Lists, Stacks, Queues, Trees & Graphs",
      "Advanced Dynamic Programming, Memoization, Greedy & Graph Traversal",
      "Step-by-step solutions for 200+ high-frequency interview problems"
    ],
    prerequisites: [
      "যেকোনো একটি প্রোগ্রামিং ভাষা (C++, Java, Python অথবা JS) জানা থাকা প্রয়োজন"
    ],
    prerequisitesEn: [
      "Familiarity with any programming language (C++, Java, Python, or JavaScript)"
    ],
    modules: [
      {
        id: "dsa-m1",
        title: "মডিউল ১: কমপ্লেক্সিটি অ্যানালাইসিস ও ফান্ডামেন্টালস",
        titleEn: "Module 1: Complexity Analysis & Foundational Techniques",
        duration: "৬ ঘণ্টা",
        durationEn: "6 hours",
        lessons: [
          { id: "dsa-l1", title: "টাইম ও স্পেস কমপ্লেক্সিটি হিসাবের সহজ উপায়", titleEn: "Calculating Time & Space Complexity with Big-O", duration: "৫০ মিনিট", durationEn: "50 mins", isFree: true },
          { id: "dsa-l2", title: "রিকার্শন এবং ব্যাকট্র্যাকিং এর মূল কৌশল", titleEn: "Recursion Trees and Backtracking Frameworks", duration: "১ ঘণ্টা ২০ মিনিট", durationEn: "1 hr 20 mins" }
        ]
      },
      {
        id: "dsa-m2",
        title: "মডিউল ২: অ্যাডভান্সড ডেটা স্ট্রাকচার ও গ্রাফ থিওরি",
        titleEn: "Module 2: Advanced Data Structures & Graph Algorithms",
        duration: "২০ ঘণ্টা",
        durationEn: "20 hours",
        lessons: [
          { id: "dsa-l3", title: "বাইনারি সার্চ ট্রি (BST) এবং AVL ট্রি", titleEn: "Binary Search Trees (BST) & Balanced AVL Trees", duration: "২ ঘণ্টা", durationEn: "2 hours" },
          { id: "dsa-l4", title: "BFS, DFS এবং শর্টেস্ট পাথ অ্যালগরিদম", titleEn: "BFS, DFS, Dijkstra & Shortest Path Algorithms", duration: "২ ঘণ্টা ৩০ মিনিট", durationEn: "2 hrs 30 mins" }
        ]
      }
    ]
  },
  {
    id: "system-design-architecture",
    title: "সিস্টেম ডিজাইন ও সফটওয়্যার আর্কিটেকচার",
    titleEn: "System Design & Software Architecture",
    tagline: "মিলিয়ন ব্যবহারকারীর উপযোগী হাই-স্কেল সিস্টেম তৈরি",
    taglineEn: "Design high-scale distributed systems for millions of users",
    description: "লার্জ স্কেল ডিস্ট্রিবিউটেড সিস্টেম তৈরি, মাইক্রোসার্ভিস আর্কিটেকচার, লোড ব্যালেন্সিং, ক্যাশিং, ডাটাবেস শার্ডিং এবং হাই-অ্যাভেইলেবিলিটি ডিজাইন শিখুন।",
    descriptionEn: "Learn to design highly available, fault-tolerant distributed systems serving millions of concurrent requests. Covers microservices, load balancing, caching tiers, database sharding, CAP theorem, and real-life architectural blueprints.",
    category: "system-design",
    categoryBangla: "সিস্টেম ডিজাইন",
    categoryEn: "System Design",
    level: "অ্যাডভান্সড",
    levelEn: "Advanced",
    rating: 4.9,
    totalRatings: 180,
    studentsEnrolled: 620,
    duration: "৩৫ ঘণ্টা",
    durationEn: "35 hours",
    totalLessons: 45,
    price: 6000,
    originalPrice: 10000,
    thumbnailUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=800&auto=format&fit=crop",
    thumbnailUrlEn: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=800&auto=format&fit=crop",
    instructor: {
      name: "ইফতেখারুল আলম",
      nameEn: "Iftekharul Alam",
      role: "প্রিন্সিপাল আর্কিটেক্ট",
      roleEn: "Principal Architect",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=200&auto=format&fit=crop",
      bio: "১৫+ বছরের অভিজ্ঞতা সম্পন্ন ডিস্ট্রিবিউটেড সিস্টেম এবং ক্লাউড আর্কিটেকচার বিশেষজ্ঞ।",
      bioEn: "15+ years architecting enterprise distributed microservices and multi-region cloud infrastructures."
    },
    learningOutcomes: [
      "মনোলিথিক বনাম মাইক্রোসার্ভিসেস আর্কিটেকচার নির্বাচন",
      "Redis, Memcached ক্যাশিং স্ট্র্যাটেজি ও মেসেজ কিউ (Kafka, RabbitMQ)",
      "ডাটাবেস রেপ্লিকেশন, পার্টিশনিং এবং CAP থিওরেম প্রয়োগ",
      "রিয়েল-লাইফ কেস স্টাডি: Uber, YouTube, Netflix সিস্টেম ডিজাইন"
    ],
    learningOutcomesEn: [
      "Evaluating Monolithic vs Microservices trade-offs and domain boundaries",
      "Caching architectures with Redis/Memcached & Event Queues (Kafka, RabbitMQ)",
      "Database replication, horizontal sharding, consistency models & CAP theorem",
      "Real-world case studies: Designing Uber, YouTube, Netflix and WhatsApp"
    ],
    prerequisites: [
      "কমপক্ষে ১-২ বছরের সফটওয়্যার ডেভেলপমেন্টের বাস্তব অভিজ্ঞতা",
      "ডাটাবেস ও নেটওয়ার্কিংয়ের সাধারণ ধারণা"
    ],
    prerequisitesEn: [
      "1-2 years of software engineering background",
      "Foundational knowledge of relational databases, HTTP, and networking"
    ],
    modules: [
      {
        id: "sd-m1",
        title: "মডিউল ১: স্কেলেবিলিটি ফান্ডামেন্টালস",
        titleEn: "Module 1: Scalability Fundamentals & Caching",
        duration: "৮ ঘণ্টা",
        durationEn: "8 hours",
        lessons: [
          { id: "sd-l1", title: "ভার্টিক্যাল বনাম হরাইজন্টাল স্কেলিং ও লোড ব্যালেন্সার", titleEn: "Vertical vs Horizontal Scaling & Load Balancing Algorithms", duration: "১ ঘণ্টা ১৫ মিনিট", durationEn: "1 hr 15 mins", isFree: true },
          { id: "sd-l2", title: "ক্যাশিং পলিসি ও CDN এর সর্বোত্তম ব্যবহার", titleEn: "Caching Patterns (Write-through, Cache-aside) & CDNs", duration: "১ ঘণ্টা ৩০ মিনিট", durationEn: "1 hr 30 mins" }
        ]
      }
    ]
  },
  {
    id: "flutter-mobile-app",
    title: "ফ্লাটার দিয়ে ক্রস-প্ল্যাটফর্ম মোবাইল অ্যাপ ডেভেলপমেন্ট",
    titleEn: "Cross-Platform Mobile App Development with Flutter",
    tagline: "এক কোডেই Android এবং iOS অ্যাপ তৈরি করুন",
    taglineEn: "Build iOS and Android apps with a single codebase",
    description: "Dart প্রোগ্রামিং ভাষা এবং Flutter ফ্রেমওয়ার্ক ব্যবহার করে প্রফেশনাল, সুন্দর ও ফ্লুইড পারফরম্যান্সের মোবাইল অ্যাপস ডেভেলপমেন্ট শিখুন একদম শুরু থেকে।",
    descriptionEn: "Build responsive, production-ready mobile apps for Android and iOS with Flutter and Dart. Learn state management, API integration, animations, local storage, and app store deployment.",
    category: "app-dev",
    categoryBangla: "অ্যাপ ডেভেলপমেন্ট",
    categoryEn: "App Development",
    level: "বিগিনার",
    levelEn: "Beginner",
    rating: 4.7,
    totalRatings: 290,
    studentsEnrolled: 1100,
    duration: "৩৮ ঘণ্টা",
    durationEn: "38 hours",
    totalLessons: 60,
    price: 4000,
    originalPrice: 7500,
    thumbnailUrl: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?q=80&w=800&auto=format&fit=crop",
    thumbnailUrlEn: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?q=80&w=800&auto=format&fit=crop",
    instructor: {
      name: "ফারহানা ইয়াসমিন",
      nameEn: "Farhana Yasmin",
      role: "সিনিয়র মোবাইল অ্যাপ ডেভেলপার",
      roleEn: "Senior Mobile App Developer",
      avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=200&auto=format&fit=crop",
      bio: "মোবাইল অ্যাপ্লিকেশন ডিজাইনার এবং ডেভেলপার। প্লে-স্টোর ও অ্যাপ স্টোরে ৩০+ লাইভ অ্যাপ রয়েছে।",
      bioEn: "Mobile app developer with 30+ production apps published on Google Play and Apple App Store."
    },
    learningOutcomes: [
      "Dart ভাষার মূল সিনট্যাক্স ও অবজেক্ট ওরিয়েন্টেড প্রোগ্রামিং",
      "Flutter UI উইজেট, স্টেট ম্যানেজমেন্ট (Bloc/Riverpod)",
      "REST API এবং Firebase ব্যাকএন্ড কানেকশন",
      "Google Play Store ও Apple App Store এ অ্যাপ রিলিজ"
    ],
    learningOutcomesEn: [
      "Master Dart language syntax and Object-Oriented Principles",
      "Design fluid Flutter UI widgets & State Management (Bloc / Riverpod)",
      "Connect REST APIs, WebSockets & Firebase backend services",
      "Publish and maintain apps on Google Play Store and Apple App Store"
    ],
    prerequisites: [
      "যেকোনো প্রোগ্রামিং ভাষার প্রাথমিক ধারণা থাকলে সুবিধা হবে"
    ],
    prerequisitesEn: [
      "Introductory familiarity with general programming syntax"
    ],
    modules: [
      {
        id: "fl-m1",
        title: "মডিউল ১: ডার্ট ল্যাঙ্গুয়েজ ও ফ্লাটার বেসিকস",
        titleEn: "Module 1: Dart Programming & Flutter Fundamentals",
        duration: "১০ ঘণ্টা",
        durationEn: "10 hours",
        lessons: [
          { id: "fl-l1", title: "Dart OOP ও অ্যাসিঙ্ক্রোনাস প্রোগ্রামিং", titleEn: "Dart OOP, Futures, Streams & Async/Await", duration: "১ ঘণ্টা", durationEn: "1 hour", isFree: true },
          { id: "fl-l2", title: "Stateless vs Stateful Widgets", titleEn: "Stateless vs Stateful Widgets Lifecycle", duration: "১ ঘণ্টা ১৫ মিনিট", durationEn: "1 hr 15 mins" }
        ]
      }
    ]
  }
];

export function getAllCourses(): Course[] {
  return COURSES_DATA;
}

export function getCourseById(id: string): Course | undefined {
  return COURSES_DATA.find((course) => course.id === id);
}
