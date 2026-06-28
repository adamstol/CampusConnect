# CLAUDE.md

## Project Overview

CampusConnect is a campus club and event management web application for EECS 4314.

The app has three main user roles:

* Student
* Club Representative
* Administrator

Students can browse clubs and events, join clubs, RSVP to events, and receive notifications.

Club representatives can manage their own clubs, create events, manage event RSVPs, and post announcements.

Administrators can approve club applications, moderate content, and manage user accounts.

These guidelines describe the intended project direction, but they should not block reasonable implementation changes when the team intentionally chooses a different approach.

## Tech Stack

Frontend:

* Next.js
* React
* TypeScript
* Tailwind CSS

Backend:

* Python
* Flask
* Flask-SQLAlchemy
* JWT authentication

Database:

* PostgreSQL

Tools and deployment:

* GitHub
* GitHub Actions
* Render
* Vercel
* Postman

## Architecture

Use this general architecture:

```text
Next.js frontend → Flask REST API → PostgreSQL database
```

The frontend should call the backend through REST API endpoints.

The backend should handle authentication, authorization, business logic, and database access.

Keep frontend and backend responsibilities separate. Avoid moving backend business logic into frontend components.

## Role Rules

New users should default to the Student role.

Users should not be able to register themselves as Admin or Club Representative.

Students can only manage their own profile, memberships, and RSVPs.

Club representatives can only manage clubs, events, RSVPs, and announcements related to their own clubs.

Administrators can approve club applications, moderate content, and manage accounts.

## Development Guidelines

When making changes:

* Follow the existing folder structure.
* Make small, focused changes.
* Avoid rewriting unrelated files.
* Use clear REST API endpoints.
* Validate request data.
* Check authentication and authorization before changing data.
* Do not commit secrets, API keys, passwords, database URLs, or JWT secrets.
* Keep the implementation aligned with the project design document.
* Ask before making major architecture changes.

## Notes for Claude

When helping with this repository:

* Prefer practical and readable code.
* Explain what files were changed and why.
* Mention assumptions when project details are unclear.
* Do not invent new technologies unless the team asks for them.
* Do not make large structural changes unless they are clearly needed.
* Keep the project consistent with the CampusConnect design.
