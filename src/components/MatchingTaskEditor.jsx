import React from 'react';

const MatchingTaskEditor = ({ formData, setFormData }) => {
  const handleLeftItemChange = (index, value) => {
    const newItems = [...formData.left_items];
    newItems[index] = value;
    setFormData(prev => ({ ...prev, left_items: newItems }));
  };

  const handleRightItemChange = (index, value) => {
    const newItems = [...formData.right_items];
    newItems[index] = value;
    setFormData(prev => ({ ...prev, right_items: newItems }));
  };

  const handleMatchChange = (leftIndex, rightIndex) => {
    const newMatches = formData.correct_matches.filter(m => m.left !== leftIndex);
    if (!isNaN(rightIndex) && rightIndex !== '') {
      newMatches.push({ left: leftIndex, right: parseInt(rightIndex) });
    }
    setFormData(prev => ({ ...prev, correct_matches: newMatches }));
  };

  const addMatchPair = () => {
    setFormData(prev => ({ 
      ...prev, 
      left_items: [...prev.left_items, ''],
      right_items: [...prev.right_items, '']
    }));
  };

  const removeMatchPair = () => {
    if (formData.left_items.length > 2) {
      const newLeftItems = formData.left_items.slice(0, -1);
      const newRightItems = formData.right_items.slice(0, -1);
      const newMatches = formData.correct_matches.filter(match => 
        match.left < newLeftItems.length && match.right < newRightItems.length
      );
      setFormData(prev => ({ 
        ...prev, 
        left_items: newLeftItems,
        right_items: newRightItems,
        correct_matches: newMatches
      }));
    }
  };

  return (
    <div className="form-card">
      <div className="card-header">
        <i className="fas fa-exchange-alt"></i>
        <h3>Matching Task Setup</h3>
        <span className="card-subtitle">Create items to match</span>
      </div>
      
      <div className="matching-task-options">
        <div className="matching-columns">
          <div className="left-column">
            <h4>Left Items</h4>
            {formData.left_items.map((item, index) => (
              <div key={index} className="match-item">
                <input
                  type="text"
                  value={item}
                  onChange={(e) => handleLeftItemChange(index, e.target.value)}
                  placeholder={`Left item ${index + 1}`}
                  required
                />
              </div>
            ))}
          </div>
          
          <div className="right-column">
            <h4>Right Items</h4>
            {formData.right_items.map((item, index) => (
              <div key={index} className="match-item">
                <input
                  type="text"
                  value={item}
                  onChange={(e) => handleRightItemChange(index, e.target.value)}
                  placeholder={`Right item ${index + 1}`}
                  required
                />
              </div>
            ))}
          </div>
        </div>
        
        <div className="matching-controls">
          <button
            type="button"
            onClick={addMatchPair}
            className="add-match-btn"
          >
            <i className="fas fa-plus"></i>
            Add Match Pair
          </button>
          {formData.left_items.length > 2 && (
            <button
              type="button"
              onClick={removeMatchPair}
              className="remove-match-btn"
            >
              <i className="fas fa-minus"></i>
              Remove Match Pair
            </button>
          )}
        </div>
        
        <div className="correct-matches">
          <h4>Correct Matches</h4>
          <p>Define which left items match with which right items:</p>
          {formData.left_items.map((leftItem, leftIndex) => {
            const currentMatch = formData.correct_matches.find(m => m.left === leftIndex);
            const isMatched = currentMatch !== undefined;
            
            return (
              <div key={leftIndex} className={`match-definition ${isMatched ? 'matched' : 'unmatched'}`}>
                <span>"{leftItem || `Left ${leftIndex + 1}`}" matches with:</span>
                <select
                  value={currentMatch?.right || ''}
                  onChange={(e) => handleMatchChange(leftIndex, e.target.value)}
                  className={isMatched ? 'matched-select' : 'unmatched-select'}
                >
                  <option value="">Select right item...</option>
                  {formData.right_items.map((rightItem, rightIndex) => (
                    <option key={rightIndex} value={rightIndex}>
                      "{rightItem || `Right ${rightIndex + 1}`}"
                    </option>
                  ))}
                </select>
                <span className={`match-status ${isMatched ? 'complete' : 'incomplete'}`}>
                  {isMatched ? '✓ Matched' : '⚠ Not matched'}
                </span>
              </div>
            );
          })}
          
          {/* Debug information */}
          <div className="match-summary">
            <small>
              <strong>Matches defined:</strong> {formData.correct_matches.length} of {formData.left_items.length}
              {formData.correct_matches.length > 0 && (
                <span> | <strong>Current matches:</strong> {
                  formData.correct_matches.map(m => `${m.left + 1}→${String.fromCharCode(65 + m.right)}`).join(', ')
                }</span>
              )}
            </small>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MatchingTaskEditor;