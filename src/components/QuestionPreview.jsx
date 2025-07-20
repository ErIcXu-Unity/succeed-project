import React from 'react';

const QuestionPreview = ({ question }) => {
  const renderQuestionContent = () => {
    switch (question.question_type) {
      case 'single_choice':
        return (
          <div className="question-options">
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
            <h4>Puzzle Game</h4>
            <div className="puzzle-preview">
              <div className="puzzle-solution">
                <span className="puzzle-label">Complete Solution:</span>
                <span className="puzzle-text">{puzzleSolution}</span>
              </div>
              <div className="puzzle-fragments">
                <span className="puzzle-label">Fragments to Assemble:</span>
                <div className="fragments-list">
                  {puzzleFragments.map((fragment, index) => (
                    <span key={index} className="fragment-item">
                      {fragment}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 'matching_task':
        const leftItems = question.question_data?.left_items || [];
        const rightItems = question.question_data?.right_items || [];
        const correctMatches = question.question_data?.correct_matches || [];
        return (
          <div className="question-options">
            <h4>Matching Task</h4>
            <div className="matching-preview">
              <div className="matching-columns">
                <div className="left-items">
                  <h5>Left Items:</h5>
                  {leftItems.map((item, index) => (
                    <div key={index} className="match-item">
                      {index + 1}. {item}
                    </div>
                  ))}
                </div>
                <div className="right-items">
                  <h5>Right Items:</h5>
                  {rightItems.map((item, index) => (
                    <div key={index} className="match-item">
                      {String.fromCharCode(65 + index)}. {item}
                    </div>
                  ))}
                </div>
              </div>
              <div className="correct-matches">
                <h5>Correct Matches:</h5>
                {correctMatches.map((match, index) => (
                  <div key={index} className="match-pair">
                    {match.left + 1} ↔ {String.fromCharCode(65 + match.right)}
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'error_spotting':
        const errorSpots = question.question_data?.error_spots || [];
        return (
          <div className="question-options">
            <h4>Error Spotting</h4>
            <div className="error-spotting-preview">
              <p className="instruction">Students need to click on error areas in the image</p>
              <div className="error-spots-list">
                <h5>Error Spots ({errorSpots.length}):</h5>
                {errorSpots.map((spot, index) => (
                  <div key={index} className="error-spot-item">
                    <span className="spot-number">{index + 1}.</span>
                    <span className="spot-location">({spot.x}, {spot.y})</span>
                    <span className="spot-description">{spot.description}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="question-options">
            <h4>Unknown Question Type</h4>
            <p>Question type: {question.question_type}</p>
          </div>
        );
    }
  };

  return (
    <div className="question-preview">
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
              src={question.image_url.startsWith('http') ? question.image_url : `http://localhost:5001${question.image_url}`} 
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

      {renderQuestionContent()}

      <div className="question-settings-preview">
        <div className="question-type-badge">
          <i className="fas fa-tag"></i>
          <span>{question.question_type.replace('_', ' ').toUpperCase()}</span>
        </div>
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
  );
};

export default QuestionPreview;