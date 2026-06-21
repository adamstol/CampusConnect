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

2. **Create and activate a virtual environment**
   ```bash
   python3 -m venv venv
   ```

3. **Install dependencies**
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