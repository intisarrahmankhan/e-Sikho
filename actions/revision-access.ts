'use server';

import { auth } from '@/auth';
import dbConnect from '@/lib/mongoose';
import User from '@/models/User';
import Course from '@/models/Course';
import Enrollment from '@/models/Enrollment';
import Notification from '@/models/Notification';
import { sendRealtimeNotification } from '@/lib/realtime-notifications';
import { revalidatePath } from 'next/cache';
import { isValidMongoObjectId } from '@/lib/auth-helpers';

async function viewer() {
  const session = await auth();
  const id = (session?.user as { id?: string } | undefined)?.id;
  if (!id || !isValidMongoObjectId(id)) throw new Error('Sign in to continue.');
  await dbConnect();
  const user = await User.findById(id).select('role status').lean();
  if (!user || user.status !== 'APPROVED') throw new Error('Approved account access is required.');
  return { id, role: user.role };
}

function expired(enrollment: any, course: any) {
  return !!((enrollment.validUntil && new Date(enrollment.validUntil).getTime() <= Date.now()) ||
    (course.courseEndDate && new Date(course.courseEndDate).getTime() <= Date.now()));
}

function mayReview(actor: { id: string; role: string }, course: any) {
  return ['ADMIN', 'SUPERADMIN'].includes(actor.role) ||
    (actor.role === 'INSTRUCTOR' && String(course.createdById) === actor.id);
}

function refresh(courseId: string) {
  for (const path of [`/courses/${courseId}`, '/student', '/instructor/revision-requests', '/admin/revision-requests']) revalidatePath(path);
}

export async function requestCourseRevisionAction(input: { courseId: string; examDate: string; reason: string }) {
  try {
    const actor = await viewer();
    const { courseId, examDate, reason } = input;
    const date = typeof examDate === 'string' ? new Date(`${examDate}T00:00:00Z`) : new Date(NaN);
    const today = new Date(Date.now() + 6 * 3600000).toISOString().slice(0, 10);
    if (!isValidMongoObjectId(courseId) || !/^\d{4}-\d{2}-\d{2}$/.test(examDate || '') ||
      !Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== examDate || examDate < today ||
      typeof reason !== 'string' || reason.trim().length < 20 || reason.length > 2000) {
      return { success: false, error: 'Select your exam date and explain the revision need in 20–2000 characters.' };
    }
    const course = await Course.findById(courseId).lean();
    if (!course || course.status !== 'PUBLISHED' || course.allowRevisionAccess === false) return { success: false, error: 'Revision requests are unavailable for this course.' };
    const enrollment = await Enrollment.findOne({ userId: actor.id, courseId: { $in: [courseId, course._id] }, paymentStatus: { $in: ['success', 'GRANTED', 'granted'] } }).lean();
    if (!enrollment || !expired(enrollment, course)) return { success: false, error: 'An expired course enrollment is required.' };
    if (enrollment.revisionRequestStatus === 'PENDING' || (enrollment.isRevisionGranted && enrollment.revisionAccessExpiresAt && new Date(enrollment.revisionAccessExpiresAt).getTime() > Date.now())) {
      return { success: false, error: 'You already have a pending request or active revision access.' };
    }
    const updated = await Enrollment.findOneAndUpdate({ _id: enrollment._id, revisionRequestStatus: { $ne: 'PENDING' }, $or: [{ isRevisionGranted: { $ne: true } }, { revisionAccessExpiresAt: { $lte: new Date() } }, { revisionAccessExpiresAt: { $exists: false } }] }, {
      $set: { revisionRequestStatus: 'PENDING', isRevisionGranted: false, revisionReason: reason.trim(), revisionExamDate: examDate, revisionReviewNotes: '' },
      $unset: { revisionAccessExpiresAt: '', revisionReviewedBy: '', revisionReviewedAt: '' },
    }, { new: true, runValidators: true });
    if (!updated) return { success: false, error: 'Your request changed. Refresh before trying again.' };
    refresh(courseId);
    return { success: true, requestStatus: 'PENDING' as const, message: 'Revision request submitted. Access stays locked until your instructor or an administrator approves it.' };
  } catch (error: any) { return { success: false, error: error.message || 'Could not submit the revision request.' }; }
}

export async function getRevisionRequestsAction() {
  try {
    const actor = await viewer();
    if (!['INSTRUCTOR', 'ADMIN', 'SUPERADMIN'].includes(actor.role)) return { error: 'Instructor or administrator access is required.', requests: [] };
    const courses = await Course.find(['ADMIN', 'SUPERADMIN'].includes(actor.role) ? {} : { createdById: actor.id }).select('_id title').lean();
    const courseMap = new Map(courses.map(c => [String(c._id), c.title]));
    const refs = courses.flatMap(c => [c._id, String(c._id)]);
    const enrollments = await Enrollment.find({ courseId: { $in: refs }, paymentStatus: { $in: ['success', 'GRANTED', 'granted'] }, revisionRequestStatus: { $in: ['PENDING', 'APPROVED', 'REJECTED'] } })
      .populate('userId', 'name').sort({ _id: -1 }).limit(100).lean();
    return { requests: enrollments.map((e: any) => ({ id: String(e._id), courseTitle: courseMap.get(String(e.courseId)) || 'Unavailable course', studentName: e.userId?.name || 'Unavailable account', status: e.revisionRequestStatus, reason: e.revisionReason || '', examDate: e.revisionExamDate || '', reviewNotes: e.revisionReviewNotes || '', expiresAt: e.revisionAccessExpiresAt ? new Date(e.revisionAccessExpiresAt).toISOString() : '' })) };
  } catch (error: any) { return { error: error.message || 'Could not load revision requests.', requests: [] }; }
}

export async function reviewRevisionRequestAction(enrollmentId: string, decision: 'APPROVED' | 'REJECTED', notes: string) {
  try {
    const actor = await viewer();
    if (!isValidMongoObjectId(enrollmentId) || !['APPROVED', 'REJECTED'].includes(decision) || typeof notes !== 'string' || notes.length > 2000 || (decision === 'REJECTED' && notes.trim().length < 10)) return { success: false, error: 'Choose a valid decision and include feedback when rejecting.' };
    const enrollment = await Enrollment.findById(enrollmentId).lean();
    if (!enrollment) return { success: false, error: 'Request not found.' };
    const course = await Course.findById(enrollment.courseId).lean();
    if (!course || !mayReview(actor, course)) return { success: false, error: 'Only the course owner or an administrator can review this request.' };
    if (decision === 'APPROVED' && (course.status !== 'PUBLISHED' || course.allowRevisionAccess === false || !expired(enrollment, course))) return { success: false, error: 'This enrollment is not eligible for revision access.' };
    const days = Number(course.revisionAccessDays ?? 14);
    if (decision === 'APPROVED' && (!Number.isInteger(days) || days < 1 || days > 365)) return { success: false, error: 'Set a valid course revision period between 1 and 365 days.' };
    const expiresAt = new Date(Date.now() + days * 86400000);
    const set = { revisionRequestStatus: decision, isRevisionGranted: decision === 'APPROVED', revisionReviewNotes: notes.trim(), revisionReviewedBy: actor.id, revisionReviewedAt: new Date(), ...(decision === 'APPROVED' ? { revisionAccessExpiresAt: expiresAt } : {}) };
    const update = { $set: set, ...(decision === 'REJECTED' ? { $unset: { revisionAccessExpiresAt: '' } } : {}) };
    const updated = await Enrollment.findOneAndUpdate({ _id: enrollmentId, revisionRequestStatus: 'PENDING', paymentStatus: { $in: ['success', 'GRANTED', 'granted'] } }, update, { new: true, runValidators: true });
    if (!updated) return { success: false, error: 'This request is no longer pending. Refresh the queue.' };
    // Keep the existing approval notification, but send it only after a real review.
    if (decision === 'APPROVED') {
      try {
        const payload = {
          title: 'কোর্স রিভিশন এক্সেস অনুমোদিত হয়েছে',
          message: `পরবর্তী ${days} দিনের জন্য আপনার কোর্স রিভিশন এক্সেস চালু হয়েছে।`,
          type: 'REVISION_ACCESS_UPDATE' as const, priority: 'HIGH' as const,
          actionUrl: `/courses/${course._id}`, badgeLabel: 'Revision Active',
        };
        await Notification.create({ recipientId: enrollment.userId, ...payload, priorityWeight: 3 });
        sendRealtimeNotification(String(enrollment.userId), { ...payload, createdAt: new Date().toISOString() });
      } catch (error) { console.warn('Could not dispatch revision notification:', error); }
    }
    refresh(String(course._id));
    return { success: true };
  } catch (error: any) { return { success: false, error: error.message || 'Could not review the revision request.' }; }
}
