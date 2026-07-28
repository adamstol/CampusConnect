'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/context/ThemeContext';
import { useCallback, useEffect, useState } from 'react';
import { API_BASE_URL } from '@/lib/api';

export default function AdminDashboardPage() {
  const router = useRouter();
  const { resetTheme } = useTheme();

  const [isLoading, setIsLoading] = useState(true);

  const handleUnauthorized = useCallback(() => {
    localStorage.removeItem('access_token');
    resetTheme();
    router.push('/login');
  }, [resetTheme, router]);

  const verifyAdmin = useCallback(
    async (token: string) => {
      try {
        const response = await fetch(`${API_BASE_URL}/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.status === 401) {
          handleUnauthorized();
          return;
        }

        if (!response.ok) {
          router.push('/user-dashboard');
          return;
        }

        const profile = await response.json();

        
         
        
        if (profile.role_name !== 'Administrator') {
            router.push('/user-dashboard');
            return;
          }
     

        console.log(profile);
      } catch {
        router.push('/user-dashboard');
      } finally {
        setIsLoading(false);
      }
    },
    [handleUnauthorized, router]
  );

  useEffect(() => {
    const token = localStorage.getItem('access_token');

    if (!token) {
      router.push('/login');
      return;
    }

    Promise.resolve().then(() => verifyAdmin(token));
  }, [router, verifyAdmin]);

  const cardClasses =
    'rounded-lg bg-white dark:bg-gray-800 shadow-md p-6 border border-gray-200 dark:border-gray-700';

  const buttonClasses =
    'inline-block mt-5 rounded-lg bg-red-600 px-5 py-3 font-semibold text-white transition hover:bg-red-700';

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">
          Loading Admin Dashboard...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <Link
              href="/user-dashboard"
              className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Back to Dashboard
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
            Admin Dashboard
          </h1>

          <p className="mt-3 text-gray-600 dark:text-gray-400">
            Administrative tools for managing CampusConnect. Access to this
            page should be restricted to administrator accounts.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">

          <section className={cardClasses}>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Club Management
            </h2>

            <p className="mt-3 text-gray-600 dark:text-gray-400">
              Review club applications, approve or reject clubs, and remove
              inappropriate organizations.
            </p>

            <ul className="mt-5 space-y-2 text-sm text-gray-700 dark:text-gray-300 list-disc list-inside">
              <li>Approve club applications</li>
              <li>Reject applications</li>
              <li>Delete clubs</li>
              <li>View club members</li>
            </ul>

            <Link href="/admin/clubs" className={buttonClasses}>
              Open Club Management
            </Link>
          </section>

          <section className={cardClasses}>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Event Management
            </h2>

            <p className="mt-3 text-gray-600 dark:text-gray-400">
              View all events and see who has registered for each event.
            </p>

            <ul className="mt-5 space-y-2 text-sm text-gray-700 dark:text-gray-300 list-disc list-inside">
              <li>View all events</li>
              <li>See event registrations</li>
              <li>View attendee details</li>
              <li>Track registrations by club</li>
            </ul>

            <Link href="/admin/events" className={buttonClasses}>
              Open Event Management
            </Link>
          </section>

          <section className={cardClasses}>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              User Management
            </h2>

            <p className="mt-3 text-gray-600 dark:text-gray-400">
              View registered users and manage account status across the
              platform.
            </p>

            <ul className="mt-5 space-y-2 text-sm text-gray-700 dark:text-gray-300 list-disc list-inside">
              <li>View all users</li>
              <li>Disable accounts</li>
              <li>Lock accounts</li>
              <li>Delete users</li>
            </ul>

            <Link href="/admin/users" className={buttonClasses}>
              Open User Management
            </Link>
          </section>

          <section className={cardClasses}>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Statistics & Reporting
            </h2>

            <p className="mt-3 text-gray-600 dark:text-gray-400">
              Monitor platform statistics and review security-related
              information.
            </p>

            <ul className="mt-5 space-y-2 text-sm text-gray-700 dark:text-gray-300 list-disc list-inside">
              <li>Platform summary</li>
              <li>Club statistics</li>
              <li>User statistics</li>
              <li>Failed login activity</li>
            </ul>

            <Link href="/admin/statistics" className={buttonClasses}>
              Open Statistics
            </Link>
          </section>

        </div>
      </main>
    </div>
  );
}
