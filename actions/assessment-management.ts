'use server';

import Course from '@/models/Course';
import User from '@/models/User';
import GlobalAssessmentPermission from '@/models/GlobalAssessmentPermission';
import { getAssessmentViewer } from '@/lib/assessment-access';
import { AssessmentKind } from '@/lib/assessment-policy';
import { revalidatePath } from 'next/cache';

export async function getAssessmentCreationContextAction(kind: AssessmentKind) {
  const actor = await getAssessmentViewer();
  if (!actor || !['INSTRUCTOR', 'ADMIN', 'SUPERADMIN'].includes(actor.role || '') || !['EXAM', 'CONTEST'].includes(kind)) return { error: 'Instructor access is required.', courses: [], canCreateGlobal: false };
  const courses = await Course.find(['ADMIN', 'SUPERADMIN'].includes(actor.role || '') ? {} : { $or: [{ createdById: actor.id }, { instructorUserIds: actor.id }] }).select('_id title status').sort({ createdAt: -1 }).lean();
  const permission = await GlobalAssessmentPermission.findOne({ instructorId: actor.id, kind }).lean();
  return { courses: courses.map((course) => ({ id: String(course._id), title: course.title, status: course.status })), canCreateGlobal: ['ADMIN', 'SUPERADMIN'].includes(actor.role || '') || permission?.status === 'APPROVED', permissionStatus: permission?.status || 'NOT_REQUESTED' };
}

export async function requestGlobalAssessmentPermissionAction(kind: AssessmentKind, reason: string) {
  try {
    const actor = await getAssessmentViewer();
    if (!actor || actor.role !== 'INSTRUCTOR') return { error: 'Only instructors can apply for global hosting access.' };
    if (!['EXAM', 'CONTEST'].includes(kind) || typeof reason !== 'string' || reason.trim().length < 20 || reason.length > 2000) return { error: 'Choose an assessment type and explain your teaching purpose in 20–2000 characters.' };
    const existing = await GlobalAssessmentPermission.findOne({ instructorId: actor.id, kind }).lean();
    if (existing && ['APPROVED', 'PENDING'].includes(existing.status)) return { error: 'You already have approved access or a pending application for this type.' };
    await GlobalAssessmentPermission.findOneAndUpdate({ instructorId: actor.id, kind, status: { $nin: ['APPROVED', 'PENDING'] } }, { $set: { reason: reason.trim(), status: 'PENDING', reviewNotes: '' }, $unset: { reviewedBy: '', reviewedAt: '' } }, { upsert: true, new: true, runValidators: true });
    revalidatePath('/instructor/assessments');
    revalidatePath('/admin/assessments');
    return { success: true };
  } catch { return { error: 'The application could not be submitted. Check whether a request is already pending.' }; }
}

export async function getGlobalAssessmentApplicationsAction() {
  const actor = await getAssessmentViewer();
  if (!actor || !['INSTRUCTOR', 'SUPERADMIN'].includes(actor.role || '')) return { error: 'Access denied.', applications: [] };
  const requests = await GlobalAssessmentPermission.find(actor.role === 'SUPERADMIN' ? {} : { instructorId: actor.id }).populate('instructorId', 'name email').sort({ createdAt: -1 }).lean();
  return { applications: requests.map((request: any) => ({ id: String(request._id), kind: request.kind, reason: request.reason, status: request.status, reviewNotes: request.reviewNotes || '', instructorName: request.instructorId?.name || 'Instructor', instructorEmail: request.instructorId?.email || '', createdAt: request.createdAt.toISOString() })) };
}

export async function reviewGlobalAssessmentApplicationAction(id: string, decision: 'APPROVED' | 'REJECTED', notes: string) {
  try {
    const actor = await getAssessmentViewer();
    if (!actor || actor.role !== 'SUPERADMIN') return { error: 'Only the superadmin can review global hosting applications.' };
    if (!/^[a-f0-9]{24}$/i.test(id) || !['APPROVED', 'REJECTED'].includes(decision) || typeof notes !== 'string' || notes.length > 2000 || (decision === 'REJECTED' && notes.trim().length < 10)) return { error: 'Provide a valid decision and a reason when rejecting an application.' };
    const updated = await GlobalAssessmentPermission.findOneAndUpdate({ _id: id, status: 'PENDING' }, { $set: { status: decision, reviewNotes: notes.trim(), reviewedBy: actor.id, reviewedAt: new Date() } }, { new: true, runValidators: true });
    if (!updated) return { error: 'This application is no longer pending. Refresh the queue.' };
    revalidatePath('/admin/assessments'); revalidatePath('/instructor/assessments'); revalidatePath('/exams/create'); revalidatePath('/contests/create');
    return { success: true };
  } catch { return { error: 'The review could not be saved.' }; }
}

export async function searchAssessmentStudentsAction(query: string, kind: AssessmentKind) {
  const actor = await getAssessmentViewer();
  if (!actor || !['INSTRUCTOR', 'ADMIN', 'SUPERADMIN'].includes(actor.role || '') || !['EXAM', 'CONTEST'].includes(kind)) return { students: [] };
  if (actor.role === 'INSTRUCTOR' && !await GlobalAssessmentPermission.exists({ instructorId: actor.id, kind, status: 'APPROVED' })) return { students: [] };
  if (typeof query !== 'string' || query.trim().length < 2 || query.length > 80) return { students: [] };
  const escaped = query.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const filter = /^[a-f0-9]{24}$/i.test(query.trim()) ? { _id: query.trim() } : { name: { $regex: escaped, $options: 'i' } };
  const students = await User.find({ ...filter, role: 'STUDENT', status: 'APPROVED' }).select('_id name educationLevel department').limit(20).lean();
  return { students: students.map((student) => ({ id: String(student._id), name: student.name, educationLevel: student.educationLevel || '', department: student.department || '' })) };
}

export async function assignAssessmentCourseInstructorAction(courseId: string, email: string) {
  try {
    const actor = await getAssessmentViewer();
    if (!actor || !['ADMIN', 'SUPERADMIN'].includes(actor.role || '')) return { error: 'Administrator access is required.' };
    if (!/^[a-f0-9]{24}$/i.test(courseId) || typeof email !== 'string' || email.length > 254) return { error: 'Select a course and an instructor email.' };
    const instructor = await User.findOne({ email: email.trim().toLowerCase(), role: 'INSTRUCTOR', status: 'APPROVED' }).select('_id').lean();
    if (!instructor) return { error: 'No approved instructor has that email address.' };
    const result = await Course.updateOne({ _id: courseId }, { $addToSet: { instructorUserIds: instructor._id } });
    if (!result.matchedCount) return { error: 'Course not found.' };
    revalidatePath('/exams/create'); revalidatePath('/contests/create'); revalidatePath('/admin/assessments');
    return { success: true };
  } catch { return { error: 'Instructor access could not be assigned.' }; }
}
