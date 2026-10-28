import { beforeEach, expect, it, vi } from 'vitest';
import { Types } from 'mongoose';
import { getAssessmentViewer } from '@/lib/assessment-access';
import { getAssessmentCreationContextAction, requestGlobalAssessmentPermissionAction, reviewGlobalAssessmentApplicationAction, searchAssessmentStudentsAction, assignAssessmentCourseInstructorAction } from '@/actions/assessment-management';
import Permission from '@/models/GlobalAssessmentPermission';
import Course from '@/models/Course';
import User from '@/models/User';
vi.mock('@/lib/assessment-access', () => ({ getAssessmentViewer: vi.fn() }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('@/models/GlobalAssessmentPermission', () => ({ default: { findOne: vi.fn(), findOneAndUpdate: vi.fn(), exists: vi.fn() } }));
vi.mock('@/models/Course', () => ({ default: { find: vi.fn(), updateOne: vi.fn() } }));
vi.mock('@/models/User', () => ({ default: { find: vi.fn(), findOne: vi.fn() } }));
const id = '507f1f77bcf86cd799439001';
beforeEach(() => { vi.clearAllMocks(); vi.mocked(getAssessmentViewer).mockResolvedValue({ id, role: 'INSTRUCTOR' }); vi.mocked(Permission.findOne).mockReturnValue({ lean: async () => null } as any); });
it('submits an application as pending without granting itself approval', async () => {
  expect(await requestGlobalAssessmentPermissionAction('EXAM', 'I plan to host an inter-school mathematics assessment.')).toEqual({ success: true });
  expect(Permission.findOneAndUpdate).toHaveBeenCalledWith(expect.objectContaining({ instructorId: id, kind: 'EXAM' }), expect.objectContaining({ $set: expect.objectContaining({ status: 'PENDING' }) }), expect.anything());
});
it('prevents duplicate pending requests', async () => {
  vi.mocked(Permission.findOne).mockReturnValue({ lean: async () => ({ status: 'PENDING' }) } as any);
  expect(await requestGlobalAssessmentPermissionAction('CONTEST', 'An educational contest for university learners.')).toHaveProperty('error');
  expect(Permission.findOneAndUpdate).not.toHaveBeenCalled();
});
it.each(['STUDENT', 'ADMIN', 'INSTRUCTOR'])('prevents %s from reviewing a global application', async (role) => {
  vi.mocked(getAssessmentViewer).mockResolvedValue({ id, role });
  expect(await reviewGlobalAssessmentApplicationAction(id, 'APPROVED', '')).toHaveProperty('error');
  expect(Permission.findOneAndUpdate).not.toHaveBeenCalled();
});
it('requires rejection feedback and only changes pending applications', async () => {
  vi.mocked(getAssessmentViewer).mockResolvedValue({ id, role: 'SUPERADMIN' });
  expect(await reviewGlobalAssessmentApplicationAction(id, 'REJECTED', '')).toHaveProperty('error');
  vi.mocked(Permission.findOneAndUpdate).mockResolvedValue({ _id: id });
  expect(await reviewGlobalAssessmentApplicationAction(id, 'APPROVED', 'Teaching plan verified.')).toEqual({ success: true });
  expect(Permission.findOneAndUpdate).toHaveBeenCalledWith({ _id: id, status: 'PENDING' }, expect.objectContaining({ $set: expect.objectContaining({ reviewedBy: id, status: 'APPROVED' }) }), expect.anything());
});
it('lists draft and assigned courses without a published-only restriction', async () => {
  vi.mocked(Course.find).mockReturnValue({ select: () => ({ sort: () => ({ lean: async () => [{ _id: id, title: 'My draft', status: 'DRAFT' }] }) }) } as any);
  const result = await getAssessmentCreationContextAction('EXAM');
  expect(result.courses).toContainEqual({ id, title: 'My draft', status: 'DRAFT' });
  expect(Course.find).toHaveBeenCalledWith({ $or: [{ createdById: id }, { instructorUserIds: id }] });
  expect(result.canCreateGlobal).toBe(false);
});
it('requires global approval before student search', async () => {
  vi.mocked(Permission.exists).mockResolvedValue(null);
  expect(await searchAssessmentStudentsAction('Alex', 'EXAM')).toEqual({ students: [] });
  expect(User.find).not.toHaveBeenCalled();
});
it('escapes search patterns instead of accepting regular expressions', async () => {
  vi.mocked(Permission.exists).mockResolvedValue({ _id: new Types.ObjectId(id) });
  vi.mocked(User.find).mockReturnValue({ select: () => ({ limit: () => ({ lean: async () => [] }) }) } as any);
  await searchAssessmentStudentsAction('.*', 'EXAM');
  expect(User.find).toHaveBeenCalledWith(expect.objectContaining({ name: { $regex: '\\.\\*', $options: 'i' } }));
});
it('does not let an instructor assign themselves to another course', async () => {
  expect(await assignAssessmentCourseInstructorAction(id, 'teacher@example.test')).toHaveProperty('error');
  expect(Course.updateOne).not.toHaveBeenCalled();
});
