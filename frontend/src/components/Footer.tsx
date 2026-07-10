import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <Link href="/" className="flex items-center">
            <Image
              src="/campusconnect-logo.png"
              alt="CampusConnect"
              width={117}
              height={84}
              className="h-10 w-auto object-contain"
            />
          </Link>

          <div className="flex gap-6 text-sm text-gray-600 dark:text-gray-400">
            <a href="#" className="hover:text-gray-900 dark:hover:text-white">Terms of Service</a>
            <a href="#" className="hover:text-gray-900 dark:hover:text-white">Privacy Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
