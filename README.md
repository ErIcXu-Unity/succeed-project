# UNSW Escape Room Educational Platform

A full-stack web application for creating and managing educational escape room games at the University of New South Wales (UNSW). This platform allows teachers to create interactive escape room challenges and students to participate in gamified learning activities.

## Recent Updates & Improvements

### Latest Bug Fixes & Enhancements
- **Template Literal Syntax Fixes**: Resolved JavaScript template literal errors that caused API communication failures
- **Enhanced Dashboard Reports**: Added missing `active_students` and `total_submissions` fields to teacher dashboard
- **Improved Error Handling**: Fixed "Unexpected token" JSON parsing errors across all components
- **API Communication**: Corrected template literal syntax in all API calls for reliable data fetching
- **Completion Status Charts**: Fixed hardcoded values in teacher reports for accurate data visualization

### Enhanced Question System
- **5 Question Types**: Single Choice, Multiple Choice, Fill in Blank, Puzzle Game, Matching Task
- **Rich Media Support**: Images, videos, and YouTube integration for questions
- **Dynamic Question Editors**: Specialized editors for each question type
- **Smart Validation**: Type-specific validation with real-time feedback
- **Question Preview**: Comprehensive preview system for all question types

### Modern User Interface
- **Fully Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Enhanced Teacher Dashboard**: Improved statistics, better task management with real-time data
- **Smart Button Layout**: Adaptive button arrangements based on screen size
- **Keyboard Navigation**: ESC key support for modal dialogs
- **Touch-Friendly**: Optimized for mobile touch interactions

### Technical Improvements
- **Component Architecture**: Modular question type editors with improved error handling
- **API Reliability**: Fixed template literal syntax across all components for stable API communication
- **Enhanced Reporting**: Comprehensive dashboard analytics with accurate completion tracking
- **Database Optimization**: Improved query performance for student and task statistics
- **Docker Support**: Complete containerization for development and production with build-time environment configuration

## Features

### For Teachers
- **Dashboard Management**: Overview of all escape room games and student progress
- **Advanced Game Creation**: Create escape rooms with 5 different question types
- **Question Management**: 
  - Single Choice: Traditional A/B/C/D questions
  - Multiple Choice: Questions with multiple correct answers
  - Fill in Blank: Text completion exercises
  - Puzzle Game: Fragment assembly challenges
  - Matching Task: Connect related items
- **Media Integration**: Add images, videos, and YouTube content to questions
- **Student Analytics**: View detailed performance metrics and completion rates
- **Achievement System**: Monitor student achievements and badges
- **Responsive Interface**: Manage classes on any device

### For Students
- **Interactive Gameplay**: Participate in diverse escape room challenges
- **Multi-Type Questions**: Experience varied question formats for enhanced learning
- **Achievement System**: Earn badges and track progress through completed tasks
- **Real-time Progress**: Save and resume progress on incomplete tasks
- **Performance Tracking**: View personal statistics and improvement over time
- **Mobile Support**: Complete escape rooms on mobile devices

## Technology Stack

### Frontend
- **Framework**: React 18, JavaScript ES6+
- **Architecture**: Component-based with specialized question type editors
- **Styling**: CSS3 with responsive design and CSS Variables
- **State Management**: React Hooks (useState, useEffect)
- **Routing**: React Router with dynamic navigation
- **HTTP Client**: Fetch API with advanced error handling
- **Media Handling**: Support for images, videos, and YouTube integration

### Backend
- **Framework**: Flask (Python)
- **Database**: PostgreSQL with SQLAlchemy ORM
- **API**: RESTful APIs with CORS support and multi-type question handling
- **Authentication**: Session-based authentication
- **File Upload**: Enhanced media handling (images, videos)
- **Data Migration**: Scripts for upgrading existing question data

### Database Schema
- **Primary Database**: PostgreSQL
- **ORM**: SQLAlchemy with timezone support
- **Question Types**: Flexible schema supporting multiple question formats
- **Media Storage**: File path management for uploaded content
- **Achievement Tracking**: Comprehensive student progress monitoring

## Question Types

### 1. Single Choice
Traditional multiple-choice questions with one correct answer (A, B, C, D).

### 2. Multiple Choice
Questions allowing multiple correct answers with flexible option counts.

### 3. Fill in Blank
Text completion exercises where students fill in missing information.

### 4. Puzzle Game
Fragment assembly challenges where students arrange pieces to form solutions.

### 5. Matching Task
Connect items from two columns to demonstrate understanding of relationships.


## Project Structure

```
capstone-project-25t2-9900-h18b-donut/
├── backend/                     # Flask backend
│   ├── app.py                  # Main Flask application with enhanced APIs
│   ├── migrate_questions.py   # Database migration script
│   ├── requirements.txt        # Python dependencies
│   ├── uploads/               # Media file storage
│   └── .env                   # Environment variables
├── src/                       # React frontend
│   ├── components/            # React components
│   │   ├── *Editor.jsx       # Question type editors
│   │   ├── IntegratedQuestionModal.jsx  # Main question creation
│   │   ├── QuestionPreview.jsx          # Question preview system
│   │   ├── TeacherDashboard.jsx         # Enhanced dashboard
│   │   └── TaskEditor.jsx               # Task management
│   ├── App.jsx               # Main application component
│   └── index.js              # Application entry point
├── public/                   # Static assets
└── README.md                # Project documentation
```

## Installation & Setup

### Quick Start with Docker (Recommended)

#### Production Mode
```bash
docker compose up -d --build
```
Access the application at http://localhost

#### Development Mode
```bash
docker compose --profile dev up -d --build
```
Access the development server at http://localhost:3000

#### Mixed Development (Backend in Docker, Frontend local)
```bash
docker compose up db backend -d
npm start  # Run frontend locally on port 3000
```

For complete Docker documentation, see [README-Docker.md](README-Docker.md).

### Manual Installation

#### Prerequisites
- Node.js (v18 or higher)
- Python 3.8+
- PostgreSQL database
- Docker (optional, recommended)

#### Backend Setup
1. Navigate to the backend directory:
```bash
cd backend
```

2. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Create `.env` file with your database configuration:
```env
DATABASE_URL=postgresql://postgres:123456@localhost:5432/escape_room
FLASK_ENV=development
FLASK_DEBUG=True
```

5. Run the application:
```bash
python app.py
```
Backend runs on http://localhost:5001

#### Frontend Setup
1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm start
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

### E2E tests (Cypress)

Install dev dependency and open Cypress runner:

```
npm install
npm run cypress:open:e2e
```

Headless run:

```
npm run cypress:run:e2e
```

## Usage

### For Teachers
1. **Login**: Use teacher credentials to access the dashboard
2. **Create Tasks**: Design escape room scenarios with various question types
3. **Add Questions**: Use the integrated question modal to create diverse challenges
4. **Monitor Progress**: Track student performance through the responsive dashboard
5. **Manage Media**: Upload images and videos to enhance question content

### For Students
1. **Register/Login**: Create account or login with student credentials
2. **Browse Tasks**: View available escape room challenges
3. **Complete Challenges**: Answer questions of various types to progress
4. **Track Achievements**: Monitor badges and completion statistics
5. **Resume Progress**: Continue incomplete tasks anytime

## API Endpoints

### Question Management
- `POST /api/tasks/{id}/questions` - Create new question (supports all 5 types)
- `GET /api/tasks/{id}/questions` - Retrieve task questions with type information
- `DELETE /api/questions/{id}` - Remove specific question

### Task Management
- `GET /api/tasks` - List all tasks (with role-based filtering)
- `POST /api/tasks` - Create new escape room task
- `PUT /api/tasks/{id}` - Update task information
- `DELETE /api/tasks/{id}` - Remove task and related data

### Student Management & Analytics
- `GET /api/students/list` - Get list of all students with basic info
- `GET /api/students/{id}/details` - Get detailed student information
- `GET /api/students/{id}/history` - Get student's task completion history
- `GET /api/students/{id}/achievements` - Get student achievements
- `GET /api/students/{id}/profile` - Get student profile information

### Dashboard & Reporting
- `GET /api/students/dashboard-report` - Comprehensive dashboard analytics including:
  - Total students and tasks
  - Completion rates and average scores
  - Active student counts and total submissions
  - Task performance metrics
- `GET /api/students/dashboard-summary` - Summary statistics for teacher dashboard

### Student Progress
- `POST /api/tasks/{id}/submit` - Submit completed task
- `POST /api/tasks/{id}/save-progress` - Save partial progress
- `GET /api/tasks/{id}/progress` - Get saved progress for a task

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/new-feature`)
3. Commit your changes (`git commit -m 'feat: add new feature'`)
4. Push to the branch (`git push origin feature/new-feature`)
5. Create a Pull Request

## Database Migration

For existing installations, run the migration script to support new question types:

```bash
cd backend
python migrate_questions.py
```

This will add the necessary database columns for enhanced question functionality.

## Test Accounts

After setting up the application, you can use these default accounts:

### Teacher Accounts
- **Teacher Admin 1**:
  - Username: `st1000@tea.com`
  - Teacher ID: `1000`
  - Password: `123456`

- **Teacher Admin 2**:
  - Username: `st1001@tea.com`
  - Teacher ID: `1001`
  - Password: `123456`

### Student Accounts
Students can register through the registration page. Default student accounts have been removed from the seed data to ensure clean deployments.

## Docker Support

The application includes comprehensive Docker support for easy deployment:

- **Production deployment**: Nginx-served React build with Flask backend
- **Development mode**: React dev server with hot reload
- **Database**: PostgreSQL in Docker container
- **Health checks**: Built-in health monitoring
- **Multi-stage builds**: Optimized container sizes

For detailed Docker instructions, see [README-Docker.md](README-Docker.md).

## Project Structure Updates

Recent additions include:
- `Dockerfile` - Multi-stage frontend build
- `Dockerfile.dev` - Development-optimized build
- `docker-compose.yml` - Service orchestration
- `nginx.conf` - Production web server configuration
- `src/config.js` - Centralized API configuration

## License

This project is developed for UNSW educational purposes.

## Acknowledgments

- UNSW Computer Science & Engineering
- React.js community for excellent documentation
- Flask community for robust backend framework
- Docker community for containerization best practices
