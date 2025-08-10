import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './QuestionCreateLayout.css';
import config from '../config';

const QuestionCreateLayout = ({ 
  questionType, 
  questionTypeLabel, 
  questionTypeIcon,
  children,
  formData,
  setFormData,
  onSubmit,
  loading = false,
  error = '',
  isEditMode = false,
  questionId = null
}) => {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const [taskInfo, setTaskInfo] = useState(null);

  // Difficulty to score mapping
  const difficultyScoreMap = {
    'Easy': 3,
    'Medium': 5,
    'Hard': 10
  };

  // Fetch task information
  useEffect(() => {
    const fetchTaskInfo = async () => {
      try {
        const response = await fetch(`${config.API_BASE_URL}/api/tasks/${taskId}`);
        if (response.ok) {
          const task = await response.json();
          setTaskInfo(task);
        }
      } catch (error) {
        console.error('Error fetching task info:', error);
      }
    };

    if (taskId) {
      fetchTaskInfo();
    }
  }, [taskId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const newData = { ...prev, [name]: value };
      
      // Auto-update score when difficulty changes
      if (name === 'difficulty') {
        newData.score = difficultyScoreMap[value];
      }
      
      return newData;
    });
  };

  const handleCancel = () => {
    navigate(`/teacher/tasks/${taskId}/edit`);
  };

  return (
    <div className="question-create-layout">
      {/* Page Header */}
      <div className="page-header">
        <div className="header-content">
          <div className="breadcrumb">
            <button 
              onClick={handleCancel}
              className="breadcrumb-link"
            >
              <i className="fas fa-arrow-left"></i>
              Back to Task
            </button>
            <span className="breadcrumb-separator">/</span>
            <span className="breadcrumb-current">{isEditMode ? 'Edit' : 'Create'} {questionTypeLabel} Question</span>
          </div>
          
          <div className="header-info">
            <h1>
              <i className={questionTypeIcon}></i>
{isEditMode ? 'Edit' : 'Create'} {questionTypeLabel} Question
            </h1>
            {taskInfo && (
              <p className="task-context">

              </p>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="page-content">
        <form onSubmit={onSubmit} className="question-create-form">
          {error && (
            <div className="error-toast">
              <i className="fas fa-exclamation-triangle"></i>
              <span>{error}</span>
            </div>
          )}
          
          {/* Left Column - Question Editor */}
          <div className="content-main">
            <div className="form-card">
              <div className="card-header">
                <i className={questionTypeIcon}></i>
                <h3>{questionTypeLabel} Question</h3>
                <span className="card-subtitle">Create an interactive {questionTypeLabel.toLowerCase()} question</span>
              </div>
              
              <div className="card-content">
                {/* Question Text Input */}
                <div className="form-group-redesigned">
                  <label className="form-label-redesigned">
                    <i className="fas fa-paragraph"></i>
                    Question Text <span className="required">*</span>
                  </label>
                  <textarea
                    className="form-textarea-redesigned"
                    name="question"
                    data-cy="question-text"
                    value={formData.question}
                    onChange={handleInputChange}
                    placeholder="Enter your question here..."
                    rows="4"
                    required
                  />
                </div>

                {/* Question Type Specific Content */}
                {children}
              </div>
            </div>
          </div>

          {/* Right Sidebar - Settings */}
          <div className="content-sidebar">
            {/* Question Settings */}
            <div className="form-card" data-cy="question-settings">
              <div className="card-header">
                <i className="fas fa-cog"></i>
                <h3>Question Settings</h3>
              </div>
              
              <div className="card-content">
                <div className="form-group-redesigned">
                  <label className="form-label-redesigned">
                    <i className="fas fa-layer-group"></i>
                    Difficulty Level
                  </label>
                  <select
                    className="form-input-redesigned"
                    name="difficulty"
                    data-cy="question-difficulty"
                    value={formData.difficulty}
                    onChange={handleInputChange}
                  >
                    <option value="Easy">Easy (3 points)</option>
                    <option value="Medium">Medium (5 points)</option>
                    <option value="Hard">Hard (10 points)</option>
                  </select>
                </div>

                <div className="form-group-redesigned">
                  <label className="form-label-redesigned">
                    <i className="fas fa-star"></i>
                    Question Score
                  </label>
                  <input
                    type="number"
                    className="form-input-redesigned"
                    name="score"
                    data-cy="question-score"
                    value={formData.score}
                    onChange={handleInputChange}
                    min="1"
                    max="10"
                    placeholder="Score (1-10)"
                  />
                </div>

                <div className="form-group-redesigned">
                  <label className="form-label-redesigned">
                    <i className="fas fa-align-left"></i>
                    Description (Optional)
                  </label>
                  <textarea
                    className="form-textarea-redesigned"
                    name="description"
                    data-cy="question-description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Add any additional instructions or context..."
                    rows="3"
                  />
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* Fixed Action Bar */}
      <div className="action-bar">
        <div className="action-bar-content">
          <button 
            type="button" 
            className="btn-cancel" 
            onClick={handleCancel}
            disabled={loading}
          >
            <i className="fas fa-times"></i>
            Cancel
          </button>
          <button 
            type="submit" 
            className="btn-primary" 
            onClick={onSubmit}
            data-cy="create-question-btn"
            disabled={loading}
          >
            {loading ? (
              <>
                <i className="fas fa-spinner fa-spin"></i>
                Creating...
              </>
            ) : (
              <>
                <i className="fas fa-save"></i>
{isEditMode ? 'Update' : 'Create'} Question
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuestionCreateLayout;