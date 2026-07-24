'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/context/ThemeContext';
import { useCallback, useEffect, useState } from 'react';

const API_BASE_URL = 'http://localhost:5000';

interface DashboardStats {
  total_users: number;
  total_clubs: number;
  total_events: number;
}

interface SecurityLog {
  user_id: number;
  email: string;
  failed_login_attempts: number;
}

export default function StatisticsPage() {
  const router = useRouter();
  const { resetTheme } = useTheme();

  const [isLoading, setIsLoading] = useState(true);

  const [stats, setStats] = useState<DashboardStats>({
    total_users: 0,
    total_clubs: 0,
    total_events: 0,
  });

  const [securityLogs, setSecurityLogs] = useState<SecurityLog[]>([]);

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
          return false;
        }

        if (!response.ok) {
          router.push('/user-dashboard');
          return false;
        }

        const profile = await response.json();

        if (profile.role_name !== 'Administrator') {
          router.push('/user-dashboard');
          return false;
        }

        return true;
      } catch {
        router.push('/user-dashboard');
        return false;
      }
    },
    [handleUnauthorized, router]
  );

  const loadDashboardStats = useCallback(
    async (token: string) => {
      try {
        const response = await fetch(`${API_BASE_URL}/admin/dashboard`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.status === 401) {
          handleUnauthorized();
          return;
        }

        if (response.status === 403) {
          router.push('/user-dashboard');
          return;
        }

        if (!response.ok) {
          return;
        }

        const data = await response.json();

        setStats({
          total_users: data.total_users,
          total_clubs: data.total_clubs,
          total_events: data.total_events,
        });
      } catch {
        console.error('Unable to load dashboard statistics.');
      }
    },
    [handleUnauthorized, router]
  );

  const loadSecurityLogs = useCallback(
    async (token: string) => {
      try {
        const response = await fetch(`${API_BASE_URL}/admin/security`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.status === 401) {
          handleUnauthorized();
          return;
        }

        if (response.status === 403) {
          router.push('/user-dashboard');
          return;
        }

        if (!response.ok) {
          return;
        }

        const data = await response.json();

        setSecurityLogs(data);
      } catch {
        console.error('Unable to load security logs.');
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

  const verifiedToken: string = token; // narrowed value, captured once

  async function initializeDashboard() {
    const isAdmin = await verifyAdmin(verifiedToken);

    if (isAdmin) {
      await loadDashboardStats(verifiedToken);
      await loadSecurityLogs(verifiedToken);
    }

    setIsLoading(false);
  }

  initializeDashboard();
}, [router, verifyAdmin, loadDashboardStats, loadSecurityLogs]); 
  const summaryStats = [
    {
      title: 'Registered Users',
      value: stats.total_users,
    },
    {
      title: 'Active Clubs',
      value: stats.total_clubs,
    },
    {
      title: 'Upcoming Events',
      value: stats.total_events,
    },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">
          Loading Statistics...
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
              href="/admin"
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
              Back to Admin Dashboard
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
            Statistics & Reporting
          </h1>

          <p className="mt-3 text-gray-600 dark:text-gray-400">
            Monitor platform activity and review security-related information.
          </p>
        </div>

        <section className="grid gap-6 md:grid-cols-3 mb-8">
          {summaryStats.map((stat) => (
            <div
              key={stat.title}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6"
            >
              <h2 className="text-lg font-semibold text-gray-600 dark:text-gray-400">
                {stat.title}
              </h2>

              <p className="mt-3 text-4xl font-bold text-gray-900 dark:text-white">
                {stat.value}
              </p>
            </div>
          ))}
        </section>

        <section className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Security Dashboard
          </h2>

          {securityLogs.length === 0 ? (
            <p className="text-gray-600 dark:text-gray-400">
              No failed login attempts recorded.
            </p>
          ) : (
            <div className="space-y-4">
              {securityLogs.map((log) => (
                <div
                  key={log.user_id}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-5"
                >
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {log.email}
                  </h3>

                  <p className="text-gray-600 dark:text-gray-400">
                    Failed Attempts: {log.failed_login_attempts}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
