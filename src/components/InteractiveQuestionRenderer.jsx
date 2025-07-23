import React, { useState, useEffect } from 'react';

const InteractiveQuestionRenderer = ({ question, currentAnswer, onAnswerChange }) => {
  const [fillBlankAnswers, setFillBlankAnswers] = useState([]);
  const [showHints, setShowHints] = useState({});

  const questionType = question.question_type || 'single_choice';
  
  // Parse question_data if it's a JSON string
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

  // Initialize fill-blank answers when question changes
  useEffect(() => {
    if (questionType === 'fill_blank') {
      let expectedLength = 0;
      
      // Check for blank_answers in question_data or direct question structure
      const blankAnswers = questionData.blank_answers || question.blank_answers || [];
      if (blankAnswers.length > 0) {
        expectedLength = blankAnswers.length;
      } else if (questionData.enhanced && questionData.blanks) {
        expectedLength = questionData.blanks.length;
        // Count actual {{...}} patterns in template to verify
        const templateMatches = (questionData.template || '').match(/\{\{[^}]+\}\}/g);
        if (templateMatches) {
          expectedLength = templateMatches.length; // Use actual template count
        }
      }
      
      if (expectedLength > 0) {
        const initialAnswers = Array(expectedLength).fill('');
        setFillBlankAnswers(initialAnswers);
        onAnswerChange(initialAnswers);
      }
    }
    
    // Reset hints
    setShowHints({});
  }, [question.id]);

  // Handle fill-blank answer changes
  const handleFillBlankChange = (index, value) => {
    const newAnswers = [...fillBlankAnswers];
    newAnswers[index] = value;
    setFillBlankAnswers(newAnswers);
    onAnswerChange(newAnswers);
  };

  // Toggle hint visibility
  const toggleHint = (blankIndex) => {
    setShowHints(prev => ({
      ...prev,
      [blankIndex]: !prev[blankIndex]
    }));
  };

  // Render based on question type
  switch (questionType) {
    case 'single_choice':
      return (
        <div className="options-grid">
          {Object.entries(question.options || {}).map(([option, text]) => (
            <button
              key={option}
              className={`option-button ${currentAnswer === option ? 'selected' : ''}`}
              onClick={() => onAnswerChange(option)}
            >
              <span className="option-letter">{option}</span>
              <span className="option-text">{text}</span>
            </button>
          ))}
        </div>
      );

    case 'multiple_choice':
      const selectedOptions = Array.isArray(currentAnswer) ? currentAnswer : [];
      const options = questionData.options || [];
      
      return (
        <div className="multiple-choice-options">
          <div className="instruction">
            <i className="fas fa-info-circle"></i>
            Select all correct answers
          </div>
          {options.map((option, index) => (
            <label key={index} className="multiple-choice-option">
              <input
                type="checkbox"
                checked={selectedOptions.includes(index)}
                onChange={(e) => {
                  const newSelected = e.target.checked
                    ? [...selectedOptions, index]
                    : selectedOptions.filter(i => i !== index);
                  onAnswerChange(newSelected);
                }}
              />
              <span className="option-text">{option}</span>
            </label>
          ))}
        </div>
      );

    case 'fill_blank':
      // Check for blank_answers in question_data or fallback to direct question structure
      const blankAnswers = questionData.blank_answers || question.blank_answers || [];
      
      if (blankAnswers.length > 0) {
        // Legacy fill-blank - most common format
        return renderLegacyFillBlank();
      } else if (questionData.enhanced && questionData.blanks) {
        // Enhanced fill-blank with template (legacy support)
        return renderEnhancedFillBlank();
      }
      return <div className="error">Invalid fill-blank question configuration. No blank answers found.</div>;

    case 'puzzle_game':
      return renderPuzzleGame();

    case 'matching_task':
      return renderMatchingTask();

    case 'error_spotting':
      return renderErrorSpotting();

    default:
      // Fallback for other question types
      return (
        <div className="options-grid">
          {Object.entries(question.options || {}).map(([option, text]) => (
            <button
              key={option}
              className={`option-button ${currentAnswer === option ? 'selected' : ''}`}
              onClick={() => onAnswerChange(option)}
            >
              <span className="option-letter">{option}</span>
              <span className="option-text">{text}</span>
            </button>
          ))}
        </div>
      );
  }

  function renderEnhancedFillBlank() {
    const template = questionData.template || '';
    const blanks = questionData.blanks || [];
    
    // Split template by {{...}} patterns
    const templateParts = template.split(/\{\{[^}]+\}\}/);
    const blankMatches = template.match(/\{\{[^}]+\}\}/g) || [];
    
    // Build the rendered content
    const elements = [];
    
    for (let i = 0; i < templateParts.length; i++) {
      // Add text part
      if (templateParts[i]) {
        elements.push(
          <span key={`text-${i}`}>{templateParts[i]}</span>
        );
      }
      
      // Add input if there's a corresponding blank
      if (i < blankMatches.length && i < blanks.length) {
        const blank = blanks[i];
        const hasHints = blank.options?.hints && blank.options.hints.length > 0;
        
        elements.push(
          <span key={`blank-${i}`} className="fill-blank-input-wrapper">
            <input
              type="text"
              className="fill-blank-input"
              value={fillBlankAnswers[i] || ''}
              onChange={(e) => handleFillBlankChange(i, e.target.value)}
              placeholder={blank.placeholder || `Blank ${i + 1}`}
              style={{ minWidth: '120px', width: 'auto' }}
            />
            {hasHints && (
              <button
                type="button"
                className="hint-button"
                onClick={() => toggleHint(i)}
                title="Show hint"
              >
                <i className="fas fa-lightbulb"></i>
              </button>
            )}
            {showHints[i] && hasHints && (
              <div className="hint-tooltip">
                {blank.options.hints.map((hint, hintIndex) => (
                  <div key={hintIndex} className="hint-item">
                    <i className="fas fa-info-circle"></i>
                    {hint}
                  </div>
                ))}
              </div>
            )}
          </span>
        );
      }
    }
    
    return (
      <div className="enhanced-fill-blank-question">
        <div className="fill-blank-template">
          {elements}
        </div>
        <div className="fill-blank-progress">
          {fillBlankAnswers.filter(answer => answer && answer.trim()).length} of {blankMatches.length} blanks filled
        </div>
      </div>
    );
  }

  function renderLegacyFillBlank() {
    const blankAnswers = questionData.blank_answers || question.blank_answers || [];
    
    // Extract placeholders from question text for better UX
    const questionText = question.question || '';
    const templateMatches = questionText.match(/\{\{[^}]+\}\}/g) || [];
    
    return (
      <div className="legacy-fill-blank-question">
        <div className="instruction">
          <i className="fas fa-edit"></i>
          Fill in the blanks below
        </div>
        <div className="blank-inputs">
          {blankAnswers.map((_, index) => {
            // Extract placeholder name if available
            const placeholder = templateMatches[index] ? 
              templateMatches[index].replace(/[{}]/g, '').trim() : 
              `blank ${index + 1}`;
            
            return (
              <div key={index} className="blank-input-item">
                <label>
                  <i className="fas fa-edit"></i>
                  {placeholder}:
                </label>
                <input
                  type="text"
                  className="fill-blank-input"
                  value={fillBlankAnswers[index] || ''}
                  onChange={(e) => handleFillBlankChange(index, e.target.value)}
                  placeholder={`Enter answer for ${placeholder}`}
                />
              </div>
            );
          })}
        </div>
        <div className="fill-blank-progress">
          <i className="fas fa-check-circle"></i>
          {fillBlankAnswers.filter(answer => answer && answer.trim()).length} of {blankAnswers.length} blanks filled
        </div>
      </div>
    );
  }

  // Placeholder for Puzzle Game questions - to be implemented
  function renderPuzzleGame() {
    return (
      <div className="puzzle-game-question">
        <div className="placeholder-message">
          <div className="placeholder-icon">
            <i className="fas fa-puzzle-piece"></i>
          </div>
          <h3>Puzzle Game Question</h3>
          <p>This question type will be available in a future update.</p>
          <div className="placeholder-details">
            <small>
              <i className="fas fa-info-circle"></i>
              Students will be able to solve puzzle games by arranging fragments.
            </small>
          </div>
        </div>
      </div>
    );
  }

  // Placeholder for Matching Task questions - to be implemented
  function renderMatchingTask() {
    return (
      <div className="matching-task-question">
        <div className="placeholder-message">
          <div className="placeholder-icon">
            <i className="fas fa-exchange-alt"></i>
          </div>
          <h3>Matching Task Question</h3>
          <p>This question type will be available in a future update.</p>
          <div className="placeholder-details">
            <small>
              <i className="fas fa-info-circle"></i>
              Students will be able to match items from left and right columns.
            </small>
          </div>
        </div>
      </div>
    );
  }

  // Placeholder for Error Spotting questions - to be implemented
  function renderErrorSpotting() {
    return (
      <div className="error-spotting-question">
        <div className="placeholder-message">
          <div className="placeholder-icon">
            <i className="fas fa-search"></i>
          </div>
          <h3>Error Spotting Question</h3>
          <p>This question type will be available in a future update.</p>
          <div className="placeholder-details">
            <small>
              <i className="fas fa-info-circle"></i>
              Students will be able to click on errors in images to spot mistakes.
            </small>
          </div>
        </div>
      </div>
    );
  }
};

export default InteractiveQuestionRenderer;