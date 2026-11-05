'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Search,
  User,
  LogOut,
  LogIn,
  UserPlus,
  BookOpen,
  LayoutDashboard,
  Home,
  Target,
  Trophy,
  Award,
  Heart,
  GraduationCap,
  Menu,
  X,
  Settings,
  ChevronDown,
} from 'lucide-react';
import { useSession, signOut } from 'next-auth/react';
import { Input } from '@/components/ui/Input';
import { useLanguage } from '@/context/LanguageContext';
import { LanguageToggle } from '@/components/ui/LanguageToggle';
import { NotificationBell } from '@/components/notifications/NotificationBell';

export function Navbar() {
  const { data: session, status } = useSession();
  const { t, language } = useLanguage();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setIsProfileDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard shortcut for Cmd+K / Ctrl+K
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsProfileDropdownOpen(false);
  }, [pathname]);

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
      setIsMobileMenuOpen(false);
    }
  };

  const role = (session?.user as any)?.role;
  const isAdmin = role === 'ADMIN' || role === 'SUPERADMIN';
  const userDashboardUrl =
    role === 'ADMIN' || role === 'SUPERADMIN'
      ? '/admin'
      : role === 'INSTRUCTOR'
        ? '/instructor'
        : '/student';

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-md shadow-xs transition-all">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-3 sm:px-6 lg:px-8">
        {/* Left: Brand Logo & Desktop Search */}
        <div className="flex items-center gap-3 sm:gap-5 shrink-0">
          <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-primary-600 to-indigo-600 flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform duration-200">
              <span className="text-white text-xs font-black tracking-tight">eS</span>
            </div>
            <span className="text-xl font-black text-slate-900 tracking-tight">e-Shikho</span>
          </Link>

          {/* Desktop Search with Cmd+K pill */}
          <form onSubmit={handleSearchSubmit} className="hidden lg:flex relative w-48 xl:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
            <Input
              ref={searchInputRef}
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('nav.searchPlaceholder')}
              className="pl-9 pr-12 h-9 bg-slate-50 border-slate-200 text-xs rounded-full focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-primary-500/20 focus-visible:border-primary-500 w-full transition-all"
            />
            <kbd className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 hidden xl:inline-flex h-4 items-center gap-0.5 rounded border border-slate-200 bg-white px-1.5 font-mono text-[9px] font-medium text-slate-400 shadow-2xs">
              ⌘K
            </kbd>
          </form>
        </div>

        {/* Center: Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-1.5">
          <Link
            href="/courses"
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              pathname.startsWith('/courses')
                ? 'bg-primary-50 text-primary-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <BookOpen className="h-3.5 w-3.5 text-primary-600" />
            <span>{t('nav.courses')}</span>
          </Link>

          <Link
            href="/exams"
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              pathname.startsWith('/exams')
                ? 'bg-primary-50 text-primary-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Target className="h-3.5 w-3.5 text-purple-600" />
            <span>{t('nav.exams')}</span>
          </Link>

          <Link
            href="/contests"
            className={`hidden xl:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              pathname.startsWith('/contests')
                ? 'bg-amber-50 text-amber-700 font-bold shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Trophy className="h-3.5 w-3.5 text-amber-500" />
            <span>{language === 'en' ? 'Arena' : 'অ্যারেনা'}</span>
          </Link>

          <Link
            href="/leaderboard"
            className={`hidden xl:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              pathname.startsWith('/leaderboard')
                ? 'bg-indigo-50 text-indigo-700 font-bold shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Award className="h-3.5 w-3.5 text-indigo-600" />
            <span>{language === 'en' ? 'Leaderboard' : 'লিডারবোর্ড'}</span>
          </Link>
        </nav>

        {/* Right: Controls & Profile */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Global EN / BN Language Switcher */}
          <div className="shrink-0">
            <LanguageToggle />
          </div>

          {status === 'authenticated' && session?.user ? (
            <>
              {/* Wishlist Link */}
              <Link
                href="/wishlist"
                title={language === 'en' ? 'My Wishlist' : 'আমার উইশলিস্ট'}
                className={`p-2 rounded-xl transition-all relative shrink-0 ${
                  pathname === '/wishlist'
                    ? 'bg-rose-50 text-rose-600'
                    : 'text-slate-600 hover:text-rose-600 hover:bg-rose-50'
                }`}
              >
                <Heart className={`h-4 w-4 ${pathname === '/wishlist' ? 'fill-rose-500 text-rose-500' : ''}`} />
              </Link>

              {/* Real-time Notification Bell */}
              <div className="shrink-0">
                <NotificationBell />
              </div>

              {/* Role-specific Quick Links */}
              {role === 'INSTRUCTOR' ? (
                <div className="flex items-center gap-1 shrink-0">
                  <Link
                    href="/instructor"
                    id="nav-instructor-studio"
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                      pathname === '/instructor'
                        ? 'bg-primary-50 text-primary-700 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                    title={language === 'en' ? 'Instructor Studio' : 'ইন্সট্রাক্টর স্টুডিও'}
                  >
                    <LayoutDashboard className="h-3.5 w-3.5 text-primary-600" />
                    <span>{language === 'en' ? 'Studio' : 'স্টুডিও'}</span>
                  </Link>
                  <Link
                    href="/instructor?tab=enrolled"
                    id="nav-my-learning"
                    className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                      pathname.startsWith('/instructor?tab=enrolled')
                        ? 'bg-emerald-50 text-emerald-700 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                    title={language === 'en' ? 'My Learning' : 'আমার কোর্স'}
                  >
                    <GraduationCap className="h-3.5 w-3.5 text-emerald-600" />
                    <span>{language === 'en' ? 'My Learning' : 'শিক্ষা'}</span>
                  </Link>
                </div>
              ) : (
                <Link
                  href={userDashboardUrl}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-all shrink-0 ${
                    pathname.startsWith('/student') ||
                    pathname.startsWith('/instructor') ||
                    pathname.startsWith('/admin')
                      ? 'bg-primary-50 text-primary-700 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <LayoutDashboard className="h-3.5 w-3.5 text-primary-600" />
                  <span className="hidden sm:inline">{t('nav.dashboard')}</span>
                </Link>
              )}

              {/* User Profile Dropdown Container */}
              <div className="relative shrink-0" ref={profileDropdownRef}>
                <button
                  onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                  className="flex items-center gap-1.5 p-1 rounded-full hover:bg-slate-100 transition-all border border-transparent hover:border-slate-200"
                  aria-expanded={isProfileDropdownOpen}
                  aria-label="User menu"
                >
                  <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-primary-600 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shadow-xs">
                    {session.user.name ? session.user.name.charAt(0).toUpperCase() : <User className="h-3.5 w-3.5" />}
                  </div>
                  <ChevronDown className={`h-3.5 w-3.5 text-slate-500 transition-transform duration-200 ${isProfileDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Sleek Profile Dropdown Menu */}
                {isProfileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-2xl shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-4 py-3 border-b border-slate-100">
                      <p className="text-xs font-bold text-slate-900 truncate">
                        {session.user.name || 'User'}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">
                        {session.user.email}
                      </p>
                      {role && (
                        <span className="inline-block mt-1.5 px-2 py-0.5 text-[10px] font-semibold bg-primary-50 text-primary-700 rounded-full border border-primary-100">
                          {role}
                        </span>
                      )}
                    </div>

                    <div className="py-1">
                      <Link
                        href={userDashboardUrl}
                        onClick={() => setIsProfileDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition"
                      >
                        <LayoutDashboard className="h-4 w-4 text-primary-600" />
                        <span>{t('nav.dashboard')}</span>
                      </Link>

                      <Link
                        href={isAdmin ? '/admin/settings' : `${userDashboardUrl}/settings`}
                        onClick={() => setIsProfileDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition"
                      >
                        <Settings className="h-4 w-4 text-slate-500" />
                        <span>{language === 'en' ? 'Account Settings' : 'অ্যাকাউন্ট সেটিংস'}</span>
                      </Link>
                    </div>

                    <div className="pt-1 border-t border-slate-100">
                      <button
                        onClick={handleLogout}
                        disabled={isLoggingOut}
                        className="flex items-center gap-2.5 w-full px-4 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 transition"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>{isLoggingOut ? t('nav.loggingOut') : t('nav.logout')}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-1.5 sm:gap-2 border-l border-slate-200 pl-2 shrink-0">
              <Link
                href="/login?tab=login"
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg border border-slate-200 transition"
              >
                <LogIn className="h-3.5 w-3.5" />
                <span>{t('nav.login')}</span>
              </Link>
              <Link
                href="/login?tab=signup"
                className="hidden sm:inline-flex items-center gap-1 px-3.5 py-1.5 text-xs font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-lg shadow-xs transition active:scale-[0.98]"
              >
                <UserPlus className="h-3.5 w-3.5" />
                <span>{t('nav.signup')}</span>
              </Link>
            </div>
          )}

          {/* Mobile / Tablet Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="xl:hidden p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 transition shrink-0 ml-0.5"
            aria-label="Toggle navigation menu"
          >
            {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation with backdrop */}
      {isMobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 top-16 bg-slate-950/20 backdrop-blur-xs z-30 xl:hidden animate-in fade-in duration-200"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="relative z-40 xl:hidden border-t border-slate-200/80 bg-white px-4 pt-4 pb-6 space-y-4 shadow-xl animate-in slide-in-from-top-4 duration-200">
            {/* Mobile Search */}
            <form onSubmit={handleSearchSubmit} className="relative w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              <Input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('nav.searchPlaceholder')}
                className="pl-10 h-10 bg-slate-50 border-slate-200 text-xs rounded-full focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-primary-500/20 w-full"
              />
            </form>

            {/* Navigation Grid */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <Link
                href="/"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-2.5 p-3 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 border border-slate-100 transition"
              >
                <Home className="h-4 w-4 text-primary-600" />
                <span>{t('nav.home')}</span>
              </Link>

              <Link
                href="/courses"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-2.5 p-3 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 border border-slate-100 transition"
              >
                <BookOpen className="h-4 w-4 text-primary-600" />
                <span>{t('nav.courses')}</span>
              </Link>

              <Link
                href="/exams"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-2.5 p-3 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 border border-slate-100 transition"
              >
                <Target className="h-4 w-4 text-purple-600" />
                <span>{t('nav.exams')}</span>
              </Link>

              <Link
                href="/contests"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-2.5 p-3 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 border border-slate-100 transition"
              >
                <Trophy className="h-4 w-4 text-amber-500" />
                <span>{language === 'en' ? 'Contests & Arena' : 'কনটেস্ট অ্যারেনা'}</span>
              </Link>

              <Link
                href="/leaderboard"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-2.5 p-3 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 border border-slate-100 transition"
              >
                <Award className="h-4 w-4 text-indigo-600" />
                <span>{language === 'en' ? 'Leaderboard' : 'লিডারবোর্ড'}</span>
              </Link>

              <Link
                href="/wishlist"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-2.5 p-3 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 border border-slate-100 transition"
              >
                <Heart className="h-4 w-4 text-rose-500" />
                <span>{language === 'en' ? 'My Wishlist' : 'আমার উইশলিস্ট'}</span>
              </Link>

              {role === 'INSTRUCTOR' && (
                <Link
                  href="/instructor?tab=enrolled"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-2.5 p-3 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 border border-slate-100 col-span-2 transition"
                >
                  <GraduationCap className="h-4 w-4 text-emerald-600" />
                  <span>{language === 'en' ? 'My Learning Journey (Enrolled Courses)' : 'আমার কোর্স ও শিক্ষা'}</span>
                </Link>
              )}
            </div>
          </div>
        </>
      )}
    </header>
  );
}

export default Navbar;
