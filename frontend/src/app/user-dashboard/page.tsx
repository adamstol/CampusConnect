'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/context/ThemeContext';
import { API_BASE_URL } from '@/lib/api';
import RoleBadge from '@/components/RoleBadge';

interface DashboardEvent {
  event_id: number;
  club_id: number;
  club_name: string;
  event_name: string;
  description: string | null;
  event_date: string;
  location: string | null;
}

interface RegisteredEvent {
  event_id: number;
  club_id: number;
  club_name: string;
  event_name: string;
  event_date: string;
  location: string | null;
  status: string;
  registered_at: string;
}

interface ManagedClub {
  club_id: number;
  club_name: string;
  role: string;
}

interface MyClub {
  club_id: number;
  club_name: string;
  role: string;
}

interface EventFormData {
  clubId: string;
  eventName: string;
  description: string;
  eventDate: string;
  location: string;
}

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

export default function UserDashboardPage() {
  const router = useRouter();
  const { isDark, toggleDark, resetTheme } = useTheme();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [role, setRole] = useState('');
  const [events, setEvents] = useState<DashboardEvent[]>([]);
  const [registeredEvents, setRegisteredEvents] = useState<RegisteredEvent[]>([]);
  const [myClubs, setMyClubs] = useState<MyClub[]>([]);
  const [managedClubs, setManagedClubs] = useState<ManagedClub[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);
  const [isSubmittingEvent, setIsSubmittingEvent] = useState(false);
  const [eventMessage, setEventMessage] = useState('');
  const [eventForm, setEventForm] = useState<EventFormData>({
    clubId: '',
    eventName: '',
    description: '',
    eventDate: '',
    location: '',
  });

  const [settings, setSettings] = useState({
    notifications: true,
    emailUpdates: true,
    eventReminders: true,
    publicProfile: false,
    language: 'en',
  });

  const handleUnauthorized = useCallback(() => {
    localStorage.removeItem('access_token');
    resetTheme();
    router.push('/login');
  }, [resetTheme, router]);

  const loadDashboardData = useCallback(async (token: string) => {
    setIsLoadingEvents(true);

    try {
      const [profileResponse, eventsResponse, registeredEventsResponse, clubsResponse, myClubsResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE_URL}/events/my-club-events`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE_URL}/events/my-events`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE_URL}/clubs/my-managed-clubs`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE_URL}/clubs/my-clubs`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if ([profileResponse, eventsResponse, registeredEventsResponse, clubsResponse, myClubsResponse].some((response) => response.status === 401)) {
        handleUnauthorized();
        return;
      }

      if (profileResponse.ok) {
        const profile = await profileResponse.json();
        setFirstName(profile.first_name || '');
        setLastName(profile.last_name || '');
        setRole(profile.role_name || '');
      }

      if (eventsResponse.ok) {
        setEvents((await eventsResponse.json()) as DashboardEvent[]);
      } else {
        setEvents([]);
        setEventMessage('Unable to load your events.');
      }

      if (registeredEventsResponse.ok) {
        setRegisteredEvents((await registeredEventsResponse.json()) as RegisteredEvent[]);
      } else {
        setRegisteredEvents([]);
      }

      if (clubsResponse.ok) {
        const clubs = (await clubsResponse.json()) as ManagedClub[];
        setManagedClubs(clubs);
        setEventForm((current) => ({
          ...current,
          clubId: current.clubId || (clubs[0]?.club_id ? String(clubs[0].club_id) : ''),
        }));
      } else {
        setManagedClubs([]);
      }

      if (myClubsResponse.ok) {
        setMyClubs((await myClubsResponse.json()) as MyClub[]);
      } else {
        setMyClubs([]);
      }
    } catch {
      setEventMessage('Unable to load dashboard data right now.');
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

    Promise.resolve().then(() => loadDashboardData(token));
  }, [loadDashboardData, router]);

  const toggleSetting = (key: string) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key as keyof typeof prev] }));
  };

  const handleSignOut = () => {
    localStorage.removeItem('access_token');
    resetTheme();
    router.push('/login');
  };

  function handleEventFormChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setEventForm({
      ...eventForm,
      [e.target.name]: e.target.value,
    });
  }

  async function handleCreateEvent(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const token = localStorage.getItem('access_token');
    if (!token) {
      router.push('/login');
      return;
    }

    const clubId = Number(eventForm.clubId);
    const eventName = eventForm.eventName.trim();

    if (!clubId || !eventName || !eventForm.eventDate) {
      setEventMessage('Club, event name, and date are required.');
      return;
    }

    setIsSubmittingEvent(true);
    setEventMessage('');

    try {
      const response = await fetch(`${API_BASE_URL}/events/`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          club_id: clubId,
          event_name: eventName,
          description: eventForm.description.trim(),
          event_date: new Date(eventForm.eventDate).toISOString(),
          location: eventForm.location.trim(),
        }),
      });

      const data = await response.json();

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      if (!response.ok) {
        setEventMessage(data.message || 'Unable to create event.');
        return;
      }

      setEventForm((current) => ({
        clubId: current.clubId,
        eventName: '',
        description: '',
        eventDate: '',
        location: '',
      }));
      setEventMessage(data.message || 'Event created successfully.');
      await loadDashboardData(token);
    } catch {
      setEventMessage('Unable to create event right now.');
    } finally {
      setIsSubmittingEvent(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center">
              <Image
                src="/campusconnect-logo.png"
                alt="CampusConnect"
                width={156}
                height={72}
                priority
                className="h-12 w-auto object-contain"
              />
            </Link>

            <div
              className="flex items-center justify-center w-9 h-9 rounded-full text-white text-sm font-bold"
              style={{ backgroundColor: '#FE3B5E' }}
            >
              {firstName && lastName ? `${firstName[0]}${lastName[0]}`.toUpperCase() : ''}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Welcome back, {firstName || 'there'}!</h1>
          <div className="flex items-center gap-3 mt-2">
            <p className="text-gray-600 dark:text-gray-400">Here&apos;s what&apos;s happening with your clubs and account</p>
            {role && <RoleBadge role={role} size="md" />}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* Your Clubs membership list */}
            <section className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wide text-red-600">Memberships</p>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Your clubs</h2>
                </div>
                <span className="rounded-full bg-gray-100 dark:bg-gray-700 px-3 py-1 text-sm font-semibold text-gray-700 dark:text-gray-300">
                  {myClubs.length} {myClubs.length === 1 ? 'club' : 'clubs'}
                </span>
              </div>

              {isLoadingEvents ? (
                <p className="text-sm text-gray-600 dark:text-gray-400">Loading clubs...</p>
              ) : myClubs.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {myClubs.map((club) => (
                    <Link
                      key={club.club_id}
                      href={`/clubs/${club.club_id}`}
                      className="flex items-center justify-between rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-3 hover:border-red-300 dark:hover:border-red-700 hover:shadow-sm transition-all group"
                    >
                      <span className="font-medium text-gray-900 dark:text-white group-hover:text-red-600 transition-colors">
                        {club.club_name}
                      </span>
                      <RoleBadge role={club.role} />
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-gray-300 dark:border-gray-700 p-8 text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400">You haven&apos;t joined any clubs yet.</p>
                  <Link href="/clubs" className="mt-3 inline-block text-sm font-semibold text-red-600 hover:text-red-700">
                    Browse clubs &rarr;
                  </Link>
                </div>
              )}
            </section>

            <section className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wide text-red-600">Registrations</p>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Your registered events</h2>
                </div>
                <span className="rounded-full bg-gray-100 dark:bg-gray-700 px-3 py-1 text-sm font-semibold text-gray-700 dark:text-gray-300">
                  {registeredEvents.length} {registeredEvents.length === 1 ? 'event' : 'events'}
                </span>
              </div>

              {isLoadingEvents ? (
                <p className="text-sm text-gray-600 dark:text-gray-400">Loading registrations...</p>
              ) : registeredEvents.length > 0 ? (
                <div className="space-y-3">
                  {registeredEvents.map((event) => (
                    <article
                      key={event.event_id}
                      className="flex flex-col justify-between gap-3 rounded-lg border border-gray-200 p-4 dark:border-gray-700 sm:flex-row sm:items-start"
                    >
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">{event.event_name}</h3>
                        <p className="mt-1 text-sm font-medium text-red-600">{event.club_name}</p>
                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                          {formatEventDate(event.event_date)}{event.location ? ` · ${event.location}` : ''}
                        </p>
                      </div>
                      <span className="w-fit rounded-full bg-green-100 px-2 py-1 text-xs font-semibold capitalize text-green-800 dark:bg-green-900/30 dark:text-green-300">
                        {event.status.replace('_', ' ')}
                      </span>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center dark:border-gray-700">
                  <p className="text-sm text-gray-600 dark:text-gray-400">You have not registered for any events yet.</p>
                  <Link href="/events-this-week" className="mt-3 inline-block text-sm font-semibold text-red-600 hover:text-red-700">
                    Browse events &rarr;
                  </Link>
                </div>
              )}
            </section>

            {/* Club events */}
            <section className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wide text-red-600">Your Clubs</p>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Club events</h2>
                </div>
                <span className="rounded-full bg-gray-100 dark:bg-gray-700 px-3 py-1 text-sm font-semibold text-gray-700 dark:text-gray-300">
                  {events.length} {events.length === 1 ? 'event' : 'events'}
                </span>
              </div>

              {isLoadingEvents ? (
                <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">Loading your events...</p>
              ) : events.length > 0 ? (
                <div className="space-y-4">
                  {events.map((event) => (
                    <article key={event.event_id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white">{event.event_name}</h3>
                          <p className="mt-1 text-sm font-medium text-red-600">{event.club_name}</p>
                          {event.description && (
                            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{event.description}</p>
                          )}
                          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-sm mt-3">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span>{event.location || 'York University'}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-sm mt-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span>{formatEventDate(event.event_date)}</span>
                          </div>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-gray-300 dark:border-gray-700 p-8 text-center">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">No club events yet</h3>
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Events from clubs you belong to will appear here.</p>
                </div>
              )}

              <Link href="/events-this-week">
                <button className="mt-4 text-red-600 hover:text-red-700 font-medium">
                  Browse more events &rarr;
                </button>
              </Link>
            </section>

            {(role === 'Club Representative' || role === 'Administrator') && (
            <section className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <div className="mb-6">
                <p className="text-sm font-semibold uppercase tracking-wide text-red-600">Create</p>
                <h2 className="mt-1 text-xl font-semibold text-gray-900 dark:text-white">Add an event</h2>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  Events can be created for clubs where you are an admin or representative.
                </p>
              </div>

              {managedClubs.length > 0 ? (
                <form className="grid grid-cols-1 gap-5 md:grid-cols-2" onSubmit={handleCreateEvent}>
                  <div>
                    <label htmlFor="clubId" className="mb-2 block text-sm font-semibold text-gray-900 dark:text-white">
                      Club
                    </label>
                    <select
                      id="clubId"
                      name="clubId"
                      value={eventForm.clubId}
                      onChange={handleEventFormChange}
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-3 text-gray-900 dark:text-white dark:bg-gray-700 outline-none transition focus:border-red-600 focus:ring-2 focus:ring-red-100"
                      required
                    >
                      {managedClubs.map((club) => (
                        <option key={club.club_id} value={club.club_id}>
                          {club.club_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="eventDate" className="mb-2 block text-sm font-semibold text-gray-900 dark:text-white">
                      Date and Time
                    </label>
                    <input
                      id="eventDate"
                      name="eventDate"
                      type="datetime-local"
                      value={eventForm.eventDate}
                      onChange={handleEventFormChange}
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-3 text-gray-900 dark:text-white dark:bg-gray-700 outline-none transition focus:border-red-600 focus:ring-2 focus:ring-red-100"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="eventName" className="mb-2 block text-sm font-semibold text-gray-900 dark:text-white">
                      Event Name
                    </label>
                    <input
                      id="eventName"
                      name="eventName"
                      type="text"
                      value={eventForm.eventName}
                      onChange={handleEventFormChange}
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-3 text-gray-900 dark:text-white dark:bg-gray-700 outline-none transition focus:border-red-600 focus:ring-2 focus:ring-red-100"
                      placeholder="Campus mixer"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="location" className="mb-2 block text-sm font-semibold text-gray-900 dark:text-white">
                      Location
                    </label>
                    <input
                      id="location"
                      name="location"
                      type="text"
                      value={eventForm.location}
                      onChange={handleEventFormChange}
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-3 text-gray-900 dark:text-white dark:bg-gray-700 outline-none transition focus:border-red-600 focus:ring-2 focus:ring-red-100"
                      placeholder="Student Centre"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label htmlFor="description" className="mb-2 block text-sm font-semibold text-gray-900 dark:text-white">
                      Description
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      value={eventForm.description}
                      onChange={handleEventFormChange}
                      className="min-h-28 w-full resize-y rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-3 text-gray-900 dark:text-white dark:bg-gray-700 outline-none transition focus:border-red-600 focus:ring-2 focus:ring-red-100"
                      placeholder="A short summary of the event."
                    />
                  </div>

                  {eventMessage && (
                    <p className="md:col-span-2 rounded-lg bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm font-semibold text-red-700 dark:text-red-300" aria-live="polite">
                      {eventMessage}
                    </p>
                  )}

                  <div className="md:col-span-2">
                    <button
                      type="submit"
                      disabled={isSubmittingEvent}
                      className="rounded-lg bg-red-600 px-5 py-3 font-bold text-white shadow-md transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-gray-400"
                    >
                      {isSubmittingEvent ? 'Creating...' : 'Create Event'}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="rounded-lg border border-dashed border-gray-300 dark:border-gray-700 p-8 text-center">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">No managed clubs</h3>
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Create or manage a club before adding events.</p>
                  <Link
                    href="/userclubs"
                    className="mt-5 inline-flex rounded-lg bg-red-600 px-5 py-3 font-bold text-white transition hover:bg-red-700"
                  >
                    Manage Clubs
                  </Link>
                </div>
              )}
            </section>
            )}
          </div>

          <div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Settings</h2>

              <div className="space-y-6">
                {(role === 'Club Representative' || role === 'Administrator') && (
                  <Link
                    href="/userclubs"
                    className="block w-full rounded-lg bg-red-600 px-4 py-3 text-center font-semibold text-white transition-colors hover:bg-red-700"
                  >
                    Manage Clubs
                  </Link>
                )}

                {role === 'Administrator' && (
                  <Link
                    href="/admin"
                    className="block w-full rounded-lg bg-gray-900 dark:bg-gray-700 px-4 py-3 text-center font-semibold text-white transition-colors hover:bg-gray-800 dark:hover:bg-gray-600"
                  >
                    Admin Dashboard
                  </Link>
                )}

                {(role === 'Club Representative' || role === 'Administrator') && (
                  <Link
                    href="/manage-events"
                    className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-3 text-center font-semibold text-gray-700 dark:text-gray-300 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    Manage Events
                  </Link>
                )}

                {(role === 'Club Representative' || role === 'Administrator') && (
                  <Link
                    href="/manage-announcements"
                    className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-3 text-center font-semibold text-gray-700 dark:text-gray-300 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    Announcements
                  </Link>
                )}

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">Notifications</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Receive push notifications</p>
                  </div>
                  <button
                    onClick={() => toggleSetting('notifications')}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      settings.notifications ? 'bg-red-600' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                      settings.notifications ? 'translate-x-6' : 'translate-x-0.5'
                    }`} />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">Email Updates</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Weekly event digest</p>
                  </div>
                  <button
                    onClick={() => toggleSetting('emailUpdates')}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      settings.emailUpdates ? 'bg-red-600' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                      settings.emailUpdates ? 'translate-x-6' : 'translate-x-0.5'
                    }`} />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">Event Reminders</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Remind before events</p>
                  </div>
                  <button
                    onClick={() => toggleSetting('eventReminders')}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      settings.eventReminders ? 'bg-red-600' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                      settings.eventReminders ? 'translate-x-6' : 'translate-x-0.5'
                    }`} />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">Public Profile</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Make profile visible</p>
                  </div>
                  <button
                    onClick={() => toggleSetting('publicProfile')}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      settings.publicProfile ? 'bg-red-600' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                      settings.publicProfile ? 'translate-x-6' : 'translate-x-0.5'
                    }`} />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">Dark Mode</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Switch to dark theme</p>
                  </div>
                  <button
                    onClick={toggleDark}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      isDark ? 'bg-red-600' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                      isDark ? 'translate-x-6' : 'translate-x-0.5'
                    }`} />
                  </button>
                </div>

                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white mb-2">Language</h3>
                  <select
                    value={settings.language}
                    onChange={(e) => setSettings((prev) => ({ ...prev, language: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 text-black dark:text-white dark:bg-gray-700"
                  >
                    <option value="en">English</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                    <option value="de">German</option>
                    <option value="zh">Chinese</option>
                  </select>
                </div>

                <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
                  <Link href="/edit-profile" className="block w-full text-left px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                    Edit Profile
                  </Link>
                  <Link href="/change-password" className="block w-full text-left px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                    Change Password
                  </Link>
                  <button onClick={handleSignOut} className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
