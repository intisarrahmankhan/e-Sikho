import './globals.css';
import type { Metadata } from 'next';
import { Inter } from "next/font/google";
import { AppShell } from '@/components/layout/AppShell';

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: 'e-Shikho',
  description: 'Professional course marketplace platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}