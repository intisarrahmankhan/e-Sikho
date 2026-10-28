import { beforeEach, describe, expect, it, vi } from 'vitest';
import { validateAudience, matchesAudience, managesCourse } from '@/lib/assessment-policy';
import { authorizeAssessmentCreation, canAccessAssessment, filterVisibleAssessments, getAssessmentViewer } from '@/lib/assessment-access';
import { auth } from '@/auth';
import Course from '@/models/Course';
import User from '@/models/User';
import Permission from '@/models/GlobalAssessmentPermission';
import { getCourseAccessDetails } from '@/actions/course-access';
vi.mock('@/lib/mongoose', () => ({ default: vi.fn() }));
vi.mock('@/models/User', () => ({ default: { findById: vi.fn(), countDocuments: vi.fn() } }));
vi.mock('@/models/Course', () => ({ default: { findById: vi.fn() } }));
vi.mock('@/models/GlobalAssessmentPermission', () => ({ default: { findOne: vi.fn() } }));
vi.mock('@/actions/course-access', () => ({ getCourseAccessDetails: vi.fn() }));
const teacher = { id: '507f1f77bcf86cd799439001', role: 'INSTRUCTOR' };
const student = { id: '507f1f77bcf86cd799439002', role: 'STUDENT', educationLevel: 'UNIVERSITY', department: 'CSE' };
const courseId = '507f1f77bcf86cd799439003';
const global = { scope: 'GLOBAL', approvalStatus: 'APPROVED', status: 'PUBLISHED', audience: { educationLevels: ['UNIVERSITY'], departments: ['cse'], studentIds: [] } };
beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(Course.findById).mockReturnValue({ lean: async () => ({ createdById: teacher.id, status: 'PUBLISHED' }) } as any);
  vi.mocked(Permission.findOne).mockReturnValue({ lean: async () => null } as any);
  vi.mocked(getCourseAccessDetails).mockResolvedValue({ canAccessAll: true } as any);
});
describe('Assessment audience and publishing policy', () => {
  it('normalizes department labels without assuming an education level', () => {
    expect(validateAudience({ departments: [' CSE ', 'Computer Science & Engineering (CSE)'] }).departments).toEqual(['cse']);
    expect(matchesAudience(global.audience as any, { ...student, educationLevel: undefined })).toBe(false);
  });
  it.each(['SCHOOL', 'COLLEGE', 'UNIVERSITY'])('supports %s learners', (level) => {
    expect(matchesAudience({ educationLevels: [level as any], departments: [], studentIds: [] }, { ...student, educationLevel: level })).toBe(true);
  });
  it('combines level, department, and explicit student selection using AND', () => {
    const audience = { educationLevels: ['UNIVERSITY'] as const, departments: ['cse'], studentIds: [student.id] };
    expect(matchesAudience(audience as any, student)).toBe(true);
    expect(matchesAudience(audience as any, { ...student, department: 'EEE' })).toBe(false);
    expect(matchesAudience(audience as any, { ...student, educationLevel: 'SCHOOL' })).toBe(false);
    expect(matchesAudience(audience as any, { ...student, id: teacher.id })).toBe(false);
  });
  it('does not expose even unrestricted global assessments to anonymous viewers', () => {
    expect(matchesAudience(undefined, null)).toBe(false);
  });
  it('rejects malformed filters', () => {
    expect(() => validateAudience({ educationLevels: ['UNKNOWN' as any] })).toThrow();
    expect(() => validateAudience({ studentIds: ['not-a-user-id'] })).toThrow();
    expect(() => validateAudience({ departments: 'CSE' as any })).toThrow();
  });
  it('permits course owners and explicitly assigned instructors', () => {
    expect(managesCourse({ createdById: teacher.id }, teacher)).toBe(true);
    expect(managesCourse({ createdById: 'other', instructorUserIds: [teacher.id] }, teacher)).toBe(true);
    expect(managesCourse({ createdById: 'other' }, teacher)).toBe(false);
  });
  it('rejects student publishing regardless of submitted scope', async () => {
    await expect(authorizeAssessmentCreation('EXAM', { scope: 'GLOBAL' }, student)).rejects.toThrow('Only instructors');
  });
  it('requires superadmin-approved hosting permission for global publishing', async () => {
    await expect(authorizeAssessmentCreation('EXAM', { scope: 'GLOBAL' }, teacher)).rejects.toThrow('superadmin approval');
    vi.mocked(Permission.findOne).mockReturnValue({ lean: async () => ({ _id: 'permission-id', status: 'APPROVED' }) } as any);
    expect(await authorizeAssessmentCreation('EXAM', { scope: 'GLOBAL', audience: {} }, teacher)).toMatchObject({ scope: 'GLOBAL', approvalStatus: 'APPROVED' });
    expect(Permission.findOne).toHaveBeenLastCalledWith({ instructorId: teacher.id, kind: 'EXAM', status: 'APPROVED' });
  });
  it('validates explicit student IDs against real approved student accounts', async () => {
    vi.mocked(User.countDocuments).mockResolvedValue(0);
    await expect(authorizeAssessmentCreation('EXAM', { scope: 'GLOBAL', audience: { studentIds: [student.id] } }, { ...teacher, role: 'SUPERADMIN' })).rejects.toThrow('unavailable');
  });
  it('allows created draft courses in the authoring flow', async () => {
    vi.mocked(Course.findById).mockReturnValue({ lean: async () => ({ createdById: teacher.id, status: 'DRAFT' }) } as any);
    expect(await authorizeAssessmentCreation('EXAM', { courseId, scope: 'COURSE' }, teacher)).toMatchObject({ courseId, scope: 'COURSE' });
  });
  it('rejects another instructor course even when a forged course ID is submitted', async () => {
    vi.mocked(Course.findById).mockReturnValue({ lean: async () => ({ createdById: 'other' }) } as any);
    await expect(authorizeAssessmentCreation('CONTEST', { courseId, scope: 'COURSE' }, teacher)).rejects.toThrow('instructor access');
  });
  it('blocks direct access and discovery for excluded departments', async () => {
    const outsider = { ...student, department: 'EEE' };
    expect(await canAccessAssessment(global, outsider)).toBe(false);
    expect(await filterVisibleAssessments([global], outsider)).toEqual([]);
    expect(await canAccessAssessment(global, student)).toBe(true);
  });
  it('hides unapproved and legacy unscoped global assessments', async () => {
    expect(await canAccessAssessment({ ...global, approvalStatus: 'PENDING' }, student)).toBe(false);
    expect(await canAccessAssessment({ status: 'PUBLISHED' }, student)).toBe(false);
  });
  it('allows an instructor to inspect their own assessment', async () => {
    expect(await canAccessAssessment({ ...global, status: 'DRAFT', createdById: teacher.id }, teacher)).toBe(true);
  });
  it('requires an active course entitlement and a published course', async () => {
    vi.mocked(getCourseAccessDetails).mockResolvedValue({ canAccessAll: false } as any);
    expect(await canAccessAssessment({ courseId, status: 'PUBLISHED' }, student)).toBe(false);
    vi.mocked(Course.findById).mockReturnValue({ lean: async () => ({ status: 'DRAFT' }) } as any);
    expect(await canAccessAssessment({ courseId, status: 'PUBLISHED' }, student)).toBe(false);
  });
  it('loads audience attributes and role from the database', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { ...student, role: 'SUPERADMIN' } } as any);
    vi.mocked(User.findById).mockReturnValue({ select: () => ({ lean: async () => ({ role: 'STUDENT', status: 'APPROVED', educationLevel: 'SCHOOL', department: 'Science' }) }) } as any);
    expect(await getAssessmentViewer()).toMatchObject({ role: 'STUDENT', educationLevel: 'SCHOOL', department: 'Science' });
  });
});
