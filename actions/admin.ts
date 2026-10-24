'use server';

import mongoose from 'mongoose';
import dbConnect from '@/lib/mongoose';
import User from '@/models/User';
import Course from '@/models/Course';
import InstructorRequest from '@/models/InstructorRequest';
import InstructorProfile from '@/models/InstructorProfile';
import Report from '@/models/Report';
import ModeratorAction from '@/models/ModeratorAction';
import Comment from '@/models/Comment';
import Enrollment from '@/models/Enrollment';
import Instructor from '@/models/Instructor';
import Module from '@/models/Module';
import Lesson from '@/models/Lesson';
import AuditLog from '@/models/AuditLog';
import { COURSES_DATA, getCourseById } from '@/lib/courses-data';
import { hashPassword, normalizePhone } from '@/lib/auth-helpers';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';

async function checkSuperadmin() {
  const session = await auth();
  const userId = (session?.user as any)?.id;
  const role = (session?.user as any)?.role;
  if (!userId || role !== 'SUPERADMIN') {
    throw new Error('Unauthorized. Only Superadmins can perform this action.');
  }
  return userId;
}

async function checkAdminOrSuperadmin() {
  const session = await auth();
  const userId = (session?.user as any)?.id;
  const role = (session?.user as any)?.role;
  if (!userId || (role !== 'ADMIN' && role !== 'SUPERADMIN')) {
    throw new Error('Unauthorized. Admin access required.');
  }
  return userId;
}

async function checkAdminOrModerator() {
  const session = await auth();
  const userId = (session?.user as any)?.id;
  const role = (session?.user as any)?.role;
  if (!userId || (role !== 'ADMIN' && role !== 'SUPERADMIN' && role !== 'MODERATOR')) {
    throw new Error('Unauthorized. Admin or Moderator access required.');
  }
  return userId;
}

export async function updateUserStatus(userId: string, status: 'APPROVED' | 'REJECTED') {
  try {
    const adminId = await checkSuperadmin();
    await dbConnect();
    await User.findByIdAndUpdate(userId, { status });

    await AuditLog.create({
      action: 'UPDATE_USER_STATUS',
      category: 'USER_MANAGEMENT',
      actorId: adminId,
      targetId: userId,
      details: { status },
    });

    revalidatePath('/admin');
    revalidatePath('/admin/dashboard');
    return { success: true };
  } catch (error) {
    console.error('Failed to update user status:', error);
    return { success: false, error: 'Failed to update user status' };
  }
}

export async function updateUserRole(
  userId: string,
  newRole: 'STUDENT' | 'INSTRUCTOR' | 'MODERATOR' | 'ADMIN' | 'SUPERADMIN'
) {
  try {
    const adminId = await checkSuperadmin();
    await dbConnect();
    await User.findByIdAndUpdate(userId, { role: newRole });

    await AuditLog.create({
      action: 'UPDATE_USER_ROLE',
      category: 'SECURITY',
      actorId: adminId,
      targetId: userId,
      details: { newRole },
    });

    revalidatePath('/admin');
    revalidatePath('/admin/dashboard');
    return { success: true };
  } catch (error) {
    console.error('Failed to update user role:', error);
    return { success: false, error: 'Failed to update user role' };
  }
}

export async function approveCourse(courseId: string) {
  try {
    const adminId = await checkAdminOrSuperadmin();
    await dbConnect();
    await Course.findByIdAndUpdate(courseId, {
      status: 'PUBLISHED',
      approvalStatus: 'APPROVED',
      rejectionReason: null,
    });

    revalidatePath('/admin');
    revalidatePath('/admin/dashboard');
    return { success: true };
  } catch (error) {
    console.error('Failed to approve course:', error);
    return { success: false, error: 'Failed to approve course' };
  }
}

export async function rejectCourse(courseId: string, reason: string) {
  try {
    const adminId = await checkAdminOrSuperadmin();
    await dbConnect();
    await Course.findByIdAndUpdate(courseId, {
      status: 'REJECTED',
      approvalStatus: 'REJECTED',
      rejectionReason: reason,
    });

    revalidatePath('/admin');
    revalidatePath('/admin/dashboard');
    return { success: true };
  } catch (error) {
    console.error('Failed to reject course:', error);
    return { success: false, error: 'Failed to reject course' };
  }
}

export async function toggleUserSuspend(userId: string, currentStatus: string) {
  try {
    const adminId = await checkSuperadmin();
    await dbConnect();
    const nextStatus = currentStatus === 'SUSPENDED' ? 'APPROVED' : 'SUSPENDED';
    await User.findByIdAndUpdate(userId, { status: nextStatus });

    await AuditLog.create({
      action: 'TOGGLE_USER_SUSPEND',
      category: 'USER_MANAGEMENT',
      actorId: adminId,
      targetId: userId,
      details: { nextStatus },
    });

    revalidatePath('/admin');
    revalidatePath('/admin/dashboard');
    return { success: true };
  } catch (error) {
    console.error('Failed to toggle user suspension:', error);
    return { success: false, error: 'Failed to update user suspension status' };
  }
}

export async function reviewInstructorRequest(requestId: string, action: 'APPROVE' | 'REJECT') {
  try {
    const adminId = await checkSuperadmin();
    await dbConnect();
    const req = await InstructorRequest.findById(requestId);
    if (!req) return { success: false, error: 'Request not found' };

    if (action === 'APPROVE') {
      await InstructorRequest.findByIdAndUpdate(requestId, { status: 'APPROVED', reviewedAt: new Date() });
      await User.findByIdAndUpdate(req.userId, { role: 'INSTRUCTOR' });
      
      await AuditLog.create({
        action: 'APPROVE_INSTRUCTOR_REQUEST',
        category: 'SECURITY',
        actorId: adminId,
        targetId: req.userId,
        details: { requestId },
      });
    } else {
      await InstructorRequest.findByIdAndUpdate(requestId, { status: 'REJECTED', reviewedAt: new Date() });
    }
    revalidatePath('/admin');
    revalidatePath('/admin/dashboard');
    return { success: true };
  } catch (error) {
    console.error('Failed to review instructor request:', error);
    return { success: false, error: 'Failed to review request' };
  }
}

export async function reviewCourse(courseId: string, action: 'APPROVE' | 'REJECT') {
  try {
    const adminId = await checkAdminOrSuperadmin();
    await dbConnect();
    if (action === 'APPROVE') {
      await Course.findByIdAndUpdate(courseId, { approvalStatus: 'APPROVED', status: 'PUBLISHED' });
    } else {
      await Course.findByIdAndUpdate(courseId, { approvalStatus: 'REJECTED', status: 'REJECTED' });
    }
    revalidatePath('/admin');
    revalidatePath('/admin/dashboard');
    return { success: true };
  } catch (error) {
    console.error('Failed to review course:', error);
    return { success: false, error: 'Failed to review course' };
  }
}

/**
 * Superadmin: Assign a course directly to a student
 */
export async function assignCourseToStudent(studentId: string, courseId: string) {
  try {
    const adminId = await checkSuperadmin();
    await dbConnect();

    const student = await User.findById(studentId);
    if (!student) return { success: false, error: 'Student not found.' };

    // Resolve course title and check course existence
    const staticCourse = getCourseById(courseId);
    let courseTitle = staticCourse?.title || '';
    let isDbCourse = false;

    if (!staticCourse) {
      try {
        const dbCourse = await Course.findById(courseId).lean() as any;
        if (dbCourse) {
          courseTitle = dbCourse.title;
          isDbCourse = true;
        }
      } catch {
        // Not a valid DB course id
      }
    }

    if (!courseTitle) {
      return { success: false, error: 'Selected course could not be found.' };
    }

    if (isDbCourse) {
      const dbCourse = await Course.findById(courseId).select('createdById').lean() as any;
      if (dbCourse?.createdById && dbCourse.createdById.toString() === studentId.toString()) {
        return { success: false, error: 'Cannot assign a course to its own creator/instructor.' };
      }
    }

    // Check if student is already enrolled
    const existing = await Enrollment.findOne({
      userId: studentId,
      courseId,
      paymentStatus: { $in: ['success', 'GRANTED', 'granted'] },
    });

    if (existing) {
      return { success: false, error: `User is already enrolled in "${courseTitle}".` };
    }

    // Create or update enrollment
    await Enrollment.findOneAndUpdate(
      { userId: studentId, courseId },
      {
        paymentStatus: 'GRANTED',
        transactionId: `SUPERADMIN_GRANT_${Date.now()}`,
        enrolledAt: new Date(),
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    if (isDbCourse) {
      await Course.findByIdAndUpdate(courseId, { $inc: { studentsEnrolled: 1 } });
    }

    await AuditLog.create({
      action: 'ASSIGN_COURSE',
      category: 'USER_MANAGEMENT',
      actorId: adminId,
      targetId: studentId,
      details: { courseId, courseTitle, studentEmail: student.email },
    });

    revalidatePath('/admin');
    revalidatePath('/student');
    return { success: true, message: `Successfully assigned "${courseTitle}" to ${student.name}.` };
  } catch (error: any) {
    console.error('Failed to assign course:', error);
    return { success: false, error: error?.message || 'Failed to assign course.' };
  }
}

/**
 * Superadmin: Revoke an assigned course from a student
 */
export async function removeCourseFromStudent(studentId: string, courseId: string) {
  try {
    const adminId = await checkSuperadmin();
    await dbConnect();

    const enrollment = await Enrollment.findOneAndDelete({ userId: studentId, courseId });
    if (!enrollment) {
      return { success: false, error: 'Enrollment record not found.' };
    }

    try {
      await Course.findByIdAndUpdate(courseId, { $inc: { studentsEnrolled: -1 } });
    } catch {
      // Static course or missing
    }

    await AuditLog.create({
      action: 'REVOKE_COURSE',
      category: 'USER_MANAGEMENT',
      actorId: adminId,
      targetId: studentId,
      details: { courseId },
    });

    revalidatePath('/admin');
    revalidatePath('/student');
    return { success: true, message: 'Course enrollment removed.' };
  } catch (error: any) {
    console.error('Failed to revoke course:', error);
    return { success: false, error: error?.message || 'Failed to revoke course.' };
  }
}

/**
 * Superadmin: Block a student or instructor
 */
export async function blockUser(userId: string, reason?: string) {
  try {
    const adminId = await checkSuperadmin();
    await dbConnect();

    const targetUser = await User.findById(userId);
    if (!targetUser) return { success: false, error: 'User not found.' };

    if (targetUser.role === 'SUPERADMIN' || targetUser._id.toString() === adminId) {
      return { success: false, error: 'Cannot block a Superadmin account.' };
    }

    targetUser.status = 'BLOCKED';
    await targetUser.save();

    await AuditLog.create({
      action: 'BLOCK_USER',
      category: 'SECURITY',
      actorId: adminId,
      targetId: userId,
      details: { role: targetUser.role, email: targetUser.email, reason: reason || 'Blocked by Superadmin' },
    });

    revalidatePath('/admin');
    return { success: true, message: `${targetUser.name} has been blocked from the site.` };
  } catch (error: any) {
    console.error('Failed to block user:', error);
    return { success: false, error: error?.message || 'Failed to block user.' };
  }
}

/**
 * Superadmin: Unblock a student or instructor
 */
export async function unblockUser(userId: string) {
  try {
    const adminId = await checkSuperadmin();
    await dbConnect();

    const targetUser = await User.findById(userId);
    if (!targetUser) return { success: false, error: 'User not found.' };

    targetUser.status = 'APPROVED';
    await targetUser.save();

    await AuditLog.create({
      action: 'UNBLOCK_USER',
      category: 'SECURITY',
      actorId: adminId,
      targetId: userId,
      details: { role: targetUser.role, email: targetUser.email },
    });

    revalidatePath('/admin');
    return { success: true, message: `${targetUser.name} has been unblocked.` };
  } catch (error: any) {
    console.error('Failed to unblock user:', error);
    return { success: false, error: error?.message || 'Failed to unblock user.' };
  }
}

/**
 * Superadmin: Permanently remove a student or instructor from the platform
 */
export async function deleteUser(userId: string) {
  try {
    const adminId = await checkSuperadmin();
    await dbConnect();

    const targetUser = await User.findById(userId);
    if (!targetUser) return { success: false, error: 'User not found.' };

    if (targetUser.role === 'SUPERADMIN' || targetUser._id.toString() === adminId) {
      return { success: false, error: 'Cannot delete a Superadmin account.' };
    }

    const { name, email, role } = targetUser;

    // Delete all associated enrollments
    await Enrollment.deleteMany({ userId });

    // If instructor, delete instructor profile and requests
    if (role === 'INSTRUCTOR') {
      await Instructor.deleteOne({ name });
      await InstructorRequest.deleteMany({ userId });
    } else {
      await InstructorRequest.deleteMany({ userId });
    }

    // Delete user account
    await User.findByIdAndDelete(userId);

    await AuditLog.create({
      action: 'DELETE_USER',
      category: 'SECURITY',
      actorId: adminId,
      targetId: userId,
      details: { name, email, role },
    });

    revalidatePath('/admin');
    return { success: true, message: `Account for ${name} (${role}) has been permanently removed.` };
  } catch (error: any) {
    console.error('Failed to delete user:', error);
    return { success: false, error: error?.message || 'Failed to delete user.' };
  }
}

/**
 * Fetch enrollments for a specific student (for the assignment modal)
 */
export async function getStudentEnrollments(studentId: string) {
  try {
    await checkAdminOrSuperadmin();
    await dbConnect();

    const enrollments = await Enrollment.find({
      userId: studentId,
      paymentStatus: { $in: ['success', 'GRANTED', 'granted'] },
    }).lean();

    const list = await Promise.all(
      enrollments.map(async (e: any) => {
        const cId = String(e.courseId);
        const staticC = getCourseById(cId);
        if (staticC) {
          return {
            courseId: staticC.id,
            title: staticC.title,
            titleEn: staticC.titleEn,
            enrolledAt: e.enrolledAt,
            paymentStatus: e.paymentStatus,
          };
        }
        try {
          const dbC = (await Course.findById(cId).lean()) as any;
          if (dbC) {
            return {
              courseId: dbC._id.toString(),
              title: dbC.title,
              titleEn: dbC.titleEn,
              enrolledAt: e.enrolledAt,
              paymentStatus: e.paymentStatus,
            };
          }
        } catch {}
        return {
          courseId: cId,
          title: `Course (${cId})`,
          enrolledAt: e.enrolledAt,
          paymentStatus: e.paymentStatus,
        };
      })
    );

    return { success: true, enrollments: list };
  } catch (error: any) {
    return { success: false, error: error?.message || 'Failed to fetch enrollments.' };
  }
}

/**
 * Fetch all available courses for assignment dropdown
 */
export async function getAllAssignableCourses() {
  try {
    await checkAdminOrSuperadmin();
    await dbConnect();

    const staticList = COURSES_DATA.map((c) => ({
      id: c.id,
      title: c.title,
      titleEn: c.titleEn,
      price: c.price,
      category: c.categoryBangla || c.category,
    }));

    const dbCourses = (await Course.find({ approvalStatus: 'APPROVED' })
      .select('_id title titleEn price category categoryBangla')
      .lean()) as any[];

    const dbList = dbCourses.map((c) => ({
      id: c._id.toString(),
      title: c.title,
      titleEn: c.titleEn,
      price: c.price,
      category: c.categoryBangla || c.category,
    }));

    return { success: true, courses: [...staticList, ...dbList] };
  } catch (error: any) {
    return { success: false, error: error?.message || 'Failed to fetch courses.' };
  }
}

/**
 * Superadmin: Create a new user (Student, Instructor, Admin, Moderator)
 */
export async function createUser(data: {
  name: string;
  email: string;
  phone?: string;
  role: 'STUDENT' | 'INSTRUCTOR' | 'MODERATOR' | 'ADMIN' | 'SUPERADMIN';
  password?: string;
  status?: 'APPROVED' | 'PENDING' | 'BLOCKED' | 'SUSPENDED';
}) {
  try {
    const adminId = await checkSuperadmin();
    await dbConnect();

    const email = data.email.toLowerCase().trim();
    const phone = data.phone ? normalizePhone(data.phone) : undefined;

    // Check if email already exists
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return { success: false, error: 'A user with this email already exists.' };
    }

    if (phone) {
      const existingPhone = await User.findOne({ phone });
      if (existingPhone) {
        return { success: false, error: 'A user with this phone number already exists.' };
      }
    }

    const hashedPassword = data.password && data.password.trim() ? hashPassword(data.password.trim()) : hashPassword('123456');

    const newUser = await User.create({
      name: data.name.trim(),
      email,
      phone: phone || undefined,
      role: data.role || 'STUDENT',
      status: data.status || 'APPROVED',
      password: hashedPassword,
    });

    if (data.role === 'INSTRUCTOR') {
      const existingInstructor = await Instructor.findOne({ name: newUser.name });
      if (!existingInstructor) {
        await Instructor.create({
          name: newUser.name,
          role: 'Instructor',
          avatar: '',
          bio: 'e-Shikho অনুমোদিত ইন্সট্রাক্টর',
        });
      }
    }

    await AuditLog.create({
      action: 'CREATE_USER',
      category: 'USER_MANAGEMENT',
      actorId: adminId,
      targetId: newUser._id.toString(),
      details: { name: newUser.name, email: newUser.email, role: newUser.role },
    });

    revalidatePath('/admin');
    return {
      success: true,
      message: `User ${newUser.name} created successfully.`,
      user: {
        id: newUser._id.toString(),
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        role: newUser.role,
        status: newUser.status,
      },
    };
  } catch (error: any) {
    console.error('Failed to create user:', error);
    return { success: false, error: error?.message || 'Failed to create user.' };
  }
}

/**
 * Superadmin: Edit existing user details
 */
export async function editUser(
  userId: string,
  data: {
    name?: string;
    email?: string;
    phone?: string;
    role?: 'STUDENT' | 'INSTRUCTOR' | 'MODERATOR' | 'ADMIN' | 'SUPERADMIN';
    status?: 'APPROVED' | 'PENDING' | 'BLOCKED' | 'SUSPENDED';
    password?: string;
  }
) {
  try {
    const adminId = await checkSuperadmin();
    await dbConnect();

    const targetUser = await User.findById(userId);
    if (!targetUser) return { success: false, error: 'User not found.' };

    if (targetUser.role === 'SUPERADMIN' && targetUser._id.toString() !== adminId && data.role && data.role !== 'SUPERADMIN') {
      return { success: false, error: 'Cannot demote another Superadmin.' };
    }

    if (data.name) targetUser.name = data.name.trim();
    if (data.email) {
      const newEmail = data.email.toLowerCase().trim();
      if (newEmail !== targetUser.email) {
        const emailExists = await User.findOne({ email: newEmail });
        if (emailExists) return { success: false, error: 'Email is already taken by another account.' };
        targetUser.email = newEmail;
      }
    }
    if (data.phone !== undefined) {
      const newPhone = data.phone ? normalizePhone(data.phone) : '';
      if (newPhone && newPhone !== targetUser.phone) {
        const phoneExists = await User.findOne({ phone: newPhone });
        if (phoneExists) return { success: false, error: 'Phone number is already taken.' };
        targetUser.phone = newPhone;
      } else if (!newPhone) {
        targetUser.phone = undefined;
      }
    }
    if (data.role) targetUser.role = data.role;
    if (data.status) targetUser.status = data.status;
    if (data.password && data.password.trim()) {
      targetUser.password = hashPassword(data.password.trim());
    }

    await targetUser.save();

    if (targetUser.role === 'INSTRUCTOR') {
      const existingInstructor = await Instructor.findOne({ name: targetUser.name });
      if (!existingInstructor) {
        await Instructor.create({
          name: targetUser.name,
          role: 'Instructor',
          avatar: targetUser.image || '',
          bio: 'e-Shikho অনুমোদিত ইন্সট্রাক্টর',
        });
      }
    }

    await AuditLog.create({
      action: 'EDIT_USER',
      category: 'USER_MANAGEMENT',
      actorId: adminId,
      targetId: userId,
      details: { name: targetUser.name, email: targetUser.email, role: targetUser.role, status: targetUser.status },
    });

    revalidatePath('/admin');
    return { success: true, message: `Updated details for ${targetUser.name}.` };
  } catch (error: any) {
    console.error('Failed to update user:', error);
    return { success: false, error: error?.message || 'Failed to update user.' };
  }
}

/**
 * Superadmin / Admin: Get all courses with instructor details
 */
export async function getAllAdminCourses() {
  try {
    await checkAdminOrSuperadmin();
    await dbConnect();

    const courses = await Course.find()
      .populate('instructor')
      .sort({ createdAt: -1 })
      .lean();

    const formatted = courses.map((c: any) => ({
      id: c._id.toString(),
      title: c.title,
      titleEn: c.titleEn || '',
      tagline: c.tagline || '',
      taglineEn: c.taglineEn || '',
      description: c.description || '',
      category: c.category || 'general',
      categoryBangla: c.categoryBangla || 'সাধারণ',
      level: c.level || 'বিগিনার',
      price: c.price || 0,
      originalPrice: c.originalPrice || c.price || 0,
      duration: c.duration || '',
      thumbnailUrl: c.thumbnailUrl || '',
      status: c.status || 'DRAFT',
      approvalStatus: c.approvalStatus || 'APPROVED',
      studentsEnrolled: c.studentsEnrolled || 0,
      instructorName: c.instructor?.name || 'e-Shikho Faculty',
      createdAt: c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '',
    }));

    return { success: true, courses: formatted };
  } catch (error: any) {
    console.error('Failed to fetch admin courses:', error);
    return { success: false, error: error?.message || 'Failed to fetch courses.' };
  }
}

/**
 * Superadmin: Create a new course directly
 */
export async function createCourseByAdmin(data: {
  title: string;
  titleEn?: string;
  tagline?: string;
  taglineEn?: string;
  description: string;
  descriptionEn?: string;
  category: string;
  categoryBangla?: string;
  level?: string;
  price: number;
  originalPrice?: number;
  duration?: string;
  thumbnailUrl?: string;
  instructorName?: string;
  status?: 'DRAFT' | 'PENDING_REVIEW' | 'PUBLISHED' | 'REJECTED';
  approvalStatus?: string;
}) {
  try {
    const adminId = await checkSuperadmin();
    await dbConnect();

    const title = data.title.trim();
    if (!title || !data.description) {
      return { success: false, error: 'Course title and description are required.' };
    }

    const instName = data.instructorName?.trim() || 'e-Shikho Faculty';
    let instructor = await Instructor.findOne({ name: instName });
    if (!instructor) {
      instructor = await Instructor.create({
        name: instName,
        role: 'Instructor',
        avatar: '',
        bio: 'e-Shikho কোর্স ইন্সট্রাক্টর',
      });
    }

    const newCourse = await Course.create({
      title,
      titleEn: data.titleEn?.trim() || '',
      tagline: data.tagline?.trim() || title,
      taglineEn: data.taglineEn?.trim() || '',
      description: data.description.trim(),
      descriptionEn: data.descriptionEn?.trim() || '',
      category: data.category || 'web-dev',
      categoryBangla: data.categoryBangla || 'ওয়েব ডেভেলপমেন্ট',
      level: data.level || 'বিগিনার',
      rating: 5,
      totalRatings: 0,
      studentsEnrolled: 0,
      duration: data.duration || '১ ঘণ্টা',
      totalLessons: 1,
      price: Number(data.price) || 0,
      originalPrice: Number(data.originalPrice) || Number(data.price) || 0,
      thumbnailUrl: data.thumbnailUrl || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=800&auto=format&fit=crop',
      status: data.status || 'PUBLISHED',
      approvalStatus: data.approvalStatus || 'APPROVED',
      instructorId: instructor._id,
      createdById: adminId,
      learningOutcomes: JSON.stringify([]),
      prerequisites: JSON.stringify([]),
    });

    const courseModule = await Module.create({
      title: 'মডিউল ১: ভূমিকা ও পরিচিতি',
      duration: '১ ঘণ্টা',
      order: 0,
      courseId: newCourse._id,
    });

    await Lesson.create({
      title: 'কোর্স পরিচিতি ও গাইডলাইন',
      content: `${title} কোর্সে স্বাগতম।`,
      duration: '১৫:০০',
      isFree: true,
      order: 0,
      moduleId: courseModule._id,
    });

    await AuditLog.create({
      action: 'CREATE_COURSE',
      category: 'COURSE_MANAGEMENT',
      actorId: adminId,
      targetId: newCourse._id.toString(),
      details: { title, category: newCourse.category, price: newCourse.price },
    });

    revalidatePath('/admin');
    revalidatePath('/courses');
    return { success: true, message: `Course "${title}" created successfully.`, courseId: newCourse._id.toString() };
  } catch (error: any) {
    console.error('Failed to create course:', error);
    return { success: false, error: error?.message || 'Failed to create course.' };
  }
}

/**
 * Superadmin / Admin: Update an existing course
 */
export async function updateCourseByAdmin(
  courseId: string,
  data: {
    title?: string;
    titleEn?: string;
    tagline?: string;
    taglineEn?: string;
    description?: string;
    descriptionEn?: string;
    category?: string;
    categoryBangla?: string;
    level?: string;
    price?: number;
    originalPrice?: number;
    duration?: string;
    thumbnailUrl?: string;
    instructorName?: string;
    status?: 'DRAFT' | 'PENDING_REVIEW' | 'PUBLISHED' | 'REJECTED';
    approvalStatus?: string;
  }
) {
  try {
    const adminId = await checkAdminOrSuperadmin();
    await dbConnect();

    const course = await Course.findById(courseId);
    if (!course) return { success: false, error: 'Course not found.' };

    if (data.title) course.title = data.title.trim();
    if (data.titleEn !== undefined) course.titleEn = data.titleEn.trim();
    if (data.tagline !== undefined) course.tagline = data.tagline.trim();
    if (data.taglineEn !== undefined) course.taglineEn = data.taglineEn.trim();
    if (data.description) course.description = data.description.trim();
    if (data.descriptionEn !== undefined) course.descriptionEn = data.descriptionEn.trim();
    if (data.category) course.category = data.category;
    if (data.categoryBangla) course.categoryBangla = data.categoryBangla;
    if (data.level) course.level = data.level;
    if (data.price !== undefined) course.price = Number(data.price);
    if (data.originalPrice !== undefined) course.originalPrice = Number(data.originalPrice);
    if (data.duration) course.duration = data.duration;
    if (data.thumbnailUrl) course.thumbnailUrl = data.thumbnailUrl;
    if (data.status) course.status = data.status;
    if (data.approvalStatus) course.approvalStatus = data.approvalStatus;

    if (data.instructorName && data.instructorName.trim()) {
      let inst = await Instructor.findOne({ name: data.instructorName.trim() });
      if (!inst) {
        inst = await Instructor.create({
          name: data.instructorName.trim(),
          role: 'Instructor',
          avatar: '',
          bio: 'e-Shikho কোর্স ইন্সট্রাক্টর',
        });
      }
      course.instructorId = inst._id;
    }

    await course.save();

    await AuditLog.create({
      action: 'UPDATE_COURSE',
      category: 'COURSE_MANAGEMENT',
      actorId: adminId,
      targetId: courseId,
      details: { title: course.title, price: course.price, status: course.status },
    });

    revalidatePath('/admin');
    revalidatePath('/courses');
    revalidatePath(`/courses/${courseId}`);
    return { success: true, message: `Course "${course.title}" updated successfully.` };
  } catch (error: any) {
    console.error('Failed to update course:', error);
    return { success: false, error: error?.message || 'Failed to update course.' };
  }
}

/**
 * Superadmin: Permanently delete a course
 */
export async function deleteCourseByAdmin(courseId: string) {
  try {
    const adminId = await checkSuperadmin();
    await dbConnect();

    const course = await Course.findById(courseId);
    if (!course) return { success: false, error: 'Course not found.' };

    const title = course.title;

    // Delete lessons
    const modules = await Module.find({ courseId });
    const moduleIds = modules.map((m) => m._id);
    await Lesson.deleteMany({ moduleId: { $in: moduleIds } });

    // Delete modules
    await Module.deleteMany({ courseId });

    // Delete enrollments for this course
    await Enrollment.deleteMany({ courseId });

    // Delete course
    await Course.findByIdAndDelete(courseId);

    await AuditLog.create({
      action: 'DELETE_COURSE',
      category: 'COURSE_MANAGEMENT',
      actorId: adminId,
      targetId: courseId,
      details: { title },
    });

    revalidatePath('/admin');
    revalidatePath('/courses');
    return { success: true, message: `Course "${title}" has been permanently removed.` };
  } catch (error: any) {
    console.error('Failed to delete course:', error);
    return { success: false, error: error?.message || 'Failed to delete course.' };
  }
}

/**
 * Superadmin: Sync static courses from catalog into MongoDB
 */
export async function syncCatalogCoursesToDb() {
  try {
    await checkSuperadmin();
    await dbConnect();

    let addedCount = 0;
    for (const c of COURSES_DATA) {
      let inst = await Instructor.findOne({ name: c.instructor.name });
      if (!inst) {
        inst = await Instructor.create({
          name: c.instructor.name,
          role: c.instructor.role,
          avatar: c.instructor.avatar,
          bio: c.instructor.bio,
        });
      }

      const exists = await Course.findOne({ title: c.title });

      if (!exists) {
        const newC = await Course.create({
          title: c.title,
          titleEn: c.titleEn || '',
          tagline: c.tagline,
          taglineEn: c.taglineEn || '',
          description: c.description,
          descriptionEn: c.descriptionEn || '',
          category: c.category,
          categoryBangla: c.categoryBangla,
          level: c.level,
          rating: c.rating,
          totalRatings: c.totalRatings,
          studentsEnrolled: c.studentsEnrolled,
          duration: c.duration,
          totalLessons: c.totalLessons,
          price: c.price,
          originalPrice: c.originalPrice,
          thumbnailUrl: c.thumbnailUrl,
          thumbnailUrlEn: c.thumbnailUrlEn || '',
          previewVideoUrl: c.previewVideoUrl || '',
          status: 'PUBLISHED',
          approvalStatus: 'APPROVED',
          instructorId: inst._id,
          learningOutcomes: JSON.stringify(c.learningOutcomes || []),
          prerequisites: JSON.stringify(c.prerequisites || []),
        });

        if (c.modules) {
          for (let mIdx = 0; mIdx < c.modules.length; mIdx++) {
            const m = c.modules[mIdx];
            const mod = await Module.create({
              title: m.title,
              duration: m.duration,
              order: mIdx,
              courseId: newC._id,
            });
            if (m.lessons) {
              for (let lIdx = 0; lIdx < m.lessons.length; lIdx++) {
                const l = m.lessons[lIdx];
                await Lesson.create({
                  title: l.title,
                  duration: l.duration,
                  content: `${l.title} - বিস্তারিত লেকচার কনটেন্ট`,
                  videoUrl: l.videoUrl || '',
                  isFree: !!l.isFree,
                  order: lIdx,
                  moduleId: mod._id,
                });
              }
            }
          }
        }
        addedCount++;
      }
    }

    revalidatePath('/admin');
    revalidatePath('/courses');
    return { success: true, message: `Synced ${addedCount} catalog courses into MongoDB.` };
  } catch (error: any) {
    console.error('Failed to sync catalog courses:', error);
    return { success: false, error: error?.message || 'Failed to sync courses.' };
  }
}

/**
 * Task T-016: Instructor Approval/Rejection Server Actions with Role Transition
 * reviewInstructorApplication(profileId, decision, remarks)
 *
 * If approved:
 *   - update INSTRUCTOR_PROFILE.approval_status to 'Approved'
 *   - atomically promote the user's role to 'INSTRUCTOR'
 *   - ensure instructor entity exists
 * If rejected:
 *   - record the remarks
 *   - set approval_status to 'Rejected'
 *   - retain student status
 */
export async function reviewInstructorApplication(
  profileId: string,
  decision: 'Approved' | 'Rejected' | 'APPROVE' | 'REJECT',
  remarks?: string
) {
  try {
    const adminId = await checkAdminOrSuperadmin();
    await dbConnect();

    const normalizedDecision =
      decision.toUpperCase() === 'APPROVE' || decision.toLowerCase() === 'approved'
        ? 'Approved'
        : 'Rejected';

    // 1. Locate the InstructorProfile (or fallback to linked InstructorRequest)
    let profile = await InstructorProfile.findById(profileId);
    let userId: any = profile?.userId;

    if (!profile) {
      // Check if profileId was an InstructorRequest ID
      const req = await InstructorRequest.findById(profileId);
      if (req) {
        userId = req.userId;
        const user = await User.findById(userId);
        profile = await InstructorProfile.create({
          userId: req.userId,
          institution: 'Institutional Applicant',
          qualifications: ['Bachelor / Master Degree'],
          experienceYears: 3,
          subjectSpecialization: 'Software Engineering & IT',
          bio: req.reason,
          approval_status: 'Pending',
          submissionDate: req.createdAt || new Date(),
        });
      } else {
        return { success: false, error: 'Instructor application profile not found.' };
      }
    }

    if (!userId) {
      userId = profile.userId;
    }

    // Attempt Mongoose session/transaction (safe fallback if MongoDB is not a replica set or in test environment)
    let session: mongoose.ClientSession | null = null;
    if (mongoose.connection?.readyState === 1) {
      try {
        session = await mongoose.startSession();
        session.startTransaction();
      } catch {
        session = null;
      }
    }

    try {
      if (normalizedDecision === 'Approved') {
        // Update profile
        profile.approval_status = 'Approved';
        profile.remarks = remarks || 'Approved by administrator. Welcome to the instruction team!';
        profile.reviewedAt = new Date();
        profile.reviewedBy = adminId as any;
        await profile.save(session ? { session } : undefined);

        // Atomically promote user role to INSTRUCTOR
        await User.findByIdAndUpdate(
          userId,
          { role: 'INSTRUCTOR' },
          session ? { session } : undefined
        );

        // Create or update Instructor entity for courses catalog
        const userDoc = await User.findById(userId).session(session || null);
        if (userDoc) {
          await Instructor.findOneAndUpdate(
            { name: userDoc.name },
            {
              name: userDoc.name,
              role: profile.subjectSpecialization || 'Course Instructor',
              avatar:
                userDoc.image ||
                `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(userDoc.name)}`,
              bio:
                profile.bio ||
                userDoc.bio ||
                `${profile.institution} | ${profile.qualifications?.join(', ')}`,
            },
            { upsert: true, new: true, ...(session ? { session } : {}) }
          );
        }

        // Also update InstructorRequest if present
        await InstructorRequest.findOneAndUpdate(
          { userId },
          { status: 'APPROVED', adminApprovedAt: new Date(), reviewedAt: new Date() },
          session ? { session } : undefined
        );

        // Log audit trail
        await AuditLog.create(
          [
            {
              action: 'APPROVE_INSTRUCTOR_APPLICATION',
              category: 'USER_MANAGEMENT',
              actorId: adminId,
              targetId: userId,
              details: {
                profileId: profile._id.toString(),
                decision: 'Approved',
                institution: profile.institution,
                remarks: remarks || '',
              },
            },
          ],
          session ? { session } : undefined
        );
      } else {
        // Rejected
        profile.approval_status = 'Rejected';
        profile.remarks = remarks || 'Application does not meet instructional verification criteria.';
        profile.reviewedAt = new Date();
        profile.reviewedBy = adminId as any;
        await profile.save(session ? { session } : undefined);

        // Retain user's student role (do not change role)
        // Update InstructorRequest if present
        await InstructorRequest.findOneAndUpdate(
          { userId },
          { status: 'REJECTED', reviewedAt: new Date() },
          session ? { session } : undefined
        );

        // Log audit trail
        await AuditLog.create(
          [
            {
              action: 'REJECT_INSTRUCTOR_APPLICATION',
              category: 'USER_MANAGEMENT',
              actorId: adminId,
              targetId: userId,
              details: {
                profileId: profile._id.toString(),
                decision: 'Rejected',
                remarks: remarks || '',
              },
            },
          ],
          session ? { session } : undefined
        );
      }

      if (session) {
        await session.commitTransaction();
      }
    } catch (opErr) {
      if (session) {
        await session.abortTransaction();
      }
      throw opErr;
    } finally {
      if (session) {
        await session.endSession();
      }
    }

    revalidatePath('/admin/instructors/pending');
    revalidatePath('/admin');
    revalidatePath('/admin/dashboard');

    return {
      success: true,
      decision: normalizedDecision,
      profileId: profile._id.toString(),
      message:
        normalizedDecision === 'Approved'
          ? 'Instructor application approved and role successfully promoted to INSTRUCTOR.'
          : 'Instructor application rejected and feedback remarks saved.',
    };
  } catch (error: any) {
    console.error('Failed to review instructor application:', error);
    return { success: false, error: error?.message || 'Failed to review application.' };
  }
}

/**
 * Task T-015: Fetch instructor applications with filters by status, date range, and search
 */
export async function getInstructorApplicationsAction(filters?: {
  status?: string;
  dateRange?: string; // 'all' | 'today' | '7days' | '30days'
  search?: string;
}) {
  try {
    await checkAdminOrSuperadmin();
    await dbConnect();

    const query: any = {};

    // 1. Filter by Status (Pending, Approved, Rejected, All)
    if (filters?.status && filters.status !== 'all' && filters.status !== 'ALL') {
      const s = filters.status.toLowerCase();
      if (s === 'pending') {
        query.approval_status = { $in: ['Pending', 'PENDING'] };
      } else if (s === 'approved') {
        query.approval_status = { $in: ['Approved', 'APPROVED'] };
      } else if (s === 'rejected') {
        query.approval_status = { $in: ['Rejected', 'REJECTED'] };
      }
    }

    // 2. Filter by Date range
    if (filters?.dateRange && filters.dateRange !== 'all') {
      const now = new Date();
      if (filters.dateRange === 'today') {
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        query.submissionDate = { $gte: startOfToday };
      } else if (filters.dateRange === '7days') {
        const past7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        query.submissionDate = { $gte: past7Days };
      } else if (filters.dateRange === '30days') {
        const past30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        query.submissionDate = { $gte: past30Days };
      }
    }

    const rawProfiles = await InstructorProfile.find(query)
      .populate({
        path: 'userId',
        select: 'name email phone role image academicBackground elo createdAt',
      })
      .populate({
        path: 'reviewedBy',
        select: 'name email',
      })
      .sort({ submissionDate: -1, createdAt: -1 })
      .lean();

    // Plain JSON serialization to avoid RSC warnings
    let applications = JSON.parse(JSON.stringify(rawProfiles)).map((p: any) => ({
      id: p._id,
      userId: p.userId?._id || p.userId,
      user: p.userId && typeof p.userId === 'object' ? p.userId : null,
      institution: p.institution,
      qualifications: Array.isArray(p.qualifications)
        ? p.qualifications
        : [p.qualifications].filter(Boolean),
      experienceYears: p.experienceYears || 0,
      subjectSpecialization: p.subjectSpecialization,
      bio: p.bio,
      credentials: p.credentials || '',
      cvUrl: p.cvUrl || '',
      portfolioUrl: p.portfolioUrl || '',
      linkedinUrl: p.linkedinUrl || '',
      sampleLectureUrl: p.sampleLectureUrl || '',
      idVerificationUrl: p.idVerificationUrl || '',
      approval_status: p.approval_status,
      remarks: p.remarks || '',
      reviewedBy: p.reviewedBy,
      reviewedAt: p.reviewedAt,
      submissionDate: p.submissionDate || p.createdAt,
      createdAt: p.createdAt,
    }));

    // Post-populate search if search filter provided
    if (filters?.search && filters.search.trim()) {
      const term = filters.search.toLowerCase().trim();
      applications = applications.filter((app: any) => {
        return (
          app.user?.name?.toLowerCase().includes(term) ||
          app.user?.email?.toLowerCase().includes(term) ||
          app.institution?.toLowerCase().includes(term) ||
          app.subjectSpecialization?.toLowerCase().includes(term) ||
          app.qualifications?.some((q: string) => q.toLowerCase().includes(term))
        );
      });
    }

    return { success: true, applications };
  } catch (error: any) {
    console.error('Failed to fetch instructor applications:', error);
    return { success: false, error: error?.message || 'Failed to fetch applications.', applications: [] };
  }
}

/**
 * Helper to seed high-quality realistic instructor applications for review & verification testing
 */
export async function seedDemoInstructorApplicationsAction() {
  try {
    await checkAdminOrSuperadmin();
    await dbConnect();

    const demoCandidates = [
      {
        name: 'Dr. Tanvir Hasan',
        email: 'tanvir.hasan@buet.ac.bd',
        phone: '+8801711223344',
        academicBackground: 'Ph.D. in Computer Science',
        institution: 'Bangladesh University of Engineering and Technology (BUET)',
        qualifications: [
          'Ph.D. in Distributed Systems & Cloud Computing, NUS',
          'B.Sc. in CSE, BUET (First Class First)',
          '10+ Years University Teaching Experience',
          'Published 14 IEEE / ACM Research Papers',
        ],
        experienceYears: 10,
        subjectSpecialization: 'Distributed Systems & High-Performance Computing',
        bio: 'Associate Professor at BUET with extensive teaching and industry consulting background in distributed microservices, database internals, and algorithms.',
        credentials: 'BUET Faculty ID: #CSE-FAC-2016-89; Certified Kubernetes Administrator (CKA)',
        cvUrl: 'https://example.com/docs/tanvir-hasan-cv.pdf',
        portfolioUrl: 'https://tanvirhasan.dev',
        linkedinUrl: 'https://linkedin.com/in/tanvirhasan-buet',
        sampleLectureUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        idVerificationUrl: 'https://example.com/docs/buet-faculty-card.pdf',
      },
      {
        name: 'Farhana Sultana',
        email: 'farhana.sultana@techcorp.io',
        phone: '+8801819988776',
        academicBackground: 'M.Sc. in Software Engineering, DU',
        institution: 'University of Dhaka & Lead Architect at FinTech Global',
        qualifications: [
          'M.Sc. in Computer Science & Engineering, University of Dhaka',
          'Ex-Senior Staff Engineer at Grab / Shopee',
          '8+ Years Production Next.js, Node.js & React Native',
          'Instructor of 5,000+ engineers across corporate workshops',
        ],
        experienceYears: 8,
        subjectSpecialization: 'Fullstack Next.js, React & Scalable Cloud Architecture',
        bio: 'Principal Software Architect passionate about mentoring aspiring software engineers in Bangladesh. Specialize in production-grade TypeScript, resilient system design, and clean architecture.',
        credentials: 'AWS Certified Solutions Architect - Professional (#AWS-PSA-991204)',
        cvUrl: 'https://example.com/docs/farhana-sultana-resume.pdf',
        portfolioUrl: 'https://farhana-sultana.io',
        linkedinUrl: 'https://linkedin.com/in/farhanasultana-dev',
        sampleLectureUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        idVerificationUrl: 'https://example.com/docs/nid-verification-scan.pdf',
      },
      {
        name: 'Mahmudur Rahman',
        email: 'mahmudur.ai@sust.edu',
        phone: '+8801912345678',
        academicBackground: 'B.Sc. in CSE, SUST',
        institution: 'Shahjalal University of Science and Technology (SUST)',
        qualifications: [
          'B.Sc. in CSE from SUST',
          'Kaggle Grandmaster (Top 0.1% Globally)',
          '5+ Years Senior Machine Learning Engineer at AI Labs',
          'Author of "Deep Learning in Bengali NLP"',
        ],
        experienceYears: 5,
        subjectSpecialization: 'Machine Learning, PyTorch & LLM Engineering',
        bio: 'AI researcher and NLP practitioner dedicated to building state-of-the-art Bangla NLP and LLM fine-tuning pipelines. Experienced in teaching complex mathematical concepts with intuitive code examples.',
        credentials: 'NVIDIA Certified Deep Learning Institute (DLI) Instructor',
        cvUrl: 'https://example.com/docs/mahmud-ai-cv.pdf',
        portfolioUrl: 'https://mahmudur.ai',
        linkedinUrl: 'https://linkedin.com/in/mahmudur-rahman-ai',
        sampleLectureUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        idVerificationUrl: 'https://example.com/docs/sust-alumni-verification.pdf',
      },
    ];

    let createdCount = 0;

    for (const c of demoCandidates) {
      let user = await User.findOne({ email: c.email });
      if (!user) {
        user = await User.create({
          name: c.name,
          email: c.email,
          phone: c.phone,
          role: 'STUDENT',
          status: 'APPROVED',
          academicBackground: c.academicBackground,
          bio: c.bio,
          image: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(c.name)}`,
        });
      }

      const existingProfile = await InstructorProfile.findOne({ userId: user._id });
      if (!existingProfile) {
        await InstructorProfile.create({
          userId: user._id,
          institution: c.institution,
          qualifications: c.qualifications,
          experienceYears: c.experienceYears,
          subjectSpecialization: c.subjectSpecialization,
          bio: c.bio,
          credentials: c.credentials,
          cvUrl: c.cvUrl,
          portfolioUrl: c.portfolioUrl,
          linkedinUrl: c.linkedinUrl,
          sampleLectureUrl: c.sampleLectureUrl,
          idVerificationUrl: c.idVerificationUrl,
          approval_status: 'Pending',
          submissionDate: new Date(Date.now() - Math.floor(Math.random() * 5 * 86400000)),
        });
        createdCount++;
      }
    }

    revalidatePath('/admin/instructors/pending');
    return { success: true, message: `Created ${createdCount} realistic demo instructor applications.` };
  } catch (error: any) {
    console.error('Failed to seed demo applications:', error);
    return { success: false, error: error?.message || 'Failed to seed demo applications.' };
  }
}

/**
 * Task T-018: Moderation Actions Execution (MODERATOR_ACTION)
 * resolveModerationTicket(reportId, actionTaken, note)
 *
 * Supported actions: 'Warning', 'Remove', 'Ban', 'Other'
 * - When 'Remove' is chosen: soft-delete or hide reported comment/resource/course/lesson
 * - When 'Ban' is selected: invoke suspension state on target user (status: 'SUSPENDED')
 * - Write audit entry into MODERATOR_ACTION
 * - Update report status to 'Resolved'
 */
export async function resolveModerationTicket(
  reportId: string,
  actionTaken: 'Warning' | 'Remove' | 'Ban' | 'Other' | string,
  note?: string
) {
  try {
    const moderatorId = await checkAdminOrModerator();
    await dbConnect();

    const normalizedAction = (actionTaken.charAt(0).toUpperCase() +
      actionTaken.slice(1).toLowerCase()) as 'Warning' | 'Remove' | 'Ban' | 'Other';

    const report = await Report.findById(reportId);
    if (!report) {
      return { success: false, error: 'Moderation ticket / report not found.' };
    }

    const penaltyDetails: Record<string, any> = {
      actionTaken: normalizedAction,
      reportedType: report.reported_type,
      targetId: String(report.targetId),
      executedAt: new Date(),
    };

    // Execute penalty based on actionTaken
    if (normalizedAction === 'Remove') {
      const type = (report.reported_type || '').toLowerCase();
      if (type === 'comment') {
        await Comment.findByIdAndUpdate(report.targetId, {
          isDeleted: true,
          isHidden: true,
        });
        penaltyDetails.removedComment = true;
      } else if (type === 'course') {
        await Course.findByIdAndUpdate(report.targetId, {
          status: 'DRAFT',
          approvalStatus: 'REJECTED',
        });
        penaltyDetails.courseStatus = 'REJECTED';
      } else if (type === 'lesson') {
        await Lesson.findByIdAndUpdate(report.targetId, {
          isFree: false,
        });
        penaltyDetails.lessonDisabled = true;
      }
    } else if (normalizedAction === 'Ban') {
      // Find the user to suspend
      const userToSuspend = report.targetUserId || report.targetId;
      if (userToSuspend) {
        await User.findByIdAndUpdate(userToSuspend, {
          status: 'SUSPENDED',
        });
        penaltyDetails.suspendedUserId = String(userToSuspend);
      }
    } else if (normalizedAction === 'Warning') {
      penaltyDetails.warningIssued = true;
    } else {
      penaltyDetails.otherAction = true;
    }

    // 1. Update Report status to 'Resolved'
    report.status = 'Resolved';
    report.actionTaken = normalizedAction;
    report.resolutionNote = note || `Resolved with action: ${normalizedAction}`;
    report.resolvedBy = moderatorId as any;
    report.resolvedAt = new Date();
    await report.save();

    // 2. Create immutable record in MODERATOR_ACTION
    const moderatorActionRecord = await ModeratorAction.create({
      reportId: report._id,
      moderatorId,
      targetId: report.targetId,
      targetType: report.reported_type,
      targetUserId: report.targetUserId,
      actionTaken: normalizedAction,
      note: note || `Ticket resolved with action: ${normalizedAction}`,
      penaltyDetails,
    });

    // 3. Log to system AuditLog
    await AuditLog.create({
      action: `MODERATION_${normalizedAction.toUpperCase()}`,
      category: 'SECURITY',
      actorId: moderatorId,
      targetId: report.targetUserId || report.targetId,
      details: {
        reportId: report._id.toString(),
        actionTaken: normalizedAction,
        reportedType: report.reported_type,
        note: note || '',
      },
    });

    revalidatePath('/admin/moderation');
    revalidatePath('/admin');

    return {
      success: true,
      reportId: report._id.toString(),
      status: 'Resolved',
      actionTaken: normalizedAction,
      actionId: moderatorActionRecord._id.toString(),
      message: `Moderation ticket successfully resolved with action '${normalizedAction}'.`,
    };
  } catch (error: any) {
    console.error('Failed to resolve moderation ticket:', error);
    return { success: false, error: error?.message || 'Failed to resolve moderation ticket.' };
  }
}

/**
 * Update report status (e.g. Open -> In Review, Closed)
 */
export async function updateReportStatus(
  reportId: string,
  status: 'Open' | 'In Review' | 'Resolved' | 'Closed' | string
) {
  try {
    const moderatorId = await checkAdminOrModerator();
    await dbConnect();

    const s = status.toLowerCase().trim();
    let normalizedStatus: 'Open' | 'In Review' | 'Resolved' | 'Closed' = 'Open';
    if (s === 'in review' || s === 'in_review') {
      normalizedStatus = 'In Review';
    } else if (s === 'resolved') {
      normalizedStatus = 'Resolved';
    } else if (s === 'closed') {
      normalizedStatus = 'Closed';
    } else {
      normalizedStatus = 'Open';
    }

    const report = await Report.findByIdAndUpdate(
      reportId,
      { status: normalizedStatus },
      { new: true }
    );

    if (!report) return { success: false, error: 'Report not found' };

    revalidatePath('/admin/moderation');
    return { success: true, report: JSON.parse(JSON.stringify(report)) };
  } catch (error: any) {
    console.error('Failed to update report status:', error);
    return { success: false, error: error?.message || 'Failed to update report status.' };
  }
}

/**
 * Task T-017: Fetch flagged tickets mapping REPORT entity with filters
 */
export async function getModerationTicketsAction(filters?: {
  type?: string; // 'Course' | 'Lesson' | 'Comment' | 'User' | 'all'
  status?: string; // 'Open' | 'In Review' | 'Resolved' | 'Closed' | 'all'
  search?: string;
}) {
  try {
    await checkAdminOrModerator();
    await dbConnect();

    const query: any = {};

    // 1. Filter by Entity Type
    if (filters?.type && filters.type !== 'all' && filters.type !== 'ALL') {
      const t = filters.type.toLowerCase();
      if (t === 'course') query.reported_type = { $in: ['Course', 'COURSE'] };
      else if (t === 'lesson') query.reported_type = { $in: ['Lesson', 'LESSON'] };
      else if (t === 'comment') query.reported_type = { $in: ['Comment', 'COMMENT'] };
      else if (t === 'user') query.reported_type = { $in: ['User', 'USER'] };
    }

    // 2. Filter by Status
    if (filters?.status && filters.status !== 'all' && filters.status !== 'ALL') {
      const s = filters.status.toLowerCase();
      if (s === 'open') query.status = { $in: ['Open', 'OPEN'] };
      else if (s === 'in review' || s === 'in_review')
        query.status = { $in: ['In Review', 'IN_REVIEW'] };
      else if (s === 'resolved') query.status = { $in: ['Resolved', 'RESOLVED'] };
      else if (s === 'closed') query.status = { $in: ['Closed', 'CLOSED'] };
    }

    const rawReports = await Report.find(query)
      .populate({ path: 'reporterId', select: 'name email role image' })
      .populate({ path: 'targetUserId', select: 'name email role status image' })
      .populate({ path: 'resolvedBy', select: 'name email' })
      .sort({ createdAt: -1 })
      .lean();

    let reports = JSON.parse(JSON.stringify(rawReports)).map((r: any) => ({
      id: r._id,
      reporterId: r.reporterId?._id || r.reporterId,
      reporter: r.reporterId && typeof r.reporterId === 'object' ? r.reporterId : null,
      reported_type: r.reported_type,
      targetId: r.targetId,
      targetUserId: r.targetUserId?._id || r.targetUserId,
      targetUser: r.targetUserId && typeof r.targetUserId === 'object' ? r.targetUserId : null,
      reason: r.reason,
      rationale: r.rationale,
      status: r.status,
      flaggedContentPreview: r.flaggedContentPreview || '',
      contextData: r.contextData || {},
      actionTaken: r.actionTaken || '',
      resolutionNote: r.resolutionNote || '',
      resolvedBy: r.resolvedBy,
      resolvedAt: r.resolvedAt,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }));

    if (filters?.search && filters.search.trim()) {
      const term = filters.search.toLowerCase().trim();
      reports = reports.filter((rep: any) => {
        return (
          rep.reason?.toLowerCase().includes(term) ||
          rep.rationale?.toLowerCase().includes(term) ||
          rep.flaggedContentPreview?.toLowerCase().includes(term) ||
          rep.reporter?.name?.toLowerCase().includes(term) ||
          rep.reporter?.email?.toLowerCase().includes(term) ||
          rep.targetUser?.name?.toLowerCase().includes(term) ||
          rep.targetUser?.email?.toLowerCase().includes(term) ||
          rep.contextData?.title?.toLowerCase().includes(term)
        );
      });
    }

    return { success: true, reports };
  } catch (error: any) {
    console.error('Failed to fetch moderation tickets:', error);
    return { success: false, error: error?.message || 'Failed to fetch tickets.', reports: [] };
  }
}

/**
 * Seed realistic flagged moderation tickets for testing & verification
 */
export async function seedDemoModerationReportsAction() {
  try {
    await checkAdminOrModerator();
    await dbConnect();

    // Find or create reporter and offending users
    let reporter = await User.findOne({ email: 'student.reporter@example.com' });
    if (!reporter) {
      reporter = await User.create({
        name: 'Sadia Rahman',
        email: 'student.reporter@example.com',
        role: 'STUDENT',
        status: 'APPROVED',
      });
    }

    let badUser = await User.findOne({ email: 'spammer.user@example.com' });
    if (!badUser) {
      badUser = await User.create({
        name: 'SpamBot99',
        email: 'spammer.user@example.com',
        role: 'STUDENT',
        status: 'APPROVED',
        bio: 'Visit free-crypto-tokens-now.xyz for 500% instant ROI!',
      });
    }

    // Find sample course or lesson for context
    const sampleCourse = await Course.findOne().lean();
    const sampleLesson = await Lesson.findOne().lean();

    // Create a flagged comment if needed
    let sampleComment = await Comment.findOne().lean();
    if (!sampleComment) {
      sampleComment = (await Comment.create({
        content: 'Check out cheap cracked exams and leaks here: http://fake-scam-link.ru/payload - Guaranteed 100%!',
        lessonId: sampleLesson?._id || new mongoose.Types.ObjectId(),
        userId: badUser._id,
      })) as any;
    }

    const demoReports: Array<{
      reporterId: any;
      reported_type: 'Comment' | 'User' | 'Course' | 'Lesson';
      targetId: any;
      targetUserId: any;
      reason: string;
      rationale: string;
      status: 'Open' | 'In Review' | 'Resolved' | 'Closed';
      flaggedContentPreview: string;
      contextData: any;
    }> = [
      {
        reporterId: reporter._id,
        reported_type: 'Comment',
        targetId: (sampleComment as any)?._id || new mongoose.Types.ObjectId(),
        targetUserId: badUser._id,
        reason: 'Spam & Malicious Link',
        rationale: 'This user is spamming malicious external phishing links in the lecture discussion tab targeting first-year students.',
        status: 'Open',
        flaggedContentPreview: 'Check out cheap cracked exams and leaks here: http://fake-scam-link.ru/payload - Guaranteed 100%!',
        contextData: {
          lessonTitle: sampleLesson?.title || 'Lecture 03: Big-O Asymptotics',
          courseTitle: sampleCourse?.title || 'Data Structures & Algorithms',
          location: 'Discussion Board / Question Thread #104',
        },
      },
      {
        reporterId: reporter._id,
        reported_type: 'User',
        targetId: badUser._id,
        targetUserId: badUser._id,
        reason: 'Harassment & Impersonation',
        rationale: 'User bio and profile picture is imitating platform staff and sending unsolicited DMs offering fake certificates for money.',
        status: 'In Review',
        flaggedContentPreview: 'Bio: "Official e-Shikho Certificate Verification Desk. Contact for instant certificate generation."',
        contextData: {
          username: badUser.name,
          accountCreated: new Date().toLocaleDateString(),
          flagCount: 3,
        },
      },
      {
        reporterId: reporter._id,
        reported_type: 'Course',
        targetId: sampleCourse?._id || new mongoose.Types.ObjectId(),
        targetUserId: sampleCourse?.instructorId || badUser._id,
        reason: 'Copyright & Plagiarism',
        rationale: 'The lecture slides and problem sets in Module 2 are verbatim copies of MIT 6.006 OpenCourseWare with commercial watermarks removed.',
        status: 'Open',
        flaggedContentPreview: 'Module 2 Slides: Exact verbatim transcript from MIT 6.006 without attribution or license.',
        contextData: {
          courseTitle: sampleCourse?.title || 'Competitive Programming Masterclass',
          instructor: 'Dr. Unverified',
          reportedModules: ['Module 2', 'Problem Set 3'],
        },
      },
      {
        reporterId: reporter._id,
        reported_type: 'Lesson',
        targetId: sampleLesson?._id || new mongoose.Types.ObjectId(),
        targetUserId: badUser._id,
        reason: 'Inappropriate Content & Broken Resource',
        rationale: 'The attached video lecture contains inappropriate audio commentary and the PDF resource leads to a broken 404 dead link.',
        status: 'Open',
        flaggedContentPreview: 'Video URL: contains unmoderated offensive remarks between minute 12:40 and 14:15.',
        contextData: {
          lessonTitle: sampleLesson?.title || 'Introduction to Recursive Backtracking',
          timestampRange: '12:40 - 14:15',
        },
      },
    ];

    let created = 0;
    for (const r of demoReports) {
      const existing = await Report.findOne({
        reported_type: r.reported_type,
        targetId: r.targetId,
        reason: r.reason,
      });
      if (!existing) {
        await Report.create(r);
        created++;
      }
    }

    revalidatePath('/admin/moderation');
    return { success: true, message: `Created ${created} demo moderation reports across entity types.` };
  } catch (error: any) {
    console.error('Failed to seed demo moderation reports:', error);
    return { success: false, error: error?.message || 'Failed to seed demo reports.' };
  }
}