'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [isSignup, setIsSignup] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Add actual authentication logic here
    router.push('/user-dashboard');
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center relative">
      {/* Back to Home Link */}
      <Link href="/" className="absolute top-6 left-6 text-gray-600 hover:text-gray-900 flex items-center gap-2">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back to Home
      </Link>

      <div className="rounded-3xl p-10 w-full max-w-md shadow-lg" style={{ backgroundColor: '#FE3B5E' }}>
        {/* Diamond Icon */}
        <div className="flex justify-center mb-8">
          <div className="w-6 h-6 bg-white rotate-45"></div>
        </div>

        {/* Toggle Buttons */}
        <div className="flex mb-8 rounded-full p-1" style={{ backgroundColor: '#FEB4C1' }}>
          <button
            onClick={() => setIsSignup(true)}
            className={`flex-1 py-2 rounded-full font-semibold transition-all ${
              isSignup ? 'bg-white text-gray-800 shadow-md' : 'text-gray-800 hover:text-gray-900'
            }`}
          >
            Signup
          </button>
          <button
            onClick={() => setIsSignup(false)}
            className={`flex-1 py-2 rounded-full font-semibold transition-all ${
              !isSignup ? 'bg-white text-gray-800 shadow-md' : 'text-gray-800 hover:text-gray-900'
            }`}
          >
            Login
          </button>
        </div>

        {/* Form */}
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="username" className="block text-sm font-bold mb-2" style={{ color: '#FEB4C1' }}>
              Username
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border-2 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent font-bold"
              style={{ backgroundColor: '#FE3B5E', borderColor: '#FEB4C1', color: 'white' }}
              placeholder="Enter your username"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-bold mb-2" style={{ color: '#FEB4C1' }}>
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border-2 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent font-bold"
              style={{ backgroundColor: '#FE3B5E', borderColor: '#FEB4C1', color: 'white' }}
              placeholder="Enter your password"
            />
          </div>

          {isSignup && (
            <div>
              <label htmlFor="email" className="block text-sm font-bold mb-2" style={{ color: '#FEB4C1' }}>
                Email
              </label>
              <input
                type="email"
                id="email"
                className="w-full px-4 py-3 rounded-xl border-2 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent font-bold"
                style={{ backgroundColor: '#FE3B5E', borderColor: '#FEB4C1', color: 'white' }}
                placeholder="Enter your email"
              />
            </div>
          )}

          <button
            type="submit"
            className="w-full text-white py-3 rounded-xl font-bold hover:opacity-90 transition-opacity shadow-md"
            style={{ backgroundColor: '#FE3B5E' }}
          >
            {isSignup ? 'Sign Up' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}
