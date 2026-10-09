import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  assignCourseToStudent,
  removeCourseFromStudent,
  blockUser,
  unblockUser,
  deleteUser,
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
const mockUserFindById = vi.fn();
const mockUserFindByIdAndDelete = vi.fn();
vi.mock('@/models/User', () => ({
  default: {
    findById: (...args: any[]) => mockUserFindById(...args),
    findByIdAndDelete: (...args: any[]) => mockUserFindByIdAndDelete(...args),
  },
}));

// Mock Enrollment
const mockEnrollmentFindOne = vi.fn();
const mockEnrollmentFindOneAndUpdate = vi.fn();
const mockEnrollmentFindOneAndDelete = vi.fn();
const mockEnrollmentDeleteMany = vi.fn();
vi.mock('@/models/Enrollment', () => ({
  default: {
    findOne: (...args: any[]) => mockEnrollmentFindOne(...args),
    findOneAndUpdate: (...args: any[]) => mockEnrollmentFindOneAndUpdate(...args),
    findOneAndDelete: (...args: any[]) => mockEnrollmentFindOneAndDelete(...args),
    deleteMany: (...args: any[]) => mockEnrollmentDeleteMany(...args),
  },
}));

// Mock Course
const mockCourseFindById = vi.fn();
const mockCourseFindByIdAndUpdate = vi.fn();
vi.mock('@/models/Course', () => ({
  default: {
    findById: (...args: any[]) => mockCourseFindById(...args),
    findByIdAndUpdate: (...args: any[]) => mockCourseFindByIdAndUpdate(...args),
  },
}));

// Mock Instructor & InstructorRequest
vi.mock('@/models/Instructor', () => ({
  default: {
    deleteOne: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('@/models/InstructorRequest', () => ({
  default: {
    deleteMany: vi.fn().mockResolvedValue(undefined),
  },
}));

describe('Superadmin Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('assignCourseToStudent', () => {
    it('successfully assigns a course to a student when not already enrolled', async () => {
      mockUserFindById.mockResolvedValueOnce({
        _id: 'student-123',
        name: 'John Student',
        email: 'john@example.com',
      });
      mockEnrollmentFindOne.mockResolvedValueOnce(null); // not enrolled yet
      mockEnrollmentFindOneAndUpdate.mockResolvedValueOnce({ _id: 'enrollment-1' });

      // assign static course 'fullstack-nextjs'
      const res = await assignCourseToStudent('student-123', 'fullstack-nextjs');

      expect(res.success).toBe(true);
      expect(res.message).toContain('John Student');
      expect(mockEnrollmentFindOneAndUpdate).toHaveBeenCalledWith(
        { userId: 'student-123', courseId: 'fullstack-nextjs' },
        expect.objectContaining({ paymentStatus: 'GRANTED' }),
        expect.any(Object)
      );
    });

    it('rejects assignment if student is already enrolled', async () => {
      mockUserFindById.mockResolvedValueOnce({
        _id: 'student-123',
        name: 'John Student',
        email: 'john@example.com',
      });
      mockEnrollmentFindOne.mockResolvedValueOnce({ _id: 'existing-enrollment' });

      const res = await assignCourseToStudent('student-123', 'fullstack-nextjs');

      expect(res.success).toBe(false);
      expect(res.error).toContain('already enrolled');
    });
  });

  describe('removeCourseFromStudent', () => {
    it('successfully revokes course enrollment', async () => {
      mockEnrollmentFindOneAndDelete.mockResolvedValueOnce({ _id: 'enrollment-1' });

      const res = await removeCourseFromStudent('student-123', 'fullstack-nextjs');

      expect(res.success).toBe(true);
      expect(mockEnrollmentFindOneAndDelete).toHaveBeenCalledWith({
        userId: 'student-123',
        courseId: 'fullstack-nextjs',
      });
    });
  });

  describe('blockUser & unblockUser', () => {
    it('blocks a user successfully', async () => {
      const mockSave = vi.fn().mockResolvedValue(undefined);
      mockUserFindById.mockResolvedValueOnce({
        _id: 'user-to-block',
        name: 'Bad Actor',
        role: 'STUDENT',
        status: 'APPROVED',
        save: mockSave,
      });

      const res = await blockUser('user-to-block', 'Terms violation');

      expect(res.success).toBe(true);
      expect(mockSave).toHaveBeenCalled();
    });

    it('prevents blocking a superadmin account', async () => {
      mockUserFindById.mockResolvedValueOnce({
        _id: 'other-superadmin',
        name: 'Chief Admin',
        role: 'SUPERADMIN',
      });

      const res = await blockUser('other-superadmin');

      expect(res.success).toBe(false);
      expect(res.error).toContain('Cannot block a Superadmin');
    });

    it('unblocks a user successfully', async () => {
      const mockSave = vi.fn().mockResolvedValue(undefined);
      mockUserFindById.mockResolvedValueOnce({
        _id: 'user-to-unblock',
        name: 'Reformed User',
        role: 'STUDENT',
        status: 'BLOCKED',
        save: mockSave,
      });

      const res = await unblockUser('user-to-unblock');

      expect(res.success).toBe(true);
      expect(mockSave).toHaveBeenCalled();
    });
  });

  describe('deleteUser', () => {
    it('permanently removes student account and their enrollments', async () => {
      mockUserFindById.mockResolvedValueOnce({
        _id: 'student-to-delete',
        name: 'Student To Delete',
        email: 'delete_me@example.com',
        role: 'STUDENT',
      });
      mockUserFindByIdAndDelete.mockResolvedValueOnce({ _id: 'student-to-delete' });

      const res = await deleteUser('student-to-delete');

      expect(res.success).toBe(true);
      expect(mockEnrollmentDeleteMany).toHaveBeenCalledWith({ userId: 'student-to-delete' });
      expect(mockUserFindByIdAndDelete).toHaveBeenCalledWith('student-to-delete');
    });

    it('prevents deleting another superadmin', async () => {
      mockUserFindById.mockResolvedValueOnce({
        _id: 'super-to-delete',
        name: 'Super',
        role: 'SUPERADMIN',
      });

      const res = await deleteUser('super-to-delete');

      expect(res.success).toBe(false);
      expect(res.error).toContain('Cannot delete a Superadmin');
    });
  });
});
