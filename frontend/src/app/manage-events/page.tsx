'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/context/ThemeContext';
import { API_BASE_URL } from '@/lib/api';

interface ManagedClub {
  club_id: number;
  club_name: string;
  role: string;
}

interface ClubEvent {
  event_id: number;
  event_name: string;
  description: string | null;
  event_date: string;
  location: string | null;
}

interface EventFormData {
  eventName: string;
  description: string;
  eventDate: string;
  location: string;
}

const EMPTY_FORM: EventFormData = { eventName: '', description: '', eventDate: '', location: '' };

function formatEventDate(date: string) {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(date));
}

// datetime-local inputs need `YYYY-MM-DDTHH:mm` in local time, not an ISO/UTC string.
function toDateTimeLocal(date: string) {
  const parsed = new Date(date);
  const offset = parsed.getTimezoneOffset() * 60000;
  return new Date(parsed.getTime() - offset).toISOString().slice(0, 16);
}

export default function ManageEventsPage() {
  const router = useRouter();
  const { resetTheme } = useTheme();

  const [managedClubs, setManagedClubs] = useState<ManagedClub[]>([]);
  const [selectedClubId, setSelectedClubId] = useState('');
  const [events, setEvents] = useState<ClubEvent[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<EventFormData>(EMPTY_FORM);

  const [isLoadingClubs, setIsLoadingClubs] = useState(true);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [hasError, setHasError] = useState(false);

  const handleUnauthorized = useCallback(() => {
    localStorage.removeItem('access_token');
    resetTheme();
    router.push('/login');
  }, [resetTheme, router]);

  const notify = (text: string, isError: boolean) => {
    setMessage(text);
    setHasError(isError);
  };

  const loadManagedClubs = useCallback(async (token: string) => {
    setIsLoadingClubs(true);
    try {
      const response = await fetch(`${API_BASE_URL}/clubs/my-managed-clubs`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      if (!response.ok) {
        notify('Unable to load your clubs.', true);
        return;
      }

      const clubs = (await response.json()) as ManagedClub[];
      setManagedClubs(clubs);
      setSelectedClubId((current) => current || (clubs[0] ? String(clubs[0].club_id) : ''));
    } catch {
      notify('Unable to load your clubs right now.', true);
    } finally {
      setIsLoadingClubs(false);
    }
  }, [handleUnauthorized]);

  const loadEvents = useCallback(async (clubId: string) => {
    const token = localStorage.getItem('access_token');
    if (!token || !clubId) return;

    setIsLoadingEvents(true);
    try {
      const response = await fetch(`${API_BASE_URL}/events/club/${clubId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      if (!response.ok) {
        setEvents([]);
        notify('Unable to load events.', true);
        return;
      }

      setEvents((await response.json()) as ClubEvent[]);
    } catch {
      setEvents([]);
      notify('Unable to load events right now.', true);
    } finally {
      setIsLoadingEvents(false);
    }
  }, [handleUnauthorized]);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      router.push('/login');
      return;
    }
    Promise.resolve().then(() => loadManagedClubs(token));
  }, [loadManagedClubs, router]);

  useEffect(() => {
    if (!selectedClubId) return;
    Promise.resolve().then(() => loadEvents(selectedClubId));
  }, [selectedClubId, loadEvents]);

  function startEditing(event: ClubEvent) {
    setEditingId(event.event_id);
    setEditForm({
      eventName: event.event_name,
      description: event.description || '',
      eventDate: toDateTimeLocal(event.event_date),
      location: event.location || '',
    });
    setMessage('');
  }

  function handleEditChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  }

  async function handleUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const token = localStorage.getItem('access_token');
    if (!token || editingId === null) return;

    const eventName = editForm.eventName.trim();
    if (!eventName || !editForm.eventDate) {
      notify('Event name and date are required.', true);
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_BASE_URL}/events/${editingId}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event_name: eventName,
          description: editForm.description.trim(),
          event_date: new Date(editForm.eventDate).toISOString(),
          location: editForm.location.trim(),
        }),
      });

      const data = await response.json();

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      if (!response.ok) {
        notify(data.message || 'Unable to update event.', true);
        return;
      }

      setEditingId(null);
      setEditForm(EMPTY_FORM);
      notify(data.message || 'Event updated.', false);
      await loadEvents(selectedClubId);
    } catch {
      notify('Unable to update event right now.', true);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(eventId: number) {
    const token = localStorage.getItem('access_token');
    if (!token) return;

    if (!window.confirm('Delete this event? This cannot be undone.')) return;

    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_BASE_URL}/events/${eventId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      if (!response.ok) {
        notify(data.message || 'Unable to delete event.', true);
        return;
      }

      notify(data.message || 'Event deleted.', false);
      await loadEvents(selectedClubId);
    } catch {
      notify('Unable to delete event right now.', true);
    } finally {
      setIsSubmitting(false);
    }
  }

  const inputClasses =
    'w-full rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-3 text-gray-900 dark:text-white dark:bg-gray-700 outline-none transition focus:border-red-600 focus:ring-2 focus:ring-red-100';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <Link
              href="/user-dashboard"
              className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Dashboard
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Manage Events</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Edit or delete events for clubs you administer. Create new events from the dashboard.
          </p>
        </div>

        {message && (
          <p
            className={`mb-6 rounded-lg px-4 py-3 text-sm font-semibold ${
              hasError
                ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                : 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
            }`}
            aria-live="polite"
          >
            {message}
          </p>
        )}

        {isLoadingClubs ? (
          <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">Loading your clubs...</p>
        ) : managedClubs.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-300 dark:border-gray-700 p-8 text-center">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">No managed clubs</h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              You need to be an admin or representative of a club to manage its events.
            </p>
            <Link
              href="/userclubs"
              className="mt-5 inline-flex rounded-lg bg-red-600 px-5 py-3 font-bold text-white transition hover:bg-red-700"
            >
              Manage Clubs
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            <section className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <label htmlFor="clubSelect" className="mb-2 block text-sm font-semibold text-gray-900 dark:text-white">
                Club
              </label>
              <select
                id="clubSelect"
                value={selectedClubId}
                onChange={(e) => {
                  setSelectedClubId(e.target.value);
                  setEditingId(null);
                  setMessage('');
                }}
                className={inputClasses}
              >
                {managedClubs.map((club) => (
                  <option key={club.club_id} value={club.club_id}>
                    {club.club_name}
                  </option>
                ))}
              </select>
            </section>

            <section className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <div className="mb-5 flex items-end justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wide text-red-600">Scheduled</p>
                  <h2 className="mt-1 text-xl font-semibold text-gray-900 dark:text-white">Events</h2>
                </div>
                <span className="rounded-full bg-gray-100 dark:bg-gray-700 px-3 py-1 text-sm font-semibold text-gray-700 dark:text-gray-300">
                  {events.length}
                </span>
              </div>

              {isLoadingEvents ? (
                <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">Loading events...</p>
              ) : events.length === 0 ? (
                <div className="rounded-lg border border-dashed border-gray-300 dark:border-gray-700 p-8 text-center">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">No events yet</h3>
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    Create an event from the dashboard to manage it here.
                  </p>
                  <Link
                    href="/user-dashboard"
                    className="mt-5 inline-flex rounded-lg bg-red-600 px-5 py-3 font-bold text-white transition hover:bg-red-700"
                  >
                    Go to Dashboard
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {events.map((event) => (
                    <article
                      key={event.event_id}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                    >
                      {editingId === event.event_id ? (
                        <form className="grid grid-cols-1 gap-4 md:grid-cols-2" onSubmit={handleUpdate}>
                          <div>
                            <label
                              htmlFor="eventName"
                              className="mb-2 block text-sm font-semibold text-gray-900 dark:text-white"
                            >
                              Event Name
                            </label>
                            <input
                              id="eventName"
                              name="eventName"
                              type="text"
                              value={editForm.eventName}
                              onChange={handleEditChange}
                              className={inputClasses}
                              required
                            />
                          </div>

                          <div>
                            <label
                              htmlFor="eventDate"
                              className="mb-2 block text-sm font-semibold text-gray-900 dark:text-white"
                            >
                              Date and Time
                            </label>
                            <input
                              id="eventDate"
                              name="eventDate"
                              type="datetime-local"
                              value={editForm.eventDate}
                              onChange={handleEditChange}
                              className={inputClasses}
                              required
                            />
                          </div>

                          <div className="md:col-span-2">
                            <label
                              htmlFor="location"
                              className="mb-2 block text-sm font-semibold text-gray-900 dark:text-white"
                            >
                              Location
                            </label>
                            <input
                              id="location"
                              name="location"
                              type="text"
                              value={editForm.location}
                              onChange={handleEditChange}
                              className={inputClasses}
                            />
                          </div>

                          <div className="md:col-span-2">
                            <label
                              htmlFor="description"
                              className="mb-2 block text-sm font-semibold text-gray-900 dark:text-white"
                            >
                              Description
                            </label>
                            <textarea
                              id="description"
                              name="description"
                              value={editForm.description}
                              onChange={handleEditChange}
                              className={`${inputClasses} min-h-24 resize-y`}
                            />
                          </div>

                          <div className="md:col-span-2 flex items-center gap-3">
                            <button
                              type="submit"
                              disabled={isSubmitting}
                              className="rounded-lg bg-red-600 px-4 py-2 font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-gray-400"
                            >
                              {isSubmitting ? 'Saving...' : 'Save'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingId(null)}
                              className="rounded-lg px-4 py-2 font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                      ) : (
                        <>
                          <h3 className="font-semibold text-gray-900 dark:text-white">{event.event_name}</h3>
                          {event.description && (
                            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{event.description}</p>
                          )}
                          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-sm mt-3">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                            </svg>
                            <span>{event.location || 'York University'}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-sm mt-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                              />
                            </svg>
                            <span>{formatEventDate(event.event_date)}</span>
                          </div>
                          <div className="mt-4 flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => startEditing(event)}
                              className="rounded-lg px-3 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(event.event_id)}
                              disabled={isSubmitting}
                              className="rounded-lg px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:cursor-not-allowed disabled:text-gray-400"
                            >
                              Delete
                            </button>
                          </div>
                        </>
                      )}
                    </article>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
