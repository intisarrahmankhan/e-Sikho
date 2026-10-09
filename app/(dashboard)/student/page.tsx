import React from "react";
import { auth } from '@/auth';
import dbConnect from "@/lib/mongoose";
import Enrollment from "@/models/Enrollment";
import InstructorRequest from "@/models/InstructorRequest";
import { redirect } from "next/navigation";
import { StudentDashboardClient } from "@/components/dashboard/StudentDashboardClient";

const MOCK_EXAMS = [
  { id: "e1", title: "সিস্টেম ডিজাইন মিডটার্ম পরীক্ষা", date: "2024-10-15", daysLeft: 7 },
  { id: "e2", title: "রিয়েক্ট পারফরম্যান্স কুইজ", date: "2024-10-25", daysLeft: 17 }
];

const MOCK_LEADERBOARD = [
  { id: "s1", name: "তানজিম আহমেদ", elo: 1620 },
  { id: "s2", name: "নুসরাত জাহান", elo: 1585 },
  { id: "s3", name: "রাকিবুল হাসান", elo: 1540 },
  { id: "s4", name: "You", elo: 1450 },
  { id: "s5", name: "সাদিয়া আফরিন", elo: 1425 },
];

export default async function StudentDashboardPage() {
  const session = await auth();
  if (!session || !session.user) redirect('/login');

  let userId = (session.user as any).id;
  if (!userId) redirect('/login');

  await dbConnect();

  // Fallback in case session cookie has the email instead of the ObjectId
  if (typeof userId === 'string' && userId.includes('@')) {
    const { default: User } = await import('@/models/User');
    const userDoc = await User.findOne({ email: userId }).select('_id').lean() as any;
    if (userDoc) {
      userId = userDoc._id.toString();
    }
  }

  await dbConnect();
  const enrollmentsList = await Enrollment.find({
    userId,
    paymentStatus: { $in: ['success', 'GRANTED', 'granted'] },
  }).lean();

  const req = await InstructorRequest.findOne({ userId }).lean();
  const enrollments: any[] = enrollmentsList || [];
  const instructorRequest: any = req || null;

  const { default: Exam } = await import('@/models/Exam');
  const publishedExams = (await Exam.find({ status: 'PUBLISHED' }).limit(3).lean()) as any[];
  const upcomingExams = publishedExams.length > 0
    ? publishedExams.map((ex, i) => ({
        id: ex._id.toString(),
        title: ex.title,
        date: new Date(Date.now() + (i + 3) * 86400000).toISOString(),
        daysLeft: (i + 1) * 3,
      }))
    : MOCK_EXAMS;

  const { getCourseById } = await import('@/lib/courses-data');
  const CourseModel = (await import('@/models/Course')).default;
  const CourseRoutine = (await import('@/models/CourseRoutine')).default;

  const enrolledCourses = (
    await Promise.all(
      enrollments.map(async (e) => {
        const courseIdStr = String(e.courseId);
        const staticCourse = getCourseById(courseIdStr);

        let userRoutine: any = null;
        try {
          userRoutine = await CourseRoutine.findOne({ userId, courseId: courseIdStr }).lean();
        } catch {}

        let targetCompletionDate = new Date(new Date().setMonth(new Date().getMonth() + 2)).toISOString().split('T')[0];
        let paceMode: string | undefined = undefined;
        let progressPercentage = 35;

        if (userRoutine) {
          if (userRoutine.targetCompletionDate) {
            targetCompletionDate = new Date(userRoutine.targetCompletionDate).toISOString().split('T')[0];
          }
          paceMode = userRoutine.paceMode;
          const totalItems = userRoutine.items?.length || 1;
          const completedItems = userRoutine.items?.filter((i: any) => i.completed)?.length || 0;
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
        } catch {
          // If not a valid ObjectId or not found
        }
        return null;
      })
    )
  ).filter(Boolean);

  const elo = 1450;
  const streak = 12;
  const name = session.user.name || 'শিক্ষার্থী';

  return (
    <StudentDashboardClient
      userName={name}
      enrolledCourses={enrolledCourses}
      upcomingExams={upcomingExams}
      topStudents={MOCK_LEADERBOARD}
      instructorRequest={instructorRequest}
      elo={elo}
      streak={streak}
    />
  );
}
