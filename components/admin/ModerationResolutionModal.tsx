'use client';

import React, { useState } from 'react';
import {
  X,
  ShieldAlert,
  AlertTriangle,
  Trash2,
  Ban,
  HelpCircle,
  CheckCircle2,
  Loader2,
  User,
  MessageSquare,
  BookOpen,
  PlaySquare,
  FileText,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { resolveModerationTicket } from '@/actions/admin';

export interface ModerationReportItem {
  id: string;
  reporterId: string;
  reporter: {
    name?: string;
    email?: string;
    role?: string;
    image?: string;
  } | null;
  reported_type: 'Course' | 'Lesson' | 'Comment' | 'User' | string;
  targetId: string;
  targetUserId?: string;
  targetUser: {
    name?: string;
    email?: string;
    role?: string;
    status?: string;
  } | null;
  reason: string;
  rationale: string;
  status: 'Open' | 'In Review' | 'Resolved' | 'Closed' | string;
  flaggedContentPreview?: string;
  contextData?: Record<string, any>;
  actionTaken?: string;
  resolutionNote?: string;
  resolvedBy?: { name?: string; email?: string } | null;
  resolvedAt?: string;
  createdAt: string;
  updatedAt?: string;
}

interface ModerationResolutionModalProps {
  ticket: ModerationReportItem;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedId: string, actionTaken: string, note: string) => void;
}

export default function ModerationResolutionModal({
  ticket,
  isOpen,
  onClose,
  onSuccess,
}: ModerationResolutionModalProps) {
  const [actionTaken, setActionTaken] = useState<'Warning' | 'Remove' | 'Ban' | 'Other'>('Warning');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const getTypeIcon = (type: string) => {
    const t = type.toLowerCase();
    if (t === 'comment') return <MessageSquare className="h-4 w-4 text-blue-500" />;
    if (t === 'course') return <BookOpen className="h-4 w-4 text-purple-500" />;
    if (t === 'lesson') return <PlaySquare className="h-4 w-4 text-indigo-500" />;
    return <User className="h-4 w-4 text-amber-500" />;
  };

  const handleResolve = async () => {
    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const res = await resolveModerationTicket(ticket.id, actionTaken, note.trim());
      if (!res.success) {
        setErrorMsg(res.error || 'Failed to resolve moderation ticket.');
        setIsSubmitting(false);
        return;
      }

      onSuccess(ticket.id, actionTaken, note.trim());
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-2xl max-h-[90vh] flex flex-col bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-slate-900 to-indigo-950 text-white">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-rose-500/20 border border-rose-400/30 flex items-center justify-center text-rose-300">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">
                  Execute Moderation Action
                </h3>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-white/10 text-rose-200 border border-white/10">
                  {ticket.reported_type}
                </span>
              </div>
              <p className="text-xs text-indigo-200/80">
                Ticket ID: <span className="font-mono text-gray-300">{ticket.id}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-800 text-xs font-semibold">
            <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Summary Box */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                {getTypeIcon(ticket.reported_type)}
                <span className="text-xs font-bold text-gray-900">
                  Reported Entity: {ticket.reported_type}
                </span>
              </div>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
                Reason: {ticket.reason}
              </span>
            </div>

            {/* Reporter Rationale */}
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                Reporter Rationale:
              </span>
              <p className="text-xs text-gray-700 bg-white p-2.5 rounded-lg border border-gray-200 leading-relaxed italic">
                &ldquo;{ticket.rationale}&rdquo;
              </p>
              <p className="text-[10px] text-gray-400">
                Reported by: <span className="font-medium text-gray-600">{ticket.reporter?.name || 'Anonymous User'}</span> ({ticket.reporter?.email || 'N/A'})
              </p>
            </div>

            {/* In-Context Flagged Text Preview */}
            {ticket.flaggedContentPreview && (
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  Flagged Content in Context:
                </span>
                <div className="text-xs font-mono text-gray-800 bg-rose-50/60 p-3 rounded-lg border border-rose-200/80 whitespace-pre-wrap">
                  {ticket.flaggedContentPreview}
                </div>
              </div>
            )}

            {/* Offending Target User */}
            {ticket.targetUser && (
              <div className="flex items-center justify-between text-xs pt-1 border-t border-gray-200/70">
                <span className="text-gray-500">
                  Target Account: <strong className="text-gray-800">{ticket.targetUser.name}</strong> ({ticket.targetUser.email})
                </span>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-gray-200 text-gray-700">
                  Status: {ticket.targetUser.status || 'ACTIVE'}
                </span>
              </div>
            )}
          </div>

          {/* Action Selector */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">
              Select Penalty / Resolution Action (MODERATOR_ACTION)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {/* Warning */}
              <button
                type="button"
                onClick={() => setActionTaken('Warning')}
                className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                  actionTaken === 'Warning'
                    ? 'border-amber-500 bg-amber-50/80 ring-2 ring-amber-200 shadow-sm'
                    : 'border-gray-200 bg-white hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  {actionTaken === 'Warning' && <CheckCircle2 className="h-3.5 w-3.5 text-amber-600" />}
                </div>
                <div className="mt-2">
                  <span className="text-xs font-bold text-gray-900 block">Warning</span>
                  <span className="text-[10px] text-gray-500 block leading-tight mt-0.5">
                    Issue formal warning note
                  </span>
                </div>
              </button>

              {/* Remove */}
              <button
                type="button"
                onClick={() => setActionTaken('Remove')}
                className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                  actionTaken === 'Remove'
                    ? 'border-rose-500 bg-rose-50/80 ring-2 ring-rose-200 shadow-sm'
                    : 'border-gray-200 bg-white hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <Trash2 className="h-4 w-4 text-rose-600" />
                  {actionTaken === 'Remove' && <CheckCircle2 className="h-3.5 w-3.5 text-rose-600" />}
                </div>
                <div className="mt-2">
                  <span className="text-xs font-bold text-gray-900 block">Remove</span>
                  <span className="text-[10px] text-gray-500 block leading-tight mt-0.5">
                    Soft-delete or hide item
                  </span>
                </div>
              </button>

              {/* Ban */}
              <button
                type="button"
                onClick={() => setActionTaken('Ban')}
                className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                  actionTaken === 'Ban'
                    ? 'border-purple-600 bg-purple-50/80 ring-2 ring-purple-200 shadow-sm'
                    : 'border-gray-200 bg-white hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <Ban className="h-4 w-4 text-purple-600" />
                  {actionTaken === 'Ban' && <CheckCircle2 className="h-3.5 w-3.5 text-purple-600" />}
                </div>
                <div className="mt-2">
                  <span className="text-xs font-bold text-gray-900 block">Ban / Suspend</span>
                  <span className="text-[10px] text-gray-500 block leading-tight mt-0.5">
                    Suspend target user account
                  </span>
                </div>
              </button>

              {/* Other */}
              <button
                type="button"
                onClick={() => setActionTaken('Other')}
                className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                  actionTaken === 'Other'
                    ? 'border-indigo-600 bg-indigo-50/80 ring-2 ring-indigo-200 shadow-sm'
                    : 'border-gray-200 bg-white hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <HelpCircle className="h-4 w-4 text-indigo-600" />
                  {actionTaken === 'Other' && <CheckCircle2 className="h-3.5 w-3.5 text-indigo-600" />}
                </div>
                <div className="mt-2">
                  <span className="text-xs font-bold text-gray-900 block">Other</span>
                  <span className="text-[10px] text-gray-500 block leading-tight mt-0.5">
                    Custom resolution note
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* Action Consequence Info */}
          <div className="p-3 rounded-lg bg-gray-50 border border-gray-200 text-[11px] text-gray-600 space-y-1">
            <strong className="text-gray-800">Consequence of this action:</strong>
            {actionTaken === 'Remove' && (
              <p>
                The reported {ticket.reported_type.toLowerCase()} will be soft-deleted / hidden from public discussions and courses immediately.
              </p>
            )}
            {actionTaken === 'Ban' && (
              <p>
                The target user account will have its status set to <code className="bg-rose-100 text-rose-800 px-1 rounded font-semibold">SUSPENDED</code>, revoking login and platform permissions.
              </p>
            )}
            {actionTaken === 'Warning' && (
              <p>
                A formal moderation warning will be logged to MODERATOR_ACTION and recorded in the audit log.
              </p>
            )}
            {actionTaken === 'Other' && (
              <p>
                The report will be marked Resolved with the specific administrative explanation below.
              </p>
            )}
          </div>

          {/* Note Textarea */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">
              Resolution Note & Audit Rationale
            </label>
            <textarea
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={`Provide details regarding this ${actionTaken} action (e.g. 'Removed spam link and warned user as per community guidelines')...`}
              className="w-full text-xs p-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50 text-xs">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
            className="text-xs"
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={isSubmitting}
            onClick={handleResolve}
            className={`text-xs font-semibold px-5 py-2 rounded-xl text-white shadow-sm flex items-center gap-1.5 ${
              actionTaken === 'Ban'
                ? 'bg-purple-600 hover:bg-purple-700 shadow-purple-200'
                : actionTaken === 'Remove'
                ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-200'
                : actionTaken === 'Warning'
                ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-200'
                : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200'
            }`}
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
            Confirm &amp; Execute &apos;{actionTaken}&apos;
          </Button>
        </div>
      </div>
    </div>
  );
}
