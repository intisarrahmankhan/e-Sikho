'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { BookOpen, Home, Settings, Target, LogIn, LayoutDashboard } from 'lucide-react';

export function Sidebar() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const isLoggedIn = status === 'authenticated' && !!session?.user;
  const role = (session?.user as any)?.role;

  const userDashboardUrl =
    role === 'ADMIN' || role === 'SUPERADMIN'
      ? '/admin'
      : role === 'INSTRUCTOR'
      ? '/instructor'
      : '/student';

  const navItems = [
    { name: 'হোম পেজ', href: '/', icon: Home, matchExact: true },
    { name: 'কোর্সসমূহ', href: '/courses', icon: BookOpen },
    ...(isLoggedIn
      ? [
          { name: 'ড্যাশবোর্ড', href: userDashboardUrl, icon: LayoutDashboard },
          { name: 'গোলস ও ট্র্যাকিং', href: '/student/goals', icon: Target },
          { name: 'সেটিংস', href: '/student/settings', icon: Settings },
        ]
      : []),
  ];

  const isActive = (item: { href: string; matchExact?: boolean }) => {
    if (item.matchExact) return pathname === item.href;
    return pathname.startsWith(item.href);
  };

  return (
    <aside className="hidden w-60 flex-col border-r border-gray-200 bg-white md:flex min-h-screen shrink-0">
      {/* Brand */}
      <div className="flex h-14 items-center border-b border-gray-200 px-5">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-lg bg-primary-600 flex items-center justify-center shrink-0">
            <span className="text-white text-[11px] font-bold tracking-tight">eS</span>
          </div>
          <span className="text-base font-bold text-gray-900 tracking-tight">e-Shikho</span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-3 mb-2">
          নেভিগেশন
        </p>
        {navItems.map((item) => {
          const active = isActive(item);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium ${
                active
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <item.icon className={`h-4 w-4 shrink-0 ${active ? 'text-primary-600' : 'text-gray-400'}`} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Guest sign-in prompt */}
      {!isLoggedIn && (
        <div className="p-3 m-3 bg-gray-50 border border-gray-200 rounded-lg space-y-3">
          <p className="text-xs font-semibold text-gray-800">অগ্রগতি সংরক্ষণ করুন</p>
          <p className="text-[11px] text-gray-500 leading-relaxed">
            কোর্স এনরোলমেন্ট ও কুইজ ট্র্যাক করতে সাইন ইন করুন।
          </p>
          <Link
            href="/login"
            className="flex items-center justify-center gap-1.5 w-full py-1.5 text-xs font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-md"
          >
            <LogIn className="h-3.5 w-3.5" />
            লগইন করুন
          </Link>
        </div>
      )}
    </aside>
  );
}
