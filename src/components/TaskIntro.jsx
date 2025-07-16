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
          throw new Error(`任务 ID "${taskId}" 不存在。请检查 URL 是否正确，或从任务列表中选择有效的任务。`);
        }
        throw new Error('获取任务信息失败');
      }
      
      const taskData = await response.json();
      setTask(taskData);
    } catch (err) {
      console.error('获取任务详情时出错：', err);
      setError(err.message || '加载任务信息失败');
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
          <p>加载任务信息中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="task-intro-container">
        <div className="error-message">
          <i className="fas fa-exclamation-triangle"></i>
          <p>错误：{error}</p>
          <div className="error-actions">
            <button onClick={() => window.history.back()} className="btn-secondary">
              <i className="fas fa-arrow-left"></i>
              返回上页
            </button>
            <button onClick={() => navigate('/student')} className="btn-primary">
              <i className="fas fa-home"></i>
              返回任务列表
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
          <p>未找到任务信息</p>
          <button onClick={() => window.history.back()} className="btn-secondary">
            返回
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
            <span className="question-count">📝 {task.question_count} 道题目</span>
          </div>
        </header>

        {/* 任务介绍 */}
        <section className="task-description">
          <h2>🎯 任务说明</h2>
          <div className="description-content">
            {task.introduction ? (
              task.introduction.split('\n').map((line, index) => (
                <p key={index}>{line}</p>
              ))
            ) : (
              <p>暂无任务介绍</p>
            )}
          </div>
        </section>

        {/* 视频播放区域 */}
        {task.video_type && task.video_url && (
          <section className="task-video">
            <h2>🎬 任务视频</h2>
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
              返回
            </button>
            
            {task.question_count > 0 ? (
              <button 
                onClick={handleStartQuiz}
                className="btn-primary start-quiz-btn"
              >
                <i className="fas fa-play"></i>
                开始测验
              </button>
            ) : (
              <div className="no-questions-notice">
                <i className="fas fa-info-circle"></i>
                <span>此任务暂无题目</span>
              </div>
            )}
          </div>
        </section>

        {/* 提示信息 */}
        <section className="task-tips">
          <h3>💡 答题提示</h3>
          <ul className="tips-list">
            <li>🎯 仔细阅读每道题目，理解题意后再作答</li>
            <li>⏰ 答题过程中会记录您的用时</li>
            <li>🏆 正确率越高，获得的分数越多</li>
            <li>📊 完成后可查看详细的答题报告</li>
          </ul>
        </section>
      </div>
    </div>
  );
};

export default TaskIntro; 