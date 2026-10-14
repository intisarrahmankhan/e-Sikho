'use server';

import { auth } from '@/auth';
import dbConnect from '@/lib/mongoose';
import User from '@/models/User';
import Course from '@/models/Course';
import Enrollment from '@/models/Enrollment';
import Exam from '@/models/Exam';
import ExamSubmission from '@/models/ExamSubmission';
import CourseRoutine from '@/models/CourseRoutine';
import { getRatingTier, RatingTier, TierInfo } from '@/lib/elo';

export interface LeaderboardStudent {
  id: string;
  name: string;
  email?: string;
  image?: string;
  headline?: string;
  academicBackground?: string;
  targetTrack?: string;
  elo: number;
  competitiveElo?: number;
  tier: TierInfo;
  rank: number;
  percentile: number;     // e.g. 98 -> 98th percentile
  topPercentage: number;  // e.g. 2 -> Top 2%
  streak?: number;
  problemsSolved?: number;
  completedCoursesCount?: number;
  isCurrentUser?: boolean;
}

export interface CourseLeaderboardStudent {
  id: string;
  name: string;
  email?: string;
  image?: string;
  headline?: string;
  academicBackground?: string;
  courseRank: number;
  coursePercentile: number;    // e.g. 95th percentile in course
  topPercentage: number;       // e.g. Top 5% in course
  totalCourseScore: number;    // Sum of scores in this course's exams
  totalMaxMarks: number;       // Sum of total marks available in attempted exams
  accuracyPercentage: number;  // (totalCourseScore / totalMaxMarks) * 100
  examsAttemptedCount: number;
  examsPassedCount: number;
  completedLecturesCount: number;
  globalElo: number;
  tier: TierInfo;
  isCurrentUser?: boolean;
}

/**
 * Normalizes user filter tracks
 */
function matchesTrack(studentTrack?: string, studentBg?: string, targetTrack?: string): boolean {
  if (!targetTrack || targetTrack === 'ALL' || targetTrack === 'All') return true;
  const combined = `${studentTrack || ''} ${studentBg || ''}`.toUpperCase();
  const target = targetTrack.toUpperCase();

  if (target === 'CSE' || target === 'COMPUTER SCIENCE') {
    return combined.includes('CSE') || combined.includes('COMPUTER') || combined.includes('SOFTWARE');
  }
  if (target === 'DATA_SCIENCE' || target === 'AI') {
    return combined.includes('DATA') || combined.includes('AI') || combined.includes('MACHINE LEARNING');
  }
  if (target === 'WEB_DEV' || target === 'FULLSTACK') {
    return combined.includes('WEB') || combined.includes('FULLSTACK') || combined.includes('REACT') || combined.includes('NEXT');
  }
  if (target === 'EEE' || target === 'ELECTRICAL') {
    return combined.includes('EEE') || combined.includes('ELECTRICAL') || combined.includes('ELECTRONIC');
  }
  if (target === 'BUSINESS' || target === 'COMMERCE') {
    return combined.includes('BUSINESS') || combined.includes('BBA') || combined.includes('FINANCE');
  }
  return combined.includes(target);
}

/**
 * Retrieves Global Leaderboard with Elo Rating and Percentile calculation
 */
export async function getGlobalLeaderboardAction({
  track = 'ALL',
  searchQuery = '',
  page = 1,
  limit = 20,
}: {
  track?: string;
  searchQuery?: string;
  page?: number;
  limit?: number;
} = {}) {
  try {
    await dbConnect();
    const session = await auth();
    const loggedUserId = session?.user?.id;

    let currentUserIdStr: string | null = null;
    if (loggedUserId) {
      currentUserIdStr = loggedUserId;
      if (typeof currentUserIdStr === 'string' && currentUserIdStr.includes('@')) {
        const u = await User.findOne({ email: currentUserIdStr }).select('_id').lean() as any;
        if (u) currentUserIdStr = u._id.toString();
      }
    }

    // Base query for ranked students
    const query: any = { role: 'STUDENT', status: 'APPROVED' };

    if (searchQuery && searchQuery.trim()) {
      query.name = { $regex: searchQuery.trim(), $options: 'i' };
    }

    // Fetch all approved students sorted by elo descending to compute exact global ranks & percentiles
    const allEligibleStudents = await User.find(query)
      .sort({ elo: -1, problemsSolved: -1, streak: -1, createdAt: 1 })
      .select('_id name email image headline academicBackground targetTrack elo competitiveElo problemsSolved completedCoursesCount streak')
      .lean();

    // Filter by academic track if requested
    const filteredStudents = allEligibleStudents.filter((st: any) =>
      matchesTrack(st.targetTrack, st.academicBackground, track)
    );

    const totalStudents = filteredStudents.length;
    const totalPages = Math.max(1, Math.ceil(totalStudents / limit));
    const currentPage = Math.max(1, Math.min(page, totalPages));

    const startIndex = (currentPage - 1) * limit;
    const paginatedSlice = filteredStudents.slice(startIndex, startIndex + limit);

    // Map students with mathematical rank and percentile
    const students: LeaderboardStudent[] = paginatedSlice.map((st: any, idx: number) => {
      const overallRank = startIndex + idx + 1;
      const elo = Math.max(0, st.elo || 1200);
      const tier = getRatingTier(elo);

      // Percentile formula: ((Total - Rank + 1) / Total) * 100
      const percentile = totalStudents > 0
        ? Math.max(1, Math.min(100, Math.round(((totalStudents - overallRank + 1) / totalStudents) * 100)))
        : 100;

      const topPercentage = totalStudents > 0
        ? Math.max(1, Math.min(100, Math.round((overallRank / totalStudents) * 100)))
        : 1;

      const isCurrentUser = currentUserIdStr ? st._id.toString() === currentUserIdStr : false;

      return {
        id: st._id.toString(),
        name: st.name || 'Anonymous Learner',
        email: isCurrentUser ? st.email : undefined,
        image: st.image,
        headline: st.headline || 'Learner',
        academicBackground: st.academicBackground || 'General',
        targetTrack: st.targetTrack || 'General Tech',
        elo,
        competitiveElo: st.competitiveElo || elo,
        tier,
        rank: overallRank,
        percentile,
        topPercentage,
        streak: st.streak || 0,
        problemsSolved: st.problemsSolved || 0,
        completedCoursesCount: st.completedCoursesCount || 0,
        isCurrentUser,
      };
    });

    // Find current user's ranking in this track even if not on the current page
    let currentUserRank: LeaderboardStudent | null = null;
    if (currentUserIdStr) {
      const userIndex = filteredStudents.findIndex(
        (st: any) => st._id.toString() === currentUserIdStr
      );

      if (userIndex !== -1) {
        const userObj: any = filteredStudents[userIndex];
        const rank = userIndex + 1;
        const elo = Math.max(0, userObj.elo || 1200);
        const tier = getRatingTier(elo);
        const percentile = totalStudents > 0
          ? Math.max(1, Math.min(100, Math.round(((totalStudents - rank + 1) / totalStudents) * 100)))
          : 100;
        const topPercentage = totalStudents > 0
          ? Math.max(1, Math.min(100, Math.round((rank / totalStudents) * 100)))
          : 1;

        currentUserRank = {
          id: userObj._id.toString(),
          name: userObj.name || 'You',
          email: userObj.email,
          image: userObj.image,
          headline: userObj.headline,
          academicBackground: userObj.academicBackground,
          targetTrack: userObj.targetTrack,
          elo,
          competitiveElo: userObj.competitiveElo || elo,
          tier,
          rank,
          percentile,
          topPercentage,
          streak: userObj.streak || 0,
          problemsSolved: userObj.problemsSolved || 0,
          completedCoursesCount: userObj.completedCoursesCount || 0,
          isCurrentUser: true,
        };
      }
    }

    return {
      success: true,
      students,
      totalStudents,
      page: currentPage,
      totalPages,
      currentUserRank,
    };
  } catch (error: any) {
    console.error('Error fetching global leaderboard:', error);
    return { error: 'গ্লোবাল লিডারবোর্ড লোড করতে সমস্যা হয়েছে।' };
  }
}

/**
 * Retrieves Local (Course-Level) Leaderboard for students enrolled in a specific course
 */
export async function getCourseLeaderboardAction(courseId: string) {
  try {
    if (!courseId) {
      return { error: 'কোর্স আইডি আবশ্যক।' };
    }

    await dbConnect();
    const session = await auth();
    const loggedUserId = session?.user?.id;

    let currentUserIdStr: string | null = null;
    if (loggedUserId) {
      currentUserIdStr = loggedUserId;
      if (typeof currentUserIdStr === 'string' && currentUserIdStr.includes('@')) {
        const u = await User.findOne({ email: currentUserIdStr }).select('_id').lean() as any;
        if (u) currentUserIdStr = u._id.toString();
      }
    }

    // 1. Get Course Info
    let courseTitle = 'কোর্স লিডারবোর্ড';
    let courseCategory = 'General';
    try {
      const courseDoc = await Course.findById(courseId).select('title category').lean() as any;
      if (courseDoc) {
        courseTitle = courseDoc.title;
        courseCategory = courseDoc.category || 'General';
      }
    } catch {}

    // 2. Find all enrolled students in this course
    const enrollments = await Enrollment.find({
      courseId,
      paymentStatus: { $in: ['success', 'GRANTED', 'granted'] },
    }).lean();

    const enrolledUserIds = enrollments.map((e: any) => e.userId);

    if (enrolledUserIds.length === 0) {
      return {
        success: true,
        course: { id: courseId, title: courseTitle, category: courseCategory },
        students: [],
        totalEnrolled: 0,
        currentUserCourseRank: null,
      };
    }

    // 3. Find all exams associated with this course
    const courseExams = await Exam.find({ courseId }).select('_id totalMarks passMarks').lean();
    const examIds = courseExams.map((ex: any) => ex._id);

    // 4. Fetch submissions for these exams by enrolled students
    const submissions = examIds.length > 0
      ? await ExamSubmission.find({
          examId: { $in: examIds },
          studentId: { $in: enrolledUserIds },
        }).lean()
      : [];

    // 5. Fetch completed lectures count from routines
    const routines = await CourseRoutine.find({
      courseId: courseId.toString(),
      userId: { $in: enrolledUserIds },
    }).select('userId items').lean();

    const lectureMap = new Map<string, number>();
    routines.forEach((rt: any) => {
      const completedCount = (rt.items || []).filter((it: any) => it.completed).length;
      lectureMap.set(rt.userId.toString(), completedCount);
    });

    // 6. Fetch user details for all enrolled students
    const userDocs = await User.find({
      _id: { $in: enrolledUserIds },
    })
      .select('_id name email image headline academicBackground elo')
      .lean();

    const userMap = new Map<string, any>();
    userDocs.forEach((u: any) => userMap.set(u._id.toString(), u));

    // 7. Aggregate per student statistics for this course
    const studentAggregates: any[] = [];

    enrolledUserIds.forEach((uid: any) => {
      const uidStr = uid.toString();
      const user = userMap.get(uidStr);
      if (!user) return;

      // Group submissions by examId, taking student's highest score for each exam
      const studentSubs = submissions.filter((s: any) => s.studentId.toString() === uidStr);
      const bestExamScores = new Map<string, { score: number; totalMarks: number; passed: boolean }>();

      studentSubs.forEach((sub: any) => {
        const eId = sub.examId.toString();
        const existing = bestExamScores.get(eId);
        if (!existing || sub.score > existing.score) {
          bestExamScores.set(eId, {
            score: sub.score,
            totalMarks: sub.totalMarks || 10,
            passed: !!sub.passed,
          });
        }
      });

      let totalCourseScore = 0;
      let totalMaxMarks = 0;
      let examsPassedCount = 0;

      bestExamScores.forEach((v) => {
        totalCourseScore += v.score;
        totalMaxMarks += v.totalMarks;
        if (v.passed) examsPassedCount++;
      });

      const accuracyPercentage = totalMaxMarks > 0
        ? Math.round((totalCourseScore / totalMaxMarks) * 100)
        : 0;

      const completedLecturesCount = lectureMap.get(uidStr) || 0;
      const globalElo = Math.max(0, user.elo || 1200);

      studentAggregates.push({
        id: uidStr,
        name: user.name || 'Student',
        email: user.email,
        image: user.image,
        headline: user.headline || 'Enrolled Student',
        academicBackground: user.academicBackground || 'General',
        totalCourseScore: Math.round(totalCourseScore * 100) / 100,
        totalMaxMarks,
        accuracyPercentage,
        examsAttemptedCount: bestExamScores.size,
        examsPassedCount,
        completedLecturesCount,
        globalElo,
        tier: getRatingTier(globalElo),
        isCurrentUser: currentUserIdStr ? uidStr === currentUserIdStr : false,
      });
    });

    // 8. Sort enrolled students by course performance
    // Priority: totalCourseScore -> examsPassedCount -> completedLecturesCount -> globalElo
    studentAggregates.sort((a, b) => {
      if (b.totalCourseScore !== a.totalCourseScore) return b.totalCourseScore - a.totalCourseScore;
      if (b.examsPassedCount !== a.examsPassedCount) return b.examsPassedCount - a.examsPassedCount;
      if (b.completedLecturesCount !== a.completedLecturesCount) return b.completedLecturesCount - a.completedLecturesCount;
      return b.globalElo - a.globalElo;
    });

    const totalEnrolled = studentAggregates.length;

    // 9. Assign ranks and percentiles
    const students: CourseLeaderboardStudent[] = studentAggregates.map((st, idx) => {
      const courseRank = idx + 1;
      const coursePercentile = totalEnrolled > 0
        ? Math.max(1, Math.min(100, Math.round(((totalEnrolled - courseRank + 1) / totalEnrolled) * 100)))
        : 100;
      const topPercentage = totalEnrolled > 0
        ? Math.max(1, Math.min(100, Math.round((courseRank / totalEnrolled) * 100)))
        : 1;

      return {
        ...st,
        courseRank,
        coursePercentile,
        topPercentage,
      };
    });

    const currentUserCourseRank = students.find((s) => s.isCurrentUser) || null;

    return {
      success: true,
      course: {
        id: courseId,
        title: courseTitle,
        category: courseCategory,
      },
      students,
      totalEnrolled,
      currentUserCourseRank,
    };
  } catch (error: any) {
    console.error('Error fetching course leaderboard:', error);
    return { error: 'কোর্স লিডারবোর্ড লোড করতে সমস্যা হয়েছে।' };
  }
}

/**
 * Lists available courses that have enrolled students for the leaderboard course switcher
 */
export async function getAvailableCoursesForLeaderboardAction() {
  try {
    await dbConnect();
    const courses = await Course.find({}).select('_id title category thumbnail').lean();

    const coursesWithEnrollmentCount = await Promise.all(
      courses.map(async (c: any) => {
        const count = await Enrollment.countDocuments({
          courseId: c._id.toString(),
          paymentStatus: { $in: ['success', 'GRANTED', 'granted'] },
        });
        return {
          id: c._id.toString(),
          title: c.title,
          category: c.category || 'General',
          enrolledCount: count,
        };
      })
    );

    // Return courses with at least 1 enrolled student or all courses sorted by enrolled count
    return {
      success: true,
      courses: coursesWithEnrollmentCount.sort((a, b) => b.enrolledCount - a.enrolledCount),
    };
  } catch (error: any) {
    console.error('Error listing courses for leaderboard:', error);
    return { success: false, courses: [] };
  }
}
