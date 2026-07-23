'use client';

import React, { useCallback, useEffect, useState } from 'react';
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

interface Announcement {
  announcement_id: number;
  club_id: number;
  created_by: number;
  title: string;
  body: string;
  created_at: string;
  updated_at: string;
}

interface AnnouncementFormData {
  title: string;
  body: string;
}

const EMPTY_FORM: AnnouncementFormData = { title: '', body: '' };

function formatTimestamp(date: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(date));
}

export default function ManageAnnouncementsPage() {
  const router = useRouter();
  const { resetTheme } = useTheme();

  const [managedClubs, setManagedClubs] = useState<ManagedClub[]>([]);
  const [selectedClubId, setSelectedClubId] = useState('');
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [createForm, setCreateForm] = useState<AnnouncementFormData>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<AnnouncementFormData>(EMPTY_FORM);

  const [isLoadingClubs, setIsLoadingClubs] = useState(true);
  const [isLoadingAnnouncements, setIsLoadingAnnouncements] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [hasError, setHasError] = useState(false);
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

  const loadAnnouncements = useCallback(async (clubId: string) => {
    const token = localStorage.getItem('access_token');
    if (!token || !clubId) return;

    setIsLoadingAnnouncements(true);
    try {
      const response = await fetch(`${API_BASE_URL}/clubs/${clubId}/announcements`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      if (!response.ok) {
        setAnnouncements([]);
        notify('Unable to load announcements.', true);
        return;
      }

      setAnnouncements((await response.json()) as Announcement[]);
    } catch {
      setAnnouncements([]);
      notify('Unable to load announcements right now.', true);
    } finally {
      setIsLoadingAnnouncements(false);
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
    Promise.resolve().then(() => loadAnnouncements(selectedClubId));
  }, [selectedClubId, loadAnnouncements]);

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const token = localStorage.getItem('access_token');
    if (!token) {
      router.push('/login');
      return;
    }

    const title = createForm.title.trim();
    const body = createForm.body.trim();

    if (!title || !body) {
      notify('Title and body are required.', true);
      return;
    }

    setIsSubmitting(true);
    setMessage('');

    try {
      const response = await fetch(`${API_BASE_URL}/clubs/${selectedClubId}/announcements`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title, body }),
      });

      const data = await response.json();

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      if (!response.ok) {
        notify(data.message || 'Unable to post announcement.', true);
        return;
      }

      setCreateForm(EMPTY_FORM);
      notify(data.message || 'Announcement posted.', false);
      await loadAnnouncements(selectedClubId);
    } catch {
      notify('Unable to post announcement right now.', true);
    } finally {
      setIsSubmitting(false);
    }
  }

  function startEditing(announcement: Announcement) {
    setEditingId(announcement.announcement_id);
    setEditForm({ title: announcement.title, body: announcement.body });
    setMessage('');
  }

  async function handleUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const token = localStorage.getItem('access_token');
    if (!token || editingId === null) return;

    const title = editForm.title.trim();
    const body = editForm.body.trim();

    if (!title || !body) {
      notify('Title and body are required.', true);
      return;
    }

    openModal(
      'Save Changes',
      'Are you sure you want to save changes to this announcement?',
      () => executeUpdate(),
    );
  }

  async function executeUpdate() {
    closeModal();
    const token = localStorage.getItem('access_token');
    if (!token || editingId === null) return;

    const title = editForm.title.trim();
    const body = editForm.body.trim();

    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_BASE_URL}/announcements/${editingId}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title, body }),
      });

      const data = await response.json();

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      if (!response.ok) {
        notify(data.message || 'Unable to update announcement.', true);
        return;
      }

      setEditingId(null);
      setEditForm(EMPTY_FORM);
      notify(data.message || 'Announcement updated.', false);
      await loadAnnouncements(selectedClubId);
    } catch {
      notify('Unable to update announcement right now.', true);
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleDelete(announcementId: number) {
    openModal(
      'Delete Announcement',
      'Are you sure you want to delete this announcement? This cannot be undone.',
      () => executeDelete(announcementId),
    );
  }

  async function executeDelete(announcementId: number) {
    closeModal();
    const token = localStorage.getItem('access_token');
    if (!token) return;

    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_BASE_URL}/announcements/${announcementId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      if (!response.ok) {
        notify(data.message || 'Unable to delete announcement.', true);
        return;
      }

      notify(data.message || 'Announcement deleted.', false);
      await loadAnnouncements(selectedClubId);
    } catch {
      notify('Unable to delete announcement right now.', true);
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Announcements</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Post and manage announcements for clubs you administer.
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
              You need to be an admin or representative of a club to post announcements.
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
              <div className="mb-6">
                <p className="text-sm font-semibold uppercase tracking-wide text-red-600">Create</p>
                <h2 className="mt-1 text-xl font-semibold text-gray-900 dark:text-white">New announcement</h2>
              </div>

              <form className="space-y-5" onSubmit={handleCreate}>
                <div>
                  <label htmlFor="title" className="mb-2 block text-sm font-semibold text-gray-900 dark:text-white">
                    Title
                  </label>
                  <input
                    id="title"
                    name="title"
                    type="text"
                    value={createForm.title}
                    onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                    className={inputClasses}
                    placeholder="Weekly meeting moved"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="body" className="mb-2 block text-sm font-semibold text-gray-900 dark:text-white">
                    Body
                  </label>
                  <textarea
                    id="body"
                    name="body"
                    value={createForm.body}
                    onChange={(e) => setCreateForm({ ...createForm, body: e.target.value })}
                    className={`${inputClasses} min-h-28 resize-y`}
                    placeholder="Share an update with your members."
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-lg bg-red-600 px-5 py-3 font-bold text-white shadow-md transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-gray-400"
                >
                  {isSubmitting ? 'Posting...' : 'Post Announcement'}
                </button>
              </form>
            </section>

            <section className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <div className="mb-5 flex items-end justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wide text-red-600">Posted</p>
                  <h2 className="mt-1 text-xl font-semibold text-gray-900 dark:text-white">Announcements</h2>
                </div>
                <span className="rounded-full bg-gray-100 dark:bg-gray-700 px-3 py-1 text-sm font-semibold text-gray-700 dark:text-gray-300">
                  {announcements.length}
                </span>
              </div>

              {isLoadingAnnouncements ? (
                <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">Loading announcements...</p>
              ) : announcements.length === 0 ? (
                <div className="rounded-lg border border-dashed border-gray-300 dark:border-gray-700 p-8 text-center">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">No announcements yet</h3>
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    Posts for this club will show up here.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {announcements.map((announcement) => (
                    <article
                      key={announcement.announcement_id}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                    >
                      {editingId === announcement.announcement_id ? (
                        <form className="space-y-4" onSubmit={handleUpdate}>
                          <input
                            type="text"
                            value={editForm.title}
                            onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                            className={inputClasses}
                            aria-label="Edit title"
                            required
                          />
                          <textarea
                            value={editForm.body}
                            onChange={(e) => setEditForm({ ...editForm, body: e.target.value })}
                            className={`${inputClasses} min-h-24 resize-y`}
                            aria-label="Edit body"
                            required
                          />
                          <div className="flex items-center gap-3">
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
                          <div className="flex items-start justify-between gap-4">
                            <h3 className="font-semibold text-gray-900 dark:text-white">{announcement.title}</h3>
                            <span className="shrink-0 text-xs font-medium text-gray-500 dark:text-gray-400">
                              {formatTimestamp(announcement.created_at)}
                            </span>
                          </div>
                          <p className="mt-2 whitespace-pre-line text-sm text-gray-600 dark:text-gray-400">
                            {announcement.body}
                          </p>
                          <div className="mt-4 flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => startEditing(announcement)}
                              className="rounded-lg px-3 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(announcement.announcement_id)}
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
      <ConfirmModal
        isOpen={modal.isOpen}
        title={modal.title}
        message={modal.message}
        confirmLabel={modal.title === 'Save Changes' ? 'Save' : 'Delete'}
        onConfirm={modal.onConfirm}
        onCancel={closeModal}
      />
    </div>
  );
}
