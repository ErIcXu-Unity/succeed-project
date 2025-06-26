import React from 'react';
import './StudentDashboard.css';

function StudentDashboard() {
  // Fake data for demonstration; replace with API calls as needed
  const courses = [
    {
      id: 'C-1010',
      title: 'CHEM1010 Chemistry Intro',
      joined: true,
      tasksRemaining: 2,
      img: '/assets/course-chem.jpg',
      alt: 'Chemistry Intro Course'
    },
    {
      id: 'S-2020',
      title: 'STAT2020 Statistics',
      joined: true,
      tasksRemaining: 3,
      img: '/assets/course-stat.jpg',
      alt: 'Statistics Course'
    }
  ];

  const tasks = [
    {
      id: 'T-001',
      title: 'Lab Escape: Solution Prep',
      course: 'Chemistry Intro',
      status: 'In Progress',
      img: '/assets/task1.jpg',
      alt: 'Lab Escape: Solution Prep'
    },
    {
      id: 'T-002',
      title: 'Data Analysis Escape: Probability',
      course: 'Statistics',
      status: 'Not Started',
      img: '/assets/task2.jpg',
      alt: 'Data Analysis Escape: Probability Puzzle'
    }
  ];

  return (
    <div className="student-dashboard">
      <header>
        <img src="/assets/logo.png" alt="UNSW Logo" />
        <h1>Escape Room • Student Dashboard</h1>
        <a href="#" className="logout-link">Logout</a>
      </header>
      <nav>
        <ul>
          <li><a href="#home" className="active">Home</a></li>
          <li><a href="#achievements">Achievements</a></li>
          <li><a href="#history">History</a></li>
          <li><a href="#accessibility">Accessibility</a></li>
          <li><a href="#help">Help</a></li>
        </ul>
      </nav>
      <main>
        <section>
          <div className="section-title">My Courses</div>
          <div className="card-grid">
            {courses.map(course => (
              <div key={course.id} className="course-card" tabIndex="0">
                <img src={course.img} alt={course.alt} />
                <div className="info">
                  <h3>{course.title}</h3>
                  <p>Joined · {course.tasksRemaining} tasks remaining</p>
                  <a href="#tasks" className="btn btn-primary" role="button">View Tasks</a>
                </div>
              </div>
            ))}
          </div>
        </section>
        <section className="tasks-section">
          <div className="section-title">Available Escape Room Tasks</div>
          <div className="card-grid">
            {tasks.map(task => (
              <div key={task.id} className="task-card" tabIndex="0">
                <img src={task.img} alt={task.alt} />
                <div className="info">
                  <h3>{task.title}</h3>
                  <p>{task.course} · {task.status}</p>
                  <a href="#play" className="btn btn-primary" role="button">
                    {task.status === 'Not Started' ? 'Start Game' : 'Continue Game'}
                  </a>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
      <footer>
        &copy; 2025 UNSW Sydney • <a href="https://moodle.telt.unsw.edu.au">Moodle Home</a>
      </footer>
    </div>
  );
}

export default StudentDashboard;
