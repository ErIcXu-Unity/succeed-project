# UNSW Escape Room Educational Platform

A full-stack web application for creating and managing educational escape room games at the University of New South Wales (UNSW). This platform allows teachers to create interactive escape room challenges and students to participate in gamified learning activities.

## 🎯 New Features & Updates

### ✨ Enhanced Question System
- **5 Question Types**: Single Choice, Multiple Choice, Fill in Blank, Puzzle Game, Matching Task
- **Rich Media Support**: Images, videos, and YouTube integration for questions
- **Dynamic Question Editors**: Specialized editors for each question type
- **Smart Validation**: Type-specific validation with real-time feedback
- **Question Preview**: Comprehensive preview system for all question types

### 🎨 Modern User Interface
- **Fully Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Enhanced Teacher Dashboard**: Improved statistics, better task management
- **Smart Button Layout**: Adaptive button arrangements based on screen size
- **Keyboard Navigation**: ESC key support for modal dialogs
- **Touch-Friendly**: Optimized for mobile touch interactions

### 🏗️ Technical Improvements
- **Component Architecture**: Modular question type editors
- **Type Safety**: Enhanced form validation with null safety
- **API Enhancements**: Support for multiple question types in backend
- **Database Migration**: Seamless upgrade path for existing data

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

### Prerequisites
- Node.js (v14 or higher)
- Python 3.8+
- PostgreSQL database

### Backend Setup
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
DATABASE_URL=postgresql://username:password@localhost:5432/escape_room_db
```

5. Run the application:
```bash
python app.py
```

### Frontend Setup
1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm start
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

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
- `POST /api/tasks/{id}/questions` - Create new question (supports all 6 types)
- `GET /api/tasks/{id}/questions` - Retrieve task questions with type information
- `DELETE /api/questions/{id}` - Remove specific question

### Task Management
- `GET /api/tasks` - List all tasks (with role-based filtering)
- `POST /api/tasks` - Create new escape room task
- `PUT /api/tasks/{id}` - Update task information
- `DELETE /api/tasks/{id}` - Remove task and related data

### Student Progress
- `POST /api/tasks/{id}/submit` - Submit completed task
- `GET /api/students/{id}/achievements` - Get student achievements
- `POST /api/tasks/{id}/save-progress` - Save partial progress

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

## License

This project is developed for UNSW educational purposes.

## Acknowledgments

- UNSW Computer Science & Engineering
- React.js community for excellent documentation
- Flask community for robust backend framework
