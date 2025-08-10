import React, { useState, useEffect } from 'react';
import './FillBlankEditor.css';

const FillBlankEditor = ({ formData, setFormData }) => {

  // Legacy mode handlers
  const handleLegacyTemplateChange = (value) => {
    setFormData(prev => ({ ...prev, question: value }));
    
    // Auto-detect blanks from template in legacy mode too
    const templateMatches = value.match(/\{\{[^}]+\}\}/g) || [];
    const currentAnswers = formData.blank_answers || [];
    
    // Update blank answers array to match template
    const newAnswers = templateMatches.map((match, index) => {
      return currentAnswers[index] || '';
    });
    
    // Ensure we have at least one blank
    if (newAnswers.length === 0) {
      newAnswers.push('');
    }
    
    setFormData(prev => ({ ...prev, blank_answers: newAnswers }));
  };

  const handleBlankAnswerChange = (index, value) => {
    const newAnswers = [...(formData.blank_answers || [''])];
    newAnswers[index] = value;
    setFormData(prev => ({ ...prev, blank_answers: newAnswers }));
  };

  const addLegacyBlank = () => {
    setFormData(prev => ({ 
      ...prev, 
      blank_answers: [...(prev.blank_answers || ['']), ''] 
    }));
  };

  const removeLegacyBlank = () => {
    if ((formData.blank_answers || ['']).length > 1) {
      setFormData(prev => ({ 
        ...prev, 
        blank_answers: prev.blank_answers.slice(0, -1) 
      }));
    }
  };


  return (
    <div className="form-card">
      <div className="card-header">
        <i className="fas fa-edit"></i>
        <h3>Fill in the Blank</h3>
        <span className="card-subtitle">Create interactive fill-in-the-blank questions</span>
      </div>
      
      {/* Fill Blank Editor */}
      <div className="fill-blank-editor">
          <div className="form-group-redesigned">
            <label className="form-label-redesigned">
              <i className="fas fa-paragraph"></i>
              Question Template <span className="required">*</span>
            </label>
            <textarea
              className="form-textarea-redesigned template-input"
              value={formData.question || ''}
              onChange={(e) => handleLegacyTemplateChange(e.target.value)}
              placeholder="Write your question using {{placeholder}} for blanks. Example: The capital of {{country}} is {{capital}}."
              rows="3"
              data-cy="fill-blank-template"
            />
            <small className="help-text">
              <i className="fas fa-info-circle"></i>
              Use <code>{'{{placeholder}}'}</code> syntax for blanks. Each placeholder will become a fillable input.
            </small>
          </div>

          {/* Template Preview for Legacy Mode */}
          {formData.question && (
            <div className="template-preview">
              <h4>
                <i className="fas fa-eye"></i>
                Template Preview
              </h4>
              <div className="preview-content">
                {formData.question.split(/\{\{[^}]+\}\}/).map((part, index) => (
                  <React.Fragment key={index}>
                    <span>{part}</span>
                    {index < (formData.question.match(/\{\{[^}]+\}\}/g) || []).length && (
                      <span className="blank-placeholder">
                        [Blank {index + 1}]
                      </span>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          )}
          
          <div className="legacy-blanks-list">
            <div className="section-header">
              <h4>
                <i className="fas fa-list-ol"></i>
                Blank Answers ({(formData.blank_answers || ['']).length})
              </h4>
            </div>
            
            <div className="blank-answers-container">
              {(formData.blank_answers || ['']).map((answer, index) => {
                // Extract placeholder name from template
                const templateMatches = (formData.question || '').match(/\{\{[^}]+\}\}/g) || [];
                const placeholder = templateMatches[index] ? 
                  templateMatches[index].replace(/[{}]/g, '').trim() : 
                  `blank_${index + 1}`;
                
                return (
                  <div key={index} className="blank-answer-card">
                    <div className="blank-number">
                      <i className="fas fa-edit"></i>
                      {index + 1}
                    </div>
                    <div className="blank-input-section">
                      <label className="blank-label">
                        Correct Answer for "{placeholder}":
                      </label>
                      <input
                        type="text"
                        className="form-input-redesigned blank-input"
                        value={answer}
                        onChange={(e) => handleBlankAnswerChange(index, e.target.value)}
                        placeholder={`Enter correct answer for ${placeholder}`}
                        required
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="blank-controls">
              <button
                type="button"
                onClick={addLegacyBlank}
                className="btn-add-blank"
                data-cy="add-blank-btn"
              >
                <i className="fas fa-plus"></i>
                Add Blank
              </button>
              {(formData.blank_answers || ['']).length > 1 && (
                <button
                  type="button"
                  onClick={removeLegacyBlank}
                  className="btn-remove-blank"
                  data-cy="remove-blank-btn"
                >
                  <i className="fas fa-minus"></i>
                  Remove Blank
                </button>
              )}
            </div>
          </div>
      </div>
    </div>
  );
};

export default FillBlankEditor;