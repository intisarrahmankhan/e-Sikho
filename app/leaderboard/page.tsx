import React from 'react';
import {
  getGlobalLeaderboardAction,
  getAvailableCoursesForLeaderboardAction,
  getCourseLeaderboardAction,
} from '@/actions/leaderboard';
import { LeaderboardClient } from '@/components/leaderboard/LeaderboardClient';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'লিডারবোর্ড ও পার্সেন্টাইল র‍্যাংকিং | e-Shikho',
  description:
    'সারাদেশের শিক্ষার্থীদের সাথে সার্বজনীন এলো (Elo) রেটিং ও কোর্স ভিত্তিক পার্সেন্টাইল লিডারবোর্ডে আপনার অবস্থান দেখুন।',
};

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams?: { courseId?: string; track?: string };
}) {
  const selectedCourseId = searchParams?.courseId;
  const selectedTrack = searchParams?.track || 'ALL';

  // 1. Fetch Global Leaderboard Data
  const globalRes = await getGlobalLeaderboardAction({
    track: selectedTrack,
    page: 1,
    limit: 20,
  });

  const globalStudents = globalRes.students || [];
  const totalGlobal = globalRes.totalStudents || 0;
  const userGlobalRank = globalRes.currentUserRank || null;

  // 2. Fetch Available Courses
  const coursesRes = await getAvailableCoursesForLeaderboardAction();
  const courses = coursesRes.courses || [];

  // 3. If courseId is selected, fetch Course Cohort Data
  let initialCourseData = null;
  const targetCourseId = selectedCourseId || (courses.length > 0 ? courses[0].id : undefined);

  if (targetCourseId) {
    const courseRes = await getCourseLeaderboardAction(targetCourseId);
    if (courseRes.success && courseRes.course) {
      initialCourseData = {
        course: courseRes.course,
        students: courseRes.students || [],
        totalEnrolled: courseRes.totalEnrolled || 0,
        currentUserCourseRank: courseRes.currentUserCourseRank || null,
      };
    }
  }

  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8">
      <LeaderboardClient
        initialGlobalStudents={globalStudents}
        initialTotalGlobal={totalGlobal}
        initialUserGlobalRank={userGlobalRank}
        courses={courses}
        initialSelectedCourseId={selectedCourseId}
        initialCourseData={initialCourseData}
      />
    </div>
  );
}
