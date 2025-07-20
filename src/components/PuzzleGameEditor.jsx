import React from 'react';

const PuzzleGameEditor = ({ formData, setFormData }) => {
  const handleSolutionChange = (value) => {
    setFormData(prev => ({ ...prev, puzzle_solution: value }));
  };

  const handleFragmentChange = (index, value) => {
    const newFragments = [...formData.puzzle_fragments];
    newFragments[index] = value;
    setFormData(prev => ({ ...prev, puzzle_fragments: newFragments }));
  };

  const addFragment = () => {
    setFormData(prev => ({ ...prev, puzzle_fragments: [...prev.puzzle_fragments, ''] }));
  };

  const removeFragment = () => {
    if (formData.puzzle_fragments.length > 1) {
      setFormData(prev => ({ ...prev, puzzle_fragments: prev.puzzle_fragments.slice(0, -1) }));
    }
  };

  return (
    <div className="form-card">
      <div className="card-header">
        <i className="fas fa-puzzle-piece"></i>
        <h3>Puzzle Game Setup</h3>
        <span className="card-subtitle">Create formula fragments to assemble</span>
      </div>
      
      <div className="puzzle-game-options">
        <div className="form-group-redesigned">
          <label>Complete Solution:</label>
          <input
            type="text"
            value={formData.puzzle_solution}
            onChange={(e) => handleSolutionChange(e.target.value)}
            placeholder="e.g., H2O + NaCl → NaOH + HCl"
            required
          />
          <small className="help-text">This is the complete, correct formula or equation</small>
        </div>
        
        <div className="form-group-redesigned">
          <label>Fragments (drag and drop to assemble):</label>
          <small className="help-text">Break the solution into pieces that students will arrange</small>
          {formData.puzzle_fragments.map((fragment, index) => (
            <div key={index} className="fragment-item">
              <input
                type="text"
                value={fragment}
                onChange={(e) => handleFragmentChange(index, e.target.value)}
                placeholder={`Fragment ${index + 1} (e.g., H2O, +, →)`}
                required
              />
            </div>
          ))}
          <div className="fragment-controls">
            <button
              type="button"
              onClick={addFragment}
              className="add-fragment-btn"
            >
              <i className="fas fa-plus"></i>
              Add Fragment
            </button>
            {formData.puzzle_fragments.length > 1 && (
              <button
                type="button"
                onClick={removeFragment}
                className="remove-fragment-btn"
              >
                <i className="fas fa-minus"></i>
                Remove Fragment
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PuzzleGameEditor;