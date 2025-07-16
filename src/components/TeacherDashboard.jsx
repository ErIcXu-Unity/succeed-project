import React, { useState, useEffect } from 'react';
import './TeacherDashboard.css';
import { useNavigate } from 'react-router-dom';
import QuestionCreateModal from './QuestionCreateModal';

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);

  const stats = {
    totalGames: 12,
    totalStudents: 86,
    avgCompletion: 75
  };

  // 获取任务列表
  useEffect(() => {
    fetchTasks();
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

  const viewGrades = (taskId) => {
    navigate('/teacher/gamegrade');
  };

  const editGame = (taskId) => {
    navigate(`/teacher/tasks/${taskId}/edit`);
  };

  const createNewTask = () => {
    navigate('/teacher/tasks/new');
  };

  const confirmDeleteTask = (task) => {
    setTaskToDelete(task);
    setShowDeleteConfirm(true);
  };

  const deleteTask = async () => {
    if (!taskToDelete) return;

    setDeleting(true);
    try {
              const response = await fetch(`http://localhost:5001/api/tasks/${taskToDelete.id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        // 删除成功，刷新任务列表
        await fetchTasks();
        alert(`Task "${taskToDelete.name}" deleted successfully!`);
      } else {
        const errorData = await response.json();
        alert(`Failed to delete task: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error deleting task:', error);
      alert('Error deleting task. Please try again.');
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
      setTaskToDelete(null);
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setTaskToDelete(null);
  };

  const createQuestion = (taskId) => {
    setSelectedTaskId(taskId);
    setIsModalOpen(true);
  };

  const handleQuestionCreated = (newQuestion) => {
    console.log('New question created:', newQuestion);
    // 可以在这里添加成功通知
    alert('Question created successfully!');
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedTaskId(null);
  };

  if (loading) {
    return (
      <div className="main-content">
        <div className="loading">
          <i className="fas fa-spinner fa-spin"></i>
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className="main-content">
      <div className="stats">
        <div className="stat-box">Total Games: {stats.totalGames}</div>
        <div className="stat-box">Total Students: {stats.totalStudents}</div>
        <div className="stat-box">Avg Completion: {stats.avgCompletion}%</div>
      </div>

      {/* 新建任务按钮 */}
      <div className="create-task-section">
        <button className="create-task-btn" onClick={createNewTask}>
          <i className="fas fa-plus-circle"></i>
          Create New Task
        </button>
      </div>

      <div className="card-container">
        {tasks.map((task) => (
          <div key={task.id} className="card">
            <img src="/assets/game01.jpg" alt={task.name} />
            <div className="card-title">{task.name}</div>
            <div className="card-buttons">
              <button className="grade-btn" onClick={() => viewGrades(task.id)}>
                <i className="fas fa-chart-line"></i> Grades
              </button>
              <button className="edit-btn" onClick={() => editGame(task.id)}>
                <i className="fas fa-edit"></i> Edit
              </button>
              <button className="create-btn" onClick={() => createQuestion(task.id)}>
                <i className="fas fa-plus"></i> Add Question
              </button>
              <button className="delete-btn" onClick={() => confirmDeleteTask(task)}>
                <i className="fas fa-trash"></i> Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* 删除确认对话框 */}
      {showDeleteConfirm && (
        <div className="delete-confirm-overlay">
          <div className="delete-confirm-modal">
            <h3>Confirm Delete</h3>
            <p>
              Are you sure you want to delete the task "{taskToDelete?.name}"?
              <br />
              This will permanently remove all questions, student results, and progress data.
            </p>
            <div className="delete-confirm-buttons">
              <button
                className="btn btn-secondary"
                onClick={cancelDelete}
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                className="btn btn-danger"
                onClick={deleteTask}
                disabled={deleting}
              >
                {deleting ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i>
                    Deleting...
                  </>
                ) : (
                  <>
                    <i className="fas fa-trash"></i>
                    Delete Task
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 问题创建模态框 */}
      <QuestionCreateModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSubmit={handleQuestionCreated}
        taskId={selectedTaskId}
      />
    </div>
  );
};

export default TeacherDashboard;