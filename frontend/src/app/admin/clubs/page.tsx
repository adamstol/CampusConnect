'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/context/ThemeContext';
import { useCallback, useEffect, useState } from 'react';

const API_BASE_URL = 'http://localhost:5000';

interface PendingClubApplication {
  club_id: number;
  club_name: string;
  description: string;
  created_at: string;
  // NOTE: no submitter/representative field yet ΓÇö get_pending_clubs() doesn't
  // return it. Add a join on UserClub (role='admin') server-side if needed.
}

interface ExistingClub {
  club_id: number;
  club_name: string;
  description: string;
  status: string;
  member_count: number;
}

export default function ClubManagementPage() {
  const router = useRouter();
  const { resetTheme } = useTheme();

  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  const [pendingApplications, setPendingApplications] = useState<PendingClubApplication[]>([]);
  const [existingClubs, setExistingClubs] = useState<ExistingClub[]>([]);
  const [actionError, setActionError] = useState<string | null>(null);
  const [pendingActionId, setPendingActionId] = useState<number | null>(null);

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

  const fetchClubData = useCallback(async () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const [pendingRes, allClubsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/admin/clubs/pending`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE_URL}/admin/clubs`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (pendingRes.status === 401 || allClubsRes.status === 401) {
        handleUnauthorized();
        return;
      }

      if (pendingRes.ok) {
        setPendingApplications(await pendingRes.json());
      }

      if (allClubsRes.ok) {
        setExistingClubs(await allClubsRes.json());
      }
    } catch {
      setActionError('Failed to load club data. Please refresh the page.');
    }
  }, [handleUnauthorized, router]);

  useEffect(() => {
    const token = localStorage.getItem('access_token');

    if (!token) {
      router.push('/login');
      return;
    }

    Promise.resolve().then(() => verifyAdmin(token));
  }, [router, verifyAdmin]);

  useEffect(() => {
    if (isAuthorized) {
      fetchClubData();
    }
  }, [isAuthorized, fetchClubData]);

  const handleApprove = async (clubId: number) => {
    const token = localStorage.getItem('access_token');
    if (!token) return;

    setActionError(null);
    setPendingActionId(clubId);

    try {
      const response = await fetch(`${API_BASE_URL}/admin/clubs/${clubId}/approve`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      if (!response.ok) {
        setActionError('Failed to approve club application.');
        return;
      }

      await fetchClubData();
    } catch {
      setActionError('Failed to approve club application.');
    } finally {
      setPendingActionId(null);
    }
  };

  const handleReject = async (clubId: number) => {
    const token = localStorage.getItem('access_token');
    if (!token) return;

    setActionError(null);
    setPendingActionId(clubId);

    try {
      const response = await fetch(`${API_BASE_URL}/admin/clubs/${clubId}/reject`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      if (!response.ok) {
        setActionError('Failed to reject club application.');
        return;
      }

      await fetchClubData();
    } catch {
      setActionError('Failed to reject club application.');
    } finally {
      setPendingActionId(null);
    }
  };

  const handleDeleteClub = async (clubId: number) => {
    const token = localStorage.getItem('access_token');
    if (!token) return;

    setActionError(null);
    setPendingActionId(clubId);

    try {
      const response = await fetch(`${API_BASE_URL}/clubs/${clubId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      if (!response.ok) {
        setActionError('Failed to delete club.');
        return;
      }

      await fetchClubData();
    } catch {
      setActionError('Failed to delete club.');
    } finally {
      setPendingActionId(null);
    }
  };

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

        {actionError && (
          <div className="mb-6 rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 px-4 py-3 text-red-700 dark:text-red-300">
            {actionError}
          </div>
        )}

        {/* Pending Applications */}

        <section className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Pending Club Applications
          </h2>

          {pendingApplications.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">
              No pending applications.
            </p>
          ) : (
            <div className="space-y-4">
              {pendingApplications.map((club) => (
                <div
                  key={club.club_id}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-5"
                >
                  <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                        {club.club_name}
                      </h3>

                      <p className="text-gray-600 dark:text-gray-400">
                        {club.description}
                      </p>

                      <p className="text-sm text-gray-500 dark:text-gray-500">
                        Submitted: {new Date(club.created_at).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => handleApprove(club.club_id)}
                        disabled={pendingActionId === club.club_id}
                        className="rounded-lg bg-green-600 px-4 py-2 font-semibold text-white hover:bg-green-700 transition disabled:opacity-50"
                      >
                        Approve
                      </button>

                      <button
                        onClick={() => handleReject(club.club_id)}
                        disabled={pendingActionId === club.club_id}
                        className="rounded-lg bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-700 transition disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Existing Clubs */}

        <section className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Existing Clubs
          </h2>

          {existingClubs.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">
              No approved clubs yet.
            </p>
          ) : (
            <div className="space-y-4">
              {existingClubs.map((club) => (
                <div
                  key={club.club_id}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-5"
                >
                  <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                        {club.club_name}
                      </h3>

                      <p className="text-gray-600 dark:text-gray-400">
                        {club.description}
                      </p>

                      <p className="text-sm text-green-600 dark:text-green-400">
                        Status: {club.status === 'approved' ? 'Active' : club.status}
                      </p>

                      <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                        Members: {club.member_count}
                      </p>
                    </div>

                    <div className="flex gap-3">
                      <Link
                        href={`/admin/clubs/${club.club_id}`}
                        className="rounded-lg bg-blue-600 px-5 py-2 font-semibold text-white hover:bg-blue-700 transition text-center"
                      >
                        View Members
                      </Link>

                      <button
                        onClick={() => handleDeleteClub(club.club_id)}
                        disabled={pendingActionId === club.club_id}
                        className="rounded-lg bg-red-600 px-5 py-2 font-semibold text-white hover:bg-red-700 transition disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

