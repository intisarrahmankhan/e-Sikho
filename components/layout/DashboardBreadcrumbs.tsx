'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

export function DashboardBreadcrumbs() {
  const pathname = usePathname();
  const { language } = useLanguage();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  useEffect(() => {
    const handleStateChange = (e: any) => {
      if (typeof e.detail?.collapsed === 'boolean') {
        setIsSidebarCollapsed(e.detail.collapsed);
      }
    };
    window.addEventListener('dashboard-sidebar-state', handleStateChange);
    return () => window.removeEventListener('dashboard-sidebar-state', handleStateChange);
  }, []);

  const toggleSidebar = () => {
    window.dispatchEvent(new CustomEvent('toggle-dashboard-sidebar'));
  };

  const segments = pathname.split('/').filter(Boolean);
  if (segments.length === 0) return null;

  const segmentLabels: Record<string, { en: string; bn: string }> = {
    instructor: { en: 'Instructor Studio', bn: 'ইন্সট্রাক্টর স্টুডিও' },
    admin: { en: 'Admin Portal', bn: 'অ্যাডমিন পোর্টাল' },
    student: { en: 'Student Dashboard', bn: 'স্টুডেন্ট ড্যাশবোর্ড' },
    courses: { en: 'Courses', bn: 'কোর্সসমূহ' },
    'create-course': { en: 'Create Course', bn: 'কোর্স তৈরি' },
    assessments: { en: 'Assessments', bn: 'মূল্যায়ন' },
    'revision-requests': { en: 'Revision Requests', bn: 'রিভিশন রিকোয়েস্ট' },
    settings: { en: 'Settings', bn: 'সেটিংস' },
    payouts: { en: 'Payouts', bn: 'পেআউট' },
    moderation: { en: 'Moderation', bn: 'মডারেশন' },
    audit: { en: 'Audit Logs', bn: 'অডিট লগ' },
    refunds: { en: 'Refunds', bn: 'রিফান্ড' },
    goals: { en: 'Study Goals', bn: 'পড়ার লক্ষ্য' },
  };

  return (
    <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
      {/* Breadcrumb Navigation Trail */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-slate-500 flex-wrap">
        <Link
          href="/"
          className="flex items-center gap-1 hover:text-primary-600 transition text-slate-500"
        >
          <Home className="h-3.5 w-3.5" />
          <span className="sr-only">Home</span>
        </Link>

        {segments.map((seg, idx) => {
          const isLast = idx === segments.length - 1;
          const href = `/${segments.slice(0, idx + 1).join('/')}`;
          const labelObj = segmentLabels[seg];
          const label = labelObj ? (language === 'en' ? labelObj.en : labelObj.bn) : seg;

          return (
            <React.Fragment key={href}>
              <ChevronRight className="h-3 w-3 text-slate-400 shrink-0" />
              {isLast ? (
                <span className="font-semibold text-slate-900 truncate max-w-[200px]">
                  {label}
                </span>
              ) : (
                <Link
                  href={href}
                  className="hover:text-primary-600 transition truncate max-w-[150px]"
                >
                  {label}
                </Link>
              )}
            </React.Fragment>
          );
        })}
      </nav>

      {/* Quick Sidebar Toggle for extra screen real estate */}
      <button
        onClick={toggleSidebar}
        className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-200/90 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 shadow-2xs transition"
        title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar for full-width view'}
      >
        {isSidebarCollapsed ? (
          <>
            <PanelLeftOpen className="h-3.5 w-3.5 text-primary-600" />
            <span>{language === 'en' ? 'Show Sidebar' : 'সাইডবার দেখান'}</span>
          </>
        ) : (
          <>
            <PanelLeftClose className="h-3.5 w-3.5 text-slate-500" />
            <span>{language === 'en' ? 'Full Width' : 'ফুল স্ক্রিন'}</span>
          </>
        )}
      </button>
    </div>
  );
}

export default DashboardBreadcrumbs;
