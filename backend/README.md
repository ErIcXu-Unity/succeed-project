# Escape Room Educational Platform - Backend API

A robust Flask-based backend service for the UNSW Escape Room Educational Platform, providing comprehensive APIs for managing educational content, user authentication, and interactive learning experiences.

## Architecture Overview

The backend follows a **modular blueprint architecture** with separated concerns for maintainability and scalability:

```
backend/
├── app.py              # Application factory & main entry point
├── models.py           # SQLAlchemy database models
├── auth.py             # Authentication & authorization
├── tasks.py            # Task management endpoints
├── questions.py        # Question CRUD operations  
├── submissions.py      # Student submissions & grading
├── students.py         # Student progress & analytics
├── uploads.py          # File upload & media handling
├── requirements.txt    # Python dependencies
├── seed_data.py        # Database seeding script
└── migrate_questions.py # Database migration utilities
```

## Features

### Core Functionality
- **Authentication System**: Secure login/registration for students and teachers
- **Content Management**: Create and manage educational tasks and questions
- **Interactive Questions**: Support for 5 different question types
- **Progress Tracking**: Comprehensive student analytics and achievements
- **Media Handling**: Upload and serve images, videos, and documents
- **Achievement System**: Badges and progress gamification

### Question Types Supported
1. **Single Choice** - Traditional multiple choice (A/B/C/D)
2. **Multiple Choice** - Multiple correct answers
3. **Fill in Blank** - Text completion exercises
4. **Puzzle Game** - Fragment assembly challenges
5. **Matching Task** - Connect related items

## Technology Stack

- **Framework**: Flask 2.0+ with Blueprint architecture
- **Database**: PostgreSQL with SQLAlchemy ORM
- **Authentication**: Session-based with secure password hashing
- **File Storage**: Local filesystem with organized directory structure
- **CORS**: Configured for cross-origin requests
- **Environment**: python-dotenv for configuration management

## Installation & Setup

### Prerequisites
- Python 3.8 or higher
- PostgreSQL 12+ (or SQLite for development)
- Virtual environment (recommended)

### Step 1: Environment Setup
```bash
# Clone and navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Linux/macOS:
source venv/bin/activate
# Windows:
venv\Scripts\activate
```

### Step 2: Install Dependencies
```bash
# Install all required packages
pip install -r requirements.txt

# Or install manually:
pip install Flask>=2.0.0 Flask-SQLAlchemy>=2.5.1 Flask-CORS>=3.0.10 python-dotenv>=0.19.0 Werkzeug>=2.0.0 psycopg2-binary>=2.9.0
```

### Step 3: Database Configuration
Create a `.env` file in the backend directory:

```env
# Production Database (PostgreSQL)
DATABASE_URL=postgresql://username:password@localhost:5432/escape_room_db

# Development Database (SQLite)
# DATABASE_URL=sqlite:///escape_room.db

# Application Settings
FLASK_ENV=development
FLASK_DEBUG=True
SECRET_KEY=your-secret-key-here

# Upload Configuration
MAX_CONTENT_LENGTH=16777216  # 16MB max file size
```

### Step 4: Database Initialization
```bash
# Initialize database tables
python -c "from models import db; from app import create_app; app = create_app(); app.app_context().push(); db.create_all()"

# Seed database with sample data (optional)
python seed_data.py
```

### Step 5: Start the Server
```bash
# Start development server
python app.py

# Server will run on http://localhost:5001
```

## API Endpoints

### Authentication Endpoints
```http
POST   /register                    # Student registration
POST   /login                       # User login (student/teacher)
POST   /change-password             # Change user password
```

### Task Management
```http
GET    /api/tasks                   # List all tasks (role-based filtering)
POST   /api/tasks                   # Create new task (teachers only)
GET    /api/tasks/{id}              # Get specific task details
PUT    /api/tasks/{id}              # Update task (teachers only)
DELETE /api/tasks/{id}              # Delete task (teachers only)
POST   /api/tasks/{id}/save-progress # Save partial progress
GET    /api/tasks/{id}/progress     # Get task progress
DELETE /api/tasks/{id}/progress     # Delete task progress
POST   /api/tasks/{id}/video        # Upload task video
DELETE /api/tasks/{id}/video        # Delete task video
POST   /api/tasks/{id}/youtube      # Set YouTube video for task
```

### Question Management
```http
GET    /api/tasks/{id}/questions    # Get all questions for a task
POST   /api/tasks/{id}/questions    # Create new question (all 5 types supported)
POST   /api/tasks/{id}/questions/batch # Create multiple questions
GET    /api/questions/{id}          # Get specific question
PUT    /api/questions/{id}          # Update question (teachers only)
DELETE /api/questions/{id}          # Delete question (teachers only)
POST   /api/questions/{id}/check    # Check question answer
```

### Student Progress & Submissions
```http
POST   /api/tasks/{id}/submit       # Submit completed task
GET    /api/students/{id}/task-progress # Get student task progress
GET    /api/students/{id}/profile   # Get student profile
GET    /api/students/{id}/achievements # Get student achievements
GET    /api/students/{id}/history   # Get student task history
GET    /api/students/{id}/details   # Get detailed student information
```

### File Upload & Media
```http
GET    /uploads/questions/{path}    # Serve uploaded question images
GET    /uploads/videos/{path}       # Serve uploaded videos
```

### Analytics & Reporting (Teachers)
```http
GET    /api/students/dashboard-summary # Teacher dashboard summary
GET    /api/students/list           # List all students with progress
GET    /api/students/dashboard-report # Comprehensive reporting data
```

## Database Schema

### Core Tables
- **students**: Student accounts and profiles
- **teachers**: Teacher accounts and permissions
- **tasks**: Educational escape room tasks
- **questions**: Individual questions with type-specific data
- **achievements**: Available badges and milestones
- **student_achievements**: Student badge records
- **student_task_results**: Task completion scores

### Question Data Structure
Questions support flexible JSON data storage for different types:

```json
{
  "question_type": "puzzle_game",
  "question_data": {
    "puzzle_solution": "x² + 4x + 4 = 0",
    "puzzle_fragments": ["x²", "+", "4x", "+", "4", "=", "0"]
  }
}
```

## Security Features

- **Password Hashing**: Werkzeug secure password hashing
- **Session Management**: Flask-based session handling
- **CORS Protection**: Configured allowed origins
- **File Upload Security**: Type validation and size limits
- **SQL Injection Prevention**: SQLAlchemy ORM parameter binding
- **Input Validation**: Comprehensive request data validation

## Monitoring & Logging

### Development
```bash
# Enable debug mode
export FLASK_DEBUG=True
python app.py
```

### Production Considerations
- Use gunicorn or uWSGI for production deployment
- Implement proper logging with rotating file handlers
- Set up database connection pooling
- Configure reverse proxy (nginx/Apache)
- Enable SSL/TLS certificates

## Testing

### Manual Testing
```bash
# Test database connection
python -c "from models import db; from app import create_app; app = create_app(); app.app_context().push(); print('Database connection successful!')"

# Test API endpoints
curl -X GET http://localhost:5001/api/tasks
curl -X POST http://localhost:5001/register -H "Content-Type: application/json" -d '{"name":"Test Student","student_id":"1234567","password":"test123"}'
```

### Sample Data
Run the seed script to populate the database with sample data:
```bash
python seed_data.py
```

This creates:
- Sample tasks with various question types
- Test student and teacher accounts
- Achievement badges
- Demo questions demonstrating all 5 question types

## Deployment

### Environment Variables
```env
DATABASE_URL=postgresql://user:pass@host:5432/db
FLASK_ENV=production
FLASK_DEBUG=False
SECRET_KEY=your-production-secret-key
MAX_CONTENT_LENGTH=52428800  # 50MB for production
```

### Docker Deployment
```dockerfile
FROM python:3.9-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
EXPOSE 5001
CMD ["gunicorn", "--bind", "0.0.0.0:5001", "app:create_app()"]
```

## Docker Support

The backend includes full Docker integration:

```bash
# Build backend image
docker build -t escape-room-backend ./backend

# Run with Docker Compose (recommended)
docker compose up backend -d

# Access backend at http://localhost:5001
```

For complete Docker documentation, see [../README-Docker.md](../README-Docker.md).

## Migration & Maintenance

### Database Migration
For existing installations, use the migration script:
```bash
python migrate_questions.py
```

### Backup & Recovery
```bash
# PostgreSQL backup
pg_dump escape_room_db > backup.sql

# PostgreSQL restore
psql escape_room_db < backup.sql
```

### Debug Mode
```bash
export FLASK_DEBUG=True
export FLASK_ENV=development
python app.py
```

## Test Accounts

The application includes test accounts for development:

### Teacher Account
- Username: `teacher@unsw.edu.au`
- Password: `123456`
- Access: Full admin capabilities

### Student Account  
- Username: `1234567@stu.com`
- Student ID: `1234567`
- Name: `adsf`

## Configuration

### Database Configuration
The backend supports both PostgreSQL (production) and SQLite (development):

```env
# PostgreSQL (recommended)
DATABASE_URL=postgresql://postgres:123456@localhost:5433/escape_room

# SQLite (development only)
DATABASE_URL=sqlite:///escape_room.db
```

### CORS Configuration
Allowed origins are configured in `app.py`:
- `http://localhost:3000` (React dev server)
- `http://localhost:3001` (Alternative dev server) 
- `http://127.0.0.1:3000`
- `http://127.0.0.1:3001`

