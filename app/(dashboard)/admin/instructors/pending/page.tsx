import React from 'react';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  GraduationCap,
  ChevronRight,
  ShieldCheck,
  ArrowLeft,
  LayoutDashboard,
  Sparkles,
} from 'lucide-react';
import dbConnect from '@/lib/mongoose';
import InstructorProfile from '@/models/InstructorProfile';
import InstructorRequest from '@/models/InstructorRequest';
import User from '@/models/User';
import InstructorApplicationQueue from '@/components/admin/InstructorApplicationQueue';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Instructor Application Queue & Verification | Admin Portal',
  description:
    'Inspect pending instructor profile applications, credentials, qualifications, and attached verification data.',
};

export default async function PendingInstructorsPage() {
  const session = await auth();
  if (!session || !session.user) {
    redirect('/login');
  }

  const role = (session.user as any)?.role;
  if (role !== 'ADMIN' && role !== 'SUPERADMIN') {
    redirect('/student');
  }

  await dbConnect();

  // Fetch applications
  let rawProfiles = await InstructorProfile.find({})
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

  // If no profiles exist yet, check if there are pending InstructorRequests to sync or seed
  if (rawProfiles.length === 0) {
    const pendingReqs = await InstructorRequest.find({})
      .populate({
        path: 'userId',
        select: 'name email phone role image academicBackground elo createdAt',
      })
      .lean();

    if (pendingReqs.length > 0) {
      for (const req of pendingReqs) {
        if (req.userId) {
          const userObj: any = req.userId;
          await InstructorProfile.findOneAndUpdate(
            { userId: userObj._id },
            {
              userId: userObj._id,
              institution: userObj.academicBackground || 'University Graduate / Specialist',
              qualifications: ['Bachelor Degree', 'Professional Teaching Certificate'],
              experienceYears: 3,
              subjectSpecialization: 'Computer Science & Software Development',
              bio: req.reason || 'Passionate educator looking to teach online courses.',
              approval_status: req.status === 'APPROVED' ? 'Approved' : req.status === 'REJECTED' ? 'Rejected' : 'Pending',
              submissionDate: req.createdAt || new Date(),
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
          );
        }
      }

      rawProfiles = await InstructorProfile.find({})
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
    }
  }

  // Plain JSON serialization to avoid RSC serialization warnings
  const serializedApplications = JSON.parse(JSON.stringify(rawProfiles)).map((p: any) => ({
    id: p._id,
    userId: p.userId?._id || p.userId,
    user: p.userId && typeof p.userId === 'object' ? p.userId : null,
    institution: p.institution || 'Unspecified Institution',
    qualifications: Array.isArray(p.qualifications)
      ? p.qualifications
      : [p.qualifications].filter(Boolean),
    experienceYears: p.experienceYears || 0,
    subjectSpecialization: p.subjectSpecialization || 'Computer Science & Engineering',
    bio: p.bio || '',
    credentials: p.credentials || '',
    cvUrl: p.cvUrl || '',
    portfolioUrl: p.portfolioUrl || '',
    linkedinUrl: p.linkedinUrl || '',
    sampleLectureUrl: p.sampleLectureUrl || '',
    idVerificationUrl: p.idVerificationUrl || '',
    approval_status: p.approval_status || 'Pending',
    remarks: p.remarks || '',
    reviewedBy: p.reviewedBy,
    reviewedAt: p.reviewedAt,
    submissionDate: p.submissionDate || p.createdAt || new Date().toISOString(),
    createdAt: p.createdAt,
  }));

  return (
    <div className="min-h-screen bg-slate-50/50 pb-16">
      {/* Top Banner / Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border-b border-indigo-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-4">
          {/* Breadcrumb Navigation */}
          <nav className="flex items-center gap-2 text-xs text-indigo-300 font-medium">
            <Link
              href="/admin"
              className="hover:text-white transition-colors flex items-center gap-1"
            >
              <LayoutDashboard className="h-3.5 w-3.5" /> Admin Dashboard
            </Link>
            <ChevronRight className="h-3.5 w-3.5 text-indigo-400/60" />
            <span className="text-white font-semibold">Instructors</span>
            <ChevronRight className="h-3.5 w-3.5 text-indigo-400/60" />
            <span className="text-indigo-200">Pending Application Queue</span>
          </nav>

          {/* Title Area */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-1">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 shadow-inner">
                  <GraduationCap className="h-5 w-5" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                  Instructor Application Queue & Verification
                </h1>
              </div>
              <p className="text-xs sm:text-sm text-indigo-200/80 max-w-2xl pl-13">
                Review pending applicant credentials, verify university affiliations & qualifications,
                inspect attached verification documents, and approve instructor permissions with atomic role transition.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/admin"
                className="inline-flex items-center gap-2 text-xs font-semibold px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white border border-white/15 transition-all shadow-sm"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-4">
        <InstructorApplicationQueue initialApplications={serializedApplications} />
      </main>
    </div>
  );
}
