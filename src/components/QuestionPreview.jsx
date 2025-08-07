import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import config from '../config';

const QuestionPreview = ({ question, onEdit }) => {
  const navigate = useNavigate();
  const { taskId } = useParams();
  
  const handleEditClick = () => {
    if (onEdit) {
      onEdit(question);
    } else {
      // Default navigation behavior
      navigateToEdit();
    }
  };

  const handleDoubleClick = () => {
    if (onEdit) {
      onEdit(question);
    } else {
      // Default navigation behavior
      navigateToEdit();
    }
  };

  const navigateToEdit = () => {
    if (question.id && taskId) {
      const questionType = question.question_type || 'single_choice';
      // Map question types to route names if needed
      const routeTypeMap = {
        'single_choice': 'single-choice',
        'multiple_choice': 'multiple-choice', 
        'fill_blank': 'fill-blank',
        'puzzle_game': 'puzzle-game',
        'matching_task': 'matching-task',
      };
      
      const routeType = routeTypeMap[questionType] || questionType;
      const editUrl = `/teacher/tasks/${taskId}/create/${routeType}?questionId=${question.id}`;
      
      console.log('Navigating to edit URL:', editUrl);
      navigate(editUrl);
    }
  };
  const renderQuestionBasics = () => (
    <div className="question-content">
      <h4>Question Content</h4>
      <p>{question.question}</p>
      
      {question.description && (
        <div className="question-description">
          <h5>Description</h5>
          <p>{question.description}</p>
        </div>
      )}
      
      {question.image_url && (
        <div className="question-media">
          <h5>Image</h5>
          <img 
            src={question.image_url.startsWith('http') ? question.image_url : `${config.API_BASE_URL}${question.image_url}`} 
            alt="Question image" 
            style={{ maxWidth: '200px', maxHeight: '150px', borderRadius: '8px' }}
          />
        </div>
      )}
      
      {question.video_type && question.video_url && (
        <div className="question-media">
          <h5>Video</h5>
          <div className="video-preview">
            <i className={`${question.video_type === 'youtube' ? 'fab fa-youtube' : 'fas fa-video'}`}></i>
            <span>{question.video_type === 'youtube' ? 'YouTube Video' : 'Local Video'}</span>
          </div>
        </div>
      )}
    </div>
  );

  const renderQuestionContent = () => {
    switch (question.question_type) {
      case 'single_choice':
        return (
          <div className="question-options">
            {renderQuestionBasics()}
            
            <h4>Options (Single Choice)</h4>
            <div className="options-preview">
              <div className="option-item">
                <span className={`option-label ${question.correct_answer === 'A' ? 'correct' : ''}`}>A</span>
                <span>{question.option_a}</span>
              </div>
              <div className="option-item">
                <span className={`option-label ${question.correct_answer === 'B' ? 'correct' : ''}`}>B</span>
                <span>{question.option_b}</span>
              </div>
              <div className="option-item">
                <span className={`option-label ${question.correct_answer === 'C' ? 'correct' : ''}`}>C</span>
                <span>{question.option_c}</span>
              </div>
              <div className="option-item">
                <span className={`option-label ${question.correct_answer === 'D' ? 'correct' : ''}`}>D</span>
                <span>{question.option_d}</span>
              </div>
            </div>
          </div>
        );

      case 'multiple_choice':
        const options = question.question_data?.options || [];
        const correctAnswers = question.question_data?.correct_answers || [];
        return (
          <div className="question-options">
            {renderQuestionBasics()}
            
            <h4>Options (Multiple Choice)</h4>
            <div className="options-preview">
              {options.map((option, index) => (
                <div key={index} className="option-item">
                  <span className={`option-label ${correctAnswers.includes(index) ? 'correct' : ''}`}>
                    {String.fromCharCode(65 + index)}
                  </span>
                  <span>{option}</span>
                  {correctAnswers.includes(index) && (
                    <span className="correct-indicator">
                      <i className="fas fa-check"></i>
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        );

      case 'fill_blank':
        const blankAnswers = question.question_data?.blank_answers || [];
        return (
          <div className="question-options">
            {renderQuestionBasics()}
            
            <h4>Fill in the Blank</h4>
            <div className="blank-answers-preview">
              <p className="instruction">Students need to fill in the blanks marked with _____</p>
              {blankAnswers.map((answer, index) => (
                <div key={index} className="blank-answer-item">
                  <span className="blank-label">Blank {index + 1}:</span>
                  <span className="blank-answer">{answer}</span>
                </div>
              ))}
            </div>
          </div>
        );

      case 'puzzle_game':
        const puzzleSolution = question.question_data?.puzzle_solution || '';
        const puzzleFragments = question.question_data?.puzzle_fragments || [];
        return (
          <div className="question-options">
            {renderQuestionBasics()}
            
            <div className="puzzle-game-preview">
              <div className="puzzle-header">
                <div className="puzzle-icon">
                  <i className="fas fa-puzzle-piece"></i>
                </div>
                <h4>Interactive Puzzle Game</h4>
                <div className="puzzle-stats">
                  <span className="fragment-count">
                    <i className="fas fa-th-large"></i>
                    {puzzleFragments.length} fragments
                  </span>
                </div>
              </div>
              
              <div className="puzzle-content">
                <div className="solution-display">
                  <div className="solution-header">
                    <i className="fas fa-trophy"></i>
                    <span>Target Solution</span>
                  </div>
                  <div className="solution-box">
                    <div className="solution-text">{puzzleSolution}</div>
                  </div>
                </div>
                
                <div className="fragments-display">
                  <div className="fragments-header">
                    <i className="fas fa-cubes"></i>
                    <span>Available Fragments</span>
                  </div>
                  <div className="fragments-container">
                    {puzzleFragments.map((fragment, index) => (
                      <div key={index} className="preview-fragment">
                        <div className="fragment-content">{fragment}</div>
                        <div className="fragment-number">{index + 1}</div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="puzzle-instructions">
                  <div className="instruction-item">
                    <i className="fas fa-hand-pointer"></i>
                    <span>Students drag and drop fragments to build the solution</span>
                  </div>
                  <div className="instruction-item">
                    <i className="fas fa-check-circle"></i>
                    <span>Interactive validation provides immediate feedback</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'matching_task':
        const leftItems = question.question_data?.left_items || [];
        const rightItems = question.question_data?.right_items || [];
        const correctMatches = question.question_data?.correct_matches || [];
        
        // Create a map of correct matches for easy lookup
        const matchMap = {};
        correctMatches.forEach(match => {
          matchMap[match.left] = match.right;
        });
        
        return (
          <div className="question-options">
            {renderQuestionBasics()}
            
            <div className="matching-task-preview">
              <div className="matching-header">
                <div className="task-icon">
                  <i className="fas fa-exchange-alt"></i>
                </div>
                <h4>Interactive Matching Task</h4>
                <div className="task-stats">
                  <span className="stat-item">
                    <i className="fas fa-list"></i>
                    {leftItems.length} items to match
                  </span>
                  <span className="stat-item">
                    <i className="fas fa-bullseye"></i>
                    {rightItems.length} targets
                  </span>
                </div>
              </div>

              <div className="preview-matching-container">
                {/* Left Column Preview */}
                <div className="preview-left-column">
                  <h5>
                    <i className="fas fa-list"></i>
                    Items to Match
                  </h5>
                  <div className="preview-left-items">
                    {leftItems.map((item, index) => (
                      <div key={index} className="preview-left-item matched">
                        <div className="item-number">{index + 1}</div>
                        <div className="item-content">{item}</div>
                        <div className="drag-handle">
                          <i className="fas fa-grip-vertical"></i>
                        </div>
                        {matchMap[index] !== undefined && (
                          <div className="preview-connection-line" data-target={String.fromCharCode(65 + matchMap[index])}></div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Connection Area Preview */}
                <div className="preview-connection-area">
                  <div className="connection-instructions">
                    <i className="fas fa-hand-pointer"></i>
                    <span>Drag to connect</span>
                  </div>
                </div>

                {/* Right Column Preview */}
                <div className="preview-right-column">
                  <h5>
                    <i className="fas fa-bullseye"></i>
                    Match Targets
                  </h5>
                  <div className="preview-right-items">
                    {rightItems.map((item, index) => (
                      <div key={index} className={`preview-right-item ${Object.values(matchMap).includes(index) ? 'matched' : ''}`}>
                        <div className="item-letter">{String.fromCharCode(65 + index)}</div>
                        <div className="item-content">{item}</div>
                        <div className="drop-zone">
                          <i className="fas fa-crosshairs"></i>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="matching-solution-summary">
                <div className="solution-header">
                  <i className="fas fa-key"></i>
                  <span>Correct Matches</span>
                </div>
                <div className="solution-matches">
                  {correctMatches.map((match, index) => (
                    <div key={index} className="solution-match-pair">
                      <div className="match-left">
                        <span className="match-number">{match.left + 1}</span>
                        <span className="match-text">{leftItems[match.left]}</span>
                      </div>
                      <div className="match-connector">
                        <i className="fas fa-arrow-right"></i>
                      </div>
                      <div className="match-right">
                        <span className="match-letter">{String.fromCharCode(65 + match.right)}</span>
                        <span className="match-text">{rightItems[match.right]}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        );


      default:
        return (
          <div className="question-options">
            {renderQuestionBasics()}
            
            <h4>Unknown Question Type</h4>
            <p>Question type: {question.question_type}</p>
          </div>
        );
    }
  };

  return (
    <div className="question-preview" onDoubleClick={handleDoubleClick}>
      <div className="question-preview-header">
        <div className="question-info">
          <div className="question-type-badge">
            <i className="fas fa-tag"></i>
            <span>{question.question_type.replace('_', ' ').toUpperCase()}</span>
          </div>
          <div className="question-meta">
            <div className="setting-item">
              <span className="setting-label">Difficulty:</span>
              <span className={`difficulty-badge ${question.difficulty.toLowerCase()}`}>
                {question.difficulty}
              </span>
            </div>
            <div className="setting-item">
              <span className="setting-label">Score:</span>
              <span className="score-badge">{question.score}</span>
            </div>
          </div>
        </div>
        <div className="question-actions">
          <button 
            className="edit-question-btn" 
            onClick={handleEditClick}
            title="Edit this question"
          >
            <i className="fas fa-edit"></i>
            Edit
          </button>
        </div>
      </div>

      <div className="question-preview-content">
        {renderQuestionContent()}
      </div>

      <div className="question-preview-footer">
        <div className="edit-hint">
          <i className="fas fa-info-circle"></i>
          <span>Double-click anywhere or use the Edit button to modify this question</span>
        </div>
      </div>
    </div>
  );
};

export default QuestionPreview;