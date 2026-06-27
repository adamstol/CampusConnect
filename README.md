# CampusConnect

## Backend Setup

### Prerequisites
- Python 3 or higher
- PostgreSQL

### Steps

1. **Navigate to the backend directory**
   ```bash
   cd backend
   ```

2. **Create a virtual environment**

   - **macOS / Linux:**
     ```bash
     python3 -m venv .venv
     ```
   - **Windows:**
     ```bash
     python -m venv .venv
     ```

3. **Activate the virtual environment**

   - **macOS / Linux:**
     ```bash
     source .venv/bin/activate
     ```
   - **Windows (Command Prompt):**
     ```cmd
     .venv\Scripts\activate
     ```
   - **Windows (PowerShell):**
     ```powershell
     .\.venv\Scripts\Activate.ps1
     ```

4. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment variables**

   Create a `.env` file in the `backend/` directory:
   ```env
   DATABASE_URL=postgresql://<user>:<password>@localhost:5432/<dbname>
   ```

5. **Run the development server**
   ```bash
   python main.py
   ```

   The API will be available at `http://localhost:5000`, also known as 'http://127.0.0.1:5000'.

## Endpoints

### Auth Endpoints

- `POST /auth/register` — register a new user with first name, last name, email, and password; returns an email verification token
- `GET /auth/verify-email?token={token}` — verify the user's email using the token received at registration
- `POST /auth/login` — log in with email and password; returns a JWT access token; locks the account after 3 failed attempts
- `PATCH /auth/profile` — *(Bearer Token required)* update the authenticated user's first name, last name, email, and/or password
- `GET /auth/status` — *(Bearer Token required)* return the authenticated user's account status (email verified, account enabled, account locked)
- `POST /auth/request-password-reset` — generate a password reset token for the given email address
- `POST /auth/reset-password` — reset the user's password using a valid reset token; unlocks the account if it was locked
- `DELETE /auth/delete` — *(Bearer Token required)* permanently delete the authenticated user's account

### Club Endpoints

- `POST /clubs/` — *(Bearer Token required)* create a new club with a name and optional description; the authenticated user is automatically added as a member
- `GET /clubs/` — *(Bearer Token required)* return a list of all clubs
- `GET /clubs/{club_id}` — *(Bearer Token required)* return details of a specific club by ID
- `PATCH /clubs/{club_id}` — *(Bearer Token required)* update a club's name and/or description; only accessible to members of the club
- `DELETE /clubs/{club_id}` — *(Bearer Token required)* permanently delete a club; only accessible to members of the club
- `POST /clubs/{club_id}/join` — *(Bearer Token required)* join the specified club as a member
- `POST /clubs/{club_id}/leave` — *(Bearer Token required)* leave the specified club
- `GET /clubs/{club_id}/members` — *(Bearer Token required)* return a list of all members of the specified club
- `GET /clubs/my-clubs` — *(Bearer Token required)* return all clubs the authenticated user is a member of
- `GET /clubs/my-managed-clubs` — *(Bearer Token required)* return all clubs the authenticated user created/manages

### Event Endpoints

- `POST /events/` — *(Bearer Token required)* create a new event for a club with club_id, event_name, and event_date (description and location optional); only accessible to the club's admin or representative
- `GET /events/` — *(Bearer Token required)* return a list of all events
- `GET /events/{event_id}` — *(Bearer Token required)* return details of a specific event by ID
- `PATCH /events/{event_id}` — *(Bearer Token required)* update an event's name, description, date, and/or location; only accessible to the club's admin or representative
- `DELETE /events/{event_id}` — *(Bearer Token required)* permanently delete an event; only accessible to the club's admin or representative
- `GET /events/club/{club_id}` — *(Bearer Token required)* return all events belonging to the specified club
- `POST /events/{event_id}/register` — *(Bearer Token required)* register the authenticated user for the specified event
- `POST /events/{event_id}/cancel` — *(Bearer Token required)* cancel the authenticated user's registration for the specified event
- `POST /events/{event_id}/rsvp` — *(Bearer Token required)* set or update the authenticated user's RSVP for the event; body `{ "status": "attending" | "not_attending" | "maybe" }`
- `GET /events/{event_id}/attendees` — *(Bearer Token required)* return a list of all users registered for the event; only accessible to the club's admin or representative
- `GET /events/{event_id}/registration-count` — *(Bearer Token required)* return the number of users registered for the event, broken down by RSVP status (attending, not_attending, maybe, total)
- `GET /events/my-events` — *(Bearer Token required)* return all events the authenticated user has RSVP'd to; optional `?status=` query param filters by RSVP status (e.g. `?status=attending`)
- `GET /events/my-events/count` — *(Bearer Token required)* return how many events the authenticated user has RSVP'd to, broken down by status

## Frontend Setup

### Prerequisites
- Node.js 18+
- npm

### Steps

1. **Navigate to the frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run the development server**
   ```bash
   npm run dev
   ```

   The app will be available at `http://localhost:3000`.