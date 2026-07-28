'use client';

import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { API_BASE_URL } from '@/lib/api';

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
  const [initials, setInitials] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [notifOpen, setNotifOpen] = useState(false);
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
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <Image
              src="/campusconnect-logo.png"
              alt="CampusConnect"
              width={156}
              height={112}
              priority
              className="h-12 w-auto object-contain"
            />
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/clubs" className="text-gray-900 dark:text-white hover:text-gray-900 dark:hover:text-gray-200 font-medium">Clubs</Link>
            <Link href="/events-this-week" className="text-gray-900 dark:text-white hover:text-gray-900 dark:hover:text-gray-200 font-medium">Events This Week</Link>
            {role === 'Administrator' && (
              <Link
                href="/admin-dashboard"
                className="text-red-600 hover:text-red-700 font-semibold"
              >
                Admin
              </Link>
            )}

            {/* Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search Clubs"
                className="w-64 pl-4 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-full bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
              <button className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </div>
          </nav>

          {/* User Actions */}
          <div className="flex items-center gap-4">
            {!initials && (
              <Link href="/login" className="hidden sm:block text-gray-900 dark:text-white hover:text-gray-700 dark:hover:text-gray-300 font-medium">Sign Up Today</Link>
            )}

            {/* Notification Bell */}
            {initials && (
              <div className="relative" ref={notifRef}>
                <button
                  onClick={openNotifications}
                  className="relative p-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  aria-label="Notifications"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-4.5 h-4.5 px-1 rounded-full text-white text-[10px] font-bold leading-none" style={{ backgroundColor: '#FE3B5E' }}>
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {notifOpen && (
                  <div className="absolute right-0 mt-2 w-96 bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                      <span className="font-semibold text-gray-900 dark:text-white text-sm">Notifications</span>
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
                    <ul className="max-h-90 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800">
                      {notifications.length === 0 ? (
                        <li className="px-4 py-8 text-center text-sm text-gray-400 dark:text-gray-500">
                          No notifications yet
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
                className="flex items-center justify-center w-9 h-9 rounded-full text-white text-sm font-bold"
                style={{ backgroundColor: '#FE3B5E' }}
              >
                {initials}
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
