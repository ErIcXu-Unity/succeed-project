# UNSW Escape Room Editor

A React-based web application for creating and managing educational escape room games at the University of New South Wales (UNSW). This platform allows teachers to create interactive escape room challenges and students to participate in learning activities.

## Features

### For Teachers
- **Dashboard Management**: Overview of all escape room games and student progress
- **Game Creation**: Create and edit escape room scenarios with puzzles and challenges
- **Student Analytics**: View detailed performance metrics and completion rates
- **Grade Management**: Track and export student grades and progress reports
- **Class Management**: Organize students and monitor their participation

### For Students
- **Interactive Gameplay**: Participate in escape room challenges designed for learning
- **Achievement System**: Earn badges and track progress through completed tasks
- **Course Integration**: Access escape rooms organized by enrolled courses
- **Performance Tracking**: View personal statistics and improvement over time
- **Accessibility Features**: Built-in accessibility tools for inclusive learning

## Technology Stack

- **Frontend**: React 18, JavaScript ES6+
- **Styling**: CSS3 with CSS Variables
- **Charts**: Chart.js for data visualization
- **Icons**: Font Awesome 6.4.0
- **Authentication**: Moodle OAuth2 integration (currently using fake authentication for development)

## Project Structure

```
/Users/xiwei/Downloads/website/
├── public/
│   ├── index.html
│   └── assets/
│       ├── logo.png
│       ├── moodle-icon.png
│       ├── teacher.png
│       ├── graduation.png
│       ├── course-chem.jpg
│       ├── course-stat.jpg
│       ├── task1.jpg
│       ├── task2.jpg
│       ├── game01.jpg
│       └── game02.jpg
├── src/
│   ├── components/
│   │   ├── TeacherDashboard.js
│   │   ├── TeacherDashboard.css
│   │   ├── StudentDashboard.js
│   │   ├── StudentDashboard.css
│   │   ├── GradeDashboard.js
│   │   ├── GradeDashboard.css
│   │   ├── EscapeRoomGame.js
│   │   ├── EscapeRoomGame.css
│   │   ├── StudentGrades.js
│   │   ├── StudentGrades.css
│   │   ├── TeacherReports.js
│   │   ├── TeacherReports.css
│   │   ├── StudentHistory.js
│   │   ├── StudentHistory.css
│   │   └── Achievements.js
│   ├── App.js
│   ├── App.css
│   ├── index.js
│   └── index.css
├── server/
│   └── server.js
├── package.json
└── README.md
```

## Getting Started

### Prerequisites

- Node.js (version 16 or higher)
- npm or yarn package manager

### Installation

1. **Clone the repository** (or navigate to the project directory):
   ```bash
   eg. cd /Users/xiwei/Downloads/website
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Install Chart.js for data visualization**:
   ```bash
   npm install chart.js
   ```

4. **Add required assets**:
   Ensure the following image files are in the `public/assets/` directory:
   - `logo.png` - UNSW logo
   - `moodle-icon.png` - Moodle login icon
   - `teacher.png` - Teacher avatar icon
   - `graduation.png` - Student avatar icon
   - Course and task images as needed

### Development

1. **Start the development server**:
   ```bash
   npm start
   ```

2. **Open your browser** and navigate to:
   ```
   http://localhost:3000
   ```

3. **Login**: Click the "Login with Moodle" card to simulate authentication
   - Currently uses fake authentication for development
   - Logs in as "Professor Alice Wang" with Teacher role

### Building for Production

1. **Create a production build**:
   ```bash
   npm run build
   ```

2. **Serve the build** (optional):
   ```bash
   npm install -g serve
   serve -s build
   ```

## Usage

### Teacher Workflow
1. Login with Moodle credentials
2. Access the Teacher Dashboard
3. View existing escape room games or create new ones
4. Monitor student progress and grades
5. Export reports and analytics

### Student Workflow
1. Login with Moodle credentials
2. Access the Student Dashboard
3. View enrolled courses and available escape rooms
4. Participate in escape room challenges
5. Track achievements and progress

## Authentication

The application is designed to integrate with UNSW Moodle using OAuth2 authentication. Currently, it uses fake authentication for development purposes.

### Setting up Real Moodle OAuth2 (for production)
1. Contact UNSW Moodle administrators to register your application
2. Obtain OAuth2 client credentials
3. Configure environment variables:
   ```env
   REACT_APP_MOODLE_CLIENT_ID=your-client-id
   MOODLE_CLIENT_SECRET=your-client-secret
   ```
4. Update the authentication logic in `src/App.js`

## Development Notes

- **Fake Authentication**: The current implementation uses simulated Moodle login for development
- **Component Structure**: All HTML pages have been converted to React components
- **Responsive Design**: The application is mobile-friendly and responsive
- **Accessibility**: Built-in accessibility features for inclusive learning

## Contributing

1. Create feature branches for new functionality
2. Follow React best practices and component patterns
3. Ensure responsive design across all components
4. Test authentication flows before deployment
5. Update documentation for new features

## Future Enhancements

- Real Moodle OAuth2 integration
- Advanced escape room builder with drag-and-drop interface
- Real-time collaboration features
- Enhanced analytics and reporting
- Mobile app development
- API integration for external content

## Support

For technical issues or questions:
- Contact the development team
- Refer to UNSW IT Service Centre: +61 2 9385 1333
- Email: escaperoom-support@unsw.edu.au

## License

© 2025 UNSW Sydney. All rights reserved.

This project is developed for educational purposes at the University of New South
