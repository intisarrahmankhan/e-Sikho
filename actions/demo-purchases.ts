'use server';

import mongoose, { Types } from 'mongoose';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import { isValidMongoObjectId } from '@/lib/auth-helpers';
import { isDemoCheckoutEnabled } from '@/lib/demo-checkout';
import dbConnect from '@/lib/mongoose';
import Course from '@/models/Course';
import Enrollment from '@/models/Enrollment';
import User from '@/models/User';

type Failure = { success: false; error: string };
type PendingPurchase = {
  id: string;
  studentName: string;
  studentEmail: string;
  courseTitle: string;
  amount: number;
  requestedAt: string;
};

const pendingStatus = 'DEMO_PENDING';
const activeStatuses = ['success', 'GRANTED', 'granted'];
const learnerRoles = ['STUDENT', 'INSTRUCTOR'] as const;
const adminRoles = ['ADMIN', 'SUPERADMIN'];
const paidCourse = { status: 'PUBLISHED', approvalStatus: 'APPROVED', price: { $gt: 0 } } as const;

async function currentUser() {
  const session = await auth();
  return session?.user as { id?: string; role?: string; status?: string } | undefined;
}

function courseEnrollment(userId: string, courseId: string) {
  const objectId = new Types.ObjectId(courseId.trim());
  return Enrollment.findOne({ userId, courseId: { $in: [objectId.toString(), objectId] } });
}

export async function getDemoPurchaseCheckoutStatus(courseId: string): Promise<'available' | 'pending' | 'enrolled'> {
  if (!isDemoCheckoutEnabled() || !isValidMongoObjectId(courseId)) return 'available';
  const user = await currentUser();
  if (!user?.id || !isValidMongoObjectId(user.id)) return 'available';

  await dbConnect();
  const enrollment = await courseEnrollment(user.id, courseId).select('paymentStatus').lean();
  if (enrollment?.paymentStatus === pendingStatus) return 'pending';
  if (enrollment && activeStatuses.includes(enrollment.paymentStatus)) return 'enrolled';
  return 'available';
}

export async function submitDemoPurchase(courseId: string): Promise<{ success: true; alreadyPending?: boolean } | Failure> {
  if (!isDemoCheckoutEnabled()) return { success: false, error: 'Demo checkout is disabled.' };
  if (!isValidMongoObjectId(courseId)) return { success: false, error: 'Invalid course.' };

  try {
    const user = await currentUser();
    if (!user?.id || !isValidMongoObjectId(user.id) || user.status !== 'APPROVED' || !learnerRoles.some((role) => role === user.role)) {
      return { success: false, error: 'Sign in with an approved learner account to request access.' };
    }

    await dbConnect();
    const course = await Course.findOne({ _id: courseId.trim(), ...paidCourse })
      .select('price createdById instructorUserIds courseEndDate').lean();
    if (!course || !Number.isFinite(course.price) || (course.courseEndDate && course.courseEndDate <= new Date())) {
      return { success: false, error: 'This course is unavailable for demo checkout.' };
    }
    if (String(course.createdById) === user.id || course.instructorUserIds?.some((id) => String(id) === user.id)) {
      return { success: false, error: 'You already have instructor access to this course.' };
    }

    const canonicalId = String(course._id);
    const existing = await courseEnrollment(user.id, canonicalId).select('paymentStatus').lean();
    if (existing?.paymentStatus === pendingStatus) return { success: true, alreadyPending: true };
    if (existing) {
      return { success: false, error: activeStatuses.includes(existing.paymentStatus)
        ? 'You are already enrolled in this course.'
        : 'An enrollment record already exists. Please contact the administrator.' };
    }

    // Use the enrollment's unique student/course key so a retry cannot replace access or create a second request.
    const requestedAt = new Date();
    const result = await Enrollment.updateOne({ userId: user.id, courseId: canonicalId }, {
      $setOnInsert: {
        paymentStatus: pendingStatus,
        amountPaid: 0,
        demoPurchase: { amount: course.price, requestedAt },
      },
    }, { upsert: true, setDefaultsOnInsert: true });
    if (!result.upsertedCount) {
      const current = await courseEnrollment(user.id, canonicalId).select('paymentStatus').lean();
      if (current?.paymentStatus === pendingStatus) return { success: true, alreadyPending: true };
      return { success: false, error: 'Your enrollment changed. Refresh the page to see your current access.' };
    }

    revalidatePath('/admin');
    return { success: true };
  } catch (error) {
    console.error('Demo purchase request failed:', error);
    return { success: false, error: 'Could not submit the demo purchase. Please try again.' };
  }
}

export async function getPendingDemoPurchases(): Promise<{ success: true; purchases: PendingPurchase[] } | Failure> {
  if (!isDemoCheckoutEnabled()) return { success: false, error: 'Demo checkout is disabled.' };

  try {
    const user = await currentUser();
    if (!user?.id || !isValidMongoObjectId(user.id) || !adminRoles.includes(user.role || '')) {
      return { success: false, error: 'Admin access required.' };
    }

    await dbConnect();
    const pending = await Enrollment.find({ paymentStatus: pendingStatus })
      .select('userId courseId demoPurchase').sort({ 'demoPurchase.requestedAt': 1 }).lean();
    if (pending.length === 0) return { success: true, purchases: [] };

    const [users, courses] = await Promise.all([
      User.find({ _id: { $in: pending.map((request) => request.userId) } }).select('name email').lean(),
      Course.find({ _id: { $in: pending.map((request) => request.courseId) } }).select('title').lean(),
    ]);
    const studentsById = new Map(users.map((student) => [String(student._id), student]));
    const titlesById = new Map(courses.map((course) => [String(course._id), course.title]));
    const purchases = pending.flatMap((request) => {
      const student = studentsById.get(String(request.userId));
      const courseTitle = titlesById.get(String(request.courseId));
      const demo = request.demoPurchase;
      if (!student || !courseTitle || !demo) return [];
      return [{
        id: String(request._id),
        studentName: student.name,
        studentEmail: student.email,
        courseTitle,
        amount: demo.amount,
        requestedAt: demo.requestedAt.toISOString(),
      }];
    });
    return { success: true, purchases };
  } catch (error) {
    console.error('Demo purchase queue failed:', error);
    return { success: false, error: 'Could not load demo purchase requests.' };
  }
}

export async function approveDemoPurchase(purchaseId: string): Promise<{ success: true } | Failure> {
  if (!isDemoCheckoutEnabled()) return { success: false, error: 'Demo checkout is disabled.' };
  if (!isValidMongoObjectId(purchaseId)) return { success: false, error: 'Invalid demo purchase.' };

  try {
    const admin = await currentUser();
    const adminId = admin?.id;
    if (!adminId || !isValidMongoObjectId(adminId) || !adminRoles.includes(admin?.role || '')) {
      return { success: false, error: 'Admin access required.' };
    }

    await dbConnect();
    const result = await mongoose.connection.transaction(async (session) => {
      const request = await Enrollment.findById(purchaseId.trim()).session(session);
      if (!request?.demoPurchase?.requestedAt) return { error: 'Demo purchase request not found.' };
      const courseId = String(request.courseId);
      if (request.paymentStatus === 'GRANTED' && request.demoPurchase.approvedBy) return { courseId };
      if (request.paymentStatus !== pendingStatus) return { error: 'This demo purchase is no longer pending.' };

      const learner = await User.exists({ _id: request.userId, status: 'APPROVED', role: { $in: learnerRoles } }).session(session);
      if (!learner) return { error: 'This learner account is no longer eligible.' };

      const updatedCourse = await Course.updateOne({
        _id: courseId,
        ...paidCourse,
        createdById: { $ne: request.userId },
        instructorUserIds: { $ne: request.userId },
        $or: [{ courseEndDate: null }, { courseEndDate: { $gt: new Date() } }],
      }, { $inc: { studentsEnrolled: 1 } }, { session });
      if (!updatedCourse.matchedCount) return { error: 'The course is no longer eligible for demo checkout.' };

      await Enrollment.updateOne({ _id: request._id }, {
        $set: {
          paymentStatus: 'GRANTED',
          amountPaid: 0,
          enrolledAt: new Date(),
          'demoPurchase.approvedBy': adminId,
        },
      }, { session });
      return { courseId };
    });

    if (!result.courseId) return { success: false, error: result.error || 'Could not approve the demo purchase.' };
    revalidatePath('/admin');
    revalidatePath('/student');
    revalidatePath('/courses');
    revalidatePath(`/courses/${result.courseId}`);
    return { success: true };
  } catch (error) {
    console.error('Demo purchase approval failed:', error);
    return { success: false, error: 'Could not approve the demo purchase. Please try again.' };
  }
}
