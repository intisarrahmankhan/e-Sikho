'use client';

import React, { useEffect } from 'react';
import { SessionProvider, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

function SessionRoleSync() {
  const { data: session, status, update } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status !== 'authenticated' || !session?.user) return;

    let isMounted = true;
    const verifyRole = async () => {
      try {
        const res = await fetch('/api/auth/check-role', { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        if (!isMounted) return;

        const currentClientRole = (session.user as any)?.role;
        if (data.role && currentClientRole && data.role !== currentClientRole) {
          // Trigger NextAuth token update which persists the new role in cookie and re-renders session
          await update();
          router.refresh();
        }
      } catch (err) {
        // graceful ignore
      }
    };

    verifyRole();

    // Check periodically or on window focus
    const interval = setInterval(verifyRole, 30000);
    const handleFocus = () => verifyRole();
    window.addEventListener('focus', handleFocus);

    return () => {
      isMounted = false;
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [status, session?.user, update, router]);

  return null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider refetchOnWindowFocus={true}>
      <SessionRoleSync />
      {children}
    </SessionProvider>
  );
}
