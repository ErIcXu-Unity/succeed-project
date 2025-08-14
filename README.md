# UNSW Escape Room Educational Platform - Comprehensive Documentation

## Project Overview

The UNSW Escape Room Educational Platform is a full-stack web application designed for creating and managing educational escape room games at the University of New South Wales (UNSW). This platform enables teachers to create interactive escape room challenges while providing students with engaging gamified learning experiences through diverse question types and achievement systems.

## Architecture

### System Architecture

The platform follows a modern three-tier architecture:

- **Frontend**: React 18-based single-page application with component-based architecture
- **Backend**: Flask-based RESTful API with modular blueprint structure
- **Database**: PostgreSQL with SQLAlchemy ORM for data persistence
- **Infrastructure**: Docker containerization for development and production deployment

### Technology Stack

#### Frontend Technologies

- **Framework**: React 18 with JavaScript ES6+
- **Architecture**: Component-based design with specialized question type editors
- **Styling**: CSS3 with responsive design and CSS Variables
- **State Management**: React Hooks (useState, useEffect)
- **Routing**: React Router with dynamic navigation
- **HTTP Client**: Fetch API with comprehensive error handling
- **Media Support**: Images, videos, and YouTube integration
- **Testing**: Cypress for end-to-end and component testing

#### Backend Technologies

- **Framework**: Flask 2.0+ with Blueprint architecture
- **Database**: PostgreSQL with SQLAlchemy ORM
- **Authentication**: Session-based with secure password hashing
- **File Storage**: Organized local filesystem storage
- **CORS**: Configured for cross-origin requests
- **Environment**: python-dotenv for configuration management

#### Infrastructure

- **Containerization**: Docker and Docker Compose
- **Web Server**: Nginx for production static file serving
- **Development**: Hot reload support for rapid development
- **Database**: PostgreSQL with connection pooling

## Core Features

### Educational Content Management

The platform supports five distinct question types for maximum educational versatility:

1. **Single Choice Questions**: Traditional multiple-choice with single correct answers
2. **Multiple Choice Questions**: Multiple correct answers with flexible option counts
3. **Fill in Blank**: Text completion exercises for knowledge assessment
4. **Puzzle Game**: Fragment assembly challenges for problem-solving skills
5. **Matching Task**: Relationship-based learning through item connections

### User Management System

#### Teacher Capabilities

- **Dashboard Management**: Comprehensive overview of escape room games and student progress
- **Advanced Game Creation**: Design escape rooms with all five question types
- **Media Integration**: Upload and manage images, videos, and YouTube content
- **Student Analytics**: Detailed performance metrics and completion tracking
- **Achievement Monitoring**: Track student badges and milestone progress
- **Responsive Interface**: Full functionality across desktop, tablet, and mobile devices

#### Student Features

- **Interactive Gameplay**: Participate in diverse escape room challenges
- **Multi-Type Questions**: Experience varied question formats for enhanced learning
- **Achievement System**: Earn badges and track progress through completed tasks
- **Progress Persistence**: Save and resume progress on incomplete tasks
- **Performance Tracking**: View personal statistics and improvement metrics
- **Mobile Support**: Complete escape rooms on mobile devices with touch optimization

### Achievement and Gamification

- **Badge System**: Milestone-based achievement tracking
- **Progress Visualization**: Real-time progress indicators and completion status
- **Performance Analytics**: Comprehensive statistics for students and teachers
- **Leaderboards**: Competitive elements to encourage engagement

## Technical Implementation

### Complete Project Structure

```
capstone-project-25t2-9900-h18b-donut/
├── backend/                     # Flask backend
│   ├── app.py                  # Application factory and main entry point
│   ├── auth.py                 # Authentication and authorization
│   ├── models.py               # SQLAlchemy database models
│   ├── questions.py            # Question CRUD operations
│   ├── students.py             # Student progress and analytics
│   ├── submissions.py          # Student submissions and grading
│   ├── tasks.py                # Task management endpoints
│   ├── uploads.py              # File upload and media handling
│   ├── migrate_questions.py    # Database migration scripts
│   ├── seed_data.py            # Database seeding utilities
│   ├── requirements.txt        # Python dependencies
│   ├── test_*.py              # Backend pytest test files
│   ├── conftest.py            # Pytest configuration
│   ├── htmlcov/               # Backend test coverage reports
│   ├── uploads/               # Media file storage
│   └── .env                   # Environment variables
├── src/                       # React frontend
│   ├── components/            # React components
│   │   ├── *Editor.jsx       # Specialized question type editors
│   │   ├── IntegratedQuestionModal.jsx  # Unified question creation interface
│   │   ├── QuestionPreview.jsx   # Question preview system
│   │   ├── TeacherDashboard.jsx  # Enhanced teacher dashboard
│   │   ├── StudentDashboard.jsx  # Student interface
│   │   └── TaskEditor.jsx        # Task management interface
│   ├── pages/                 # Page-level components
│   ├── App.jsx               # Main application component
│   ├── config.js             # Centralized API configuration
│   └── index.js              # Application entry point
├── test/frontend/             # Frontend test files
│   ├── components/           # Component tests (Cypress)
│   │   └── *.cy.jsx         # Individual component test files
│   ├── e2e/                 # End-to-end tests (Cypress)
│   │   └── *.cy.js          # E2E test specifications
│   ├── fixtures/            # Test data fixtures
│   └── support/             # Test support files
├── coverage/                 # Frontend test coverage reports
├── public/                  # Static assets
├── cypress.config.js        # Cypress configuration
├── docker-compose.yml       # Docker services orchestration
├── Dockerfile              # Frontend production container
├── Dockerfile.dev          # Frontend development container
├── package.json            # Node.js dependencies and scripts
└── README.md               # Project documentation
```

### Database Schema

The database design supports flexible educational content management:

- **Core Tables**: students, teachers, tasks, questions, achievements
- **Relationship Tables**: student_achievements, student_task_results
- **Media Tables**: Organized file path management for uploaded content
- **Progress Tracking**: Comprehensive student advancement monitoring

## API Architecture

### Authentication Endpoints

- `POST /register` - Student registration
- `POST /login` - User authentication (student/teacher)
- `POST /change-password` - Password management

### Task Management APIs

- `GET /api/tasks` - List tasks with role-based filtering
- `POST /api/tasks` - Create new escape room tasks (teachers)
- `PUT /api/tasks/{id}` - Update task information
- `DELETE /api/tasks/{id}` - Remove tasks and related data
- `POST /api/tasks/{id}/save-progress` - Save partial student progress
- `GET /api/tasks/{id}/progress` - Retrieve saved progress

### Question Management APIs

- `GET /api/tasks/{id}/questions` - Retrieve task questions with type information
- `POST /api/tasks/{id}/questions` - Create questions (supports all 5 types)
- `PUT /api/questions/{id}` - Update question content (teachers)
- `DELETE /api/questions/{id}` - Remove specific questions
- `POST /api/questions/{id}/check` - Validate question answers

### Analytics and Reporting APIs

- `GET /api/students/dashboard-report` - Comprehensive dashboard analytics
- `GET /api/students/{id}/details` - Detailed student information
- `GET /api/students/{id}/history` - Task completion history
- `GET /api/students/{id}/achievements` - Achievement tracking
- `GET /api/students/list` - Student roster with progress indicators

## Installation and Deployment

### Quick Start with Docker (Recommended)

#### Production Deployment

```bash
docker compose up -d --build
# Or, if you are using legacy Docker Compose v1:
docker-compose up -d --build

# Access at http://localhost
```

#### Development Mode

```bash
docker compose --profile dev up -d --build
# Or (legacy v1):
docker-compose --profile dev up -d --build
# Access at http://localhost:3000
```

#### Mixed Development (Recommended for Active Development)

```bash
docker compose up db backend -d
npm start  # Frontend runs locally with hot reload
```

### Local Backend (without Docker)

If you run the backend directly with `python app.py`, you must set up a local database and a `.env` file under `backend/`.

1. Create the PostgreSQL database (name must be `test-project`)

```bash
# Option A: Using Docker for Postgres only (matches docker-compose port mapping)
docker compose up -d db
# Database will be available on host port 5433

# Option B: Using your own Postgres (default 5432)
```

Create the database:

```bash
# Using createdb (Postgres CLI)
createdb -h localhost -p 5433 -U postgres test-project   # if using Docker DB
# or
createdb -h localhost -p 5432 -U postgres test-project   # if using native Postgres

# Or via psql
psql -h localhost -p 5433 -U postgres -c "CREATE DATABASE \"test-project\";"
```

2. Create `backend/.env`

```env
# Point to your Postgres instance
# If using Docker DB exposed on 5433:
DATABASE_URL=postgresql://postgres:123456@localhost:5433/test-project
# If using native Postgres on 5432, adjust accordingly:
# DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/test-project

FLASK_ENV=development
FLASK_DEBUG=True
SECRET_KEY=dev-secret-key
```

3. Install dependencies and run the backend

```bash
cd backend
pip install -r requirements.txt
python app.py
# Backend runs at http://localhost:5001
```

Notes:

- When using Docker Compose (frontend + backend + db), you do NOT need `backend/.env`; Compose injects `DATABASE_URL` for you.
- Access the app in Docker: `http://localhost:3000` (frontend) and `http://localhost:5001` (backend API).

### Manual Installation

#### Prerequisites

- Node.js 18 or higher
- Python 3.8+
- PostgreSQL 12+
- Docker (optional but recommended)

#### Backend Setup

1. Create virtual environment and activate
2. Install dependencies: `pip install -r requirements.txt`
3. Configure environment variables in `.env` file
4. Initialize database: `python -c "from models import db; from app import create_app; app = create_app(); app.app_context().push(); db.create_all()"`
5. Seed database: `python seed_data.py`
6. Start server: `python app.py`

#### Frontend Setup

1. Install dependencies: `npm install`
2. Start development server: `npm start`
3. Access application at http://localhost:3000

## Comprehensive Testing Guide

This project includes extensive testing for both frontend and backend components. Below are detailed instructions for running all types of tests, designed for users with no prior testing experience.

### Prerequisites for Testing

1. Complete the installation steps in the Installation section
2. Install all frontend dependencies: `npm install`
3. Ensure the application is properly set up and running

### 1. End-to-End (E2E) Testing with Cypress

E2E tests simulate real user interactions with the complete application, testing the entire system from frontend to backend. These tests verify that all parts of the application work together correctly.

#### Running E2E Tests with Graphical Interface (Beginner-Friendly)

This opens a visual interface where you can watch tests run in a real browser:

```bash
# Step 1: Make sure your application is running
npm start  # Start frontend on http://localhost:3000

# Step 2: In another terminal, start backend (optional for stubbed tests)
cd backend && python app.py  # Start backend on http://localhost:5001

# Step 3: Open Cypress Test Runner with GUI
npm run cypress:open
```

**What you'll see:**

- A Cypress window opens showing available test files
- Click on any test file (e.g., `auth.cy.js`, `student_dashboard.cy.js`)
- Watch tests run automatically in a browser window
- See detailed step-by-step execution with screenshots
- View real-time logs and error messages

#### Running E2E Tests in Headless Mode (Command Line)

This runs all tests automatically in the background without opening browser windows:

```bash
# Run all E2E tests without GUI
npx cypress run --e2e

```

**What you'll see:**

- Test results printed directly in your terminal
- Summary showing total passed/failed tests
- Screenshots automatically saved for any test failures
- Execution videos generated (if configured)

#### Available E2E Test Suites (Total: 217 tests across 14 suites)

- `auth.cy.js` - User login and authentication (13 tests)
- `register.cy.js` - Student registration process (14 tests)
- `student_dashboard.cy.js` - Student interface features (20 tests)
- `teacher_dashboard.cy.js` - Teacher dashboard and task management (20 tests)
- `quiz.cy.js` - Quiz gameplay and question interactions (14 tests)
- `question_create.cy.js` - Question creation workflows (10 tests)
- `task_editor.cy.js` - Task editing functionality (30 tests)
- `video_upload.cy.js` - Media upload features (10 tests)
- `change_password.cy.js` - Password change functionality (15 tests)
- `custom_alert.cy.js` - Alert and notification system (9 tests)
- `student_accessibility.cy.js` - Accessibility features (10 tests)
- `student_achievements.cy.js` - Achievement system (15 tests)
- `student_help.cy.js` - Help system functionality (10 tests)
- `student_history.cy.js` - Student history tracking (20 tests)

### 2. Backend Testing with Pytest

Backend tests verify that API endpoints, database operations, and business logic work correctly.

#### Running Backend Tests with Coverage Analysis

```bash
# Step 1: Navigate to backend directory
cd backend

# Step 2: Activate virtual environment (if you're using one)
source venv/bin/activate  # On macOS/Linux
# OR
venv\Scripts\activate  # On Windows

# Step 3: Run all backend tests with coverage reporting
pytest --cov=. --cov-report=html --cov-report=term
```

**What you'll see:**

- Terminal output showing each test result (PASSED/FAILED)
- Coverage percentage for each Python file
- Overall coverage summary
- HTML coverage report generated automatically

#### Viewing Detailed Backend Test Coverage Report

After running tests with coverage, open the detailed HTML report:

```bash
# Open coverage report in your default browser
# On macOS:
open htmlcov/index.html

# On Windows:
start htmlcov/index.html

# On Linux:
xdg-open htmlcov/index.html

# Or manually navigate to: backend/htmlcov/index.html
```

**The coverage report shows:**

- **Overall coverage percentage** for the entire backend
- **File-by-file breakdown** showing coverage for each Python module
- **Line-by-line analysis** with color coding:
  - **Green lines**: Code that is tested by your test suite
  - **Red lines**: Code that is NOT covered by tests
  - **Yellow lines**: Partially covered code (like if/else branches)
- **Missing coverage areas** that need additional testing

#### Running Specific Backend Test Categories

```bash
# Test authentication functionality
pytest test_auth.py -v

# Test task management
pytest test_tasks.py -v

# Test question handling
pytest test_questions.py -v

# Test with coverage for specific modules
pytest test_auth.py --cov=auth --cov-report=html
```

### 3. Frontend Component Testing with Cypress

Component tests verify individual React components work correctly in isolation, without requiring the full application to run.

#### Running Component Tests with Visual Interface

```bash
# Open Cypress Component Test Runner
npm run cypress:open:ct
```

**What you'll see:**

- Cypress component testing interface opens
- List of component test files (files ending in .cy.jsx)
- Click any test file to run it interactively
- Watch individual components render and respond to interactions
- See real-time test results and debugging information

#### Running Component Tests with Coverage (Recommended)

```bash
# Run all component tests and generate coverage report
npm run ct:cov
```

**What you'll see:**

- All component tests execute automatically
- Test results displayed in terminal
- Coverage information calculated and displayed
- The HTML coverage report generated at `coverage/ct/index.html`
- On Windows, the report opens automatically after the run

#### Viewing Frontend Component Test Coverage Report

After `npm run ct:cov`, the coverage report is available at `coverage/ct/index.html`.

```bash
# Open the frontend coverage report (macOS/Linux)
open coverage/ct/index.html   # macOS
xdg-open coverage/ct/index.html  # Linux

# On Windows, the report opens automatically; or open manually:
start coverage/ct/index.html
```

**The coverage report includes:**

- **Overall JavaScript/JSX code coverage** percentage
- **File-by-file breakdown** for all React components
- **Multiple coverage metrics:**
  - **Line coverage**: Percentage of code lines executed
  - **Function coverage**: Percentage of functions called
  - **Branch coverage**: Percentage of if/else branches tested
  - **Statement coverage**: Percentage of statements executed
- **Visual code highlighting** showing tested vs untested code

#### Available Component Test Files (Total: 270+ tests)

- `ChangePasswordModal.cy.jsx` - Password change modal testing (19 tests)
- `CustomAlert.cy.jsx` - Alert notification system (16 tests)
- `Login.cy.jsx` - Login component functionality (6 tests)
- `TeacherDashboard.cy.jsx` - Teacher dashboard component (15 tests)
- `EachgameGrade.cy.jsx` - Grade display component (7 tests)
- `FillBlankEditor.cy.jsx` - Fill-in-blank question editor (19 tests)
- `LoadingScreen.cy.jsx` - Loading screen component (21 tests)
- `Register.cy.jsx` - Registration form component (15 tests)
- `SearchFilter.cy.jsx` - Search and filter functionality (14+ tests)
- And more components...

### 4. Running Complete Test Suite

To run all tests and generate all coverage reports:

```bash
# 1. Run backend tests with coverage
cd backend
pytest --cov=. --cov-report=html
cd ..

# 2. Run frontend component tests with coverage
npm run cypress:run:ct

# 3. Run E2E tests
npm run cypress:run:e2e
```

### Understanding Test Results

#### Successful Test Execution

- **Green checkmarks (✓)** or "PASSED" indicate successful tests
- **High coverage percentages** (80%+ is generally good) show comprehensive testing
- **All tests passing** confirms the application functions correctly

#### Failed Test Execution

- **Red X marks (✗)** or "FAILED" indicate problematic tests
- **Error messages** provide specific details about failures
- **Screenshots** (for Cypress tests) show the application state when tests failed
- **Stack traces** help developers identify exactly where problems occur

### Test Configuration Files

- `cypress.config.js` - Cypress testing framework configuration
- `backend/conftest.py` - Pytest configuration and shared test fixtures
- `backend/pytest.ini` - Pytest-specific settings and options
- `package.json` - Contains npm scripts for running different test types

### Troubleshooting Common Test Issues

#### Backend Test Problems

1. **"ModuleNotFoundError"**: Ensure virtual environment is activated
2. **Database connection errors**: Check PostgreSQL is running and accessible
3. **"ImportError"**: Verify all dependencies are installed with `pip install -r requirements.txt`

#### Frontend Test Problems

1. **"ECONNREFUSED" errors**: Backend server isn't running on http://localhost:5001
2. **"Port 3000 already in use"**: Stop other frontend instances with `Ctrl+C`
3. **Cypress won't open**: Try reinstalling with `npx cypress install`
4. **Component tests failing**: Ensure all npm dependencies are installed

#### E2E Test Problems

1. **Tests timeout**: Application might be loading slowly; increase timeout values
2. **Element not found**: UI might have changed; check selectors in test files
3. **Authentication failures**: Verify test accounts exist in database

### Getting Additional Help

- **Test output messages**: Read error messages carefully for specific guidance
- **Coverage reports**: Use them to identify untested code areas
- **Screenshots**: For Cypress failures, check generated screenshots in `cypress/screenshots/`
- **Console logs**: Check browser developer tools for additional error information

## Security Implementation

### Authentication Security

- Secure password hashing using Werkzeug
- Session-based authentication management
- CORS protection with configured allowed origins
- Input validation and sanitization

### File Upload Security

- File type validation and restrictions
- Size limitations (configurable, default 16MB development, 50MB production)
- Organized directory structure for media storage
- SQL injection prevention through SQLAlchemy ORM

### Data Protection

- Parameter binding for database queries
- Secure session handling
- Environment-based configuration management
- Production security hardening guidelines

## Performance Optimization

### Frontend Optimization

- Component-based architecture for efficient re-rendering
- Responsive design with mobile-first approach
- Image and video optimization for web delivery
- Lazy loading for improved initial page load

### Backend Optimization

- Database query optimization through SQLAlchemy
- Connection pooling for database performance
- Efficient file serving for media content
- RESTful API design for optimal data transfer

### Infrastructure Optimization

- Docker multi-stage builds for reduced image sizes
- Nginx static file serving in production
- Database indexing for query performance
- Health checks for container monitoring

## Configuration Management

### Environment Variables

```env
# Database Configuration
DATABASE_URL=postgresql://username:password@host:port/database

# Application Settings
FLASK_ENV=production|development
FLASK_DEBUG=True|False
SECRET_KEY=your-production-secret-key

# Upload Configuration
MAX_CONTENT_LENGTH=52428800  # File size limits
```

### Docker Configuration

- Production and development profiles
- Service orchestration with health checks
- Volume management for data persistence
- Network configuration for service communication

## Monitoring and Maintenance

### Development Monitoring

- Debug mode for detailed error reporting
- Comprehensive logging throughout application layers
- Real-time error tracking and reporting

### Production Considerations

- Gunicorn or uWSGI for production WSGI serving
- Reverse proxy configuration (nginx/Apache)
- SSL/TLS certificate implementation
- Database backup and recovery procedures
- Log rotation and monitoring setup

## Default Test Accounts

### Teacher Accounts

- **Primary Teacher**: st1000@tea.com (Teacher ID: 1000, Password: 123456)
- **Secondary Teacher**: st1001@tea.com (Teacher ID: 1001, Password: 123456)

### Student Registration

Students register through the application interface. Default student accounts are not pre-seeded to ensure clean production deployments.

## Migration and Upgrades

### Database Migration

For existing installations upgrading to support new question types:

```bash
cd backend
python migrate_questions.py
```

### Version Compatibility

- Backward compatibility maintained through migration scripts
- Database schema versioning for safe upgrades
- Configuration file migration support

## Contributing Guidelines

1. Fork the repository
2. Create feature branch: `git checkout -b feature/new-feature`
3. Implement changes following existing code conventions
4. Run test suite to ensure compatibility
5. Commit changes: `git commit -m 'feat: add new feature'`
6. Push to branch: `git push origin feature/new-feature`
7. Create Pull Request with detailed description

## License and Acknowledgments

This project is developed for UNSW educational purposes under the Computer Science & Engineering department. The platform leverages:

- React.js community for frontend framework excellence
- Flask community for robust backend development
- Docker community for containerization best practices
- Cypress community for comprehensive testing solutions
- Pytest community for reliable backend testing framework

## Support and Documentation

For additional support:

- **Technical Issues**: Reference troubleshooting sections in component READMEs
- **Development Setup**: Follow Docker installation guide for streamlined setup
- **API Documentation**: Refer to endpoint specifications for integration details
- **Testing Guidance**: Review testing framework documentation for contribution guidelines

## Project Status

The platform represents a complete educational escape room solution with:

- Full-featured question type support (5 types)
- Comprehensive user management system
- Production-ready deployment configuration
- Extensive testing coverage (217 E2E tests)
- Mobile-responsive design implementation
- Professional security implementation

Recent updates include template literal syntax fixes, enhanced dashboard reporting, improved error handling, and comprehensive Docker support for streamlined development and deployment workflows.
