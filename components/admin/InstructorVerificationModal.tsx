'use client';

import React, { useState } from 'react';
import {
  X,
  GraduationCap,
  Building2,
  Award,
  FileText,
  Link as LinkIcon,
  Video,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Loader2,
  Mail,
  Phone,
  Calendar,
  Clock,
  ExternalLink,
  AlertTriangle,
  UserCheck,
  MessageSquare,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { reviewInstructorApplication } from '@/actions/admin';

export interface InstructorApplicationItem {
  id: string;
  userId: string;
  user: {
    name?: string;
    email?: string;
    phone?: string;
    role?: string;
    image?: string;
    academicBackground?: string;
    elo?: number;
    createdAt?: string;
  } | null;
  institution: string;
  qualifications: string[];
  experienceYears: number;
  subjectSpecialization: string;
  bio: string;
  credentials?: string;
  cvUrl?: string;
  portfolioUrl?: string;
  linkedinUrl?: string;
  sampleLectureUrl?: string;
  idVerificationUrl?: string;
  approval_status: 'Pending' | 'Approved' | 'Rejected' | string;
  remarks?: string;
  reviewedBy?: { name?: string; email?: string } | null;
  reviewedAt?: string;
  submissionDate: string;
  createdAt?: string;
}

interface InstructorVerificationModalProps {
  application: InstructorApplicationItem;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedId: string, decision: 'Approved' | 'Rejected', remarks: string) => void;
}

export default function InstructorVerificationModal({
  application,
  isOpen,
  onClose,
  onSuccess,
}: InstructorVerificationModalProps) {
  const [remarks, setRemarks] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [activeTab, setActiveTab] = useState<'profile' | 'verification' | 'decision'>('profile');

  if (!isOpen) return null;

  const applicantName = application.user?.name || 'Applicant';
  const applicantEmail = application.user?.email || 'No email provided';
  const applicantPhone = application.user?.phone || 'No phone provided';
  const currentRole = application.user?.role || 'STUDENT';
  const status = application.approval_status;

  const handleDecision = async (decision: 'Approved' | 'Rejected') => {
    if (decision === 'Rejected' && !remarks.trim()) {
      setErrorMsg('Please enter feedback/remarks explaining the reason for rejection.');
      setActiveTab('decision');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const res = await reviewInstructorApplication(application.id, decision, remarks.trim());
      if (!res.success) {
        setErrorMsg(res.error || 'Failed to process application.');
        setIsSubmitting(false);
        return;
      }

      onSuccess(application.id, decision, remarks.trim());
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = () => {
    const s = (status || '').toLowerCase();
    if (s === 'approved') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
          <CheckCircle2 className="w-3.5 h-3.5" /> Approved
        </span>
      );
    }
    if (s === 'rejected') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
          <XCircle className="w-3.5 h-3.5" /> Rejected
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300 animate-pulse">
        <Clock className="w-3.5 h-3.5" /> Pending Review
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
              <GraduationCap className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-bold text-white tracking-tight">
                  Instructor Application Dossier
                </h2>
                {getStatusBadge()}
              </div>
              <p className="text-xs text-indigo-200/80 mt-0.5">
                Verify credentials, academic qualifications, and teaching capabilities
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-gray-200 bg-gray-50/80 px-6 pt-3 gap-2">
          <button
            onClick={() => setActiveTab('profile')}
            className={`pb-3 px-3 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 ${
              activeTab === 'profile'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            Applicant & Academic Profile
          </button>
          <button
            onClick={() => setActiveTab('verification')}
            className={`pb-3 px-3 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 flex items-center gap-1.5 ${
              activeTab === 'verification'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            Attached Verification Data
            <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
          </button>
          <button
            onClick={() => setActiveTab('decision')}
            className={`pb-3 px-3 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 ${
              activeTab === 'decision'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            Review & Decision
          </button>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-rose-800 text-xs">
            <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
            <div className="flex-1 font-medium">{errorMsg}</div>
          </div>
        )}

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'profile' && (
            <div className="space-y-6">
              {/* Top Summary Card */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-50/70 via-purple-50/40 to-slate-50 border border-indigo-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white font-bold text-2xl flex items-center justify-center shadow-md shadow-indigo-200 shrink-0 uppercase">
                    {applicantName.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{applicantName}</h3>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-600 mt-1">
                      <span className="flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5 text-gray-400" /> {applicantEmail}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5 text-gray-400" /> {applicantPhone}
                      </span>
                      <span className="flex items-center gap-1.5 font-medium text-indigo-600">
                        <UserCheck className="h-3.5 w-3.5" /> Current Role: {currentRole}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-start md:items-end text-xs text-gray-500 shrink-0">
                  <span className="flex items-center gap-1 font-medium text-gray-700">
                    <Calendar className="h-3.5 w-3.5 text-gray-400" />
                    Submitted: {new Date(application.submissionDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                  <span className="text-gray-400 mt-0.5">
                    {new Date(application.submissionDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>

              {/* Grid: Institution & Specialization */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-gray-200 bg-white shadow-sm space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-500">
                    <Building2 className="h-4 w-4 text-indigo-600" /> Institution / University
                  </div>
                  <p className="text-sm font-semibold text-gray-900">{application.institution}</p>
                  <p className="text-xs text-gray-500">
                    Academic Background: {application.user?.academicBackground || 'Computer Science & Engineering'}
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-gray-200 bg-white shadow-sm space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-500">
                    <Award className="h-4 w-4 text-violet-600" /> Specialization & Experience
                  </div>
                  <p className="text-sm font-semibold text-gray-900">{application.subjectSpecialization}</p>
                  <p className="text-xs text-indigo-600 font-semibold">
                    {application.experienceYears}+ Years Teaching / Industry Experience
                  </p>
                </div>
              </div>

              {/* Qualifications */}
              <div className="p-5 rounded-xl border border-gray-200 bg-white shadow-sm space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-700">
                  <GraduationCap className="h-4 w-4 text-emerald-600" /> Verified Qualifications & Degrees
                </div>
                {application.qualifications && application.qualifications.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {application.qualifications.map((q, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 text-slate-800 border border-slate-200/80"
                      >
                        <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                        {q}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 italic">No explicit qualifications listed.</p>
                )}
              </div>

              {/* Bio & Motivation Statement */}
              <div className="p-5 rounded-xl border border-gray-200 bg-white shadow-sm space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-700">
                  <MessageSquare className="h-4 w-4 text-indigo-600" /> Applicant Bio & Teaching Statement
                </div>
                <div className="text-xs leading-relaxed text-gray-700 bg-gray-50/80 p-4 rounded-lg border border-gray-100 whitespace-pre-wrap">
                  {application.bio || 'No personal bio or motivation provided.'}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'verification' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 text-blue-900 text-xs">
                <p className="font-semibold flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-blue-600" /> Instructional Quality & Compliance Verification
                </p>
                <p className="text-blue-700 mt-1">
                  Inspect attached certificates, verification URLs, CVs, and identity verification items before making a decision.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* CV / Resume */}
                <div className="p-4 rounded-xl border border-gray-200 bg-white hover:border-indigo-300 transition-all space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                      <FileText className="h-4 w-4 text-indigo-600" /> Curriculum Vitae (CV) / Resume
                    </span>
                    {application.cvUrl ? (
                      <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200">
                        Attached
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] text-gray-400">
                        None
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">
                    Complete educational history, publications, and professional timeline.
                  </p>
                  {application.cvUrl ? (
                    <a
                      href={application.cvUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:underline pt-1"
                    >
                      Inspect CV Document <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  ) : (
                    <span className="text-xs text-gray-400">Not provided</span>
                  )}
                </div>

                {/* ID Verification Document */}
                <div className="p-4 rounded-xl border border-gray-200 bg-white hover:border-indigo-300 transition-all space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                      <ShieldCheck className="h-4 w-4 text-emerald-600" /> Institutional / Gov ID Verification
                    </span>
                    {application.idVerificationUrl ? (
                      <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200">
                        Attached
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] text-gray-400">
                        None
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">
                    Faculty identity card, national ID, or university verification scan.
                  </p>
                  {application.idVerificationUrl ? (
                    <a
                      href={application.idVerificationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:underline pt-1"
                    >
                      Inspect ID Verification <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  ) : (
                    <span className="text-xs text-gray-400">Not provided</span>
                  )}
                </div>

                {/* Sample Lecture Video */}
                <div className="p-4 rounded-xl border border-gray-200 bg-white hover:border-indigo-300 transition-all space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                      <Video className="h-4 w-4 text-rose-600" /> Sample Teaching Demonstration Video
                    </span>
                    {application.sampleLectureUrl ? (
                      <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200">
                        Attached
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] text-gray-400">
                        None
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">
                    Demonstration of pedagogical style, clarity, and language delivery.
                  </p>
                  {application.sampleLectureUrl ? (
                    <a
                      href={application.sampleLectureUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600 hover:text-rose-800 hover:underline pt-1"
                    >
                      Watch Demo Lecture <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  ) : (
                    <span className="text-xs text-gray-400">Not provided</span>
                  )}
                </div>

                {/* LinkedIn / Portfolio Links */}
                <div className="p-4 rounded-xl border border-gray-200 bg-white hover:border-indigo-300 transition-all space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                      <LinkIcon className="h-4 w-4 text-blue-600" /> Professional Portfolio & Links
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">
                    Applicant&apos;s public professional record and code/research portfolio.
                  </p>
                  <div className="flex flex-wrap gap-3 pt-1">
                    {application.linkedinUrl && (
                      <a
                        href={application.linkedinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
                      >
                        LinkedIn <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                    {application.portfolioUrl && (
                      <a
                        href={application.portfolioUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:underline"
                      >
                        Portfolio <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                    {!application.linkedinUrl && !application.portfolioUrl && (
                      <span className="text-xs text-gray-400">No public URLs attached</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Credentials Text field */}
              {application.credentials && (
                <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/60 space-y-1">
                  <span className="text-xs font-bold text-gray-700">Credential Reference IDs & Badges:</span>
                  <p className="text-xs font-mono text-gray-800 bg-white p-2.5 rounded border border-gray-200">
                    {application.credentials}
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'decision' && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Role Transition & Authorization Details
                </h4>
                <ul className="text-xs text-slate-600 space-y-1 list-disc list-inside">
                  <li>
                    <strong className="text-slate-800">If Approved:</strong> The user account role will be atomically promoted from{' '}
                    <code className="text-indigo-600 bg-indigo-50 px-1 rounded">STUDENT</code> to{' '}
                    <code className="text-emerald-600 bg-emerald-50 px-1 rounded">INSTRUCTOR</code>. They gain immediate course creation and lecture uploading capabilities.
                  </li>
                  <li>
                    <strong className="text-slate-800">If Rejected:</strong> The user account will retain their current student access. Your feedback remarks will be preserved in their dossier for compliance.
                  </li>
                </ul>
              </div>

              {/* Previous Review Information if available */}
              {application.remarks && (
                <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200 space-y-1">
                  <span className="text-xs font-bold text-amber-900">Recorded Administrator Remarks:</span>
                  <p className="text-xs text-amber-800 italic">&ldquo;{application.remarks}&rdquo;</p>
                  {application.reviewedBy && (
                    <p className="text-[11px] text-amber-700 mt-1">
                      Reviewed by: {application.reviewedBy.name || application.reviewedBy.email} on{' '}
                      {application.reviewedAt ? new Date(application.reviewedAt).toLocaleString() : 'N/A'}
                    </p>
                  )}
                </div>
              )}

              {/* Feedback / Remarks input */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">
                  Administrative Remarks & Feedback <span className="text-gray-400 font-normal">(Required if rejecting)</span>
                </label>
                <textarea
                  rows={4}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Enter detailed feedback or acceptance congratulations (e.g. 'Verified BUET accreditation and 8 years production experience. Approved for fullstack curriculum.')..."
                  className="w-full text-xs p-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm transition-all"
                />
              </div>

              {/* Quick Actions */}
              <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
                <Button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleDecision('Rejected')}
                  className="w-full sm:w-auto bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs py-2.5 px-5 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <XCircle className="h-4 w-4" />
                  )}
                  Reject Application
                </Button>

                <Button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleDecision('Approved')}
                  className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs py-2.5 px-6 rounded-xl shadow-md shadow-emerald-200 transition-all flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                  Approve & Promote to Instructor
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/90 text-xs">
          <div className="text-gray-500">
            Profile ID: <span className="font-mono text-gray-700">{application.id}</span>
          </div>
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="text-xs"
            >
              Close Dossier
            </Button>
            {activeTab !== 'decision' && (
              <Button
                type="button"
                onClick={() => setActiveTab('decision')}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-4"
              >
                Proceed to Review & Decision &rarr;
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
