import React from 'react';
import { Bell, Search, User } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export function Navbar() {
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
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" className="w-9 px-0">
          <Bell className="h-4 w-4 text-slate-500" />
          <span className="sr-only">Notifications</span>
        </Button>
        <Button variant="ghost" size="sm" className="w-9 px-0 rounded-full bg-slate-100">
          <User className="h-4 w-4 text-slate-600" />
          <span className="sr-only">User Menu</span>
        </Button>
      </div>
    </header>
  );
}
