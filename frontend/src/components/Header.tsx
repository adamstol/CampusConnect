'use client';

import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { API_BASE_URL } from '@/lib/api';
import { useTheme } from '@/context/ThemeContext';
import { t, type Locale } from '@/lib/translations';

interface AppNotification {
  notification_id: number;
  title: string;
  body: string;
  is_read: boolean;
  created_at: string;
  club_id: number | null;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function Header() {
  const { language } = useTheme();
  const lang = language as Locale;
  const [initials, setInitials] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  function fetchNotifications() {
    const token = localStorage.getItem('access_token');
    if (!token) return;
    fetch(`${API_BASE_URL}/notifications`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setNotifications(data))
      .catch(() => {});
  }

  function openNotifications() {
    setNotifOpen((prev) => !prev);
    const token = localStorage.getItem('access_token');
    if (!token || unreadCount === 0) return;
    fetch(`${API_BASE_URL}/notifications/read-all`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (res.ok) setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      })
      .catch(() => {});
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) return;

    fetch(`${API_BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.first_name && data?.last_name) {
          setInitials(`${data.first_name[0]}${data.last_name[0]}`.toUpperCase());
        }
        if (data?.role_name) {
          setRole(data.role_name);
        }
      })
      .catch(() => {});

    fetchNotifications();
    // Poll every 60 seconds for new notifications
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);
  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:grid md:grid-cols-3">

          {/* Logo — left */}
          <Link href="/" className="flex items-center">
            <Image
              src="/campusconnect-logo.png"
              alt="CampusConnect"
              width={156}
              height={112}
              priority
              className="h-10 w-auto object-contain"
            />
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center justify-center gap-1">
            <Link
              href="/clubs"
              className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              {t(lang, 'navClubs')}
            </Link>
            <Link
              href="/events-this-week"
              className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              {t(lang, 'navEventsThisWeek')}
            </Link>
            {role === 'Administrator' && (
              <Link
                href="/admin"
                className="px-4 py-2 rounded-lg text-sm font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                {t(lang, 'navAdmin')}
              </Link>
            )}
          </nav>

          {/* User Actions — right */}
          <div className="flex items-center justify-end gap-2">
            {!initials && (
              <Link
                href="/login"
                className="hidden sm:inline-flex items-center px-4 py-2 rounded-lg text-sm font-semibold text-white transition-colors"
                style={{ backgroundColor: '#FE3B5E' }}
              >
                {t(lang, 'signUpToday')}
              </Link>
            )}

            {/* Notification Bell */}
            {initials && (
              <div className="relative" ref={notifRef}>
                <button
                  onClick={openNotifications}
                  className="relative p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  aria-label="Notifications"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-4.5 h-4.5 px-1 rounded-full text-white text-[10px] font-bold leading-none" style={{ backgroundColor: '#FE3B5E' }}>
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {notifOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                      <span className="font-semibold text-gray-900 dark:text-white text-sm">{t(lang, 'notificationsHeading')}</span>
                      {unreadCount > 0 && (
                        <button
                          onClick={() => {
                            const token = localStorage.getItem('access_token');
                            if (!token) return;
                            fetch(`${API_BASE_URL}/notifications/read-all`, {
                              method: 'PATCH',
                              headers: { Authorization: `Bearer ${token}` },
                            }).then((res) => {
                              if (res.ok) setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
                            }).catch(() => {});
                          }}
                          className="text-xs font-medium hover:underline"
                          style={{ color: '#FE3B5E' }}
                        >
                          Mark all read
                        </button>
                      )}
                    </div>
                    <ul className="max-h-80 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800">
                      {notifications.length === 0 ? (
                        <li className="px-4 py-8 text-center text-sm text-gray-400 dark:text-gray-500">
                          {t(lang, 'noNotificationsYet')}
                        </li>
                      ) : (
                        notifications.map((n) => {
                          const inner = (
                            <>
                              {!n.is_read && (
                                <span className="absolute left-0 top-0 bottom-0 w-1 rounded-r-full" style={{ backgroundColor: '#FE3B5E' }} />
                              )}
                              <p className="text-sm font-semibold text-gray-900 dark:text-white leading-snug">{n.title}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">{n.body}</p>
                              <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1">{timeAgo(n.created_at)}</p>
                            </>
                          );
                          return (
                            <li
                              key={n.notification_id}
                              className="relative px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                            >
                              {n.club_id ? (
                                <Link href={`/clubs/${n.club_id}`} onClick={() => setNotifOpen(false)} className="block">
                                  {inner}
                                </Link>
                              ) : (
                                <div>{inner}</div>
                              )}
                            </li>
                          );
                        })
                      )}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {initials && (
              <Link
                href="/user-dashboard"
                className="flex items-center justify-center w-9 h-9 rounded-full text-white text-sm font-bold transition-opacity hover:opacity-90"
                style={{ backgroundColor: '#FE3B5E' }}
              >
                {initials}
              </Link>
            )}

            {/* Hamburger — mobile only */}
            <button
              className="md:hidden p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              onClick={() => setMobileOpen((o) => !o)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>

        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-gray-100 dark:border-gray-800 py-3 space-y-1">
            <Link
              href="/clubs"
              onClick={() => setMobileOpen(false)}
              className="block px-4 py-2.5 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              {t(lang, 'navClubs')}
            </Link>
            <Link
              href="/events-this-week"
              onClick={() => setMobileOpen(false)}
              className="block px-4 py-2.5 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              {t(lang, 'navEventsThisWeek')}
            </Link>
            {role === 'Administrator' && (
              <Link
                href="/admin"
                onClick={() => setMobileOpen(false)}
                className="block px-4 py-2.5 rounded-lg text-sm font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                {t(lang, 'navAdmin')}
              </Link>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
