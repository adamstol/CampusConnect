'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      const response = await fetch(`${apiUrl}/auth/request-password-reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setSubmitted(true);
        setMessage(data.message || 'If an account exists for that email, a reset link has been sent.');
      } else {
        setMessage(data.message || 'Something went wrong. Please try again.');
      }
    } catch {
      setMessage('An error occurred. Please try again later.');
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center relative">
      {/* Back to Login Link */}
      <Link href="/login" className="absolute top-6 left-6 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white flex items-center gap-2">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back to Login
      </Link>

      <div className="rounded-3xl p-10 w-full max-w-md shadow-lg bg-[#FE3B5E] dark:bg-[#b5203c]">
        {/* Diamond Icon */}
        <div className="flex justify-center mb-8">
          <div className="w-6 h-6 bg-white rotate-45"></div>
        </div>

        {/* Title */}
        <div className="mb-8 text-center">
          <h1 className="text-white text-2xl font-bold mb-2">Forgot Password</h1>
          <p className="text-sm font-semibold" style={{ color: '#FEB4C1' }}>
            Enter your email and we&apos;ll send you a reset link.
          </p>
        </div>

        {submitted ? (
          <div className="text-center space-y-6">
            <p className="text-white text-sm font-semibold">{message}</p>
            <Link
              href="/reset-password"
              className="block w-full text-center text-white py-3 rounded-xl font-bold hover:opacity-90 transition-opacity shadow-md"
              style={{ border: '2px solid #FEB4C1' }}
            >
              Reset My Password
            </Link>
            <Link
              href="/login"
              className="block w-full text-center text-white py-3 rounded-xl font-bold hover:opacity-90 transition-opacity shadow-md"
              style={{ border: '2px solid #FEB4C1' }}
            >
              Back to Login
            </Link>
          </div>
        ) : (
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-bold mb-2" style={{ color: '#FEB4C1' }}>
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border-2 bg-[#FE3B5E] dark:bg-[#b5203c] border-[#FEB4C1] dark:border-[#c9707f] text-white focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent font-bold"
                placeholder="Enter your email"
              />
            </div>

            {message && <p className="text-white text-sm font-semibold">{message}</p>}

            <button
              type="submit"
              className="w-full text-white py-3 rounded-xl font-bold hover:opacity-90 transition-opacity shadow-md bg-[#FE3B5E] dark:bg-[#b5203c] border-2 border-[#FEB4C1] dark:border-[#c9707f]"
            >
              Send Reset Link
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
