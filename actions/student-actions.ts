'use server';

import { auth } from '@/auth';
import dbConnect from '@/lib/mongoose';
import User from '@/models/User';
import InstructorRequest from '@/models/InstructorRequest';
import InstructorProfile from '@/models/InstructorProfile';
import Course from '@/models/Course';
import Enrollment from '@/models/Enrollment';
import { getCourseById } from '@/lib/courses-data';
import { hashPassword, verifyPassword, normalizePhone, isValidBDPhone, isValidMongoObjectId } from '@/lib/auth-helpers';
import { revalidatePath } from 'next/cache';

/**
 * Requests elevation from student to instructor role
 */
export async function requestInstructorRole(formData: FormData) {
  const session = await auth();
  const userId = (session?.user as { id?: string; role?: string } | undefined)?.id;
  const userEmail = (session?.user as { email?: string } | undefined)?.email;
  const role = (session?.user as { role?: string } | undefined)?.role;
  const reason = String(formData.get('reason') || '').trim();

  if (role === 'INSTRUCTOR') {
    return { error: 'আপনি ইতিমধ্যে একজন অনুমোদিত ইন্সট্রাক্টর।' };
  }
  if (!userId || role !== 'STUDENT') return { error: 'শুধুমাত্র শিক্ষার্থীরা এই আবেদন জমা দিতে পারেন।' };
  if (reason.length < 20) return { error: 'অনুগ্রহ করে আপনার অভিজ্ঞতা ব্যাখ্যা করে কমপক্ষে ২০টি অক্ষর লিখুন।' };

  await dbConnect();

  let safeUserId = userId;
  if (!isValidMongoObjectId(safeUserId) && userEmail) {
    const u = (await User.findOne({ email: userEmail }).select('_id role').lean()) as any;
    if (u) {
      safeUserId = u._id.toString();
      if (u.role === 'INSTRUCTOR') {
        return { error: 'আপনি ইতিমধ্যে একজন অনুমোদিত ইন্সট্রাক্টর।' };
      }
    }
  }
  if (!isValidMongoObjectId(safeUserId)) {
    return { error: 'ইউজার অ্যাকাউন্ট যাচাই করা যায়নি।' };
  }

  const existing = await InstructorRequest.findOne({ userId: safeUserId });
  if (existing && ['PENDING', 'ADMIN_APPROVED', 'SUPERADMIN_APPROVED', 'APPROVED'].includes(existing.status)) {
    return { error: 'আপনার একটি সক্রিয় ইন্সট্রাক্টর রিকোয়েস্ট ইতিমধ্যে প্রক্রিয়াধীন রয়েছে।' };
  }

  await InstructorRequest.findOneAndUpdate(
    { userId: safeUserId },
    { reason, status: 'PENDING', adminApprovedAt: null, superadminApprovedAt: null, reviewedAt: null },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  const institution = String(formData.get('institution') || 'Independent / Institutional Educator');
  const subjectSpecialization = String(formData.get('subjectSpecialization') || 'Computer Science & Software Development');
  const experienceYears = Number(formData.get('experienceYears')) || 2;
  const rawQualifications = formData.get('qualifications');
  const qualifications = rawQualifications
    ? String(rawQualifications).split(',').map((s) => s.trim()).filter(Boolean)
    : ['Bachelor Degree / Specialized Professional'];

  await InstructorProfile.findOneAndUpdate(
    { userId: safeUserId },
    {
      institution,
      qualifications,
      experienceYears,
      subjectSpecialization,
      bio: reason,
      approval_status: 'Pending',
      submissionDate: new Date(),
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  revalidatePath('/student');
  revalidatePath('/admin');
  revalidatePath('/admin/dashboard');
  revalidatePath('/admin/instructors/pending');
  return { success: true };
}

/**
 * Fetches current authenticated student profile details
 */
export async function getStudentProfileAction() {
  try {
    const session = await auth();
    const sessionUserId = (session?.user as any)?.id;
    const sessionUserEmail = (session?.user as any)?.email;
    if (!sessionUserId && !sessionUserEmail) return { error: 'লগইন আবশ্যক।' };

    await dbConnect();

    let query: any = null;
    if (isValidMongoObjectId(sessionUserId)) {
      query = { _id: sessionUserId };
    } else if (typeof sessionUserId === 'string' && sessionUserId.includes('@')) {
      query = { email: sessionUserId };
    } else if (sessionUserEmail) {
      query = { email: sessionUserEmail };
    }

    if (!query) return { error: 'ইউজার প্রোফাইল পাওয়া যায়নি।' };

    const user = await User.findOne(query).select('-password').lean() as any;
    if (!user) return { error: 'ইউজার প্রোফাইল পাওয়া যায়নি।' };

    return {
      success: true,
      profile: {
        id: user._id.toString(),
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        headline: user.headline || '',
        bio: user.bio || '',
        targetTrack: user.targetTrack || '',
        academicBackground: user.academicBackground || '',
        educationLevel: user.educationLevel || '',
        department: user.department || '',
        weeklyGoalHours: user.weeklyGoalHours || 10,
        interests: Array.isArray(user.interests) ? user.interests : [],
        skills: Array.isArray(user.skills) ? user.skills : [],
        elo: user.elo || 1200,
        competitiveElo: user.competitiveElo || 1200,
        problemsSolved: user.problemsSolved || 0,
        completedCoursesCount: user.completedCoursesCount || 0,
        streak: user.streak || 0,
        image: user.image || '',
        role: user.role,
        status: user.status,
      },
    };
  } catch (error: any) {
    console.error('Failed to get student profile:', error);
    return { error: 'প্রোফাইল লোড করতে ব্যর্থ হয়েছে।' };
  }
}

/**
 * Updates student general profile, learning goals, interests & skills
 */
export async function updateStudentProfileAction(data: {
  name?: string;
  phone?: string;
  headline?: string;
  bio?: string;
  targetTrack?: string;
  academicBackground?: string;
  educationLevel?: string;
  department?: string;
  weeklyGoalHours?: number;
  interests?: string[];
  skills?: string[];
}) {
  try {
    const session = await auth();
    const sessionUserId = (session?.user as any)?.id;
    if (!sessionUserId) return { error: 'লগইন আবশ্যক।' };

    if (data.name !== undefined && data.name.trim().length < 2) {
      return { error: 'নামে কমপক্ষে ২টি অক্ষর থাকতে হবে।' };
    }

    await dbConnect();

    let query: any = null;
    const sessionUserEmail = (session?.user as any)?.email;
    if (isValidMongoObjectId(sessionUserId)) {
      query = { _id: sessionUserId };
    } else if (typeof sessionUserId === 'string' && sessionUserId.includes('@')) {
      query = { email: sessionUserId };
    } else if (sessionUserEmail) {
      query = { email: sessionUserEmail };
    }

    if (!query) return { error: 'ইউজার খুঁজে পাওয়া যায়নি।' };

    if (data.educationLevel !== undefined && !['', 'SCHOOL', 'COLLEGE', 'UNIVERSITY'].includes(data.educationLevel)) return { error: 'Choose a valid education level.' };
    if (data.department !== undefined && (typeof data.department !== 'string' || data.department.trim().length > 100)) return { error: 'Department must be at most 100 characters.' };
    const updateFields: any = {};
    if (data.educationLevel) updateFields.educationLevel = data.educationLevel;
    if (data.department !== undefined) updateFields.department = data.department.trim();
    if (data.name !== undefined) updateFields.name = data.name.trim();
    if (data.headline !== undefined) updateFields.headline = data.headline?.trim() || '';
    if (data.bio !== undefined) updateFields.bio = data.bio?.trim() || '';
    if (data.targetTrack !== undefined) updateFields.targetTrack = data.targetTrack || 'Fullstack Web Development';
    if (data.academicBackground !== undefined) updateFields.academicBackground = data.academicBackground || '';
    if (data.weeklyGoalHours !== undefined) updateFields.weeklyGoalHours = Number(data.weeklyGoalHours) || 10;

    if (Array.isArray(data.interests)) {
      updateFields.interests = data.interests.map((s) => String(s).trim()).filter(Boolean);
    }
    if (Array.isArray(data.skills)) {
      updateFields.skills = data.skills.map((s) => String(s).trim()).filter(Boolean);
    }

    if (data.phone) {
      const cleanPhone = normalizePhone(data.phone);
      if (!isValidBDPhone(cleanPhone)) {
        return { error: 'সঠিক বাংলাদেশী মোবাইল নম্বর (যেমন: 017XXXXXXXX) দিন।' };
      }
      updateFields.phone = cleanPhone;
    }

    await User.findOneAndUpdate(query, { $set: updateFields, ...(data.educationLevel === '' ? { $unset: { educationLevel: 1 } } : {}) });

    revalidatePath('/');
    revalidatePath('/student');
    revalidatePath('/student/settings');
    return { success: true };
  } catch (error: any) {
    console.error('Failed to update student profile:', error);
    return { error: 'প্রোফাইল আপডেট ব্যর্থ হয়েছে।' };
  }
}

/**
 * Updates student password securely with scrypt validation
 */
export async function updateStudentPasswordAction(data: {
  currentPassword?: string;
  newPassword: string;
}) {
  try {
    const session = await auth();
    const sessionUserId = (session?.user as any)?.id;
    if (!sessionUserId) return { error: 'লগইন আবশ্যক।' };

    if (!data.newPassword || data.newPassword.length < 6) {
      return { error: 'নতুন পাসওয়ার্ডে কমপক্ষে ৬টি অক্ষর থাকতে হবে।' };
    }

    await dbConnect();

    let query: any = null;
    const sessionUserEmail = (session?.user as any)?.email;
    if (isValidMongoObjectId(sessionUserId)) {
      query = { _id: sessionUserId };
    } else if (typeof sessionUserId === 'string' && sessionUserId.includes('@')) {
      query = { email: sessionUserId };
    } else if (sessionUserEmail) {
      query = { email: sessionUserEmail };
    }

    if (!query) return { error: 'ইউজার খুঁজে পাওয়া যায়নি।' };

    const user = await User.findOne(query);
    if (!user) return { error: 'ইউজার খুঁজে পাওয়া যায়নি।' };

    // If user already has a password set, verify the current one
    if (user.password && data.currentPassword) {
      const isMatch = verifyPassword(data.currentPassword, user.password);
      if (!isMatch) {
        return { error: 'বর্তমান পাসওয়ার্ডটি ভুল দেওয়া হয়েছে।' };
      }
    }

    user.password = hashPassword(data.newPassword);
    await user.save();

    revalidatePath('/student/settings');
    return { success: true };
  } catch (error: any) {
    console.error('Failed to update password:', error);
    return { error: 'পাসওয়ার্ড পরিবর্তন ব্যর্থ হয়েছে।' };
  }
}

/**
 * Enrolls a user (Student or Instructor) in an eligible course.
 * Ensures:
 * 1. Instructors can enroll in courses created by other instructors.
 * 2. Self-enrollment prevention (instructors cannot enroll in their own course).
 * 3. Duplicate enrollment prevention (cannot double enroll in the same course).
 * 4. Free courses (price === 0) are directly activated.
 * 5. Paid courses return checkout / payment URL.
 */
export async function enrollInCourseAction(courseId: string) {
  try {
    const session = await auth();
    const sessionUser = session?.user as { id?: string; email?: string; role?: string } | undefined;
    if (!sessionUser?.id && !sessionUser?.email) {
      return { success: false, error: 'কোর্সে ভর্তি হতে অনুগ্রহ করে প্রথমে লগইন করুন।' };
    }

    await dbConnect();

    // Resolve safe userId
    let safeUserId = sessionUser.id;
    if (!isValidMongoObjectId(safeUserId) && sessionUser.email) {
      const u = (await User.findOne({ email: sessionUser.email }).select('_id role').lean()) as any;
      if (u) safeUserId = u._id.toString();
    }
    if (!isValidMongoObjectId(safeUserId)) {
      return { success: false, error: 'ইউজার অ্যাকাউন্ট যাচাই করা যায়নি।' };
    }

    // 1. Locate course (check DB first, then static fallback)
    let course: any = null;
    let isDbCourse = false;
    if (isValidMongoObjectId(courseId)) {
      course = await Course.findById(courseId);
      if (course) isDbCourse = true;
    }
    if (!course) {
      const staticCourse = getCourseById(courseId);
      if (staticCourse) {
        course = staticCourse;
      }
    }

    if (!course) {
      return { success: false, error: 'নির্বাচিত কোর্সটি খুঁজে পাওয়া যায়নি।' };
    }

    if (isDbCourse && course.status !== 'PUBLISHED') return { success: false, error: 'This course is not published for enrollment.' };

    // 2. Prevent self-enrollment (instructors cannot enroll in their own course)
    if (course.createdById && safeUserId && course.createdById.toString() === safeUserId.toString()) {
      return {
        success: false,
        error: 'ইন্সট্রাক্টরগণ তাদের নিজস্ব কোর্সে শিক্ষার্থী হিসেবে এনরোল করতে পারবেন না।',
      };
    }

    // 3. Prevent duplicate enrollment
    const existingEnrollment = await Enrollment.findOne({
      userId: safeUserId,
      courseId,
      paymentStatus: { $in: ['success', 'GRANTED', 'granted'] },
    });

    if (existingEnrollment) {
      return {
        success: false,
        error: 'আপনি ইতিমধ্যে এই কোর্সে এনরোল করেছেন।',
        alreadyEnrolled: true,
      };
    }

    const price = Number(course.price ?? 0);

    // 4. Handle free course enrollment directly
    if (price === 0) {
      const transactionId = `FREE-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
      await Enrollment.findOneAndUpdate(
        { userId: safeUserId, courseId },
        {
          paymentStatus: 'success',
          transactionId,
          amountPaid: 0,
          enrolledAt: new Date(),
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      // Increment student count if db course
      if (isDbCourse) {
        await Course.findByIdAndUpdate(courseId, { $inc: { studentsEnrolled: 1 } });
      }

      revalidatePath('/student');
      revalidatePath('/instructor');
      revalidatePath(`/courses/${courseId}`);
      return {
        success: true,
        enrolled: true,
        message: 'ফ্রি কোর্সে আপনার ভর্তি সফল হয়েছে!',
      };
    }

    // 5. Paid course: return checkout url
    return {
      success: true,
      requiresPayment: true,
      checkoutUrl: `/payment/${courseId}`,
    };
  } catch (error: any) {
    console.error('Failed to enroll in course:', error);
    return { success: false, error: 'কোর্স এনরোলমেন্ট প্রক্রিয়াকরণ ব্যর্থ হয়েছে।' };
  }
}

/**
 * Fetches all enrolled courses for any user (Student or Instructor),
 * preserving all enrollments from student and instructor periods.
 */
export async function getUserEnrolledCourses(safeUserId: string) {
  try {
    await dbConnect();

    // Query enrollments for this user
    const enrollments = await Enrollment.find({
      userId: safeUserId,
      paymentStatus: { $in: ['success', 'GRANTED', 'granted'] },
    })
      .sort({ enrolledAt: -1, createdAt: -1 })
      .lean();

    if (!enrollments || enrollments.length === 0) {
      return [];
    }

    let CourseRoutine: any = null;
    try {
      const routineMod = await import('@/models/CourseRoutine');
      CourseRoutine = routineMod.default;
    } catch {}

    const enrolledCourses = (
      await Promise.all(
        enrollments.map(async (e: any) => {
          const courseIdStr = String(e.courseId);
          const staticCourse = getCourseById(courseIdStr);

          let userRoutine: any = null;
          if (CourseRoutine) {
            try {
              userRoutine = await CourseRoutine.findOne({ userId: safeUserId, courseId: courseIdStr }).lean();
            } catch {}
          }

          let targetCompletionDate = new Date(new Date().setMonth(new Date().getMonth() + 2))
            .toISOString()
            .split('T')[0];
          let paceMode: string | undefined = undefined;
          let progressPercentage = 25;

          if (userRoutine) {
            if (userRoutine.targetCompletionDate) {
              targetCompletionDate = new Date(userRoutine.targetCompletionDate)
                .toISOString()
                .split('T')[0];
            }
            paceMode = userRoutine.paceMode;
            const items = userRoutine.items || [];
            const totalItems = items.length || 1;
            const completedItems = items.filter((i: any) => i.completed).length;

            if (totalItems > 0 && completedItems > 0) {
              progressPercentage = Math.round((completedItems / totalItems) * 100);
            }
          }

          if (staticCourse) {
            return {
              id: staticCourse.id,
              title: staticCourse.title,
              titleEn: staticCourse.titleEn || '',
              thumbnailUrl: staticCourse.thumbnailUrl,
              thumbnailUrlEn: staticCourse.thumbnailUrlEn || '',
              progressPercentage,
              targetCompletionDate,
              paceMode,
              category: staticCourse.category,
              price: staticCourse.price,
              enrolledAt: e.enrolledAt
                ? new Date(e.enrolledAt).toISOString()
                : (e.createdAt ? new Date(e.createdAt).toISOString() : new Date().toISOString()),
            };
          }

          try {
            const dbCourse = (await Course.findById(courseIdStr).lean()) as any;
            if (dbCourse) {
              return {
                id: dbCourse._id.toString(),
                title: dbCourse.title,
                titleEn: dbCourse.titleEn || '',
                thumbnailUrl: dbCourse.thumbnailUrl || '/images/default-course.jpg',
                thumbnailUrlEn: dbCourse.thumbnailUrlEn || '',
                progressPercentage,
                targetCompletionDate,
                paceMode,
                category: dbCourse.category,
                price: dbCourse.price,
                enrolledAt: e.enrolledAt
                  ? new Date(e.enrolledAt).toISOString()
                  : (e.createdAt ? new Date(e.createdAt).toISOString() : new Date().toISOString()),
              };
            }
          } catch {}
          return null;
        })
      )
    ).filter(Boolean);

    return enrolledCourses;
  } catch (err) {
    console.warn('Error fetching enrolled courses for user:', err);
    return [];
  }
}

