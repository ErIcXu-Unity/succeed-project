import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import VideoPlayer from './VideoPlayer';
import './TaskQuiz.css';

// 伪随机数生成器（基于种子）
const seedRandom = (seed) => {
  let value = seed;
  return () => {
    value = (value * 1103515245 + 12345) & 0x7fffffff;
    return value / 0x7fffffff;
  };
};

// 洗牌函数（基于种子的 Fisher-Yates 算法）
const shuffleArray = (array, seed) => {
  const shuffled = [...array];
  const rng = seedRandom(seed);
  
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  
  return shuffled;
};

// 随机化题目选项顺序，同时保持正确答案映射
const randomizeQuestionOptions = (question, seed) => {
  // 如果不是选择题类型，直接返回原题目
  if (question.question_type !== 'single_choice' && question.question_type !== 'multiple_choice') {
    return question;
  }

  // 获取原始选项
  let options = [];
  if (question.options && typeof question.options === 'object') {
    // 新格式：使用 options 对象
    options = Object.entries(question.options);
  } else if (question.option_a && question.option_b) {
    // 旧格式：使用 option_a, option_b 等字段
    options = [
      ['A', question.option_a],
      ['B', question.option_b],
      ['C', question.option_c],
      ['D', question.option_d]
    ].filter(([key, value]) => value && value.trim()); // 过滤空选项
  } else {
    return question; // 没有有效选项，返回原题目
  }

  // 使用种子随机化选项顺序
  const shuffledOptions = shuffleArray(options, seed + question.id);
  
  // 创建新的选项映射
  const newQuestion = { ...question };
  const keyMapping = {};
  
  // 根据原始格式更新选项
  if (question.options && typeof question.options === 'object') {
    // 新格式：更新 options 对象
    newQuestion.options = {};
    shuffledOptions.forEach(([originalKey, optionText], index) => {
      const newKey = String.fromCharCode(65 + index); // A, B, C, D
      newQuestion.options[newKey] = optionText;
      keyMapping[originalKey] = newKey;
    });
  } else {
    // 旧格式：更新 option_a, option_b 等字段
    // 先清空现有选项
    ['A', 'B', 'C', 'D'].forEach(key => {
      newQuestion[`option_${key.toLowerCase()}`] = null;
    });
    
    shuffledOptions.forEach(([originalKey, optionText], index) => {
      const newKey = String.fromCharCode(65 + index); // A, B, C, D
      newQuestion[`option_${newKey.toLowerCase()}`] = optionText;
      keyMapping[originalKey] = newKey;
    });
  }

  // 更新正确答案映射
  if (question.question_type === 'single_choice') {
    newQuestion.correct_answer = keyMapping[question.correct_answer] || question.correct_answer;
  } else if (question.question_type === 'multiple_choice') {
    // 多选题的正确答案可能是数组或逗号分隔的字符串
    let correctAnswers = question.correct_answer;
    if (typeof correctAnswers === 'string') {
      correctAnswers = correctAnswers.split(',').map(a => a.trim());
    }
    const mappedAnswers = correctAnswers.map(ans => keyMapping[ans] || ans);
    newQuestion.correct_answer = mappedAnswers.join(',');
  }

  // 保存映射关系用于调试
  newQuestion._originalKeyMapping = keyMapping;
  
  return newQuestion;
};

// 生成每次都不同的随机化种子
const generateStudentSeed = (studentId, taskId) => {
  // 使用学生ID、任务ID和当前时间戳创建种子，确保每次都不同
  const timestamp = Date.now();
  const combined = `${studentId}_${taskId}_${timestamp}`;
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // 转换为32位整数
  }
  return Math.abs(hash);
};

const TaskQuiz = () => {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [questionOrder, setQuestionOrder] = useState([]); // 存储题目顺序映射
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
          let shuffledIndices = null;
          
          // 如果有用户信息，进行随机化处理
          if (user?.user_id && questionsData.length > 0) {
            // 生成学生特定的种子
            const seed = generateStudentSeed(user.user_id, taskId);
            
            // 1. 创建题目顺序映射（原始索引 -> 随机化索引）
            const questionIndices = questionsData.map((_, index) => ({
              originalIndex: index,
              questionId: questionsData[index].id
            }));
            shuffledIndices = shuffleArray(questionIndices, seed);
            setQuestionOrder(shuffledIndices);
            
            // 2. 按照随机顺序重新排列题目，并随机化每个题目的选项
            const randomizedQuestions = shuffledIndices.map((orderInfo, newIndex) => {
              const originalQuestion = questionsData[orderInfo.originalIndex];
              // 随机化选项顺序（使用题目ID作为额外的种子变化）
              const randomizedQuestion = randomizeQuestionOptions(originalQuestion, seed);
              return {
                ...randomizedQuestion,
                _originalIndex: orderInfo.originalIndex, // 保存原始索引用于答案提交
                _displayIndex: newIndex // 显示索引
              };
            });
            
            setQuestions(randomizedQuestions);
          } else {
            // 没有用户信息或题目为空，使用原始顺序
            shuffledIndices = questionsData.map((_, index) => ({
              originalIndex: index,
              questionId: questionsData[index]?.id
            }));
            setQuestions(questionsData);
            setQuestionOrder(shuffledIndices);
          }

          // 设置任务开始时间（在所有情况下都设置）
          const startTime = new Date().toISOString();
          setTaskStartTime(startTime);

          // 注意：由于每次进入都有不同的随机化顺序，不再恢复答题进度
          // 每次都从第一题开始，确保完整的随机化体验
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

    // 每 30 秒检查一次网络状态
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

  // 保存答题进度 - 由于采用了每次不同的随机化，暂时禁用进度保存
  const saveProgress = async () => {
    // 由于每次进入题目顺序都不同，进度保存功能已禁用
    // 学生需要一次性完成测验
    setSaving(false);
    alert('由于题目顺序随机化，不支持保存进度。请一次性完成测验。');
    return;
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
        signal: AbortSignal.timeout(5000) // 5 秒超时
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
      // 构建提交数据 - 需要将随机化后的答案转换回原始答案
      const user = JSON.parse(localStorage.getItem('user_data'));
      
      // 转换随机化后的答案为原始答案
      const originalAnswers = {};
      Object.keys(allAnswers).forEach(questionId => {
        const userAnswer = allAnswers[questionId];
        const question = questions.find(q => q.id.toString() === questionId.toString());
        
        if (question && question._originalKeyMapping) {
          // 如果有选项映射，需要反向转换
          const reverseMapping = {};
          Object.keys(question._originalKeyMapping).forEach(originalKey => {
            const newKey = question._originalKeyMapping[originalKey];
            reverseMapping[newKey] = originalKey;
          });
          
          // 将随机化后的答案转换为原始答案
          originalAnswers[questionId] = reverseMapping[userAnswer] || userAnswer;
        } else {
          // 没有映射的题目直接使用原答案
          originalAnswers[questionId] = userAnswer;
        }
      });
      
      const submitData = {
        answers: originalAnswers, // 使用转换后的原始答案
        student_id: user?.user_id,
        started_at: taskStartTime  // 包含任务开始时间
      };

      console.log('Original user answers (randomized):', allAnswers);
      console.log('Converted answers (original format):', originalAnswers);
      console.log('Submitting data:', submitData);
      console.log('Task ID:', taskId);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 秒超时

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
            // 使用随机化后题目的正确答案，而不是后端返回的
            const correctAnswer = question.correct_answer;
            const isCorrect = userAnswer === correctAnswer;
            
            // 安全获取选项文本
            const getUserAnswerText = () => {
              if (!userAnswer) return 'Not answered';
              
              // 支持两种格式的选项
              if (question.options && typeof question.options === 'object') {
                return question.options[userAnswer] || 'Invalid option';
              } else if (question[`option_${userAnswer.toLowerCase()}`]) {
                return question[`option_${userAnswer.toLowerCase()}`];
              }
              return 'Invalid option';
            };
            
            const getCorrectAnswerText = () => {
              if (!correctAnswer) return 'Unknown';
              
              // 支持两种格式的选项
              if (question.options && typeof question.options === 'object') {
                return question.options[correctAnswer] || 'Invalid option';
              } else if (question[`option_${correctAnswer.toLowerCase()}`]) {
                return question[`option_${correctAnswer.toLowerCase()}`];
              }
              return 'Invalid option';
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
          
          {/* 文字描述 */}
          {currentQuestion.description && (
            <div className="question-description">
              <h4><i className="fas fa-info-circle"></i> 问题说明</h4>
              <p>{currentQuestion.description}</p>
            </div>
          )}
          
          {/* 图片展示 */}
          {currentQuestion.image_url && (
            <div className="question-image">
              <h4><i className="fas fa-image"></i> 图片说明</h4>
              <img 
                src={currentQuestion.image_url.startsWith('http') ? currentQuestion.image_url : `http://localhost:5001${currentQuestion.image_url}`} 
                alt="Question illustration" 
                onError={(e) => {
                  console.error('Image load error:', e.target.src);
                  e.target.style.display = 'none';
                  const parent = e.target.parentNode;
                  if (parent) {
                    const errorDiv = document.createElement('div');
                    errorDiv.className = 'media-error';
                    errorDiv.innerHTML = '<i class="fas fa-exclamation-triangle"></i> 图片加载失败';
                    parent.appendChild(errorDiv);
                  }
                }}
              />
            </div>
          )}
          
          {/* 视频展示 */}
          {currentQuestion.video_type && currentQuestion.video_url && (
            <div className="question-video">
              <h4>
                <i className={`${currentQuestion.video_type === 'youtube' ? 'fab fa-youtube' : 'fas fa-video'}`}></i> 
                视频说明
              </h4>
              {currentQuestion.video_type === 'local' ? (
                <video
                  src={currentQuestion.video_url.startsWith('http') ? currentQuestion.video_url : `http://localhost:5001${currentQuestion.video_url}`}
                  controls
                  style={{ width: '100%', maxWidth: '600px', height: 'auto', borderRadius: '8px' }}
                  onError={(e) => {
                    console.error('Video load error:', e.target.src);
                    e.target.style.display = 'none';
                    const parent = e.target.parentNode;
                    if (parent) {
                      const errorDiv = document.createElement('div');
                      errorDiv.className = 'media-error';
                      errorDiv.innerHTML = '<i class="fas fa-exclamation-triangle"></i> 视频加载失败';
                      parent.appendChild(errorDiv);
                    }
                  }}
                >
                  您的浏览器不支持视频播放
                </video>
              ) : (
                <div className="youtube-embed">
                  <iframe
                    width="100%"
                    height="400"
                    src={`https://www.youtube.com/embed/${currentQuestion.video_url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/)?.[1] || ''}`}
                    title="Question video"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    style={{ borderRadius: '8px' }}
                  ></iframe>
                </div>
              )}
            </div>
          )}

          <div className="options-grid">
            {(() => {
              // 处理两种选项格式：options对象 或 option_a, option_b等字段
              let optionsToRender = [];
              
              if (currentQuestion.options && typeof currentQuestion.options === 'object') {
                // 新格式：options 对象
                optionsToRender = Object.entries(currentQuestion.options);
              } else if (currentQuestion.option_a) {
                // 旧格式：option_a, option_b 等字段
                optionsToRender = [
                  ['A', currentQuestion.option_a],
                  ['B', currentQuestion.option_b],
                  ['C', currentQuestion.option_c],
                  ['D', currentQuestion.option_d]
                ].filter(([key, value]) => value && value.trim());
              }
              
              return optionsToRender.map(([option, text]) => (
                <button
                  key={option}
                  className={`option-button ${allAnswers[currentQuestion.id] === option ? 'selected' : ''}`}
                  onClick={() => handleAnswerSelect(option)}
                >
                  <span className="option-letter">{option}</span>
                  <span className="option-text">{text}</span>
                </button>
              ));
            })()}
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