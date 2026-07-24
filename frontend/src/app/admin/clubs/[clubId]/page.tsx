'use client';

import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { useTheme } from '@/context/ThemeContext';
import { useCallback, useEffect, useState } from 'react';

const API_BASE_URL = 'http://localhost:5000';

interface Member {
  user_id: number;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  joined_at: string;
}

interface ClubDetail {
  club_id: number;
  club_name: string;
  members: Member[];
}

export default function ClubMembersPage() {
  const params = useParams();
  const clubId = parseInt(params.clubId as string);
  const router = useRouter();
  const { resetTheme } = useTheme();

  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [clubData, setClubData] = useState<ClubDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

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

        setIsAuthorized(true);
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

  useEffect(() => {
    if (!isAuthorized) return;

    const token = localStorage.getItem('access_token');
    if (!token) {
      router.push('/login');
      return;
    }

    const fetchClubMembers = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/admin/clubs/${clubId}/members`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.status === 401) {
          handleUnauthorized();
          return;
        }

        if (!response.ok) {
          setError('Failed to load club members');
          return;
        }

        const data = await response.json();
        setClubData(data);
      } catch {
        setError('Failed to load club members. Please try again.');
      }
    };

    fetchClubMembers();
  }, [isAuthorized, clubId, router, handleUnauthorized]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">
          Loading...
        </p>
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <Link
              href="/admin/clubs"
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
              Back to Club Management
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {error && (
          <div className="mb-6 rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 px-4 py-3 text-red-700 dark:text-red-300">
            {error}
          </div>
        )}

        {clubData ? (
          <>
            <div className="mb-10">
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
                {clubData.club_name}
              </h1>
              <p className="mt-3 text-gray-600 dark:text-gray-400">
                Total Members: {clubData.members.length}
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              {clubData.members.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400">
                  No members yet.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                          Name
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                          Email
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                          Role
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                          Joined
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {clubData.members.map((member) => (
                        <tr
                          key={member.user_id}
                          className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                          <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                            {member.first_name} {member.last_name}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                            {member.email}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <span
                              className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${
                                member.role === 'admin'
                                  ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300'
                                  : 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
                              }`}
                            >
                              {member.role === 'admin' ? 'Admin' : 'Member'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                            {new Date(member.joined_at).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        ) : (
          <p className="text-center text-gray-600 dark:text-gray-400">
            Club not found or loading...
          </p>
        )}
      </main>
    </div>
  );
}
