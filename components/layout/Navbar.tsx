'use client';

import React, { useState } from 'react';
import { Bell, Search, User, LogOut } from 'lucide-react';
import { signOut } from 'next-auth/react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export function Navbar() {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await signOut({ callbackUrl: '/login' });
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white px-4 shadow-sm md:px-6">
      <div className="flex flex-1 items-center gap-4">
        <form className="hidden max-w-sm flex-1 sm:flex relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
          <Input
            type="search"
            placeholder="Search courses..."
            className="pl-8 bg-slate-50 border-transparent focus-visible:bg-white"
          />
        </form>
      </div>
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" className="w-9 px-0 text-slate-500 hover:text-slate-700">
          <Bell className="h-4 w-4" />
          <span className="sr-only">Notifications</span>
        </Button>
        <div className="flex items-center gap-2 border-l border-slate-200 pl-3">
          <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
            <User className="h-4 w-4" />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="flex items-center gap-1.5 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>{isLoggingOut ? 'Logging out...' : 'Logout'}</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
