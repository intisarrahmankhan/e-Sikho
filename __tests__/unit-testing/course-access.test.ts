import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getCourseAccessDetails, getCourseResourcesAction, getCourseLiveSessionsAction, toggleLessonProgressAction, trackLessonHeartbeatAction } from '@/actions/course-access';
import { auth } from '@/auth';
import Course from '@/models/Course';
import Enrollment from '@/models/Enrollment';
import Module from '@/models/Module';
import Lesson from '@/models/Lesson';
import LessonProgress from '@/models/LessonProgress';
import LiveSession from '@/models/LiveSession';

vi.mock('@/lib/mongoose', () => ({ default: vi.fn() }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('@/models/Course', () => ({ default: { findById: vi.fn() } }));
vi.mock('@/models/Enrollment', () => ({ default: { findOne: vi.fn() } }));
vi.mock('@/models/Module', () => ({ default: { find: vi.fn(), exists: vi.fn() } }));
vi.mock('@/models/Lesson', () => ({ default: { countDocuments: vi.fn(), findById: vi.fn(), find: vi.fn() } }));
vi.mock('@/models/LessonProgress', () => ({ default: { find: vi.fn(), findOne: vi.fn(), create: vi.fn() } }));
vi.mock('@/models/LiveSession', () => ({ default: { find: vi.fn() } }));
const courseId = '507f1f77bcf86cd799439010';
const lessonId = '507f1f77bcf86cd799439011';
const moduleId = '507f1f77bcf86cd799439012';
const lean = (value: any) => ({ lean: async () => value });
const select = (value: any) => ({ select: () => lean(value) });
beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(auth).mockResolvedValue({ user: { id: 'student-1', role: 'STUDENT' } } as any);
  vi.mocked(Course.findById).mockReturnValue(lean({ status: 'PUBLISHED' }) as any);
  vi.mocked(Enrollment.findOne).mockReturnValue(lean({ paymentStatus: 'success' }) as any);
  vi.mocked(Module.find).mockReturnValue(select([{ _id: moduleId }]) as any);
  vi.mocked(Module.exists).mockResolvedValue({ _id: moduleId } as any);
  vi.mocked(Lesson.countDocuments).mockResolvedValue(4);
  vi.mocked(Lesson.findById).mockReturnValue(select({ moduleId }) as any);
  vi.mocked(Lesson.find).mockReturnValue(lean([]) as any);
  vi.mocked(LessonProgress.find).mockReturnValue(select([]) as any);
  vi.mocked(LessonProgress.findOne).mockResolvedValue(null);
  vi.mocked(LessonProgress.create).mockResolvedValue({} as any);
  vi.mocked(LiveSession.find).mockReturnValue({ sort: () => lean([]) } as any);
});

describe('Course entitlement and real progress', () => {
  it('denies access without a session', async () => {
    vi.mocked(auth).mockResolvedValue(null as any);
    expect(await getCourseAccessDetails(courseId)).toMatchObject({ canAccessAll: false });
  });
  it('counts actual lessons rather than a hardcoded course total', async () => {
    vi.mocked(LessonProgress.find).mockReturnValue(select([{ lessonId }]) as any);
    expect(await getCourseAccessDetails(courseId)).toMatchObject({ totalLessons: 4, progressPercentage: 25, canAccessAll: true });
  });
  it('denies access after enrollment expiration', async () => {
    vi.mocked(Enrollment.findOne).mockReturnValue(lean({ validUntil: new Date(0) }) as any);
    expect(await getCourseAccessDetails(courseId)).toMatchObject({ canAccessAll: false, isEnrollmentExpired: true });
  });
  it('honors a current revision grant', async () => {
    vi.mocked(Enrollment.findOne).mockReturnValue(lean({ validUntil: new Date(0), isRevisionGranted: true, revisionAccessExpiresAt: new Date(Date.now() + 60000) }) as any);
    expect(await getCourseAccessDetails(courseId)).toMatchObject({ canAccessAll: true, isRevisionAccessActive: true });
  });
  it('prevents progress writes without enrollment', async () => {
    vi.mocked(Enrollment.findOne).mockReturnValue(lean(null) as any);
    expect(await toggleLessonProgressAction(courseId, lessonId, true)).toHaveProperty('error');
    expect(LessonProgress.create).not.toHaveBeenCalled();
  });
  it('rejects progress for a lesson belonging to a different course', async () => {
    vi.mocked(Module.exists).mockResolvedValue(null);
    expect(await toggleLessonProgressAction(courseId, lessonId, true)).toHaveProperty('error');
    expect(LessonProgress.create).not.toHaveBeenCalled();
  });
  it('records completion for an entitled student and matching lesson', async () => {
    expect(await toggleLessonProgressAction(courseId, lessonId, true)).toMatchObject({ success: true, isCompleted: true });
    expect(LessonProgress.create).toHaveBeenCalledWith(expect.objectContaining({ courseId, lessonId, isCompleted: true }));
  });
  it('rejects invalid video timestamps', async () => {
    expect(await trackLessonHeartbeatAction({ courseId, lessonId, currentTimestamp: Infinity, videoDuration: 100 })).toMatchObject({ success: false });
    expect(LessonProgress.create).not.toHaveBeenCalled();
  });
  it('does not invent resources for an empty course', async () => {
    expect(await getCourseResourcesAction(courseId)).toEqual({ success: true, resources: [] });
  });
  it('withholds paid PDF URLs from non-enrolled students', async () => {
    vi.mocked(Enrollment.findOne).mockReturnValue(lean(null) as any);
    vi.mocked(Lesson.find).mockReturnValue(lean([{ _id: lessonId, title: 'Notes', pdfUrl: '/paid.pdf', isFree: false }]) as any);
    expect((await getCourseResourcesAction(courseId)).resources).toEqual([]);
  });
  it('returns only existing live sessions', async () => {
    expect(await getCourseLiveSessionsAction(courseId)).toEqual({ success: true, liveSessions: [] });
  });
  it('withholds meeting links from non-enrolled students', async () => {
    vi.mocked(Enrollment.findOne).mockReturnValue(lean(null) as any);
    expect((await getCourseLiveSessionsAction(courseId)).liveSessions).toEqual([]);
    expect(LiveSession.find).not.toHaveBeenCalled();
  });
});
