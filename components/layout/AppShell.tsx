'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { Navbar } from './Navbar';

function NavigationProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [navigating, setNavigating] = useState(false);

  useEffect(() => {
    setNavigating(false);
  }, [pathname, searchParams]);

  useEffect(() => {
    const handleAnchorClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest('a');
      if (!target) return;
      const href = target.getAttribute('href');
      if (
        href &&
        href.startsWith('/') &&
        !href.startsWith('#') &&
        href !== pathname &&
        target.target !== '_blank'
      ) {
        setNavigating(true);
      }
    };

    document.addEventListener('click', handleAnchorClick);
    return () => document.removeEventListener('click', handleAnchorClick);
  }, [pathname]);

  if (!navigating) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-primary-100 overflow-hidden">
      <div className="h-full w-full bg-gradient-to-r from-primary-500 via-primary-600 to-indigo-600 animate-pulse" />
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname?.startsWith('/login');

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Suspense fallback={null}>
        <NavigationProgressBar />
      </Suspense>
      <Navbar />
      <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full">
        {children}
      </main>
    </div>
  );
}

export default AppShell;
