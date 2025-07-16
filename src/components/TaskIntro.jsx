// src/components/TaskIntro.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import VideoPlayer from './VideoPlayer';
import './TaskIntro.css';

const TaskIntro = () => {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTaskDetail();
  }, [taskId]);

  const fetchTaskDetail = async () => {
    try {
                  const response = await fetch(`http://localhost:5001/api/tasks/${taskId}`);
      if (response.ok) {
        const data = await response.json();
        setTask(data);
      } else {
        setError('Failed to load task details');
      }
    } catch (error) {
      console.error('Error fetching task:', error);
      setError('Error loading task details');
    } finally {
      setLoading(false);
    }
  };

  const handleStartTask = () => {
    navigate(`/student/tasks/${taskId}/quiz`);
  };

  if (loading) {
    return (
      <div className="task-intro-container">
        <div className="loading">
          <i className="fas fa-spinner fa-spin"></i>
          Loading task details...
        </div>
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="task-intro-container">
        <div className="error">
          <i className="fas fa-exclamation-triangle"></i>
          <p>{error || 'Task not found'}</p>
          <Link to="/student/home" className="btn btn-secondary">
            <i className="fas fa-arrow-left"></i>
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="task-intro-container">
      <div className="task-intro-header">
        <Link to="/student/home" className="back-link">
          <i className="fas fa-arrow-left"></i>
          Back to Home
        </Link>
        <h1>{task.name}</h1>
      </div>

      <div className="task-intro-content">
        {task.image_url && (
          <div className="task-image">
            <img src={task.image_url} alt={task.name} />
          </div>
        )}

        <VideoPlayer task={task} />

        <div className="task-description">
          <h2>Mission Briefing</h2>
          <div className="introduction-text">
            {task.introduction.split('\n').map((paragraph, index) => (
              paragraph.trim() && <p key={index}>{paragraph.trim()}</p>
            ))}
          </div>
        </div>

        <div className="task-stats">
          <div className="stat-box">
            <i className="fas fa-question-circle"></i>
            <span className="stat-number">{task.question_count}</span>
            <span className="stat-label">Questions</span>
          </div>
          <div className="stat-box">
            <i className="fas fa-clock"></i>
            <span className="stat-number">~{Math.max(task.question_count * 2, 5)}</span>
            <span className="stat-label">Minutes</span>
          </div>
          <div className="stat-box">
            <i className="fas fa-trophy"></i>
            <span className="stat-number">Multiple</span>
            <span className="stat-label">Attempts</span>
          </div>
        </div>

        <div className="task-actions">
          <button className="btn btn-primary btn-large" onClick={handleStartTask}>
            <i className="fas fa-play"></i>
            Start Escape Room
          </button>
          <p className="help-text">
            <i className="fas fa-info-circle"></i>
            You can retry questions if you get them wrong. Good luck!
          </p>
        </div>
      </div>
    </div>
  );
};

export default TaskIntro;
