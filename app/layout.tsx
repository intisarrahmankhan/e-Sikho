import './globals.css';
import 'katex/dist/katex.min.css';
import type { Metadata } from 'next';
import { AppShell } from '@/components/layout/AppShell';
import { AuthProvider } from '@/components/providers/AuthProvider';
import { LanguageProvider } from '@/context/LanguageContext';

export const metadata: Metadata = {
  title: 'e-Shikho — Online Learning Platform',
  description: 'Learn modern programming, web development, and tech skills in Bangla & English',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="bn" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans">
        <LanguageProvider>
          <AuthProvider>
            <AppShell>{children}</AppShell>
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
