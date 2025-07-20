import React from 'react';

const FillBlankEditor = ({ formData, setFormData }) => {
  const handleBlankAnswerChange = (index, value) => {
    const newAnswers = [...formData.blank_answers];
    newAnswers[index] = value;
    setFormData(prev => ({ ...prev, blank_answers: newAnswers }));
  };

  const addBlank = () => {
    setFormData(prev => ({ ...prev, blank_answers: [...prev.blank_answers, ''] }));
  };

  const removeBlank = () => {
    if (formData.blank_answers.length > 1) {
      setFormData(prev => ({ ...prev, blank_answers: prev.blank_answers.slice(0, -1) }));
    }
  };

  return (
    <div className="form-card">
      <div className="card-header">
        <i className="fas fa-edit"></i>
        <h3>Fill in the Blank</h3>
        <span className="card-subtitle">Add correct answers for blanks</span>
      </div>
      
      <div className="fill-blank-options">
        <div className="form-group-redesigned">
          <label>Use _____ in your question to indicate blank spaces</label>
          <small className="help-text">Students will need to fill in these blanks</small>
        </div>
        {formData.blank_answers.map((answer, index) => (
          <div key={index} className="blank-answer-item">
            <label>Blank {index + 1} - Correct Answer:</label>
            <input
              type="text"
              value={answer}
              onChange={(e) => handleBlankAnswerChange(index, e.target.value)}
              placeholder="Enter correct answer for this blank"
              required
            />
          </div>
        ))}
        <div className="blank-controls">
          <button
            type="button"
            onClick={addBlank}
            className="add-blank-btn"
          >
            <i className="fas fa-plus"></i>
            Add Blank
          </button>
          {formData.blank_answers.length > 1 && (
            <button
              type="button"
              onClick={removeBlank}
              className="remove-blank-btn"
            >
              <i className="fas fa-minus"></i>
              Remove Blank
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default FillBlankEditor;