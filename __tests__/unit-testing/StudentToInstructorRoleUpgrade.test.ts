import { describe, it, expect, vi, beforeEach } from 'vitest';
import { reviewInstructorApplication, assignCourseToStudent, updateUserRole } from '@/actions/admin';
import { requestInstructorRole, enrollInCourseAction, getUserEnrolledCourses } from '@/actions/student-actions';

// Mock DB connection
vi.mock('@/lib/mongoose', () => ({
  default: vi.fn().mockResolvedValue(undefined),
}));

// Mock Next.js cache
const mockRevalidatePath = vi.fn();
vi.mock('next/cache', () => ({
  revalidatePath: (...args: any[]) => mockRevalidatePath(...args),
}));

// Mock Auth
let currentSessionUser: any = {
  id: '65f000000000000000000001',
  role: 'STUDENT',
  name: 'Student Learner',
  email: 'learner@eshikho.test',
};

vi.mock('@/auth', () => ({
  auth: vi.fn().mockImplementation(async () => ({
    user: currentSessionUser,
  })),
}));

// Mock Models
const mockUserFindById = vi.fn();
const mockUserFindByIdAndUpdate = vi.fn();
const mockUserFindOne = vi.fn();

vi.mock('@/models/User', () => ({
  default: {
    findById: (...args: any[]) => {
      const res = mockUserFindById(...args);
      return {
        session: vi.fn().mockResolvedValue(res),
        select: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue(res),
          then: (fn: any) => Promise.resolve(res).then(fn),
        }),
        lean: vi.fn().mockResolvedValue(res),
        then: (fn: any) => Promise.resolve(res).then(fn),
      };
    },
    findByIdAndUpdate: (...args: any[]) => mockUserFindByIdAndUpdate(...args),
    findOne: (...args: any[]) => {
      const res = mockUserFindOne(...args);
      return {
        select: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue(res),
          then: (fn: any) => Promise.resolve(res).then(fn),
        }),
        lean: vi.fn().mockResolvedValue(res),
        then: (fn: any) => Promise.resolve(res).then(fn),
      };
    },
  },
}));

const mockInstructorRequestFindOne = vi.fn();
const mockInstructorRequestFindById = vi.fn();
const mockInstructorRequestFindOneAndUpdate = vi.fn();

vi.mock('@/models/InstructorRequest', () => ({
  default: {
    findOne: (...args: any[]) => {
      const res = mockInstructorRequestFindOne(...args);
      return {
        lean: vi.fn().mockResolvedValue(res),
        then: (fn: any) => Promise.resolve(res).then(fn),
      };
    },
    findById: (...args: any[]) => mockInstructorRequestFindById(...args),
    findOneAndUpdate: (...args: any[]) => mockInstructorRequestFindOneAndUpdate(...args),
  },
}));

const mockInstructorProfileFindById = vi.fn();
const mockInstructorProfileFindOneAndUpdate = vi.fn();
const mockInstructorProfileCreate = vi.fn();

vi.mock('@/models/InstructorProfile', () => ({
  default: {
    findById: (...args: any[]) => mockInstructorProfileFindById(...args),
    findOneAndUpdate: (...args: any[]) => mockInstructorProfileFindOneAndUpdate(...args),
    create: (...args: any[]) => mockInstructorProfileCreate(...args),
  },
}));

const mockInstructorFindOneAndUpdate = vi.fn();
const mockInstructorFindOne = vi.fn();
const mockInstructorCreate = vi.fn();
vi.mock('@/models/Instructor', () => ({
  default: {
    findOneAndUpdate: (...args: any[]) => mockInstructorFindOneAndUpdate(...args),
    findOne: (...args: any[]) => mockInstructorFindOne(...args),
    create: (...args: any[]) => mockInstructorCreate(...args),
  },
}));

const mockCourseFindById = vi.fn();
const mockCourseFindByIdAndUpdate = vi.fn();
vi.mock('@/models/Course', () => ({
  default: {
    findById: (...args: any[]) => {
      const res = mockCourseFindById(...args);
      return {
        select: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue(res),
          then: (fn: any) => Promise.resolve(res).then(fn),
        }),
        populate: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue(res),
          then: (fn: any) => Promise.resolve(res).then(fn),
        }),
        lean: vi.fn().mockResolvedValue(res),
        then: (fn: any) => Promise.resolve(res).then(fn),
      };
    },
    findByIdAndUpdate: (...args: any[]) => mockCourseFindByIdAndUpdate(...args),
  },
}));

const mockEnrollmentFindOne = vi.fn();
const mockEnrollmentFindOneAndUpdate = vi.fn();
const mockEnrollmentFind = vi.fn();

vi.mock('@/models/Enrollment', () => ({
  default: {
    findOne: (...args: any[]) => {
      const res = mockEnrollmentFindOne(...args);
      return {
        lean: vi.fn().mockResolvedValue(res),
        then: (fn: any) => Promise.resolve(res).then(fn),
      };
    },
    find: (...args: any[]) => {
      const res = mockEnrollmentFind(...args);
      return {
        sort: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue(res),
          then: (fn: any) => Promise.resolve(res).then(fn),
        }),
        lean: vi.fn().mockResolvedValue(res),
        then: (fn: any) => Promise.resolve(res).then(fn),
      };
    },
    findOneAndUpdate: (...args: any[]) => mockEnrollmentFindOneAndUpdate(...args),
  },
}));

vi.mock('@/models/AuditLog', () => ({
  default: {
    create: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('@/models/CourseRoutine', () => ({
  default: {
    findOne: vi.fn().mockReturnValue({
      lean: vi.fn().mockResolvedValue(null),
    }),
  },
}));

describe('Student-to-Instructor Role Upgrade & Instructor Course Enrollment', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('1. Student Instructor Application Submission', () => {
    it('allows a regular student to submit an instructor application and updates InstructorProfile', async () => {
      currentSessionUser = {
        id: '65f000000000000000000001',
        role: 'STUDENT',
        name: 'Tanvir Ahmed',
        email: 'tanvir@eshikho.test',
      };

      mockInstructorRequestFindOne.mockResolvedValue(null);
      mockInstructorRequestFindOneAndUpdate.mockResolvedValue({ _id: 'req-1', status: 'PENDING' });
      mockInstructorProfileFindOneAndUpdate.mockResolvedValue({ _id: 'prof-1', approval_status: 'Pending' });

      const formData = new FormData();
      formData.set('reason', 'I have 5 years of software engineering and teaching experience.');
      formData.set('institution', 'Dhaka University');
      formData.set('subjectSpecialization', 'Computer Science');

      const res = await requestInstructorRole(formData);
      expect(res.success).toBe(true);
      expect(mockInstructorRequestFindOneAndUpdate).toHaveBeenCalled();
      expect(mockInstructorProfileFindOneAndUpdate).toHaveBeenCalledWith(
        { userId: '65f000000000000000000001' },
        expect.objectContaining({
          institution: 'Dhaka University',
          subjectSpecialization: 'Computer Science',
          approval_status: 'Pending',
        }),
        expect.any(Object)
      );
    });

    it('rejects an application from a user who is already an approved instructor', async () => {
      currentSessionUser = {
        id: '65f000000000000000000002',
        role: 'INSTRUCTOR',
        name: 'Existing Instructor',
        email: 'inst@eshikho.test',
      };

      const formData = new FormData();
      formData.set('reason', 'I want to re-apply for some reason with enough characters.');

      const res = await requestInstructorRole(formData);
      expect(res.error).toBe('আপনি ইতিমধ্যে একজন অনুমোদিত ইন্সট্রাক্টর।');
      expect(mockInstructorRequestFindOneAndUpdate).not.toHaveBeenCalled();
    });

    it('rejects an application if the reason is shorter than 20 characters', async () => {
      currentSessionUser = {
        id: '65f000000000000000000001',
        role: 'STUDENT',
        name: 'Tanvir Ahmed',
        email: 'tanvir@eshikho.test',
      };

      const formData = new FormData();
      formData.set('reason', 'Too short');

      const res = await requestInstructorRole(formData);
      expect(res.error).toContain('কমপক্ষে ২০টি অক্ষর');
    });
  });

  describe('2. Admin Approval & Student Data Preservation', () => {
    it('promotes user role to INSTRUCTOR and preserves all student progress, elo, and enrollment data', async () => {
      // Acting admin session
      currentSessionUser = {
        id: '65f000000000000000000099',
        role: 'ADMIN',
        name: 'Super Admin',
      };

      const existingStudentData = {
        _id: '65f000000000000000000001',
        name: 'Tanvir Ahmed',
        email: 'tanvir@eshikho.test',
        role: 'STUDENT',
        status: 'APPROVED',
        elo: 1650,
        competitiveElo: 1520,
        streak: 14,
        problemsSolved: 85,
        completedCoursesCount: 3,
        academicBackground: 'Computer Science & Engineering (CSE)',
        targetTrack: 'Fullstack Next.js',
        interests: ['React', 'Algorithms'],
        skills: ['TypeScript', 'Node.js'],
        eloHistory: [{ date: new Date(), oldElo: 1600, newElo: 1650, delta: 50, contestTitle: 'Contest #1' }],
      };

      mockUserFindById.mockResolvedValue(existingStudentData);

      const mockProfile = {
        _id: 'prof-123',
        userId: '65f000000000000000000001',
        institution: 'BUET',
        qualifications: ['M.Sc in CSE'],
        experienceYears: 4,
        subjectSpecialization: 'Software Architecture',
        bio: 'Passionate developer & mentor',
        approval_status: 'Pending',
        save: vi.fn().mockResolvedValue(true),
      };

      mockInstructorProfileFindById.mockResolvedValue(mockProfile);
      mockInstructorFindOneAndUpdate.mockResolvedValue({ _id: 'inst-1', name: 'Tanvir Ahmed' });

      // Review application with approval
      const result = await reviewInstructorApplication('prof-123', 'Approved', 'Great credentials.');

      expect(result.success).toBe(true);
      expect(mockProfile.approval_status).toBe('Approved');

      // Verifies that only role was updated to INSTRUCTOR without touching or resetting student attributes
      expect(mockUserFindByIdAndUpdate).toHaveBeenCalledWith(
        '65f000000000000000000001',
        { role: 'INSTRUCTOR' },
        undefined
      );

      // Verifies Instructor catalog entity is upserted with user profile
      expect(mockInstructorFindOneAndUpdate).toHaveBeenCalledWith(
        { name: 'Tanvir Ahmed' },
        expect.objectContaining({
          name: 'Tanvir Ahmed',
          role: 'Software Architecture',
        }),
        expect.any(Object)
      );

      // Verify that user _id did NOT change and student data remained intact
      expect(existingStudentData._id).toBe('65f000000000000000000001');
      expect(existingStudentData.elo).toBe(1650);
      expect(existingStudentData.streak).toBe(14);
      expect(existingStudentData.problemsSolved).toBe(85);
      expect(existingStudentData.completedCoursesCount).toBe(3);
    });
  });

  describe('3. Instructor Course Enrollment & Self-Enrollment / Duplicate Prevention', () => {
    it('allows an approved instructor to enroll in an eligible course created by another instructor', async () => {
      // Instructor user session
      currentSessionUser = {
        id: '65f000000000000000000002',
        role: 'INSTRUCTOR',
        name: 'Instructor Learner',
        email: 'instructor_learner@eshikho.test',
      };

      // Course created by a DIFFERENT instructor
      const otherInstructorCourse = {
        _id: '65f000000000000000000088',
        title: 'Deep Learning & Neural Networks',
        createdById: '65f000000000000000000099', // Different author
        price: 0, // Free course
        status: 'PUBLISHED',
        studentsEnrolled: 10,
        approvalStatus: 'APPROVED',
      };

      mockCourseFindById.mockResolvedValue(otherInstructorCourse);
      mockEnrollmentFindOne.mockResolvedValue(null); // Not yet enrolled
      mockEnrollmentFindOneAndUpdate.mockResolvedValue({
        _id: 'enr-new',
        userId: '65f000000000000000000002',
        courseId: '65f000000000000000000088',
        paymentStatus: 'success',
      });

      const res = await enrollInCourseAction('65f000000000000000000088');

      expect(res.success).toBe(true);
      expect(res.enrolled).toBe(true);
      expect(mockEnrollmentFindOneAndUpdate).toHaveBeenCalledWith(
        { userId: '65f000000000000000000002', courseId: '65f000000000000000000088' },
        expect.objectContaining({ paymentStatus: 'success', amountPaid: 0 }),
        expect.any(Object)
      );
      expect(mockCourseFindByIdAndUpdate).toHaveBeenCalledWith(
        '65f000000000000000000088',
        { $inc: { studentsEnrolled: 1 } }
      );
    });

    it('blocks an instructor from enrolling in their own course (self-enrollment prevention)', async () => {
      // Instructor user session
      currentSessionUser = {
        id: '65f000000000000000000002',
        role: 'INSTRUCTOR',
        name: 'Instructor Author',
        email: 'author@eshikho.test',
      };

      // Course created by THIS instructor
      const ownCourse = {
        _id: '65f000000000000000000077',
        title: 'My Own Next.js Masterclass',
        createdById: '65f000000000000000000002', // Same author ID!
        price: 1500,
        status: 'PUBLISHED',
        studentsEnrolled: 50,
      };

      mockCourseFindById.mockResolvedValue(ownCourse);

      const res = await enrollInCourseAction('65f000000000000000000077');

      expect(res.success).toBe(false);
      expect(res.error).toBe('ইন্সট্রাক্টরগণ তাদের নিজস্ব কোর্সে শিক্ষার্থী হিসেবে এনরোল করতে পারবেন না।');
      expect(mockEnrollmentFindOneAndUpdate).not.toHaveBeenCalled();
    });

    it('prevents duplicate enrollment if user is already enrolled in the course', async () => {
      currentSessionUser = {
        id: '65f000000000000000000002',
        role: 'INSTRUCTOR',
        name: 'Instructor Learner',
        email: 'instructor_learner@eshikho.test',
      };

      const existingCourse = {
        _id: '65f000000000000000000055',
        title: 'Distributed Systems',
        createdById: '65f000000000000000000099',
        price: 2000,
        status: 'PUBLISHED',
      };

      mockCourseFindById.mockResolvedValue(existingCourse);
      // Already enrolled
      mockEnrollmentFindOne.mockResolvedValue({
        _id: 'enr-existing',
        userId: '65f000000000000000000002',
        courseId: '65f000000000000000000055',
        paymentStatus: 'success',
      });

      const res = await enrollInCourseAction('65f000000000000000000055');

      expect(res.success).toBe(false);
      expect(res.alreadyEnrolled).toBe(true);
      expect(res.error).toBe('আপনি ইতিমধ্যে এই কোর্সে এনরোল করেছেন।');
      expect(mockEnrollmentFindOneAndUpdate).not.toHaveBeenCalled();
    });

    it('returns payment checkout URL for paid course enrollment by instructor', async () => {
      currentSessionUser = {
        id: '65f000000000000000000002',
        role: 'INSTRUCTOR',
        name: 'Instructor Learner',
        email: 'instructor_learner@eshikho.test',
      };

      const paidCourse = {
        _id: '65f000000000000000000033',
        title: 'Advanced Microservices Architecture',
        createdById: '65f000000000000000000099',
        price: 3500,
        status: 'PUBLISHED',
      };

      mockCourseFindById.mockResolvedValue(paidCourse);
      mockEnrollmentFindOne.mockResolvedValue(null);

      const res = await enrollInCourseAction('65f000000000000000000033');

      expect(res.success).toBe(true);
      expect(res.requiresPayment).toBe(true);
      expect(res.checkoutUrl).toBe('/payment/65f000000000000000000033');
    });
  });

  describe('4. Superadmin Course Assignment Logic', () => {
    it('prevents superadmin from assigning a course to its own creator/instructor', async () => {
      currentSessionUser = {
        id: '65f000000000000000000000',
        role: 'SUPERADMIN',
        name: 'Super Admin',
      };

      mockUserFindById.mockResolvedValue({
        _id: '65f000000000000000000002',
        role: 'INSTRUCTOR',
        name: 'Course Creator',
      });

      mockCourseFindById.mockResolvedValue({
        _id: '65f000000000000000000044',
        title: 'Machine Learning Fundamentals',
        createdById: '65f000000000000000000002', // Author matches target user!
      });

      const res = await assignCourseToStudent('65f000000000000000000002', '65f000000000000000000044');
      expect(res.success).toBe(false);
      expect(res.error).toBe('Cannot assign a course to its own creator/instructor.');
    });

    it('prevents duplicate assignment if learner is already enrolled', async () => {
      currentSessionUser = {
        id: '65f000000000000000000000',
        role: 'SUPERADMIN',
        name: 'Super Admin',
      };

      mockUserFindById.mockResolvedValue({
        _id: '65f000000000000000000002',
        role: 'INSTRUCTOR',
        name: 'Course Creator',
      });

      mockCourseFindById.mockResolvedValue({
        _id: '65f000000000000000000044',
        title: 'Machine Learning Fundamentals',
        createdById: '65f000000000000000000099', // Different author
      });

      mockEnrollmentFindOne.mockResolvedValue({
        _id: 'enr-1',
        userId: '65f000000000000000000002',
        courseId: '65f000000000000000000044',
        paymentStatus: 'GRANTED',
      });

      const res = await assignCourseToStudent('65f000000000000000000002', '65f000000000000000000044');
      expect(res.success).toBe(false);
      expect(res.error).toContain('already enrolled');
    });
  });

  describe('5. Unified Enrolled Courses Retrieval for Instructors', () => {
    it('retrieves all courses enrolled when user was a student without having to go back to student profile', async () => {
      const instructorId = '65f000000000000000000002';

      // Past student enrollments
      mockEnrollmentFind.mockResolvedValue([
        {
          _id: 'enr-student-1',
          userId: instructorId,
          courseId: '65f000000000000000000101',
          paymentStatus: 'success',
          enrolledAt: new Date('2025-01-15'),
        },
      ]);

      mockCourseFindById.mockResolvedValue({
        _id: '65f000000000000000000101',
        title: 'Python for Beginners & Data Science',
        category: 'programming',
        price: 0,
        status: 'PUBLISHED',
        thumbnailUrl: '/images/python.jpg',
      });

      const enrolledCourses = await getUserEnrolledCourses(instructorId);

      expect(enrolledCourses).toHaveLength(1);
      expect(enrolledCourses[0]!.id).toBe('65f000000000000000000101');
      expect(enrolledCourses[0]!.title).toBe('Python for Beginners & Data Science');
      expect(enrolledCourses[0]!.progressPercentage).toBeGreaterThanOrEqual(0);
    });

    it('aggregates both student-enrolled courses and newly instructor-enrolled courses in the enrolled courses list', async () => {
      const instructorId = '65f000000000000000000002';

      // Two enrollments: one enrolled when user was student, one enrolled as instructor
      mockEnrollmentFind.mockResolvedValue([
        {
          _id: 'enr-student-1',
          userId: instructorId,
          courseId: '65f000000000000000000101',
          paymentStatus: 'success',
          enrolledAt: new Date('2025-01-15'),
        },
        {
          _id: 'enr-instructor-2',
          userId: instructorId,
          courseId: '65f000000000000000000202',
          paymentStatus: 'success',
          enrolledAt: new Date('2025-06-20'),
        },
      ]);

      mockCourseFindById.mockImplementation((id: string) => {
        if (id === '65f000000000000000000101') {
          return {
            _id: '65f000000000000000000101',
            title: 'Algorithms & Problem Solving (Student Era)',
            category: 'programming',
            price: 1500,
          };
        }
        return {
          _id: '65f000000000000000000202',
          title: 'Docker & Kubernetes (Instructor Era)',
          category: 'devops',
          price: 2500,
        };
      });

      const enrolledCourses = await getUserEnrolledCourses(instructorId);

      expect(enrolledCourses).toHaveLength(2);
      expect(enrolledCourses.map((c: any) => c.title)).toContain('Algorithms & Problem Solving (Student Era)');
      expect(enrolledCourses.map((c: any) => c.title)).toContain('Docker & Kubernetes (Instructor Era)');
    });

    it('revalidates both student and instructor dashboard paths when enrolling', async () => {
      currentSessionUser = {
        id: '65f000000000000000000002',
        role: 'INSTRUCTOR',
        name: 'Instructor Learner',
        email: 'instructor_learner@eshikho.test',
      };

      const eligibleCourse = {
        _id: '65f000000000000000000303',
        title: 'Cloud Architecture Essentials',
        createdById: '65f000000000000000000999', // Another instructor
        price: 0,
        status: 'PUBLISHED',
        studentsEnrolled: 5,
      };

      mockCourseFindById.mockResolvedValue(eligibleCourse);
      mockEnrollmentFindOne.mockResolvedValue(null);
      mockEnrollmentFindOneAndUpdate.mockResolvedValue({ _id: 'enr-new' });

      mockRevalidatePath.mockClear();

      const res = await enrollInCourseAction('65f000000000000000000303');
      expect(res.success).toBe(true);

      // Verifies both student and instructor paths are revalidated
      expect(mockRevalidatePath).toHaveBeenCalledWith('/student');
      expect(mockRevalidatePath).toHaveBeenCalledWith('/instructor');
      expect(mockRevalidatePath).toHaveBeenCalledWith('/courses/65f000000000000000000303');
    });
  });

  describe('5. Admin Role Promotion and Auto-Revalidation for Instructors', () => {
    it('promotes user role to INSTRUCTOR and revalidates all student and instructor dashboard paths', async () => {
      currentSessionUser = {
        id: '65f000000000000000000099',
        role: 'SUPERADMIN',
        name: 'Super Administrator',
        email: 'superadmin@eshikho.test',
      };

      const targetUserId = '65f000000000000000000123';
      const userDoc = {
        _id: targetUserId,
        name: 'Intisar Khan',
        email: '01792616710@phone.esikho.com',
        role: 'STUDENT',
      };

      mockUserFindById.mockResolvedValue(userDoc);
      mockUserFindByIdAndUpdate.mockResolvedValue({ ...userDoc, role: 'INSTRUCTOR' });
      mockInstructorFindOne.mockResolvedValue(null);
      mockInstructorCreate.mockResolvedValue({ _id: 'inst-123', name: 'Intisar Khan' });

      mockRevalidatePath.mockClear();

      const res = await updateUserRole(targetUserId, 'INSTRUCTOR');

      expect(res.success).toBe(true);
      expect(mockUserFindByIdAndUpdate).toHaveBeenCalledWith(targetUserId, { role: 'INSTRUCTOR' });
      expect(mockInstructorCreate).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Intisar Khan' })
      );

      // Verifies all student & instructor settings and dashboard paths are refreshed
      expect(mockRevalidatePath).toHaveBeenCalledWith('/admin');
      expect(mockRevalidatePath).toHaveBeenCalledWith('/admin/dashboard');
      expect(mockRevalidatePath).toHaveBeenCalledWith('/student');
      expect(mockRevalidatePath).toHaveBeenCalledWith('/student/settings');
      expect(mockRevalidatePath).toHaveBeenCalledWith('/instructor');
      expect(mockRevalidatePath).toHaveBeenCalledWith('/instructor/settings');
    });
  });
  it.each(['DRAFT', 'PENDING_REVIEW'])('does not enroll students in %s courses', async (status) => {
    currentSessionUser = { id: '65f000000000000000000002', role: 'STUDENT', email: 'student@example.test' };
    mockCourseFindById.mockResolvedValue({ _id: '65f000000000000000000033', status, price: 0 });
    expect((await enrollInCourseAction('65f000000000000000000033')).success).toBe(false);
    expect(mockEnrollmentFindOneAndUpdate).not.toHaveBeenCalled();
  });

});

