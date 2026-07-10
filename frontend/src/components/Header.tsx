'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

export default function Header() {
  const [initials, setInitials] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) return;

    fetch('http://localhost:5000/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.first_name && data?.last_name) {
          setInitials(`${data.first_name[0]}${data.last_name[0]}`.toUpperCase());
        }
      })
      .catch(() => {});
  }, []);

  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
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

          <nav className="hidden md:flex items-center gap-6">
            <Link href="/clubs" className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
              Clubs
            </Link>
            <Link href="/events-this-week" className="text-gray-900 dark:text-white hover:text-gray-900 dark:hover:text-gray-200 font-medium">
              Events This Week
            </Link>

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

          <div className="flex items-center gap-4">
            {!initials && (
              <Link href="/login" className="hidden sm:block text-gray-900 dark:text-white hover:text-gray-700 dark:hover:text-gray-300 font-medium">
                Sign Up Today
              </Link>
            )}

            <button className="p-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>

            <button className="p-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <div className="relative">
              {initials ? (
                <Link
                  href="/user-dashboard"
                  className="flex items-center justify-center w-9 h-9 rounded-full text-white text-sm font-bold"
                  style={{ backgroundColor: '#FE3B5E' }}
                >
                  {initials}
                </Link>
              ) : (
                <button className="p-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
