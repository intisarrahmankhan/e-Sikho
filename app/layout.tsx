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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Hind+Siliguri:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col font-sans tracking-[-0.01em] bg-slate-50 text-slate-900 selection:bg-primary-100 selection:text-primary-900">
        <LanguageProvider>
          <AuthProvider>
            <AppShell>{children}</AppShell>
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
