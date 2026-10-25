'use server';

import { auth } from '@/auth';
import dbConnect from '@/lib/mongoose';
import ProjectSubmission from '@/models/ProjectSubmission';
import Lesson from '@/models/Lesson';
import LessonProgress from '@/models/LessonProgress';
import Enrollment from '@/models/Enrollment';
import Notification from '@/models/Notification';
import { revalidatePath } from 'next/cache';

import {
  evaluateProjectSubmission,
  type AutomatedCheckResult,
  type AutomatedEvaluationReport,
} from '@/lib/project-evaluator';

export type { AutomatedCheckResult, AutomatedEvaluationReport };

export interface SubmitProjectInput {
  courseId: string;
  lessonId: string;
  githubUrl: string;
  liveUrl?: string;
  description?: string;
  notes?: string;
}

/**
 * Submit a student project and execute real-time automated evaluation
 */
export async function submitProjectAndEvaluateAction(input: SubmitProjectInput) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return { error: 'Please log in to submit your project.' };
  }

  const { courseId, lessonId, githubUrl, liveUrl, description, notes } = input;

  if (!courseId || !lessonId || !githubUrl) {
    return { error: 'Course, Lesson, and GitHub Repository URL are required.' };
  }

  try {
    await dbConnect();

    // Verify enrollment
    const isEnrolled = await Enrollment.findOne({
      userId,
      courseId,
      status: 'ACTIVE',
    });

    const userRole = (session.user as any)?.role;
    const isInstructorOrAdmin =
      userRole === 'INSTRUCTOR' ||
      userRole === 'ADMIN' ||
      userRole === 'SUPERADMIN';

    if (!isEnrolled && !isInstructorOrAdmin) {
      return { error: 'You must be enrolled in this course to submit projects.' };
    }

    const lesson = await Lesson.findById(lessonId);
    if (!lesson) {
      return { error: 'Lesson / Project Portal not found.' };
    }

    // Run automated evaluation
    const evaluation = evaluateProjectSubmission(
      githubUrl,
      liveUrl || '',
      description || '',
      lesson
    );

    const passMarks = lesson.passMarks || 60;
    const maxMarks = lesson.maxMarks || 100;
    const isPassed = evaluation.overallScore >= passMarks;

    // Create or update project submission
    const submission = await ProjectSubmission.findOneAndUpdate(
      { courseId, lessonId, studentId: userId },
      {
        courseId,
        moduleId: lesson.moduleId,
        lessonId,
        studentId: userId,
        githubUrl: githubUrl.trim(),
        liveUrl: (liveUrl || '').trim(),
        description: (description || '').trim(),
        notes: (notes || '').trim(),
        status: isPassed ? 'PASSED' : 'FAILED',
        score: evaluation.overallScore,
        maxMarks,
        passMarks,
        automatedEvaluation: {
          evaluatedAt: evaluation.evaluatedAt,
          overallScore: evaluation.overallScore,
          maxScore: evaluation.maxScore,
          checks: evaluation.checks,
          feedbackSummary: evaluation.feedbackSummary,
          strengths: evaluation.strengths,
          improvements: evaluation.improvements,
        },
        submittedAt: new Date(),
      },
      { upsert: true, new: true }
    );

    // If passed, mark lesson completed in LessonProgress
    if (isPassed) {
      await LessonProgress.findOneAndUpdate(
        { userId, lessonId },
        {
          userId,
          courseId,
          lessonId,
          completed: true,
          completedAt: new Date(),
        },
        { upsert: true }
      );
    }

    // Create In-App Notification
    try {
      await Notification.create({
        recipientId: userId,
        title: isPassed ? 'প্রজেক্ট মূল্যায়ন সম্পন্ন: উত্তীর্ণ! 🎉' : 'প্রজেক্ট মূল্যায়ন ফলাফল: সংশোধন প্রয়োজন ⚠️',
        message: isPassed
          ? `আপনার "${lesson.title}" প্রজেক্টের স্বয়ংক্রিয় মূল্যায়নে আপনি ${evaluation.overallScore}/${maxMarks} নম্বর পেয়ে উত্তীর্ণ হয়েছেন!`
          : `আপনার "${lesson.title}" প্রজেক্টটিতে ${evaluation.overallScore}/${maxMarks} নম্বর এসেছে। প্রয়োজনীয় বিষয়গুলো সংশোধন করে পুনরায় জমা দিন।`,
        type: 'SYSTEM',
        priority: isPassed ? 'HIGH' : 'NORMAL',
        priorityWeight: isPassed ? 3 : 2,
        isRead: false,
        actionUrl: `/courses/${courseId}`,
      });
    } catch {
      // safe fallback if notification fails
    }

    revalidatePath(`/courses/${courseId}`);
    revalidatePath('/student');

    return {
      success: true,
      submission: JSON.parse(JSON.stringify(submission)),
      evaluation,
    };
  } catch (err: any) {
    console.error('Error in submitProjectAndEvaluateAction:', err);
    return { error: err.message || 'Failed to evaluate and save project submission.' };
  }
}

/**
 * Fetch a student's existing project submission for a lesson
 */
export async function getStudentProjectSubmissionAction(courseId: string, lessonId: string) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return { submission: null };

  try {
    await dbConnect();
    const submission = await ProjectSubmission.findOne({
      courseId,
      lessonId,
      studentId: userId,
    }).lean();

    return { submission: submission ? JSON.parse(JSON.stringify(submission)) : null };
  } catch (err: any) {
    console.error('Error fetching student project submission:', err);
    return { error: err.message, submission: null };
  }
}

/**
 * Fetch all project submissions for an instructor's course
 */
export async function getCourseProjectSubmissionsAction(courseId: string) {
  const session = await auth();
  const user = session?.user;

  const userRole = (user as any)?.role;
  if (!user?.id || (userRole !== 'INSTRUCTOR' && userRole !== 'ADMIN' && userRole !== 'SUPERADMIN')) {
    return { error: 'Unauthorized. Instructors only.', submissions: [] };
  }

  try {
    await dbConnect();
    const submissions = await ProjectSubmission.find({ courseId })
      .populate('studentId', 'name email image')
      .populate('lessonId', 'title')
      .sort({ submittedAt: -1 })
      .lean();

    return { submissions: JSON.parse(JSON.stringify(submissions)) };
  } catch (err: any) {
    console.error('Error fetching course project submissions:', err);
    return { error: err.message, submissions: [] };
  }
}

/**
 * Grade or add instructor remarks to a student project submission
 */
export async function gradeProjectSubmissionAction(
  submissionId: string,
  instructorScore: number,
  instructorFeedback: string
) {
  const session = await auth();
  const user = session?.user;
  const userRole = (user as any)?.role;

  if (!user?.id || (userRole !== 'INSTRUCTOR' && userRole !== 'ADMIN' && userRole !== 'SUPERADMIN')) {
    return { error: 'Unauthorized. Instructors only.' };
  }

  try {
    await dbConnect();
    const submission = await ProjectSubmission.findById(submissionId);
    if (!submission) return { error: 'Submission not found.' };

    submission.instructorScore = instructorScore;
    submission.instructorFeedback = instructorFeedback;
    submission.score = instructorScore;
    submission.status = instructorScore >= submission.passMarks ? 'PASSED' : 'FAILED';
    await submission.save();

    // Mark lesson complete if passed
    if (submission.status === 'PASSED') {
      await LessonProgress.findOneAndUpdate(
        { userId: submission.studentId, lessonId: submission.lessonId },
        {
          userId: submission.studentId,
          courseId: submission.courseId,
          lessonId: submission.lessonId,
          completed: true,
          completedAt: new Date(),
        },
        { upsert: true }
      );
    }

    return { success: true, submission: JSON.parse(JSON.stringify(submission)) };
  } catch (err: any) {
    console.error('Error grading project submission:', err);
    return { error: err.message || 'Failed to grade submission.' };
  }
}
