'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { API_BASE_URL } from '@/lib/api';

export function useEventRegistration(redirectPath: string) {
  const router = useRouter();
  const [registeredEventIds, setRegisteredEventIds] = useState<Set<number>>(new Set());
  const [submittingEventId, setSubmittingEventId] = useState<number | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) return;

    fetch(`${API_BASE_URL}/events/my-registrations`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (res.status === 401) {
          localStorage.removeItem('access_token');
          router.push(`/login?redirect=${redirectPath}`);
          return [];
        }
        return res.ok ? res.json() : [];
      })
      .then((data: { event_id: number }[]) => {
        setRegisteredEventIds(new Set(data.map((r) => r.event_id)));
      })
      .catch(() => {});
  }, [redirectPath, router]);

  const toggleRegistration = useCallback(
    async (eventId: number) => {
      const token = localStorage.getItem('access_token');
      if (!token) {
        router.push(`/login?redirect=${redirectPath}`);
        return;
      }

      setSubmittingEventId(eventId);
      const isRegistered = registeredEventIds.has(eventId);
      const endpoint = isRegistered
        ? `${API_BASE_URL}/events/${eventId}/cancel`
        : `${API_BASE_URL}/events/${eventId}/register`;

      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.status === 401) {
          localStorage.removeItem('access_token');
          router.push(`/login?redirect=${redirectPath}`);
          return;
        }
        if (res.ok) {
          setRegisteredEventIds((prev) => {
            const next = new Set(prev);
            if (isRegistered) next.delete(eventId);
            else next.add(eventId);
            return next;
          });
        }
      } catch {
        // Leave state unchanged on network error.
      } finally {
        setSubmittingEventId(null);
      }
    },
    [registeredEventIds, redirectPath, router],
  );

  return { registeredEventIds, submittingEventId, toggleRegistration };
}
