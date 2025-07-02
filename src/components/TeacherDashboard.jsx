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

  const viewGrades = (taskId) => {
    navigate('/teacher/gamegrade');
  };

  const editGame = (taskId) => {
    navigate(`/teacher/tasks/${taskId}/edit`);
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
            </div>
          </div>
        ))}
      </div>

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