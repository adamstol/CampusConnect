'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/context/ThemeContext';
import { API_BASE_URL } from '@/lib/api';
import ConfirmModal from '@/components/ConfirmModal';

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
  image_url: string | null;
}

interface EventFormData {
  eventName: string;
  description: string;
  eventDate: string;
  location: string;
}

interface Attendee {
  user_id: number;
  first_name: string;
  last_name: string;
  email: string;
  status: string;
  registered_at: string;
}

interface ClubMember {
  user_id: number;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
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

  const [expandedAttendeesId, setExpandedAttendeesId] = useState<number | null>(null);
  const [attendeesByEvent, setAttendeesByEvent] = useState<Record<number, Attendee[]>>({});
  const [loadingAttendeesId, setLoadingAttendeesId] = useState<number | null>(null);
  const [clubMembers, setClubMembers] = useState<ClubMember[]>([]);
  const [addUserId, setAddUserId] = useState('');
  const [isAddingAttendee, setIsAddingAttendee] = useState(false);
  const [removingUserId, setRemovingUserId] = useState<number | null>(null);
  const [uploadingImageEventId, setUploadingImageEventId] = useState<number | null>(null);
  const imageInputRefs = useRef<Record<number, HTMLInputElement | null>>({});
  const [modal, setModal] = useState<{
    isOpen: boolean; title: string; message: string; onConfirm: () => void;
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });
  const openModal = (title: string, message: string, onConfirm: () => void) =>
    setModal({ isOpen: true, title, message, onConfirm });
  const closeModal = () => setModal((m) => ({ ...m, isOpen: false }));

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

  const loadClubMembers = useCallback(async (clubId: string) => {
    const token = localStorage.getItem('access_token');
    if (!token || !clubId) return;
    try {
      const res = await fetch(`${API_BASE_URL}/clubs/${clubId}/members`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) { handleUnauthorized(); return; }
      if (!res.ok) return;
      const data = await res.json() as ClubMember[];
      setClubMembers(data);
    } catch {
      notify('Unable to load club members right now.', true);
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
    Promise.resolve().then(() => {
      setExpandedAttendeesId(null);
      setAttendeesByEvent({});
      setAddUserId('');
      loadEvents(selectedClubId);
      loadClubMembers(selectedClubId);
    });
  }, [selectedClubId, loadEvents, loadClubMembers]);

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

    openModal(
      'Save Changes',
      'Are you sure you want to save changes to this event?',
      () => executeUpdate(),
    );
  }

  async function executeUpdate() {
    closeModal();
    const token = localStorage.getItem('access_token');
    if (!token || editingId === null) return;

    const eventName = editForm.eventName.trim();

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

  function handleDelete(eventId: number) {
    openModal(
      'Delete Event',
      'Are you sure you want to delete this event? This cannot be undone.',
      () => executeDelete(eventId),
    );
  }

  async function executeDelete(eventId: number) {
    closeModal();
    const token = localStorage.getItem('access_token');
    if (!token) return;

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

  async function loadAttendees(eventId: number) {
    const token = localStorage.getItem('access_token');
    if (!token) return;
    setLoadingAttendeesId(eventId);
    try {
      const res = await fetch(`${API_BASE_URL}/events/${eventId}/attendees`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) { handleUnauthorized(); return; }
      if (!res.ok) return;
      const data = await res.json() as Attendee[];
      setAttendeesByEvent((prev) => ({ ...prev, [eventId]: data }));
    } catch {
      // non-critical â€” silently ignore
    } finally {
      setLoadingAttendeesId(null);
    }
  }

  async function toggleAttendees(eventId: number) {
    if (expandedAttendeesId === eventId) {
      setExpandedAttendeesId(null);
      return;
    }
    setExpandedAttendeesId(eventId);
    setAddUserId('');
    if (!attendeesByEvent[eventId]) {
      await loadAttendees(eventId);
    }
  }

  function confirmAddAttendee(eventId: number, name: string) {
    if (!addUserId) return;
    openModal(
      'Add Attendee',
      `Add ${name} to this event?`,
      () => executeAddAttendee(eventId),
    );
  }

  async function executeAddAttendee(eventId: number) {
    closeModal();
    const token = localStorage.getItem('access_token');
    if (!token || !addUserId) return;
    setIsAddingAttendee(true);
    try {
      const res = await fetch(`${API_BASE_URL}/events/${eventId}/attendees/${addUserId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.status === 401) { handleUnauthorized(); return; }
      if (!res.ok) {
        notify(data.message || 'Unable to add attendee.', true);
        return;
      }
      setAddUserId('');
      await loadAttendees(eventId);
    } catch {
      notify('Unable to add attendee right now.', true);
    } finally {
      setIsAddingAttendee(false);
    }
  }

  async function handleRemoveAttendee(eventId: number, userId: number) {
    const token = localStorage.getItem('access_token');
    if (!token) return;
    setRemovingUserId(userId);
    try {
      const res = await fetch(`${API_BASE_URL}/events/${eventId}/attendees/${userId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.status === 401) { handleUnauthorized(); return; }
      if (!res.ok) {
        notify(data.message || 'Unable to remove attendee.', true);
        return;
      }
      setAttendeesByEvent((prev) => ({
        ...prev,
        [eventId]: (prev[eventId] || []).filter((a) => a.user_id !== userId),
      }));
    } catch {
      notify('Unable to remove attendee right now.', true);
    } finally {
      setRemovingUserId(null);
    }
  }

  function confirmRemoveAttendee(eventId: number, userId: number, name: string) {
    openModal(
      'Remove Attendee',
      `Remove ${name} from this event? They will need to re-register themselves.`,
      () => handleRemoveAttendee(eventId, userId),
    );
  }

  async function handleEventImageUpload(eventId: number, file: File) {
    const token = localStorage.getItem('access_token');
    if (!token) return;
    setUploadingImageEventId(eventId);
    try {
      const presignRes = await fetch(`${API_BASE_URL}/upload/events/${eventId}/image`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ content_type: file.type }),
      });
      if (!presignRes.ok) throw new Error('Failed to get upload URL');
      const { upload_url } = await presignRes.json();
      await fetch(upload_url, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      });
      notify('Image uploaded successfully.', false);
      await loadEvents(selectedClubId);
    } catch {
      notify('Image upload failed. Please try again.', true);
    } finally {
      setUploadingImageEventId(null);
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
                            <button
                              type="button"
                              onClick={() => toggleAttendees(event.event_id)}
                              className="rounded-lg px-3 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            >
                              {expandedAttendeesId === event.event_id ? 'Hide Attendees' : 'Attendees'}
                            </button>
                          </div>
                          <div className="mt-2 flex items-center gap-2">
                            {event.image_url && (
                              <div className="relative w-24 h-16 rounded overflow-hidden">
                                <Image src={event.image_url} alt="event image" fill className="object-cover" />
                              </div>
                            )}
                            <button
                              type="button"
                              disabled={uploadingImageEventId === event.event_id}
                              onClick={() => imageInputRefs.current[event.event_id]?.click()}
                              className="rounded-lg px-3 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {uploadingImageEventId === event.event_id
                                ? 'Uploading...'
                                : event.image_url
                                ? 'Change Image'
                                : 'Upload Image'}
                            </button>
                            <input
                              ref={(el) => { imageInputRefs.current[event.event_id] = el; }}
                              type="file"
                              accept="image/jpeg,image/png,image/webp,image/gif"
                              className="hidden"
                              onChange={(e) => {
                                const f = e.target.files?.[0];
                                if (f) handleEventImageUpload(event.event_id, f);
                              }}
                            />
                          </div>

                          {expandedAttendeesId === event.event_id && (
                            <div className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-4">
                              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                                Attendees
                                {attendeesByEvent[event.event_id] && (
                                  <span className="ml-2 rounded-full bg-gray-100 dark:bg-gray-700 px-2 py-0.5 text-xs text-gray-700 dark:text-gray-300">
                                    {attendeesByEvent[event.event_id].length}
                                  </span>
                                )}
                              </h4>

                              {loadingAttendeesId === event.event_id ? (
                                <p className="text-sm text-gray-600 dark:text-gray-400">Loading attendees...</p>
                              ) : (attendeesByEvent[event.event_id] ?? []).length === 0 ? (
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">No attendees yet.</p>
                              ) : (
                                <ul className="space-y-2 mb-4">
                                  {(attendeesByEvent[event.event_id] ?? []).map((attendee) => (
                                    <li key={attendee.user_id} className="flex items-center justify-between text-sm">
                                      <span className="text-gray-800 dark:text-gray-200">
                                        {attendee.first_name} {attendee.last_name}
                                        <span className="ml-2 text-gray-500 dark:text-gray-400 text-xs">({attendee.email})</span>
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => confirmRemoveAttendee(event.event_id, attendee.user_id, `${attendee.first_name} ${attendee.last_name}`)}
                                        disabled={removingUserId === attendee.user_id}
                                        className="rounded px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:cursor-not-allowed disabled:text-gray-400"
                                      >
                                        {removingUserId === attendee.user_id ? 'Removing...' : 'Remove'}
                                      </button>
                                    </li>
                                  ))}
                                </ul>
                              )}

                              {clubMembers.filter(
                                (m) => !(attendeesByEvent[event.event_id] ?? []).some((a) => a.user_id === m.user_id)
                              ).length > 0 && (
                                <div className="flex items-center gap-2 mt-2">
                                  <select
                                    value={addUserId}
                                    onChange={(e) => setAddUserId(e.target.value)}
                                    className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm text-gray-900 dark:text-white dark:bg-gray-700 outline-none focus:border-red-600 focus:ring-2 focus:ring-red-100"
                                  >
                                    <option value="">Select a member to add...</option>
                                    {clubMembers
                                      .filter((m) => !(attendeesByEvent[event.event_id] ?? []).some((a) => a.user_id === m.user_id))
                                      .map((member) => (
                                        <option key={member.user_id} value={member.user_id}>
                                          {member.first_name} {member.last_name} ({member.email})
                                        </option>
                                      ))}
                                  </select>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const member = clubMembers.find((m) => String(m.user_id) === addUserId);
                                      const name = member ? `${member.first_name} ${member.last_name}` : 'this member';
                                      confirmAddAttendee(event.event_id, name);
                                    }}
                                    disabled={!addUserId || isAddingAttendee}
                                    className="rounded-lg bg-red-600 px-3 py-2 text-sm font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-gray-400"
                                  >
                                    {isAddingAttendee ? 'Adding...' : 'Add'}
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
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
      <ConfirmModal
        isOpen={modal.isOpen}
        title={modal.title}
        message={modal.message}
        confirmLabel={modal.title === 'Save Changes' ? 'Save' : modal.title === 'Add Attendee' ? 'Add' : 'Delete'}
        onConfirm={modal.onConfirm}
        onCancel={closeModal}
      />
    </div>
  );
}
