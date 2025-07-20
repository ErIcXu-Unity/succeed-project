// src/components/StudentDashboard.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './StudentDashboard.css';

function StudentDashboard() {
  const [tasks, setTasks] = useState([]);
  const [taskProgress, setTaskProgress] = useState({});
  const [loading, setLoading] = useState(true);

  // 从API获取真实任务数据
  useEffect(() => {
    fetchTasks();
    fetchTaskProgress();
  }, []);

  const fetchTasks = async () => {
    try {
              //const response = await fetch('http://localhost:5001/api/tasks');
      const user = JSON.parse(localStorage.getItem('user_data'));
      const role = user?.role === 'tea' ? 'tea' : 'stu';
              const response = await fetch(`http://localhost:5001/api/tasks?role=${role}`);
      
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

  const fetchTaskProgress = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user_data'));
      if (user?.user_id) {
        const response = await fetch(`http://localhost:5001/api/students/${user.user_id}/task-progress`);
        if (response.ok) {
          const data = await response.json();
          setTaskProgress(data);
        } else {
          console.error('Failed to fetch task progress');
        }
      }
    } catch (error) {
      console.error('Error fetching task progress:', error);
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
        <div className="section-title">Available Escape Room Tasks</div>
        <div className="card-grid">
          {tasks.map(task => {
            const hasProgress = taskProgress[task.id]?.has_progress;
            return (
              <div key={task.id} className="task-card" tabIndex="0">
                <img src={task.image_url || '/assets/task1.jpg'} alt={task.name} />
                <div className="info">
                  <h3>{task.name}</h3>
                  <p>{task.question_count} questions available</p>
                  {hasProgress && (
                    <p className="progress-indicator">
                      <i className="fas fa-clock"></i>
                      Progress saved - Continue where you left off
                    </p>
                  )}
                  <Link
                    to={hasProgress ? `/student/tasks/${task.id}/quiz` : `/student/tasks/${task.id}/intro`}
                    className={`btn ${hasProgress ? 'btn-resume' : 'btn-primary'}`}
                    role="button"
                  >
                    <i className={`fas ${hasProgress ? 'fa-play-circle' : 'fa-eye'}`}></i>
                    {hasProgress ? 'Resume Challenge' : 'View Task'}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

export default StudentDashboard;
