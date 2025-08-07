import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './TeacherStudentDetail.css';
import config from '../config';

const TeacherStudentDetail = () => {
  const { studentId } = useParams();
  const navigate = useNavigate();

  const [studentInfo, setStudentInfo] = useState(null);
  const [statistics, setStatistics] = useState(null);
  const [taskHistory, setTaskHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        setLoading(true);

        // 获取学生档案信息（包含统计）
        const profileRes = await fetch(`${config.API_BASE_URL}/api/students/${studentId}/profile`);
        if (!profileRes.ok) throw new Error('Failed to fetch profile');
        const profileData = await profileRes.json();

        // 获取任务历史记录
        const historyRes = await fetch(`${config.API_BASE_URL}/api/students/${studentId}/history`);
        if (!historyRes.ok) throw new Error('Failed to fetch history');
        const historyData = await historyRes.json();

        setStudentInfo(profileData.student_info);
        setStatistics(profileData.statistics);
        setTaskHistory(historyData.history);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStudentData();
  }, [studentId]);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading student data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <p className="error-message">Error: {error}</p>
        <button onClick={() => navigate(-1)} className="back-btn">
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="student-detail-container">
      <div className="student-profile">
        <div className="profile-header">
          <h2>Student Profile</h2>
          <button onClick={() => navigate(-1)} className="back-btn">
            &larr; Back to List
          </button>
        </div>

        <div className="profile-content">
          <div className="basic-info">
            <div className="info-card">
              <h3>Basic Information</h3>
              <p><strong>Name:</strong> {studentInfo.real_name}</p>
              <p><strong>Student ID:</strong> {studentInfo.student_id}</p>
              <p><strong>Username:</strong> {studentInfo.username}</p>
            </div>

            <div className="stats-card">
              <h3>Performance Stats</h3>
              <div className="stats-grid">
                <div className="stat-item">
                  <span className="stat-value">{statistics.accuracy_rate}%</span>
                  <span className="stat-label">Accuracy Rate</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">{statistics.average_score}%</span>
                  <span className="stat-label">Average Score</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">{statistics.completed_tasks}</span>
                  <span className="stat-label">Completed Tasks</span>
                </div>
              </div>
            </div>
          </div>

          <div className="task-history">
            <h3>Task Completion History</h3>
            {taskHistory.length > 0 ? (
              <table className="task-table">
                <thead>
                  <tr>
                    <th>Task Name</th>
                    <th>Score</th>
                    <th>Completion Date</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {taskHistory.map((task) => (
                    <tr key={task.task_id}>
                      <td>{task.task_name}</td>
                      <td>{task.score}</td>
                      <td>{new Date(task.completed_at).toLocaleDateString()}</td>
                      <td>
                        <button 
                          className="detail-btn"
                          onClick={() => navigate(`/tasks/${task.task_id}`)}
                        >
                          View Task
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="no-tasks">No completed tasks yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherStudentDetail;