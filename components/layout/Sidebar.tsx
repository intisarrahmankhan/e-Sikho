'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  BookOpen,
  Home,
  Settings,
  Target,
  LogIn,
  LayoutDashboard,
  GraduationCap,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  FileCheck,
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

interface SidebarProps {
  forcedRole?: 'STUDENT' | 'INSTRUCTOR' | 'ADMIN' | 'SUPERADMIN';
  className?: string;
  defaultCollapsed?: boolean;
}

export function Sidebar({ forcedRole, className = '', defaultCollapsed = false }: SidebarProps) {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const { t, language } = useLanguage();
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  const setCollapsedWithBroadcast = (val: boolean) => {
    setIsCollapsed(val);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('dashboard-sidebar-state', { detail: { collapsed: val } }));
    }
  };

  useEffect(() => {
    const handleToggle = () => {
      setCollapsedWithBroadcast(!isCollapsed);
    };
    window.addEventListener('toggle-dashboard-sidebar', handleToggle);
    return () => window.removeEventListener('toggle-dashboard-sidebar', handleToggle);
  }, [isCollapsed]);

  const isLoggedIn = status === 'authenticated' && !!session?.user;
  const userRole = (session?.user as any)?.role;
  const role = forcedRole || userRole;
  const isAdmin = role === 'ADMIN' || role === 'SUPERADMIN';

  const userDashboardUrl =
    role === 'ADMIN' || role === 'SUPERADMIN'
      ? '/admin'
      : role === 'INSTRUCTOR'
      ? '/instructor'
      : '/student';

  const userSettingsUrl =
    role === 'ADMIN' || role === 'SUPERADMIN'
      ? '/admin/settings'
      : role === 'INSTRUCTOR'
      ? '/instructor/settings'
      : '/student/settings';

  const navItems = [
    ...(['ADMIN', 'SUPERADMIN'].includes(role)
      ? [
          {
            name: language === 'en' ? 'Admin Overview' : 'অ্যাডমিন ওভারভিউ',
            href: '/admin',
            icon: LayoutDashboard,
            matchExact: true,
          },
          {
            name: language === 'en' ? 'Course Approvals' : 'কোর্স রিভিশন রিকোয়েস্ট',
            href: '/admin/revision-requests',
            icon: FileCheck,
          },
        ]
      : []),
    ...(role === 'SUPERADMIN'
      ? [
          {
            name: language === 'en' ? 'Global Assessments' : 'গ্লোবাল অ্যাসেসমেন্ট অনুমোদন',
            href: '/admin/assessments',
            icon: ShieldCheck,
          },
        ]
      : []),
    ...(isLoggedIn && role === 'INSTRUCTOR'
      ? [
          {
            name: language === 'en' ? 'Instructor Studio' : 'ইন্সট্রাক্টর স্টুডিও',
            href: '/instructor',
            icon: LayoutDashboard,
            matchExact: true,
          },
          {
            name: language === 'en' ? 'My Courses' : 'আমার কোর্সসমূহ',
            href: '/instructor#courses',
            icon: BookOpen,
          },
          {
            name: language === 'en' ? 'Assessment Hosting' : 'অ্যাসেসমেন্ট হোস্টিং',
            href: '/instructor/assessments',
            icon: Target,
          },
          {
            name: language === 'en' ? 'Revision Requests' : 'রিভিশন রিকোয়েস্ট',
            href: '/instructor/revision-requests',
            icon: FileCheck,
          },
          {
            name: language === 'en' ? 'Enrolled Learning' : 'আমার এনরোল্ড কোর্স',
            href: '/instructor?tab=enrolled',
            icon: GraduationCap,
          },
        ]
      : []),
    ...(isLoggedIn && !isAdmin && role !== 'INSTRUCTOR'
      ? [
          {
            name: t('sidebar.dashboard', 'ড্যাশবোর্ড'),
            href: userDashboardUrl,
            icon: LayoutDashboard,
            matchExact: true,
          },
          {
            name: t('sidebar.goals', 'গোলস ও ট্র্যাকিং'),
            href: '/student/goals',
            icon: Target,
          },
        ]
      : []),
    {
      name: t('sidebar.courses', 'কোর্সসমূহ'),
      href: '/courses',
      icon: BookOpen,
    },
    {
      name: t('sidebar.home', 'হোম পেজ'),
      href: '/',
      icon: Home,
      matchExact: true,
    },
    ...(isLoggedIn
      ? [
          {
            name: t('sidebar.settings', 'সেটিংস'),
            href: userSettingsUrl,
            icon: Settings,
          },
        ]
      : []),
  ];

  const isActive = (item: { href: string; matchExact?: boolean }) => {
    if (item.matchExact) return pathname === item.href;
    return pathname.startsWith(item.href) && item.href !== '/';
  };

  return (
    <aside
      className={`hidden md:flex flex-col border border-slate-200/80 bg-white rounded-2xl shadow-xs transition-all duration-300 shrink-0 select-none ${
        isCollapsed ? 'w-16' : 'w-60 lg:w-64'
      } ${className}`}
    >
      {/* Header / Brand & Toggle */}
      <div className={`flex h-16 items-center border-b border-slate-100 ${isCollapsed ? 'justify-center px-2' : 'justify-between px-4'}`}>
        {!isCollapsed ? (
          <Link href="/" className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-primary-600 to-indigo-600 flex items-center justify-center shrink-0 shadow-xs">
              <span className="text-white text-xs font-black tracking-tight">eS</span>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-black text-slate-900 tracking-tight leading-tight">e-Shikho</span>
              {role && (
                <span className="text-[10px] font-semibold text-primary-600 uppercase tracking-wider">
                  {role.toLowerCase()}
                </span>
              )}
            </div>
          </Link>
        ) : (
          <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-primary-600 to-indigo-600 flex items-center justify-center shrink-0 shadow-xs">
            <span className="text-white text-xs font-black tracking-tight">eS</span>
          </div>
        )}

        <button
          onClick={() => setCollapsedWithBroadcast(!isCollapsed)}
          className={`p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition ${
            isCollapsed ? 'hidden' : 'block'
          }`}
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-label="Toggle sidebar"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      </div>

      {isCollapsed && (
        <div className="pt-2 flex justify-center">
          <button
            onClick={() => setCollapsedWithBroadcast(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
            title="Expand sidebar"
            aria-label="Expand sidebar"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Nav items */}
      <nav className="flex-1 p-2 space-y-1">
        {!isCollapsed && (
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2">
            {t('sidebar.navigation', 'নেভিগেশন')}
          </p>
        )}

        {navItems.map((item) => {
          const active = isActive(item);
          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.name}
              className={`group flex items-center gap-3 rounded-xl px-2.5 py-2 text-xs font-semibold transition-all relative ${
                active
                  ? 'bg-primary-50 text-primary-700 shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              } ${isCollapsed ? 'justify-center px-2' : ''}`}
            >
              {/* Active left indicator bar */}
              {active && (
                <span className="absolute left-0 top-2 bottom-2 w-1 bg-primary-600 rounded-r-full" />
              )}
              <item.icon
                className={`h-4 w-4 shrink-0 transition-colors ${
                  active ? 'text-primary-600' : 'text-slate-400 group-hover:text-slate-600'
                }`}
              />
              {!isCollapsed && <span className="truncate">{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Guest sign-in prompt */}
      {!isLoggedIn && !isCollapsed && (
        <div className="p-3 m-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-2.5">
          <p className="text-xs font-bold text-slate-900">{t('sidebar.saveProgress', 'অগ্রগতি সংরক্ষণ করুন')}</p>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            {t('sidebar.guestDesc', 'কোর্স এনরোলমেন্ট ও কুইজ ট্র্যাক করতে সাইন ইন করুন।')}
          </p>
          <Link
            href="/login"
            className="flex items-center justify-center gap-1.5 w-full py-2 text-xs font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-lg shadow-xs transition active:scale-[0.98]"
          >
            <LogIn className="h-3.5 w-3.5" />
            <span>{t('sidebar.loginBtn', 'লগইন করুন')}</span>
          </Link>
        </div>
      )}
    </aside>
  );
}

export default Sidebar;
