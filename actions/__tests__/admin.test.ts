import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  updateUserStatus,
  updateUserRole,
  approveCourse,
  rejectCourse,
  toggleUserSuspend,
  reviewInstructorRequest,
  reviewCourse,
} from '../admin';

// Mock the Mongoose connection
vi.mock('@/lib/mongoose', () => ({
  default: vi.fn().mockResolvedValue(undefined),
}));

// Mock Next.js cache
const mockRevalidatePath = vi.fn();
vi.mock('next/cache', () => ({
  revalidatePath: (...args: any[]) => mockRevalidatePath(...args),
}));

// Mock Models
const mockUserFindByIdAndUpdate = vi.fn();
vi.mock('@/models/User', () => ({
  default: {
    findByIdAndUpdate: (...args: any[]) => mockUserFindByIdAndUpdate(...args),
  },
}));

const mockCourseFindByIdAndUpdate = vi.fn();
vi.mock('@/models/Course', () => ({
  default: {
    findByIdAndUpdate: (...args: any[]) => mockCourseFindByIdAndUpdate(...args),
  },
}));

const mockInstructorRequestFindById = vi.fn();
const mockInstructorRequestFindByIdAndUpdate = vi.fn();
vi.mock('@/models/InstructorRequest', () => ({
  default: {
    findById: (...args: any[]) => mockInstructorRequestFindById(...args),
    findByIdAndUpdate: (...args: any[]) => mockInstructorRequestFindByIdAndUpdate(...args),
  },
}));

describe('Admin Server Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('updateUserStatus', () => {
    it('should successfully update user status', async () => {
      mockUserFindByIdAndUpdate.mockResolvedValueOnce({ _id: '1', status: 'APPROVED' });

      const result = await updateUserStatus('1', 'APPROVED');

      expect(mockUserFindByIdAndUpdate).toHaveBeenCalledWith('1', { status: 'APPROVED' });
      expect(mockRevalidatePath).toHaveBeenCalledWith('/admin');
      expect(mockRevalidatePath).toHaveBeenCalledWith('/admin/dashboard');
      expect(result).toEqual({ success: true });
    });

    it('should handle errors gracefully', async () => {
      mockUserFindByIdAndUpdate.mockRejectedValueOnce(new Error('DB Error'));

      const result = await updateUserStatus('1', 'APPROVED');

      expect(result).toEqual({ success: false, error: 'Failed to update user status' });
    });
  });

  describe('updateUserRole', () => {
    it('should successfully update user role', async () => {
      mockUserFindByIdAndUpdate.mockResolvedValueOnce({ _id: '1', role: 'ADMIN' });

      const result = await updateUserRole('1', 'ADMIN');

      expect(mockUserFindByIdAndUpdate).toHaveBeenCalledWith('1', { role: 'ADMIN' });
      expect(mockRevalidatePath).toHaveBeenCalledWith('/admin');
      expect(mockRevalidatePath).toHaveBeenCalledWith('/admin/dashboard');
      expect(result).toEqual({ success: true });
    });

    it('should handle errors gracefully', async () => {
      mockUserFindByIdAndUpdate.mockRejectedValueOnce(new Error('DB Error'));

      const result = await updateUserRole('1', 'ADMIN');

      expect(result).toEqual({ success: false, error: 'Failed to update user role' });
    });
  });

  describe('approveCourse', () => {
    it('should successfully approve a course', async () => {
      mockCourseFindByIdAndUpdate.mockResolvedValueOnce({ _id: '1' });

      const result = await approveCourse('1');

      expect(mockCourseFindByIdAndUpdate).toHaveBeenCalledWith('1', {
        status: 'PUBLISHED',
        approvalStatus: 'APPROVED',
        rejectionReason: null,
      });
      expect(mockRevalidatePath).toHaveBeenCalledWith('/admin');
      expect(result).toEqual({ success: true });
    });

    it('should handle errors gracefully', async () => {
      mockCourseFindByIdAndUpdate.mockRejectedValueOnce(new Error('DB Error'));

      const result = await approveCourse('1');

      expect(result).toEqual({ success: false, error: 'Failed to approve course' });
    });
  });

  describe('rejectCourse', () => {
    it('should successfully reject a course', async () => {
      mockCourseFindByIdAndUpdate.mockResolvedValueOnce({ _id: '1' });

      const result = await rejectCourse('1', 'Incomplete content');

      expect(mockCourseFindByIdAndUpdate).toHaveBeenCalledWith('1', {
        status: 'REJECTED',
        approvalStatus: 'REJECTED',
        rejectionReason: 'Incomplete content',
      });
      expect(mockRevalidatePath).toHaveBeenCalledWith('/admin');
      expect(result).toEqual({ success: true });
    });
  });

  describe('toggleUserSuspend', () => {
    it('should successfully suspend an active user', async () => {
      mockUserFindByIdAndUpdate.mockResolvedValueOnce({ _id: '1' });

      const result = await toggleUserSuspend('1', 'APPROVED');

      expect(mockUserFindByIdAndUpdate).toHaveBeenCalledWith('1', { status: 'SUSPENDED' });
      expect(mockRevalidatePath).toHaveBeenCalledWith('/admin');
      expect(result).toEqual({ success: true });
    });

    it('should successfully approve a suspended user', async () => {
      mockUserFindByIdAndUpdate.mockResolvedValueOnce({ _id: '1' });

      const result = await toggleUserSuspend('1', 'SUSPENDED');

      expect(mockUserFindByIdAndUpdate).toHaveBeenCalledWith('1', { status: 'APPROVED' });
      expect(mockRevalidatePath).toHaveBeenCalledWith('/admin');
      expect(result).toEqual({ success: true });
    });
  });

  describe('reviewInstructorRequest', () => {
    it('should successfully approve an instructor request and update user role', async () => {
      mockInstructorRequestFindById.mockResolvedValueOnce({ _id: 'req1', userId: 'user1' });
      mockInstructorRequestFindByIdAndUpdate.mockResolvedValueOnce({});
      mockUserFindByIdAndUpdate.mockResolvedValueOnce({});

      const result = await reviewInstructorRequest('req1', 'APPROVE');

      expect(mockInstructorRequestFindByIdAndUpdate).toHaveBeenCalledWith('req1', expect.objectContaining({ status: 'APPROVED' }));
      expect(mockUserFindByIdAndUpdate).toHaveBeenCalledWith('user1', { role: 'INSTRUCTOR' });
      expect(mockRevalidatePath).toHaveBeenCalledWith('/admin');
      expect(result).toEqual({ success: true });
    });

    it('should successfully reject an instructor request without updating user role', async () => {
      mockInstructorRequestFindById.mockResolvedValueOnce({ _id: 'req1', userId: 'user1' });
      mockInstructorRequestFindByIdAndUpdate.mockResolvedValueOnce({});

      const result = await reviewInstructorRequest('req1', 'REJECT');

      expect(mockInstructorRequestFindByIdAndUpdate).toHaveBeenCalledWith('req1', expect.objectContaining({ status: 'REJECTED' }));
      expect(mockUserFindByIdAndUpdate).not.toHaveBeenCalled();
      expect(mockRevalidatePath).toHaveBeenCalledWith('/admin');
      expect(result).toEqual({ success: true });
    });

    it('should return error if request is not found', async () => {
      mockInstructorRequestFindById.mockResolvedValueOnce(null);

      const result = await reviewInstructorRequest('req1', 'APPROVE');

      expect(result).toEqual({ success: false, error: 'Request not found' });
    });
  });

  describe('reviewCourse', () => {
    it('should successfully approve a course', async () => {
      mockCourseFindByIdAndUpdate.mockResolvedValueOnce({});

      const result = await reviewCourse('1', 'APPROVE');

      expect(mockCourseFindByIdAndUpdate).toHaveBeenCalledWith('1', { approvalStatus: 'APPROVED', status: 'PUBLISHED' });
      expect(mockRevalidatePath).toHaveBeenCalledWith('/admin');
      expect(result).toEqual({ success: true });
    });

    it('should successfully reject a course', async () => {
      mockCourseFindByIdAndUpdate.mockResolvedValueOnce({});

      const result = await reviewCourse('1', 'REJECT');

      expect(mockCourseFindByIdAndUpdate).toHaveBeenCalledWith('1', { approvalStatus: 'REJECTED', status: 'REJECTED' });
      expect(mockRevalidatePath).toHaveBeenCalledWith('/admin');
      expect(result).toEqual({ success: true });
    });
  });
});
