'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import type { Locale } from '@/lib/translations';

interface ThemeContextValue {
  isDark: boolean;
  toggleDark: () => void;
  initThemeForUser: (email: string) => void;
  resetTheme: () => void;
  language: Locale;
  setLanguage: (lang: Locale) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  isDark: false,
  toggleDark: () => {},
  initThemeForUser: () => {},
  resetTheme: () => {},
  language: 'en',
  setLanguage: () => {},
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

  const [language, setLanguageState] = useState<Locale>(() => {
    if (typeof window === 'undefined') return 'en';
    const userKey = localStorage.getItem('currentUser');
    if (userKey) return (localStorage.getItem(`language_${userKey}`) as Locale) ?? 'en';
    return 'en';
  });

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

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

  const setLanguage = (lang: Locale) => {
    setLanguageState(lang);
    if (currentUserKey) localStorage.setItem(`language_${currentUserKey}`, lang);
  };

  // Call this after login to load the user's saved preference
  const initThemeForUser = (email: string) => {
    localStorage.setItem('currentUser', email);
    setCurrentUserKey(email);
    const saved = localStorage.getItem(`darkMode_${email}`) === 'true';
    setIsDark(saved);
    setLanguageState((localStorage.getItem(`language_${email}`) as Locale) ?? 'en');
  };

  // Call this on logout — resets to light mode but preserves the stored preference
  const resetTheme = () => {
    localStorage.removeItem('currentUser');
    setCurrentUserKey(null);
    setIsDark(false);
    setLanguageState('en');
  };

  return (
    <ThemeContext.Provider value={{ isDark, toggleDark, initThemeForUser, resetTheme, language, setLanguage }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
