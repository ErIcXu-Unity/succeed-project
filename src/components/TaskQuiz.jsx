import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import VideoPlayer from './VideoPlayer';
import InteractiveQuestionRenderer from './InteractiveQuestionRenderer';
import { useAlert } from './CustomAlert';
import './TaskQuiz.css';
import config from '../config';

// Pseudo-random number generator (seed-based)
const seedRandom = (seed) => {
  let value = seed;
  return () => {
    value = (value * 1103515245 + 12345) & 0x7fffffff;
    return value / 0x7fffffff;
  };
};

// Shuffle function (seed-based Fisher-Yates algorithm)
const shuffleArray = (array, seed) => {
  const shuffled = [...array];
  const rng = seedRandom(seed);
  
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  
  return shuffled;
};

// Randomize question option order while maintaining correct answer mapping
const randomizeQuestionOptions = (question, seed) => {
  // If not a choice question type, return original question directly
  if (question.question_type !== 'single_choice' && question.question_type !== 'multiple_choice') {
    return question;
  }

  const newQuestion = { ...question };

  // Multiple Choice and Single Choice use different randomization strategies
  if (question.question_type === 'multiple_choice') {
    // Multiple Choice: array index-based randomization
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
      return question; // No options, return original question
    }

    // Create index array for randomization
    const optionIndices = originalOptions.map((_, index) => index);
    const shuffledIndices = shuffleArray(optionIndices, seed + question.id);

    // Rearrange options
    const shuffledOptions = shuffledIndices.map(index => originalOptions[index]);

    // Create index mapping: original index -> new index
    const indexMapping = {};
    shuffledIndices.forEach((originalIndex, newIndex) => {
      indexMapping[originalIndex] = newIndex;
    });

    // Update correct answer indices
    const newCorrectAnswers = originalCorrectAnswers.map(originalIndex => {
      return indexMapping[originalIndex] !== undefined ? indexMapping[originalIndex] : originalIndex;
    });

    // Update question data
    const newQuestionData = {
      ...questionData,
      options: shuffledOptions,
      correct_answers: newCorrectAnswers
    };

    newQuestion.question_data = JSON.stringify(newQuestionData);
    newQuestion._indexMapping = indexMapping; // Save index mapping for answer conversion
    
    console.log('Multiple Choice randomization:', {
      originalOptions,
      shuffledOptions,
      originalCorrectAnswers,
      newCorrectAnswers,
      indexMapping
    });

  } else if (question.question_type === 'single_choice') {
    // Single Choice: maintain original letter mapping logic
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

// Generate session-level randomization seed (supports progress saving)
const generateStudentSeed = (studentId, taskId) => {
  const sessionKey = `quiz_session_${studentId}_${taskId}`;
  
  // Check if there's a saved session seed
  const savedSession = localStorage.getItem(sessionKey);
  if (savedSession) {
    const session = JSON.parse(savedSession);
    // If session is incomplete, use saved seed
    if (!session.completed) {
      console.log('🔄 Use a saved session seed:', session.seed);
      return session.seed;
    }
  }
  
  // Generate new session seed
  const timestamp = Date.now();
  const combined = `${studentId}_${taskId}_${timestamp}`;
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  const newSeed = Math.abs(hash);
  
  // Save new session information
  const newSession = {
    seed: newSeed,
    completed: false,
    startTime: new Date().toISOString()
  };
  localStorage.setItem(sessionKey, JSON.stringify(newSession));
  console.log('🆕 Generated new session seed:', newSeed);
  
  return newSeed;
};

// Mark session as completed
const markSessionCompleted = (studentId, taskId) => {
  const sessionKey = `quiz_session_${studentId}_${taskId}`;
  const savedSession = localStorage.getItem(sessionKey);
  if (savedSession) {
    const session = JSON.parse(savedSession);
    session.completed = true;
    session.endTime = new Date().toISOString();
    localStorage.setItem(sessionKey, JSON.stringify(session));
    console.log('✅ Session marked as completed');
  }
};

// Restart session (for retaking quiz)
const restartSession = (studentId, taskId) => {
  const sessionKey = `quiz_session_${studentId}_${taskId}`;
  localStorage.removeItem(sessionKey);
  console.log('🔄 The session has been reset and will be re-randomized next time you enter');
};

const TaskQuiz = () => {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const alert = useAlert();
  const [task, setTask] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [questionOrder, setQuestionOrder] = useState([]); // Store question order mapping - currently unused
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [allAnswers, setAllAnswers] = useState({}); // Store all question answer selections
  const [quizMode, setQuizMode] = useState('answering'); // 'answering' or 'results'
  const [quizResults, setQuizResults] = useState(null); // Store batch submission results
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [autoSaving, setAutoSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [error, setError] = useState('');
  const [taskStartTime, setTaskStartTime] = useState(null); // Task start time
  const [networkStatus, setNetworkStatus] = useState('checking'); // 'online', 'offline', 'checking'

  // Extract fetchTaskAndQuestions to component top level so it can be called from other functions
  const fetchTaskAndQuestions = useCallback(async () => {
      try {
        const user = JSON.parse(localStorage.getItem('user_data'));

        // Get task details
        const taskResponse = await fetch(`${config.API_BASE_URL}/api/tasks/${taskId}`);
        if (taskResponse.ok) {
          const taskData = await taskResponse.json();
          setTask(taskData);
        }

        // Get questions list
        const questionsResponse = await fetch(`${config.API_BASE_URL}/api/tasks/${taskId}/questions`);
        if (questionsResponse.ok) {
          const questionsData = await questionsResponse.json();
          let shuffledIndices = null;
          
          // If user info exists, perform randomization
          if (user?.user_id && questionsData.length > 0) {
            // Generate student-specific seed
            const seed = generateStudentSeed(user.user_id, taskId);
            
            // 1. Create question order mapping (original index -> randomized index)
            const questionIndices = questionsData.map((_, index) => ({
              originalIndex: index,
              questionId: questionsData[index].id
            }));
            shuffledIndices = shuffleArray(questionIndices, seed);
            setQuestionOrder(shuffledIndices);
            
            // 2. Rearrange questions in random order and randomize each question's options
            const randomizedQuestions = shuffledIndices.map((orderInfo, newIndex) => {
              const originalQuestion = questionsData[orderInfo.originalIndex];
              // Randomize option order (use question ID as additional seed variation)
              const randomizedQuestion = randomizeQuestionOptions(originalQuestion, seed);
              return {
                ...randomizedQuestion,
                _originalIndex: orderInfo.originalIndex, // Save original index for answer submission
                _displayIndex: newIndex // Display index
              };
            });
            
            setQuestions(randomizedQuestions);
            
            // Restore quiz progress (session-level randomization supports progress saving)
            const progressResponse = await fetch(`${config.API_BASE_URL}/api/tasks/${taskId}/progress?student_id=${user.user_id}`);
            if (progressResponse.ok) {
              const progressData = await progressResponse.json();
              if (progressData.has_progress) {
                // Need to convert original question index to randomized index
                const originalIndex = progressData.current_question_index || 0;
                const originalQuestionId = questionsData[originalIndex]?.id;
                const randomizedIndex = shuffledIndices?.findIndex(mapping => mapping.questionId === originalQuestionId) || 0;
                
                setCurrentQuestionIndex(randomizedIndex >= 0 ? randomizedIndex : 0);

                // Need to convert original answers to current randomized format
                const convertedAnswers = {};
                const originalAnswers = progressData.answers || {};
                
                Object.keys(originalAnswers).forEach(questionId => {
                  const originalAnswer = originalAnswers[questionId];
                  const question = randomizedQuestions.find(q => q.id.toString() === questionId.toString());
                  
                  if (question?.question_type === 'multiple_choice' && question._indexMapping && Array.isArray(originalAnswer)) {
                    // Multiple Choice: convert original indices to current randomized indices
                    convertedAnswers[questionId] = originalAnswer.map(originalIndex => {
                      return question._indexMapping[originalIndex] !== undefined ? question._indexMapping[originalIndex] : originalIndex;
                    });
                    console.log('📥 Multiple choice restore:', originalAnswer, '→', convertedAnswers[questionId]);
                  } else if (question?._originalKeyMapping) {
                    // Single Choice: convert original letters to current randomized letters
                    convertedAnswers[questionId] = question._originalKeyMapping[originalAnswer] || originalAnswer;
                    console.log('📥 Single choice restore:', originalAnswer, '→', convertedAnswers[questionId]);
                  } else {
                    convertedAnswers[questionId] = originalAnswer;
                  }
                });
                
                setAllAnswers(convertedAnswers);
                console.log('✅ Progress restored, answers converted to current randomized format');

              }
            }
          } else {
            // No user info or empty questions, use original order
            shuffledIndices = questionsData.map((_, index) => ({
              originalIndex: index,
              questionId: questionsData[index]?.id
            }));
            setQuestions(questionsData);
            setQuestionOrder(shuffledIndices);
          }

          // Set task start time (set in all cases)
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
  }, [taskId]);

  useEffect(() => {
    fetchTaskAndQuestions();
  }, [fetchTaskAndQuestions]);

  // Network status monitoring
  useEffect(() => {
    const checkNetwork = async () => {
      const isConnected = await checkNetworkConnection();
      setNetworkStatus(isConnected ? 'online' : 'offline');
    };

    // Initial check
    checkNetwork();

    // Check network status every 30 seconds
    const interval = setInterval(checkNetwork, 30000);

    // Listen for online/offline events
    const handleOnline = () => {
      setNetworkStatus('online');
      checkNetwork(); // Re-verify server connection
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

  // Auto-save monitoring - trigger delayed save when answers change
  useEffect(() => {
    if (Object.keys(allAnswers).length === 0) return;

    // Set delayed auto-save (3 second delay to avoid frequent saves)
    const timeoutId = setTimeout(() => {
      autoSave();
    }, 3000);

    return () => clearTimeout(timeoutId);
  }, [allAnswers, networkStatus]);

  // Regular auto-save - save every 60 seconds (prevent accidental loss)
  useEffect(() => {
    const intervalId = setInterval(() => {
      if (Object.keys(allAnswers).length > 0 && !document.hidden) {
        autoSave();
      }
    }, 60000); // 60 seconds

    return () => clearInterval(intervalId);
  }, [allAnswers, networkStatus]);

  // Page visibility change listener - auto-save when page becomes visible again
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && Object.keys(allAnswers).length > 0) {
        // Auto-save when page becomes visible again
        autoSave();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [allAnswers, networkStatus]);

  // Auto-save before page unload
  useEffect(() => {
    const handleBeforeUnload = async (event) => {
      if (Object.keys(allAnswers).length > 0 && networkStatus === 'online') {
        // Try synchronous save (before page unload)
        try {
          navigator.sendBeacon(`${config.API_BASE_URL}/api/tasks/${taskId}/save-progress`, 
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
        
        // Show confirmation dialog
        event.preventDefault();
        return (event.returnValue = 'You have unsaved progress. Are you sure you want to leave?');
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [allAnswers, networkStatus, currentQuestionIndex, questions, taskId]);

  // Select answer - supports different question types
  const handleAnswerSelect = (answer) => {
    const currentQuestion = questions[currentQuestionIndex];
    setAllAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: answer
    }));
  };

  // Render question text, convert {{placeholder}} to styled blank placeholders
  const renderQuestionText = (question) => {
    const questionText = question.question || '';
    
    // If not fill-in-blank question or no placeholders, return original text directly
    if (question.question_type !== 'fill_blank' || !questionText.includes('{{')) {
      return questionText;
    }

    // Split text and replace placeholders
    const parts = questionText.split(/\{\{[^}]+\}\}/);
    const placeholders = questionText.match(/\{\{[^}]+\}\}/g) || [];
    
    const elements = [];
    
    for (let i = 0; i < parts.length; i++) {
      // Add text parts
      if (parts[i]) {
        elements.push(
          <span key={`text-${i}`}>{parts[i]}</span>
        );
      }
      
      // Add placeholders (styled blanks)
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

  // Save quiz progress - session-level randomization supports progress saving
  const saveProgress = async (showSuccessMessage = true, navigateToHome = true) => {
    setSaving(true);
    try {
      const user = JSON.parse(localStorage.getItem('user_data'));
      const currentQuestion = questions[currentQuestionIndex];
      
      // Save original question index, not randomized index
      const originalQuestionIndex = currentQuestion?._originalIndex !== undefined 
        ? currentQuestion._originalIndex 
        : currentQuestionIndex;
      
      // Convert randomized answers to original answers (same as submission logic)
      const originalAnswers = {};
      Object.keys(allAnswers).forEach(questionId => {
        const userAnswer = allAnswers[questionId];
        const question = questions.find(q => q.id.toString() === questionId.toString());
        
        if (question.question_type === 'multiple_choice' && question._indexMapping && Array.isArray(userAnswer)) {
          // Multiple Choice: use index mapping to convert answers
          const reverseIndexMapping = {};
          Object.keys(question._indexMapping).forEach(originalIndex => {
            const newIndex = question._indexMapping[originalIndex];
            reverseIndexMapping[newIndex] = parseInt(originalIndex);
          });
          
          originalAnswers[questionId] = userAnswer.map(randomizedIndex => {
            return reverseIndexMapping[randomizedIndex] !== undefined ? reverseIndexMapping[randomizedIndex] : randomizedIndex;
          });
          
          console.log('💾 Multiple choice save:', userAnswer, '→', originalAnswers[questionId]);
        } else if (question && question._originalKeyMapping) {
          // Single Choice: use letter mapping to convert answers
          const reverseMapping = {};
          Object.keys(question._originalKeyMapping).forEach(originalKey => {
            const newKey = question._originalKeyMapping[originalKey];
            reverseMapping[newKey] = originalKey;
          });
          
          originalAnswers[questionId] = reverseMapping[userAnswer] || userAnswer;
          
          console.log('💾 Single choice save:', userAnswer, '→', originalAnswers[questionId]);
        } else {
          originalAnswers[questionId] = userAnswer;
          console.log('💾 SAVE PROGRESS - No Mapping:', {
            questionId,
            questionType: question?.question_type,
            userAnswer,
            directlySaved: true
          });
        }
      });
      
      console.log('💾 Save progress:', Object.keys(allAnswers).length, 'answers');

      const response = await fetch(`${config.API_BASE_URL}/api/tasks/${taskId}/save-progress`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          student_id: user?.user_id,
          current_question_index: originalQuestionIndex,
          answers: originalAnswers // Use converted original answers
        })
      });

      if (response.ok) {
        if (showSuccessMessage) {
          alert.success('Your progress has been saved successfully! You can continue answering questions later.');
        }
        if (navigateToHome) {
          navigate('/student/home');
        }
        return true;
      } else {
        const errorData = await response.json();
        if (showSuccessMessage) {
          alert.error(`Failed to save progress: ${errorData.error || 'Unknown error'}`);
        }
        console.error('Save progress failed:', errorData);
        return false;
      }
    } catch (error) {
      console.error('Error saving progress:', error);
      if (showSuccessMessage) {
        alert.error('An error occurred while saving your progress. Please try again.');
      }
      return false;
    } finally {
      setSaving(false);
    }
  };

  // Auto-save function
  const autoSave = async () => {
    // Only auto-save when there are answers
    if (Object.keys(allAnswers).length > 0 && networkStatus === 'online' && !saving && !autoSaving) {
      setAutoSaving(true);
      try {
        const success = await saveProgress(false, false); // Don't show success message, don't navigate to home
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

  // Navigate to specified question (no auto-save as caller handles it)
  const goToQuestion = (index) => {
    if (index >= 0 && index < questions.length) {
      setCurrentQuestionIndex(index);
    }
  };

  // Check if all questions have been answered
  const allQuestionsAnswered = () => {
    return questions.every(q => allAnswers[q.id]);
  };

  // Network connection check
  const checkNetworkConnection = async () => {
    try {
      const response = await fetch(`${config.API_BASE_URL}/api/tasks`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });
      return response.ok;
    } catch (error) {
      console.error('Network check failed:', error);
      return false;
    }
  };

  // Submit all answers (with retry mechanism)
  const submitAllAnswers = async (retryCount = 0) => {
    if (!allQuestionsAnswered()) {
      alert.warning('Please answer all questions before submitting.');
      return;
    }

    setSubmitting(true);
    
    // 首先检查网络连接
    if (retryCount === 0) {
      const isConnected = await checkNetworkConnection();
      if (!isConnected) {
        setSubmitting(false);   
        const shouldRetry = await alert.confirm('⚠️ Unable to connect to the server. Possible reasons: \n\n1. Backend server not running\n2. Network connection problem\n3. Server is restarting\n\nDo you want to retry?');
        if (shouldRetry) {
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
          // Multiple Choice: use index mapping to convert answers
          const reverseIndexMapping = {};
          Object.keys(question._indexMapping).forEach(originalIndex => {
            const newIndex = question._indexMapping[originalIndex];
            reverseIndexMapping[newIndex] = parseInt(originalIndex);
          });
          
          // Convert randomized index back to original index
          originalAnswers[questionId] = userAnswer.map(randomizedIndex => {
            return reverseIndexMapping[randomizedIndex] !== undefined ? reverseIndexMapping[randomizedIndex] : randomizedIndex;
          });
          
          console.log('🚀 Multiple choice submission:', userAnswer, '→', originalAnswers[questionId]);
        } else if (question && question._originalKeyMapping) {
          // Single Choice: use letter mapping to convert answers
          const reverseMapping = {};
          Object.keys(question._originalKeyMapping).forEach(originalKey => {
            const newKey = question._originalKeyMapping[originalKey];
            reverseMapping[newKey] = originalKey;
          });
          
          originalAnswers[questionId] = reverseMapping[userAnswer] || userAnswer;
          
          console.log('🚀 Single choice submission:', userAnswer, '→', originalAnswers[questionId]);
        } else {
          // Questions without mapping use original answers directly
          originalAnswers[questionId] = userAnswer;
          console.log('🚀 SUBMIT - No Mapping:', {
            questionId,
            questionType: question?.question_type,
            userAnswer,
            directlySaved: true
          });
        }
      });
      
      const submitData = {
        answers: originalAnswers, // Use converted original answers
        student_id: user?.user_id,
        started_at: taskStartTime  // Include task start time
      };

      console.log('🚀 Submission:', Object.keys(allAnswers).length, 'answers');
      
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

      const response = await fetch(`${config.API_BASE_URL}/api/tasks/${taskId}/submit`, {
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
        
        // Mark the current session as completed
        const user = JSON.parse(localStorage.getItem('user_data'));
        if (user?.user_id) {
          markSessionCompleted(user.user_id, taskId);
        }
      } else {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        
        // Server error handling
        if (response.status >= 500) {
          if (retryCount < 2) {
            const shouldRetry = await alert.confirm(`🔄 Server internal error (${response.status})。Do you want to retry? \n\n Number of retries: ${retryCount + 1}/3`);
            if (shouldRetry) {
              return submitAllAnswers(retryCount + 1);
            }
          } else {
            alert.error('❌ Server error, please try again later or contact the administrator.');
          }
        } else {
          // Client error handling
          try {
            const errorData = JSON.parse(errorText);
            alert.error(`❌ Submission failed: ${errorData.error || 'Unknown error'}`);
          } catch (e) {
            alert.error(`❌ Submission failed: HTTP ${response.status} - ${errorText || 'Unknown error'}`);
          }
        }
      }
    } catch (error) {
      console.error('Error submitting answers:', error);
      
      if (error.name === 'AbortError') {
        // Timeout error
        if (retryCount < 2) {
          const shouldRetry = await alert.confirm(`⏱️ The request timed out. Do you want to retry? \n\n Number of retries: ${retryCount + 1}/3`);
          if (shouldRetry) {
            return submitAllAnswers(retryCount + 1);
          }
        } else {
          alert.warning('⏱️ The request timed out, please check your network connection or try again later');
        }
      } else if (error.message.includes('Failed to fetch')) {
        // Network connection error
        if (retryCount < 2) {
          const shouldRetry = await alert.confirm(`🌐 Network connection failed. Possible reasons: \n• Backend server not running\n• Network connection interrupted\n• Firewall blocking\n\nDo you want to retry? \n\nNumber of retries: ${retryCount + 1}/3`);
          if (shouldRetry) {
            return submitAllAnswers(retryCount + 1);
          }
        } else {
          alert.error('🌐 Multiple attempts failed. Please check: \n• Whether the backend server is running\n• Whether the network connection is normal\n• Firewall settings');
        }
      } else {
        // Other errors
        alert.error(`❌ An error occurred while submitting your answer: ${error.message}`);
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Retry quiz - re-randomize and clear progress
  const retryQuiz = async () => {
    // First display confirmation dialog
    const shouldRetry = await alert.confirm('🔄 Do you want to retry the quiz? \n\n This will clear your current progress and start a new quiz.');
    
    if (!shouldRetry) {
      return; // User cancelled retry
    }

    const user = JSON.parse(localStorage.getItem('user_data'));
    
    if (!user?.user_id) {
      console.warn('⚠️ User information does not exist, returning to home page');
      alert.error('User information is abnormal, please log in again');
      navigate('/student/home');
      return;
    }

    try {
      console.log('🔄 Start retrying the quiz, clearing progress data...');
      
      // First clear backend progress data
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      const deleteResponse = await fetch(`${config.API_BASE_URL}/api/tasks/${taskId}/progress?student_id=${user.user_id}`, {
        method: 'DELETE',
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (deleteResponse.ok) {
        console.log('✅ Backend progress data has been cleared');
      } else {
        console.warn('⚠️ Backend progress clearing may have failed, status code:', deleteResponse.status);
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.warn('⚠️ The request to clear progress data timed out, continuing with retry');
      } else if (error.message.includes('Failed to fetch')) {
        console.warn('⚠️ Network connection failed, unable to clear backend progress data');
      } else {
        console.warn('⚠️ An error occurred while clearing progress data:', error.message);
      }
    }
    
    // Clear frontend session data (keep original logic)
    restartSession(user.user_id, taskId);
    
    // Reset all states, re-initialize quiz
    console.log('🔄 Resetting quiz state and reloading data');
    
    // Reset component state
    setQuestions([]);
    setCurrentQuestionIndex(0);
    setAllAnswers({});
    setQuizMode('answering');
    setQuizResults(null);
    setNetworkStatus('checking');
    setLoading(true);
    setError('');
    
    // Re-fetch data, this will trigger new randomization
    try {
      await fetchTaskAndQuestions();
      // Don't show success message, because user has already seen the loading process
    } catch (error) {
      console.error('Error resetting quiz:', error);
      alert.error('Failed to reset quiz. Please try again.');
    }
  };

  // Return to home page
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

  // Result display mode
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
            // Use randomized question correct answer, not backend returned
            const correctAnswer = question.correct_answer;
            
            // Check answer correctness - support different question types
            let isCorrect = false;
            if (question.question_type === 'fill_blank' || 
                question.question_type === 'puzzle_game' || 
                question.question_type === 'matching_task' ||
                question.question_type === 'multiple_choice') {
              // For complex question types and multiple choice, check backend results
              const questionResult = quizResults?.results?.find(r => r.question_id === question.id);
              isCorrect = questionResult ? questionResult.is_correct : false;
            } else {
              // For single choice questions, use direct comparison
              isCorrect = userAnswer === correctAnswer;
            }
            
              // Safe get option text - support different question types
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
                if (typeof userAnswer === 'object' && userAnswer !== null) {
                  // Parse question data to get items
                  let questionData = {};
                  try {
                    if (typeof question.question_data === 'string') {
                      questionData = JSON.parse(question.question_data);
                    } else {
                      questionData = question.question_data || {};
                    }
                  } catch (error) {
                    console.error('Error parsing matching task question_data:', error);
                    questionData = {};
                  }
                  
                  const leftItems = questionData.left_items || [];
                  const rightItems = questionData.right_items || [];
                  
                  if (leftItems.length > 0 && rightItems.length > 0) {
                    return (
                      <div className="matching-task-answers">
                        <div className="matching-answer-label">
                          <i className="fas fa-exchange-alt"></i>
                          Student's Matches:
                        </div>
                        <div className="matching-answer-pairs">
                          {Object.entries(userAnswer).map(([leftIndex, rightIndex]) => {
                            const leftItem = leftItems[parseInt(leftIndex)] || `Item ${parseInt(leftIndex) + 1}`;
                            const rightItem = rightItems[parseInt(rightIndex)] || `Item ${String.fromCharCode(65 + parseInt(rightIndex))}`;
                            return (
                              <div key={`${leftIndex}-${rightIndex}`} className="matching-answer-pair">
                                <span className="left-match-item">
                                  <span className="match-number">{parseInt(leftIndex) + 1}</span>
                                  <span className="match-text">"{leftItem}"</span>
                                </span>
                                <div className="match-arrow">
                                  <i className="fas fa-arrow-right"></i>
                                </div>
                                <span className="right-match-item">
                                  <span className="match-letter">{String.fromCharCode(65 + parseInt(rightIndex))}</span>
                                  <span className="match-text">"{rightItem}"</span>
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  }
                }
                return 'No matches selected';
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
                // Parse question_data if it's a string
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
                
                const correctSolution = question.puzzle_solution || questionData.puzzle_solution || '';
                const fragments = question.puzzle_fragments || questionData.puzzle_fragments || [];
                
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
                } else if (correctSolution) {
                  return (
                    <div className="puzzle-game-correct-answer">
                      <div className="puzzle-correct-label">
                        <i className="fas fa-puzzle-piece"></i>
                        Correct Answer:
                      </div>
                      <div className="puzzle-correct-solution">
                        <strong>Solution:</strong> "{correctSolution}"
                      </div>
                    </div>
                  );
                } else {
                  return (
                    <div className="puzzle-game-correct-answer">
                      <span className="puzzle-correct-text">"No solution available"</span>
                    </div>
                  );
                }
              }
              
              if (question.question_type === 'matching_task') {
                try {
                  // Parse question data to get correct answers
                  let questionData = {};
                  if (typeof question.question_data === 'string') {
                    questionData = JSON.parse(question.question_data);
                  } else {
                    questionData = question.question_data || {};
                  }
                  
                  const leftItems = questionData.left_items || [];
                  const rightItems = questionData.right_items || [];
                  const correctMatches = questionData.correct_matches || [];
                  
                  if (correctMatches.length > 0 && leftItems.length > 0 && rightItems.length > 0) {
                    return (
                      <div className="matching-task-correct-answers">
                        <div className="matching-correct-label">
                          <i className="fas fa-exchange-alt"></i>
                          Correct Matches:
                        </div>
                        <div className="matching-correct-pairs">
                          {correctMatches.map((match, index) => {
                            const leftItem = leftItems[match.left] || `Item ${match.left + 1}`;
                            const rightItem = rightItems[match.right] || `Item ${String.fromCharCode(65 + match.right)}`;
                            return (
                              <div key={index} className="matching-correct-pair">
                                <span className="left-correct-item">
                                  <span className="match-number">{match.left + 1}</span>
                                  <span className="match-text">"{leftItem}"</span>
                                </span>
                                <div className="match-arrow correct">
                                  <i className="fas fa-arrow-right"></i>
                                </div>
                                <span className="right-correct-item">
                                  <span className="match-letter">{String.fromCharCode(65 + match.right)}</span>
                                  <span className="match-text">"{rightItem}"</span>
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  }
                  return 'No correct matches found';
                } catch (error) {
                  console.error('Error parsing matching task correct answers:', error);
                  return 'Error loading correct answers';
                }
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

  // Answer mode
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

      {/* Question navigation */}
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
          
          {/* Text description */}
          {currentQuestion.description && (
            <div className="question-description">
              <h4><i className="fas fa-info-circle"></i> Problem statement</h4>
              <p>{currentQuestion.description}</p>
            </div>
          )}
          
          {/* Image display */}
          {currentQuestion.image_url && (
            <div className="question-image">
              <h4><i className="fas fa-image"></i> Image description</h4>
              <img 
                src={currentQuestion.image_url.startsWith('http') ? currentQuestion.image_url : `${config.API_BASE_URL}${currentQuestion.image_url}`} 
                alt="Question illustration" 
                onError={(e) => {
                  console.error('Image load error:', e.target.src);
                  e.target.style.display = 'none';
                  const parent = e.target.parentNode;
                  if (parent) {
                    const errorDiv = document.createElement('div');
                    errorDiv.className = 'media-error';
                    errorDiv.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Image loading failed';
                    parent.appendChild(errorDiv);
                  }
                }}
              />
            </div>
          )}
          
          {/* Video display */}
          {currentQuestion.video_type && currentQuestion.video_url && (
            <div className="question-video">
              <h4>
                <i className={`${currentQuestion.video_type === 'youtube' ? 'fab fa-youtube' : 'fas fa-video'}`}></i> 
                Video description
              </h4>
              {currentQuestion.video_type === 'local' ? (
                <video
                  src={currentQuestion.video_url.startsWith('http') ? currentQuestion.video_url : `${config.API_BASE_URL}${currentQuestion.video_url}`}
                  controls
                  style={{ width: '100%', maxWidth: '600px', height: 'auto', borderRadius: '8px' }}
                  onError={(e) => {
                    console.error('Video load error:', e.target.src);
                    e.target.style.display = 'none';
                    const parent = e.target.parentNode;
                    if (parent) {
                      const errorDiv = document.createElement('div');
                      errorDiv.className = 'media-error';
                      errorDiv.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Video loading failed';
                      parent.appendChild(errorDiv);
                    }
                  }}
                >
                  Your browser does not support video playback
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