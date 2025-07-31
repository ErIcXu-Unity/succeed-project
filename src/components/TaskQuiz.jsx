import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import VideoPlayer from './VideoPlayer';
import InteractiveQuestionRenderer from './InteractiveQuestionRenderer';
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

  const newQuestion = { ...question };

  // Multiple Choice和Single Choice使用不同的随机化策略
  if (question.question_type === 'multiple_choice') {
    // Multiple Choice: 基于数组索引的随机化
    let questionData = {};
    try {
      if (typeof question.question_data === 'string') {
        questionData = JSON.parse(question.question_data);
      } else {
        questionData = question.question_data || {};
      }
    } catch (error) {
      console.error('Error parsing question_data for randomization:', error);
      return question;
    }

    const originalOptions = questionData.options || [];
    const originalCorrectAnswers = questionData.correct_answers || [];

    if (originalOptions.length === 0) {
      return question; // 没有选项，返回原题目
    }

    // 创建索引数组进行随机化
    const optionIndices = originalOptions.map((_, index) => index);
    const shuffledIndices = shuffleArray(optionIndices, seed + question.id);

    // 重新排列选项
    const shuffledOptions = shuffledIndices.map(index => originalOptions[index]);

    // 创建索引映射：原始索引 -> 新索引
    const indexMapping = {};
    shuffledIndices.forEach((originalIndex, newIndex) => {
      indexMapping[originalIndex] = newIndex;
    });

    // 更新正确答案的索引
    const newCorrectAnswers = originalCorrectAnswers.map(originalIndex => {
      return indexMapping[originalIndex] !== undefined ? indexMapping[originalIndex] : originalIndex;
    });

    // 更新题目数据
    const newQuestionData = {
      ...questionData,
      options: shuffledOptions,
      correct_answers: newCorrectAnswers
    };

    newQuestion.question_data = JSON.stringify(newQuestionData);
    newQuestion._indexMapping = indexMapping; // 保存索引映射用于答案转换
    
    console.log('Multiple Choice randomization:', {
      originalOptions,
      shuffledOptions,
      originalCorrectAnswers,
      newCorrectAnswers,
      indexMapping
    });

  } else if (question.question_type === 'single_choice') {
    // Single Choice: 保持原有的字母映射逻辑
    let options = [];
    if (question.options && typeof question.options === 'object') {
      options = Object.entries(question.options);
    } else if (question.option_a && question.option_b) {
      options = [
        ['A', question.option_a],
        ['B', question.option_b],
        ['C', question.option_c],
        ['D', question.option_d]
      ].filter(([key, value]) => value && value.trim());
    } else {
      return question;
    }

    const shuffledOptions = shuffleArray(options, seed + question.id);
    const keyMapping = {};
    
    if (question.options && typeof question.options === 'object') {
      newQuestion.options = {};
      shuffledOptions.forEach(([originalKey, optionText], index) => {
        const newKey = String.fromCharCode(65 + index);
        newQuestion.options[newKey] = optionText;
        keyMapping[originalKey] = newKey;
      });
    } else {
      ['A', 'B', 'C', 'D'].forEach(key => {
        newQuestion[`option_${key.toLowerCase()}`] = null;
      });
      
      shuffledOptions.forEach(([originalKey, optionText], index) => {
        const newKey = String.fromCharCode(65 + index);
        newQuestion[`option_${newKey.toLowerCase()}`] = optionText;
        keyMapping[originalKey] = newKey;
      });
    }

    newQuestion.correct_answer = keyMapping[question.correct_answer] || question.correct_answer;
    newQuestion._originalKeyMapping = keyMapping;
  }

  return newQuestion;
};

// 生成会话级随机化种子（支持进度保存）
const generateStudentSeed = (studentId, taskId) => {
  const sessionKey = `quiz_session_${studentId}_${taskId}`;
  
  // 检查是否有已保存的会话种子
  const savedSession = localStorage.getItem(sessionKey);
  if (savedSession) {
    const session = JSON.parse(savedSession);
    // 如果会话未完成，使用保存的种子
    if (!session.completed) {
      console.log('🔄 使用保存的会话种子:', session.seed);
      return session.seed;
    }
  }
  
  // 生成新的会话种子
  const timestamp = Date.now();
  const combined = `${studentId}_${taskId}_${timestamp}`;
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // 转换为32位整数
  }
  const newSeed = Math.abs(hash);
  
  // 保存新的会话信息
  const newSession = {
    seed: newSeed,
    completed: false,
    startTime: new Date().toISOString()
  };
  localStorage.setItem(sessionKey, JSON.stringify(newSession));
  console.log('🆕 生成新的会话种子:', newSeed);
  
  return newSeed;
};

// 标记会话完成
const markSessionCompleted = (studentId, taskId) => {
  const sessionKey = `quiz_session_${studentId}_${taskId}`;
  const savedSession = localStorage.getItem(sessionKey);
  if (savedSession) {
    const session = JSON.parse(savedSession);
    session.completed = true;
    session.endTime = new Date().toISOString();
    localStorage.setItem(sessionKey, JSON.stringify(session));
    console.log('✅ 会话标记为已完成');
  }
};

// 重新开始会话（用于重做测验）
const restartSession = (studentId, taskId) => {
  const sessionKey = `quiz_session_${studentId}_${taskId}`;
  localStorage.removeItem(sessionKey);
  console.log('🔄 The session has been reset and will be re-randomized next time you enter');
};

const TaskQuiz = () => {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [questionOrder, setQuestionOrder] = useState([]); // 存储题目顺序映射 - 当前未使用
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [allAnswers, setAllAnswers] = useState({}); // 存储所有题目的答案选择
  const [quizMode, setQuizMode] = useState('answering'); // 'answering' 或 'results'
  const [quizResults, setQuizResults] = useState(null); // 存储批量提交的结果
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [autoSaving, setAutoSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
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
            
            // 恢复答题进度（会话级随机化支持进度保存）
            const progressResponse = await fetch(`http://localhost:5001/api/tasks/${taskId}/progress?student_id=${user.user_id}`);
            if (progressResponse.ok) {
              const progressData = await progressResponse.json();
              if (progressData.has_progress) {
                // 需要将原始题目索引转换为随机化后的索引
                const originalIndex = progressData.current_question_index || 0;
                const originalQuestionId = questionsData[originalIndex]?.id;
                const randomizedIndex = shuffledIndices?.findIndex(mapping => mapping.questionId === originalQuestionId) || 0;
                
                setCurrentQuestionIndex(randomizedIndex >= 0 ? randomizedIndex : 0);

                setAllAnswers(progressData.answers || {});
                console.log('✅ Progress has been restored, using session-level randomization to keep the order consistent');

              }
            }
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

  // 自动保存监控 - 当答案改变时触发延迟保存
  useEffect(() => {
    if (Object.keys(allAnswers).length === 0) return;

    // 设置延迟自动保存 (3秒延迟，避免频繁保存)
    const timeoutId = setTimeout(() => {
      autoSave();
    }, 3000);

    return () => clearTimeout(timeoutId);
  }, [allAnswers, networkStatus]);

  // 定期自动保存 - 每60秒保存一次（防止意外丢失）
  useEffect(() => {
    const intervalId = setInterval(() => {
      if (Object.keys(allAnswers).length > 0 && !document.hidden) {
        autoSave();
      }
    }, 60000); // 60秒

    return () => clearInterval(intervalId);
  }, [allAnswers, networkStatus]);

  // 页面可见性变化监听 - 当页面重新可见时自动保存
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && Object.keys(allAnswers).length > 0) {
        // 页面重新可见时自动保存
        autoSave();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [allAnswers, networkStatus]);

  // 页面卸载前自动保存
  useEffect(() => {
    const handleBeforeUnload = async (event) => {
      if (Object.keys(allAnswers).length > 0 && networkStatus === 'online') {
        // 尝试同步保存（在页面卸载前）
        try {
          navigator.sendBeacon(`http://localhost:5001/api/tasks/${taskId}/save-progress`, 
            JSON.stringify({
              student_id: JSON.parse(localStorage.getItem('user_data'))?.user_id,
              current_question_index: questions[currentQuestionIndex]?._originalIndex !== undefined 
                ? questions[currentQuestionIndex]._originalIndex 
                : currentQuestionIndex,
              answers: allAnswers
            })
          );
        } catch (error) {
          console.error('Failed to save on page unload:', error);
        }
        
        // 显示确认对话框
        event.preventDefault();
        return (event.returnValue = 'You have unsaved progress. Are you sure you want to leave?');
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [allAnswers, networkStatus, currentQuestionIndex, questions, taskId]);

  // 选择答案 - 支持不同问题类型
  const handleAnswerSelect = (answer) => {
    const currentQuestion = questions[currentQuestionIndex];
    setAllAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: answer
    }));
  };

  // 渲染问题文本，将 {{placeholder}} 转换为样式化的空白占位符
  const renderQuestionText = (question) => {
    const questionText = question.question || '';
    
    // 如果不是填空题或没有占位符，直接返回原文本
    if (question.question_type !== 'fill_blank' || !questionText.includes('{{')) {
      return questionText;
    }

    // 分割文本并替换占位符
    const parts = questionText.split(/\{\{[^}]+\}\}/);
    const placeholders = questionText.match(/\{\{[^}]+\}\}/g) || [];
    
    const elements = [];
    
    for (let i = 0; i < parts.length; i++) {
      // 添加文本部分
      if (parts[i]) {
        elements.push(
          <span key={`text-${i}`}>{parts[i]}</span>
        );
      }
      
      // 添加占位符（样式化的空白）
      if (i < placeholders.length) {
        const placeholderText = placeholders[i].replace(/[{}]/g, '').trim();
        elements.push(
          <span key={`placeholder-${i}`} className="question-placeholder">
            <span className="placeholder-box">
              <span className="placeholder-hint">{placeholderText}</span>
            </span>
          </span>
        );
      }
    }
    
    return <span className="question-with-placeholders">{elements}</span>;
  };

  // 保存答题进度 - 会话级随机化支持进度保存
  const saveProgress = async (showSuccessMessage = true, navigateToHome = true) => {
    setSaving(true);
    try {
      const user = JSON.parse(localStorage.getItem('user_data'));
      const currentQuestion = questions[currentQuestionIndex];
      
      // 保存原始题目索引，而不是随机化后的索引
      const originalQuestionIndex = currentQuestion?._originalIndex !== undefined 
        ? currentQuestion._originalIndex 
        : currentQuestionIndex;
      
      // 转换随机化后的答案为原始答案（与提交逻辑相同）
      const originalAnswers = {};
      Object.keys(allAnswers).forEach(questionId => {
        const userAnswer = allAnswers[questionId];
        const question = questions.find(q => q.id.toString() === questionId.toString());
        
        if (question.question_type === 'multiple_choice' && question._indexMapping && Array.isArray(userAnswer)) {
          // Multiple Choice: 使用索引映射转换答案
          const reverseIndexMapping = {};
          Object.keys(question._indexMapping).forEach(originalIndex => {
            const newIndex = question._indexMapping[originalIndex];
            reverseIndexMapping[newIndex] = parseInt(originalIndex);
          });
          
          originalAnswers[questionId] = userAnswer.map(randomizedIndex => {
            return reverseIndexMapping[randomizedIndex] !== undefined ? reverseIndexMapping[randomizedIndex] : randomizedIndex;
          });
        } else if (question && question._originalKeyMapping) {
          // Single Choice: 使用字母映射转换答案
          const reverseMapping = {};
          Object.keys(question._originalKeyMapping).forEach(originalKey => {
            const newKey = question._originalKeyMapping[originalKey];
            reverseMapping[newKey] = originalKey;
          });
          
          originalAnswers[questionId] = reverseMapping[userAnswer] || userAnswer;
        } else {
          originalAnswers[questionId] = userAnswer;
        }
      });

      const response = await fetch(`http://localhost:5001/api/tasks/${taskId}/save-progress`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          student_id: user?.user_id,
          current_question_index: originalQuestionIndex,
          answers: originalAnswers // 使用转换后的原始答案
        })
      });

      if (response.ok) {
        if (showSuccessMessage) {
          alert('Your progress has been saved successfully! You can continue answering questions later.');
        }
        if (navigateToHome) {
          navigate('/student/home');
        }
        return true;
      } else {
        const errorData = await response.json();
        if (showSuccessMessage) {
          alert(`Failed to save progress: ${errorData.error || 'Unknown error'}`);
        }
        console.error('Save progress failed:', errorData);
        return false;
      }
    } catch (error) {
      console.error('Error saving progress:', error);
      if (showSuccessMessage) {
        alert('An error occurred while saving your progress. Please try again.');
      }
      return false;
    } finally {
      setSaving(false);
    }
  };

  // 自动保存功能
  const autoSave = async () => {
    // 只有在有答案的情况下才进行自动保存
    if (Object.keys(allAnswers).length > 0 && networkStatus === 'online' && !saving && !autoSaving) {
      setAutoSaving(true);
      try {
        const success = await saveProgress(false, false); // 不显示成功消息，不跳转到主页
        if (success) {
          setLastSaved(new Date());
          console.log('✅ Auto-save successful');
        }
      } catch (error) {
        console.error('❌ Auto-save failed:', error);
      } finally {
        setAutoSaving(false);
      }
    }
  };

  // 导航到指定题目（不带自动保存，因为调用方会处理）
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
        
        if (question.question_type === 'multiple_choice' && question._indexMapping && Array.isArray(userAnswer)) {
          // Multiple Choice: 使用索引映射转换答案
          const reverseIndexMapping = {};
          Object.keys(question._indexMapping).forEach(originalIndex => {
            const newIndex = question._indexMapping[originalIndex];
            reverseIndexMapping[newIndex] = parseInt(originalIndex);
          });
          
          // 将随机化后的索引转换回原始索引
          originalAnswers[questionId] = userAnswer.map(randomizedIndex => {
            return reverseIndexMapping[randomizedIndex] !== undefined ? reverseIndexMapping[randomizedIndex] : randomizedIndex;
          });
          
          console.log('Multiple Choice answer conversion:', {
            userAnswer,
            reverseIndexMapping,
            convertedAnswer: originalAnswers[questionId]
          });
        } else if (question && question._originalKeyMapping) {
          // Single Choice: 使用字母映射转换答案
          const reverseMapping = {};
          Object.keys(question._originalKeyMapping).forEach(originalKey => {
            const newKey = question._originalKeyMapping[originalKey];
            reverseMapping[newKey] = originalKey;
          });
          
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
      
      // Debug Fill Blank questions specifically
      Object.keys(allAnswers).forEach(questionId => {
        const question = questions.find(q => q.id.toString() === questionId.toString());
        if (question && question.question_type === 'fill_blank') {
          console.log(`Fill Blank Question ${questionId}:`, {
            userAnswer: allAnswers[questionId],
            convertedAnswer: originalAnswers[questionId],
            questionType: question.question_type
          });
        }
      });

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
        console.log('Submit results detailed:', JSON.stringify(results, null, 2));
        setQuizResults(results);
        setQuizMode('results');
        
        // 标记当前会话为已完成
        const user = JSON.parse(localStorage.getItem('user_data'));
        if (user?.user_id) {
          markSessionCompleted(user.user_id, taskId);
        }
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

  // 重试测验 - 重新随机化并清空进度
  const retryQuiz = async () => {
    const user = JSON.parse(localStorage.getItem('user_data'));
    
    if (!user?.user_id) {
      console.warn('⚠️ 用户信息不存在，直接重新加载页面');
      window.location.reload();
      return;
    }

    try {
      console.log('🔄 开始重试测验，正在清除进度数据...');
      
      // 先清除后端进度数据
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5秒超时
      
      const deleteResponse = await fetch(`http://localhost:5001/api/tasks/${taskId}/progress?student_id=${user.user_id}`, {
        method: 'DELETE',
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (deleteResponse.ok) {
        console.log('✅ 后端进度数据已清除');
      } else {
        console.warn('⚠️ 后端进度清除可能失败，状态码:', deleteResponse.status);
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.warn('⚠️ 清除进度数据请求超时，继续执行重试操作');
      } else if (error.message.includes('Failed to fetch')) {
        console.warn('⚠️ 网络连接失败，无法清除后端进度数据');
      } else {
        console.warn('⚠️ 清除进度数据时发生错误:', error.message);
      }
    }
    
    // 清除前端会话数据（保持原有逻辑）
    restartSession(user.user_id, taskId);
    
    // 重新加载页面以应用新的随机化
    console.log('🔄 重新加载页面应用新的随机化');
    window.location.reload();
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
            
            // 判断答案是否正确 - 支持不同问题类型
            let isCorrect = false;
            if (question.question_type === 'fill_blank' || 
                question.question_type === 'puzzle_game' || 
                question.question_type === 'matching_task' || 
                question.question_type === 'error_spotting' ||
                question.question_type === 'multiple_choice') {
              // For complex question types and multiple choice, check backend results
              const questionResult = quizResults?.results?.find(r => r.question_id === question.id);
              isCorrect = questionResult ? questionResult.is_correct : false;
            } else {
              // For single choice questions, use direct comparison
              isCorrect = userAnswer === correctAnswer;
            }
            
            // 安全获取选项文本 - 支持不同问题类型
            const getUserAnswerText = () => {
              if (!userAnswer && userAnswer !== 0) return 'Not answered';
              
              // Handle Fill Blank questions
              if (question.question_type === 'fill_blank') {
                if (Array.isArray(userAnswer)) {
                  return (
                    <div className="fill-blank-answers">
                      {userAnswer.map((answer, index) => (
                        <span key={index} className="blank-answer-item">
                          <span className="blank-number">#{index + 1}</span>
                          <span className="blank-value">"{answer || '(empty)}'}"</span>
                        </span>
                      ))}
                    </div>
                  );
                } else {
                  // Handle case where userAnswer is not an array (probably should be)
                  return (
                    <div className="fill-blank-answers">
                      <span className="blank-answer-item">
                        <span className="blank-number">#1</span>
                        <span className="blank-value">"{userAnswer || '(empty)}'}"</span>
                      </span>
                    </div>
                  );
                }
              }
              
              // Handle Multiple Choice questions
              if (question.question_type === 'multiple_choice') {
                if (Array.isArray(userAnswer)) {
                  // Parse question_data to get options
                  let questionData = {};
                  try {
                    if (typeof question.question_data === 'string') {
                      questionData = JSON.parse(question.question_data);
                    } else {
                      questionData = question.question_data || {};
                    }
                  } catch (error) {
                    console.error('Error parsing question_data:', error);
                    questionData = {};
                  }
                  
                  const options = questionData.options || [];
                  const selectedTexts = userAnswer.map(index => {
                    if (index >= 0 && index < options.length) {
                      return options[index];
                    }
                    return `Option ${index + 1}`;
                  });
                  
                  if (selectedTexts.length === 0) {
                    return 'No options selected';
                  }
                  
                  // Display as formatted list
                  return (
                    <div className="multiple-choice-answers">
                      {selectedTexts.map((text, index) => (
                        <span key={index} className="selected-option-item">
                          {String.fromCharCode(65 + userAnswer[index])}: {text}
                        </span>
                      ))}
                    </div>
                  );
                } else {
                  return 'Invalid answer format';
                }
              }
              
              // Handle Single Choice questions
              if (question.question_type === 'single_choice') {
                if (question.options && typeof question.options === 'object') {
                  return question.options[userAnswer] || 'Invalid option';
                } else if (question[`option_${userAnswer.toLowerCase()}`]) {
                  return question[`option_${userAnswer.toLowerCase()}`];
                }
                return 'Invalid option';
              }
              
              // Handle puzzle game answers
              if (question.question_type === 'puzzle_game') {
                if (Array.isArray(userAnswer)) {
                  return (
                    <div className="puzzle-game-answer">
                      <div className="puzzle-answer-label">
                        <i className="fas fa-puzzle-piece"></i>
                        Student's Assembly:
                      </div>
                      <div className="puzzle-answer-content">
                        {userAnswer.map((fragment, index) => (
                          <span key={index} className="puzzle-answer-fragment">
                            {fragment}
                          </span>
                        )).reduce((prev, curr, index) => 
                          index === 0 ? [curr] : [...prev, <span key={`space-${index}`} className="puzzle-space"> </span>, curr], []
                        )}
                      </div>
                      <div className="puzzle-answer-text">
                        "{userAnswer.join(' ')}"
                      </div>
                    </div>
                  );
                } else {
                  return (
                    <div className="puzzle-game-answer">
                      <span className="puzzle-answer-text">"{userAnswer || '(empty)'}"</span>
                    </div>
                  );
                }
              }
              
              if (question.question_type === 'matching_task') {
                return 'Coming soon - Matching Task answers will be displayed here';
              }
              
              if (question.question_type === 'error_spotting') {
                return 'Coming soon - Error Spotting answers will be displayed here';
              }
              
              // Handle other question types
              if (question.options && typeof question.options === 'object') {
                return question.options[userAnswer] || 'Invalid option';
              } else if (question[`option_${userAnswer.toLowerCase()}`]) {
                return question[`option_${userAnswer.toLowerCase()}`];
              }
              return 'Invalid option';
            };
            
            const getCorrectAnswerText = () => {
              // Handle Fill Blank questions first (they don't use correctAnswer field)
              if (question.question_type === 'fill_blank') {
                try {
                  // Parse question_data to get correct answers
                  let questionData = {};
                  if (typeof question.question_data === 'string') {
                    questionData = JSON.parse(question.question_data);
                  } else {
                    questionData = question.question_data || {};
                  }
                  
                  const correctAnswers = questionData.blank_answers || [];
                  if (correctAnswers.length > 0) {
                    return (
                      <div className="fill-blank-answers">
                        {correctAnswers.map((answer, index) => (
                          <span key={index} className="blank-answer-item">
                            <span className="blank-number">#{index + 1}</span>
                            <span className="blank-value">"{answer}"</span>
                          </span>
                        ))}
                      </div>
                    );
                  }
                  return 'No correct answers found';
                } catch (error) {
                  console.error('Error parsing fill blank correct answers:', error);
                  return 'Error loading correct answers';
                }
              }
              
              // Handle Multiple Choice questions
              if (question.question_type === 'multiple_choice') {
                try {
                  // Parse question_data to get correct answers
                  let questionData = {};
                  if (typeof question.question_data === 'string') {
                    questionData = JSON.parse(question.question_data);
                  } else {
                    questionData = question.question_data || {};
                  }
                  
                  const options = questionData.options || [];
                  const correctIndices = questionData.correct_answers || [];
                  
                  if (correctIndices.length > 0 && options.length > 0) {
                    const correctTexts = correctIndices.map(index => {
                      if (index >= 0 && index < options.length) {
                        return {
                          letter: String.fromCharCode(65 + index),
                          text: options[index]
                        };
                      }
                      return { letter: `${index + 1}`, text: `Option ${index + 1}` };
                    });
                    
                    return (
                      <div className="multiple-choice-answers">
                        {correctTexts.map((item, index) => (
                          <span key={index} className="correct-option-item">
                            {item.letter}: {item.text}
                          </span>
                        ))}
                      </div>
                    );
                  }
                  return 'No correct answers found';
                } catch (error) {
                  console.error('Error parsing multiple choice correct answers:', error);
                  return 'Error loading correct answers';
                }
              }
              
              // Handle Single Choice questions
              if (question.question_type === 'single_choice') {
                if (!correctAnswer && correctAnswer !== 0) return 'Unknown';
                
                if (question.options && typeof question.options === 'object') {
                  return question.options[correctAnswer] || 'Invalid option';
                } else if (question[`option_${correctAnswer.toLowerCase()}`]) {
                  return question[`option_${correctAnswer.toLowerCase()}`];
                }
                return 'Invalid option';
              }
              
              // Handle puzzle game correct answers
              if (question.question_type === 'puzzle_game') {
                const correctSolution = question.puzzle_solution || '';
                const fragments = question.puzzle_fragments || [];
                
                if (correctSolution && fragments.length > 0) {
                  return (
                    <div className="puzzle-game-correct-answer">
                      <div className="puzzle-correct-label">
                        <i className="fas fa-puzzle-piece"></i>
                        Correct Assembly:
                      </div>
                      <div className="puzzle-correct-content">
                        {fragments.map((fragment, index) => (
                          <span key={index} className="puzzle-correct-fragment">
                            {fragment}
                          </span>
                        )).reduce((prev, curr, index) => 
                          index === 0 ? [curr] : [...prev, <span key={`space-${index}`} className="puzzle-space"> </span>, curr], []
                        )}
                      </div>
                      <div className="puzzle-correct-solution">
                        <strong>Solution:</strong> "{correctSolution}"
                      </div>
                    </div>
                  );
                } else {
                  return (
                    <div className="puzzle-game-correct-answer">
                      <span className="puzzle-correct-text">"{correctSolution || 'No solution available'}"</span>
                    </div>
                  );
                }
              }
              
              if (question.question_type === 'matching_task') {
                return 'Coming soon - Matching Task correct answers will be displayed here';
              }
              
              if (question.question_type === 'error_spotting') {
                return 'Coming soon - Error Spotting correct answers will be displayed here';
              }
              
              // Handle other question types
              if (!correctAnswer && correctAnswer !== 0) return 'Unknown';
              
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
                <div className="question-text">{renderQuestionText(question)}</div>
                <div className="answer-comparison">
                  <div className="user-answer">
                    <strong>Your answer:</strong> {getUserAnswerText()}
                  </div>
                  {!isCorrect && (
                    <div className="correct-answer">
                      <strong>Correct answer:</strong> {getCorrectAnswerText()}
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
              {networkStatus === 'online' ? 'Connected' : 
               networkStatus === 'offline' ? 'Offline' : 'Checking...'}
            </span>
          </div>
          <div className="auto-save-status">
            {autoSaving ? (
              <span className="auto-saving">
                <i className="fas fa-spinner fa-spin"></i>
                Auto saving...
              </span>
            ) : lastSaved ? (
              <span className="last-saved">
                <i className="fas fa-check-circle"></i>
                Saved {new Date(lastSaved).toLocaleTimeString()}
              </span>
            ) : (
              <span className="not-saved">
                <i className="fas fa-circle"></i>
                Not saved yet
              </span>
            )}
          </div>
          <div className="answered-display">
            Answered: {answeredCount}/{questions.length}
          </div>
          <button 
            className="btn btn-secondary save-exit-btn" 
            onClick={() => saveProgress()}
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
            onClick={async () => {
              await autoSave();
              goToQuestion(index);
            }}
          >
            {index + 1}
          </button>
        ))}
      </div>

      <div className="question-card">
        <div className="question-content">
          <h2>{renderQuestionText(currentQuestion)}</h2>
          
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

          {/* Interactive Question Renderer - supports all question types */}
          <div className="question-interaction">
            <InteractiveQuestionRenderer
              question={currentQuestion}
              currentAnswer={allAnswers[currentQuestion.id]}
              onAnswerChange={handleAnswerSelect}
            />
          </div>

        </div>

        <div className="quiz-actions">
          <div className="navigation-buttons">
            <button 
              className="btn btn-secondary" 
              onClick={async () => {
                await autoSave();
                goToQuestion(currentQuestionIndex - 1);
              }}
              disabled={currentQuestionIndex === 0}
            >
              <i className="fas fa-arrow-left"></i>
              Previous
            </button>
            
            {currentQuestionIndex === questions.length - 1 ? (
              <button 
                className={`btn btn-primary ${allQuestionsAnswered() ? '' : 'disabled'}`}
                onClick={async () => {
                  await autoSave();
                  submitAllAnswers();
                }}
                disabled={!allQuestionsAnswered() || submitting}
              >
                <i className="fas fa-paper-plane"></i>
                {submitting ? 'Submitting...' : 'Submit All Answers'}
              </button>
            ) : (
              <button 
                className="btn btn-primary"
                onClick={async () => {
                  await autoSave();
                  goToQuestion(currentQuestionIndex + 1);
                }}
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