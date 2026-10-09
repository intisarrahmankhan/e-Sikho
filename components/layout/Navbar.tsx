'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Search, User, LogOut, LogIn, UserPlus, BookOpen, LayoutDashboard, Home, Target } from 'lucide-react';
import { useSession, signOut } from 'next-auth/react';
import { Input } from '@/components/ui/Input';
import { useLanguage } from '@/context/LanguageContext';
import { LanguageToggle } from '@/components/ui/LanguageToggle';

export function Navbar() {
  const { data: session, status } = useSession();
  const { t } = useLanguage();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    setIsLoggingOut(true);
    const isPublicPage = pathname === '/' || pathname.startsWith('/courses');
    const callbackUrl = isPublicPage ? pathname : '/login';
    await signOut({ callbackUrl });
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
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-gray-200 bg-white px-4 md:px-8 shadow-sm">
      {/* Left: Brand Logo & Search */}
      <div className="flex items-center gap-6">
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <div className="h-8 w-8 rounded-lg bg-primary-600 flex items-center justify-center shrink-0 shadow-sm">
            <span className="text-white text-xs font-bold tracking-tight">eS</span>
          </div>
          <span className="text-lg font-bold text-gray-900 tracking-tight">e-Shikho</span>
        </Link>

        <form onSubmit={handleSearchSubmit} className="hidden sm:flex relative w-64 md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          <Input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('nav.searchPlaceholder')}
            className="pl-9 h-9 bg-gray-50 border-gray-200 text-xs rounded-lg focus-visible:bg-white focus-visible:ring-1 focus-visible:ring-primary-600"
          />
        </form>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-1.5 sm:gap-3">
        {/* Navigation links */}
        <Link
          href="/"
          className={`hidden md:inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition ${
            pathname === '/'
              ? 'bg-primary-50 text-primary-700'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <Home className="h-4 w-4" />
          <span>{t('nav.home')}</span>
        </Link>

        <Link
          href="/courses"
          className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition ${
            pathname.startsWith('/courses')
              ? 'bg-primary-50 text-primary-700'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <BookOpen className="h-4 w-4" />
          <span>{t('nav.courses')}</span>
        </Link>

        <Link
          href="/exams"
          className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition ${
            pathname.startsWith('/exams')
              ? 'bg-primary-50 text-primary-700'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <Target className="h-4 w-4" />
          <span>{t('nav.exams')}</span>
        </Link>

        {/* Global EN / BN Language Switcher */}
        <div className="ml-1">
          <LanguageToggle />
        </div>

        {status === 'authenticated' && session?.user ? (
          <>
            <Link
              href={userDashboardUrl}
              className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition ${
                pathname.startsWith('/student') ||
                pathname.startsWith('/instructor') ||
                pathname.startsWith('/admin')
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <LayoutDashboard className="h-4 w-4" />
              <span>{t('nav.dashboard')}</span>
            </Link>

            <div className="flex items-center gap-2 border-l border-gray-200 pl-3 ml-1">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-primary-600 flex items-center justify-center text-white font-semibold text-xs shrink-0">
                  {session.user.name ? session.user.name.charAt(0).toUpperCase() : <User className="h-4 w-4" />}
                </div>
                <div className="hidden lg:flex flex-col text-left leading-tight">
                  <span className="text-xs font-semibold text-gray-900">
                    {session.user.name || 'User'}
                  </span>
                  {role && (
                    <span className="text-[10px] text-gray-500 capitalize">{role.toLowerCase()}</span>
                  )}
                </div>
              </div>

              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="ml-1 flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg border border-gray-200 hover:border-red-200 disabled:opacity-50 transition"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">
                  {isLoggingOut ? t('nav.loggingOut') : t('nav.logout')}
                </span>
              </button>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-2 border-l border-gray-200 pl-3 ml-1">
            <Link
              href="/login?tab=login"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg border border-gray-200 transition"
            >
              <LogIn className="h-4 w-4" />
              <span>{t('nav.login')}</span>
            </Link>
            <Link
              href="/login?tab=signup"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-lg shadow-sm transition"
            >
              <UserPlus className="h-4 w-4" />
              <span>{t('nav.signup')}</span>
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}

export default Navbar;
