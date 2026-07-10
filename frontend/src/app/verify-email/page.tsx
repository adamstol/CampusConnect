'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function VerifyEmailPage() {
  const [token, setToken] = useState('');
  const [message, setMessage] = useState('');
  const [verified, setVerified] = useState(false);
  const router = useRouter();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    try {
      const response = await fetch(
        `${apiUrl}/auth/verify-email?token=${encodeURIComponent(token.trim())}`,
        { method: 'GET' }
      );

      const data = await response.json();

      if (response.ok) {
        setVerified(true);
        setMessage(data.message || 'Email verified successfully!');
        setTimeout(() => router.push('/login'), 3000);
      } else {
        setMessage(data.message || 'Verification failed. Please try again.');
      }
    } catch {
      setMessage('An error occurred. Please try again later.');
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center relative">
      {/* Back to Login Link */}
      <Link href="/login" className="absolute top-6 left-6 text-gray-600 hover:text-gray-900 flex items-center gap-2">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back to Login
      </Link>

      <div className="rounded-3xl p-10 w-full max-w-md shadow-lg bg-[#FE3B5E]">
        {/* Diamond Icon */}
        <div className="flex justify-center mb-8">
          <div className="w-6 h-6 bg-white rotate-45"></div>
        </div>

        {/* Title */}
        <div className="mb-8 text-center">
          <h1 className="text-white text-2xl font-bold mb-2">Verify Your Email</h1>
          <p className="text-sm font-semibold" style={{ color: '#FEB4C1' }}>
            Paste the verification token from the email we sent you.
          </p>
        </div>

        {verified ? (
          <div className="text-center space-y-6">
            <p className="text-white text-sm font-semibold">{message}</p>
            <p className="text-sm font-semibold" style={{ color: '#FEB4C1' }}>
              Redirecting you to login...
            </p>
            <Link
              href="/login"
              className="block w-full text-center text-white py-3 rounded-xl font-bold hover:opacity-90 transition-opacity shadow-md"
              style={{ border: '2px solid #FEB4C1' }}
            >
              Go to Login
            </Link>
          </div>
        ) : (
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="token" className="block text-sm font-bold mb-2" style={{ color: '#FEB4C1' }}>
                Verification Token
              </label>
              <input
                type="text"
                id="token"
                name="token"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border-2 bg-[#FE3B5E] border-[#FEB4C1] text-white focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent font-bold"
                placeholder="Paste your token here"
              />
            </div>

            {message && <p className="text-white text-sm font-semibold">{message}</p>}

            <button
              type="submit"
              className="w-full text-white py-3 rounded-xl font-bold hover:opacity-90 transition-opacity shadow-md"
              style={{ border: '2px solid #FEB4C1' }}
            >
              Verify Email
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
