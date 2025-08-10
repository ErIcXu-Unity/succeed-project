import React from 'react';

const SingleChoiceEditor = ({ formData, setFormData }) => {
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const setCorrectAnswer = (option) => {
    setFormData(prev => ({ ...prev, correct_answer: option }));
  };

  return (
    <div className="form-card">
      <div className="card-header">
        <i className="fas fa-list-ol"></i>
        <h3>Answer Options</h3>
        <span className="card-subtitle">Choose correct answer</span>
      </div>
      
      <div className="options-grid-vertical">
        {['A', 'B', 'C', 'D'].map((option) => (
          <div key={option} className={`option-item-vertical ${formData.correct_answer === option ? 'correct' : ''}`}>
            <div className="option-header-vertical">
              <div className="option-label-vertical">
                <div className="option-circle">{option}</div>
                <span>Option {option}</span>
              </div>
              {formData.correct_answer === option && (
                <div className="correct-indicator">
                  <i className="fas fa-check-circle"></i>
                </div>
              )}
            </div>
            <input
              type="text"
              className="option-input-vertical"
              name={`option_${option.toLowerCase()}`}
              value={formData[`option_${option.toLowerCase()}`]}
              onChange={handleInputChange}
              placeholder={`Enter option ${option} content...`}
              required
              data-cy={`sc-option-${option}`}
            />
            <button
              type="button"
              className={`correct-toggle-vertical ${formData.correct_answer === option ? 'active' : ''}`}
              onClick={() => setCorrectAnswer(option)}
              data-cy={`sc-correct-${option}`}
            >
              {formData.correct_answer === option ? (
                <>
                  <i className="fas fa-check"></i>
                  Correct Answer
                </>
              ) : (
                <>
                  <i className="fas fa-circle"></i>
                  Set as Correct
                </>
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SingleChoiceEditor;