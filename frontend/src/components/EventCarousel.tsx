'use client';

import React, { useEffect, useState } from 'react';
import EventCard from './EventCard';

export interface CarouselEvent {
  id: number;
  title: string;
  location: string;
  date: string;
  imageUrl?: string;
}

interface EventCarouselProps {
  events: CarouselEvent[];
}

function useVisibleCount() {
  const [count, setCount] = useState(3);
  useEffect(() => {
    function update() {
      if (window.innerWidth < 640) setCount(1);
      else if (window.innerWidth < 1024) setCount(2);
      else setCount(3);
    }
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);
  return count;
}

export default function EventCarousel({ events = [] }: EventCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const visibleCount = useVisibleCount();
  const maxIndex = Math.max(0, events.length - visibleCount);

  // Clamp if visibleCount increases (e.g. resize from mobile to desktop)
  useEffect(() => {
    setCurrentIndex((i) => Math.min(i, maxIndex));
  }, [maxIndex]);

  if (events.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-lg border border-dashed border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-8 text-center">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">No events yet</h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Events added to the database will appear here.</p>
        </div>
      </div>
    );
  }

  const cardWidth = 100 / visibleCount;
  const prev = () => setCurrentIndex((i) => Math.max(0, i - 1));
  const next = () => setCurrentIndex((i) => Math.min(maxIndex, i + 1));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="relative">
        {/* Slider track */}
        <div className="overflow-hidden rounded-xl">
          <div
            className="flex transition-transform duration-300 ease-in-out"
            style={{ transform: `translateX(-${currentIndex * cardWidth}%)` }}
          >
            {events.map((event) => (
              <div
                key={event.id}
                className="shrink-0 px-2"
                style={{ width: `${cardWidth}%` }}
              >
                <EventCard
                  title={event.title}
                  location={event.location}
                  date={event.date}
                  imageUrl={event.imageUrl}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Arrows */}
        {currentIndex > 0 && (
          <button
            onClick={prev}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-2 bg-white dark:bg-gray-800 rounded-full shadow-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Previous"
          >
            <svg className="w-5 h-5 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}
        {currentIndex < maxIndex && (
          <button
            onClick={next}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 p-2 bg-white dark:bg-gray-800 rounded-full shadow-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Next"
          >
            <svg className="w-5 h-5 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>

      {/* Pagination dots — one per possible position */}
      {maxIndex > 0 && (
        <div className="flex justify-center gap-2 mt-6">
          {Array.from({ length: maxIndex + 1 }).map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentIndex ? 'bg-red-600' : 'bg-gray-300 dark:bg-gray-600'
              }`}
              aria-label={`Go to position ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
