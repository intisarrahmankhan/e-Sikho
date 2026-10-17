import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  reviewInstructorApplication,
  getInstructorApplicationsAction,
  seedDemoInstructorApplicationsAction,
} from '@/actions/admin';

// Mock Mongoose connection
vi.mock('@/lib/mongoose', () => ({
  default: vi.fn().mockResolvedValue(undefined),
}));

// Mock Auth - Admin user
const mockAuth = vi.fn().mockResolvedValue({
  user: { id: 'admin-123', role: 'ADMIN', name: 'Admin User' },
});
vi.mock('@/auth', () => ({
  auth: () => mockAuth(),
}));

// Mock AuditLog
const mockAuditLogCreate = vi.fn().mockResolvedValue(undefined);
vi.mock('@/models/AuditLog', () => ({
  default: {
    create: (...args: any[]) => mockAuditLogCreate(...args),
  },
}));

// Mock Next.js cache
const mockRevalidatePath = vi.fn();
vi.mock('next/cache', () => ({
  revalidatePath: (...args: any[]) => mockRevalidatePath(...args),
}));

// Mock User model
const mockUserFindById = vi.fn();
const mockUserFindByIdAndUpdate = vi.fn();
const mockUserFindOne = vi.fn();
const mockUserCreate = vi.fn();

vi.mock('@/models/User', () => ({
  default: {
    findById: (...args: any[]) => {
      const res = mockUserFindById(...args);
      return {
        session: vi.fn().mockResolvedValue(res),
        lean: vi.fn().mockResolvedValue(res),
        then: (fn: any) => Promise.resolve(res).then(fn),
      };
    },
    findByIdAndUpdate: (...args: any[]) => mockUserFindByIdAndUpdate(...args),
    findOne: (...args: any[]) => ({
      lean: vi.fn().mockResolvedValue(mockUserFindOne(...args)),
      then: (fn: any) => Promise.resolve(mockUserFindOne(...args)).then(fn),
    }),
    create: (...args: any[]) => mockUserCreate(...args),
  },
}));

// Mock Instructor model
const mockInstructorFindOneAndUpdate = vi.fn().mockResolvedValue({});
vi.mock('@/models/Instructor', () => ({
  default: {
    findOneAndUpdate: (...args: any[]) => mockInstructorFindOneAndUpdate(...args),
  },
}));

// Mock InstructorRequest model
const mockInstructorRequestFindById = vi.fn();
const mockInstructorRequestFindOneAndUpdate = vi.fn().mockResolvedValue({});
vi.mock('@/models/InstructorRequest', () => ({
  default: {
    findById: (...args: any[]) => mockInstructorRequestFindById(...args),
    findOneAndUpdate: (...args: any[]) => mockInstructorRequestFindOneAndUpdate(...args),
    find: vi.fn().mockReturnValue({
      populate: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue([]),
      }),
    }),
  },
}));

// Mock InstructorProfile model
const mockProfileFindById = vi.fn();
const mockProfileFind = vi.fn();
const mockProfileCreate = vi.fn();
const mockProfileFindOne = vi.fn();

vi.mock('@/models/InstructorProfile', () => ({
  default: {
    findById: (...args: any[]) => mockProfileFindById(...args),
    find: (...args: any[]) => ({
      populate: vi.fn().mockReturnValue({
        populate: vi.fn().mockReturnValue({
          sort: vi.fn().mockReturnValue({
            lean: vi.fn().mockResolvedValue(mockProfileFind(...args) || []),
          }),
        }),
      }),
    }),
    create: (...args: any[]) => mockProfileCreate(...args),
    findOne: (...args: any[]) => mockProfileFindOne(...args),
  },
}));

describe('Task T-015 & T-016: Instructor Application Review & Role Transition', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({
      user: { id: 'admin-123', role: 'ADMIN', name: 'Admin User' },
    });
  });

  describe('reviewInstructorApplication (Task T-016)', () => {
    it('approves application: sets approval_status="Approved", remarks, and promotes user role to "INSTRUCTOR"', async () => {
      const mockSave = vi.fn().mockResolvedValue(true);
      const mockProfile = {
        _id: 'profile-001',
        userId: 'student-999',
        institution: 'BUET',
        qualifications: ['Ph.D. Computer Science'],
        subjectSpecialization: 'Distributed Systems',
        bio: 'Passionate about systems',
        approval_status: 'Pending',
        remarks: '',
        save: mockSave,
      };

      mockProfileFindById.mockResolvedValue(mockProfile);
      mockUserFindById.mockResolvedValue({
        _id: 'student-999',
        name: 'Tanvir Hasan',
        email: 'tanvir@buet.ac.bd',
        role: 'STUDENT',
      });
      mockUserFindByIdAndUpdate.mockResolvedValue({
        _id: 'student-999',
        role: 'INSTRUCTOR',
      });

      const result = await reviewInstructorApplication(
        'profile-001',
        'Approved',
        'Verified BUET faculty ID and qualifications.'
      );

      expect(result.success).toBe(true);
      expect(result.decision).toBe('Approved');

      // Verify profile approval_status updated to 'Approved'
      expect(mockProfile.approval_status).toBe('Approved');
      expect(mockProfile.remarks).toBe('Verified BUET faculty ID and qualifications.');
      expect(mockSave).toHaveBeenCalled();

      // Verify User role promoted to INSTRUCTOR atomically
      expect(mockUserFindByIdAndUpdate).toHaveBeenCalled();
      expect(mockUserFindByIdAndUpdate.mock.calls[0][0]).toBe('student-999');
      expect(mockUserFindByIdAndUpdate.mock.calls[0][1]).toEqual({ role: 'INSTRUCTOR' });

      // Verify audit log creation
      expect(mockAuditLogCreate).toHaveBeenCalled();
      expect(mockAuditLogCreate.mock.calls[0][0]).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            action: 'APPROVE_INSTRUCTOR_APPLICATION',
            targetId: 'student-999',
          }),
        ])
      );

      // Verify cache revalidation
      expect(mockRevalidatePath).toHaveBeenCalledWith('/admin/instructors/pending');
    });

    it('rejects application: sets approval_status="Rejected", stores feedback remarks, and does NOT promote role', async () => {
      const mockSave = vi.fn().mockResolvedValue(true);
      const mockProfile = {
        _id: 'profile-002',
        userId: 'student-888',
        institution: 'Unknown College',
        qualifications: ['Undergraduate Student'],
        subjectSpecialization: 'Basic HTML',
        bio: 'Just started learning',
        approval_status: 'Pending',
        remarks: '',
        save: mockSave,
      };

      mockProfileFindById.mockResolvedValue(mockProfile);

      const result = await reviewInstructorApplication(
        'profile-002',
        'Rejected',
        'Requires minimum 3 years industry or teaching experience.'
      );

      expect(result.success).toBe(true);
      expect(result.decision).toBe('Rejected');

      // Verify profile approval_status updated to 'Rejected'
      expect(mockProfile.approval_status).toBe('Rejected');
      expect(mockProfile.remarks).toBe(
        'Requires minimum 3 years industry or teaching experience.'
      );
      expect(mockSave).toHaveBeenCalled();

      // Verify User role was NOT updated to INSTRUCTOR
      expect(mockUserFindByIdAndUpdate).not.toHaveBeenCalled();

      // Verify audit log creation for rejection
      expect(mockAuditLogCreate).toHaveBeenCalled();
      expect(mockAuditLogCreate.mock.calls[0][0]).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            action: 'REJECT_INSTRUCTOR_APPLICATION',
            targetId: 'student-888',
          }),
        ])
      );
    });

    it('supports uppercase "APPROVE" and "REJECT" decisions seamlessly', async () => {
      const mockSave = vi.fn().mockResolvedValue(true);
      const mockProfile = {
        _id: 'profile-003',
        userId: 'student-777',
        institution: 'DU',
        approval_status: 'Pending',
        save: mockSave,
      };

      mockProfileFindById.mockResolvedValue(mockProfile);
      mockUserFindById.mockResolvedValue({ _id: 'student-777', name: 'Farhana' });

      const result = await reviewInstructorApplication('profile-003', 'APPROVE');
      expect(result.success).toBe(true);
      expect(result.decision).toBe('Approved');
      expect(mockProfile.approval_status).toBe('Approved');
    });

    it('returns error when profile is not found', async () => {
      mockProfileFindById.mockResolvedValue(null);
      mockInstructorRequestFindById.mockResolvedValue(null);

      const result = await reviewInstructorApplication('non-existent-id', 'Approved');
      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });

    it('blocks unauthorized non-admin users from reviewing applications', async () => {
      mockAuth.mockResolvedValue({
        user: { id: 'student-123', role: 'STUDENT' },
      });

      const result = await reviewInstructorApplication('profile-001', 'Approved');
      expect(result.success).toBe(false);
      expect(result.error).toContain('Unauthorized');
    });
  });

  describe('getInstructorApplicationsAction (Task T-015)', () => {
    it('returns formatted applications with applicant credentials, institution, qualifications, and verification data', async () => {
      const rawData = [
        {
          _id: 'prof-1',
          userId: {
            _id: 'user-1',
            name: 'Dr. Tanvir',
            email: 'tanvir@buet.ac.bd',
            phone: '+8801711223344',
            role: 'STUDENT',
          },
          institution: 'BUET',
          qualifications: ['Ph.D.', 'B.Sc. CSE'],
          experienceYears: 10,
          subjectSpecialization: 'Cloud & Distributed Systems',
          bio: 'Associate Professor at BUET',
          credentials: 'BUET-FAC-2016',
          cvUrl: 'https://example.com/cv.pdf',
          idVerificationUrl: 'https://example.com/id.pdf',
          sampleLectureUrl: 'https://youtube.com/demo',
          approval_status: 'Pending',
          submissionDate: new Date('2026-10-15'),
        },
      ];

      mockProfileFind.mockReturnValue(rawData);

      const res = await getInstructorApplicationsAction({ status: 'pending' });
      expect(res.success).toBe(true);
      expect(res.applications.length).toBe(1);

      const app = res.applications[0];
      expect(app.id).toBe('prof-1');
      expect(app.institution).toBe('BUET');
      expect(app.qualifications).toEqual(['Ph.D.', 'B.Sc. CSE']);
      expect(app.experienceYears).toBe(10);
      expect(app.cvUrl).toBe('https://example.com/cv.pdf');
      expect(app.idVerificationUrl).toBe('https://example.com/id.pdf');
      expect(app.sampleLectureUrl).toBe('https://youtube.com/demo');
      expect(app.user?.name).toBe('Dr. Tanvir');
    });

    it('filters applications by search query', async () => {
      const rawData = [
        {
          _id: 'prof-1',
          userId: { name: 'Dr. Tanvir', email: 'tanvir@buet.ac.bd' },
          institution: 'BUET',
          subjectSpecialization: 'Distributed Systems',
          qualifications: ['Ph.D.'],
          approval_status: 'Pending',
        },
        {
          _id: 'prof-2',
          userId: { name: 'Farhana Sultana', email: 'farhana@du.ac.bd' },
          institution: 'Dhaka University',
          subjectSpecialization: 'Machine Learning',
          qualifications: ['M.Sc.'],
          approval_status: 'Pending',
        },
      ];

      mockProfileFind.mockReturnValue(rawData);

      const res = await getInstructorApplicationsAction({ search: 'machine learning' });
      expect(res.success).toBe(true);
      expect(res.applications.length).toBe(1);
      expect(res.applications[0].user?.name).toBe('Farhana Sultana');
    });
  });

  describe('seedDemoInstructorApplicationsAction', () => {
    it('creates realistic sample applications when requested', async () => {
      mockUserFindOne.mockResolvedValue(null);
      mockUserCreate.mockResolvedValue({ _id: 'seeded-user-1' });
      mockProfileFindOne.mockResolvedValue(null);
      mockProfileCreate.mockResolvedValue({ _id: 'seeded-profile-1' });

      const res = await seedDemoInstructorApplicationsAction();
      expect(res.success).toBe(true);
      expect(res.message).toContain('demo instructor applications');
    });
  });
});
