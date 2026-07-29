'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import EventCard from '@/components/EventCard';
import ConfirmModal from '@/components/ConfirmModal';
import { API_BASE_URL } from '@/lib/api';

interface Club {
  club_id: number;
  club_name: string;
  description: string | null;
  logo_url: string | null;
}

interface ClubEvent {
  event_id: number;
  event_name: string;
  description: string | null;
  event_date: string;
  location: string | null;
  image_url: string | null;
}

interface Announcement {
  announcement_id: number;
  title: string;
  body: string;
  created_at: string;
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

function formatAnnouncementDate(date: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(date));
}

export default function ClubDetailPage() {
  const params = useParams<{ clubId: string }>();
  const router = useRouter();
  const [club, setClub] = useState<Club | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [joined, setJoined] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [leaveModalOpen, setLeaveModalOpen] = useState(false);
  const [joinModalOpen, setJoinModalOpen] = useState(false);

  const [events, setEvents] = useState<ClubEvent[]>([]);
  const [isEventsLoading, setIsEventsLoading] = useState(true);
  const [registeredEventIds, setRegisteredEventIds] = useState<Set<number>>(new Set());
  const [rsvpSubmitting, setRsvpSubmitting] = useState<number | null>(null);

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isAnnouncementsLoading, setIsAnnouncementsLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch(`${API_BASE_URL}/clubs/${params.clubId}`)
      .then((res) => {
        if (res.status === 404) {
          setNotFound(true);
          return null;
        }
        return res.ok ? res.json() : Promise.reject();
      })
      .then((data: Club | null) => {
        if (data) {
          setClub(data);
          setLogoUrl(data.logo_url);
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setIsLoading(false));
  }, [params.clubId]);

  useEffect(() => {
    fetch(`${API_BASE_URL}/events/club/${params.clubId}`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data: ClubEvent[]) => setEvents(data))
      .catch(() => setEvents([]))
      .finally(() => setIsEventsLoading(false));
  }, [params.clubId]);

  useEffect(() => {
    fetch(`${API_BASE_URL}/clubs/${params.clubId}/announcements`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data: Announcement[]) => setAnnouncements(data))
      .catch(() => setAnnouncements([]))
      .finally(() => setIsAnnouncementsLoading(false));
  }, [params.clubId]);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) return;

    fetch(`${API_BASE_URL}/clubs/my-clubs`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : []))
      .then((data: { club_id: number }[]) => {
        setJoined(data.some((c) => c.club_id === Number(params.clubId)));
      })
      .catch(() => {});
  }, [params.clubId]);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) return;

    fetch(`${API_BASE_URL}/clubs/my-managed-clubs`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : []))
      .then((data: { club_id: number; role: string }[]) => {
        const managedClub = data.find((item) => item.club_id === Number(params.clubId));
        setUserRole(managedClub ? managedClub.role : null);
      })
      .catch(() => setUserRole(null));
  }, [params.clubId]);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) return;

    fetch(`${API_BASE_URL}/events/my-registrations`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : []))
      .then((data: { event_id: number }[]) => {
        setRegisteredEventIds(new Set(data.map((r) => r.event_id)));
      })
      .catch(() => {});
  }, [params.clubId]);

  async function handleRsvpToggle(eventId: number) {
    const token = localStorage.getItem('access_token');
    if (!token) {
      router.push(`/login?redirect=/clubs/${params.clubId}`);
      return;
    }

    setRsvpSubmitting(eventId);
    const isRegistered = registeredEventIds.has(eventId);
    const endpoint = isRegistered
      ? `${API_BASE_URL}/events/${eventId}/cancel`
      : `${API_BASE_URL}/events/${eventId}/register`;

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setRegisteredEventIds((prev) => {
          const next = new Set(prev);
          if (isRegistered) next.delete(eventId);
          else next.add(eventId);
          return next;
        });
      }
    } catch {
      // Leave state unchanged on network error.
    } finally {
      setRsvpSubmitting(null);
    }
  }

  async function handleLogoUpload(file: File) {
    const token = localStorage.getItem('access_token');
    if (!token) return;

    setIsUploadingLogo(true);

    try {
      const uploadResponse = await fetch(`${API_BASE_URL}/upload/clubs/${params.clubId}/logo`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content_type: file.type }),
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to create upload URL');
      }

      const { upload_url, public_url } = (await uploadResponse.json()) as {
        upload_url: string;
        public_url: string;
      };

      const fileUploadResponse = await fetch(upload_url, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type,
        },
        body: file,
      });

      if (!fileUploadResponse.ok) {
        throw new Error('Failed to upload logo');
      }

      setLogoUrl(public_url);
    } catch {
      // Leave the current logo unchanged on upload failure.
    } finally {
      setIsUploadingLogo(false);
      if (logoInputRef.current) {
        logoInputRef.current.value = '';
      }
    }
  }

  async function handleJoinToggle() {
    const token = localStorage.getItem('access_token');
    if (!token) {
      router.push(`/login?redirect=/clubs/${params.clubId}`);
      return;
    }

    if (joined) {
      setLeaveModalOpen(true);
      return;
    }

    setJoinModalOpen(true);
  }

  async function executeJoinClub() {
    setJoinModalOpen(false);
    const token = localStorage.getItem('access_token');
    if (!token) return;
    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/clubs/${params.clubId}/join`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) setJoined(true);
    } catch {
      // Network error — leave the button in its current state.
    } finally {
      setIsSubmitting(false);
    }
  }

  async function executeLeaveClub() {
    setLeaveModalOpen(false);
    const token = localStorage.getItem('access_token');
    if (!token) return;
    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/clubs/${params.clubId}/leave`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) setJoined(false);
    } catch {
      // Network error — leave the button in its current state.
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <p className="text-gray-600 dark:text-gray-400">Loading club...</p>
        </main>
      </div>
    );
  }

  if (notFound || !club) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Club not found</h1>
          <Link href="/clubs" className="text-red-600 hover:text-red-700 font-medium">
            Back to Clubs
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link
          href="/clubs"
          className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-8"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Clubs
        </Link>

        <div className="flex flex-col md:flex-row gap-8 mb-16">
          <div className="relative w-full md:w-64 h-48 shrink-0 overflow-hidden rounded-lg bg-gray-200 dark:bg-gray-700">
            {logoUrl ? (
              <Image src={logoUrl} alt="club logo" fill className="object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center">
                <svg className="w-16 h-16 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-1.13a4 4 0 100-8 4 4 0 000 8zm6 3.13a4 4 0 00-3-3.87m-9 0a4 4 0 00-3 3.87" />
                </svg>
              </div>
            )}

            {userRole ? (
              <>
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) {
                      void handleLogoUpload(file);
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  disabled={isUploadingLogo}
                  className="absolute bottom-3 right-3 rounded-full bg-black/70 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-black/80 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isUploadingLogo ? 'Uploading...' : logoUrl ? 'Change Logo' : 'Upload Logo'}
                </button>
              </>
            ) : null}
          </div>

          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">{club.club_name}</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">{club.description || 'No description yet.'}</p>

            <button
              onClick={handleJoinToggle}
              disabled={isSubmitting}
              className={
                joined
                  ? 'py-2 px-6 rounded-full font-medium border border-red-600 text-red-600 dark:text-red-400 dark:border-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50'
                  : 'py-2 px-6 rounded-full font-medium bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50'
              }
            >
              {isSubmitting ? '...' : joined ? 'Leave Club' : 'Join Club'}
            </button>
          </div>
        </div>

        <section className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Upcoming Events</h2>
          {isEventsLoading ? (
            <p className="text-gray-600 dark:text-gray-400">Loading events...</p>
          ) : events.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event) => (
                <div key={event.event_id} className="relative">
                  <EventCard
                    title={event.event_name}
                    location={event.location || 'York University'}
                    date={formatEventDate(event.event_date)}
                    imageUrl={event.image_url ?? undefined}
                  />
                  <div className="px-4 pb-4">
                    <button
                      onClick={() => handleRsvpToggle(event.event_id)}
                      disabled={rsvpSubmitting === event.event_id}
                      className={
                        registeredEventIds.has(event.event_id)
                          ? 'w-full rounded-full border border-red-600 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50'
                          : 'w-full rounded-full bg-red-600 py-1.5 text-sm font-medium text-white hover:bg-red-700 transition-colors disabled:opacity-50'
                      }
                    >
                      {rsvpSubmitting === event.event_id
                        ? '...'
                        : registeredEventIds.has(event.event_id)
                          ? 'Cancel RSVP'
                          : 'RSVP'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600 dark:text-gray-400">No upcoming events.</p>
          )}
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Announcements</h2>
          {isAnnouncementsLoading ? (
            <p className="text-gray-600 dark:text-gray-400">Loading announcements...</p>
          ) : announcements.length > 0 ? (
            <div className="space-y-4">
              {announcements.map((announcement) => (
                <div
                  key={announcement.announcement_id}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{announcement.title}</h3>
                    <span className="text-sm text-gray-500 dark:text-gray-400">{formatAnnouncementDate(announcement.created_at)}</span>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">{announcement.body}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600 dark:text-gray-400">No announcements yet.</p>
          )}
        </section>
      </main>
      <ConfirmModal
        isOpen={leaveModalOpen}
        title="Leave Club"
        message={`Are you sure you want to leave ${club.club_name}? You can rejoin at any time.`}
        confirmLabel="Leave Club"
        onConfirm={executeLeaveClub}
        onCancel={() => setLeaveModalOpen(false)}
      />
      <ConfirmModal
        isOpen={joinModalOpen}
        title="Join Club"
        message={`Join ${club.club_name}? You'll receive announcements and can RSVP to events.`}
        confirmLabel="Join Club"
        onConfirm={executeJoinClub}
        onCancel={() => setJoinModalOpen(false)}
      />
    </div>
  );
}