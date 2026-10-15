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
  Radio,
  Video,
  GraduationCap,
  X,
  Wifi,
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
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);
  const [liveToast, setLiveToast] = useState<NotificationItem | null>(null);
  const [isPending, startTransition] = useTransition();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fetchNotifications = async () => {
    try {
      const res = await getUserNotificationsAction();
      if (res.success && res.notifications) {
        setNotifications(res.notifications);
        setUnreadCount(res.unreadCount || 0);
      }
    } catch {
      // ignore
    }
  };

  // Connect to SSE Real-time Notification Stream
  useEffect(() => {
    fetchNotifications();

    let eventSource: EventSource | null = null;
    let reconnectTimeout: NodeJS.Timeout | null = null;

    const connectSSE = () => {
      try {
        eventSource = new EventSource('/api/notifications/realtime');

        eventSource.addEventListener('handshake', () => {
          setIsRealtimeConnected(true);
        });

        eventSource.addEventListener('sync', (e: MessageEvent) => {
          try {
            const data = JSON.parse(e.data);
            if (data.notifications) {
              setNotifications(data.notifications);
              setUnreadCount(data.unreadCount || 0);
            }
          } catch (err) {
            console.error('Error parsing sync event:', err);
          }
        });

        eventSource.addEventListener('message', (e: MessageEvent) => {
          try {
            const data = JSON.parse(e.data);
            if (data.type === 'NOTIFICATION' && data.payload) {
              const p = data.payload;
              const newItem: NotificationItem = {
                id: p.id || `rt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                title: p.title,
                message: p.message,
                type: p.type || 'SYSTEM',
                priority: p.priority || 'NORMAL',
                priorityWeight: p.priority === 'HIGH' ? 3 : p.priority === 'LOW' ? 1 : 2,
                actionUrl: p.actionUrl || '/contests',
                badgeLabel: p.badgeLabel || '',
                isRead: false,
                createdAt: p.createdAt || new Date().toISOString(),
              };

              // Prepend to notifications
              setNotifications((prev) => [newItem, ...prev.filter((n) => n.id !== newItem.id)]);
              setUnreadCount((c) => c + 1);

              // Show live popup toast for high-priority or live events
              setLiveToast(newItem);
              if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
              toastTimeoutRef.current = setTimeout(() => {
                setLiveToast(null);
              }, 7000);
            }
          } catch (err) {
            console.error('Error handling SSE message:', err);
          }
        });

        eventSource.onerror = () => {
          setIsRealtimeConnected(false);
          if (eventSource) {
            eventSource.close();
            eventSource = null;
          }
          // Attempt reconnection after 5s
          if (!reconnectTimeout) {
            reconnectTimeout = setTimeout(() => {
              reconnectTimeout = null;
              connectSSE();
            }, 5000);
          }
        };
      } catch (err) {
        console.warn('Real-time notification stream unavailable:', err);
        setIsRealtimeConnected(false);
      }
    };

    connectSSE();

    // Fallback polling every 45s in case SSE is interrupted
    const interval = setInterval(fetchNotifications, 45000);

    return () => {
      clearInterval(interval);
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
      if (eventSource) {
        eventSource.close();
      }
    };
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

  const getIconForType = (type: string, isHigh: boolean) => {
    if (type === 'LIVE_CLASS_STARTING') {
      return <Radio className="h-3.5 w-3.5 text-rose-600 animate-pulse" />;
    }
    if (type === 'LIVE_CLASS_RECORDING_READY') {
      return <Video className="h-3.5 w-3.5 text-blue-600" />;
    }
    if (type === 'REVISION_ACCESS_UPDATE') {
      return <Sparkles className="h-3.5 w-3.5 text-purple-600" />;
    }
    if (type === 'EXAM_REMINDER') {
      return <GraduationCap className="h-3.5 w-3.5 text-amber-600" />;
    }
    if (type === 'ELO_UPDATE') {
      return <Trophy className="h-3.5 w-3.5 text-purple-600" />;
    }
    if (isHigh) {
      return <Flame className="h-3.5 w-3.5 text-amber-600" />;
    }
    return <Bell className="h-3.5 w-3.5 text-slate-600" />;
  };

  return (
    <>
      {/* Floating Real-time Toast Alert */}
      {liveToast && (
        <div className="fixed top-20 right-4 z-50 max-w-sm w-full bg-slate-900 text-white rounded-2xl p-4 shadow-2xl border border-slate-700/80 animate-in slide-in-from-top-4 fade-in duration-200">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-xl bg-primary-600/30 text-primary-400 flex items-center justify-center shrink-0 border border-primary-500/30">
                {getIconForType(liveToast.type, liveToast.priority === 'HIGH')}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-primary-500/20 text-primary-300 px-1.5 py-0.5 rounded">
                    {liveToast.badgeLabel || 'Real-time Alert'}
                  </span>
                  <span className="text-[10px] text-slate-400">Just now</span>
                </div>
                <h4 className="text-xs font-bold text-white leading-snug">
                  {liveToast.title}
                </h4>
                <p className="text-[11px] text-slate-300 line-clamp-2 leading-relaxed">
                  {liveToast.message}
                </p>
                {liveToast.actionUrl && (
                  <Link
                    href={liveToast.actionUrl}
                    onClick={() => setLiveToast(null)}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-primary-400 hover:text-primary-300 pt-1"
                  >
                    <span>{language === 'en' ? 'View Details' : 'বিস্তারিত দেখুন'}</span>
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                )}
              </div>
            </div>
            <button
              onClick={() => setLiveToast(null)}
              className="text-slate-400 hover:text-white p-1 rounded-lg"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Bell Icon */}
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
                  {language === 'en' ? 'Platform Alerts & Updates' : 'অ্যালার্ট ও আপডেটসমূহ'}
                </h3>
                {isRealtimeConnected && (
                  <span
                    className="flex h-2 w-2 relative"
                    title="Real-time Stream Connected"
                  >
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                )}
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

            {/* Subheader banner */}
            <div className="bg-primary-50 border-b border-primary-100 px-4 py-2 text-[11px] text-primary-900 flex items-center justify-between font-medium">
              <div className="flex items-center gap-1.5">
                <Flame className="h-3.5 w-3.5 text-primary-600 shrink-0" />
                <span>
                  {language === 'en'
                    ? 'Real-time live class, exam & revision alerts'
                    : 'লাইভ ক্লাস, পরীক্ষা ও রিভিশনের তাৎক্ষণিক আপডেট'}
                </span>
              </div>
              {isRealtimeConnected ? (
                <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
                  <Wifi className="h-3 w-3" />
                  Live
                </span>
              ) : null}
            </div>

            {/* Notification Items List */}
            <div className="max-h-96 overflow-y-auto divide-y divide-slate-100">
              {notifications.length === 0 ? (
                <div className="py-10 text-center px-4">
                  <Bell className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs text-slate-500 font-medium">
                    {language === 'en'
                      ? 'No new notifications right now.'
                      : 'এই মুহূর্তে কোনো নতুন নোটিফিকেশন নেই।'}
                  </p>
                </div>
              ) : (
                notifications.map((item) => {
                  const isHigh = item.priority === 'HIGH';

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
                              isHigh
                                ? 'bg-amber-100'
                                : 'bg-slate-100'
                            }`}
                          >
                            {getIconForType(item.type, isHigh)}
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
                                  {language === 'en' ? 'Update' : 'আপডেট'}
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
                                  <span>{language === 'en' ? 'View Details' : 'বিস্তারিত দেখুন'}</span>
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
                {language === 'en'
                  ? 'Explore All Competitions & Live Classes →'
                  : 'সকল প্রতিযোগিতা ও লাইভ ক্লাস দেখুন →'}
              </Link>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
