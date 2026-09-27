import './globals.css';
import type { Metadata } from 'next';
import { AppShell } from '@/components/layout/AppShell';
import { AuthProvider } from '@/components/providers/AuthProvider';

export const metadata: Metadata = {
  title: 'e-Shikho - Professional Online Learning Platform',
  description: 'Learn modern programming, web development, and tech skills in Bangla',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <AppShell>{children}</AppShell>
        </AuthProvider>
      </body>
    </html>
  );
}
