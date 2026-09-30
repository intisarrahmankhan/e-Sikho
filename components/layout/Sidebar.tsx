'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { BookOpen, Home, Settings, Target, LogIn, LayoutDashboard, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';

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
    { name: 'কোর্সসমূহ (Courses)', href: '/courses', icon: BookOpen },
    ...(isLoggedIn
      ? [
          { name: 'ড্যাশবোর্ড', href: userDashboardUrl, icon: LayoutDashboard },
          { name: 'গোলস ও ট্র্যাকিং', href: '/student/goals', icon: Target },
          { name: 'সেটিংস', href: '/student/settings', icon: Settings },
        ]
      : []),
  ];

  const isActive = (item: { href: string; matchExact?: boolean }) => {
    if (item.matchExact) {
      return pathname === item.href;
    }
    return pathname.startsWith(item.href);
  };

  return (
    <aside className="hidden w-64 flex-col border-r border-slate-200 bg-white md:flex min-h-screen shrink-0">
      <div className="flex h-16 items-center border-b border-slate-200 px-6">
        <Link href="/" className="flex items-center gap-2 font-bold text-primary-900 text-lg">
          <div className="h-7 w-7 rounded-lg bg-primary-600 flex items-center justify-center shadow-sm">
            <span className="text-white text-xs font-black">eS</span>
          </div>
          <span className="bg-gradient-to-r from-primary-900 to-primary-600 bg-clip-text text-transparent">
            e-Shikho
          </span>
        </Link>
      </div>

      <nav className="flex-1 space-y-1 p-4">
        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-3 mb-2">
          মেনু
        </div>
        {navItems.map((item) => {
          const active = isActive(item);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? 'bg-primary-50 text-primary-700 font-semibold'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <item.icon className={`h-4 w-4 ${active ? 'text-primary-600' : 'text-slate-400'}`} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Guest Callout in sidebar */}
      {!isLoggedIn && (
        <div className="p-4 m-3 bg-gradient-to-br from-primary-50 to-indigo-50 border border-primary-100 rounded-xl space-y-3 text-center">
          <div className="h-8 w-8 mx-auto rounded-full bg-primary-600/10 flex items-center justify-center text-primary-600">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900">আপনার অগ্রগতি সংরক্ষণ করুন</h4>
            <p className="text-[11px] text-slate-500 mt-0.5">
              কোর্স এনরোলমেন্ট ও কুইজ ট্র্যাক করতে সাইন ইন করুন
            </p>
          </div>
          <Link href="/login" className="block w-full">
            <Button size="sm" className="w-full text-xs bg-primary-600 hover:bg-primary-700 text-white font-medium py-1.5 shadow-sm">
              <LogIn className="h-3 w-3 mr-1.5" />
              লগইন করুন
            </Button>
          </Link>
        </div>
      )}
    </aside>
  );
}
