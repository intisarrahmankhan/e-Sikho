import React from 'react';
import Link from 'next/link';
import { BookOpen, Home, Settings, Target } from 'lucide-react';

export function Sidebar() {
  const navItems = [
    { name: 'Dashboard', href: '/student', icon: Home },
    { name: 'My Courses', href: '/student/courses', icon: BookOpen },
    { name: 'Goals', href: '/student/goals', icon: Target },
    { name: 'Settings', href: '/student/settings', icon: Settings },
  ];

  return (
    <aside className="hidden w-64 flex-col border-r border-slate-200 bg-white md:flex">
      <div className="flex h-16 items-center border-b border-slate-200 px-6">
        <Link href="/" className="flex items-center gap-2 font-bold text-primary-900 text-lg">
          <div className="h-6 w-6 rounded bg-primary-600 flex items-center justify-center">
            <span className="text-white text-xs">eS</span>
          </div>
          e-Shikho
        </Link>
      </div>
      <nav className="flex-1 space-y-1 p-4">
        {navItems.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-900"
          >
            <item.icon className="h-4 w-4" />
            {item.name}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
