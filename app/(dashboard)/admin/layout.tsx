import React from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { DashboardBreadcrumbs } from '@/components/layout/DashboardBreadcrumbs';

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col lg:flex-row gap-6 items-start w-full">
      <Sidebar forcedRole="ADMIN" className="sticky top-20" />
      <div className="flex-1 min-w-0 w-full">
        <DashboardBreadcrumbs />
        {children}
      </div>
    </div>
  );
}

