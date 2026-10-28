'use server';

import { auth } from '@/auth';
import dbConnect from '@/lib/mongoose';
import Contest, { IContest } from '@/models/Contest';
import ContestSubmission from '@/models/ContestSubmission';
import Notification from '@/models/Notification';
import User from '@/models/User';
import Enrollment from '@/models/Enrollment';
import {
  calculateContestRatingDelta,
  calculateCompositeElo,
  calculateBackgroundPriority,
  normalizeBackground,
} from '@/lib/elo';
import { isValidMongoObjectId } from '@/lib/auth-helpers';
import { revalidatePath } from 'next/cache';
import { getAssessmentViewer, canAccessAssessment, filterVisibleAssessments, authorizeAssessmentCreation } from '@/lib/assessment-access';
import { AssessmentAudience } from '@/lib/assessment-policy';
import { randomUUID } from 'crypto';

function currentContestStatus(contest: any) {
  const start = new Date(contest.startTime).getTime(); const end = new Date(contest.endTime).getTime();
  return Number.isFinite(start) && Number.isFinite(end) ? (Date.now() < start ? 'UPCOMING' : Date.now() >= end ? 'ENDED' : 'LIVE') : contest.status;
}

/**
 * High-quality seed data for problem-solving contests across different disciplines
 */


/**
 * Seeds sample problem-solving contests and prioritized notifications
 */
export async function seedContestsAndNotificationsAction() {
  return { success: false, error: 'Sample data creation has been removed.', message: undefined };
}

/**
 * Retrieves prioritized contests for the Homepage, taking student background into account.
 * CS students receive CS contests at the very top of their list!
 */
export async function getHomepageContestsAction(userBackground?: string) {
  try {
    await dbConnect();

    // If userBackground not provided directly, try resolving from authenticated session
    let effectiveBg = userBackground;
    if (!effectiveBg) {
      const session = await auth();
      const userId = (session?.user as any)?.id;
      const userEmail = (session?.user as any)?.email;
      if (userId || userEmail) {
        let userQuery: any = null;
        if (isValidMongoObjectId(userId)) {
          userQuery = { _id: userId };
        } else if (typeof userId === 'string' && userId.includes('@')) {
          userQuery = { email: userId };
        } else if (userEmail) {
          userQuery = { email: userEmail };
        }
        if (userQuery) {
          const user = await User.findOne(userQuery).select('academicBackground department').lean() as any;
          if (user?.department || user?.academicBackground) {
            effectiveBg = user.department || user.academicBackground;
          }
        }
      }
    }

    const contests = await Contest.find({ featuredOnHome: true })
      .sort({ createdAt: -1 })
      .lean();

    // Map contests with background matching and priority scores
    const visibleContests = await filterVisibleAssessments(contests, await getAssessmentViewer());

    const enrichedContests = visibleContests.filter((contest) => currentContestStatus(contest) !== 'ENDED').map((c: any) => {
      const match = calculateBackgroundPriority(effectiveBg, c.targetBackgrounds);
      return {
        id: c._id.toString(),
        title: c.title,
        slug: c.slug,
        description: c.description,
        shortSummary: c.shortSummary,
        category: c.category,
        targetBackgrounds: c.targetBackgrounds,
        difficulty: c.difficulty,
        benchmarkRating: c.benchmarkRating,
        durationMinutes: c.durationMinutes,
        status: currentContestStatus(c),
        totalParticipants: c.totalParticipants,
        prizePool: c.prizePool,
        problemCount: c.problems?.length || 0,
        // Prioritization metrics
        priority: match.priority,
        priorityScore: match.priorityScore,
        badgeTextEn: match.badgeTextEn,
        badgeTextBn: match.badgeTextBn,
        isDirectMatch: match.isDirectMatch,
        matchReason: match.matchReason,
      };
    });

    // Sort strictly by priority score descending (Highest priority first!), then by benchmark rating
    enrichedContests.sort((a, b) => {
      if (b.priorityScore !== a.priorityScore) {
        return b.priorityScore - a.priorityScore;
      }
      return b.benchmarkRating - a.benchmarkRating;
    });

    return {
      success: true,
      userBackground: effectiveBg || '',
      contests: enrichedContests,
    };
  } catch (error: any) {
    console.warn('Failed to load homepage contests.');
    return { success: false, contests: [], userBackground: userBackground || '' };
  }
}

/**
 * Retrieves all contests with optional category filtering
 */
export async function getContestsListAction(filterCategory?: string, userBackground?: string) {
  try {
    await dbConnect();

    let query: any = {};
    if (filterCategory && filterCategory !== 'ALL') {
      query.category = filterCategory;
    }

    const contests = await Contest.find(query).lean();

    const visibleContests = await filterVisibleAssessments(contests, await getAssessmentViewer());

    const enriched = visibleContests.map((c: any) => {
      const match = calculateBackgroundPriority(userBackground, c.targetBackgrounds);
      return {
        id: c._id.toString(),
        title: c.title,
        slug: c.slug,
        description: c.description,
        shortSummary: c.shortSummary,
        category: c.category,
        targetBackgrounds: c.targetBackgrounds,
        difficulty: c.difficulty,
        benchmarkRating: c.benchmarkRating,
        durationMinutes: c.durationMinutes,
        status: currentContestStatus(c),
        totalParticipants: c.totalParticipants,
        prizePool: c.prizePool,
        problemCount: c.problems?.length || 0,
        priority: match.priority,
        priorityScore: match.priorityScore,
        badgeTextEn: match.badgeTextEn,
        badgeTextBn: match.badgeTextBn,
        isDirectMatch: match.isDirectMatch,
      };
    });

    enriched.sort((a, b) => b.priorityScore - a.priorityScore);

    return {
      success: true,
      contests: enriched,
    };
  } catch (error: any) {
    console.error('Error fetching contests list:', error);
    return { error: 'কনটেস্ট তালিকা লোড ব্যর্থ হয়েছে।' };
  }
}

/**
 * Retrieves a single contest by its slug with problems sanitized for taking
 */
export async function getContestBySlugAction(slug: string, forSolving: boolean = false) {
  try {
    await dbConnect();

    const contest = await Contest.findOne({ slug }).lean() as any;
    if (!contest) {
      return { error: 'কনটেস্টটি পাওয়া যায়নি।' };
    }

    if (!await canAccessAssessment(contest, await getAssessmentViewer())) return { error: 'This contest is unavailable for your enrollment or audience profile.' };

    const session = await auth();
    const userId = (session?.user as any)?.id;
    const userEmail = (session?.user as any)?.email;
    let existingSubmission: any = null;

    if (userId || userEmail) {
      let userQuery: any = null;
      if (isValidMongoObjectId(userId)) {
        userQuery = { _id: userId };
      } else if (typeof userId === 'string' && userId.includes('@')) {
        userQuery = { email: userId };
      } else if (userEmail) {
        userQuery = { email: userEmail };
      }
      if (userQuery) {
        const user = await User.findOne(userQuery).select('_id').lean() as any;
        if (user) {
          existingSubmission = await ContestSubmission.findOne({
            contestId: contest._id,
            studentId: user._id,
          }).lean();
        }
      }
    }

    // Solutions are public only after the contest has ended.
    forSolving = forSolving || !contest.endTime || new Date(contest.endTime).getTime() > Date.now();

    const formattedProblems = (contest.problems || []).map((p: any, idx: number) => ({
      id: p.id || `p_${idx}`,
      index: idx,
      title: p.title,
      statement: p.statement,
      category: p.category,
      difficultyRating: p.difficultyRating,
      points: p.points,
      options: p.options,
      sampleInputOutput: p.sampleInputOutput,
      // Only include correct answer and explanation if not in student solving mode
      ...(forSolving
        ? {}
        : {
            correctAnswer: p.correctAnswer,
            explanation: p.explanation,
          }),
    }));

    return {
      success: true,
      contest: {
        id: contest._id.toString(),
        title: contest.title,
        slug: contest.slug,
        description: contest.description,
        shortSummary: contest.shortSummary,
        category: contest.category,
        targetBackgrounds: contest.targetBackgrounds,
        difficulty: contest.difficulty,
        benchmarkRating: contest.benchmarkRating,
        durationMinutes: contest.durationMinutes,
        status: currentContestStatus(contest),
        totalParticipants: contest.totalParticipants,
        prizePool: contest.prizePool,
        rules: contest.rules || [],
        problems: formattedProblems,
      },
      hasSubmitted: !!existingSubmission,
      submission: existingSubmission
        ? {
            id: existingSubmission._id.toString(),
            totalScore: existingSubmission.totalScore,
            maxScore: existingSubmission.maxScore,
            accuracy: existingSubmission.accuracy,
            eloChange: existingSubmission.eloChange,
            previousCompetitiveElo: existingSubmission.previousCompetitiveElo,
            newCompetitiveElo: existingSubmission.newCompetitiveElo,
            newCompositeElo: existingSubmission.newCompositeElo,
            performanceSummary: existingSubmission.performanceSummary,
            submittedAt: existingSubmission.submittedAt?.toISOString(),
          }
        : null,
    };
  } catch (error: any) {
    console.error('Error fetching contest by slug:', error);
    return { error: 'কনটেস্টের বিবরণ পেতে সমস্যা হয়েছে।' };
  }
}

/**
 * Submits student answers for a contest, calculates actual vs expected score,
 * evaluates two-way Elo fluctuation (+ or -), updates cumulative bonuses, and logs rating history.
 */
export async function submitContestAction({
  contestSlug,
  answers,
  timeTakenSeconds,
}: {
  contestSlug: string;
  answers: Record<number, number>; // { [problemIndex]: selectedOptionIndex }
  timeTakenSeconds: number;
}) {
  try {
    const session = await auth();
    const sessionUserId = (session?.user as any)?.id;
    if (!sessionUserId) {
      return { error: 'উত্তর জমা দিতে লগইন আবশ্যক।' };
    }

    await dbConnect();

    let userQuery: any = null;
    const sessionUserEmail = (session?.user as any)?.email;
    if (isValidMongoObjectId(sessionUserId)) {
      userQuery = { _id: sessionUserId };
    } else if (typeof sessionUserId === 'string' && sessionUserId.includes('@')) {
      userQuery = { email: sessionUserId };
    } else if (sessionUserEmail) {
      userQuery = { email: sessionUserEmail };
    }

    const user = userQuery ? await User.findOne(userQuery) : null;
    if (!user) {
      return { error: 'ইউজার অ্যাকাউন্ট পাওয়া যায়নি।' };
    }

    const contest = await Contest.findOne({ slug: contestSlug }).lean() as any;
    if (!contest) {
      return { error: 'কনটেস্টটি পাওয়া যায়নি।' };
    }

    if (!await canAccessAssessment(contest, await getAssessmentViewer())) return { error: 'You are not eligible to participate in this contest.' };
    if (new Date(contest.startTime).getTime() > Date.now() || new Date(contest.endTime).getTime() <= Date.now()) return { error: 'This contest is not currently open.' };

    // Evaluate problems
    let calculatedScore = 0;
    let maxPossibleScore = 0;
    let problemsSolvedCount = 0;
    const submissionAnswers: any[] = [];
    const problemsBreakdown: any[] = [];

    (contest.problems || []).forEach((p: any, idx: number) => {
      const selected = answers[idx] !== undefined ? answers[idx] : -1;
      const isCorrect = selected === p.correctAnswer;
      const problemPoints = p.points || 100;
      maxPossibleScore += problemPoints;

      if (isCorrect) {
        calculatedScore += problemPoints;
        problemsSolvedCount += 1;
      }

      submissionAnswers.push({
        problemId: p.id || `p_${idx}`,
        problemIndex: idx,
        selectedOption: selected,
        isCorrect,
        timeSpentSeconds: Math.floor(timeTakenSeconds / Math.max(1, contest.problems.length)),
      });

      problemsBreakdown.push({
        index: idx,
        title: p.title,
        statement: p.statement,
        options: p.options,
        selectedOption: selected,
        correctAnswer: p.correctAnswer,
        isCorrect,
        explanation: p.explanation,
        points: problemPoints,
      });
    });

    const accuracy = maxPossibleScore > 0 ? Math.round((calculatedScore / maxPossibleScore) * 100) : 0;

    // Get current competitive Elo (default 1200)
    const currentCompetitiveElo = user.competitiveElo || 1200;

    // Total contests played by this user
    const totalContestsPlayed = await ContestSubmission.countDocuments({ studentId: user._id });

    // Calculate dynamic Elo Delta (Can be POSITIVE or NEGATIVE!)
    const ratingResult = calculateContestRatingDelta({
      currentCompetitiveElo,
      benchmarkRating: contest.benchmarkRating || 1500,
      score: calculatedScore,
      totalMarks: maxPossibleScore,
      timeTakenSeconds,
      totalDurationSeconds: (contest.durationMinutes || 45) * 60,
      totalContestsPlayed,
    });

    // Calculate completed courses count from database
    const completedCourses = await Enrollment.countDocuments({
      userId: user._id,
      paymentStatus: { $in: ['success', 'GRANTED', 'granted'] },
    });

    // Update cumulative problems solved
    const updatedProblemsSolved = (user.problemsSolved || 0) + problemsSolvedCount;

    // Calculate new Composite Elo (Competitive Elo + Completed Courses Bonus + Total Solved Problems Bonus)
    const compositeResult = calculateCompositeElo({
      competitiveElo: ratingResult.newCompetitiveElo,
      completedCoursesCount: completedCourses,
      problemsSolved: updatedProblemsSolved,
    });

    const previousCompositeElo = user.elo || 1200;
    const newCompositeElo = compositeResult.compositeElo;
    const netCompositeDelta = newCompositeElo - previousCompositeElo;

    // Save Contest Submission
    const submission = await ContestSubmission.create({
      contestId: contest._id,
      studentId: user._id,
      answers: submissionAnswers,
      totalScore: calculatedScore,
      maxScore: maxPossibleScore,
      accuracy,
      timeTakenSeconds,
      previousCompetitiveElo: currentCompetitiveElo,
      newCompetitiveElo: ratingResult.newCompetitiveElo,
      eloChange: ratingResult.delta,
      previousCompositeElo,
      newCompositeElo,
      problemsSolvedCount,
      performanceSummary: ratingResult.performanceSummary,
      submittedAt: new Date(),
    });

    // Increment contest participants count
    await Contest.findByIdAndUpdate(contest._id, { $inc: { totalParticipants: 1 } });

    // Update User Document with new Ratings & History
    const historyEntry = {
      date: new Date(),
      oldElo: previousCompositeElo,
      newElo: newCompositeElo,
      delta: netCompositeDelta,
      contestId: contest._id.toString(),
      contestTitle: contest.title,
      reason: `Contest: ${contest.title} (${ratingResult.delta >= 0 ? '+' : ''}${ratingResult.delta} competitive)`,
    };

    await User.findByIdAndUpdate(user._id, {
      $set: {
        competitiveElo: ratingResult.newCompetitiveElo,
        elo: newCompositeElo,
        problemsSolved: updatedProblemsSolved,
        completedCoursesCount: completedCourses,
      },
      $push: {
        eloHistory: historyEntry,
      },
    });

    // Create high-priority notification for the student about their rating change
    const deltaSign = netCompositeDelta >= 0 ? '+' : '';
    await Notification.create({
      recipientId: user._id,
      title: `📊 Elo Rating Update: ${deltaSign}${netCompositeDelta} Elo`,
      message: `${contest.title} সমাপ্ত হয়েছে! আপনার স্কোর: ${calculatedScore}/${maxPossibleScore} (${accuracy}%)। নতুন রেটিং: ${newCompositeElo} (${compositeResult.tier.titleEn})।`,
      type: 'ELO_UPDATE',
      priority: 'HIGH',
      priorityWeight: 3,
      actionUrl: `/contests/${contest.slug}`,
      badgeLabel: `${deltaSign}${netCompositeDelta} Elo`,
      isRead: false,
    });

    revalidatePath('/');
    revalidatePath('/student');
    revalidatePath('/student/settings');
    revalidatePath('/contests');
    revalidatePath(`/contests/${contest.slug}`);

    return {
      success: true,
      result: {
        submissionId: submission._id.toString(),
        score: calculatedScore,
        maxScore: maxPossibleScore,
        accuracy,
        timeTakenSeconds,
        ratingDelta: ratingResult.delta,
        netCompositeDelta,
        previousCompetitiveElo: currentCompetitiveElo,
        newCompetitiveElo: ratingResult.newCompetitiveElo,
        previousCompositeElo,
        newCompositeElo,
        tier: compositeResult.tier,
        courseBonus: compositeResult.courseBonus,
        problemsBonus: compositeResult.problemsBonus,
        expectedScore: ratingResult.expectedScore,
        actualPerformance: ratingResult.actualPerformance,
        performanceSummary: ratingResult.performanceSummary,
        problemsBreakdown,
      },
    };
  } catch (error: any) {
    console.error('Error submitting contest:', error);
    return { error: error.message || 'কনটেস্ট সাবমিট করতে সমস্যা হয়েছে।' };
  }
}

export async function createContestAction(data: {
  title: string; description: string; courseId?: string; scope: 'COURSE' | 'GLOBAL';
  audience?: AssessmentAudience; startTime: string; endTime: string; durationMinutes: number;
  problems: { title: string; statement: string; options: string[]; correctAnswer: number; points: number; explanation?: string }[];
}) {
  try {
    const actor = await getAssessmentViewer();
    if (!actor) return { error: 'Sign in as an instructor.' };
    const publication = await authorizeAssessmentCreation('CONTEST', data, actor);
    const start = new Date(data.startTime); const end = new Date(data.endTime);
    if (!data.title?.trim() || data.title.length > 180 || !data.description?.trim()) return { error: 'Provide a title and description.' };
    if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime()) || end <= start || end.getTime() <= Date.now() || !Number.isInteger(data.durationMinutes) || data.durationMinutes < 1 || data.durationMinutes > 480 || data.durationMinutes * 60000 > end.getTime() - start.getTime()) return { error: 'Choose a valid future contest window and a duration within that window (1–480 minutes).' };
    if (!Array.isArray(data.problems) || !data.problems.length || data.problems.length > 100 || data.problems.some((problem) => !problem.title?.trim() || !problem.statement?.trim() || !Array.isArray(problem.options) || problem.options.length < 2 || problem.options.some((option) => typeof option !== 'string' || !option.trim()) || !Number.isInteger(problem.correctAnswer) || problem.correctAnswer < 0 || problem.correctAnswer >= problem.options.length || !Number.isFinite(problem.points) || problem.points <= 0)) return { error: 'Complete every problem, its answer options, correct answer, and positive points.' };
    const baseSlug = data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80) || 'contest';
    const slug = baseSlug + '-' + randomUUID().slice(0, 8);
    await Contest.create({ ...publication, title: data.title.trim(), description: data.description.trim(), slug, shortSummary: data.description.trim().slice(0, 180), createdById: actor.id,
      startTime: start, endTime: end, durationMinutes: data.durationMinutes, status: start.getTime() > Date.now() ? 'UPCOMING' : 'LIVE',
      targetBackgrounds: publication.audience.departments.map((department) => department.toUpperCase()), featuredOnHome: true,
      problems: data.problems.map((problem, index) => ({ ...problem, id: `p${index + 1}`, title: problem.title.trim(), statement: problem.statement.trim(), options: problem.options.map((option) => option.trim()) })),
    });
    revalidatePath('/contests'); revalidatePath('/');
    return { success: true, slug };
  } catch (error: any) { return { error: error.message || 'Contest creation failed.' }; }
}
