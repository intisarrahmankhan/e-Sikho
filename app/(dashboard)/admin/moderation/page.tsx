import React from 'react';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  ShieldAlert,
  ChevronRight,
  ArrowLeft,
  LayoutDashboard,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import dbConnect from '@/lib/mongoose';
import Report from '@/models/Report';
import User from '@/models/User';
import ModerationQueue from '@/components/admin/ModerationQueue';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Content Moderation Queue & Flagged Items | Admin Portal',
  description:
    'Review flagged discussions, lessons, courses, and user profiles. Execute moderation penalties with immutable audit tracking.',
};

export default async function ModerationPage() {
  const session = await auth();
  if (!session || !session.user) {
    redirect('/login');
  }

  const role = (session.user as any)?.role;
  if (role !== 'ADMIN' && role !== 'SUPERADMIN' && role !== 'MODERATOR') {
    redirect('/student');
  }

  await dbConnect();

  const rawReports = await Report.find({})
    .populate({ path: 'reporterId', select: 'name email role image' })
    .populate({ path: 'targetUserId', select: 'name email role status image' })
    .populate({ path: 'resolvedBy', select: 'name email' })
    .sort({ createdAt: -1 })
    .lean();

  // Plain JSON serialization to avoid RSC warnings
  const serializedReports = JSON.parse(JSON.stringify(rawReports)).map((r: any) => ({
    id: r._id,
    reporterId: r.reporterId?._id || r.reporterId,
    reporter: r.reporterId && typeof r.reporterId === 'object' ? r.reporterId : null,
    reported_type: r.reported_type,
    targetId: r.targetId,
    targetUserId: r.targetUserId?._id || r.targetUserId,
    targetUser: r.targetUserId && typeof r.targetUserId === 'object' ? r.targetUserId : null,
    reason: r.reason,
    rationale: r.rationale,
    status: r.status || 'Open',
    flaggedContentPreview: r.flaggedContentPreview || '',
    contextData: r.contextData || {},
    actionTaken: r.actionTaken || '',
    resolutionNote: r.resolutionNote || '',
    resolvedBy: r.resolvedBy,
    resolvedAt: r.resolvedAt,
    createdAt: r.createdAt || new Date().toISOString(),
    updatedAt: r.updatedAt,
  }));

  return (
    <div className="min-h-screen bg-slate-50/50 pb-16">
      {/* Top Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-rose-950 to-slate-900 text-white border-b border-rose-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-4">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 text-xs text-rose-300 font-medium">
            <Link
              href="/admin"
              className="hover:text-white transition-colors flex items-center gap-1"
            >
              <LayoutDashboard className="h-3.5 w-3.5" /> Admin Dashboard
            </Link>
            <ChevronRight className="h-3.5 w-3.5 text-rose-400/60" />
            <span className="text-white font-semibold">Moderation</span>
            <ChevronRight className="h-3.5 w-3.5 text-rose-400/60" />
            <span className="text-rose-200">Flagged Items & Content Queue</span>
          </nav>

          {/* Title Area */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-1">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-rose-500/20 border border-rose-400/30 flex items-center justify-center text-rose-300 shadow-inner">
                  <ShieldAlert className="h-5 w-5" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                  Content Moderation & Flagged Queue
                </h1>
              </div>
              <p className="text-xs sm:text-sm text-rose-200/80 max-w-2xl pl-13">
                Review user-reported courses, lessons, comments, and profile accounts. Verify in-context evidence,
                execute penalties (Warning, Remove, Ban, Other), and record immutable logs in MODERATOR_ACTION.
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

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-4">
        <ModerationQueue initialReports={serializedReports} />
      </main>
    </div>
  );
}
