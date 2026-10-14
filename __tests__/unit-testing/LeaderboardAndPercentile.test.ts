import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getGlobalLeaderboardAction,
  getCourseLeaderboardAction,
  getAvailableCoursesForLeaderboardAction,
} from '@/actions/leaderboard';
import { auth } from '@/auth';
import User from '@/models/User';
import Course from '@/models/Course';
import Enrollment from '@/models/Enrollment';
import Exam from '@/models/Exam';
import ExamSubmission from '@/models/ExamSubmission';
import CourseRoutine from '@/models/CourseRoutine';

vi.mock('@/auth', () => ({
  auth: vi.fn(),
}));

vi.mock('@/lib/mongoose', () => ({
  default: vi.fn().mockResolvedValue(true),
}));

vi.mock('@/models/User', () => ({
  default: {
    find: vi.fn(),
    findOne: vi.fn(),
  },
}));

vi.mock('@/models/Course', () => ({
  default: {
    findById: vi.fn(),
    find: vi.fn(),
  },
}));

vi.mock('@/models/Enrollment', () => ({
  default: {
    find: vi.fn(),
    countDocuments: vi.fn(),
  },
}));

vi.mock('@/models/Exam', () => ({
  default: {
    find: vi.fn(),
  },
}));

vi.mock('@/models/ExamSubmission', () => ({
  default: {
    find: vi.fn(),
  },
}));

vi.mock('@/models/CourseRoutine', () => ({
  default: {
    find: vi.fn(),
  },
}));

describe('Local (Course-Level) & Global Leaderboard with Percentile / Elo Ranking Engine', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Global Leaderboard with Elo & Percentile Calculation', () => {
    const mockStudents = [
      {
        _id: 'u-1',
        name: 'Tanzim Ahmed',
        email: 'tanzim@example.com',
        elo: 2050,
        competitiveElo: 2000,
        problemsSolved: 65,
        streak: 20,
        targetTrack: 'Computer Science (CSE)',
        academicBackground: 'CSE',
      },
      {
        _id: 'u-2',
        name: 'Nusrat Jahan',
        email: 'nusrat@example.com',
        elo: 1650,
        competitiveElo: 1600,
        problemsSolved: 40,
        streak: 12,
        targetTrack: 'Data Science & AI',
        academicBackground: 'Data Science',
      },
      {
        _id: 'u-3',
        name: 'Rakibul Hasan',
        email: 'rakib@example.com',
        elo: 1450,
        competitiveElo: 1400,
        problemsSolved: 25,
        streak: 8,
        targetTrack: 'Fullstack Web Development',
        academicBackground: 'CSE',
      },
      {
        _id: 'u-4',
        name: 'Sadia Afrin',
        email: 'sadia@example.com',
        elo: 1250,
        competitiveElo: 1200,
        problemsSolved: 10,
        streak: 3,
        targetTrack: 'General Tech',
        academicBackground: 'EEE',
      },
    ];

    it('should rank students globally by Elo and calculate accurate mathematical percentiles', async () => {
      (auth as any).mockResolvedValue({
        user: { id: 'u-2', email: 'nusrat@example.com' },
      });

      (User.find as any).mockReturnValue({
        sort: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            lean: vi.fn().mockResolvedValue(mockStudents),
          }),
        }),
      });

      const res = await getGlobalLeaderboardAction({ track: 'ALL', page: 1, limit: 10 });
      expect(res.success).toBe(true);
      expect(res.students).toHaveLength(4);
      expect(res.totalStudents).toBe(4);

      // Rank 1: Tanzim (2050 Elo -> Grandmaster)
      const rank1 = res.students![0];
      expect(rank1.rank).toBe(1);
      expect(rank1.name).toBe('Tanzim Ahmed');
      expect(rank1.elo).toBe(2050);
      expect(rank1.tier.tier).toBe('Grandmaster');
      // Percentile formula: ((4 - 1 + 1) / 4) * 100 = 100th percentile
      expect(rank1.percentile).toBe(100);
      expect(rank1.topPercentage).toBe(25); // (1 / 4) * 100 = 25%

      // Rank 2: Nusrat (1650 Elo -> Expert)
      const rank2 = res.students![1];
      expect(rank2.rank).toBe(2);
      expect(rank2.name).toBe('Nusrat Jahan');
      expect(rank2.elo).toBe(1650);
      expect(rank2.tier.tier).toBe('Expert');
      // Percentile formula: ((4 - 2 + 1) / 4) * 100 = 75th percentile
      expect(rank2.percentile).toBe(75);
      expect(rank2.topPercentage).toBe(50);
      expect(rank2.isCurrentUser).toBe(true);

      // Rank 3: Rakibul (1450 Elo -> Specialist)
      const rank3 = res.students![2];
      expect(rank3.rank).toBe(3);
      expect(rank3.tier.tier).toBe('Specialist');
      expect(rank3.percentile).toBe(50);

      // Rank 4: Sadia (1250 Elo -> Pupil)
      const rank4 = res.students![3];
      expect(rank4.rank).toBe(4);
      expect(rank4.tier.tier).toBe('Pupil');
      expect(rank4.percentile).toBe(25);

      // Current user spotlight rank
      expect(res.currentUserRank).toBeDefined();
      expect(res.currentUserRank?.rank).toBe(2);
      expect(res.currentUserRank?.percentile).toBe(75);
    });

    it('should filter global leaderboard by academic track (e.g., CSE)', async () => {
      (auth as any).mockResolvedValue(null);

      (User.find as any).mockReturnValue({
        sort: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            lean: vi.fn().mockResolvedValue(mockStudents),
          }),
        }),
      });

      const res = await getGlobalLeaderboardAction({ track: 'CSE', page: 1, limit: 10 });
      expect(res.success).toBe(true);
      // u-1 (CSE) and u-3 (CSE) match
      expect(res.students).toHaveLength(2);
      expect(res.totalStudents).toBe(2);
      expect(res.students![0].name).toBe('Tanzim Ahmed');
      expect(res.students![1].name).toBe('Rakibul Hasan');
    });
  });

  describe('Local (Course-Level) Cohort Leaderboard', () => {
    const courseId = 'course-react-101';
    const mockCourse = {
      _id: courseId,
      title: 'Fullstack Next.js & React Mastery',
      category: 'Web Development',
    };

    const mockEnrollments = [
      { userId: 'u-1', courseId, paymentStatus: 'success' },
      { userId: 'u-2', courseId, paymentStatus: 'success' },
      { userId: 'u-3', courseId, paymentStatus: 'success' },
    ];

    const mockExams = [
      { _id: 'ex-1', totalMarks: 10, passMarks: 4 },
      { _id: 'ex-2', totalMarks: 20, passMarks: 8 },
    ];

    const mockSubmissions = [
      // u-1 scores: ex-1 = 10, ex-2 = 18 -> Total = 28
      { examId: 'ex-1', studentId: 'u-1', score: 10, totalMarks: 10, passed: true },
      { examId: 'ex-2', studentId: 'u-1', score: 18, totalMarks: 20, passed: true },
      // u-2 scores: ex-1 = 8, ex-2 = 15 -> Total = 23
      { examId: 'ex-1', studentId: 'u-2', score: 8, totalMarks: 10, passed: true },
      { examId: 'ex-2', studentId: 'u-2', score: 15, totalMarks: 20, passed: true },
      // u-3 scores: ex-1 = 6 -> Total = 6
      { examId: 'ex-1', studentId: 'u-3', score: 6, totalMarks: 10, passed: true },
    ];

    const mockRoutines = [
      { userId: 'u-1', items: [{ completed: true }, { completed: true }, { completed: false }] }, // 2 completed
      { userId: 'u-2', items: [{ completed: true }, { completed: true }, { completed: true }] },  // 3 completed
      { userId: 'u-3', items: [{ completed: true }] },                                             // 1 completed
    ];

    const mockUsers = [
      { _id: 'u-1', name: 'Tanzim', academicBackground: 'CSE', elo: 2050 },
      { _id: 'u-2', name: 'Nusrat', academicBackground: 'AI', elo: 1650 },
      { _id: 'u-3', name: 'Rakibul', academicBackground: 'CSE', elo: 1450 },
    ];

    it('should rank enrolled students locally by course exam score and calculate cohort percentile', async () => {
      (auth as any).mockResolvedValue({
        user: { id: 'u-2' },
      });

      (Course.findById as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue(mockCourse),
        }),
      });

      (Enrollment.find as any).mockReturnValue({
        lean: vi.fn().mockResolvedValue(mockEnrollments),
      });

      (Exam.find as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue(mockExams),
        }),
      });

      (ExamSubmission.find as any).mockReturnValue({
        lean: vi.fn().mockResolvedValue(mockSubmissions),
      });

      (CourseRoutine.find as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue(mockRoutines),
        }),
      });

      (User.find as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue(mockUsers),
        }),
      });

      const res = await getCourseLeaderboardAction(courseId);
      expect(res.success).toBe(true);
      expect(res.course?.title).toBe('Fullstack Next.js & React Mastery');
      expect(res.totalEnrolled).toBe(3);
      expect(res.students).toHaveLength(3);

      // Rank 1: Tanzim (28 course marks)
      const rank1 = res.students![0];
      expect(rank1.courseRank).toBe(1);
      expect(rank1.name).toBe('Tanzim');
      expect(rank1.totalCourseScore).toBe(28);
      expect(rank1.completedLecturesCount).toBe(2);
      expect(rank1.coursePercentile).toBe(100); // ((3 - 1 + 1) / 3) * 100 = 100th percentile
      expect(rank1.topPercentage).toBe(33);

      // Rank 2: Nusrat (23 course marks)
      const rank2 = res.students![1];
      expect(rank2.courseRank).toBe(2);
      expect(rank2.name).toBe('Nusrat');
      expect(rank2.totalCourseScore).toBe(23);
      expect(rank2.completedLecturesCount).toBe(3);
      expect(rank2.coursePercentile).toBe(67);
      expect(rank2.isCurrentUser).toBe(true);

      // Rank 3: Rakibul (6 course marks)
      const rank3 = res.students![2];
      expect(rank3.courseRank).toBe(3);
      expect(rank3.totalCourseScore).toBe(6);
      expect(rank3.coursePercentile).toBe(33);

      // Current user course rank
      expect(res.currentUserCourseRank).toBeDefined();
      expect(res.currentUserCourseRank?.courseRank).toBe(2);
      expect(res.currentUserCourseRank?.coursePercentile).toBe(67);
    });

    it('should return empty list gracefully when course has no enrolled students', async () => {
      (auth as any).mockResolvedValue(null);

      (Course.findById as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue({ _id: 'empty-course', title: 'New Course' }),
        }),
      });

      (Enrollment.find as any).mockReturnValue({
        lean: vi.fn().mockResolvedValue([]),
      });

      const res = await getCourseLeaderboardAction('empty-course');
      expect(res.success).toBe(true);
      expect(res.students).toEqual([]);
      expect(res.totalEnrolled).toBe(0);
      expect(res.currentUserCourseRank).toBeNull();
    });
  });

  describe('Course Selector for Leaderboard', () => {
    it('should list available courses with their enrolled counts', async () => {
      (Course.find as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue([
            { _id: 'c1', title: 'Course 1', category: 'Tech' },
            { _id: 'c2', title: 'Course 2', category: 'Design' },
          ]),
        }),
      });

      (Enrollment.countDocuments as any).mockResolvedValueOnce(25).mockResolvedValueOnce(50);

      const res = await getAvailableCoursesForLeaderboardAction();
      expect(res.success).toBe(true);
      expect(res.courses).toHaveLength(2);
      // Course 2 has 50 enrollments, should be sorted first
      expect(res.courses![0].id).toBe('c2');
      expect(res.courses![0].enrolledCount).toBe(50);
      expect(res.courses![1].id).toBe('c1');
      expect(res.courses![1].enrolledCount).toBe(25);
    });
  });
});
