'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import EventCard from '@/components/EventCard';
import { API_BASE_URL } from '@/lib/api';

interface Club {
  club_id: number;
  club_name: string;
  description: string | null;
}

interface ClubEvent {
  id: number;
  title: string;
  location: string;
  date: string;
}

interface Announcement {
  id: number;
  title: string;
  date: string;
  body: string;
}

const upcomingEvents: ClubEvent[] = [
  { id: 1, title: 'General Meeting', location: 'Student Centre - Room 204', date: 'July 18, 2026' },
  { id: 2, title: 'New Member Social', location: 'Vari Hall', date: 'July 25, 2026' },
  { id: 3, title: 'Workshop Night', location: 'Bergeron Centre', date: 'August 1, 2026' },
];

const announcements: Announcement[] = [
  {
    id: 1,
    title: 'Welcome back for the summer term!',
    date: 'July 5, 2026',
    body: "We're kicking off summer term with a general meeting. Come say hi and find out what we have planned this season.",
  },
  {
    id: 2,
    title: 'Executive applications now open',
    date: 'June 28, 2026',
    body: 'Interested in joining the executive team? Applications are open until the end of the month, reach out for details.',
  },
];

export default function ClubDetailPage() {
  const params = useParams<{ clubId: string }>();
  const [club, setClub] = useState<Club | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [joined, setJoined] = useState(false);

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
        if (data) setClub(data);
      })
      .catch(() => setNotFound(true))
      .finally(() => setIsLoading(false));
  }, [params.clubId]);

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
          <div className="w-full md:w-64 h-48 shrink-0 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
            <svg className="w-16 h-16 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-1.13a4 4 0 100-8 4 4 0 000 8zm6 3.13a4 4 0 00-3-3.87m-9 0a4 4 0 00-3 3.87" />
            </svg>
          </div>

          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">{club.club_name}</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">{club.description || 'No description yet.'}</p>

            <button
              onClick={() => setJoined((prev) => !prev)}
              className={
                joined
                  ? 'py-2 px-6 rounded-full font-medium border border-red-600 text-red-600 dark:text-red-400 dark:border-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors'
                  : 'py-2 px-6 rounded-full font-medium bg-red-600 text-white hover:bg-red-700 transition-colors'
              }
            >
              {joined ? 'Leave Club' : 'Join Club'}
            </button>
          </div>
        </div>

        <section className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Upcoming Events</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {upcomingEvents.map((event) => (
              <EventCard key={event.id} title={event.title} location={event.location} date={event.date} />
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Announcements</h2>
          <div className="space-y-4">
            {announcements.map((announcement) => (
              <div
                key={announcement.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{announcement.title}</h3>
                  <span className="text-sm text-gray-500 dark:text-gray-400">{announcement.date}</span>
                </div>
                <p className="text-gray-600 dark:text-gray-400 text-sm">{announcement.body}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
