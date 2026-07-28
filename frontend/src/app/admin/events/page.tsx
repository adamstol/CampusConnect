'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/context/ThemeContext';
import { useCallback, useEffect, useState } from 'react';
import { API_BASE_URL } from '@/lib/api';

interface EventItem {
  event_id: number;
  event_name: string;
  club_name: string;
  event_date: string;
  location: string;
  status: 'pending' | 'approved' | 'rejected';
  registration_count: number;
}

export default function EventsManagementPage() {
  const router = useRouter();
  const { resetTheme } = useTheme();

  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [error, setError] = useState<string | null>(null);
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

  useEffect(() => {
    const token = localStorage.getItem('access_token');

    if (!token) {
      router.push('/login');
      return;
    }

    Promise.resolve().then(() => verifyAdmin(token));
  }, [router, verifyAdmin]);

  const fetchEvents = useCallback(async () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/admin/events`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      if (!response.ok) {
        setError('Failed to load events');
        return;
      }

      setEvents(await response.json());
    } catch {
      setError('Failed to load events. Please try again.');
    }
  }, [handleUnauthorized, router]);

  useEffect(() => {
    if (isAuthorized) {
      Promise.resolve().then(fetchEvents);
    }
  }, [isAuthorized, fetchEvents]);

  const handleReview = async (eventId: number, action: 'approve' | 'reject') => {
    const token = localStorage.getItem('access_token');
    if (!token) return;

    setError(null);
    setPendingActionId(eventId);
    try {
      const response = await fetch(`${API_BASE_URL}/admin/events/${eventId}/${action}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      if (!response.ok) {
        setError(`Failed to ${action} event.`);
        return;
      }

      await fetchEvents();
    } catch {
      setError(`Failed to ${action} event.`);
    } finally {
      setPendingActionId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">
          Loading Event Management...
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
            Event Management
          </h1>

          <p className="mt-3 text-gray-600 dark:text-gray-400">
            Review pending events, change approval status, and view registrations.
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 px-4 py-3 text-red-700 dark:text-red-300">
            {error}
          </div>
        )}

        <section className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          {events.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">
              No events found.
            </p>
          ) : (
            <div className="space-y-4">
              {events.map((event) => (
                <div
                  key={event.event_id}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-5"
                >
                  <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                        {event.event_name}
                      </h3>

                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Club: {event.club_name}
                      </p>

                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Date: {new Date(event.event_date).toLocaleDateString()}{' '}
                        {new Date(event.event_date).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>

                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Location: {event.location}
                      </p>

                      <div className="mt-2 flex flex-wrap gap-2">
                        <span
                          className={`inline-block rounded-full px-2 py-1 text-xs font-semibold ${
                            event.status === 'approved'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                              : event.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                                : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                          }`}
                        >
                          {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                        </span>
                        <span className="inline-block rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                          {event.registration_count} {event.registration_count === 1 ? 'registration' : 'registrations'}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      {event.status !== 'approved' && (
                        <button
                          onClick={() => handleReview(event.event_id, 'approve')}
                          disabled={pendingActionId === event.event_id}
                          className="rounded-lg bg-green-600 px-4 py-2 font-semibold text-white hover:bg-green-700 transition disabled:opacity-50"
                        >
                          Approve
                        </button>
                      )}
                      {event.status !== 'rejected' && (
                        <button
                          onClick={() => handleReview(event.event_id, 'reject')}
                          disabled={pendingActionId === event.event_id}
                          className="rounded-lg bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-700 transition disabled:opacity-50"
                        >
                          {event.status === 'approved' ? 'Disapprove' : 'Reject'}
                        </button>
                      )}
                      <Link
                        href={`/admin/events/${event.event_id}`}
                        className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 transition text-center"
                      >
                        Registrations
                      </Link>
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
