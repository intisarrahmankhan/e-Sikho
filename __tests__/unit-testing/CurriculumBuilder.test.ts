import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  addCourseModule,
  addCourseLecture,
  updateCourseLecture,
  deleteCourseLecture,
  getCourseCurriculum,
  getCourseQuizzes,
} from '@/actions/instructor';
import { auth } from '@/auth';
import Course from '@/models/Course';
import Module from '@/models/Module';
import Lesson from '@/models/Lesson';
import Exam from '@/models/Exam';

// Mock auth
vi.mock('@/auth', () => ({
  auth: vi.fn(),
}));

// Mock Mongoose models and dbConnect
vi.mock('@/lib/mongoose', () => ({
  default: vi.fn().mockResolvedValue(true),
}));

vi.mock('@/models/Course', () => ({
  default: {
    findById: vi.fn(),
    findByIdAndUpdate: vi.fn(),
    countDocuments: vi.fn(),
  },
}));

vi.mock('@/models/Module', () => ({
  default: {
    create: vi.fn(),
    find: vi.fn(),
    findOne: vi.fn(),
    countDocuments: vi.fn(),
  },
}));

vi.mock('@/models/Lesson', () => ({
  default: {
    create: vi.fn(),
    find: vi.fn(),
    findById: vi.fn(),
    findByIdAndDelete: vi.fn(),
    countDocuments: vi.fn(),
  },
}));

vi.mock('@/models/Exam', () => ({
  default: {
    find: vi.fn(),
  },
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

describe('Curriculum Builder & Lecture Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('addCourseModule', () => {
    it('rejects unauthorized users or non-instructors', async () => {
      vi.mocked(auth).mockResolvedValueOnce(null as any);
      const res = await addCourseModule('course-1', 'Module 1');
      expect(res.error).toContain('Unauthorized');
    });

    it('creates a new module for authorized instructors', async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: 'inst-1', role: 'INSTRUCTOR' },
      } as any);

      vi.mocked(Course.findById).mockResolvedValueOnce({
        _id: 'course-1',
        title: 'Fullstack Next.js',
      } as any);

      vi.mocked(Module.countDocuments).mockResolvedValueOnce(1);
      vi.mocked(Module.create).mockResolvedValueOnce({
        _id: 'mod-2',
        title: 'Module 2: Advanced APIs',
        duration: '2 hours',
        order: 1,
        courseId: 'course-1',
      } as any);

      const res = await addCourseModule('course-1', 'Module 2: Advanced APIs', '2 hours');
      expect(res.success).toBe(true);
      expect(res.module?.title).toBe('Module 2: Advanced APIs');
    });
  });

  describe('addCourseLecture', () => {
    it('creates a video lecture with optional PDF attachment', async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: 'inst-1', role: 'INSTRUCTOR' },
      } as any);

      vi.mocked(Course.findById).mockResolvedValueOnce({
        _id: 'course-1',
        totalLessons: 0,
        save: vi.fn().mockResolvedValue(true),
      } as any);

      vi.mocked(Lesson.countDocuments).mockResolvedValue(2);
      vi.mocked(Module.find).mockReturnValue({
        select: vi.fn().mockResolvedValue([{ _id: 'mod-1' }]),
      } as any);

      vi.mocked(Lesson.create).mockResolvedValueOnce({
        _id: 'lesson-1',
        title: '1.1 - Introduction to App Router',
        duration: '15:00',
        isFree: true,
        videoUrl: 'https://youtube.com/watch?v=123',
        pdfUrl: '/uploads/pdfs/sample.pdf',
        pdfName: 'lecture-1-slides.pdf',
        type: 'VIDEO',
      } as any);

      const formData = new FormData();
      formData.append('courseId', 'course-1');
      formData.append('moduleId', 'mod-1');
      formData.append('title', '1.1 - Introduction to App Router');
      formData.append('duration', '15:00');
      formData.append('isFree', 'true');
      formData.append('type', 'VIDEO');
      formData.append('videoUrl', 'https://youtube.com/watch?v=123');
      formData.append('pdfUrl', '/uploads/pdfs/sample.pdf');
      formData.append('pdfName', 'lecture-1-slides.pdf');

      const res = await addCourseLecture(formData);
      expect(res.success).toBe(true);
      expect(res.lesson?.title).toBe('1.1 - Introduction to App Router');
      expect(res.lesson?.pdfUrl).toBe('/uploads/pdfs/sample.pdf');
    });

    it('creates a quiz lesson item linked to an exam', async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: 'inst-1', role: 'INSTRUCTOR' },
      } as any);

      vi.mocked(Course.findById).mockResolvedValueOnce({
        _id: 'course-1',
        totalLessons: 1,
        save: vi.fn().mockResolvedValue(true),
      } as any);

      vi.mocked(Lesson.countDocuments).mockResolvedValue(2);
      vi.mocked(Module.find).mockReturnValue({
        select: vi.fn().mockResolvedValue([{ _id: 'mod-1' }]),
      } as any);

      vi.mocked(Lesson.create).mockResolvedValueOnce({
        _id: 'lesson-quiz-1',
        title: 'Module 1 Assessment Quiz',
        duration: '20 mins',
        isFree: false,
        quizId: 'exam-123',
        type: 'QUIZ',
      } as any);

      const formData = new FormData();
      formData.append('courseId', 'course-1');
      formData.append('moduleId', 'mod-1');
      formData.append('title', 'Module 1 Assessment Quiz');
      formData.append('duration', '20 mins');
      formData.append('type', 'QUIZ');
      formData.append('quizId', 'exam-123');

      const res = await addCourseLecture(formData);
      expect(res.success).toBe(true);
      expect(res.lesson?.quizId).toBe('exam-123');
      expect(res.lesson?.type).toBe('QUIZ');
    });
  });

  describe('updateCourseLecture', () => {
    it('updates lesson title, duration, and pdf notes', async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: 'inst-1', role: 'INSTRUCTOR' },
      } as any);

      const mockLesson = {
        _id: 'lesson-1',
        title: 'Old Title',
        duration: '10:00',
        isFree: false,
        pdfUrl: '',
        pdfName: '',
        save: vi.fn().mockResolvedValue(true),
      };

      vi.mocked(Lesson.findById).mockResolvedValueOnce(mockLesson as any);

      const formData = new FormData();
      formData.append('lessonId', 'lesson-1');
      formData.append('courseId', 'course-1');
      formData.append('title', 'Updated Lecture Title');
      formData.append('duration', '18:00');
      formData.append('isFree', 'true');
      formData.append('pdfUrl', '/uploads/pdfs/new-notes.pdf');
      formData.append('pdfName', 'Updated Notes.pdf');

      const res = await updateCourseLecture(formData);
      expect(res.success).toBe(true);
      expect(mockLesson.title).toBe('Updated Lecture Title');
      expect(mockLesson.duration).toBe('18:00');
      expect(mockLesson.isFree).toBe(true);
    });
  });

  describe('deleteCourseLecture', () => {
    it('deletes lesson and recalibrates course lesson counter', async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: 'inst-1', role: 'INSTRUCTOR' },
      } as any);

      vi.mocked(Lesson.findByIdAndDelete).mockResolvedValueOnce({ _id: 'lesson-1' } as any);
      vi.mocked(Module.find).mockReturnValue({
        select: vi.fn().mockResolvedValue([{ _id: 'mod-1' }]),
      } as any);
      vi.mocked(Lesson.countDocuments).mockResolvedValue(4);

      const res = await deleteCourseLecture('lesson-1', 'course-1');
      expect(res.success).toBe(true);
      expect(Course.findByIdAndUpdate).toHaveBeenCalledWith('course-1', { totalLessons: 4 });
    });
  });

  describe('getCourseCurriculum', () => {
    it('fetches curriculum modules with populated lessons for a course', async () => {
      vi.mocked(Course.findById).mockReturnValue({
        lean: vi.fn().mockResolvedValue({
          _id: '507f1f77bcf86cd799439011',
          title: 'Fullstack Course',
        }),
      } as any);

      const mockLessonsQuery = {
        populate: vi.fn().mockReturnThis(),
        sort: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue([
          {
            _id: 'l-1',
            title: 'Intro Lesson',
            duration: '10:00',
            videoUrl: 'https://yt.com/1',
            pdfUrl: '/slides.pdf',
          },
        ]),
      };

      vi.mocked(Module.find).mockReturnValue({
        sort: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue([
          {
            _id: 'm-1',
            title: 'Module 1',
            duration: '1 hour',
          },
        ]),
      } as any);

      vi.mocked(Lesson.find).mockReturnValue(mockLessonsQuery as any);

      const res = await getCourseCurriculum('507f1f77bcf86cd799439011');
      expect(res.success).toBe(true);
      expect(res.course?.modules.length).toBe(1);
      expect(res.course?.modules[0].lessons.length).toBe(1);
      expect(res.course?.modules[0].lessons[0].title).toBe('Intro Lesson');
    });

    it('falls back to static courses for static IDs like fullstack-nextjs', async () => {
      vi.mocked(Course.findById).mockReturnValue({
        lean: vi.fn().mockResolvedValue(null),
      } as any);

      const res = await getCourseCurriculum('fullstack-nextjs');
      expect(res.success).toBe(true);
      expect(res.course?.title).toBeDefined();
      expect(res.course?.modules.length).toBeGreaterThan(0);
    });
  });

  describe('getCourseQuizzes', () => {
    it('retrieves exam assessments linked to the course', async () => {
      vi.mocked(Exam.find).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue([
          {
            _id: 'exam-1',
            title: 'Midterm Quiz',
            totalMarks: 50,
            duration: 30,
            questions: [{}, {}, {}],
          },
        ]),
      } as any);

      const res = await getCourseQuizzes('course-123');
      expect(res.success).toBe(true);
      expect(res.quizzes?.length).toBe(1);
      expect(res.quizzes?.[0].title).toBe('Midterm Quiz');
      expect(res.quizzes?.[0].questionCount).toBe(3);
    });
  });
});
