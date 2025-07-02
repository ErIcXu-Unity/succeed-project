// src/components/StudentDashboard.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './StudentDashboard.css';

function StudentDashboard() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // 模拟课程数据
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

  // 从API获取真实任务数据
  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/tasks');
      if (response.ok) {
        const data = await response.json();
        setTasks(data);
      } else {
        console.error('Failed to fetch tasks');
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="student-dashboard-content">
        <div className="loading">
          <i className="fas fa-spinner fa-spin"></i>
          Loading...
        </div>
      </div>
    );
  }

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
              <img src={task.image_url || '/assets/task1.jpg'} alt={task.name} />
              <div className="info">
                <h3>{task.name}</h3>
                <p>{task.question_count} questions available</p>
                <Link
                  to={`/student/tasks/${task.id}/intro`}
                  className="btn btn-primary"
                  role="button"
                >
                  View Task
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
