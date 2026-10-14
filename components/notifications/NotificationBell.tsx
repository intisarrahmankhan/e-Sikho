'use client';

import React, { useState, useEffect, useRef, useTransition } from 'react';
import Link from 'next/link';
import {
  Bell,
  CheckCircle2,
  Trophy,
  Flame,
  ExternalLink,
  Check,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';
import {
  getUserNotificationsAction,
  markNotificationAsReadAction,
  markAllNotificationsAsReadAction,
} from '@/actions/notification-actions';
import { useLanguage } from '@/context/LanguageContext';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  priority: 'HIGH' | 'NORMAL' | 'LOW';
  priorityWeight: number;
  actionUrl: string;
  badgeLabel?: string;
  isRead: boolean;
  createdAt?: string;
}

export function NotificationBell() {
  const { language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isPending, startTransition] = useTransition();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      const res = await getUserNotificationsAction();
      if (res.success && res.notifications) {
        setNotifications(res.notifications);
        setUnreadCount(res.unreadCount || 0);
      }
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 20000); // Poll every 20s for new contest alerts
    return () => clearInterval(interval);
  }, []);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    startTransition(async () => {
      await markNotificationAsReadAction(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    });
  };

  const handleMarkAllRead = () => {
    startTransition(async () => {
      await markAllNotificationsAsReadAction();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    });
  };

  const hasHighPriorityUnread = notifications.some((n) => !n.isRead && n.priority === 'HIGH');

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifications"
        className={`relative p-2 rounded-xl transition flex items-center justify-center ${
          isOpen
            ? 'bg-primary-50 text-primary-700'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
        }`}
      >
        <Bell className="h-4.5 w-4.5" />
        {unreadCount > 0 && (
          <span
            className={`absolute -top-1 -right-1 flex h-4.5 min-w-4.5 px-1 items-center justify-center rounded-full text-[10px] font-bold text-white shadow-sm ${
              hasHighPriorityUnread ? 'bg-rose-600 animate-pulse' : 'bg-primary-600'
            }`}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2.5 w-84 sm:w-96 rounded-2xl bg-white shadow-2xl border border-slate-200 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-slate-900 text-white">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-400" />
              <h3 className="font-bold text-xs uppercase tracking-wider">
                {language === 'en' ? 'Priority Alerts & Contests' : 'অগ্রাধিকার অ্যালার্ট ও কনটেস্ট'}
              </h3>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                disabled={isPending}
                className="text-[11px] text-slate-300 hover:text-white flex items-center gap-1 transition disabled:opacity-50"
              >
                <Check className="h-3 w-3" />
                <span>{language === 'en' ? 'Mark all read' : 'সব পঠিত করুন'}</span>
              </button>
            )}
          </div>

          {/* Subheader banner explaining priority */}
          <div className="bg-primary-50 border-b border-primary-100 px-4 py-2 text-[11px] text-primary-900 flex items-center gap-1.5 font-medium">
            <Flame className="h-3.5 w-3.5 text-primary-600 shrink-0" />
            <span>
              {language === 'en'
                ? 'Alerts are prioritized by academic track. Top items are highest relevance.'
                : 'আপনার পড়াশোনার ব্যাকগ্রাউন্ড অনুযায়ী নোটিফিকেশন অগ্রাধিকার তালিকায় সাজানো হয়েছে।'}
            </span>
          </div>

          {/* Notification Items List */}
          <div className="max-h-96 overflow-y-auto divide-y divide-slate-100">
            {notifications.length === 0 ? (
              <div className="py-10 text-center px-4">
                <Bell className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-slate-500 font-medium">
                  {language === 'en' ? 'No new notifications right now.' : 'এই মুহূর্তে কোনো নতুন নোটিফিকেশন নেই।'}
                </p>
              </div>
            ) : (
              notifications.map((item) => {
                const isHigh = item.priority === 'HIGH';
                const isElo = item.type === 'ELO_UPDATE';

                return (
                  <div
                    key={item.id}
                    className={`p-3.5 transition group ${
                      !item.isRead
                        ? isHigh
                          ? 'bg-amber-50/60 hover:bg-amber-50/90 border-l-4 border-amber-500'
                          : 'bg-primary-50/30 hover:bg-primary-50/60 border-l-4 border-primary-500'
                        : 'bg-white hover:bg-slate-50 border-l-4 border-transparent'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2.5">
                      <div className="flex items-start gap-2.5 flex-1 min-w-0">
                        <div
                          className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                            isElo
                              ? 'bg-purple-100 text-purple-700'
                              : isHigh
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {isElo ? (
                            <Trophy className="h-3.5 w-3.5" />
                          ) : isHigh ? (
                            <Flame className="h-3.5 w-3.5" />
                          ) : (
                            <Bell className="h-3.5 w-3.5" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {isHigh && (
                              <span className="inline-flex items-center text-[10px] font-black uppercase tracking-tight bg-rose-600 text-white px-1.5 py-0.5 rounded">
                                {language === 'en' ? 'PRIORITY' : 'অগ্রাধিকার'}
                              </span>
                            )}
                            {item.badgeLabel && (
                              <span className="text-[10px] font-bold text-primary-700 bg-primary-100 px-1.5 py-0.5 rounded">
                                {item.badgeLabel}
                              </span>
                            )}
                            {!isHigh && (
                              <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                                {language === 'en' ? 'Open Track' : 'উন্মুক্ত'}
                              </span>
                            )}
                          </div>

                          <h4 className="font-bold text-xs text-slate-900 mt-1 leading-snug">
                            {item.title}
                          </h4>

                          <p className="text-[11px] text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                            {item.message}
                          </p>

                          <div className="mt-2 flex items-center gap-3">
                            {item.actionUrl && (
                              <Link
                                href={item.actionUrl}
                                onClick={() => setIsOpen(false)}
                                className="inline-flex items-center gap-1 text-[11px] font-bold text-primary-600 hover:text-primary-700 hover:underline"
                              >
                                <span>{language === 'en' ? 'Open Contest Arena' : 'অ্যারেনায় প্রবেশ করুন'}</span>
                                <ExternalLink className="h-3 w-3" />
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Read toggle */}
                      {!item.isRead && (
                        <button
                          onClick={(e) => handleMarkAsRead(item.id, e)}
                          title="Mark as read"
                          className="text-slate-400 hover:text-emerald-600 p-1 rounded transition shrink-0"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="p-2.5 bg-slate-50 border-t border-slate-200 text-center">
            <Link
              href="/contests"
              onClick={() => setIsOpen(false)}
              className="text-xs font-bold text-primary-600 hover:text-primary-700 transition"
            >
              {language === 'en' ? 'Explore All Competitive Contests →' : 'সকল প্রতিযোগিতা দেখুন →'}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
