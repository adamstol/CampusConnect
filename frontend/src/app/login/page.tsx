'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [message, setMessage] = useState('');
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      const response = await fetch('http://localhost:5000/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('access_token', data.access_token);
        router.push('/user-dashboard');
      } else {
        setMessage(data.error || 'Login failed. Please try again.');
      }
    } catch {
      setMessage('An error occurred. Please try again later.');
    }
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
          <Link
            href="/register"
            className="flex-1 py-2 rounded-full font-semibold transition-all text-center text-gray-800 hover:text-gray-900"
          >
            Signup
          </Link>
          <span className="flex-1 py-2 rounded-full font-semibold bg-white text-gray-800 shadow-md text-center">
            Login
          </span>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="block text-sm font-bold mb-2" style={{ color: '#FEB4C1' }}>
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl border-2 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent font-bold"
              style={{ backgroundColor: '#FE3B5E', borderColor: '#FEB4C1', color: 'white' }}
              placeholder="Enter your email"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-bold mb-2" style={{ color: '#FEB4C1' }}>
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl border-2 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent font-bold"
              style={{ backgroundColor: '#FE3B5E', borderColor: '#FEB4C1', color: 'white' }}
              placeholder="Enter your password"
            />
          </div>

          <div className="text-right -mt-2">
            <Link href="/forgot-password" className="text-sm font-semibold" style={{ color: '#FEB4C1' }}>
              Forgot password?
            </Link>
          </div>

          {message && <p className="text-white text-sm font-semibold">{message}</p>}

          <button
            type="submit"
            className="w-full text-white py-3 rounded-xl font-bold hover:opacity-90 transition-opacity shadow-md"
            style={{ backgroundColor: '#FE3B5E' }}
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
}
