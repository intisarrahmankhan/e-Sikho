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

export const dynamic = 'force-dynamic';

export default async function StudentDashboardPage() {
  const session = await auth();
  if (!session || !session.user) redirect('/login');

  let userId = (session.user as any).id;
  if (!userId) redirect('/login');

  await dbConnect();

  // Resolve user document for accurate stats, elo, and streak
  let userDoc: any = null;
  const userSelect = '_id name elo competitiveElo problemsSolved completedCoursesCount streak academicBackground eloHistory';
  if (typeof userId === 'string' && userId.includes('@')) {
    userDoc = await User.findOne({ email: userId }).select(userSelect).lean();
    if (userDoc) {
      userId = userDoc._id.toString();
    }
  } else {
    userDoc = await User.findById(userId).select(userSelect).lean();
  }

  const elo = userDoc?.elo || 1200;
  const competitiveElo = userDoc?.competitiveElo || 1200;
  const problemsSolved = userDoc?.problemsSolved || 0;
  const completedCoursesCount = userDoc?.completedCoursesCount || 0;
  const academicBackground = userDoc?.academicBackground || 'Computer Science & Engineering (CSE)';
  const eloHistory = (userDoc?.eloHistory || []).slice(-5).reverse();
  const streak = userDoc?.streak || 1;
  const name = userDoc?.name || session.user.name || 'শিক্ষার্থী';

  // Load contests prioritized for student background
  const contestsRes = await getHomepageContestsAction(academicBackground);
  const prioritizedContests = contestsRes.contests || [];

  // 1. Live Enrollments
  const enrollmentsList = await Enrollment.find({
    userId,
    paymentStatus: { $in: ['success', 'GRANTED', 'granted'] },
  }).lean();
  const enrollments: any[] = enrollmentsList || [];

  // 2. Instructor request status
  const instructorRequest = await InstructorRequest.findOne({ userId }).lean();

  // 3. Real Quiz Submissions & Certificate Stats
  const completedQuizzesCount = await ExamSubmission.countDocuments({ studentId: userId });
  const earnedCertificatesCount = await ExamSubmission.countDocuments({
    studentId: userId,
    passed: true,
  });

  // 4. Live Upcoming Exams
  const publishedExams = (await Exam.find({ status: 'PUBLISHED' })
    .sort({ createdAt: -1 })
    .limit(4)
    .lean()) as any[];

  const upcomingExams = publishedExams.map((ex, i) => {
    const daysFromNow = (i + 1) * 3;
    const examDate = new Date(Date.now() + daysFromNow * 86400000);
    return {
      id: ex._id.toString(),
      title: ex.title,
      date: examDate.toISOString(),
      daysLeft: daysFromNow,
    };
  });

  // 5. Live Top Students Leaderboard from MongoDB
  const topUsers = await User.find({ role: 'STUDENT', status: 'APPROVED' })
    .sort({ elo: -1 })
    .limit(5)
    .select('_id name elo')
    .lean();

  const topStudents = topUsers.map((u: any) => {
    const isCurrentUser = u._id.toString() === userId.toString();
    return {
      id: u._id.toString(),
      name: isCurrentUser ? 'You' : u.name,
      elo: u.elo || 1200,
    };
  });

  // If current student is not in top 5, include their rank preview
  if (!topStudents.some((s) => s.id === userId.toString())) {
    topStudents[topStudents.length - 1] = {
      id: userId.toString(),
      name: 'You',
      elo,
    };
  }

  // 6. Enrolled courses & routine calculation
  let totalRoutineLectures = 0;
  let totalCompletedLectures = 0;

  const enrolledCourses = (
    await Promise.all(
      enrollments.map(async (e) => {
        const courseIdStr = String(e.courseId);
        const staticCourse = getCourseById(courseIdStr);

        let userRoutine: any = null;
        try {
          userRoutine = await CourseRoutine.findOne({ userId, courseId: courseIdStr }).lean();
        } catch {}

        let targetCompletionDate = new Date(new Date().setMonth(new Date().getMonth() + 2))
          .toISOString()
          .split('T')[0];
        let paceMode: string | undefined = undefined;
        let progressPercentage = 25;

        if (userRoutine) {
          if (userRoutine.targetCompletionDate) {
            targetCompletionDate = new Date(userRoutine.targetCompletionDate)
              .toISOString()
              .split('T')[0];
          }
          paceMode = userRoutine.paceMode;
          const items = userRoutine.items || [];
          const totalItems = items.length || 1;
          const completedItems = items.filter((i: any) => i.completed).length;

          totalRoutineLectures += items.filter((i: any) => i.itemType === 'LECTURE').length;
          totalCompletedLectures += items.filter((i: any) => i.itemType === 'LECTURE' && i.completed).length;

          if (totalItems > 0 && completedItems > 0) {
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

  const ongoingLessonsCount = Math.max(
    0,
    totalRoutineLectures > 0
      ? totalRoutineLectures - totalCompletedLectures
      : enrolledCourses.length * 6
  );

  return (
    <StudentDashboardClient
      userName={name}
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
      earnedCertificatesCount={earnedCertificatesCount}
    />
  );
}
