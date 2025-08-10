import React from 'react';

const MultipleChoiceEditor = ({ formData, setFormData }) => {
  const handleOptionChange = (index, value) => {
    const newOptions = [...formData.options];
    newOptions[index] = value;
    setFormData(prev => ({ ...prev, options: newOptions }));
  };

  const toggleCorrectAnswer = (index) => {
    const newCorrectAnswers = formData.correct_answers.includes(index)
      ? formData.correct_answers.filter(i => i !== index)
      : [...formData.correct_answers, index];
    setFormData(prev => ({ ...prev, correct_answers: newCorrectAnswers }));
  };

  const addOption = () => {
    if (formData.options.length < 8) {
      setFormData(prev => ({ ...prev, options: [...prev.options, ''] }));
    }
  };

  const removeOption = () => {
    if (formData.options.length > 2) {
      const newOptions = formData.options.slice(0, -1);
      const newCorrectAnswers = formData.correct_answers.filter(i => i < newOptions.length);
      setFormData(prev => ({ ...prev, options: newOptions, correct_answers: newCorrectAnswers }));
    }
  };

  return (
    <div className="form-card">
      <div className="card-header">
        <i className="fas fa-check-square"></i>
        <h3>Multiple Choice Options</h3>
        <span className="card-subtitle">Select multiple correct answers</span>
      </div>
      
      <div className="options-grid-vertical">
        {formData.options.map((option, index) => (
          <div key={index} className={`option-item-vertical ${formData.correct_answers.includes(index) ? 'correct' : ''}`}>
            <div className="option-header-vertical">
              <div className="option-label-vertical">
                <div className="option-circle">{String.fromCharCode(65 + index)}</div>
                <span>Option {String.fromCharCode(65 + index)}</span>
              </div>
              {formData.correct_answers.includes(index) && (
                <div className="correct-indicator">
                  <i className="fas fa-check-circle"></i>
                </div>
              )}
            </div>
            <input
              type="text"
              className="option-input-vertical"
              value={option}
              onChange={(e) => handleOptionChange(index, e.target.value)}
              placeholder={`Option ${index + 1}`}
              required
              data-cy={`mc-option-${index}`}
            />
            <button
              type="button"
              className={`correct-toggle-vertical ${formData.correct_answers.includes(index) ? 'active' : ''}`}
              onClick={() => toggleCorrectAnswer(index)}
              data-cy={`mc-correct-${index}`}
            >
              {formData.correct_answers.includes(index) ? (
                <>
                  <i className="fas fa-check"></i>
                  Correct Answer
                </>
              ) : (
                <>
                  <i className="fas fa-square"></i>
                  Set as Correct
                </>
              )}
            </button>
          </div>
        ))}
        <div className="option-controls">
          <button
            type="button"
            onClick={addOption}
            className="add-option-btn"
            disabled={formData.options.length >= 8}
          >
            <i className="fas fa-plus"></i>
            Add Option
          </button>
          {formData.options.length > 2 && (
            <button
              type="button"
              onClick={removeOption}
              className="remove-option-btn"
            >
              <i className="fas fa-minus"></i>
              Remove Option
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MultipleChoiceEditor;