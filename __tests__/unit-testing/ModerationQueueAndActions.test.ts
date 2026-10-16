import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  resolveModerationTicket,
  updateReportStatus,
  getModerationTicketsAction,
  seedDemoModerationReportsAction,
} from '@/actions/admin';

// Mock Mongoose connection
vi.mock('@/lib/mongoose', () => ({
  default: vi.fn().mockResolvedValue(undefined),
}));

// Mock Auth
const mockAuth = vi.fn().mockResolvedValue({
  user: { id: 'moderator-101', role: 'MODERATOR', name: 'Moderator User' },
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

// Mock Models
const mockCommentFindByIdAndUpdate = vi.fn();
const mockCommentCreate = vi.fn();
const mockCommentFindOne = vi.fn();
vi.mock('@/models/Comment', () => ({
  default: {
    findByIdAndUpdate: (...args: any[]) => mockCommentFindByIdAndUpdate(...args),
    create: (...args: any[]) => mockCommentCreate(...args),
    findOne: (...args: any[]) => ({
      lean: vi.fn().mockResolvedValue(mockCommentFindOne(...args)),
    }),
  },
}));

const mockCourseFindByIdAndUpdate = vi.fn();
const mockCourseFindOne = vi.fn();
vi.mock('@/models/Course', () => ({
  default: {
    findByIdAndUpdate: (...args: any[]) => mockCourseFindByIdAndUpdate(...args),
    findOne: (...args: any[]) => ({
      lean: vi.fn().mockResolvedValue(mockCourseFindOne(...args)),
    }),
  },
}));

const mockLessonFindByIdAndUpdate = vi.fn();
const mockLessonFindOne = vi.fn();
vi.mock('@/models/Lesson', () => ({
  default: {
    findByIdAndUpdate: (...args: any[]) => mockLessonFindByIdAndUpdate(...args),
    findOne: (...args: any[]) => ({
      lean: vi.fn().mockResolvedValue(mockLessonFindOne(...args)),
    }),
  },
}));

const mockUserFindByIdAndUpdate = vi.fn();
const mockUserFindOne = vi.fn();
const mockUserCreate = vi.fn();
vi.mock('@/models/User', () => ({
  default: {
    findByIdAndUpdate: (...args: any[]) => mockUserFindByIdAndUpdate(...args),
    findOne: (...args: any[]) => ({
      lean: vi.fn().mockResolvedValue(mockUserFindOne(...args)),
      then: (fn: any) => Promise.resolve(mockUserFindOne(...args)).then(fn),
    }),
    create: (...args: any[]) => mockUserCreate(...args),
  },
}));

const mockReportFindById = vi.fn();
const mockReportFindByIdAndUpdate = vi.fn();
const mockReportFind = vi.fn();
const mockReportCreate = vi.fn();
const mockReportFindOne = vi.fn();
vi.mock('@/models/Report', () => ({
  default: {
    findById: (...args: any[]) => mockReportFindById(...args),
    findByIdAndUpdate: (...args: any[]) => mockReportFindByIdAndUpdate(...args),
    find: (...args: any[]) => ({
      populate: vi.fn().mockReturnValue({
        populate: vi.fn().mockReturnValue({
          populate: vi.fn().mockReturnValue({
            sort: vi.fn().mockReturnValue({
              lean: vi.fn().mockResolvedValue(mockReportFind(...args) || []),
            }),
          }),
        }),
      }),
    }),
    create: (...args: any[]) => mockReportCreate(...args),
    findOne: (...args: any[]) => mockReportFindOne(...args),
  },
}));

const mockModeratorActionCreate = vi.fn();
vi.mock('@/models/ModeratorAction', () => ({
  default: {
    create: (...args: any[]) => mockModeratorActionCreate(...args),
  },
}));

describe('Task T-017 & T-018: Content Moderation Queue & Action Execution', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({
      user: { id: 'moderator-101', role: 'MODERATOR', name: 'Moderator User' },
    });
  });

  describe('resolveModerationTicket (Task T-018)', () => {
    it('executes "Warning" penalty: resolves ticket, writes audit into MODERATOR_ACTION', async () => {
      const mockSave = vi.fn().mockResolvedValue(true);
      const mockReport = {
        _id: 'report-warning-01',
        reported_type: 'Comment',
        targetId: 'comment-123',
        targetUserId: 'bad-user-456',
        reason: 'Inappropriate Language',
        rationale: 'Used offensive slurs in discussion',
        status: 'Open',
        save: mockSave,
      };

      mockReportFindById.mockResolvedValue(mockReport);
      mockModeratorActionCreate.mockResolvedValue({ _id: 'action-rec-01' });

      const res = await resolveModerationTicket(
        'report-warning-01',
        'Warning',
        'First warning issued to student regarding community standards.'
      );

      expect(res.success).toBe(true);
      expect(res.status).toBe('Resolved');
      expect(res.actionTaken).toBe('Warning');

      // Verify report was updated to 'Resolved'
      expect(mockReport.status).toBe('Resolved');
      expect(mockReport.actionTaken).toBe('Warning');
      expect(mockReport.resolutionNote).toBe(
        'First warning issued to student regarding community standards.'
      );
      expect(mockSave).toHaveBeenCalled();

      // Verify immutable log created in MODERATOR_ACTION
      expect(mockModeratorActionCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          reportId: 'report-warning-01',
          moderatorId: 'moderator-101',
          targetId: 'comment-123',
          targetType: 'Comment',
          targetUserId: 'bad-user-456',
          actionTaken: 'Warning',
          note: 'First warning issued to student regarding community standards.',
        })
      );

      // Verify AuditLog record
      expect(mockAuditLogCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'MODERATION_WARNING',
          category: 'SECURITY',
          actorId: 'moderator-101',
        })
      );
    });

    it('executes "Remove" penalty on Comment: soft-deletes/hides comment, updates report, and writes to MODERATOR_ACTION', async () => {
      const mockSave = vi.fn().mockResolvedValue(true);
      const mockReport = {
        _id: 'report-remove-comment',
        reported_type: 'Comment',
        targetId: 'comment-spam-789',
        targetUserId: 'bad-user-111',
        reason: 'Spam / Phishing Link',
        rationale: 'Posting malicious links in lesson thread',
        status: 'In Review',
        save: mockSave,
      };

      mockReportFindById.mockResolvedValue(mockReport);
      mockModeratorActionCreate.mockResolvedValue({ _id: 'action-rec-02' });

      const res = await resolveModerationTicket(
        'report-remove-comment',
        'Remove',
        'Malicious link removed and comment soft-deleted.'
      );

      expect(res.success).toBe(true);
      expect(res.actionTaken).toBe('Remove');

      // Verify comment was soft-deleted / hidden
      expect(mockCommentFindByIdAndUpdate).toHaveBeenCalledWith('comment-spam-789', {
        isDeleted: true,
        isHidden: true,
      });

      // Verify report updated to Resolved
      expect(mockReport.status).toBe('Resolved');
      expect(mockReport.actionTaken).toBe('Remove');
      expect(mockSave).toHaveBeenCalled();

      // Verify MODERATOR_ACTION record
      expect(mockModeratorActionCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          reportId: 'report-remove-comment',
          actionTaken: 'Remove',
          note: 'Malicious link removed and comment soft-deleted.',
        })
      );
    });

    it('executes "Remove" penalty on Course: unpublishes course to DRAFT and REJECTED', async () => {
      const mockSave = vi.fn().mockResolvedValue(true);
      const mockReport = {
        _id: 'report-remove-course',
        reported_type: 'Course',
        targetId: 'course-plagiarized-999',
        targetUserId: 'instructor-555',
        reason: 'Copyright Infringement',
        rationale: 'Verbatim copy of third-party course slides',
        status: 'Open',
        save: mockSave,
      };

      mockReportFindById.mockResolvedValue(mockReport);
      mockModeratorActionCreate.mockResolvedValue({ _id: 'action-rec-03' });

      const res = await resolveModerationTicket(
        'report-remove-course',
        'Remove',
        'Plagiarized course removed from public catalog.'
      );

      expect(res.success).toBe(true);
      expect(mockCourseFindByIdAndUpdate).toHaveBeenCalledWith('course-plagiarized-999', {
        status: 'DRAFT',
        approvalStatus: 'REJECTED',
      });
    });

    it('executes "Ban" penalty: invokes suspension state on target user (status: "SUSPENDED")', async () => {
      const mockSave = vi.fn().mockResolvedValue(true);
      const mockReport = {
        _id: 'report-ban-user',
        reported_type: 'User',
        targetId: 'offending-user-777',
        targetUserId: 'offending-user-777',
        reason: 'Harassment & Fraud',
        rationale: 'Selling fake certificates to other students',
        status: 'Open',
        save: mockSave,
      };

      mockReportFindById.mockResolvedValue(mockReport);
      mockModeratorActionCreate.mockResolvedValue({ _id: 'action-rec-04' });

      const res = await resolveModerationTicket(
        'report-ban-user',
        'Ban',
        'Account permanently suspended for policy violation.'
      );

      expect(res.success).toBe(true);
      expect(res.actionTaken).toBe('Ban');

      // Verify target user was suspended
      expect(mockUserFindByIdAndUpdate).toHaveBeenCalledWith('offending-user-777', {
        status: 'SUSPENDED',
      });

      // Verify MODERATOR_ACTION written
      expect(mockModeratorActionCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          reportId: 'report-ban-user',
          actionTaken: 'Ban',
          note: 'Account permanently suspended for policy violation.',
        })
      );
    });

    it('returns error when ticket is not found', async () => {
      mockReportFindById.mockResolvedValue(null);

      const res = await resolveModerationTicket('missing-report-id', 'Warning');
      expect(res.success).toBe(false);
      expect(res.error).toContain('not found');
    });

    it('blocks unauthorized regular student accounts from resolving tickets', async () => {
      mockAuth.mockResolvedValue({
        user: { id: 'student-regular', role: 'STUDENT' },
      });

      const res = await resolveModerationTicket('report-1', 'Warning');
      expect(res.success).toBe(false);
      expect(res.error).toContain('Unauthorized');
    });
  });

  describe('getModerationTicketsAction (Task T-017)', () => {
    it('returns flagged tickets categorized by reported_type with in-context preview and reporter rationale', async () => {
      const rawTickets = [
        {
          _id: 'rep-01',
          reporterId: { _id: 'rep-user', name: 'Alice', email: 'alice@test.com' },
          reported_type: 'Comment',
          targetId: 'comm-1',
          targetUserId: { _id: 'bad-user', name: 'Bob', email: 'bob@test.com', status: 'APPROVED' },
          reason: 'Hate Speech',
          rationale: 'Used unacceptable discriminatory words',
          status: 'Open',
          flaggedContentPreview: 'Offending comment body text displayed in full context',
          contextData: { lessonTitle: 'Lecture 10: Graph Theory' },
          createdAt: new Date('2026-10-16'),
        },
        {
          _id: 'rep-02',
          reporterId: { _id: 'rep-user-2', name: 'Charlie', email: 'charlie@test.com' },
          reported_type: 'Course',
          targetId: 'crs-1',
          targetUserId: { _id: 'instructor-1', name: 'Dave', email: 'dave@test.com' },
          reason: 'Deceptive Advertising',
          rationale: 'Claims guaranteed job placement for money',
          status: 'In Review',
          flaggedContentPreview: 'Course description contains fraudulent placement claims',
          contextData: { courseTitle: 'Fasttrack Python' },
          createdAt: new Date('2026-10-16'),
        },
      ];

      mockReportFind.mockReturnValue(rawTickets);

      const res = await getModerationTicketsAction({ type: 'all', status: 'all' });
      expect(res.success).toBe(true);
      expect(res.reports.length).toBe(2);

      const first = res.reports[0];
      expect(first.reported_type).toBe('Comment');
      expect(first.reason).toBe('Hate Speech');
      expect(first.rationale).toBe('Used unacceptable discriminatory words');
      expect(first.flaggedContentPreview).toBe(
        'Offending comment body text displayed in full context'
      );
      expect(first.reporter?.name).toBe('Alice');
      expect(first.targetUser?.name).toBe('Bob');
    });

    it('filters tickets by search term across rationale and preview', async () => {
      const rawTickets = [
        {
          _id: 'rep-01',
          reported_type: 'Comment',
          reason: 'Spam',
          rationale: 'Crypto scam link posted in forum',
          flaggedContentPreview: 'free-crypto-giveaway.com',
          status: 'Open',
        },
        {
          _id: 'rep-02',
          reported_type: 'User',
          reason: 'Harassment',
          rationale: 'Abusive direct messages',
          flaggedContentPreview: 'threatened another student',
          status: 'Open',
        },
      ];

      mockReportFind.mockReturnValue(rawTickets);

      const res = await getModerationTicketsAction({ search: 'crypto' });
      expect(res.success).toBe(true);
      expect(res.reports.length).toBe(1);
      expect(res.reports[0].reason).toBe('Spam');
    });
  });

  describe('updateReportStatus', () => {
    it('updates report status to "In Review"', async () => {
      mockReportFindByIdAndUpdate.mockResolvedValue({
        _id: 'rep-01',
        status: 'In Review',
      });

      const res = await updateReportStatus('rep-01', 'In Review');
      expect(res.success).toBe(true);
      expect(mockReportFindByIdAndUpdate).toHaveBeenCalledWith(
        'rep-01',
        { status: 'In Review' },
        { new: true }
      );
    });
  });

  describe('seedDemoModerationReportsAction', () => {
    it('creates demo moderation tickets across all 4 entity types', async () => {
      mockUserFindOne.mockResolvedValue(null);
      mockUserCreate.mockResolvedValue({ _id: 'test-user-id' });
      mockCourseFindOne.mockReturnValue(null);
      mockLessonFindOne.mockReturnValue(null);
      mockCommentFindOne.mockReturnValue(null);
      mockCommentCreate.mockResolvedValue({ _id: 'seeded-comment' });
      mockReportFindOne.mockResolvedValue(null);
      mockReportCreate.mockResolvedValue({ _id: 'seeded-report' });

      const res = await seedDemoModerationReportsAction();
      expect(res.success).toBe(true);
      expect(res.message).toContain('demo moderation reports');
    });
  });
});
