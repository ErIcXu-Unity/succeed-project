// src/components/StudentDashboard.jsx
import React from 'react';
import { Link } from 'react-router-dom';
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

  // 为了演示，这里我给每个任务加了一个 description 字段，
  // 真实数据应该从后端 /api/tasks 接口加载
  const tasks = [
    {
      id: '1',
      title: 'Lab Escape: Solution Prep',
      course: 'Chemistry Intro',
      status: 'In Progress',
      img: '/assets/task1.jpg',
      alt: 'Lab Escape: Solution Prep',
      description: '你是一名化学新生，导师让你为接下来的实验准备溶液…'
    },
    {
      id: '2',
      title: 'Data Analysis Escape: Probability',
      course: 'Statistics',
      status: 'Not Started',
      img: '/assets/task2.jpg',
      alt: 'Data Analysis Escape: Probability Puzzle',
      description: '欢迎来到概率迷宫，在这里你需要用统计学方法破解…'
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
                <Link to={`/student/tasks/${course.id}/tasks`} className="btn btn-primary" role="button">
                  View Tasks
                </Link>
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
                <Link
                  to={`/student/tasks/${task.id}/intro`}
                  className="btn btn-primary"
                  role="button"
                >
                  {task.status === 'Not Started' ? 'Start Game' : 'Continue Game'}
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default StudentDashboard;
