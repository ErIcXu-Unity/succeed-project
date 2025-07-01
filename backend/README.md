# Escape Room Backend Setup Guide

## Prerequisites

1. Python 3.8+ installed
2. PostgreSQL database (or SQLite for testing)
3. Node.js and npm (for frontend)

## Backend Setup

1. **Install dependencies:**

```bash
cd backend
pip install flask flask-sqlalchemy flask-cors python-dotenv psycopg2-binary werkzeug
```

2. **Create environment file:**
   Create a `.env` file in the `backend` directory:

```env
# For PostgreSQL
DATABASE_URL=postgresql://username:password@localhost:5432/your_database_name

# For SQLite (simpler for testing)
DATABASE_URL=sqlite:///escape_room.db

FLASK_ENV=development
FLASK_DEBUG=True
```

3. **Initialize the database:**

```bash
python init_db.py
```

4. **Run the backend server:**

```bash
python app.py
```

The backend will run on `http://localhost:5000`

## Frontend Setup

1. **Install dependencies:**

```bash
cd ..  # go back to project root
npm install
```

2. **Run the frontend:**

```bash
npm start
```

The frontend will run on `http://localhost:3000`

## Testing the New Features

### 1. Student Registration

1. Go to `http://localhost:3000`
2. Click "Student Register"
3. Fill in the form:
   - Full Name: "John Doe"
   - Student ID: "1234567" (7 digits)
   - Email will auto-generate: "1234567@stu.com"
   - Password: "password123"
   - Confirm Password: "password123"
4. Click Register

### 2. Student Login

1. Click "Student Login"
2. Enter:
   - Username: "1234567@stu.com"
   - Password: "password123"
3. Should redirect to student dashboard

### 3. Teacher Login (Fake for now)

- Teachers still need to be manually added to database
- You can add one through database console or create teacher registration

## Database Tables

After running `init_db.py`, you'll have:

- **students**: Student accounts with actual student_id as string
- **teachers**: Teacher accounts
- **tasks**: 4 sample tasks
- **questions**: Sample questions for tasks 1 & 2
- **achievements**: One achievement per task
- **student_achievements**: Links students to achievements (with redundant fields)
- **student_task_results**: Student task scores (with redundant fields)

## API Endpoints

### Authentication

- `POST /register` - Student registration
- `POST /login` - Student/Teacher login

### Tasks & Questions

- `GET /api/tasks` - Get all tasks
- `GET /api/tasks/<task_id>/questions` - Get questions for a task
- `POST /api/tasks/<task_id>/submit` - Submit task answers

### Reports

- `GET /api/students/<student_id>/achievements` - Get student achievements
- `GET /api/students/<student_id>/results` - Get student task results

## Key Changes Made

1. **Frontend**: Real login/register system replacing fake authentication
2. **Database**: Using actual student_id (string) instead of auto-increment IDs
3. **Redundant Fields**: Added student_name, task_name, achievement_name for better performance
4. **API**: Updated to work with string student_id values

## Troubleshooting

- Make sure PostgreSQL is running and accessible
- Check `.env` file has correct database URL
- Ensure both frontend and backend are running on different ports
- Check browser console for any CORS or network errors
