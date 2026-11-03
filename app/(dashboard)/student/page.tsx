import { getExamsAction } from '@/actions/exam';
import { getCourseAccessDetails } from '@/actions/course-access';
import React from "react";
import { auth } from '@/auth';
import dbConnect from "@/lib/mongoose";
import Enrollment from "@/models/Enrollment";
import InstructorRequest from "@/models/InstructorRequest";
import User from "@/models/User";
import Exam from "@/models/Exam";
import ExamSubmission from "@/models/ExamSubmission";
import CourseRoutine from "@/models/CourseRoutine";
import CourseModel from "@/models/Course";
import { getCourseById } from "@/lib/courses-data";
import { redirect } from "next/navigation";
import { StudentDashboardClient } from "@/components/dashboard/StudentDashboardClient";
import { getHomepageContestsAction } from "@/actions/contest";
import { getPersonalizedRecommendationsAction } from "@/actions/recommendations";

export const dynamic = 'force-dynamic';

export default async function StudentDashboardPage() {
  const session = await auth();
  if (!session || !session.user) redirect('/login');

  const rawUserId = (session.user as any).id || (session.user as any).email || '';
  const userEmail = (session.user as any).email;
  let userId = rawUserId;
  let safeUserId = /^[0-9a-fA-F]{24}$/.test(rawUserId) ? rawUserId : '';

  let userDoc: any = null;
  let enrollments: any[] = [];
  let instructorRequest: any = null;
  let completedQuizzesCount = 0;
  let passedExamAttemptsCount = 0;
  let upcomingExams: any[] = [];
  let topStudents: any[] = [];
  let enrolledCourses: any[] = [];
  let totalRoutineLectures = 0;
  let totalCompletedLectures = 0;
  let remainingCourseLessons = 0;

  try {
    await dbConnect();

    // Resolve user document for accurate stats, elo, and streak
    const userSelect = '_id name role elo competitiveElo problemsSolved completedCoursesCount streak academicBackground department eloHistory';
    const isObjectId = typeof rawUserId === 'string' && /^[0-9a-fA-F]{24}$/.test(rawUserId);

    if (isObjectId) {
      userDoc = await User.findById(rawUserId).select(userSelect).lean();
    } else if (typeof rawUserId === 'string' && rawUserId.includes('@')) {
      userDoc = await User.findOne({ email: rawUserId }).select(userSelect).lean();
    } else if (userEmail) {
      userDoc = await User.findOne({ email: userEmail }).select(userSelect).lean();
    }

    if (userDoc) {
      userId = userDoc._id.toString();
    } else if (!isObjectId) {
      userId = '';
    }

    safeUserId = /^[0-9a-fA-F]{24}$/.test(userId) ? userId : '';

    // These sections are independent once the current user ID is resolved.
    const dashboardResults = await Promise.allSettled([
      Enrollment.find({
        userId: safeUserId,
        paymentStatus: { $in: ['success', 'GRANTED', 'granted'] },
      }).lean(),
      InstructorRequest.findOne({ userId: safeUserId }).lean(),
      ExamSubmission.countDocuments({ studentId: safeUserId }),
      ExamSubmission.countDocuments({ studentId: safeUserId, passed: true }),
      getExamsAction(),
      User.find({ role: 'STUDENT', status: 'APPROVED' })
        .sort({ elo: -1 })
        .limit(5)
        .select('_id name elo')
        .lean(),
    ]);
    for (const result of dashboardResults) {
      if (result.status === 'rejected') console.warn('Student dashboard section unavailable:', result.reason);
    }
    const [enrollmentsResult, requestResult, quizCountResult, passedCountResult, examsResult, topUsersResult] = dashboardResults;

    // 1. Live Enrollments
    const enrollmentsList = enrollmentsResult.status === 'fulfilled' ? enrollmentsResult.value : [];
    enrollments = enrollmentsList || [];

    // 2. Instructor request status
    const rawInstructorRequest = requestResult.status === 'fulfilled' ? requestResult.value : null;
    instructorRequest = rawInstructorRequest ? JSON.parse(JSON.stringify(rawInstructorRequest)) : null;

    // 3. Real quiz submissions and passed attempts
    completedQuizzesCount = quizCountResult.status === 'fulfilled' ? quizCountResult.value : 0;
    passedExamAttemptsCount = passedCountResult.status === 'fulfilled' ? passedCountResult.value : 0;

    // 4. Live Upcoming Exams
    const availableExams = examsResult.status === 'fulfilled' ? examsResult.value : { exams: [] };
    upcomingExams = (availableExams.exams || []).slice(0, 4).map((exam) => ({ id: exam.id, title: exam.title, date: '', daysLeft: 0 }));

    // 5. Live Top Students Leaderboard from MongoDB
    const topUsers = topUsersResult.status === 'fulfilled' ? topUsersResult.value : [];

    if (topUsers && topUsers.length > 0) {
      topStudents = topUsers.map((u: any) => {
        const isCurrentUser = u._id.toString() === userId.toString();
        return {
          id: u._id.toString(),
          name: isCurrentUser ? 'You' : u.name,
          elo: u.elo || 1200,
        };
      });
    }
  } catch (dbErr) {
    console.warn('MongoDB connection/query warning in StudentDashboardPage, using graceful fallback defaults:', dbErr);
  }

  const effectiveRole = userDoc?.role || (session.user as any)?.role;
  if (effectiveRole === 'INSTRUCTOR') {
    redirect('/instructor');
  }
  if (effectiveRole === 'ADMIN' || effectiveRole === 'SUPERADMIN') {
    redirect('/admin');
  }

  const elo = userDoc?.elo || 1200;
  const competitiveElo = userDoc?.competitiveElo || 1200;
  const problemsSolved = userDoc?.problemsSolved || 0;
  const completedCoursesCount = userDoc?.completedCoursesCount || 0;
  const academicBackground = userDoc?.department || userDoc?.academicBackground || '';
  const eloHistory = (userDoc?.eloHistory || []).slice(-5).reverse();
  const streak = userDoc?.streak || 0;
  const name = userDoc?.name || session.user.name || 'শিক্ষার্থী';

  // Enrolled courses & routine calculation
  if (enrollments.length > 0) {
    try {
      enrolledCourses = (
        await Promise.all(
          enrollments.map(async (e) => {
            const courseIdStr = String(e.courseId);
            const staticCourse = getCourseById(courseIdStr);

            let userRoutine: any = null;
            try {
              userRoutine = await CourseRoutine.findOne({ userId: safeUserId, courseId: courseIdStr }).lean();
            } catch {}

            let targetCompletionDate = '';
            let paceMode: string | undefined = undefined;
            const courseAccess = await getCourseAccessDetails(courseIdStr);
            remainingCourseLessons += Math.max(0, courseAccess.totalLessons - courseAccess.completedLessonIds.length);
            let progressPercentage = courseAccess.progressPercentage;

            if (userRoutine) {
              if (userRoutine.targetCompletionDate) {
                targetCompletionDate = new Date(userRoutine.targetCompletionDate)
                  .toISOString()
                  .split('T')[0];
              }
              paceMode = userRoutine.paceMode;
              const items = userRoutine.items || [];
              const totalItems = items.length;
              const completedItems = items.filter((i: any) => i.completed).length;

              totalRoutineLectures += items.filter((i: any) => i.itemType === 'LECTURE').length;
              totalCompletedLectures += items.filter((i: any) => i.itemType === 'LECTURE' && i.completed).length;

              if (totalItems > 0) {
                progressPercentage = Math.round((completedItems / totalItems) * 100);
              }
            }

            if (staticCourse) {
              return {
                id: staticCourse.id,
                title: staticCourse.title,
                titleEn: staticCourse.titleEn || '',
                thumbnailUrl: staticCourse.thumbnailUrl,
                thumbnailUrlEn: staticCourse.thumbnailUrlEn || '',
                progressPercentage,
                targetCompletionDate,
                paceMode,
              };
            }

            try {
              const dbCourse = (await CourseModel.findById(courseIdStr).lean()) as any;
              if (dbCourse) {
                return {
                  id: dbCourse._id.toString(),
                  title: dbCourse.title,
                  titleEn: dbCourse.titleEn || '',
                  thumbnailUrl: dbCourse.thumbnailUrl || '/images/default-course.jpg',
                  thumbnailUrlEn: dbCourse.thumbnailUrlEn || '',
                  progressPercentage,
                  targetCompletionDate,
                  paceMode,
                };
              }
            } catch {}
            return null;
          })
        )
      ).filter(Boolean);
    } catch (e) {
      console.warn('Error computing enrolled courses routine:', e);
    }
  }

  const ongoingLessonsCount = Math.max(
    0,
    totalRoutineLectures > 0
      ? totalRoutineLectures - totalCompletedLectures
      : remainingCourseLessons
  );

  // Load both personalized sections together, retaining independent fallbacks.
  let prioritizedContests: any[] = [];
  let recommendationsRes: any = { recommendations: [], studentProfile: null };
  const [contestsResult, recommendationsResult] = await Promise.allSettled([
    getHomepageContestsAction(academicBackground),
    getPersonalizedRecommendationsAction(4),
  ]);
  if (contestsResult.status === 'fulfilled') prioritizedContests = contestsResult.value?.contests || [];
  else console.warn('Error loading contests in StudentDashboardPage:', contestsResult.reason);
  if (recommendationsResult.status === 'fulfilled') recommendationsRes = recommendationsResult.value;
  else console.warn('Error loading recommendations in StudentDashboardPage:', recommendationsResult.reason);

  const isInstructor = userDoc?.role === 'INSTRUCTOR' || (session?.user as any)?.role === 'INSTRUCTOR';

  return (
    <StudentDashboardClient
      userName={name}
      isInstructor={isInstructor}
      enrolledCourses={enrolledCourses}
      upcomingExams={upcomingExams}
      topStudents={topStudents}
      instructorRequest={instructorRequest}
      elo={elo}
      competitiveElo={competitiveElo}
      problemsSolved={problemsSolved}
      completedCoursesCount={completedCoursesCount}
      academicBackground={academicBackground}
      eloHistory={eloHistory}
      prioritizedContests={prioritizedContests}
      streak={streak}
      ongoingLessonsCount={ongoingLessonsCount}
      completedQuizzesCount={completedQuizzesCount}
      passedExamAttemptsCount={passedExamAttemptsCount}
      recommendedCourses={recommendationsRes?.recommendations || []}
      studentProfile={recommendationsRes?.studentProfile}
    />
  );
}
