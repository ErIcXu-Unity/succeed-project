// src/components/TaskIntro.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './TaskIntro.css';

export default function TaskIntro() {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // 从后端拉取这条任务的详情，假设后端支持 GET /api/tasks/:taskId
    fetch(`/api/tasks/${taskId}`)
      .then(res => {
        if (!res.ok) throw new Error('无法加载任务详情');
        return res.json();
      })
      .then(data => setTask(data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [taskId]);

  if (loading) return <p>正在加载任务简介……</p>;
  if (error)   return <p style={{ color: 'red' }}>{error}</p>;
  if (!task)  return <p>未找到该任务。</p>;

  return (
    <div className="task-intro">
      <h2 className="task-title">{task.name}</h2>
      <div className="task-description" style={{ whiteSpace: 'pre-wrap' }}>
        {task.description || '暂无简介'}
      </div>
      <button
        className="start-btn"
        onClick={() => navigate(`/student/tasks/${taskId}/game`)}
      >
        Start Game
      </button>
    </div>
  );
}
