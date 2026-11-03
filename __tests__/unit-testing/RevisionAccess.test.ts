import { beforeEach, describe, expect, it, vi } from 'vitest';
import { auth } from '@/auth';
import User from '@/models/User';
import Course from '@/models/Course';
import Enrollment from '@/models/Enrollment';
import Notification from '@/models/Notification';
import { requestCourseRevisionAction, reviewRevisionRequestAction, getRevisionRequestsAction } from '@/actions/revision-access';

vi.mock('@/lib/mongoose', () => ({ default: vi.fn() }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('@/models/User', () => ({ default: { findById: vi.fn() } }));
vi.mock('@/models/Course', () => ({ default: { findById: vi.fn(), find: vi.fn() } }));
vi.mock('@/models/Enrollment', () => ({ default: { findOne: vi.fn(), findById: vi.fn(), findOneAndUpdate: vi.fn(), find: vi.fn() } }));
vi.mock('@/models/Notification', () => ({ default: { create: vi.fn().mockResolvedValue({}) } }));
vi.mock('@/lib/realtime-notifications', () => ({ sendRealtimeNotification: vi.fn() }));

const student = '507f1f77bcf86cd799439001', owner = '507f1f77bcf86cd799439002';
const courseId = '507f1f77bcf86cd799439003', enrollmentId = '507f1f77bcf86cd799439004';
const lean = (value: unknown) => ({ lean: async () => value });
const course = { _id: courseId, title: 'Course', createdById: owner, status: 'PUBLISHED', allowRevisionAccess: true, revisionAccessDays: 7 };
const enrollment = { _id: enrollmentId, courseId, userId: student, paymentStatus: 'success', validUntil: new Date(0), revisionRequestStatus: 'PENDING' };
const input = { courseId, examDate: '2099-12-01', reason: 'I need to revise the course before my final exam.' };
function actor(id: string, role: string, status = 'APPROVED') {
  vi.mocked(auth).mockResolvedValue({ user: { id, role } } as any);
  vi.mocked(User.findById).mockReturnValue({ select: () => lean({ role, status }) } as any);
}
beforeEach(() => {
  vi.clearAllMocks();
  actor(student, 'STUDENT');
  vi.mocked(Course.findById).mockReturnValue(lean(course) as any);
  vi.mocked(Enrollment.findOne).mockReturnValue(lean({ ...enrollment, revisionRequestStatus: 'NONE' }) as any);
  vi.mocked(Enrollment.findById).mockReturnValue(lean(enrollment) as any);
  vi.mocked(Enrollment.findOneAndUpdate).mockResolvedValue(enrollment as any);
});

describe('Revision access review', () => {
  it('queues an expired enrollment without granting access', async () => {
    expect(await requestCourseRevisionAction(input)).toMatchObject({ success: true, requestStatus: 'PENDING' });
    const update = vi.mocked(Enrollment.findOneAndUpdate).mock.calls[0][1] as any;
    expect(update.$set).toMatchObject({ revisionRequestStatus: 'PENDING', isRevisionGranted: false });
    expect(update.$unset).toHaveProperty('revisionAccessExpiresAt');
    expect(Notification.create).not.toHaveBeenCalled();
  });
  it.each([{ examDate: '2000-01-01' }, { examDate: '2099-02-30' }, { reason: 'too short' }])('rejects invalid request details: %j', async patch => {
    expect(await requestCourseRevisionAction({ ...input, ...patch })).toMatchObject({ success: false });
    expect(Enrollment.findOneAndUpdate).not.toHaveBeenCalled();
  });
  it.each([null, { ...enrollment, validUntil: new Date('2099-01-01') }])('requires an expired paid enrollment', async value => {
    vi.mocked(Enrollment.findOne).mockReturnValue(lean(value) as any);
    expect(await requestCourseRevisionAction(input)).toMatchObject({ success: false });
    expect(Enrollment.findOneAndUpdate).not.toHaveBeenCalled();
  });
  it('rejects duplicate pending requests', async () => {
    vi.mocked(Enrollment.findOne).mockReturnValue(lean(enrollment) as any);
    expect(await requestCourseRevisionAction(input)).toMatchObject({ success: false });
    expect(Enrollment.findOneAndUpdate).not.toHaveBeenCalled();
  });
  it('uses the course revision duration and a pending-only update on approval', async () => {
    actor(owner, 'INSTRUCTOR');
    const before = Date.now();
    expect(await reviewRevisionRequestAction(enrollmentId, 'APPROVED', 'Final exam confirmed')).toEqual({ success: true });
    const [filter, update] = vi.mocked(Enrollment.findOneAndUpdate).mock.calls[0] as any;
    expect(filter).toMatchObject({ revisionRequestStatus: 'PENDING' });
    expect(update.$set).toMatchObject({ isRevisionGranted: true, revisionReviewedBy: owner });
    expect(update.$set.revisionAccessExpiresAt.getTime()).toBeGreaterThanOrEqual(before + 7 * 86400000);
    expect(Notification.create).toHaveBeenCalledWith(expect.objectContaining({ recipientId: student, type: 'REVISION_ACCESS_UPDATE' }));
  });
  it.each(['ADMIN', 'SUPERADMIN'])('allows a current %s to review', async role => {
    actor(student, role);
    expect(await reviewRevisionRequestAction(enrollmentId, 'APPROVED', '')).toEqual({ success: true });
  });
  it.each(['STUDENT', 'INSTRUCTOR'])('denies a non-owner %s', async role => {
    actor(student, role);
    expect(await reviewRevisionRequestAction(enrollmentId, 'APPROVED', '')).toMatchObject({ success: false });
    expect(Enrollment.findOneAndUpdate).not.toHaveBeenCalled();
  });
  it('rejects a stale session whose current account is blocked', async () => {
    actor(owner, 'INSTRUCTOR', 'BLOCKED');
    expect(await reviewRevisionRequestAction(enrollmentId, 'APPROVED', '')).toMatchObject({ success: false });
    expect(Enrollment.findOneAndUpdate).not.toHaveBeenCalled();
  });
  it('requires rejection feedback and leaves access disabled', async () => {
    actor(owner, 'INSTRUCTOR');
    expect(await reviewRevisionRequestAction(enrollmentId, 'REJECTED', '')).toMatchObject({ success: false });
    expect(Enrollment.findOneAndUpdate).not.toHaveBeenCalled();
    expect(await reviewRevisionRequestAction(enrollmentId, 'REJECTED', 'Please provide your examination details.')).toEqual({ success: true });
    const update = vi.mocked(Enrollment.findOneAndUpdate).mock.calls[0][1] as any;
    expect(update.$set).toMatchObject({ revisionRequestStatus: 'REJECTED', isRevisionGranted: false });
    expect(update.$unset).toHaveProperty('revisionAccessExpiresAt');
  });
  it('does not approve when revision is disabled on the course', async () => {
    actor(owner, 'INSTRUCTOR');
    vi.mocked(Course.findById).mockReturnValue(lean({ ...course, allowRevisionAccess: false }) as any);
    expect(await reviewRevisionRequestAction(enrollmentId, 'APPROVED', '')).toMatchObject({ success: false });
    expect(Enrollment.findOneAndUpdate).not.toHaveBeenCalled();
  });
  it('reports a concurrent or already completed review', async () => {
    actor(owner, 'INSTRUCTOR');
    vi.mocked(Enrollment.findOneAndUpdate).mockResolvedValue(null);
    expect(await reviewRevisionRequestAction(enrollmentId, 'APPROVED', '')).toMatchObject({ success: false });
  });
  it('limits the instructor queue to owned courses', async () => {
    actor(owner, 'INSTRUCTOR');
    vi.mocked(Course.find).mockReturnValue({ select: () => lean([course]) } as any);
    vi.mocked(Enrollment.find).mockReturnValue({ populate: () => ({ sort: () => ({ limit: () => lean([]) }) }) } as any);
    expect(await getRevisionRequestsAction()).toEqual({ requests: [] });
    expect(Course.find).toHaveBeenCalledWith({ createdById: owner });
    expect(Enrollment.find).toHaveBeenCalledWith(expect.objectContaining({ courseId: { $in: [courseId, courseId] } }));
  });
});
