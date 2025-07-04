# UNSW Escape Room Educational Platform

A full-stack web application for creating and managing educational escape room games at the University of New South Wales (UNSW). This platform allows teachers to create interactive escape room challenges and students to participate in gamified learning activities.

## Features

### For Teachers
- **Dashboard Management**: Overview of all escape room games and student progress
- **Game Creation**: Create and edit escape room scenarios with puzzles and challenges
- **Question Management**: Add, edit, and organize quiz questions with image support
- **Student Analytics**: View detailed performance metrics and completion rates
- **Achievement System**: Monitor student achievements and badges
- **Class Management**: Organize students and monitor their participation

### For Students
- **Interactive Gameplay**: Participate in escape room challenges designed for learning
- **Achievement System**: Earn badges and track progress through completed tasks
- **Real-time Progress**: Save and resume progress on incomplete tasks
- **Performance Tracking**: View personal statistics and improvement over time
- **Network Resilience**: Smart error handling with automatic retry mechanisms

## Technology Stack

### Frontend
- **Framework**: React 18, JavaScript ES6+
- **Styling**: CSS3 with CSS Variables
- **State Management**: React Hooks (useState, useEffect)
- **Routing**: React Router
- **HTTP Client**: Fetch API with advanced error handling

### Backend
- **Framework**: Flask (Python)
- **Database**: PostgreSQL with SQLAlchemy ORM
- **API**: RESTful APIs with CORS support
- **Authentication**: Session-based authentication
- **File Upload**: Image handling for questions

### Database
- **Primary Database**: PostgreSQL
- **ORM**: SQLAlchemy
- **Features**: Automatic schema creation, data relationships, timezone support

## Project Structure

```
capstone-project-25t2-9900-h18b-donut/
├── backend/                     # Flask backend
│   ├── app.py                  # Main Flask application
│   ├── requirements.txt        # Python dependencies
│   ├── .env                    # Environment variables (create this)
│   ├── test_api.py            # API testing script
│   └── uploads/               # File upload directory
├── src/                        # React frontend
│   ├── components/            # React components
│   │   ├── Login.jsx         # Authentication
│   │   ├── StudentDashboard.jsx
│   │   ├── StudentAchievements.jsx
│   │   ├── TaskQuiz.jsx      # Main quiz interface
│   │   ├── TeacherDashboard.jsx
│   │   ├── TaskEditor.jsx    # Question management
│   │   └── ...
│   ├── App.jsx               # Main React app
│   └── index.js              # Entry point
├── public/
│   ├── index.html
│   └── assets/               # Static assets
├── package.json              # Node.js dependencies
└── README.md
```

## Prerequisites

Before running this project, ensure you have:

- **Node.js** (version 16 or higher)
- **Python** (version 3.8 or higher)
- **PostgreSQL** (version 12 or higher)
- **npm** or **yarn** package manager
- **pip** (Python package installer)

## Installation & Setup

### 1. Database Setup (PostgreSQL)

1. **Install PostgreSQL** if not already installed
2. **Create the database**:
   ```sql
   -- Connect to PostgreSQL as superuser
   CREATE DATABASE "test-project";
   ```
3. **Note your PostgreSQL credentials**:
   - Host: `localhost`
   - Port: `5432`
   - Database: `test-project`
   - Username: `postgres` (or your PostgreSQL username)
   - Password: (your PostgreSQL password)

### 2. Backend Setup (Flask)

1. **Navigate to backend directory**:
   ```bash
   cd backend
   ```

2. **Create and activate virtual environment** (recommended):
   ```bash
   # Create virtual environment
   python -m venv venv
   
   # Activate virtual environment
   # On Windows:
   venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   ```

3. **Install Python dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

   Required packages include:
   - `Flask>=2.0.0` - Web framework
   - `Flask-SQLAlchemy>=2.5.1` - Database ORM
   - `Flask-CORS>=3.0.10` - Cross-origin requests
   - `python-dotenv>=0.19.0` - Environment variables
   - `Werkzeug>=2.0.0` - WSGI utilities
   - `psycopg2-binary>=2.9.0` - PostgreSQL driver

4. **Create environment configuration**:
   Create a `.env` file in the `backend/` directory:
   ```env
   DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/test-project
   ```
   Replace `YOUR_PASSWORD` with your actual PostgreSQL password.

5. **Test the backend setup**:
   ```bash
   python test_api.py
   ```

6. **Start the Flask server**:
   ```bash
   python app.py
   ```

   Expected output:
   ```
   * Running on http://127.0.0.1:5000
   * Debug mode: on
   All tables recreated, default teacher accounts and escape room tasks ensured.
   ```

### 3. Frontend Setup (React)

1. **Navigate to project root directory**:
   ```bash
   cd ..  # Back to project root
   ```

2. **Install Node.js dependencies**:
   ```bash
   npm install
   ```

3. **Start the React development server**:
   ```bash
   npm start
   ```

   Expected output:
   ```
   webpack compiled with warnings
   Local:            http://localhost:3000
   ```

## Running the Application

### Development Mode

1. **Start PostgreSQL** service on your system

2. **Run Backend** (Terminal 1):
   ```bash
   cd backend
   venv\Scripts\activate  # Windows
   # source venv/bin/activate  # macOS/Linux
   python app.py
   ```

3. **Run Frontend** (Terminal 2):
   ```bash
   npm start
   ```

4. **Access the application**:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

### Testing the Setup

1. **Backend API Test**:
   ```bash
   cd backend
   python test_api.py
   ```

2. **Verify endpoints**:
   - Tasks API: http://localhost:5000/api/tasks
   - Should return JSON with task list

3. **Frontend verification**:
   - Visit: http://localhost:3000
   - Should show login page

### Default Accounts

The application comes with pre-seeded accounts:

**Teacher Accounts**:
- Username: `st1000@tea.com`, Password: `123456`
- Username: `st1001@tea.com`, Password: `123456`

**Student Accounts**: Register new accounts through the registration page.

## Development Workflow

### VS Code Setup
1. Open project folder in VS Code
2. Install recommended extensions:
   - Python
   - ES7+ React/Redux/React-Native snippets
   - PostgreSQL (by Chris Kolkman)

3. Use split terminal for running both frontend and backend

### Making Changes
- **Backend changes**: Flask auto-reloads (debug=True)
- **Frontend changes**: React hot-reloads automatically
- **Database changes**: Modify models in `app.py`, restart Flask

### Troubleshooting

**Common Issues**:

1. **Port already in use**:
   ```bash
   # Check what's using port 5000
   netstat -ano | findstr :5000
   # Kill the process if needed
   taskkill /PID <process_id> /F
   ```

2. **Database connection failed**:
   - Verify PostgreSQL is running
   - Check credentials in `.env` file
   - Ensure database `test-project` exists

3. **Module not found errors**:
   ```bash
   # Reinstall dependencies
   pip install -r requirements.txt
   npm install
   ```

4. **CORS errors**:
   - Ensure backend is running on port 5000
   - Check Flask-CORS configuration in `app.py`

## API Documentation

### Authentication Endpoints
- `POST /login` - User authentication
- `POST /register` - User registration

### Task Management
- `GET /api/tasks` - List all tasks
- `GET /api/tasks/<id>` - Get task details
- `POST /api/tasks/<id>/submit` - Submit task answers

### Student Features
- `GET /api/students/<id>/achievements` - Get student achievements
- `GET /api/students/<id>/profile` - Get student profile

### Teacher Features
- `POST /api/tasks/<id>/questions/batch` - Bulk create questions
- `GET /api/teachers/<id>/students` - Get teacher's students

## Building for Production

1. **Frontend build**:
   ```bash
   npm run build
   ```

2. **Backend deployment**:
   - Use production WSGI server (e.g., Gunicorn)
   - Set environment variables for production database
   - Configure reverse proxy (e.g., Nginx)

## License

© 2025 UNSW Sydney. All rights reserved.

This project is developed for educational purposes at the University of New South Wales.
