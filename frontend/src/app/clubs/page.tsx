'use client';

import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import ClubCard from '@/components/ClubCard';
import { API_BASE_URL } from '@/lib/api';

interface Club {
  club_id: number;
  club_name: string;
  description: string | null;
  logo_url: string | null;
}

export default function ClubsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [clubs, setClubs] = useState<Club[]>([]);
  const [joinedClubIds, setJoinedClubIds] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`${API_BASE_URL}/clubs/`)
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data: Club[]) => setClubs(data))
      .catch(() => setError('Unable to load clubs right now. Please try again later.'))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) return;

    fetch(`${API_BASE_URL}/clubs/my-clubs`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : []))
      .then((data: { club_id: number }[]) => setJoinedClubIds(new Set(data.map((c) => c.club_id))))
      .catch(() => {});
  }, []);

  const filteredClubs = clubs.filter((club) =>
    club.club_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Explore Clubs at York University
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Find a community that matches your interests and get involved on campus
          </p>
        </div>

        <div className="max-w-md mx-auto mb-10">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search clubs by name"
              className="w-full pl-4 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-full bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
            <svg className="w-5 h-5 text-red-600 absolute right-3 top-1/2 transform -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {isLoading ? (
          <p className="text-center text-gray-600 dark:text-gray-400">Loading clubs...</p>
        ) : error ? (
          <p className="text-center text-red-600 dark:text-red-400">{error}</p>
        ) : filteredClubs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredClubs.map((club) => (
              <ClubCard
                key={club.club_id}
                id={club.club_id}
                name={club.club_name}
                description={club.description || 'No description yet.'}
                logoUrl={club.logo_url}
                initialJoined={joinedClubIds.has(club.club_id)}
              />
            ))}
          </div>
        ) : clubs.length === 0 ? (
          <p className="text-center text-gray-600 dark:text-gray-400">
            No clubs available yet.
          </p>
        ) : (
          <p className="text-center text-gray-600 dark:text-gray-400">
            No clubs found matching &quot;{searchQuery}&quot;.
          </p>
        )}
      </main>
    </div>
  );
}

