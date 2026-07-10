'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ClubCard from '@/components/ClubCard';

interface Club {
  id: number;
  name: string;
  description: string;
  category: string;
  location: string;
}

const clubs: Club[] = [
  {
    id: 1,
    name: 'CS Hub',
    description: 'A community for computer science students to collaborate, learn new technologies, and build projects together.',
    category: 'Technology',
    location: 'Lassonde Building',
  },
  {
    id: 2,
    name: 'York Debate Society',
    description: 'Sharpen your public speaking and critical thinking skills through weekly debates and tournaments.',
    category: 'Academic',
    location: 'Vari Hall',
  },
  {
    id: 3,
    name: 'YU Basketball Club',
    description: 'Casual and competitive basketball games, open to players of all skill levels every week.',
    category: 'Sports',
    location: 'Athletics Centre',
  },
  {
    id: 4,
    name: 'Cultural Fusion',
    description: 'Celebrating diversity on campus through cultural showcases, food events, and international nights.',
    category: 'Cultural',
    location: 'Student Centre',
  },
  {
    id: 5,
    name: 'Business Network Club',
    description: 'Connect with peers and industry professionals through networking events and case competitions.',
    category: 'Business',
    location: 'Schulich School of Business',
  },
  {
    id: 6,
    name: 'York Filmmakers Guild',
    description: 'Write, shoot, and edit short films together, with screenings held at the end of each semester.',
    category: 'Arts',
    location: 'Accolade Building',
  },
  {
    id: 7,
    name: 'Game Dev Collective',
    description: 'Design and build games in game jams, workshops, and collaborative projects with fellow students.',
    category: 'Technology',
    location: 'Bergeron Centre',
  },
  {
    id: 8,
    name: 'Campus Volunteers Network',
    description: 'Organize and take part in community service projects both on campus and around Toronto.',
    category: 'Volunteering',
    location: 'Student Centre',
  },
];

export default function ClubsPage() {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredClubs = clubs.filter((club) =>
    club.name.toLowerCase().includes(searchQuery.toLowerCase())
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

        {filteredClubs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredClubs.map((club) => (
              <ClubCard
                key={club.id}
                name={club.name}
                description={club.description}
                category={club.category}
                location={club.location}
              />
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-600 dark:text-gray-400">
            No clubs found matching &quot;{searchQuery}&quot;.
          </p>
        )}
      </main>
      <Footer />
    </div>
  );
}
