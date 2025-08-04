import React, { useState } from 'react';

const MatchingTaskEditor = ({ formData, setFormData }) => {
  const [selectedLeftItem, setSelectedLeftItem] = useState(null);
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

  const handleLeftItemClick = (leftIndex) => {
    if (selectedLeftItem === leftIndex) {
      // Deselect if clicking the same item
      setSelectedLeftItem(null);
    } else {
      // Select this left item
      setSelectedLeftItem(leftIndex);
    }
  };

  const handleRightItemClick = (rightIndex) => {
    if (selectedLeftItem !== null) {
      // Create or update the match
      const newMatches = formData.correct_matches.filter(m => m.left !== selectedLeftItem);
      newMatches.push({ left: selectedLeftItem, right: rightIndex });
      setFormData(prev => ({ ...prev, correct_matches: newMatches }));
      // Clear selection after making a match
      setSelectedLeftItem(null);
    }
  };

  const handleRemoveMatch = (leftIndex) => {
    const newMatches = formData.correct_matches.filter(m => m.left !== leftIndex);
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
        <div className="matching-interface">
          <div className="matching-container">
            {/* Left Column */}
            <div className="left-column">
              <h5>
                <i className="fas fa-list"></i>
                Items to Match
              </h5>
              <div className="left-items">
                {formData.left_items.map((item, index) => {
                  const currentMatch = formData.correct_matches.find(m => m.left === index);
                  const isMatched = currentMatch !== undefined;
                  const isSelected = selectedLeftItem === index;
                  
                  return (
                    <div key={index} className={`left-item ${isMatched ? 'matched' : ''} ${isSelected ? 'selected' : ''}`}>
                      <div className="item-number">{index + 1}</div>
                      <input
                        type="text"
                        className="item-content-input"
                        value={item}
                        onChange={(e) => handleLeftItemChange(index, e.target.value)}
                        placeholder={`Enter item ${index + 1}`}
                        required
                      />
                      <div className="item-actions">
                        <div 
                          className="drag-handle clickable"
                          onClick={() => handleLeftItemClick(index)}
                          title={isSelected ? "Click to deselect" : "Click to select for matching"}
                        >
                          <i className="fas fa-grip-vertical"></i>
                        </div>
                        {isMatched && (
                          <button 
                            className="btn-remove-match"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveMatch(index);
                            }}
                            title="Remove this match"
                          >
                            <i className="fas fa-unlink"></i>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Connection Area */}
            <div className="connection-area">
              <div className="connection-instructions">
                {selectedLeftItem !== null ? (
                  <>
                    <i className="fas fa-hand-pointer"></i>
                    <span>Item {selectedLeftItem + 1} selected</span>
                    <small>Click a target to match</small>
                  </>
                ) : (
                  <>
                    <i className="fas fa-mouse-pointer"></i>
                    <span>Click to match</span>
                    <small>Select a source item first</small>
                  </>
                )}
              </div>
              
              <div className="match-progress">
                <div className="progress-info">
                  <span className="matches-count">{formData.correct_matches.length}/{formData.left_items.length}</span>
                  <span className="progress-label">matches defined</span>
                </div>
                <div className="progress-bar-mini">
                  <div 
                    className="progress-fill-mini" 
                    style={{ width: `${(formData.correct_matches.length / formData.left_items.length) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="right-column">
              <h5>
                <i className="fas fa-bullseye"></i>
                Match Targets
              </h5>
              <div className="right-items">
                {formData.right_items.map((item, index) => {
                  const isMatchedWith = formData.correct_matches.find(m => m.right === index);
                  const canReceiveMatch = selectedLeftItem !== null && !isMatchedWith;
                  
                  return (
                    <div key={index} className={`right-item ${isMatchedWith ? 'matched' : ''} ${canReceiveMatch ? 'can-receive' : ''}`}>
                      <div className="item-letter">{String.fromCharCode(65 + index)}</div>
                      <input
                        type="text"
                        className="item-content-input"
                        value={item}
                        onChange={(e) => handleRightItemChange(index, e.target.value)}
                        placeholder={`Enter target ${String.fromCharCode(65 + index)}`}
                        required
                      />
                      <div 
                        className={`drop-zone clickable ${canReceiveMatch ? 'ready' : ''}`}
                        onClick={() => handleRightItemClick(index)}
                        title={canReceiveMatch ? "Click to create match" : isMatchedWith ? "Already matched" : "Select a left item first"}
                      >
                        <i className="fas fa-crosshairs"></i>
                        {isMatchedWith && (
                          <div className="match-indicator">
                            <span className="matched-with">{isMatchedWith.left + 1}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
        
        <div className="matching-task-footer" style={{
          display: 'flex',
          flexDirection: 'row', 
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'nowrap',
          gap: '2rem'
        }}>
          <div className="task-status" style={{ flex: '0 0 auto' }}>
            <div className="status-info">
              <i className="fas fa-info-circle"></i>
              <span>
                {formData.correct_matches.length === formData.left_items.length ? (
                  "All matches defined! Ready for students."
                ) : (
                  `${formData.left_items.length - formData.correct_matches.length} more match(es) needed`
                )}
              </span>
            </div>
          </div>
          
          <div className="matching-controls" style={{ 
            flex: '0 0 auto',
            display: 'flex',
            flexDirection: 'row',
            gap: '0.75rem'
          }}>
            <button
              type="button"
              onClick={addMatchPair}
              className="btn-primary"
            >
              <i className="fas fa-plus"></i>
              Add Match Pair
            </button>
            {formData.left_items.length > 2 && (
              <button
                type="button"
                onClick={removeMatchPair}
                className="btn-cancel"
              >
                <i className="fas fa-minus"></i>
                Remove Match Pair
              </button>
            )}
          </div>
        </div>
        
      </div>
    </div>
  );
};

export default MatchingTaskEditor;