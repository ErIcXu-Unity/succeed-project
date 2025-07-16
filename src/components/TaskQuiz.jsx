import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import VideoPlayer from './VideoPlayer';
import './TaskQuiz.css';

const TaskQuiz = () => {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [allAnswers, setAllAnswers] = useState({}); // 存储所有题目的答案选择
  const [quizMode, setQuizMode] = useState('answering'); // 'answering' 或 'results'
  const [quizResults, setQuizResults] = useState(null); // 存储批量提交的结果
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [taskStartTime, setTaskStartTime] = useState(null); // 任务开始时间
  const [networkStatus, setNetworkStatus] = useState('checking'); // 'online', 'offline', 'checking'

  useEffect(() => {
    const fetchTaskAndQuestions = async () => {
      try {
        const user = JSON.parse(localStorage.getItem('user_data'));

        // 获取任务详情
        const taskResponse = await fetch(`http://localhost:5001/api/tasks/${taskId}`);
        if (taskResponse.ok) {
          const taskData = await taskResponse.json();
          setTask(taskData);
        }

        // 获取问题列表
        const questionsResponse = await fetch(`http://localhost:5001/api/tasks/${taskId}/questions`);
        if (questionsResponse.ok) {
          const questionsData = await questionsResponse.json();
          setQuestions(questionsData);

          // 设置任务开始时间（在所有情况下都设置）
          const startTime = new Date().toISOString();
          setTaskStartTime(startTime);

          // 尝试恢复答题进度
          if (user?.user_id) {
            const progressResponse = await fetch(`http://localhost:5001/api/tasks/${taskId}/progress?student_id=${user.user_id}`);
            if (progressResponse.ok) {
              const progressData = await progressResponse.json();
              if (progressData.has_progress) {
                setCurrentQuestionIndex(progressData.current_question_index || 0);
                setAllAnswers(progressData.answers || {});
                console.log('Progress restored:', progressData);
              }
            }
          }
        } else {
          setError('Failed to load questions');
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Error loading quiz data');
      } finally {
        setLoading(false);
      }
    };

    fetchTaskAndQuestions();
  }, [taskId]);

  // 网络状态监控
  useEffect(() => {
    const checkNetwork = async () => {
      const isConnected = await checkNetworkConnection();
      setNetworkStatus(isConnected ? 'online' : 'offline');
    };

    // 初始检查
    checkNetwork();

    // 每30秒检查一次网络状态
    const interval = setInterval(checkNetwork, 30000);

    // 监听在线/离线事件
    const handleOnline = () => {
      setNetworkStatus('online');
      checkNetwork(); // 重新验证服务器连接
    };
    const handleOffline = () => setNetworkStatus('offline');

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      clearInterval(interval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // 选择答案
  const handleAnswerSelect = (option) => {
    const currentQuestion = questions[currentQuestionIndex];
    setAllAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: option
    }));
  };

  // 保存答题进度
  const saveProgress = async () => {
    setSaving(true);
    try {
      const user = JSON.parse(localStorage.getItem('user_data'));
      const response = await fetch(`http://localhost:5001/api/tasks/${taskId}/save-progress`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          student_id: user?.user_id,
          current_question_index: currentQuestionIndex,
          answers: allAnswers
        })
      });

      if (response.ok) {
        alert('Progress saved successfully! You can resume later.');
        navigate('/student/home');
      } else {
        const errorData = await response.json();
        alert(`Failed to save progress: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error saving progress:', error);
      alert('Error saving progress. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // 导航到指定题目
  const goToQuestion = (index) => {
    if (index >= 0 && index < questions.length) {
      setCurrentQuestionIndex(index);
    }
  };

  // 检查是否所有题目都已选择
  const allQuestionsAnswered = () => {
    return questions.every(q => allAnswers[q.id]);
  };

  // 网络连接检查
  const checkNetworkConnection = async () => {
    try {
              const response = await fetch('http://localhost:5001/api/tasks', {
        method: 'GET',
        signal: AbortSignal.timeout(5000) // 5秒超时
      });
      return response.ok;
    } catch (error) {
      console.error('Network check failed:', error);
      return false;
    }
  };

  // 提交所有答案（带重试机制）
  const submitAllAnswers = async (retryCount = 0) => {
    if (!allQuestionsAnswered()) {
      alert('Please answer all questions before submitting.');
      return;
    }

    setSubmitting(true);
    
    // 首先检查网络连接
    if (retryCount === 0) {
      const isConnected = await checkNetworkConnection();
      if (!isConnected) {
        setSubmitting(false);
        if (window.confirm('⚠️ 无法连接到服务器。可能的原因：\n\n1. 后端服务器未启动\n2. 网络连接问题\n3. 服务器正在重启\n\n是否重试连接？')) {
          return submitAllAnswers(1);
        }
        return;
      }
    }

    try {
      // 构建提交数据
      const user = JSON.parse(localStorage.getItem('user_data'));
      const submitData = {
        answers: allAnswers,
        student_id: user?.user_id,
        started_at: taskStartTime  // 包含任务开始时间
      };

      console.log('Submitting data:', submitData);
      console.log('Task ID:', taskId);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10秒超时

      const response = await fetch(`http://localhost:5001/api/tasks/${taskId}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      if (response.ok) {
        const results = await response.json();
        console.log('Submit results:', results);
        setQuizResults(results);
        setQuizMode('results');
      } else {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        
        // 服务器错误处理
        if (response.status >= 500) {
          if (retryCount < 2) {
            if (window.confirm(`🔄 服务器内部错误 (${response.status})。是否重试？\n\n重试次数: ${retryCount + 1}/3`)) {
              return submitAllAnswers(retryCount + 1);
            }
          } else {
            alert('❌ 服务器错误，请稍后再试或联系管理员。');
          }
        } else {
          // 客户端错误处理
          try {
            const errorData = JSON.parse(errorText);
            alert(`❌ 提交失败: ${errorData.error || 'Unknown error'}`);
          } catch (e) {
            alert(`❌ 提交失败: HTTP ${response.status} - ${errorText || 'Unknown error'}`);
          }
        }
      }
    } catch (error) {
      console.error('Error submitting answers:', error);
      
      if (error.name === 'AbortError') {
        // 超时错误
        if (retryCount < 2) {
          if (window.confirm(`⏱️ 请求超时。是否重试？\n\n重试次数: ${retryCount + 1}/3`)) {
            return submitAllAnswers(retryCount + 1);
          }
        } else {
          alert('⏱️ 请求超时，请检查网络连接或稍后再试。');
        }
      } else if (error.message.includes('Failed to fetch')) {
        // 网络连接错误
        if (retryCount < 2) {
          if (window.confirm(`🌐 网络连接失败。可能原因：\n• 后端服务器未启动\n• 网络连接中断\n• 防火墙阻挡\n\n是否重试？\n\n重试次数: ${retryCount + 1}/3`)) {
            return submitAllAnswers(retryCount + 1);
          }
        } else {
          alert('🌐 多次尝试失败。请检查：\n• 后端服务器是否运行在 localhost:5001\n• 网络连接是否正常\n• 防火墙设置');
        }
      } else {
        // 其他错误
        alert(`❌ 提交答案时发生错误: ${error.message}`);
      }
    } finally {
      setSubmitting(false);
    }
  };

  // 重试测验
  const retryQuiz = () => {
    setAllAnswers({});
    setQuizResults(null);
    setQuizMode('answering');
    setCurrentQuestionIndex(0);
  };

  // 返回主页
  const goHome = () => {
    navigate('/student/home');
  };

  if (loading) {
    return (
      <div className="quiz-container">
        <div className="loading">
          <i className="fas fa-spinner fa-spin"></i>
          Loading quiz...
        </div>
      </div>
    );
  }

  if (error || !questions.length) {
    return (
      <div className="quiz-container">
        <div className="error">
          <i className="fas fa-exclamation-triangle"></i>
          <p>{error || 'No questions available for this task'}</p>
          <Link to={`/student/tasks/${taskId}/intro`} className="btn btn-secondary">
            <i className="fas fa-arrow-left"></i>
            Back to Task Intro
          </Link>
        </div>
      </div>
    );
  }

  // 结果显示模式
  if (quizMode === 'results') {
    return (
      <div className="quiz-container">
        <div className="quiz-header">
          <h1>{task?.name || 'Quiz'} - Results</h1>
          <div className="score-display">
            Final Score: {quizResults?.total_score || 0} points
          </div>
        </div>

        <div className="results-summary">
          <div className="summary-card">
            <h3>Quiz Complete!</h3>
            <p>You scored {quizResults?.total_score || 0} points out of {questions.reduce((sum, q) => sum + q.score, 0)} possible points.</p>
            {quizResults?.new_achievements?.length > 0 && (
              <div className="achievements">
                <h4>🏆 New Achievements Unlocked:</h4>
                {quizResults.new_achievements.map(achievement => (
                  <span key={achievement.id} className="achievement-badge">
                    {achievement.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="results-details">
          <h3>Question Details</h3>
          {questions.map((question, index) => {
            const userAnswer = allAnswers[question.id];
            const correctAnswer = quizResults?.correct_answers?.[question.id];
            const isCorrect = userAnswer === correctAnswer;
            
            // 安全获取选项文本
            const getUserAnswerText = () => {
              if (!userAnswer || !question.options) return 'Not answered';
              return question.options[userAnswer] || 'Invalid option';
            };
            
            const getCorrectAnswerText = () => {
              if (!correctAnswer || !question.options) return 'Unknown';
              return question.options[correctAnswer] || 'Invalid option';
            };
            
            return (
              <div key={question.id} className={`result-card ${isCorrect ? 'correct' : 'incorrect'}`}>
                <div className="result-header">
                  <span className="question-number">Question {index + 1}</span>
                  <span className={`result-badge ${isCorrect ? 'correct' : 'incorrect'}`}>
                    {isCorrect ? '✓ Correct' : '✗ Incorrect'}
                  </span>
                  <span className="points">
                    {isCorrect ? `+${question.score}` : '0'} points
                  </span>
                </div>
                <div className="question-text">{question.question}</div>
                <div className="answer-comparison">
                  <div className="user-answer">
                    <strong>Your answer:</strong> {userAnswer} - {getUserAnswerText()}
                  </div>
                  {!isCorrect && (
                    <div className="correct-answer">
                      <strong>Correct answer:</strong> {correctAnswer} - {getCorrectAnswerText()}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="results-actions">
          <button className="btn btn-secondary" onClick={retryQuiz}>
            <i className="fas fa-redo"></i>
            Retry Quiz
          </button>
          <button className="btn btn-primary" onClick={goHome}>
            <i className="fas fa-home"></i>
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  // 答题模式
  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
  const answeredCount = Object.keys(allAnswers).length;

  return (
    <div className="quiz-container">
      <div className="quiz-header">
        <Link to={`/student/tasks/${taskId}/intro`} className="back-link">
          <i className="fas fa-arrow-left"></i>
          Back to Intro
        </Link>
        <h1>{task?.name || 'Quiz'}</h1>
        <div className="header-right">
          <div className={`network-status ${networkStatus}`}>
            <i className={`fas ${networkStatus === 'online' ? 'fa-wifi' : networkStatus === 'offline' ? 'fa-wifi-slash' : 'fa-spinner fa-spin'}`}></i>
            <span>
              {networkStatus === 'online' ? '已连接' : 
               networkStatus === 'offline' ? '离线' : '检查中...'}
            </span>
          </div>
          <div className="answered-display">
            Answered: {answeredCount}/{questions.length}
          </div>
          <button 
            className="btn btn-secondary save-exit-btn" 
            onClick={saveProgress}
            disabled={saving || Object.keys(allAnswers).length === 0}
          >
            <i className="fas fa-save"></i>
            {saving ? 'Saving...' : 'Save & Exit'}
          </button>
        </div>
      </div>

      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${progress}%` }}></div>
        <span className="progress-text">
          Question {currentQuestionIndex + 1} of {questions.length}
        </span>
      </div>

      <VideoPlayer task={task} />

      {/* 题目导航 */}
      <div className="question-navigation">
        {questions.map((_, index) => (
          <button
            key={index}
            className={`nav-button ${index === currentQuestionIndex ? 'current' : ''} ${
              allAnswers[questions[index].id] ? 'answered' : ''
            }`}
            onClick={() => goToQuestion(index)}
          >
            {index + 1}
          </button>
        ))}
      </div>

      <div className="question-card">
        <div className="question-content">
          <h2>{currentQuestion.question}</h2>
          
          {currentQuestion.image_url && (
            <div className="question-image">
              <img src={currentQuestion.image_url} alt="Question illustration" />
            </div>
          )}

          <div className="options-grid">
            {Object.entries(currentQuestion.options).map(([option, text]) => (
              <button
                key={option}
                className={`option-button ${allAnswers[currentQuestion.id] === option ? 'selected' : ''}`}
                onClick={() => handleAnswerSelect(option)}
              >
                <span className="option-letter">{option}</span>
                <span className="option-text">{text}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="quiz-actions">
          <div className="navigation-buttons">
            <button 
              className="btn btn-secondary" 
              onClick={() => goToQuestion(currentQuestionIndex - 1)}
              disabled={currentQuestionIndex === 0}
            >
              <i className="fas fa-arrow-left"></i>
              Previous
            </button>
            
            {currentQuestionIndex === questions.length - 1 ? (
              <button 
                className={`btn btn-primary ${allQuestionsAnswered() ? '' : 'disabled'}`}
                onClick={submitAllAnswers}
                disabled={!allQuestionsAnswered() || submitting}
              >
                <i className="fas fa-paper-plane"></i>
                {submitting ? 'Submitting...' : 'Submit All Answers'}
              </button>
            ) : (
              <button 
                className="btn btn-primary"
                onClick={() => goToQuestion(currentQuestionIndex + 1)}
              >
                <i className="fas fa-arrow-right"></i>
                Next
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="quiz-info">
        <div className="difficulty-badge">
          <i className="fas fa-star"></i>
          {currentQuestion.difficulty}
        </div>
        <div className="points-badge">
          <i className="fas fa-trophy"></i>
          {currentQuestion.score} points
        </div>
      </div>
    </div>
  );
};

export default TaskQuiz; 