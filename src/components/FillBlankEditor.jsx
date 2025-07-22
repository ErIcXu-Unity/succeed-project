import React, { useState, useEffect } from 'react';
import './FillBlankEditor.css';

const FillBlankEditor = ({ formData, setFormData }) => {
  const [mode, setMode] = useState('enhanced'); // 'enhanced' or 'legacy'
  
  // Initialize enhanced format data if not present
  useEffect(() => {
    if (!formData.fill_blank_template) {
      setFormData(prev => ({
        ...prev,
        fill_blank_template: '',
        fill_blank_blanks: [
          {
            id: 0,
            placeholder: '',
            correct_answer: '',
            hints: ['']
          }
        ]
      }));
    }
  }, []);

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

  // Enhanced mode handlers
  const handleTemplateChange = (value) => {
    setFormData(prev => ({ ...prev, fill_blank_template: value }));
    
    // Auto-detect blanks from template
    const templateMatches = value.match(/\{\{[^}]+\}\}/g) || [];
    const currentBlanks = formData.fill_blank_blanks || [];
    
    // Update blanks array to match template
    const newBlanks = templateMatches.map((match, index) => {
      const placeholder = match.replace(/[{}]/g, '').trim();
      return currentBlanks[index] || {
        id: index,
        placeholder: placeholder,
        correct_answer: '',
        hints: ['']
      };
    });
    
    setFormData(prev => ({ ...prev, fill_blank_blanks: newBlanks }));
  };

  const handleBlankChange = (blankIndex, field, value) => {
    const newBlanks = [...(formData.fill_blank_blanks || [])];
    newBlanks[blankIndex] = { ...newBlanks[blankIndex], [field]: value };
    setFormData(prev => ({ ...prev, fill_blank_blanks: newBlanks }));
  };

  const handleHintChange = (blankIndex, hintIndex, value) => {
    const newBlanks = [...(formData.fill_blank_blanks || [])];
    const newHints = [...(newBlanks[blankIndex]?.hints || [''])];
    newHints[hintIndex] = value;
    newBlanks[blankIndex] = { ...newBlanks[blankIndex], hints: newHints };
    setFormData(prev => ({ ...prev, fill_blank_blanks: newBlanks }));
  };

  const addHint = (blankIndex) => {
    const newBlanks = [...(formData.fill_blank_blanks || [])];
    newBlanks[blankIndex] = {
      ...newBlanks[blankIndex],
      hints: [...(newBlanks[blankIndex]?.hints || ['']), '']
    };
    setFormData(prev => ({ ...prev, fill_blank_blanks: newBlanks }));
  };

  const removeHint = (blankIndex, hintIndex) => {
    const newBlanks = [...(formData.fill_blank_blanks || [])];
    const newHints = newBlanks[blankIndex]?.hints?.filter((_, i) => i !== hintIndex) || [''];
    if (newHints.length === 0) newHints.push('');
    newBlanks[blankIndex] = { ...newBlanks[blankIndex], hints: newHints };
    setFormData(prev => ({ ...prev, fill_blank_blanks: newBlanks }));
  };

  const handleModeChange = (newMode) => {
    setMode(newMode);
    
    // Update formData based on selected mode
    if (newMode === 'enhanced') {
      // Switch to enhanced format - prepare data structure
      const template = formData.fill_blank_template || '';
      const blanks = formData.fill_blank_blanks || [];
      
      setFormData(prev => ({
        ...prev,
        // Enhanced format uses question_data structure
        question_data: {
          enhanced: true,
          template: template,
          blanks: blanks.map(blank => ({
            id: blank.id || 0,
            placeholder: blank.placeholder || '',
            options: {
              hints: blank.hints?.filter(hint => hint.trim()) || []
            }
          }))
        }
      }));
    } else {
      // Switch to legacy format
      setFormData(prev => ({
        ...prev,
        blank_answers: prev.blank_answers || [''],
        // Remove enhanced data structure
        question_data: undefined
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
      
      {/* Mode Selection */}
      <div className="fill-blank-mode-selection">
        <div className="form-group-redesigned">
          <label className="form-label-redesigned">
            <i className="fas fa-toggle-on"></i>
            Question Format
          </label>
          <div className="mode-toggle-buttons">
            <button
              type="button"
              className={`mode-btn ${mode === 'enhanced' ? 'active' : ''}`}
              onClick={() => handleModeChange('enhanced')}
            >
              <i className="fas fa-magic"></i>
              Enhanced Format
              <small>Template with hints</small>
            </button>
            <button
              type="button"
              className={`mode-btn ${mode === 'legacy' ? 'active' : ''}`}
              onClick={() => handleModeChange('legacy')}
            >
              <i className="fas fa-list-ol"></i>
              Simple Format  
              <small>Numbered blanks</small>
            </button>
          </div>
        </div>
      </div>

      {mode === 'enhanced' ? (
        // Enhanced Fill Blank Editor
        <div className="enhanced-fill-blank-editor">
          <div className="form-group-redesigned">
            <label className="form-label-redesigned">
              <i className="fas fa-paragraph"></i>
              Question Template <span className="required">*</span>
            </label>
            <textarea
              className="form-textarea-redesigned template-input"
              value={formData.fill_blank_template || ''}
              onChange={(e) => handleTemplateChange(e.target.value)}
              placeholder="Write your question using {{placeholder}} for blanks. Example: The capital of {{country}} is {{capital}}."
              rows="3"
            />
            <small className="help-text">
              <i className="fas fa-info-circle"></i>
              Use <code>{'{{placeholder}}'}</code> syntax for blanks. Each placeholder will become a fillable input.
            </small>
          </div>

          {/* Template Preview */}
          {formData.fill_blank_template && (
            <div className="template-preview">
              <h4>
                <i className="fas fa-eye"></i>
                Template Preview
              </h4>
              <div className="preview-content">
                {formData.fill_blank_template.split(/\{\{[^}]+\}\}/).map((part, index) => (
                  <React.Fragment key={index}>
                    <span>{part}</span>
                    {index < (formData.fill_blank_template.match(/\{\{[^}]+\}\}/g) || []).length && (
                      <span className="blank-placeholder">
                        [Blank {index + 1}]
                      </span>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          )}

          {/* Blank Configuration */}
          {(formData.fill_blank_blanks || []).length > 0 && (
            <div className="blanks-configuration">
              <h4>
                <i className="fas fa-cogs"></i>
                Configure Blanks ({(formData.fill_blank_blanks || []).length})
              </h4>
              
              {(formData.fill_blank_blanks || []).map((blank, blankIndex) => (
                <div key={blankIndex} className="blank-config-card">
                  <div className="blank-config-header">
                    <h5>
                      <i className="fas fa-edit"></i>
                      Blank {blankIndex + 1}: {blank.placeholder}
                    </h5>
                  </div>
                  
                  <div className="blank-config-content">
                    <div className="form-group-redesigned">
                      <label className="form-label-redesigned">
                        <i className="fas fa-check-circle"></i>
                        Correct Answer <span className="required">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-input-redesigned"
                        value={blank.correct_answer || ''}
                        onChange={(e) => handleBlankChange(blankIndex, 'correct_answer', e.target.value)}
                        placeholder="Enter the correct answer"
                        required
                      />
                    </div>

                    <div className="form-group-redesigned">
                      <label className="form-label-redesigned">
                        <i className="fas fa-lightbulb"></i>
                        Hints (Optional)
                      </label>
                      {(blank.hints || ['']).map((hint, hintIndex) => (
                        <div key={hintIndex} className="hint-input-group">
                          <input
                            type="text"
                            className="form-input-redesigned hint-input"
                            value={hint}
                            onChange={(e) => handleHintChange(blankIndex, hintIndex, e.target.value)}
                            placeholder={`Hint ${hintIndex + 1} (optional)`}
                          />
                          <div className="hint-controls">
                            {hintIndex === (blank.hints || ['']).length - 1 && (
                              <button
                                type="button"
                                className="btn-icon add-hint"
                                onClick={() => addHint(blankIndex)}
                                title="Add another hint"
                              >
                                <i className="fas fa-plus"></i>
                              </button>
                            )}
                            {(blank.hints || ['']).length > 1 && (
                              <button
                                type="button"
                                className="btn-icon remove-hint"
                                onClick={() => removeHint(blankIndex, hintIndex)}
                                title="Remove this hint"
                              >
                                <i className="fas fa-times"></i>
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        // Legacy Fill Blank Editor
        <div className="legacy-fill-blank-editor">
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
              >
                <i className="fas fa-plus"></i>
                Add Blank
              </button>
              {(formData.blank_answers || ['']).length > 1 && (
                <button
                  type="button"
                  onClick={removeLegacyBlank}
                  className="btn-remove-blank"
                >
                  <i className="fas fa-minus"></i>
                  Remove Blank
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FillBlankEditor;