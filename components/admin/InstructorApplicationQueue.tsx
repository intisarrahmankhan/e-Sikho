'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  GraduationCap,
  Building2,
  Award,
  Search,
  Filter,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  FileText,
  Video,
  ShieldCheck,
  RefreshCw,
  Sparkles,
  ArrowUpDown,
  ExternalLink,
  ChevronRight,
  UserCheck,
  AlertCircle,
  Mail,
  Phone,
  Layers,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import InstructorVerificationModal, {
  InstructorApplicationItem,
} from '@/components/admin/InstructorVerificationModal';
import { seedDemoInstructorApplicationsAction } from '@/actions/admin';

interface InstructorApplicationQueueProps {
  initialApplications: InstructorApplicationItem[];
}

export default function InstructorApplicationQueue({
  initialApplications,
}: InstructorApplicationQueueProps) {
  const [applications, setApplications] = useState<InstructorApplicationItem[]>(initialApplications);
  const [statusFilter, setStatusFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | '7days' | '30days'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'experience'>('newest');
  const [selectedApp, setSelectedApp] = useState<InstructorApplicationItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Filter & Search Logic
  const filteredApplications = useMemo(() => {
    return applications
      .filter((app) => {
        // Status filter
        if (statusFilter !== 'all') {
          const s = (app.approval_status || '').toLowerCase();
          if (s !== statusFilter) return false;
        }

        // Date filter
        if (dateFilter !== 'all') {
          const appDate = new Date(app.submissionDate || app.createdAt || Date.now()).getTime();
          const now = Date.now();
          if (dateFilter === 'today') {
            const oneDayAgo = now - 24 * 60 * 60 * 1000;
            if (appDate < oneDayAgo) return false;
          } else if (dateFilter === '7days') {
            const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
            if (appDate < sevenDaysAgo) return false;
          } else if (dateFilter === '30days') {
            const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
            if (appDate < thirtyDaysAgo) return false;
          }
        }

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchName = app.user?.name?.toLowerCase().includes(q);
          const matchEmail = app.user?.email?.toLowerCase().includes(q);
          const matchInst = app.institution?.toLowerCase().includes(q);
          const matchSpec = app.subjectSpecialization?.toLowerCase().includes(q);
          const matchBio = app.bio?.toLowerCase().includes(q);
          const matchQual = app.qualifications?.some((item) => item.toLowerCase().includes(q));

          if (!matchName && !matchEmail && !matchInst && !matchSpec && !matchBio && !matchQual) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') {
          return new Date(b.submissionDate).getTime() - new Date(a.submissionDate).getTime();
        }
        if (sortBy === 'oldest') {
          return new Date(a.submissionDate).getTime() - new Date(b.submissionDate).getTime();
        }
        if (sortBy === 'experience') {
          return (b.experienceYears || 0) - (a.experienceYears || 0);
        }
        return 0;
      });
  }, [applications, statusFilter, dateFilter, searchQuery, sortBy]);

  // Counts for Metrics
  const counts = useMemo(() => {
    let pending = 0;
    let approved = 0;
    let rejected = 0;

    applications.forEach((a) => {
      const s = (a.approval_status || '').toLowerCase();
      if (s === 'approved') approved++;
      else if (s === 'rejected') rejected++;
      else pending++;
    });

    return { total: applications.length, pending, approved, rejected };
  }, [applications]);

  const handleOpenInspect = (app: InstructorApplicationItem) => {
    setSelectedApp(app);
    setIsModalOpen(true);
  };

  const handleActionSuccess = (
    updatedId: string,
    decision: 'Approved' | 'Rejected',
    remarks: string
  ) => {
    setApplications((prev) =>
      prev.map((item) => {
        if (item.id === updatedId) {
          return {
            ...item,
            approval_status: decision,
            remarks,
            user: item.user
              ? {
                  ...item.user,
                  role: decision === 'Approved' ? 'INSTRUCTOR' : item.user.role,
                }
              : null,
            reviewedAt: new Date().toISOString(),
          };
        }
        return item;
      })
    );

    setNotification({
      type: 'success',
      message:
        decision === 'Approved'
          ? 'Application successfully approved! User promoted to INSTRUCTOR role.'
          : 'Application rejected and feedback remarks saved.',
    });

    setTimeout(() => {
      setNotification(null);
    }, 5000);
  };

  const handleSeedDemo = async () => {
    setIsSeeding(true);
    try {
      const res = await seedDemoInstructorApplicationsAction();
      if (res.success) {
        window.location.reload();
      } else {
        setNotification({ type: 'error', message: res.error || 'Failed to seed demo data.' });
      }
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Seeding error.' });
    } finally {
      setIsSeeding(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const s = (status || '').toLowerCase();
    if (s === 'approved') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
          <CheckCircle2 className="w-3 h-3" /> Approved
        </span>
      );
    }
    if (s === 'rejected') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
          <XCircle className="w-3 h-3" /> Rejected
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200 animate-pulse">
        <Clock className="w-3 h-3" /> Pending Review
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Notification Toast */}
      {notification && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between shadow-lg transition-all border ${
            notification.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
              : 'bg-rose-50 text-rose-900 border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2.5 text-xs font-semibold">
            {notification.type === 'success' ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-gray-400 hover:text-gray-700 text-xs font-bold px-2 py-1"
          >
            &times;
          </button>
        </div>
      )}

      {/* Metric Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Applications */}
        <Card
          onClick={() => setStatusFilter('all')}
          className={`cursor-pointer transition-all border hover:shadow-md ${
            statusFilter === 'all'
              ? 'border-indigo-500 bg-indigo-50/50 ring-2 ring-indigo-200'
              : 'border-gray-200/80 bg-white'
          }`}
        >
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Total Applicants
              </p>
              <p className="text-2xl font-black text-gray-900 mt-1">{counts.total}</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-600">
              <Layers className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* Pending Verification */}
        <Card
          onClick={() => setStatusFilter('pending')}
          className={`cursor-pointer transition-all border hover:shadow-md ${
            statusFilter === 'pending'
              ? 'border-amber-500 bg-amber-50/60 ring-2 ring-amber-200'
              : 'border-gray-200/80 bg-white'
          }`}
        >
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider flex items-center gap-1.5">
                Pending Review
                {counts.pending > 0 && (
                  <span className="h-2 w-2 rounded-full bg-amber-500 animate-ping"></span>
                )}
              </p>
              <p className="text-2xl font-black text-amber-900 mt-1">{counts.pending}</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700">
              <Clock className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* Approved Instructors */}
        <Card
          onClick={() => setStatusFilter('approved')}
          className={`cursor-pointer transition-all border hover:shadow-md ${
            statusFilter === 'approved'
              ? 'border-emerald-500 bg-emerald-50/60 ring-2 ring-emerald-200'
              : 'border-gray-200/80 bg-white'
          }`}
        >
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">
                Approved Faculty
              </p>
              <p className="text-2xl font-black text-emerald-900 mt-1">{counts.approved}</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* Rejected Applications */}
        <Card
          onClick={() => setStatusFilter('rejected')}
          className={`cursor-pointer transition-all border hover:shadow-md ${
            statusFilter === 'rejected'
              ? 'border-rose-500 bg-rose-50/60 ring-2 ring-rose-200'
              : 'border-gray-200/80 bg-white'
          }`}
        >
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-rose-700 uppercase tracking-wider">
                Rejected / Ineligible
              </p>
              <p className="text-2xl font-black text-rose-900 mt-1">{counts.rejected}</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-rose-100 flex items-center justify-center text-rose-700">
              <XCircle className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-5 rounded-2xl bg-white border border-gray-200/80 shadow-sm space-y-4">
        {/* Status Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-4">
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-gray-100/80 text-xs">
            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                statusFilter === 'pending'
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Pending ({counts.pending})
            </button>
            <button
              onClick={() => setStatusFilter('approved')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                statusFilter === 'approved'
                  ? 'bg-white text-emerald-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Approved ({counts.approved})
            </button>
            <button
              onClick={() => setStatusFilter('rejected')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                statusFilter === 'rejected'
                  ? 'bg-white text-rose-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Rejected ({counts.rejected})
            </button>
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                statusFilter === 'all'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              All ({counts.total})
            </button>
          </div>

          {/* Quick Demo Seeder */}
          <Button
            type="button"
            variant="outline"
            disabled={isSeeding}
            onClick={handleSeedDemo}
            className="text-xs h-9 border-dashed border-indigo-300 text-indigo-700 hover:bg-indigo-50 flex items-center gap-1.5"
          >
            <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
            {isSeeding ? 'Seeding Profiles...' : 'Seed Sample Applications'}
          </Button>
        </div>

        {/* Search & Secondary Filters */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Search Input */}
          <div className="md:col-span-6 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, email, institution, qualifications, or specialization..."
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50/50"
            />
          </div>

          {/* Date Filter */}
          <div className="md:col-span-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-400 shrink-0" />
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value as any)}
                className="w-full py-2 px-3 text-xs rounded-xl border border-gray-200 bg-gray-50/50 text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">Submission Date: All Time</option>
                <option value="today">Submitted Today</option>
                <option value="7days">Last 7 Days</option>
                <option value="30days">Last 30 Days</option>
              </select>
            </div>
          </div>

          {/* Sort By */}
          <div className="md:col-span-3">
            <div className="flex items-center gap-2">
              <ArrowUpDown className="h-4 w-4 text-gray-400 shrink-0" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full py-2 px-3 text-xs rounded-xl border border-gray-200 bg-gray-50/50 text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="newest">Sort: Newest First</option>
                <option value="oldest">Sort: Oldest First</option>
                <option value="experience">Sort: Highest Experience</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Applications List */}
      <div className="space-y-4">
        {filteredApplications.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-gray-200/80 shadow-sm space-y-3">
            <div className="h-16 w-16 mx-auto rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <GraduationCap className="h-8 w-8" />
            </div>
            <h3 className="text-base font-bold text-gray-900">No Instructor Applications Found</h3>
            <p className="text-xs text-gray-500 max-w-md mx-auto">
              There are currently no applications matching your filter criteria. You can clear filters or seed realistic test applications to verify the queue flow.
            </p>
            <div className="flex justify-center gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setStatusFilter('all');
                  setDateFilter('all');
                  setSearchQuery('');
                }}
                className="text-xs"
              >
                Reset Filters
              </Button>
              <Button
                size="sm"
                disabled={isSeeding}
                onClick={handleSeedDemo}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs"
              >
                <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                Seed Sample Applications
              </Button>
            </div>
          </div>
        ) : (
          filteredApplications.map((app) => {
            const applicantName = app.user?.name || 'Applicant';
            const applicantEmail = app.user?.email || 'N/A';
            const applicantPhone = app.user?.phone || 'N/A';
            const currentRole = app.user?.role || 'STUDENT';

            return (
              <div
                key={app.id}
                className="p-5 rounded-2xl bg-white border border-gray-200/80 shadow-sm hover:shadow-md transition-all space-y-4"
              >
                {/* Top Row: User + Status + Date */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
                  <div className="flex items-center gap-3.5">
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white font-bold text-lg flex items-center justify-center shrink-0 uppercase shadow-sm">
                      {applicantName.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-gray-900">{applicantName}</h4>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-gray-100 text-gray-600">
                          {currentRole}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 text-xs text-gray-500 mt-0.5">
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3 text-gray-400" /> {applicantEmail}
                        </span>
                        {applicantPhone !== 'N/A' && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3 text-gray-400" /> {applicantPhone}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right text-xs text-gray-500 hidden sm:block">
                      <span className="block font-medium text-gray-700">
                        {new Date(app.submissionDate).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                      <span className="text-[11px] text-gray-400">
                        {new Date(app.submissionDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    {getStatusBadge(app.approval_status)}
                  </div>
                </div>

                {/* Middle Row: Institution, Specialization, Qualifications */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  {/* Institution */}
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                      <Building2 className="h-3.5 w-3.5 text-indigo-500" /> Institution
                    </span>
                    <p className="font-semibold text-gray-900">{app.institution}</p>
                  </div>

                  {/* Specialization */}
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                      <Award className="h-3.5 w-3.5 text-violet-500" /> Track & Experience
                    </span>
                    <p className="font-semibold text-gray-900">{app.subjectSpecialization}</p>
                    <p className="text-[11px] text-indigo-600 font-medium">
                      {app.experienceYears}+ Years Practical/Teaching
                    </p>
                  </div>

                  {/* Attached Verification Data badges */}
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" /> Verification Assets
                    </span>
                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      {app.cvUrl && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
                          <FileText className="h-2.5 w-2.5" /> CV Attached
                        </span>
                      )}
                      {app.idVerificationUrl && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <ShieldCheck className="h-2.5 w-2.5" /> ID Verified
                        </span>
                      )}
                      {app.sampleLectureUrl && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-rose-50 text-rose-700 border border-rose-200">
                          <Video className="h-2.5 w-2.5" /> Demo Lecture
                        </span>
                      )}
                      {app.linkedinUrl && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-sky-50 text-sky-700 border border-sky-200">
                          LinkedIn
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Qualifications pills */}
                {app.qualifications && app.qualifications.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[11px] font-bold text-gray-400 mr-1">Qualifications:</span>
                    {app.qualifications.map((q, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200"
                      >
                        {q}
                      </span>
                    ))}
                  </div>
                )}

                {/* Bio Snippet */}
                {app.bio && (
                  <p className="text-xs text-gray-600 line-clamp-2 bg-gray-50/70 p-2.5 rounded-lg border border-gray-100 italic">
                    &ldquo;{app.bio}&rdquo;
                  </p>
                )}

                {/* Remarks if any */}
                {app.remarks && (
                  <div className="text-xs p-2.5 rounded-lg bg-amber-50/80 border border-amber-200 text-amber-900">
                    <span className="font-bold">Remarks:</span> {app.remarks}
                  </div>
                )}

                {/* Bottom Action Bar */}
                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                  <div className="text-[11px] text-gray-400">
                    ID: <span className="font-mono text-gray-600">{app.id}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      onClick={() => handleOpenInspect(app)}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold py-1.5 px-4 rounded-xl shadow-sm flex items-center gap-1.5"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      Inspect & Verify Dossier
                    </Button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Verification & Decision Modal */}
      {selectedApp && (
        <InstructorVerificationModal
          application={selectedApp}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedApp(null);
          }}
          onSuccess={handleActionSuccess}
        />
      )}
    </div>
  );
}
