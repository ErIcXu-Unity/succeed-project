import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import './TaskQuiz.css';

const TaskQuiz = () => {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [answerResult, setAnswerResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [score, setScore] = useState(0);
  const [questionAttempts, setQuestionAttempts] = useState({});

  useEffect(() => {
    fetchTaskAndQuestions();
  }, [taskId]);

  const fetchTaskAndQuestions = async () => {
    try {
      // 获取任务详情
      const taskResponse = await fetch(`http://localhost:5000/api/tasks/${taskId}`);
      if (taskResponse.ok) {
        const taskData = await taskResponse.json();
        setTask(taskData);
      }

      // 获取问题列表
      const questionsResponse = await fetch(`http://localhost:5000/api/tasks/${taskId}/questions`);
      if (questionsResponse.ok) {
        const questionsData = await questionsResponse.json();
        setQuestions(questionsData);
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

  const handleAnswerSelect = (option) => {
    if (answerResult) return; // 已经回答过的问题不能再选择
    setSelectedAnswer(option);
  };

  const submitAnswer = async () => {
    if (!selectedAnswer) {
      alert('Please select an answer first!');
      return;
    }

    const currentQuestion = questions[currentQuestionIndex];
    const questionId = currentQuestion.id;

    try {
      const response = await fetch(`http://localhost:5000/api/questions/${questionId}/check`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          answer: selectedAnswer
        })
      });

      if (response.ok) {
        const result = await response.json();
        setAnswerResult(result);
        
        if (result.correct) {
          setScore(prevScore => prevScore + result.score);
        }

        // 记录该问题的尝试次数
        setQuestionAttempts(prev => ({
          ...prev,
          [questionId]: (prev[questionId] || 0) + 1
        }));
      } else {
        alert('Error checking answer. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting answer:', error);
      alert('Error submitting answer. Please try again.');
    }
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer('');
      setAnswerResult(null);
    } else {
      // 完成所有问题
      navigate(`/student/tasks/${taskId}/complete`, { 
        state: { 
          score: score,
          totalQuestions: questions.length,
          attempts: questionAttempts
        } 
      });
    }
  };

  const retryQuestion = () => {
    setSelectedAnswer('');
    setAnswerResult(null);
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

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <div className="quiz-container">
      <div className="quiz-header">
        <Link to={`/student/tasks/${taskId}/intro`} className="back-link">
          <i className="fas fa-arrow-left"></i>
          Back to Intro
        </Link>
        <h1>{task?.name || 'Quiz'}</h1>
        <div className="score-display">
          Score: {score}
        </div>
      </div>

      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${progress}%` }}></div>
        <span className="progress-text">
          Question {currentQuestionIndex + 1} of {questions.length}
        </span>
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
                className={`option-button ${selectedAnswer === option ? 'selected' : ''} ${
                  answerResult && option === answerResult.correct_answer ? 'correct' : ''
                } ${
                  answerResult && selectedAnswer === option && !answerResult.correct ? 'incorrect' : ''
                }`}
                onClick={() => handleAnswerSelect(option)}
                disabled={answerResult !== null}
              >
                <span className="option-letter">{option}</span>
                <span className="option-text">{text}</span>
              </button>
            ))}
          </div>

          {answerResult && (
            <div className={`result-panel ${answerResult.correct ? 'correct' : 'incorrect'}`}>
              <div className="result-icon">
                {answerResult.correct ? (
                  <i className="fas fa-check-circle"></i>
                ) : (
                  <i className="fas fa-times-circle"></i>
                )}
              </div>
              <div className="result-text">
                <h3>{answerResult.correct ? 'Correct!' : 'Incorrect'}</h3>
                <p>{answerResult.explanation}</p>
                {answerResult.correct && (
                  <p className="score-earned">+{answerResult.score} points</p>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="quiz-actions">
          {!answerResult ? (
            <button className="btn btn-primary" onClick={submitAnswer}>
              <i className="fas fa-paper-plane"></i>
              Submit Answer
            </button>
          ) : (
            <div className="action-buttons">
              {!answerResult.correct && (
                <button className="btn btn-secondary" onClick={retryQuestion}>
                  <i className="fas fa-redo"></i>
                  Try Again
                </button>
              )}
              <button className="btn btn-primary" onClick={nextQuestion}>
                <i className="fas fa-arrow-right"></i>
                {currentQuestionIndex < questions.length - 1 ? 'Next Question' : 'Finish Quiz'}
              </button>
            </div>
          )}
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
        <div className="attempts-badge">
          <i className="fas fa-sync"></i>
          Attempt {(questionAttempts[currentQuestion.id] || 0) + 1}
        </div>
      </div>
    </div>
  );
};

export default TaskQuiz; 