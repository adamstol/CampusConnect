'use client';

import React, { useState } from 'react';
import EventCard from './EventCard';

interface Event {
  id: number;
  title: string;
  location: string;
  date: string;
  imageUrl?: string;
}

const sampleEvents: Event[] = [
  {
    id: 1,
    title: "CSHub Larp Show",
    location: "York University - Vari Hall",
    date: "July 15, 2024",
  },
  {
    id: 2,
    title: "Wise James Hunt",
    location: "Student Centre - Room 101",
    date: "July 18, 2024",
  },
  {
    id: 3,
    title: "Bosh Night",
    location: "Athletics Centre",
    date: "July 20, 2024",
  },
  {
    id: 4,
    title: "Lionel Messi Evening",
    location: "York University - Stadium",
    date: "July 22, 2024",
  },
];

export default function EventCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % sampleEvents.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + sampleEvents.length) % sampleEvents.length);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="relative">
        {/* Navigation Arrows */}
        <button
          onClick={prevSlide}
          className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-4 z-10 p-3 bg-white rounded-full shadow-lg hover:bg-gray-100"
        >
          <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button
          onClick={nextSlide}
          className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-4 z-10 p-3 bg-white rounded-full shadow-lg hover:bg-gray-100"
        >
          <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Event Cards */}
        <div className="flex gap-6 overflow-x-auto py-4 px-12">
          {sampleEvents.map((event) => (
            <div key={event.id} className="flex-shrink-0 w-80">
              <EventCard
                title={event.title}
                location={event.location}
                date={event.date}
                imageUrl={event.imageUrl}
              />
            </div>
          ))}
        </div>

        {/* Pagination Dots */}
        <div className="flex justify-center gap-2 mt-6">
          {sampleEvents.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentIndex ? 'bg-red-600' : 'bg-gray-300'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
