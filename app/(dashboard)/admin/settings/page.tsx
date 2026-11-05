import React from 'react';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { getAdminProfileAction } from '@/actions/admin';
import { AdminSettingsClient } from '@/components/admin/AdminSettingsClient';

export const dynamic = 'force-dynamic';

export default async function AdminSettingsPage() {
  const session = await auth();
  const user = session?.user as { id?: string; email?: string; role?: string } | undefined;

  if (!session || !user) {
    redirect('/login');
  }

  if (user.role !== 'ADMIN' && user.role !== 'SUPERADMIN') {
    redirect('/student');
  }

  const res = await getAdminProfileAction();
  if (!res.success || !res.profile) {
    // Provide a resilient fallback so the admin can always view and edit their settings
    const fallbackProfile = {
      id: user.id || 'admin',
      name: (session.user as any)?.name || 'Admin',
      email: (session.user as any)?.email || '',
      phone: (session.user as any)?.phone || '',
      role: user.role || 'ADMIN',
      status: 'APPROVED',
      organization: 'e-Sikho Administration',
    };
    return <AdminSettingsClient initialProfile={fallbackProfile} />;
  }

  return <AdminSettingsClient initialProfile={res.profile} />;
}

