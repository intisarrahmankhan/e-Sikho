import { describe, it, expect, vi, beforeEach } from 'vitest';
import { evaluateProjectSubmission } from '@/lib/project-evaluator';
import {
  submitProjectAndEvaluateAction,
  getCourseProjectSubmissionsAction,
  gradeProjectSubmissionAction,
} from '@/actions/project-actions';
import { auth } from '@/auth';
import ProjectSubmission from '@/models/ProjectSubmission';
import Lesson from '@/models/Lesson';
import Enrollment from '@/models/Enrollment';
import LessonProgress from '@/models/LessonProgress';
import Notification from '@/models/Notification';

vi.mock('@/auth', () => ({
  auth: vi.fn(),
}));

vi.mock('@/lib/mongoose', () => ({
  default: vi.fn().mockResolvedValue(true),
}));

vi.mock('@/models/ProjectSubmission', () => ({
  default: {
    findOneAndUpdate: vi.fn(),
    find: vi.fn(),
    findById: vi.fn(),
  },
}));

vi.mock('@/models/Lesson', () => ({
  default: {
    findById: vi.fn(),
  },
}));

vi.mock('@/models/Enrollment', () => ({
  default: {
    findOne: vi.fn(),
  },
}));

vi.mock('@/models/LessonProgress', () => ({
  default: {
    findOneAndUpdate: vi.fn(),
  },
}));

vi.mock('@/models/Notification', () => ({
  default: {
    create: vi.fn(),
  },
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

describe('Project Submission & Automated Evaluation Engine', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('evaluateProjectSubmission (Automated Engine)', () => {
    const mockLesson = {
      title: 'Fullstack E-Commerce Capstone Project',
      projectDeliverables: 'Next.js, TailwindCSS, MongoDB, Authentication, Stripe API',
      githubRequired: true,
      liveUrlRequired: true,
      passMarks: 60,
      maxMarks: 100,
    };

    it('awards high score when repository, live URL, deliverables, and docs are complete', () => {
      const evaluation = evaluateProjectSubmission(
        'https://github.com/developer/nextjs-ecommerce-capstone',
        'https://my-ecommerce-store.vercel.app',
        'Built fullstack platform with Next.js, TailwindCSS, MongoDB and Stripe payments. Includes authentication and test coverage.',
        mockLesson
      );

      expect(evaluation.overallScore).toBeGreaterThanOrEqual(80);
      expect(evaluation.status).toBe('PASSED');
      expect(evaluation.checks).toHaveLength(4);

      // Verify all 4 rubric checks
      const repoCheck = evaluation.checks.find((c) => c.name.includes('GitHub'));
      const liveCheck = evaluation.checks.find((c) => c.name.includes('Live Deployment'));
      const archCheck = evaluation.checks.find((c) => c.name.includes('Architecture'));
      const docCheck = evaluation.checks.find((c) => c.name.includes('Documentation'));

      expect(repoCheck?.score).toBe(25);
      expect(liveCheck?.score).toBe(25);
      expect(archCheck?.score).toBeGreaterThan(15);
      expect(docCheck?.score).toBeGreaterThan(20);
      expect(evaluation.strengths.length).toBeGreaterThan(0);
    });

    it('penalizes when GitHub URL is invalid or missing when required', () => {
      const evaluation = evaluateProjectSubmission(
        'https://invalid-url.com/not-github',
        'https://project.vercel.app',
        'Brief note with React and MongoDB',
        mockLesson
      );

      const repoCheck = evaluation.checks.find((c) => c.name.includes('GitHub'));
      expect(repoCheck?.score).toBeLessThanOrEqual(5);
      expect(evaluation.improvements.length).toBeGreaterThan(0);
    });

    it('penalizes when live deployment URL is missing or insecure (HTTP)', () => {
      const evaluation = evaluateProjectSubmission(
        'https://github.com/developer/project',
        'http://insecure-site.com',
        'Brief description',
        mockLesson
      );

      const liveCheck = evaluation.checks.find((c) => c.name.includes('Live Deployment'));
      expect(liveCheck?.score).toBeLessThan(25);
    });

    it('fails evaluation when overall score is below passMarks', () => {
      const evaluation = evaluateProjectSubmission(
        'not-a-repo',
        '',
        'too short',
        mockLesson
      );

      expect(evaluation.overallScore).toBeLessThan(mockLesson.passMarks);
      expect(evaluation.status).toBe('FAILED');
    });
  });

  describe('submitProjectAndEvaluateAction (Server Action)', () => {
    it('prevents submission if student is not authenticated', async () => {
      (auth as any).mockResolvedValue(null);

      const result = await submitProjectAndEvaluateAction({
        courseId: 'c1',
        lessonId: 'l1',
        githubUrl: 'https://github.com/user/repo',
      });

      expect(result.error).toBe('Please log in to submit your project.');
    });

    it('evaluates and saves project submission, updates progress if passed', async () => {
      (auth as any).mockResolvedValue({
        user: { id: 'student123', role: 'STUDENT' },
      });

      (Enrollment.findOne as any).mockResolvedValue({
        userId: 'student123',
        courseId: 'c1',
        status: 'ACTIVE',
      });

      (Lesson.findById as any).mockResolvedValue({
        _id: 'l1',
        moduleId: 'm1',
        title: 'Final Capstone Project',
        projectDeliverables: 'React, Node, Express, MongoDB',
        passMarks: 60,
        maxMarks: 100,
        githubRequired: true,
        liveUrlRequired: false,
      });

      (ProjectSubmission.findOneAndUpdate as any).mockResolvedValue({
        _id: 'sub123',
        score: 85,
        status: 'PASSED',
      });

      const result = await submitProjectAndEvaluateAction({
        courseId: 'c1',
        lessonId: 'l1',
        githubUrl: 'https://github.com/student/mern-capstone',
        liveUrl: 'https://mern-capstone.vercel.app',
        description: 'Complete capstone project built with React, Node, Express, MongoDB and JWT authentication.',
      });

      expect(result.success).toBe(true);
      expect(result.evaluation?.status).toBe('PASSED');
      expect(LessonProgress.findOneAndUpdate).toHaveBeenCalled();
      expect(Notification.create).toHaveBeenCalled();
    });
  });

  describe('Instructor Actions', () => {
    it('blocks non-instructor users from accessing submissions', async () => {
      (auth as any).mockResolvedValue({
        user: { id: 'student1', role: 'STUDENT' },
      });

      const res = await getCourseProjectSubmissionsAction('c1');
      expect(res.error).toBe('Unauthorized. Instructors only.');
    });

    it('allows instructors to grade and override submission scores', async () => {
      (auth as any).mockResolvedValue({
        user: { id: 'inst1', role: 'INSTRUCTOR' },
      });

      const mockSubmission: any = {
        _id: 'sub123',
        studentId: 'stud1',
        courseId: 'c1',
        lessonId: 'l1',
        passMarks: 60,
        score: 70,
        status: 'PASSED',
        save: vi.fn().mockResolvedValue(true),
      };

      (ProjectSubmission.findById as any).mockResolvedValue(mockSubmission);

      const res = await gradeProjectSubmissionAction('sub123', 95, 'Outstanding architecture and code style!');

      expect(res.success).toBe(true);
      expect(mockSubmission.instructorScore).toBe(95);
      expect(mockSubmission.status).toBe('PASSED');
      expect(mockSubmission.save).toHaveBeenCalled();
    });
  });
});
