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