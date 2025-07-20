// src/components/StudentHistory.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './StudentHistory.css';

function StudentHistory() {
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [studentName, setStudentName] = useState('');

  useEffect(() => {
    fetchStudentHistory();
  }, []);

  const fetchStudentHistory = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user_data'));
      console.log('User data from localStorage:', user);
      
      if (!user?.user_id) {
        setError('User not logged in');
        setLoading(false);
        return;
      }

      console.log('Fetching history for user:', user.user_id);

              const response = await fetch(`http://localhost:5001/api/students/${user.user_id}/history`);
      console.log('History response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('History data received:', data);
        setHistoryData(data.history);
        setStudentName(data.student_name);
      } else {
        const errorText = await response.text();
        console.error('History fetch error:', errorText);
        throw new Error(`Failed to fetch history: ${response.status}`);
      }

    } catch (error) {
      console.error('Error fetching student history:', error);
      setError(`Unable to load history: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 格式化日期显示
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  // 格式化时间显示
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 根据得分百分比获取评级
  const getScoreGrade = (percentage) => {
    if (percentage >= 90) return { grade: 'A', color: '#28a745' };
    if (percentage >= 80) return { grade: 'B', color: '#17a2b8' };
    if (percentage >= 70) return { grade: 'C', color: '#ffc107' };
    if (percentage >= 60) return { grade: 'D', color: '#fd7e14' };
    return { grade: 'F', color: '#dc3545' };
  };

  // 根据课程类型获取图标
  const getCourseIcon = (courseType) => {
    switch (courseType) {
      case 'Chemistry':
        return '🧪';
      case 'Mathematics':
        return '🔢';
      case 'Physics':
        return '⚡';
      case 'Statistics':
        return '📊';
      default:
        return '📚';
    }
  };

  // 根据课程类型获取背景图片
  const getCourseImage = (courseType) => {
    switch (courseType) {
      case 'Chemistry':
        return '/assets/course-chem.jpg';
      case 'Mathematics':
        return '/assets/course-math.jpg';
      case 'Physics':
        return '/assets/course-physics.jpg';
      case 'Statistics':
        return '/assets/course-stat.jpg';
      default:
        return '/assets/course-general.jpg';
    }
  };

  if (loading) {
    return (
      <div className="student-history-content">
        <div className="loading">
          <i className="fas fa-spinner fa-spin"></i>
          Loading your learning history...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="student-history-content">
        <div className="error">
          <i className="fas fa-exclamation-triangle"></i>
          <p>{error}</p>
          <button onClick={fetchStudentHistory} className="retry-btn">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="student-history-content">
      <div className="history-header">
        <h2>🎓 Learning History</h2>
        <p>View all completed escape room tasks</p>
        {studentName && (
          <div className="student-info">
            <span>Student: {studentName}</span>
            <span>Completed Tasks: {historyData.length}</span>
          </div>
        )}
      </div>

      {historyData.length === 0 ? (
        <div className="empty-history">
          <i className="fas fa-clipboard-list"></i>
          <h3>No tasks completed yet</h3>
          <p>Complete your first escape room task to start your learning journey!</p>
          <Link to="/student/home" className="btn btn-primary">
            Start Tasks
          </Link>
        </div>
      ) : (
        <div className="history-grid">
          {historyData.map((item, index) => {
            const scoreGrade = getScoreGrade(item.score_percentage);
            return (
              <div key={item.id} className="history-card">
                <div className="history-card-header">
                  <img 
                    src={getCourseImage(item.course_type)} 
                    alt={item.task_name}
                    onError={(e) => { e.target.src = '/assets/course-general.jpg'; }}
                  />
                  <div className="course-badge">
                    {getCourseIcon(item.course_type)} {item.course_type}
                  </div>
                  <div className="rank-badge">
                    #{index + 1}
                  </div>
                </div>
                
                <div className="history-info">
                  <h3>{item.task_name}</h3>
                  
                  <div className="score-section">
                    <div className="score-display">
                      <span className="score-number" style={{ color: scoreGrade.color }}>
                        {item.score_percentage}%
                      </span>
                      <span className="score-grade" style={{ backgroundColor: scoreGrade.color }}>
                        {scoreGrade.grade}
                      </span>
                    </div>
                    <div className="score-details">
                      Score: {item.score}/{item.max_score} points
                    </div>
                  </div>

                  <div className="task-stats">
                    <div className="stat-item">
                      <i className="fas fa-question-circle"></i>
                      <span>{item.question_count} Questions</span>
                    </div>
                    <div className="stat-item">
                      <i className="fas fa-calendar"></i>
                      <span>{formatDate(item.completed_at)}</span>
                    </div>
                    <div className="stat-item">
                      <i className="fas fa-clock"></i>
                      <span>{formatTime(item.completed_at)}</span>
                    </div>
                  </div>

                  <div className="history-actions">
                    <Link 
                      to={`/student/tasks/${item.task_id}/intro`} 
                      className="btn btn-secondary"
                    >
                      <i className="fas fa-redo"></i>
                      Retry Task
                    </Link>
                    <button 
                      className="btn btn-outline"
                      onClick={() => {
                        // Feature to view detailed feedback can be added here
                        alert(`Detailed feedback for task "${item.task_name}" coming soon!`);
                      }}
                    >
                      <i className="fas fa-chart-line"></i>
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default StudentHistory;
