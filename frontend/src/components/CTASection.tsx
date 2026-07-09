import React from 'react';
import Link from 'next/link';

export default function CTASection() {
  return (
    <div className="bg-gray-50 dark:bg-gray-800 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
          Events at York University right in your mailbox.
        </h2>
        <Link href="/login">
          <button className="bg-red-600 text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-red-700 transition-colors">
            Join Now
          </button>
        </Link>
      </div>
    </div>
  );
}
