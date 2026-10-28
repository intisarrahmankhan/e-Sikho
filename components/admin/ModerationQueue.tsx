'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  ShieldAlert,
  Filter,
  Search,
  MessageSquare,
  BookOpen,
  PlaySquare,
  User,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Trash2,
  Ban,
  Sparkles,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  Layers,
  ArrowRight,
  Eye,
  Check,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import ModerationResolutionModal, {
  ModerationReportItem,
} from '@/components/admin/ModerationResolutionModal';
import {
  updateReportStatus,
} from '@/actions/admin';

interface ModerationQueueProps {
  initialReports: ModerationReportItem[];
}

export default function ModerationQueue({ initialReports }: ModerationQueueProps) {
  const [reports, setReports] = useState<ModerationReportItem[]>(initialReports);
  const [typeFilter, setTypeFilter] = useState<'all' | 'Course' | 'Lesson' | 'Comment' | 'User'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Open' | 'In Review' | 'Resolved' | 'Closed'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTicket, setSelectedTicket] = useState<ModerationReportItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Counts by Status and Type
  const counts = useMemo(() => {
    let open = 0;
    let inReview = 0;
    let resolved = 0;
    let closed = 0;

    let courses = 0;
    let lessons = 0;
    let comments = 0;
    let users = 0;

    reports.forEach((r) => {
      const s = (r.status || '').toLowerCase();
      if (s === 'open') open++;
      else if (s === 'in review' || s === 'in_review') inReview++;
      else if (s === 'resolved') resolved++;
      else if (s === 'closed') closed++;

      const t = (r.reported_type || '').toLowerCase();
      if (t === 'course') courses++;
      else if (t === 'lesson') lessons++;
      else if (t === 'comment') comments++;
      else if (t === 'user') users++;
    });

    return {
      total: reports.length,
      open,
      inReview,
      resolved,
      closed,
      courses,
      lessons,
      comments,
      users,
    };
  }, [reports]);

  // Filtered reports
  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      // Type filter
      if (typeFilter !== 'all') {
        if (r.reported_type.toLowerCase() !== typeFilter.toLowerCase()) return false;
      }

      // Status filter
      if (statusFilter !== 'all') {
        const s = (r.status || '').toLowerCase();
        const sf = statusFilter.toLowerCase();
        if (sf === 'in review' && (s === 'in review' || s === 'in_review')) {
          // match
        } else if (s !== sf) {
          return false;
        }
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchReason = r.reason?.toLowerCase().includes(q);
        const matchRationale = r.rationale?.toLowerCase().includes(q);
        const matchPreview = r.flaggedContentPreview?.toLowerCase().includes(q);
        const matchReporter = r.reporter?.name?.toLowerCase().includes(q) || r.reporter?.email?.toLowerCase().includes(q);
        const matchTarget = r.targetUser?.name?.toLowerCase().includes(q) || r.targetUser?.email?.toLowerCase().includes(q);
        const matchNote = r.resolutionNote?.toLowerCase().includes(q);

        if (!matchReason && !matchRationale && !matchPreview && !matchReporter && !matchTarget && !matchNote) {
          return false;
        }
      }

      return true;
    });
  }, [reports, typeFilter, statusFilter, searchQuery]);

  const handleOpenResolve = (ticket: ModerationReportItem) => {
    setSelectedTicket(ticket);
    setIsModalOpen(true);
  };

  const handleResolveSuccess = (
    updatedId: string,
    actionTaken: string,
    note: string
  ) => {
    setReports((prev) =>
      prev.map((item) => {
        if (item.id === updatedId) {
          return {
            ...item,
            status: 'Resolved',
            actionTaken,
            resolutionNote: note,
            resolvedAt: new Date().toISOString(),
            targetUser:
              actionTaken === 'Ban' && item.targetUser
                ? { ...item.targetUser, status: 'SUSPENDED' }
                : item.targetUser,
          };
        }
        return item;
      })
    );

    setNotification({
      type: 'success',
      message: `Ticket successfully resolved with action '${actionTaken}'. Immutable entry created in MODERATOR_ACTION.`,
    });

    setTimeout(() => {
      setNotification(null), 5000;
    });
  };

  const handleQuickStatus = async (ticketId: string, nextStatus: 'In Review' | 'Closed') => {
    setUpdatingId(ticketId);
    try {
      const res = await updateReportStatus(ticketId, nextStatus);
      if (res.success) {
        setReports((prev) =>
          prev.map((r) => (r.id === ticketId ? { ...r, status: nextStatus } : r))
        );
      }
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Status update failed.' });
    } finally {
      setUpdatingId(null);
    }
  };



  const getTypeBadge = (type: string) => {
    const t = type.toLowerCase();
    if (t === 'comment') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
          <MessageSquare className="h-3 w-3" /> Comment
        </span>
      );
    }
    if (t === 'course') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200">
          <BookOpen className="h-3 w-3" /> Course
        </span>
      );
    }
    if (t === 'lesson') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
          <PlaySquare className="h-3 w-3" /> Lesson
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
        <User className="h-3 w-3" /> User Profile
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    const s = (status || '').toLowerCase();
    if (s === 'open') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300 animate-pulse">
          <AlertTriangle className="h-3 w-3" /> Open
        </span>
      );
    }
    if (s === 'in review' || s === 'in_review') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
          <Clock className="h-3 w-3" /> In Review
        </span>
      );
    }
    if (s === 'resolved') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
          <CheckCircle2 className="h-3 w-3" /> Resolved
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-700 border border-gray-300">
        <XCircle className="h-3 w-3" /> Closed
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {notification && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between shadow-lg border text-xs font-semibold ${
            notification.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
              : 'bg-rose-50 text-rose-900 border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span>{notification.message}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-gray-400 hover:text-gray-700">
            &times;
          </button>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Open Tickets */}
        <Card
          onClick={() => setStatusFilter('Open')}
          className={`cursor-pointer transition-all border hover:shadow-md ${
            statusFilter === 'Open'
              ? 'border-rose-500 bg-rose-50/60 ring-2 ring-rose-200'
              : 'border-gray-200 bg-white'
          }`}
        >
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-rose-700 uppercase tracking-wider flex items-center gap-1.5">
                Open Reports
                {counts.open > 0 && <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping" />}
              </p>
              <p className="text-2xl font-black text-rose-900 mt-1">{counts.open}</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-rose-100 flex items-center justify-center text-rose-600">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* In Review */}
        <Card
          onClick={() => setStatusFilter('In Review')}
          className={`cursor-pointer transition-all border hover:shadow-md ${
            statusFilter === 'In Review'
              ? 'border-amber-500 bg-amber-50/60 ring-2 ring-amber-200'
              : 'border-gray-200 bg-white'
          }`}
        >
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-amber-700 uppercase tracking-wider">Under Review</p>
              <p className="text-2xl font-black text-amber-900 mt-1">{counts.inReview}</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
              <Clock className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* Resolved */}
        <Card
          onClick={() => setStatusFilter('Resolved')}
          className={`cursor-pointer transition-all border hover:shadow-md ${
            statusFilter === 'Resolved'
              ? 'border-emerald-500 bg-emerald-50/60 ring-2 ring-emerald-200'
              : 'border-gray-200 bg-white'
          }`}
        >
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
                Actioned / Resolved
              </p>
              <p className="text-2xl font-black text-emerald-900 mt-1">{counts.resolved}</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* Total Reports */}
        <Card
          onClick={() => {
            setStatusFilter('all');
            setTypeFilter('all');
          }}
          className={`cursor-pointer transition-all border hover:shadow-md ${
            statusFilter === 'all' && typeFilter === 'all'
              ? 'border-indigo-500 bg-indigo-50/60 ring-2 ring-indigo-200'
              : 'border-gray-200 bg-white'
          }`}
        >
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Reports</p>
              <p className="text-2xl font-black text-gray-900 mt-1">{counts.total}</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-600">
              <Layers className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Categorization & Filter Bar */}
      <div className="p-5 rounded-2xl bg-white border border-gray-200/80 shadow-sm space-y-4">
        {/* Entity Type Filter Tabs (Task T-017) */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-4">
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-gray-100/90 text-xs">
            <button
              onClick={() => setTypeFilter('all')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                typeFilter === 'all'
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              All Types ({counts.total})
            </button>
            <button
              onClick={() => setTypeFilter('Comment')}
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all ${
                typeFilter === 'Comment'
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <MessageSquare className="h-3 w-3" /> Comments ({counts.comments})
            </button>
            <button
              onClick={() => setTypeFilter('Course')}
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all ${
                typeFilter === 'Course'
                  ? 'bg-white text-purple-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <BookOpen className="h-3 w-3" /> Courses ({counts.courses})
            </button>
            <button
              onClick={() => setTypeFilter('Lesson')}
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all ${
                typeFilter === 'Lesson'
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <PlaySquare className="h-3 w-3" /> Lessons ({counts.lessons})
            </button>
            <button
              onClick={() => setTypeFilter('User')}
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all ${
                typeFilter === 'User'
                  ? 'bg-white text-amber-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <User className="h-3 w-3" /> Users ({counts.users})
            </button>
          </div>

          {/* Seed demo data helper */}

        </div>

        {/* Status Pills & Search */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* Status Tabs */}
          <div className="md:col-span-6 flex items-center gap-1.5 text-xs">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mr-1">
              Status:
            </span>
            {(['all', 'Open', 'In Review', 'Resolved', 'Closed'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  statusFilter === s
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {s === 'all' ? 'All' : s}
              </button>
            ))}
          </div>

          {/* Search Bar */}
          <div className="md:col-span-6 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by report reason, rationale, offending text, or username..."
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-gray-200 bg-gray-50/60 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Flagged Items Tickets List */}
      <div className="space-y-4">
        {filteredReports.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-gray-200/80 shadow-sm space-y-3">
            <div className="h-16 w-16 mx-auto rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center">
              <ShieldAlert className="h-8 w-8" />
            </div>
            <h3 className="text-base font-bold text-gray-900">No Flagged Tickets Found</h3>
            <p className="text-xs text-gray-500 max-w-md mx-auto">
              All reported user-generated items have been moderated or no tickets match the current filter.
            </p>
            <div className="flex justify-center gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setTypeFilter('all');
                  setStatusFilter('all');
                  setSearchQuery('');
                }}
                className="text-xs"
              >
                Reset Filters
              </Button>

            </div>
          </div>
        ) : (
          filteredReports.map((ticket) => {
            const isResolved = ticket.status.toLowerCase() === 'resolved';

            return (
              <div
                key={ticket.id}
                className="p-5 rounded-2xl bg-white border border-gray-200/80 shadow-sm hover:shadow-md transition-all space-y-4"
              >
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
                  <div className="flex items-center gap-2.5">
                    {getTypeBadge(ticket.reported_type)}
                    <span className="text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-full">
                      Reason: {ticket.reason}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-400">
                      {new Date(ticket.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                    {getStatusBadge(ticket.status)}
                  </div>
                </div>

                {/* Reporter Rationale & In-Context Preview (Task T-017 Acceptance Criteria) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  {/* Left: Reporter Rationale */}
                  <div className="space-y-1.5 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                    <div className="flex items-center justify-between text-gray-500 text-[11px]">
                      <span className="font-bold uppercase tracking-wider text-gray-700">
                        Reporter Explanation:
                      </span>
                      <span>By: {ticket.reporter?.name || 'Student'} ({ticket.reporter?.email || 'N/A'})</span>
                    </div>
                    <p className="text-xs text-gray-800 leading-relaxed italic bg-white p-2.5 rounded-lg border border-gray-200">
                      &ldquo;{ticket.rationale}&rdquo;
                    </p>
                  </div>

                  {/* Right: Flagged Content in Context */}
                  <div className="space-y-1.5 p-3.5 rounded-xl bg-rose-50/50 border border-rose-200/80">
                    <div className="flex items-center justify-between text-gray-500 text-[11px]">
                      <span className="font-bold uppercase tracking-wider text-rose-800">
                        Flagged Content in Context:
                      </span>
                      {ticket.targetUser && (
                        <span className="text-rose-700 font-semibold">
                          Author: {ticket.targetUser.name}
                        </span>
                      )}
                    </div>
                    <div className="text-xs font-mono text-gray-900 bg-white p-2.5 rounded-lg border border-rose-200/60 leading-relaxed whitespace-pre-wrap max-h-24 overflow-y-auto">
                      {ticket.flaggedContentPreview || (
                        <span className="text-gray-400 italic">No direct text preview available for this entity.</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Context Metadata (Course / Lesson Title) */}
                {ticket.contextData && Object.keys(ticket.contextData).length > 0 && (
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 bg-gray-50/70 px-3.5 py-2 rounded-lg border border-gray-100">
                    {ticket.contextData.courseTitle && (
                      <span>
                        <strong className="text-gray-700">Course:</strong> {ticket.contextData.courseTitle}
                      </span>
                    )}
                    {ticket.contextData.lessonTitle && (
                      <span>
                        <strong className="text-gray-700">Lesson:</strong> {ticket.contextData.lessonTitle}
                      </span>
                    )}
                    {ticket.contextData.location && (
                      <span>
                        <strong className="text-gray-700">Location:</strong> {ticket.contextData.location}
                      </span>
                    )}
                  </div>
                )}

                {/* Resolution Notes if Resolved */}
                {isResolved && (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-1">
                    <div className="flex items-center justify-between font-bold">
                      <span className="flex items-center gap-1.5">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        Penalty Executed: {ticket.actionTaken || 'Resolved'}
                      </span>
                      {ticket.resolvedAt && (
                        <span className="text-[11px] font-normal text-emerald-700">
                          {new Date(ticket.resolvedAt).toLocaleString()}
                        </span>
                      )}
                    </div>
                    {ticket.resolutionNote && (
                      <p className="text-[11px] text-emerald-800 italic">
                        &ldquo;{ticket.resolutionNote}&rdquo;
                      </p>
                    )}
                  </div>
                )}

                {/* Bottom Action Controls */}
                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                  <div className="text-[11px] text-gray-400 font-mono">
                    ID: {ticket.id}
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Quick status transitions */}
                    {!isResolved && ticket.status !== 'In Review' && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={updatingId === ticket.id}
                        onClick={() => handleQuickStatus(ticket.id, 'In Review')}
                        className="text-xs h-8 border-gray-300 text-gray-700 hover:bg-gray-50"
                      >
                        Mark In Review
                      </Button>
                    )}

                    {!isResolved && (
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => handleOpenResolve(ticket)}
                        className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold h-8 px-4 rounded-xl shadow-sm flex items-center gap-1.5"
                      >
                        <ShieldAlert className="h-3.5 w-3.5" />
                        Take Action (MODERATOR_ACTION)
                      </Button>
                    )}

                    {isResolved && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenResolve(ticket)}
                        className="text-xs h-8 border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                      >
                        Update Penalty
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Resolution & Action Execution Modal */}
      {selectedTicket && (
        <ModerationResolutionModal
          ticket={selectedTicket}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedTicket(null);
          }}
          onSuccess={handleResolveSuccess}
        />
      )}
    </div>
  );
}
