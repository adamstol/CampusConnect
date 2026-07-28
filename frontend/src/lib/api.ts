export const API_BASE_URL =
  typeof window === 'undefined'
    ? process.env.BACKEND_API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000'
    : process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';
