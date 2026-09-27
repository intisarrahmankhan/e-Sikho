'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Bell, Search, User, LogOut, LogIn, BookOpen, LayoutDashboard, Sparkles } from 'lucide-react';
import { useSession, signOut } from 'next-auth/react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

export function Navbar() {
  const { data: session, status } = useSession();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await signOut({ callbackUrl: '/login' });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/courses?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const role = (session?.user as any)?.role;
  const userDashboardUrl = 
    role === 'ADMIN' || role === 'SUPERADMIN' 
      ? '/admin' 
      : role === 'INSTRUCTOR' 
      ? '/instructor' 
      : '/student';

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white px-4 shadow-sm md:px-6">
      {/* Left / Search */}
      <div className="flex flex-1 items-center gap-4">
        <form onSubmit={handleSearchSubmit} className="hidden max-w-sm flex-1 sm:flex relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="কোর্স সার্চ করুন..."
            className="pl-8 bg-slate-50 border-slate-200 focus-visible:bg-white text-sm"
          />
        </form>
      </div>

      {/* Right / Actions */}
      <div className="flex items-center gap-3">
        <Link
          href="/courses"
          className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition ${
            pathname.startsWith('/courses')
              ? 'text-primary-600 bg-primary-50 font-semibold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <BookOpen className="h-4 w-4" />
          <span>সকল কোর্স</span>
        </Link>

        {status === 'authenticated' && session?.user ? (
          <>
            <Link
              href={userDashboardUrl}
              className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition ${
                pathname.startsWith('/student') || pathname.startsWith('/instructor') || pathname.startsWith('/admin')
                  ? 'text-primary-600 bg-primary-50 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <LayoutDashboard className="h-4 w-4" />
              <span>ড্যাশবোর্ড</span>
            </Link>

            <div className="flex items-center gap-2 border-l border-slate-200 pl-3">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-primary-100 border border-primary-200 flex items-center justify-center text-primary-700 font-bold text-xs">
                  {session.user.name ? session.user.name.charAt(0).toUpperCase() : <User className="h-4 w-4" />}
                </div>
                <div className="hidden lg:flex flex-col text-left">
                  <span className="text-xs font-semibold text-slate-800 leading-tight">
                    {session.user.name || 'User'}
                  </span>
                  {role && (
                    <span className="text-[10px] text-primary-600 font-medium capitalize">
                      {role.toLowerCase()}
                    </span>
                  )}
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="flex items-center gap-1.5 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200 ml-1"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{isLoggingOut ? 'লগআউট...' : 'লগআউট'}</span>
              </Button>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-2 border-l border-slate-200 pl-3">
            <Link href="/login">
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-1.5 text-xs text-slate-700 hover:text-primary-600 border-slate-300"
              >
                <LogIn className="h-3.5 w-3.5" />
                <span>লগইন</span>
              </Button>
            </Link>

            <Link href="/courses">
              <Button
                size="sm"
                className="flex items-center gap-1.5 text-xs bg-primary-600 hover:bg-primary-700 text-white font-medium"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">শেখা শুরু করুন</span>
                <span className="sm:hidden">কোর্স</span>
              </Button>
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
