import { auth } from '@/auth';
import dbConnect from '@/lib/mongoose';
import User from '@/models/User';
import Course from '@/models/Course';
import GlobalAssessmentPermission from '@/models/GlobalAssessmentPermission';
import { getCourseAccessDetails } from '@/actions/course-access';
import { AssessmentKind, AssessmentViewer, managesAssessment, managesCourse, matchesAudience, validateAudience, emptyAudience } from '@/lib/assessment-policy';

export async function getAssessmentViewer(): Promise<AssessmentViewer | null> {
  const session = await auth();
  const actor = session?.user as { id?: string; role?: string } | undefined;
  if (!actor?.id) return null;
  await dbConnect();
  const profile = await User.findById(actor.id).select('role status educationLevel department').lean();
  if (!profile || ['BLOCKED', 'SUSPENDED'].includes(profile.status)) return null;
  return { id: actor.id, role: profile.role, educationLevel: profile.educationLevel, department: profile.department };
}

export async function authorizeAssessmentCreation(kind: AssessmentKind, input: any, actor: AssessmentViewer) {
  if (!['INSTRUCTOR', 'ADMIN', 'SUPERADMIN'].includes(actor.role || '')) throw new Error('Only instructors and administrators can create assessments.');
  const scope = input.scope || (input.courseId && input.courseId !== 'none' ? 'COURSE' : 'GLOBAL');
  if (!['COURSE', 'GLOBAL'].includes(scope)) throw new Error('Choose a course assessment or an approved global assessment.');
  await dbConnect();
  if (scope === 'COURSE') {
    if (!/^[a-f0-9]{24}$/i.test(input.courseId || '')) throw new Error('Select one of your courses.');
    const course = await Course.findById(input.courseId).lean();
    if (!course || !managesCourse(course, actor)) throw new Error('You do not have instructor access to this course.');
    return { scope: 'COURSE' as const, courseId: input.courseId as string, audience: emptyAudience(), approvalStatus: 'APPROVED' as const };
  }
  const permission = ['ADMIN', 'SUPERADMIN'].includes(actor.role || '') ? null : await GlobalAssessmentPermission.findOne({ instructorId: actor.id, kind, status: 'APPROVED' }).lean();
  if (!permission && !['ADMIN', 'SUPERADMIN'].includes(actor.role || '')) throw new Error('Apply for global hosting access and wait for superadmin approval.');
  const audience = validateAudience(input.audience);
  if (audience.studentIds.length) {
    const count = await User.countDocuments({ _id: { $in: audience.studentIds }, role: 'STUDENT', status: 'APPROVED' });
    if (count !== audience.studentIds.length) throw new Error('Some selected students are unavailable. Refresh your selection.');
  }
  return { scope: 'GLOBAL' as const, courseId: undefined, audience, approvalStatus: 'APPROVED' as const, globalPermissionId: permission?._id };
}

export async function canAccessAssessment(record: any, viewer: AssessmentViewer | null) {
  if (managesAssessment(record, viewer)) return true;
  if (record.status === 'DRAFT') return false;
  if (record.courseId) {
    if (!viewer) return false;
    const courseId = String(record.courseId._id || record.courseId);
    const course = await Course.findById(courseId).lean();
    if (!course || course.status !== 'PUBLISHED') return false;
    if (managesCourse(course, viewer)) return true;
    return (await getCourseAccessDetails(courseId)).canAccessAll;
  }
  return record.scope === 'GLOBAL' && record.approvalStatus === 'APPROVED' && matchesAudience(record.audience, viewer);
}

export async function filterVisibleAssessments<T>(records: T[], viewer: AssessmentViewer | null): Promise<T[]> {
  const visible = await Promise.all(records.map((record) => canAccessAssessment(record, viewer)));
  return records.filter((_, index) => visible[index]);
}
