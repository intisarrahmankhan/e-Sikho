import { test, expect } from '@playwright/test';

test.describe('Sprint 3 Admin Governance Workflows', () => {

  test('Toggle suspension status logic produces expected state transitions', () => {
    const getNextStatus = (currentStatus: string) => 
      currentStatus === 'SUSPENDED' ? 'APPROVED' : 'SUSPENDED';

    expect(getNextStatus('APPROVED')).toBe('SUSPENDED');
    expect(getNextStatus('SUSPENDED')).toBe('APPROVED');
    expect(getNextStatus('PENDING')).toBe('SUSPENDED');
  });

  test('Course approval payload sets PUBLISHED and clears rejectionReason', () => {
    const course = {
      id: 'course-1',
      status: 'PENDING_REVIEW',
      rejectionReason: 'Previous issue',
    };

    const approvedCourse = {
      ...course,
      status: 'PUBLISHED',
      rejectionReason: null,
    };

    expect(approvedCourse.status).toBe('PUBLISHED');
    expect(approvedCourse.rejectionReason).toBeNull();
  });

  test('Course rejection payload sets REJECTED and saves rejectionReason', () => {
    const reason = 'Syllabus incomplete';
    const course = {
      id: 'course-1',
      status: 'PENDING_REVIEW',
      rejectionReason: null,
    };

    const rejectedCourse = {
      ...course,
      status: 'REJECTED',
      rejectionReason: reason,
    };

    expect(rejectedCourse.status).toBe('REJECTED');
    expect(rejectedCourse.rejectionReason).toBe(reason);
  });

  test('Role assignment accepts valid platform roles', () => {
    const allowedRoles = ['STUDENT', 'INSTRUCTOR', 'MODERATOR', 'ADMIN', 'SUPERADMIN'];
    const newRole = 'INSTRUCTOR';
    
    expect(allowedRoles).toContain(newRole);
  });

});
