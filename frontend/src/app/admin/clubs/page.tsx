'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/context/ThemeContext';
import { useCallback, useEffect, useState } from 'react';

const API_BASE_URL = 'http://localhost:5000';

interface PendingClubApplication {
  id: number;
  name: string;
  representative: string;
  submitted: string;
}

interface ExistingClub {
  id: number;
  name: string;
  members: number;
  status: string;
}

export default function ClubManagementPage() {
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

        /*
         * Uncomment later once role checking is implemented.
         *
         * const profile = await response.json();
         *
         * if (profile.role_name !== 'Admin') {
         *   router.push('/user-dashboard');
         *   return;
         * }
         */
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

  const pendingApplications: PendingClubApplication[] = [
    {
      id: 1,
      name: 'Photography Club',
      representative: 'Alice Johnson',
      submitted: 'July 20, 2026',
    },
    {
      id: 2,
      name: 'Chess Club',
      representative: 'Bob Smith',
      submitted: 'July 21, 2026',
    },
    {
      id: 3,
      name: 'Robotics Society',
      representative: 'Charlie Brown',
      submitted: 'July 22, 2026',
    },
  ];

  const existingClubs: ExistingClub[] = [
    {
      id: 1,
      name: 'Computer Science Club',
      members: 142,
      status: 'Active',
    },
    {
      id: 2,
      name: 'Anime Club',
      members: 81,
      status: 'Active',
    },
    {
      id: 3,
      name: 'Book Club',
      members: 39,
      status: 'Active',
    },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">
          Loading Club Management...
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
            Club Management
          </h1>

          <p className="mt-3 text-gray-600 dark:text-gray-400">
            Review pending club applications and manage existing clubs across
            the platform.
          </p>
        </div>

        {/* Pending Applications */}

        <section className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Pending Club Applications
          </h2>

          <div className="space-y-4">
            {pendingApplications.map((club) => (
              <div
                key={club.id}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-5"
              >
                <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                      {club.name}
                    </h3>

                    <p className="text-gray-600 dark:text-gray-400">
                      Representative: {club.representative}
                    </p>

                    <p className="text-sm text-gray-500 dark:text-gray-500">
                      Submitted: {club.submitted}
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => console.log('Approve', club.id)}
                      className="rounded-lg bg-green-600 px-4 py-2 font-semibold text-white hover:bg-green-700 transition"
                    >
                      Approve
                    </button>

                    <button
                      onClick={() => console.log('Reject', club.id)}
                      className="rounded-lg bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-700 transition"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Existing Clubs */}

        <section className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Existing Clubs
          </h2>

          <div className="space-y-4">
            {existingClubs.map((club) => (
              <div
                key={club.id}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-5"
              >
                <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                      {club.name}
                    </h3>

                    <p className="text-gray-600 dark:text-gray-400">
                      Members: {club.members}
                    </p>

                    <p className="text-sm text-green-600 dark:text-green-400">
                      Status: {club.status}
                    </p>
                  </div>

                  <button
                    onClick={() => console.log('Delete Club', club.id)}
                    className="rounded-lg bg-red-600 px-5 py-2 font-semibold text-white hover:bg-red-700 transition"
                  >
                    Delete Club
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
