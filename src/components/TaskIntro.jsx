import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import VideoPlayer from './VideoPlayer';
import './TaskIntro.css';

const TaskIntro = () => {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTaskDetails();
  }, [taskId]);

  const fetchTaskDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:5001/api/tasks/${taskId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(`Task ID "${taskId}" does not exist. Please check if the URL is correct, or select a valid task from the task list.`);
        }
        throw new Error('Failed to fetch task information');
      }
      
      const taskData = await response.json();
      setTask(taskData);
    } catch (err) {
      console.error('Error fetching task details:', err);
      setError(err.message || 'Failed to load task information');
    } finally {
      setLoading(false);
    }
  };

  const handleStartQuiz = () => {
    navigate(`/student/tasks/${taskId}/quiz`);
  };

  if (loading) {
    return (
      <div className="task-intro-container">
        <div className="loading-spinner">
          <i className="fas fa-spinner fa-spin"></i>
          <p>Loading task information...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="task-intro-container">
        <div className="error-message">
          <i className="fas fa-exclamation-triangle"></i>
          <p>Error: {error}</p>
          <div className="error-actions">
            <button onClick={() => window.history.back()} className="btn-secondary">
              <i className="fas fa-arrow-left"></i>
              Go Back
            </button>
            <button onClick={() => navigate('/student')} className="btn-primary">
              <i className="fas fa-home"></i>
              Back to Task List
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="task-intro-container">
        <div className="error-message">
          <i className="fas fa-question-circle"></i>
          <p>Task information not found</p>
          <button onClick={() => window.history.back()} className="btn-secondary">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="task-intro-container">
      <div className="task-intro-content">
        {/* 任务标题 */}
        <header className="task-header">
          <h1 className="task-title">{task.name}</h1>
          <div className="task-meta">
            <span className="question-count">📝 {task.question_count} Questions</span>
          </div>
        </header>

        {/* 任务介绍 */}
        <section className="task-description">
          <h2>🎯 Task Description</h2>
          <div className="description-content">
            {task.introduction ? (
              task.introduction.split('\n').map((line, index) => (
                <p key={index}>{line}</p>
              ))
            ) : (
              <p>No task description available</p>
            )}
          </div>
        </section>

        {/* 视频播放区域 */}
        {task.video_type && task.video_url && (
          <section className="task-video">
            <h2>🎬 Task Video</h2>
            <div className="video-container">
              <VideoPlayer task={task} />
            </div>
          </section>
        )}

        {/* 开始测验按钮 */}
        <section className="task-actions">
          <div className="action-buttons">
            <button 
              onClick={() => window.history.back()} 
              className="btn-secondary"
            >
              <i className="fas fa-arrow-left"></i>
              Go Back
            </button>
            
            {task.question_count > 0 ? (
              <button 
                onClick={handleStartQuiz}
                className="btn-primary start-quiz-btn"
              >
                <i className="fas fa-play"></i>
                Start Quiz
              </button>
            ) : (
              <div className="no-questions-notice">
                <i className="fas fa-info-circle"></i>
                <span>This task has no questions yet</span>
              </div>
            )}
          </div>
        </section>

        {/* 提示信息 */}
        <section className="task-tips">
          <h3>💡 Quiz Tips</h3>
          <ul className="tips-list">
            <li>🎯 Read each question carefully and understand before answering</li>
            <li>⏰ Your response time will be recorded during the quiz</li>
            <li>🏆 Higher accuracy means higher scores</li>
            <li>📊 View detailed quiz report after completion</li>
          </ul>
        </section>
      </div>
    </div>
  );
};

export default TaskIntro; 