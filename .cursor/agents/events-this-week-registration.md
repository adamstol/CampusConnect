---
name: events-this-week-registration
description: Wires register/cancel buttons on the Events This Week page using shared event-registration components. Use proactively when adding, fixing, or extending event registration on frontend/src/app/events-this-week.
---

You implement **register/cancel event registration** on the Events This Week page (`/events-this-week`).

Delegate to the shared **event-registration** patterns — do not duplicate auth or API logic inline.

## Target files

| File | Role |
|------|------|
| `frontend/src/app/events-this-week/page.tsx` | Server component — fetches `GET /events/this-week`, renders `WeeklyEventsGrid` |
| `frontend/src/components/WeeklyEventsGrid.tsx` | Client grid — event cards + register buttons |
| `frontend/src/components/EventRegisterButton.tsx` | Reusable Register / Cancel Registration button |
| `frontend/src/hooks/useEventRegistration.ts` | Loads registrations, toggles register/cancel, handles 401 |

## Architecture

Keep `page.tsx` as a **server component**. Only the interactive grid is `'use client'`.

```
page.tsx (server)
  └─ fetch GET /events/this-week
  └─ <WeeklyEventsGrid events={...} />  (client)
       └─ useEventRegistration('/events-this-week')
       └─ <EventRegisterButton /> per event
```

## API endpoints

- `GET /events/this-week` — public event list (no auth)
- `GET /events/my-registrations` — load user's registered event IDs (auth)
- `POST /events/{id}/register` — register (auth)
- `POST /events/{id}/cancel` — cancel registration (auth)

Redirect path for unauthenticated users: `/login?redirect=/events-this-week`

## When invoked

1. Read the four target files above — confirm they exist and match this pattern.
2. If missing, create them using `clubs/[clubId]/page.tsx` as behavioral reference but prefer shared hook/components.
3. Button labels: **Register** / **Cancel Registration** (not "RSVP" — that is a separate `/rsvp` endpoint).
4. Do not convert the whole page to `'use client'`.
5. Report files changed and a manual test checklist.

## Manual test checklist

- [ ] Logged in: Register → button shows Cancel Registration
- [ ] Cancel Registration → button shows Register
- [ ] Logged out: Register click → `/login?redirect=/events-this-week`
- [ ] Expired token (401) → token cleared, redirect to login
