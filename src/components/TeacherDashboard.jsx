import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './TeacherDashboard.css';

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
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

  const handleCreateTask = () => {
    navigate('/teacher/tasks/new');
  };

  const handleEditTask = (taskId) => {
    navigate(`/teacher/tasks/${taskId}/edit`);
  };

  const handleDeleteTask = async (taskId) => {
    setDeleting(true);
    try {
      const response = await fetch(`http://localhost:5001/api/tasks/${taskId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        // 删除成功，重新获取任务列表
        await fetchTasks();
        setDeleteConfirm(null);
        alert('Task deleted successfully!');
      } else {
        const errorData = await response.json();
        alert(`Failed to delete task: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error deleting task:', error);
      alert('Error deleting task. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  const handleGradeTask = (taskId) => {
    // 这里可以导航到成绩页面
    alert(`Grading feature for task ${taskId} - Coming soon!`);
  };

  if (loading) {
    return (
      <div className="main-content">
        <div className="loading">
          <i className="fas fa-spinner fa-spin"></i>
          Loading tasks...
        </div>
      </div>
    );
  }

  return (
    <div className="teacher-dashboard-container">
      {/* Dashboard Header */}
      <div className="dashboard-header">
        <div className="header-content">
          <h1 className="dashboard-title">
            <i className="fas fa-chalkboard-teacher"></i>
            Teacher Dashboard
          </h1>
          <button className="create-task-btn" onClick={handleCreateTask}>
            <i className="fas fa-plus"></i>
            Create New Task
          </button>
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="dashboard-content">
        {/* Statistics Cards */}
        <div className="stats-section">
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon tasks">
                <i className="fas fa-tasks"></i>
              </div>
              <div className="stat-info">
                <h3>{tasks.length}</h3>
                <p>Total Tasks</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon students">
                <i className="fas fa-users"></i>
              </div>
              <div className="stat-info">
                <h3>24</h3>
                <p>Active Students</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon completion">
                <i className="fas fa-chart-line"></i>
              </div>
              <div className="stat-info">
                <h3>78%</h3>
                <p>Completion Rate</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon published">
                <i className="fas fa-eye"></i>
              </div>
              <div className="stat-info">
                <h3>{tasks.filter(task => task.publish_at).length}</h3>
                <p>Published Tasks</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tasks Section */}
        <div className="tasks-section">
          <div className="section-header">
            <h2 className="section-title">
              <i className="fas fa-clipboard-list"></i>
              Existing Tasks
            </h2>
            <div className="tasks-count">
              {tasks.length} {tasks.length === 1 ? 'Task' : 'Tasks'}
            </div>
          </div>
          
          <div className="tasks-grid">
            {tasks.length === 0 ? (
              <div className="no-tasks">
                <div className="no-tasks-content">
                  <i className="fas fa-clipboard"></i>
                  <h3>No tasks yet</h3>
                  <p>Create your first task to get started!</p>
                </div>
              </div>
            ) : (
              tasks.map(task => (
                <div key={task.id} className="task-card">
                  <div className="task-card-header">
                    <img 
                      src={task.image_url || '/assets/task1.jpg'} 
                      alt={task.name}
                      onError={(e) => {
                        e.target.src = '/assets/task1.jpg';
                      }}
                      className="task-image"
                    />
                    {task.publish_at && (
                      <div className="task-status published">
                        <i className="fas fa-eye"></i>
                        Published
                      </div>
                    )}
                  </div>
                  
                  <div className="task-card-content">
                    <h3 className="task-title">{task.name}</h3>
                    <div className="task-meta">
                      <span className="question-count">
                        <i className="fas fa-question-circle"></i>
                        {task.question_count} questions
                      </span>
                      {task.publish_at && (
                        <span className="publish-date">
                          <i className="fas fa-calendar"></i>
                          {new Date(task.publish_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="task-card-actions">
                    <button 
                      className="action-btn grade-btn"
                      onClick={() => handleGradeTask(task.id)}
                      title="Grade submissions"
                    >
                      <i className="fas fa-star"></i>
                      <span>Grade</span>
                    </button>
                    <button 
                      className="action-btn edit-btn"
                      onClick={() => handleEditTask(task.id)}
                      title="Edit task"
                    >
                      <i className="fas fa-edit"></i>
                      <span>Edit</span>
                    </button>
                    <button 
                      className="action-btn delete-btn"
                      onClick={() => setDeleteConfirm(task)}
                      title="Delete task"
                    >
                      <i className="fas fa-trash"></i>
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 删除确认对话框 */}
      {deleteConfirm && (
        <div className="delete-confirm-overlay">
          <div className="delete-confirm-modal">
            <h3>
              <i className="fas fa-exclamation-triangle"></i>
              Delete Task
            </h3>
            <p>
              Are you sure you want to delete <strong>"{deleteConfirm.name}"</strong>?
              <br />
              This action cannot be undone. All questions and student progress will be lost.
            </p>
            <div className="delete-confirm-buttons">
              <button 
                className="btn btn-secondary"
                onClick={() => setDeleteConfirm(null)}
                disabled={deleting}
              >
                <i className="fas fa-times"></i>
                Cancel
              </button>
              <button 
                className="btn btn-danger"
                onClick={() => handleDeleteTask(deleteConfirm.id)}
                disabled={deleting}
              >
                <i className="fas fa-trash"></i>
                {deleting ? 'Deleting...' : 'Delete Task'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherDashboard; 