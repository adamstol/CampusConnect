'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [message, setMessage] = useState('');
  const [registered, setRegistered] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      setMessage('Passwords do not match.');
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setRegistered(true);
        setMessage(data.message || 'Registration successful! Please verify your email.');
      } else {
        setMessage(data.message || 'Registration failed. Please try again.');
      }
    } catch {
      setMessage('An error occurred. Please try again later.');
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center relative">
      {/* Back to Home Link */}
      <Link href="/" className="absolute top-6 left-6 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white flex items-center gap-2">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back to Home
      </Link>

      <div className="rounded-3xl p-10 w-full max-w-md shadow-lg bg-[#FE3B5E] dark:bg-[#b5203c]">
        {/* Diamond Icon */}
        <div className="flex justify-center mb-8">
          <div className="w-6 h-6 bg-white rotate-45"></div>
        </div>

        {/* Toggle Buttons */}
        <div className="flex mb-8 rounded-full p-1 bg-[#FEB4C1] dark:bg-[#c9707f]">
          <span className="flex-1 py-2 rounded-full font-semibold bg-white text-gray-800 shadow-md text-center">
            Signup
          </span>
          <Link
            href="/login"
            className="flex-1 py-2 rounded-full font-semibold transition-all text-center text-gray-800 hover:text-gray-900"
          >
            Login
          </Link>
        </div>

        {registered ? (
          <div className="text-center space-y-6">
            <p className="text-white text-sm font-semibold">{message}</p>
            <Link
              href="/verify-email"
              className="block w-full text-center text-white py-3 rounded-xl font-bold hover:opacity-90 transition-opacity shadow-md"
              style={{ border: '2px solid #FEB4C1' }}
            >
              Verify My Email
            </Link>
          </div>
        ) : (
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="firstName" className="block text-sm font-bold mb-2" style={{ color: '#FEB4C1' }}>
              First Name
            </label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl border-2 bg-[#FE3B5E] dark:bg-[#b5203c] border-[#FEB4C1] dark:border-[#c9707f] text-white focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent font-bold"
              placeholder="Enter your first name"
            />
          </div>

          <div>
            <label htmlFor="lastName" className="block text-sm font-bold mb-2" style={{ color: '#FEB4C1' }}>
              Last Name
            </label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl border-2 bg-[#FE3B5E] dark:bg-[#b5203c] border-[#FEB4C1] dark:border-[#c9707f] text-white focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent font-bold"
              placeholder="Enter your last name"
            />
          </div>

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
              className="w-full px-4 py-3 rounded-xl border-2 bg-[#FE3B5E] dark:bg-[#b5203c] border-[#FEB4C1] dark:border-[#c9707f] text-white focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent font-bold"
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
              className="w-full px-4 py-3 rounded-xl border-2 bg-[#FE3B5E] dark:bg-[#b5203c] border-[#FEB4C1] dark:border-[#c9707f] text-white focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent font-bold"
              placeholder="Enter your password"
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-bold mb-2" style={{ color: '#FEB4C1' }}>
              Confirm Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl border-2 bg-[#FE3B5E] dark:bg-[#b5203c] border-[#FEB4C1] dark:border-[#c9707f] text-white focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent font-bold"
              placeholder="Confirm your password"
            />
          </div>

          {message && <p className="text-white text-sm font-semibold">{message}</p>}

          <button
            type="submit"
            className="w-full text-white py-3 rounded-xl font-bold hover:opacity-90 transition-opacity shadow-md bg-[#FE3B5E] dark:bg-[#b5203c]"
          >
            Sign Up
          </button>
        </form>
        )}
      </div>
    </div>
  );
}
