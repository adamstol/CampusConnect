'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

interface ThemeContextValue {
  isDark: boolean;
  toggleDark: () => void;
  initThemeForUser: (email: string) => void;
  resetTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  isDark: false,
  toggleDark: () => {},
  initThemeForUser: () => {},
  resetTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [currentUserKey, setCurrentUserKey] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('currentUser');
  });

  const [isDark, setIsDark] = useState(() => {
    if (typeof window === 'undefined') return false;
    const userKey = localStorage.getItem('currentUser');
    if (userKey) {
      return localStorage.getItem(`darkMode_${userKey}`) === 'true';
    }
    return false;
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const toggleDark = () => {
    setIsDark((prev) => {
      const next = !prev;
      if (currentUserKey) {
        localStorage.setItem(`darkMode_${currentUserKey}`, String(next));
      }
      return next;
    });
  };

  // Call this after login to load the user's saved preference
  const initThemeForUser = (email: string) => {
    localStorage.setItem('currentUser', email);
    setCurrentUserKey(email);
    const saved = localStorage.getItem(`darkMode_${email}`) === 'true';
    setIsDark(saved);
  };

  // Call this on logout — resets to light mode but preserves the stored preference
  const resetTheme = () => {
    localStorage.removeItem('currentUser');
    setCurrentUserKey(null);
    setIsDark(false);
  };

  return (
    <ThemeContext.Provider value={{ isDark, toggleDark, initThemeForUser, resetTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
