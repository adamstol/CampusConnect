'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/context/ThemeContext';

const userEvents = [
  {
    id: 1,
    title: "CSHub Larp Show",
    location: "York University - Vari Hall",
    date: "July 15, 2024",
    status: "Registered",
  },
  {
    id: 2,
    title: "Tech Talk Series",
    location: "Bergeron Centre",
    date: "July 19, 2024",
    status: "Interested",
  },
];

export default function UserDashboardPage() {
  const router = useRouter();
  const { isDark, toggleDark, resetTheme } = useTheme();
  const [firstName, setFirstName] = useState<string>('');
  const [lastName, setLastName] = useState<string>('');

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) return;
    fetch('http://localhost:5000/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.first_name) setFirstName(data.first_name);
        if (data?.last_name) setLastName(data.last_name);
      })
      .catch(() => {});
  }, []);

  const [settings, setSettings] = useState({
    notifications: true,
    emailUpdates: true,
    eventReminders: true,
    publicProfile: false,
    language: 'en',
  });

  const toggleSetting = (key: string) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key as keyof typeof prev] }));
  };

  const handleSignOut = () => {
    localStorage.removeItem('access_token');
    resetTheme();
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-red-600 rounded flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                </svg>
              </div>
              <span className="text-xl font-semibold text-gray-900 dark:text-white">CampusConnect</span>
            </Link>
            
            <div className="flex items-center gap-4">
              <div
                className="flex items-center justify-center w-9 h-9 rounded-full text-white text-sm font-bold"
                style={{ backgroundColor: '#FE3B5E' }}
              >
                {firstName && lastName ? `${firstName[0]}${lastName[0]}`.toUpperCase() : ''}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Welcome back, {firstName}!</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Here&apos;s what&apos;s happening with your account</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Your Current Events */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Your current events</h2>
              <div className="space-y-4">
                {userEvents.map((event) => (
                  <div key={event.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">{event.title}</h3>
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-sm mt-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span>{event.location}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-sm mt-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span>{event.date}</span>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        event.status === 'Registered' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {event.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              
              <Link href="/events-this-week">
                <button className="mt-4 text-red-600 hover:text-red-700 font-medium">
                  Browse more events →
                </button>
              </Link>
            </div>
          </div>

          {/* Settings */}
          <div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Settings</h2>
              
              <div className="space-y-6">
                {/* Notifications */}
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">Notifications</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Receive push notifications</p>
                  </div>
                  <button
                    onClick={() => toggleSetting('notifications')}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      settings.notifications ? 'bg-red-600' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                      settings.notifications ? 'translate-x-6' : 'translate-x-0.5'
                    }`} />
                  </button>
                </div>

                {/* Email Updates */}
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">Email Updates</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Weekly event digest</p>
                  </div>
                  <button
                    onClick={() => toggleSetting('emailUpdates')}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      settings.emailUpdates ? 'bg-red-600' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                      settings.emailUpdates ? 'translate-x-6' : 'translate-x-0.5'
                    }`} />
                  </button>
                </div>

                {/* Event Reminders */}
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">Event Reminders</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Remind before events</p>
                  </div>
                  <button
                    onClick={() => toggleSetting('eventReminders')}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      settings.eventReminders ? 'bg-red-600' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                      settings.eventReminders ? 'translate-x-6' : 'translate-x-0.5'
                    }`} />
                  </button>
                </div>

                {/* Public Profile */}
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">Public Profile</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Make profile visible</p>
                  </div>
                  <button
                    onClick={() => toggleSetting('publicProfile')}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      settings.publicProfile ? 'bg-red-600' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                      settings.publicProfile ? 'translate-x-6' : 'translate-x-0.5'
                    }`} />
                  </button>
                </div>

                {/* Dark Mode */}
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">Dark Mode</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Switch to dark theme</p>
                  </div>
                  <button
                    onClick={toggleDark}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      isDark ? 'bg-red-600' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                      isDark ? 'translate-x-6' : 'translate-x-0.5'
                    }`} />
                  </button>
                </div>

                {/* Language */}
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white mb-2">Language</h3>
                  <select
                    value={settings.language}
                    onChange={(e) => setSettings(prev => ({ ...prev, language: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 text-black dark:text-white dark:bg-gray-700"
                  >
                    <option value="en">English</option>
                    <option value="es">Español</option>
                    <option value="fr">Français</option>
                    <option value="de">Deutsch</option>
                    <option value="zh">中文</option>
                  </select>
                </div>

                {/* Account Actions */}
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
                  <button className="w-full text-left px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                    Edit Profile
                  </button>
                  <button className="w-full text-left px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                    Change Password
                  </button>
                  <button onClick={handleSignOut} className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
