import { beforeEach, expect, it, vi } from 'vitest';
import { auth } from '@/auth';
import User from '@/models/User';
import { updateStudentProfileAction } from '@/actions/student-actions';
vi.mock('@/lib/mongoose', () => ({ default: vi.fn() }));
vi.mock('@/models/User', () => ({ default: { findOneAndUpdate: vi.fn() } }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
const id = '507f1f77bcf86cd799439001';
beforeEach(() => { vi.clearAllMocks(); vi.mocked(auth).mockResolvedValue({ user: { id, role: 'STUDENT' } } as any); });
it('saves the current student education level and department', async () => {
  expect(await updateStudentProfileAction({ educationLevel: 'SCHOOL', department: ' Science ' })).toMatchObject({ success: true });
  expect(User.findOneAndUpdate).toHaveBeenCalledWith({ _id: id }, expect.objectContaining({ $set: { educationLevel: 'SCHOOL', department: 'Science' } }));
});
it('rejects unsupported education levels and oversized departments', async () => {
  expect(await updateStudentProfileAction({ educationLevel: 'FAKE' })).toHaveProperty('error');
  expect(await updateStudentProfileAction({ department: 'x'.repeat(101) })).toHaveProperty('error');
  expect(User.findOneAndUpdate).not.toHaveBeenCalled();
});
it('can clear a previously selected education level without inventing a university default', async () => {
  await updateStudentProfileAction({ educationLevel: '' });
  expect(User.findOneAndUpdate).toHaveBeenCalledWith({ _id: id }, expect.objectContaining({ $unset: { educationLevel: 1 } }));
});
