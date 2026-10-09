import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createUser,
  editUser,
  createCourseByAdmin,
  updateCourseByAdmin,
  deleteCourseByAdmin,
} from '@/actions/admin';

// Mock auth
vi.mock('@/auth', () => ({
  auth: vi.fn().mockResolvedValue({ user: { id: 'superadmin-1', role: 'SUPERADMIN' } }),
}));

// Mock dbConnect
vi.mock('@/lib/mongoose', () => ({
  default: vi.fn().mockResolvedValue(undefined),
}));

// Mock AuditLog
vi.mock('@/models/AuditLog', () => ({
  default: {
    create: vi.fn().mockResolvedValue(undefined),
  },
}));

// Mock cache
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

// Mock User
const mockUserFindOne = vi.fn();
const mockUserCreate = vi.fn();
const mockUserFindById = vi.fn();
const mockUserFindByIdAndDelete = vi.fn();
vi.mock('@/models/User', () => ({
  default: {
    findOne: (...args: any[]) => mockUserFindOne(...args),
    create: (...args: any[]) => mockUserCreate(...args),
    findById: (...args: any[]) => mockUserFindById(...args),
    findByIdAndDelete: (...args: any[]) => mockUserFindByIdAndDelete(...args),
  },
}));

// Mock Course
const mockCourseFindById = vi.fn();
const mockCourseCreate = vi.fn();
const mockCourseFindByIdAndDelete = vi.fn();
vi.mock('@/models/Course', () => ({
  default: {
    findById: (...args: any[]) => mockCourseFindById(...args),
    create: (...args: any[]) => mockCourseCreate(...args),
    findByIdAndDelete: (...args: any[]) => mockCourseFindByIdAndDelete(...args),
  },
}));

// Mock Module
const mockModuleFind = vi.fn();
const mockModuleCreate = vi.fn();
const mockModuleDeleteMany = vi.fn();
vi.mock('@/models/Module', () => ({
  default: {
    find: (...args: any[]) => mockModuleFind(...args),
    create: (...args: any[]) => mockModuleCreate(...args),
    deleteMany: (...args: any[]) => mockModuleDeleteMany(...args),
  },
}));

// Mock Lesson
const mockLessonCreate = vi.fn();
const mockLessonDeleteMany = vi.fn();
vi.mock('@/models/Lesson', () => ({
  default: {
    create: (...args: any[]) => mockLessonCreate(...args),
    deleteMany: (...args: any[]) => mockLessonDeleteMany(...args),
  },
}));

// Mock Enrollment
const mockEnrollmentDeleteMany = vi.fn();
vi.mock('@/models/Enrollment', () => ({
  default: {
    deleteMany: (...args: any[]) => mockEnrollmentDeleteMany(...args),
  },
}));

// Mock Instructor
const mockInstructorFindOne = vi.fn();
const mockInstructorCreate = vi.fn();
vi.mock('@/models/Instructor', () => ({
  default: {
    findOne: (...args: any[]) => mockInstructorFindOne(...args),
    create: (...args: any[]) => mockInstructorCreate(...args),
    deleteOne: vi.fn().mockResolvedValue(undefined),
  },
}));

describe('Superadmin User & Course Management Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createUser', () => {
    it('creates a new student successfully', async () => {
      mockUserFindOne.mockResolvedValueOnce(null); // No existing email
      mockUserCreate.mockResolvedValueOnce({
        _id: 'new-user-123',
        name: 'New Student',
        email: 'student@example.com',
        role: 'STUDENT',
        status: 'APPROVED',
      });

      const res = await createUser({
        name: 'New Student',
        email: 'student@example.com',
        role: 'STUDENT',
      });

      expect(res.success).toBe(true);
      expect(res.user?.name).toBe('New Student');
      expect(mockUserCreate).toHaveBeenCalled();
    });

    it('creates an instructor and registers Instructor document', async () => {
      mockUserFindOne.mockResolvedValueOnce(null);
      mockUserCreate.mockResolvedValueOnce({
        _id: 'instructor-123',
        name: 'Jane Instructor',
        email: 'jane@example.com',
        role: 'INSTRUCTOR',
        status: 'APPROVED',
      });
      mockInstructorFindOne.mockResolvedValueOnce(null);
      mockInstructorCreate.mockResolvedValueOnce({ _id: 'ins-doc-1' });

      const res = await createUser({
        name: 'Jane Instructor',
        email: 'jane@example.com',
        role: 'INSTRUCTOR',
      });

      expect(res.success).toBe(true);
      expect(mockInstructorCreate).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Jane Instructor' })
      );
    });

    it('rejects duplicate email', async () => {
      mockUserFindOne.mockResolvedValueOnce({ _id: 'existing-id', email: 'taken@example.com' });

      const res = await createUser({
        name: 'Duplicate',
        email: 'taken@example.com',
        role: 'STUDENT',
      });

      expect(res.success).toBe(false);
      expect(res.error).toContain('already exists');
    });
  });

  describe('editUser', () => {
    it('updates user properties successfully', async () => {
      const mockSave = vi.fn().mockResolvedValue(undefined);
      mockUserFindById.mockResolvedValueOnce({
        _id: 'user-to-edit',
        name: 'Old Name',
        email: 'old@example.com',
        role: 'STUDENT',
        status: 'PENDING',
        save: mockSave,
      });

      const res = await editUser('user-to-edit', {
        name: 'Updated Name',
        status: 'APPROVED',
      });

      expect(res.success).toBe(true);
      expect(mockSave).toHaveBeenCalled();
    });
  });

  describe('createCourseByAdmin', () => {
    it('creates a course and initial module/lesson', async () => {
      mockInstructorFindOne.mockResolvedValueOnce({ _id: 'inst-1', name: 'Dr. Expert' });
      mockCourseCreate.mockResolvedValueOnce({
        _id: 'course-123',
        title: 'New Admin Course',
        category: 'web-dev',
        price: 2000,
      });
      mockModuleCreate.mockResolvedValueOnce({ _id: 'mod-1' });
      mockLessonCreate.mockResolvedValueOnce({ _id: 'les-1' });

      const res = await createCourseByAdmin({
        title: 'New Admin Course',
        description: 'Detailed description',
        category: 'web-dev',
        price: 2000,
        instructorName: 'Dr. Expert',
      });

      expect(res.success).toBe(true);
      expect(res.courseId).toBe('course-123');
      expect(mockCourseCreate).toHaveBeenCalled();
      expect(mockModuleCreate).toHaveBeenCalled();
      expect(mockLessonCreate).toHaveBeenCalled();
    });
  });

  describe('updateCourseByAdmin', () => {
    it('updates course details', async () => {
      const mockSave = vi.fn().mockResolvedValue(undefined);
      mockCourseFindById.mockResolvedValueOnce({
        _id: 'course-to-update',
        title: 'Old Title',
        price: 1500,
        save: mockSave,
      });

      const res = await updateCourseByAdmin('course-to-update', {
        title: 'Updated Title',
        price: 2500,
      });

      expect(res.success).toBe(true);
      expect(mockSave).toHaveBeenCalled();
    });
  });

  describe('deleteCourseByAdmin', () => {
    it('deletes course and associated modules, lessons, enrollments', async () => {
      mockCourseFindById.mockResolvedValueOnce({
        _id: 'course-to-delete',
        title: 'Delete Me',
      });
      mockModuleFind.mockResolvedValueOnce([{ _id: 'mod-1' }]);
      mockLessonDeleteMany.mockResolvedValueOnce({ deletedCount: 1 });
      mockModuleDeleteMany.mockResolvedValueOnce({ deletedCount: 1 });
      mockEnrollmentDeleteMany.mockResolvedValueOnce({ deletedCount: 1 });
      mockCourseFindByIdAndDelete.mockResolvedValueOnce({ _id: 'course-to-delete' });

      const res = await deleteCourseByAdmin('course-to-delete');

      expect(res.success).toBe(true);
      expect(mockLessonDeleteMany).toHaveBeenCalled();
      expect(mockModuleDeleteMany).toHaveBeenCalled();
      expect(mockEnrollmentDeleteMany).toHaveBeenCalled();
      expect(mockCourseFindByIdAndDelete).toHaveBeenCalledWith('course-to-delete');
    });
  });
});
