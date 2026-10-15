import { describe, it, expect } from 'vitest';
import {
  calculateCourseRecommendationScore,
  StudentProfileForRecommendation,
} from '@/lib/recommendations-engine';

describe('Personalized Course Recommendation Engine', () => {
  const sampleCourses = {
    fullstack: {
      id: 'fullstack-nextjs',
      title: 'ফুলস্ট্যাক ওয়েব ডেভেলপমেন্ট (Next.js, React & Node.js)',
      titleEn: 'Fullstack Web Development (Next.js, React & Node.js)',
      category: 'web-dev',
      level: 'বিগিনার',
      description: 'আধুনিক ওয়েব অ্যাপ্লিকেশন Next.js 14, React, TypeScript এবং Node.js দিয়ে তৈরি শিখুন।',
      learningOutcomes: ['Next.js App Router', 'TypeScript', 'PostgreSQL', 'NextAuth'],
      rating: 4.9,
      studentsEnrolled: 1250,
    },
    ml: {
      id: 'python-machine-learning',
      title: 'পাইথন দিয়ে মেশিন লার্নিং ও এআই (AI & ML)',
      titleEn: 'Machine Learning & AI with Python',
      category: 'data-science',
      level: 'ইন্টারমিডিয়েট',
      description: 'ডেটা সায়েন্স ও মেশিন লার্নিং মডেল বিল্ডিং শিখুন হাতে-কলমে।',
      learningOutcomes: ['NumPy', 'Pandas', 'Scikit-Learn', 'Neural Networks'],
      rating: 4.8,
      studentsEnrolled: 890,
    },
    dsa: {
      id: 'dsa-in-bangla',
      title: 'ডাটা স্ট্রাকচার ও অ্যালগরিদম (DSA Mastery)',
      titleEn: 'Data Structures & Algorithms Mastery',
      category: 'programming',
      level: 'ইন্টারমিডিয়েট',
      description: 'কোডিং ইন্টারভিউ ক্র্যাক করার জন্য ডাটা স্ট্রাকচার ও অ্যালগরিদম মাস্টারক্লাস।',
      learningOutcomes: ['Big-O', 'Trees', 'Graphs', 'Dynamic Programming', 'LeetCode'],
      rating: 4.9,
      studentsEnrolled: 2100,
    },
    systemDesign: {
      id: 'system-design-architecture',
      title: 'সিস্টেম ডিজাইন ও সফটওয়্যার আর্কিটেকচার',
      titleEn: 'System Design & Software Architecture',
      category: 'system-design',
      level: 'অ্যাডভান্সড',
      description: 'মিলিয়ন ব্যবহারকারীর উপযোগী হাই-স্কেল ডিস্ট্রিবিউটেড সিস্টেম তৈরি।',
      learningOutcomes: ['Microservices', 'Distributed Systems', 'Caching', 'Kafka'],
      rating: 4.9,
      studentsEnrolled: 620,
    },
  };

  it('gives high score to fullstack course when student track is Fullstack Web Development', () => {
    const profile: StudentProfileForRecommendation = {
      targetTrack: 'Fullstack Web Development',
      elo: 1250,
      interests: ['Web Development', 'React', 'Frontend'],
      skills: ['JavaScript', 'HTML', 'CSS'],
    };

    const result = calculateCourseRecommendationScore(sampleCourses.fullstack, profile);

    expect(result.score).toBeGreaterThanOrEqual(80);
    expect(result.trackScore).toBeGreaterThanOrEqual(25);
    expect(result.matchReasons.some((r) => r.en.includes('Fullstack Web Development'))).toBe(true);
    expect(result.matchReasons.some((r) => r.bn.includes('ফুলস্ট্যাক') || r.bn.includes('Fullstack'))).toBe(true);
  });

  it('prioritizes Machine Learning & AI course when student has data science interests', () => {
    const profile: StudentProfileForRecommendation = {
      targetTrack: 'Data Science & Applied AI',
      elo: 1350,
      interests: ['Machine Learning & AI', 'Data Science'],
      skills: ['Python'],
    };

    const mlResult = calculateCourseRecommendationScore(sampleCourses.ml, profile);
    const dsaResult = calculateCourseRecommendationScore(sampleCourses.dsa, profile);

    expect(mlResult.score).toBeGreaterThan(dsaResult.score);
    expect(mlResult.matchedInterests).toContain('Machine Learning & AI');
    expect(mlResult.matchedSkills).toContain('Python');
    expect(mlResult.matchReasons.some((r) => r.en.includes('interest'))).toBe(true);
  });

  it('calibrates difficulty and rewards Advanced System Design course for high-Elo students', () => {
    const noviceProfile: StudentProfileForRecommendation = {
      targetTrack: 'System Design & Cloud Architecture',
      elo: 1100,
      interests: ['System Design & Cloud'],
      skills: ['Java'],
    };

    const expertProfile: StudentProfileForRecommendation = {
      targetTrack: 'System Design & Cloud Architecture',
      elo: 1750,
      interests: ['System Design & Cloud'],
      skills: ['Java', 'Microservices'],
    };

    const noviceScore = calculateCourseRecommendationScore(sampleCourses.systemDesign, noviceProfile);
    const expertScore = calculateCourseRecommendationScore(sampleCourses.systemDesign, expertProfile);

    // Advanced course should get higher Elo calibration score for high Elo students
    expect(expertScore.eloScore).toBeGreaterThan(noviceScore.eloScore);
    expect(expertScore.score).toBeGreaterThan(noviceScore.score);
  });

  it('rewards student skills synergy when course builds upon known technologies', () => {
    const profileWithoutReact: StudentProfileForRecommendation = {
      targetTrack: 'Fullstack Web Development',
      elo: 1300,
      interests: ['Web Development'],
      skills: ['PHP', 'MySQL'],
    };

    const profileWithReact: StudentProfileForRecommendation = {
      targetTrack: 'Fullstack Web Development',
      elo: 1300,
      interests: ['Web Development'],
      skills: ['React', 'TypeScript', 'Node.js'],
    };

    const scoreWithout = calculateCourseRecommendationScore(sampleCourses.fullstack, profileWithoutReact);
    const scoreWith = calculateCourseRecommendationScore(sampleCourses.fullstack, profileWithReact);

    expect(scoreWith.skillScore).toBeGreaterThan(scoreWithout.skillScore);
    expect(scoreWith.matchedSkills).toContain('React');
    expect(scoreWith.matchedSkills).toContain('TypeScript');
  });

  it('caps recommendation score at 99% and maintains reasonable minimum floor', () => {
    const profile: StudentProfileForRecommendation = {
      targetTrack: 'Fullstack Web Development',
      elo: 1200,
      interests: ['Web Development', 'React', 'Node.js', 'Next.js'],
      skills: ['React', 'TypeScript', 'Node.js', 'Next.js'],
    };

    const result = calculateCourseRecommendationScore(sampleCourses.fullstack, profile);
    expect(result.score).toBeLessThanOrEqual(99);
    expect(result.score).toBeGreaterThanOrEqual(40);
    expect(result.matchPercentage).toEqual(result.score);
  });
});
