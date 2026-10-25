'use client';

import React, { useState } from 'react';
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
  Compass,
  Settings,
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
      setIsMobileMenuOpen(false);
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
    <header className="sticky top-0 z-40 w-full border-b border-gray-200 bg-white/95 backdrop-blur-md shadow-xs transition-all">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-3 sm:px-6 lg:px-8">
        {/* Left: Brand Logo & Desktop Search */}
        <div className="flex items-center gap-3 sm:gap-5 shrink-0">
          <Link href="/" className="flex items-center gap-2 shrink-0 group">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-primary-600 to-indigo-700 flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
              <span className="text-white text-xs font-black tracking-tight">eS</span>
            </div>
            <span className="text-lg font-black text-gray-900 tracking-tight">e-Shikho</span>
          </Link>

          <form onSubmit={handleSearchSubmit} className="hidden lg:flex relative w-36 xl:w-56">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
            <Input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('nav.searchPlaceholder')}
              className="pl-8 h-8 bg-gray-50 border-gray-200 text-xs rounded-xl focus-visible:bg-white focus-visible:ring-1 focus-visible:ring-primary-600 w-full"
            />
          </form>
        </div>

        {/* Center: Desktop Navigation Links (Responsive Breakpoints) */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-1.5">
          <Link
            href="/courses"
            className={`inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg transition ${
              pathname.startsWith('/courses')
                ? 'bg-primary-50 text-primary-700'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <BookOpen className="h-3.5 w-3.5 text-primary-600" />
            <span>{t('nav.courses')}</span>
          </Link>

          <Link
            href="/exams"
            className={`inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg transition ${
              pathname.startsWith('/exams')
                ? 'bg-primary-50 text-primary-700'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <Target className="h-3.5 w-3.5 text-purple-600" />
            <span>{t('nav.exams')}</span>
          </Link>

          <Link
            href="/contests"
            className={`hidden xl:inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg transition ${
              pathname.startsWith('/contests')
                ? 'bg-amber-50 text-amber-700 font-bold'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <Trophy className="h-3.5 w-3.5 text-amber-500" />
            <span>{language === 'en' ? 'Arena' : 'অ্যারেনা'}</span>
          </Link>

          <Link
            href="/leaderboard"
            className={`hidden xl:inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg transition ${
              pathname.startsWith('/leaderboard')
                ? 'bg-indigo-50 text-indigo-700 font-bold'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <Award className="h-3.5 w-3.5 text-indigo-600" />
            <span>{language === 'en' ? 'Leaderboard' : 'লিডারবোর্ড'}</span>
          </Link>
        </nav>

        {/* Right: Pinned Corner Controls (ALWAYS reachable, shrink-0) */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
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
                className={`p-1.5 sm:p-2 rounded-xl transition relative shrink-0 ${
                  pathname === '/wishlist'
                    ? 'bg-rose-50 text-rose-600'
                    : 'text-gray-600 hover:text-rose-600 hover:bg-rose-50'
                }`}
              >
                <Heart className={`h-4 w-4 ${pathname === '/wishlist' ? 'fill-rose-500 text-rose-500' : ''}`} />
              </Link>

              {/* Real-time Prioritized Notification Bell */}
              <div className="shrink-0">
                <NotificationBell />
              </div>

              {/* Role-specific Quick Links */}
              {role === 'INSTRUCTOR' ? (
                <div className="flex items-center gap-1 shrink-0">
                  <Link
                    href="/instructor"
                    id="nav-instructor-studio"
                    className={`inline-flex items-center gap-1 px-2 py-1.5 text-xs font-semibold rounded-lg transition ${
                      pathname === '/instructor'
                        ? 'bg-primary-50 text-primary-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                    title={language === 'en' ? 'Instructor Studio' : 'ইন্সট্রাক্টর স্টুডিও'}
                  >
                    <LayoutDashboard className="h-3.5 w-3.5 text-primary-600" />
                    <span>{language === 'en' ? 'Studio' : 'স্টুডিও'}</span>
                  </Link>
                  <Link
                    href="/instructor?tab=enrolled"
                    id="nav-my-learning"
                    className={`hidden sm:inline-flex items-center gap-1 px-2 py-1.5 text-xs font-semibold rounded-lg transition ${
                      pathname.startsWith('/instructor?tab=enrolled')
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
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
                  className={`inline-flex items-center gap-1 px-2 py-1.5 text-xs font-semibold rounded-lg transition shrink-0 ${
                    pathname.startsWith('/student') ||
                    pathname.startsWith('/instructor') ||
                    pathname.startsWith('/admin')
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <LayoutDashboard className="h-3.5 w-3.5 text-primary-600" />
                  <span className="hidden sm:inline">{t('nav.dashboard')}</span>
                </Link>
              )}

              {/* User Avatar & Logout Container */}
              <div className="flex items-center gap-1 sm:gap-1.5 border-l border-gray-200 pl-1.5 sm:pl-2 shrink-0">
                <Link
                  href={`${userDashboardUrl}/settings`}
                  className="flex items-center gap-1.5 hover:bg-gray-50 rounded-xl p-1 transition cursor-pointer shrink-0"
                  title={language === 'en' ? 'Account Settings' : 'অ্যাকাউন্ট সেটিংস'}
                >
                  <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-gradient-to-tr from-primary-600 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-xs">
                    {session.user.name ? session.user.name.charAt(0).toUpperCase() : <User className="h-3.5 w-3.5" />}
                  </div>
                  <div className="hidden 2xl:flex flex-col text-left leading-tight">
                    <span className="text-xs font-semibold text-gray-900 truncate max-w-[100px]">
                      {session.user.name?.split(' ')[0] || 'User'}
                    </span>
                    {role && (
                      <span className="text-[10px] text-gray-500 capitalize">{role.toLowerCase()}</span>
                    )}
                  </div>
                </Link>

                <button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  title={language === 'en' ? 'Log Out' : 'লগআউট'}
                  aria-label={t('nav.logout')}
                  className="p-1.5 sm:px-2 sm:py-1.5 text-xs font-semibold text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-xl border border-gray-200 hover:border-red-200 disabled:opacity-50 transition shrink-0"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span className="hidden 2xl:inline ml-1">
                    {isLoggingOut ? t('nav.loggingOut') : t('nav.logout')}
                  </span>
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-1 sm:gap-2 border-l border-gray-200 pl-2 shrink-0">
              <Link
                href="/login?tab=login"
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg border border-gray-200 transition"
              >
                <LogIn className="h-3.5 w-3.5" />
                <span>{t('nav.login')}</span>
              </Link>
              <Link
                href="/login?tab=signup"
                className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-lg shadow-xs transition"
              >
                <UserPlus className="h-3.5 w-3.5" />
                <span>{t('nav.signup')}</span>
              </Link>
            </div>
          )}

          {/* Mobile / Tablet Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="xl:hidden p-1.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-100 transition shrink-0 ml-0.5"
            aria-label="Toggle navigation menu"
          >
            {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Mobile / Tablet Dropdown Overlay */}
      {isMobileMenuOpen && (
        <div className="xl:hidden border-t border-gray-100 bg-white px-4 pt-3 pb-6 space-y-3 shadow-lg animate-in slide-in-from-top-2 duration-150">
          {/* Mobile Search */}
          <form onSubmit={handleSearchSubmit} className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
            <Input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('nav.searchPlaceholder')}
              className="pl-9 h-9 bg-gray-50 border-gray-200 text-xs rounded-xl focus-visible:bg-white focus-visible:ring-1 focus-visible:ring-primary-600 w-full"
            />
          </form>

          {/* Navigation Links List */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <Link
              href="/"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center gap-2 p-2.5 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-50 border border-gray-100"
            >
              <Home className="h-4 w-4 text-primary-600" />
              <span>{t('nav.home')}</span>
            </Link>

            <Link
              href="/courses"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center gap-2 p-2.5 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-50 border border-gray-100"
            >
              <BookOpen className="h-4 w-4 text-primary-600" />
              <span>{t('nav.courses')}</span>
            </Link>

            <Link
              href="/exams"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center gap-2 p-2.5 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-50 border border-gray-100"
            >
              <Target className="h-4 w-4 text-purple-600" />
              <span>{t('nav.exams')}</span>
            </Link>

            <Link
              href="/contests"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center gap-2 p-2.5 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-50 border border-gray-100"
            >
              <Trophy className="h-4 w-4 text-amber-500" />
              <span>{language === 'en' ? 'Contests & Arena' : 'কনটেস্ট অ্যারেনা'}</span>
            </Link>

            <Link
              href="/leaderboard"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center gap-2 p-2.5 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-50 border border-gray-100"
            >
              <Award className="h-4 w-4 text-indigo-600" />
              <span>{language === 'en' ? 'Leaderboard' : 'লিডারবোর্ড'}</span>
            </Link>

            <Link
              href="/wishlist"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center gap-2 p-2.5 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-50 border border-gray-100"
            >
              <Heart className="h-4 w-4 text-rose-500" />
              <span>{language === 'en' ? 'My Wishlist' : 'আমার উইশলিস্ট'}</span>
            </Link>

            {role === 'INSTRUCTOR' && (
              <Link
                href="/instructor?tab=enrolled"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-2 p-2.5 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-50 border border-gray-100 col-span-2"
              >
                <GraduationCap className="h-4 w-4 text-emerald-600" />
                <span>{language === 'en' ? 'My Learning Journey (Enrolled Courses)' : 'আমার কোর্স ও শিক্ষা'}</span>
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

export default Navbar;
