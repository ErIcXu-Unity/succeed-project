// src/components/StudentDashboard.jsx
import React from 'react';
import './StudentDashboard.css';

function StudentDashboard() {
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
    <div className="student-dashboard-content">
      <section>
        <div className="section-title">My Courses</div>
        <div className="card-grid">
          {courses.map(course => (
            <div key={course.id} className="course-card" tabIndex="0">
              <img src={course.img} alt={course.alt} />
              <div className="info">
                <h3>{course.title}</h3>
                <p>Joined &middot; {course.tasksRemaining} tasks remaining</p>
                <a href="#tasks" className="btn btn-primary" role="button">
                  View Tasks
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section style={{ marginTop: '2.5rem' }}>
        <div className="section-title">Available Escape Room Tasks</div>
        <div className="card-grid">
          {tasks.map(task => (
            <div key={task.id} className="task-card" tabIndex="0">
              <img src={task.img} alt={task.alt} />
              <div className="info">
                <h3>{task.title}</h3>
                <p>{task.course} &middot; {task.status}</p>
                <a href="#play" className="btn btn-primary" role="button">
                  {task.status === 'Not Started' ? 'Start Game' : 'Continue Game'}
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default StudentDashboard;
