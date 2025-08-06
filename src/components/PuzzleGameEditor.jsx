import React, { useState, useEffect } from 'react';
import './PuzzleGameEditor.css'

const PuzzleGameEditor = ({ formData, setFormData }) => {
  const [inputMode, setInputMode] = useState('text'); // 'text', 'math', 'chemistry'
  const [previewMode, setPreviewMode] = useState(false);
  const [autoFragments, setAutoFragments] = useState([]);
  const [validationStatus, setValidationStatus] = useState({ isValid: true, message: '' });

  // Auto-generate fragment suggestions based on solution
  useEffect(() => {
    if (formData.puzzle_solution) {
      const suggestions = generateFragmentSuggestions(formData.puzzle_solution, inputMode);
      setAutoFragments(suggestions);
      validatePuzzle();
    } else {
      setAutoFragments([]);
    }
    validatePuzzle();
  }, [formData.puzzle_solution, inputMode]);

  // Generate smart fragment suggestions
  const generateFragmentSuggestions = (solution, mode) => {
    if (!solution.trim()) return [];

    let suggestions = [];

    switch (mode) {
      case 'chemistry':
        suggestions = generateChemistryFragments(solution);
        break;
      case 'math':
        suggestions = generateMathFragments(solution);
        break;
      default:
        suggestions = generateTextFragments(solution);
    }

    return suggestions;
  };

  const generateChemistryFragments = (solution) => {
    // Pattern for chemical equations: "2H2 + O2 -> 2H2O"
    const arrowPattern = /(\s*[->\s=]+\s*)/
    const plusPattern = /(\s*\+\s*)/;

    let fragments = [];

    // Split by reaction arrow first
    if (arrowPattern.test(solution)) {
      const parts = solution.split(arrowPattern);
      for (let i = 0; i < parts.length; i++) {
        if (arrowPattern.test(parts[i])) {
          fragments.push(parts[i].trim());
        } else if (parts[i].trim()) {
          // Split reactants/products by +
          const compounds = parts[i].split(plusPattern);
          compounds.forEach(compound => {
            if (compound.trim() && !plusPattern.test(compound)) {
              fragments.push(compound.trim());
            } else if (plusPattern.test(compound)) {
              fragments.push(compound.trim());
            }
          });
        }
      }
    } else {
      // Simple compound or formula
      fragments = [solution.trim()];
    }

    return fragments.filter(f => f.length > 0);
  };

  const generateMathFragments = (solution) => {
    // Enhanced pattern for mathematical expressions including probability, statistics, and advanced symbols
    const specialFunctionPattern = /(ℙ\([^)]+\)|𝔼\[[^\]]+\]|Var\([^)]+\)|Cov\([^)]+\)|lim_\{[^}]+\}|∑[^=]+|∫[^d]+d[a-z]|fₓ\([^)]+\)|Fₓ\([^)]+\)|𝒩\([^)]+\)|𝟙[ₐ-ₖ])/g;
    const operatorPattern = /(\s*[+\-*/=<>≤≥∪∩⊆∈∉∼⫫≐]+\s*)/;
    const arrowPattern = /(\s*[->]+\s*)/
    const parenPattern = /([()[\]{}])/;

    let fragments = [];
    let remaining = solution;

    // First extract special functions and preserve them as single units
    const specialMatches = remaining.match(specialFunctionPattern);
    if (specialMatches) {
      specialMatches.forEach((match, index) => {
        const placeholder = `__SPECIAL_${index}__`;
        remaining = remaining.replace(match, ` ${placeholder} `);
      });
    }

    // Handle parentheses
    const parenMatches = remaining.match(/[()[\]{}]/g);
    if (parenMatches) {
      remaining = remaining.replace(parenPattern, ' $1 ');
    }

    // Handle arrows
    if (arrowPattern.test(remaining)) {
      remaining = remaining.replace(arrowPattern, ' $1 ');
    }

    // Split by operators while preserving them
    const parts = remaining.split(/(\s*[+\-*/=<>≤≥∪∩⊆∈∉∼⫫≐()[\]{}]+\s*|->)/);;

    parts.forEach(part => {
      const trimmed = part.trim();
      if (trimmed) {
        // Restore special functions
        if (trimmed.includes('__SPECIAL_') && specialMatches) {
          specialMatches.forEach((match, index) => {
            const placeholder = `__SPECIAL_${index}__`;
            if (trimmed === placeholder) {
              fragments.push(match);
            }
          });
        } else {
          fragments.push(trimmed);
        }
      }
    });

    // Handle Greek letters and mathematical constants as separate entities if they appear standalone
    const greekPattern = /\b[α-ωΑ-Ω]\b/g;
    const finalFragments = [];

    fragments.forEach(fragment => {
      if (greekPattern.test(fragment) && fragment.length === 1) {
        finalFragments.push(fragment);
      } else if (fragment.length > 1 && /[α-ωΑ-Ω]/.test(fragment)) {
        // Split complex expressions containing Greek letters
        const subParts = fragment.split(/([α-ωΑ-Ω])/);
        subParts.forEach(subPart => {
          if (subPart.trim()) {
            finalFragments.push(subPart.trim());
          }
        });
      } else {
        finalFragments.push(fragment);
      }
    });

    return finalFragments.filter(f => f.length > 0);
  };

  const generateTextFragments = (solution) => {
    // Simple word/phrase splitting
    const words = solution.split(/(\s+)/).filter(part => part.trim());
    return words;
  };

  // Validate puzzle configuration
  const validatePuzzle = () => {
    const solution = (formData.puzzle_solution || '').trim();

    if (!solution) {
      setValidationStatus({
        isValid: false,
        message: 'Solution is required',
        type: 'solution'
      });
      return;
    }

    setValidationStatus({
      isValid: true,
      message: 'Solution is valid',
      type: 'valid'
    });
  };

  const handleSolutionChange = (value) => {
    setFormData(prev => ({ ...prev, puzzle_solution: value || '' }));
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

  const useAutoFragments = () => {
    setFormData(prev => ({ ...prev, puzzle_fragments: [...autoFragments] }));
  };

  const clearFragments = () => {
    setFormData(prev => ({ ...prev, puzzle_fragments: [''] }));
  };

  const renderInputModeSelector = () => (
    <div className="input-mode-selector">
      <label>Input Type:</label>
      <div className="mode-buttons">
        <button
          type="button"
          className={`mode-btn ${inputMode === 'text' ? 'active' : ''}`}
          onClick={() => setInputMode('text')}
        >
          <i className="fas fa-font"></i>
          Text
        </button>
        <button
          type="button"
          className={`mode-btn ${inputMode === 'math' ? 'active' : ''}`}
          onClick={() => setInputMode('math')}
        >
          <i className="fas fa-square-root-alt"></i>
          Math
        </button>
        <button
          type="button"
          className={`mode-btn ${inputMode === 'chemistry' ? 'active' : ''}`}
          onClick={() => setInputMode('chemistry')}
        >
          <i className="fas fa-flask"></i>
          Chemistry
        </button>
      </div>
    </div>
  );

  const renderSolutionInput = () => {
    const placeholders = {
      text: 'e.g., The quick brown fox',
      math: 'e.g., ℙ(A∣B) = ℙ(A∩B) / ℙ(B) or 2x + 3y = 7',
      chemistry: 'e.g., 2H₂ + O₂ -> 2H₂O'
    };

    return (
      <div className="solution-input-section">

        <label>Complete Solution:</label>
        <div className="input-with-tools">
          <input
            type="text"
            value={formData.puzzle_solution || ''}
            onChange={(e) => {
              const value = e.target.value.replace(/^\s+/g, ''); // 只去除开头空格
              handleSolutionChange(value);
            }}
            onBlur={(e) => {
              const value = e.target.value.trim();
              handleSolutionChange(value);
              validatePuzzle(); // 触发即时验证
            }}
            placeholder={placeholders[inputMode]}
            className={`solution-input ${validationStatus.isValid === false ? 'invalid' : ''  // 修正条件判断
              }`}
            required
          />
          {inputMode === 'chemistry' && (
            <div className="chemistry-helpers">
              <div className="helper-section">
                <small className="helper-label">Subscripts:</small>
                <div className="helper-buttons">
                  <button type="button" onClick={() => insertSymbol('₁')}>₁</button>
                  <button type="button" onClick={() => insertSymbol('₂')}>₂</button>
                  <button type="button" onClick={() => insertSymbol('₃')}>₃</button>
                  <button type="button" onClick={() => insertSymbol('₄')}>₄</button>
                  <button type="button" onClick={() => insertSymbol('₅')}>₅</button>
                  <button type="button" onClick={() => insertSymbol('₆')}>₆</button>
                </div>
              </div>
              <div className="helper-section">
                <small className="helper-label">Arrows & Reactions:</small>
                <div className="helper-buttons">
                  <button type="button" onClick={() => insertSymbol('->')}>-&gt;</button>
                  <button type="button" onClick={() => insertSymbol('⇌')}>⇌</button>
                  <button type="button" onClick={() => insertSymbol('⇄')}>⇄</button>
                  <button type="button" onClick={() => insertSymbol('→')}>→</button>
                </div>
              </div>
              <div className="helper-section">
                <small className="helper-label">States & Conditions:</small>
                <div className="helper-buttons">
                  <button type="button" onClick={() => insertSymbol('(s)')}>(s)</button>
                  <button type="button" onClick={() => insertSymbol('(l)')}>(l)</button>
                  <button type="button" onClick={() => insertSymbol('(g)')}>(g)</button>
                  <button type="button" onClick={() => insertSymbol('(aq)')}>(aq)</button>
                  <button type="button" onClick={() => insertSymbol('Δ')}>Δ</button>
                  <button type="button" onClick={() => insertSymbol('hν')}>hν</button>
                </div>
              </div>
              <div className="helper-section">
                <small className="helper-label">Common Ions:</small>
                <div className="helper-buttons">
                  <button type="button" onClick={() => insertSymbol('⁺')}>⁺</button>
                  <button type="button" onClick={() => insertSymbol('⁻')}>⁻</button>
                  <button type="button" onClick={() => insertSymbol('²⁺')}>²⁺</button>
                  <button type="button" onClick={() => insertSymbol('²⁻')}>²⁻</button>
                  <button type="button" onClick={() => insertSymbol('³⁺')}>³⁺</button>
                  <button type="button" onClick={() => insertSymbol('³⁻')}>³⁻</button>
                </div>
              </div>
            </div>
          )}
          {inputMode === 'math' && (
            <div className="math-helpers">
              <div className="helper-section">
                <small className="helper-label">Superscripts:</small>
                <div className="helper-buttons">
                  <button type="button" onClick={() => insertSymbol('⁰')}>⁰</button>
                  <button type="button" onClick={() => insertSymbol('¹')}>¹</button>
                  <button type="button" onClick={() => insertSymbol('²')}>²</button>
                  <button type="button" onClick={() => insertSymbol('³')}>³</button>
                  <button type="button" onClick={() => insertSymbol('⁴')}>⁴</button>
                  <button type="button" onClick={() => insertSymbol('⁵')}>⁵</button>
                  <button type="button" onClick={() => insertSymbol('⁺')}>⁺</button>
                  <button type="button" onClick={() => insertSymbol('⁻')}>⁻</button>
                </div>
              </div>

              <div className="helper-section">
                <small className="helper-label">Subscripts:</small>
                <div className="helper-buttons">
                  <button type="button" onClick={() => insertSymbol('₀')}>₀</button>
                  <button type="button" onClick={() => insertSymbol('₁')}>₁</button>
                  <button type="button" onClick={() => insertSymbol('₂')}>₂</button>
                  <button type="button" onClick={() => insertSymbol('₃')}>₃</button>
                  <button type="button" onClick={() => insertSymbol('₄')}>₄</button>
                  <button type="button" onClick={() => insertSymbol('₅')}>₅</button>
                  <button type="button" onClick={() => insertSymbol('₊')}>₊</button>
                  <button type="button" onClick={() => insertSymbol('₋')}>₋</button>
                </div>
              </div>

              <div className="helper-section">
                <small className="helper-label">Basic:</small>
                <div className="helper-buttons">
                  <button type="button" onClick={() => insertSymbol('≤')}>≤</button>
                  <button type="button" onClick={() => insertSymbol('≥')}>≥</button>
                  <button type="button" onClick={() => insertSymbol('±')}>±</button>
                  <button type="button" onClick={() => insertSymbol('∞')}>∞</button>
                  <button type="button" onClick={() => insertSymbol('√')}>√</button>
                  <button type="button" onClick={() => insertSymbol('≠')}>≠</button>
                  <button type="button" onClick={() => insertSymbol('|')}>|</button>
                  <button type="button" onClick={() => insertSymbol('x̄')}>x̄</button>
                </div>
              </div>

              <div className="helper-section">
                <small className="helper-label">Probability & Statistics:</small>
                <div className="helper-buttons">
                  <button type="button" onClick={() => insertSymbol('P(A)')}>P(A)</button>
                  <button type="button" onClick={() => insertSymbol('E[X]')}>E[X]</button>
                  <button type="button" onClick={() => insertSymbol('Var(X)')}>Var(X)</button>
                  <button type="button" onClick={() => insertSymbol('P(A|B)')}>P(A|B)</button>
                  <button type="button" onClick={() => insertSymbol('μ₀')}>μ₀</button>
                  <button type="button" onClick={() => insertSymbol('σ²')}>σ²</button>
                  <button type="button" onClick={() => insertSymbol('H₀')}>H₀</button>
                  <button type="button" onClick={() => insertSymbol('Hₐ')}>Hₐ</button>
                </div>
              </div>

              <div className="helper-section">
                <small className="helper-label">Sets & Logic:</small>
                <div className="helper-buttons">
                  <button type="button" onClick={() => insertSymbol('∪')}>∪</button>
                  <button type="button" onClick={() => insertSymbol('∩')}>∩</button>
                  <button type="button" onClick={() => insertSymbol('⊆')}>⊆</button>
                  <button type="button" onClick={() => insertSymbol('∈')}>∈</button>
                  <button type="button" onClick={() => insertSymbol('∉')}>∉</button>
                  <button type="button" onClick={() => insertSymbol('∅')}>∅</button>
                </div>
              </div>

              <div className="helper-section">
                <small className="helper-label">Calculus:</small>
                <div className="helper-buttons">
                  <button type="button" onClick={() => insertSymbol('lim')}>lim</button>
                  <button type="button" onClick={() => insertSymbol('∑')}>∑</button>
                  <button type="button" onClick={() => insertSymbol('∫')}>∫</button>
                  <button type="button" onClick={() => insertSymbol('∂')}>∂</button>
                  <button type="button" onClick={() => insertSymbol('∇')}>∇</button>
                </div>
              </div>

              <div className="helper-section">
                <small className="helper-label">Greek Letters:</small>
                <div className="helper-buttons">
                  <button type="button" onClick={() => insertSymbol('α')}>α</button>
                  <button type="button" onClick={() => insertSymbol('β')}>β</button>
                  <button type="button" onClick={() => insertSymbol('γ')}>γ</button>
                  <button type="button" onClick={() => insertSymbol('δ')}>δ</button>
                  <button type="button" onClick={() => insertSymbol('ε')}>ε</button>
                  <button type="button" onClick={() => insertSymbol('θ')}>θ</button>
                  <button type="button" onClick={() => insertSymbol('λ')}>λ</button>
                  <button type="button" onClick={() => insertSymbol('μ')}>μ</button>
                  <button type="button" onClick={() => insertSymbol('π')}>π</button>
                  <button type="button" onClick={() => insertSymbol('ρ')}>ρ</button>
                  <button type="button" onClick={() => insertSymbol('σ')}>σ</button>
                  <button type="button" onClick={() => insertSymbol('τ')}>τ</button>
                  <button type="button" onClick={() => insertSymbol('φ')}>φ</button>
                  <button type="button" onClick={() => insertSymbol('χ')}>χ</button>
                  <button type="button" onClick={() => insertSymbol('ψ')}>ψ</button>
                  <button type="button" onClick={() => insertSymbol('ω')}>ω</button>
                </div>
              </div>
            </div>
          )}
        </div>
        <small className="help-text">
          This is the complete, correct {inputMode === 'chemistry' ? 'chemical equation' : inputMode === 'math' ? 'mathematical expression' : 'solution'}
        </small>
      </div>
    );
  };

  const insertSymbol = (symbol) => {
    const input = document.querySelector('.solution-input');
    if (!input) return; // 增加安全性检查

    const start = input.selectionStart;
    const end = input.selectionEnd;
    const currentValue = formData.puzzle_solution || ''; // 处理空值情况
    const newValue = currentValue.substring(0, start) + symbol + currentValue.substring(end);

    handleSolutionChange(newValue);

    // 重置光标位置前检查input是否存在
    setTimeout(() => {
      if (input) {
        input.focus();
        input.setSelectionRange(start + symbol.length, start + symbol.length);
      }
    }, 0);
  };

  return (
    <div className="enhanced-puzzle-editor">
      <div className="card-header">
        <i className="fas fa-puzzle-piece"></i>
        <h3>Enhanced Puzzle Game Setup</h3>
        <span className="card-subtitle">Create puzzles with math, chemistry, or text fragments</span>
      </div>

      <div className="puzzle-editor-content">
        {/* Input Mode Selector */}
        {renderInputModeSelector()}

        {/* Solution Input */}
        {renderSolutionInput()}

        {/* Validation Status */}
        <div className="validation-container">
          {validationStatus.message && (
            <div className={`validation-message ${validationStatus.isValid ? 'valid' : 'invalid'
              }`}>
              <i className={`fas ${validationStatus.isValid ? 'fa-check-circle' : 'fa-exclamation-circle'
                }`} />
              <span>{validationStatus.message}</span>
            </div>
          )}
        </div>

        {/* Auto-generated Suggestions */}
        {autoFragments.length > 0 && (
          <div className="auto-suggestions">
            <div className="suggestions-header">
              <h4>
                <i className="fas fa-magic"></i>
                Smart Fragment Suggestions
              </h4>
              <div className="suggestion-actions">
                <button
                  type="button"
                  onClick={useAutoFragments}
                  className="use-suggestions-btn"
                >
                  <i className="fas fa-wand-magic-sparkles"></i>
                  Use These Fragments
                </button>
              </div>
            </div>
            <div className="suggested-fragments">
              {autoFragments.map((fragment, index) => (
                <span key={index} className="suggested-fragment">
                  {fragment}
                </span>
              ))}
            </div>
            <small className="suggestion-note">
              Based on your {inputMode} input, these fragments are recommended
            </small>
          </div>
        )}

        {/* Manual Fragment Editor */}
        <div className="manual-fragments-section">
          <div className="section-header">
            <label>Custom Fragments:</label>
            <div className="fragment-actions">
              <button
                type="button"
                onClick={clearFragments}
                className="clear-fragments-btn"
              >
                <i className="fas fa-eraser"></i>
                Clear All
              </button>
            </div>
          </div>

          <small className="help-text">
            Manually edit fragments that students will drag and drop to assemble
          </small>

          <div className="fragments-list">
            {formData.puzzle_fragments.map((fragment, index) => (
              <div key={index} className="fragment-editor-item">
                <div className="fragment-number">{index + 1}</div>
                <input
                  type="text"
                  value={fragment}
                  onChange={(e) => handleFragmentChange(index, e.target.value)}
                  placeholder={`Fragment ${index + 1} ${inputMode === 'chemistry' ? '(e.g., H₂O, +, ->)' : inputMode === 'math' ? '(e.g., 2x, +, =)' : '(e.g., word, phrase)'}`}
                  className="fragment-input"
                />
                <button
                  type="button"
                  onClick={() => {
                    const newFragments = formData.puzzle_fragments.filter((_, i) => i !== index);
                    setFormData(prev => ({ ...prev, puzzle_fragments: newFragments }));
                  }}
                  className="remove-fragment-btn"
                  disabled={formData.puzzle_fragments.length <= 1}
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
            ))}
          </div>

          <div className="fragment-controls">
            <button
              type="button"
              onClick={addFragment}
              className="add-fragment-btn"
            >
              <i className="fas fa-plus"></i>
              Add Fragment
            </button>
          </div>
        </div>

        {/* Preview Section */}
        <div className="preview-section">
          <div className="preview-header">
            <h4>
              <i className="fas fa-eye"></i>
              Live Preview
            </h4>
            <button
              type="button"
              onClick={() => setPreviewMode(!previewMode)}
              className={`preview-toggle ${previewMode ? 'active' : ''}`}
            >
              <i className={`fas ${previewMode ? 'fa-eye-slash' : 'fa-eye'}`}></i>
              {previewMode ? 'Hide' : 'Show'} Preview
            </button>
          </div>

          {previewMode && (
            <div className="puzzle-preview">
              <div className="preview-solution">
                <strong>Target Solution:</strong>
                <div className="solution-display">{formData.puzzle_solution || 'Enter solution above'}</div>
              </div>

              <div className="preview-fragments">
                <strong>Available Fragments:</strong>
                <div className="fragments-display">
                  {formData.puzzle_fragments.filter(f => f.trim()).length > 0 ? (
                    formData.puzzle_fragments
                      .filter(f => f.trim())
                      .sort(() => Math.random() - 0.5) // Shuffled preview
                      .map((fragment, index) => (
                        <span key={index} className="preview-fragment">
                          {fragment}
                        </span>
                      ))
                  ) : (
                    <span className="no-fragments">No fragments yet</span>
                  )}
                </div>
              </div>

              <div className="preview-difficulty">
                <strong>Estimated Difficulty:</strong>
                <div className="difficulty-indicator">
                  {getDifficultyLevel()}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Helper function to estimate difficulty
const getDifficultyLevel = () => {
  // This would be implemented based on fragment count, complexity, etc.
  return (
    <div className="difficulty-badges">
      <span className="difficulty-badge medium">Medium</span>
      <small>Based on fragment count and complexity</small>
    </div>
  );
};

export default PuzzleGameEditor;