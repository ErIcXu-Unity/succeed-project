import React, { useState, useEffect, useRef, memo, useCallback } from 'react';

const InteractiveQuestionRenderer = ({ question, currentAnswer, onAnswerChange }) => {
  const [fillBlankAnswers, setFillBlankAnswers] = useState([]);
  const [showHints, setShowHints] = useState({});

  const questionType = question.question_type || 'single_choice';
  
  // Parse question_data if it's a JSON string
  let questionData = {};
  try {
    if (typeof question.question_data === 'string') {
      questionData = JSON.parse(question.question_data);
    } else {
      questionData = question.question_data || {};
    }
  } catch (error) {
    console.error('Error parsing question_data:', error);
    questionData = {};
  }

  // Initialize fill-blank answers when question changes
  useEffect(() => {
    if (questionType === 'fill_blank') {
      let expectedLength = 0;
      
      // Check for blank_answers in question_data or direct question structure
      const blankAnswers = questionData.blank_answers || question.blank_answers || [];
      if (blankAnswers.length > 0) {
        expectedLength = blankAnswers.length;
      } else if (questionData.enhanced && questionData.blanks) {
        expectedLength = questionData.blanks.length;
        // Count actual {{...}} patterns in template to verify
        const templateMatches = (questionData.template || '').match(/\{\{[^}]+\}\}/g);
        if (templateMatches) {
          expectedLength = templateMatches.length; // Use actual template count
        }
      }
      
      if (expectedLength > 0) {
        // Use saved answers if available, otherwise initialize with empty strings
        const savedAnswers = Array.isArray(currentAnswer) ? currentAnswer : [];
        const initialAnswers = Array(expectedLength).fill('').map((_, index) => 
          savedAnswers[index] || ''
        );
        setFillBlankAnswers(initialAnswers);
        
        // Only call onAnswerChange if we don't have saved answers to avoid overwriting
        if (!Array.isArray(currentAnswer) || currentAnswer.length === 0) {
          onAnswerChange(initialAnswers);
        }
      }
    }
    
    // Reset hints
    setShowHints({});
  }, [question.id, currentAnswer]);

  // Handle fill-blank answer changes
  const handleFillBlankChange = (index, value) => {
    const newAnswers = [...fillBlankAnswers];
    newAnswers[index] = value;
    setFillBlankAnswers(newAnswers);
    onAnswerChange(newAnswers);
  };

  // Toggle hint visibility
  const toggleHint = (blankIndex) => {
    setShowHints(prev => ({
      ...prev,
      [blankIndex]: !prev[blankIndex]
    }));
  };

  // 渲染函数定义为箭头函数避免语法错误
  const renderEnhancedFillBlank = useCallback(() => {
    const template = questionData.template || '';
    const blanks = questionData.blanks || [];
    
    // Split template by {{...}} patterns
    const templateParts = template.split(/\{\{[^}]+\}\}/);
    const blankMatches = template.match(/\{\{[^}]+\}\}/g) || [];
    
    // Build the rendered content
    const elements = [];
    
    for (let i = 0; i < templateParts.length; i++) {
      // Add text part
      if (templateParts[i]) {
        elements.push(
          <span key={`text-${i}`}>{templateParts[i]}</span>
        );
      }
      
      // Add input if there's a corresponding blank
      if (i < blankMatches.length && i < blanks.length) {
        const blank = blanks[i];
        const hasHints = blank.options?.hints && blank.options.hints.length > 0;
        
        elements.push(
          <span key={`blank-${i}`} className="fill-blank-input-wrapper">
            <input
              type="text"
              className="fill-blank-input"
              value={fillBlankAnswers[i] || ''}
              onChange={(e) => handleFillBlankChange(i, e.target.value)}
              placeholder={blank.placeholder || `Blank ${i + 1}`}
              style={{ minWidth: '120px', width: 'auto' }}
            />
            {hasHints && (
              <button
                type="button"
                className="hint-button"
                onClick={() => toggleHint(i)}
                title="Show hint"
              >
                <i className="fas fa-lightbulb"></i>
              </button>
            )}
            {showHints[i] && hasHints && (
              <div className="hint-tooltip">
                {blank.options.hints.map((hint, hintIndex) => (
                  <div key={hintIndex} className="hint-item">
                    <i className="fas fa-info-circle"></i>
                    {hint}
                  </div>
                ))}
              </div>
            )}
          </span>
        );
      }
    }
    
    return (
      <div className="enhanced-fill-blank-question">
        <div className="fill-blank-template">
          {elements}
        </div>
        <div className="fill-blank-progress">
          {fillBlankAnswers.filter(answer => answer && answer.trim()).length} of {blankMatches.length} blanks filled
        </div>
      </div>
    );
  }, [questionData, fillBlankAnswers, showHints]);

  const renderLegacyFillBlank = useCallback(() => {
    const blankAnswers = questionData.blank_answers || question.blank_answers || [];
    
    // Extract placeholders from question text for better UX
    const questionText = question.question || '';
    const templateMatches = questionText.match(/\{\{[^}]+\}\}/g) || [];
    
    return (
      <div className="legacy-fill-blank-question">
        <div className="instruction">
          <i className="fas fa-edit"></i>
          Fill in the blanks below
        </div>
        <div className="blank-inputs">
          {blankAnswers.map((_, index) => {
            // Extract placeholder name if available
            const placeholder = templateMatches[index] ? 
              templateMatches[index].replace(/[{}]/g, '').trim() : 
              `blank ${index + 1}`;
            
            return (
              <div key={index} className="blank-input-item">
                <label>
                  <i className="fas fa-edit"></i>
                  {placeholder}:
                </label>
                <input
                  type="text"
                  className="fill-blank-input"
                  value={fillBlankAnswers[index] || ''}
                  onChange={(e) => handleFillBlankChange(index, e.target.value)}
                  placeholder={`Enter answer for ${placeholder}`}
                />
              </div>
            );
          })}
        </div>
        <div className="fill-blank-progress">
          <i className="fas fa-check-circle"></i>
          {fillBlankAnswers.filter(answer => answer && answer.trim()).length} of {blankAnswers.length} blanks filled
        </div>
      </div>
    );
  }, [questionData, question, fillBlankAnswers]);

  // Interactive Puzzle Game component - memoized to prevent unnecessary re-renders
  const PuzzleGameRenderer = memo(function PuzzleGameRenderer() {
    // Create a stable key that doesn't change during re-renders
    const stableKey = `puzzle-${question.id}`;
    
    const [puzzleState, setPuzzleState] = useState(() => {
      console.log('🏠 Creating NEW puzzle state for key:', stableKey);
      return {
        fragments: [],
        assembledPieces: [],
        draggedPiece: null,
        isValidated: false,
        showValidation: false,
        initialized: false,
        questionId: question.id,
        dragCounter: 0 // 添加拖拽计数器防止事件冲突
      };
    });

    // Initialize puzzle fragments from question data - ONLY ONCE
    useEffect(() => {
      const currentQuestionId = question.id;
      
      // Prevent re-initialization if already initialized OR if question ID hasn't changed
      if (puzzleState.initialized && puzzleState.questionId === currentQuestionId) {
        console.log('🚫 STABLE: Puzzle already initialized for question', question.id);
        return;
      }
      
      console.log('🔄 FRESH INIT: Initializing puzzle for question', currentQuestionId);
      
      let allFragments = [];
      let solution = '';
      
      try {
        // Parse puzzle data from question
        if (question.puzzle_fragments && Array.isArray(question.puzzle_fragments)) {
          allFragments = [...question.puzzle_fragments];
        } else if (questionData.puzzle_fragments) {
          allFragments = [...questionData.puzzle_fragments];
        }
        
        solution = question.puzzle_solution || questionData.puzzle_solution || '';
        
        // Create fragment objects with unique IDs
        const fragmentObjects = allFragments.map((fragment, index) => ({
          id: `fragment-${index}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          content: fragment,
          originalIndex: index
        }));
        
        console.log('🧩 Created fragment objects:', fragmentObjects);
        
        // Handle saved answers
        let assembledPieces = [];
        let availableFragments = [...fragmentObjects];
        
        // Handle initial state setup
        if (Array.isArray(currentAnswer) && currentAnswer.length > 0) {
          console.log('🔄 Restoring saved answer state:', currentAnswer);
          // Restore saved answer state
          assembledPieces = currentAnswer.map((content, index) => {
            const fragmentObj = fragmentObjects.find(f => f.content === content);
            return fragmentObj ? {
              ...fragmentObj,
              id: `assembled-${index}-${fragmentObj.originalIndex}-${Date.now()}` // Unique ID for assembled pieces
            } : {
              id: `assembled-${index}-unknown-${Date.now()}`,        // Unique ID for assembled pieces      
              content: content,
              originalIndex: -1
            };
          });
          
          // Remove assembled pieces from available fragments
          assembledPieces.forEach(assembledPiece => {
            availableFragments = availableFragments.filter(f => 
              f.originalIndex !== assembledPiece.originalIndex
            );
          });
        } else {
          // Shuffle fragments for new puzzle
          console.log('🔀 Shuffling fragments for new puzzle');
          availableFragments = fragmentObjects.sort(() => Math.random() - 0.5);
        }

        console.log('🧩 Final puzzle state:', {
          fragments: availableFragments,
          assembledPieces: assembledPieces
        });
        
        setPuzzleState(prev => ({
          ...prev,
          fragments: availableFragments,
          assembledPieces: assembledPieces,
          initialized: true,
          questionId: currentQuestionId
        }));
        
        console.log('✅ MARKED as initialized for question', currentQuestionId);

      } catch (error) {
        console.error('Error parsing puzzle data:', error);
      }
    }, [question.id, puzzleState.initialized, puzzleState.questionId]); // Include minimal necessary deps

    // Handle drag start - 优化拖拽开始逻辑
    const handleDragStart = useCallback((e, piece) => {
      console.log('🚀 Drag start:', piece);
      
      // 设置拖拽数据
      const dragData = {
        ...piece,
        timestamp: Date.now(),
        dragId: `drag-${Date.now()}-${Math.random()}`
      };
      
      e.dataTransfer.setData('application/json', JSON.stringify(dragData));
      e.dataTransfer.setData('text/plain', piece.content); // fallback
      e.dataTransfer.effectAllowed = 'move';
      
      setPuzzleState(prev => ({ 
        ...prev, 
        draggedPiece: piece,
        dragCounter: prev.dragCounter + 1
      }));
      
      // 添加视觉反馈
      e.target.classList.add('dragging');
    }, []);

    // Handle drag end - 清理拖拽状态
    const handleDragEnd = useCallback((e) => {
      console.log('🏁 Drag end');
      e.target.classList.remove('dragging');
      setPuzzleState(prev => ({ 
        ...prev, 
        draggedPiece: null 
      }));
    }, []);

    // Handle drag over - 优化拖拽悬停处理
    const handleDragOver = useCallback((e) => {
      e.preventDefault();
      e.stopPropagation();
      e.dataTransfer.dropEffect = 'move';
    }, []);

    // Handle drag enter - 添加视觉反馈
    const handleDragEnter = useCallback((e) => {
      e.preventDefault();
      e.currentTarget.classList.add('drag-over');
    }, []);

    // Handle drag leave - 移除视觉反馈
    const handleDragLeave = useCallback((e) => {
      e.preventDefault();
      if (!e.currentTarget.contains(e.relatedTarget)) {
        e.currentTarget.classList.remove('drag-over');
      }
    }, []);

    // Handle drop in assembly area - 修复拖拽放置逻辑
    const handleDropAssembly = useCallback((e, dropIndex) => {
      e.preventDefault();
      e.stopPropagation();
      e.currentTarget.classList.remove('drag-over');
      
      console.log('📦 Drop in assembly at index:', dropIndex);
      
      try {
        // 尝试获取 JSON 数据，如果失败则尝试 text 数据
        let piece;
        try {
          const jsonData = e.dataTransfer.getData('application/json');
          if (jsonData) {
            piece = JSON.parse(jsonData);
          }
        } catch (error) {
          console.warn('Failed to parse JSON drag data, trying text fallback');
        }
        
        // 如果 JSON 失败，尝试从当前拖拽状态获取
        if (!piece && puzzleState.draggedPiece) {
          piece = puzzleState.draggedPiece;
        }
        
        if (!piece) {
          console.error('❌ No piece data found in drop event');
          return;
        }
        
        console.log('📦 Dropped piece:', piece);
        console.log('📦 Current state:', {
          fragments: puzzleState.fragments.length,
          assembled: puzzleState.assembledPieces.length
        });
        
        // 确保状态更新是原子操作
        setPuzzleState(prev => {
          let newAssembled = [...prev.assembledPieces];
          let newFragments = [...prev.fragments];
          
          // Check if piece is already in assembled pieces (reordering)
          const currentAssemblyIndex = newAssembled.findIndex(p => 
            p.id === piece.id || (p.originalIndex === piece.originalIndex && p.originalIndex !== -1)
          );
          console.log('📦 Current assembly index:', currentAssemblyIndex);
          
          if (currentAssemblyIndex !== -1) {
            // Reordering within assembly area
            console.log('📦 Reordering within assembly');
            const [movedPiece] = newAssembled.splice(currentAssemblyIndex, 1); // Remove from current position
            
            // Adjust drop index if we removed an item before the drop position
            const adjustedDropIndex = currentAssemblyIndex < dropIndex ? dropIndex - 1 : dropIndex;
            console.log('📦 Adjusted drop index:', adjustedDropIndex);
            newAssembled.splice(Math.max(0, Math.min(adjustedDropIndex, newAssembled.length)), 0, movedPiece); // Insert at new position
          } else {
            // Moving from fragment bank to assembly
            console.log('📦 Moving from fragments to assembly');
            const fragmentIndex = newFragments.findIndex(f => 
              f.id === piece.id || (f.originalIndex === piece.originalIndex && f.originalIndex !== -1)
            );
            console.log('📦 Fragment index:', fragmentIndex);
            
            if (fragmentIndex !== -1) {
              const [movedFragment] = newFragments.splice(fragmentIndex, 1); // Remove from fragments
              // 创建新的组装片段 ID 避免冲突
              const assembledPiece = {
                ...movedFragment,
                id: `assembled-${dropIndex}-${movedFragment.originalIndex}-${Date.now()}`
              };
              newAssembled.splice(Math.max(0, Math.min(dropIndex, newAssembled.length)), 0, assembledPiece); // Add to assembly
            } else {
              console.warn('📦 Piece not found in fragments!', piece);
              return prev; // 如果找不到片段，不更新状态
            }
          }
          
          console.log('📦 New state:', {
            fragments: newFragments.length,
            assembled: newAssembled.length
          });
          
          // Update answer in parent component
          const answerData = newAssembled.map(p => p.content);
          onAnswerChange(answerData);

          return {
            ...prev,
            fragments: newFragments,
            assembledPieces: newAssembled,
            draggedPiece: null,
            showValidation: false
          };
        });

      } catch (error) {
        console.error('❌ Error handling drop:', error);
      }
    }, [puzzleState.draggedPiece, onAnswerChange]);

    // Smart drop handler for the new assembly workspace
    const handleSmartDrop = useCallback((e) => {
      e.preventDefault();
      e.stopPropagation();
      e.currentTarget.classList.remove('drag-over');
      
      try {
        let piece;
        try {
          const jsonData = e.dataTransfer.getData('application/json');
          if (jsonData) {
            piece = JSON.parse(jsonData);
          }
        } catch (error) {
          console.warn('Failed to parse JSON drag data, trying fallback');
        }
        
        if (!piece && puzzleState.draggedPiece) {
          piece = puzzleState.draggedPiece;
        }
        
        if (!piece) {
          console.error('❌ No piece data found');
          return;
        }
        
        // Calculate insertion position based on drop coordinates
        const rect = e.currentTarget.getBoundingClientRect();
        const dropX = e.clientX - rect.left;
        const solutionChain = e.currentTarget.querySelector('.solution-chain');
        
        let insertIndex = puzzleState.assembledPieces.length; // Default to end
        
        if (solutionChain && puzzleState.assembledPieces.length > 0) {
          const pieces = solutionChain.querySelectorAll('.solution-piece');
          
          for (let i = 0; i < pieces.length; i++) {
            const pieceRect = pieces[i].getBoundingClientRect();
            const pieceCenter = pieceRect.left + pieceRect.width / 2 - rect.left;
            
            if (dropX < pieceCenter) {
              insertIndex = i;
              break;
            }
          }
        }
        
        console.log('📦 Smart drop at index:', insertIndex);
        
        setPuzzleState(prev => {
          let newAssembled = [...prev.assembledPieces];
          let newFragments = [...prev.fragments];
          
          // Check if piece is already assembled (reordering)
          const currentIndex = newAssembled.findIndex(p => 
            p.id === piece.id || (p.originalIndex === piece.originalIndex && p.originalIndex !== -1)
          );
          
          if (currentIndex !== -1) {
            // Reordering within assembly
            const [movedPiece] = newAssembled.splice(currentIndex, 1);
            const adjustedIndex = currentIndex < insertIndex ? insertIndex - 1 : insertIndex;
            newAssembled.splice(Math.max(0, Math.min(adjustedIndex, newAssembled.length)), 0, movedPiece);
          } else {
            // Moving from fragments to assembly
            const fragmentIndex = newFragments.findIndex(f => 
              f.id === piece.id || (f.originalIndex === piece.originalIndex && f.originalIndex !== -1)
            );
            
            if (fragmentIndex !== -1) {
              const [movedFragment] = newFragments.splice(fragmentIndex, 1);
              const assembledPiece = {
                ...movedFragment,
                id: `assembled-${insertIndex}-${movedFragment.originalIndex}-${Date.now()}`
              };
              newAssembled.splice(Math.max(0, Math.min(insertIndex, newAssembled.length)), 0, assembledPiece);
            } else {
              console.warn('📦 Piece not found in fragments!', piece);
              return prev;
            }
          }
          
          const answerData = newAssembled.map(p => p.content);
          onAnswerChange(answerData);
          
          return {
            ...prev,
            fragments: newFragments,
            assembledPieces: newAssembled,
            draggedPiece: null,
            showValidation: false
          };
        });
        
      } catch (error) {
        console.error('❌ Error in smart drop:', error);
      }
    }, [puzzleState.draggedPiece, puzzleState.assembledPieces, onAnswerChange]);

    // Remove piece helper function
    const removePiece = useCallback((index) => {
      setPuzzleState(prev => {
        const pieceToRemove = prev.assembledPieces[index];
        const newAssembled = prev.assembledPieces.filter((_, i) => i !== index);
        
        const returnedPiece = {
          id: `fragment-${pieceToRemove.originalIndex}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          content: pieceToRemove.content,
          originalIndex: pieceToRemove.originalIndex
        };
        
        const newFragments = [...prev.fragments, returnedPiece];
        onAnswerChange(newAssembled.map(p => p.content));
        
        return {
          ...prev,
          fragments: newFragments,
          assembledPieces: newAssembled,
          showValidation: false
        };
      });
    }, [onAnswerChange]);

    // Handle drop back to fragment bank - 修复返回逻辑
    const handleDropFragment = useCallback((e) => {
      e.preventDefault();
      e.stopPropagation();
      e.currentTarget.classList.remove('drag-over');
      
      console.log('🔄 Drop back to fragments');
      
      try {
        // 尝试获取拖拽数据
        let piece;
        try {
          const jsonData = e.dataTransfer.getData('application/json');
          if (jsonData) {
            piece = JSON.parse(jsonData);
          }
        } catch (error) {
          console.warn('Failed to parse JSON drag data, trying fallback');
        }
        
        if (!piece && puzzleState.draggedPiece) {
          piece = puzzleState.draggedPiece;
        }
        
        if (!piece) {
          console.error('❌ No piece data found');
          return;
        }
        
        console.log('🔄 Piece to return:', piece);
        
        setPuzzleState(prev => {
          // Only move piece if it's currently in assembly area
          const assemblyIndex = prev.assembledPieces.findIndex(p => 
            p.id === piece.id || (p.originalIndex === piece.originalIndex && p.originalIndex !== -1)
          );
          console.log('🔄 Assembly index:', assemblyIndex);
          
          if (assemblyIndex !== -1) {
            let newAssembled = [...prev.assembledPieces];
            let newFragments = [...prev.fragments];
            
            // Remove from assembly
            const [returnedPiece] = newAssembled.splice(assemblyIndex, 1);
            
            // Add back to fragments with new ID to avoid conflicts
            const fragmentPiece = {
              id: `fragment-${returnedPiece.originalIndex}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              content: returnedPiece.content,
              originalIndex: returnedPiece.originalIndex
            };
            newFragments.push(fragmentPiece);
            
            console.log('🔄 After return:', {
              fragments: newFragments.length,
              assembled: newAssembled.length
            });
            
            // Update answer
            const answerData = newAssembled.map(p => p.content);
            onAnswerChange(answerData);

            return {
              ...prev,
              fragments: newFragments,
              assembledPieces: newAssembled,
              draggedPiece: null,
              showValidation: false
            };
          } else {
            console.log('🔄 Piece not in assembly, ignoring');
            return prev;
          }
        });

      } catch (error) {
        console.error('❌ Error handling fragment drop:', error);
      }
    }, [puzzleState.draggedPiece, onAnswerChange]);

    // Validate current solution
    const validateSolution = () => {
      const currentSolution = puzzleState.assembledPieces.map(p => p.content).join(' ');
      const correctSolution = question.puzzle_solution || questionData.puzzle_solution || '';
      
      // Multiple validation approaches
      let isCorrect = false;
      
      // Exact match (primary)
      isCorrect = currentSolution.trim() === correctSolution.trim();
      
      // If exact match fails, try without spaces for math/chemistry formulas
      if (!isCorrect) {
        const currentNoSpaces = currentSolution.replace(/\s+/g, '');
        const correctNoSpaces = correctSolution.replace(/\s+/g, '');
        isCorrect = currentNoSpaces === correctNoSpaces;
      }
      
      // For chemistry reactions, try different arrow formats
      if (!isCorrect && correctSolution.includes('→')) {
        const currentNormalized = currentSolution.replace(/[-=]+>/g, '→').trim();
        const correctNormalized = correctSolution.replace(/[-=]+>/g, '→').trim();
        isCorrect = currentNormalized === correctNormalized;
      }
      
      setPuzzleState(prev => ({
        ...prev,
        isValidated: isCorrect,
        showValidation: true
      }));

      return isCorrect;
    };

    // Clear assembly area
    const clearAssembly = () => {
      setPuzzleState(prev => {
        const allFragments = [
          ...prev.fragments,
          ...prev.assembledPieces.map(piece => ({
            id: `fragment-${piece.originalIndex}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            content: piece.content,
            originalIndex: piece.originalIndex
          }))
        ];
        
        onAnswerChange([]);
        
        return {
          ...prev,
          fragments: allFragments,
          assembledPieces: [],
          showValidation: false,
          draggedPiece: null
        };
      });
    };

    return (
      <div className="puzzle-game-question">
        <div className="puzzle-game-header">
          <div className="puzzle-icon">
            <i className="fas fa-puzzle-piece"></i>
          </div>
          <h4>Arrange the fragments to form the correct solution</h4>
          <div className="puzzle-progress">
            {puzzleState.assembledPieces.length} of {puzzleState.fragments.length + puzzleState.assembledPieces.length} pieces used
          </div>
        </div>

        {/* Fragment Bank */}
        <div className="fragment-bank">
          <h5>
            <i className="fas fa-th-large"></i>
            Available Fragments
          </h5>
          <div 
            className="fragments-container"
            onDrop={handleDropFragment}
            onDragOver={handleDragOver}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
          >
            {puzzleState.fragments.map((fragment) => (
              <div
                key={fragment.id}
                className="puzzle-fragment"
                draggable
                onDragStart={(e) => handleDragStart(e, fragment)}
                onDragEnd={handleDragEnd}
              >
                <span className="fragment-content">{fragment.content}</span>
                <div className="fragment-drag-handle">
                  <i className="fas fa-grip-vertical"></i>
                </div>
              </div>
            ))}
            {puzzleState.fragments.length === 0 && (
              <div className="empty-fragments">
                <i className="fas fa-check-circle"></i>
                All fragments used
              </div>
            )}
          </div>
        </div>

        {/* Assembly Area */}
        <div className="assembly-area">
          <div className="assembly-header">
            <h5>
              <i className="fas fa-puzzle-piece"></i>
              Solution Assembly
            </h5>
            <div className="assembly-status">
              {puzzleState.assembledPieces.length > 0 && (
                <span className="piece-count">
                  {puzzleState.assembledPieces.length} piece{puzzleState.assembledPieces.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>
          
          <div 
            className={`assembly-workspace ${puzzleState.assembledPieces.length === 0 ? 'empty' : 'has-content'}`}
            onDrop={(e) => handleSmartDrop(e)}
            onDragOver={handleDragOver}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
          >
            {puzzleState.assembledPieces.length === 0 ? (
              <div className="empty-workspace">
                <div className="empty-icon">
                  <i className="fas fa-hand-point-down"></i>
                </div>
                <h6>Start Building Your Solution</h6>
                <p>Drag and drop fragments here to assemble your answer</p>
              </div>
            ) : (
              <div className="solution-chain">
                {puzzleState.assembledPieces.map((piece, index) => (
                  <div
                    key={`${piece.id}-${index}`}
                    className="solution-piece"
                    draggable
                    onDragStart={(e) => handleDragStart(e, piece)}
                    onDragEnd={handleDragEnd}
                    data-index={index}
                  >
                    <div className="piece-content">
                      {piece.content}
                    </div>
                    <button
                      className="remove-piece-btn"
                      onClick={() => removePiece(index)}
                      title="Remove this piece"
                    >
                      <i className="fas fa-times"></i>
                    </button>
                    {index < puzzleState.assembledPieces.length - 1 && (
                      <div className="piece-connector">
                        <i className="fas fa-chevron-right"></i>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            {/* Smart insertion indicator */}
            <div className="insertion-indicator" style={{ display: 'none' }}>
              <div className="indicator-line"></div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="puzzle-controls">
          <button
            className="validate-btn"
            onClick={validateSolution}
            disabled={puzzleState.assembledPieces.length === 0}
          >
            <i className="fas fa-check"></i>
            Check Solution
          </button>
          <button
            className="clear-btn"
            onClick={clearAssembly}
            disabled={puzzleState.assembledPieces.length === 0}
          >
            <i className="fas fa-undo"></i>
            Clear All
          </button>
        </div>

        {/* Validation Feedback */}
        {puzzleState.showValidation && (
          <div className={`validation-feedback ${puzzleState.isValidated ? 'correct' : 'incorrect'}`}>
            <div className="feedback-icon">
              <i className={`fas ${puzzleState.isValidated ? 'fa-check-circle' : 'fa-times-circle'}`}></i>
            </div>
            <div className="feedback-message">
              {puzzleState.isValidated 
                ? 'Excellent! Your solution is correct.' 
                : 'Not quite right. Try rearranging the fragments.'
              }
            </div>
          </div>
        )}
      </div>
    );
  });

  // 渲染函数定义为箭头函数
  const renderPuzzleGame = useCallback(() => {
    return <PuzzleGameRenderer key={`puzzle-game-${question.id}`} />;
  }, [question.id]);

  // Interactive Matching Task component
  const MatchingTaskRenderer = memo(function MatchingTaskRenderer() {
    const [matches, setMatches] = useState({});
    const [draggedItem, setDraggedItem] = useState(null);
    const [showValidation, setShowValidation] = useState(false);
    const [validationResult, setValidationResult] = useState({ isValid: false, message: '' });
    const [dragOverTarget, setDragOverTarget] = useState(null);
    const [selectedLeftItem, setSelectedLeftItem] = useState(null);

    // Parse question data
    let questionData = {};
    try {
      if (typeof question.question_data === 'string') {
        questionData = JSON.parse(question.question_data);
      } else {
        questionData = question.question_data || {};
      }
    } catch (error) {
      console.error('Error parsing matching task question_data:', error);
      questionData = {};
    }

    const leftItems = questionData.left_items || [];
    const rightItems = questionData.right_items || [];
    const correctMatches = questionData.correct_matches || [];

    // Initialize matches from current answer
    useEffect(() => {
      if (currentAnswer && typeof currentAnswer === 'object') {
        setMatches(currentAnswer);
      }
    }, [currentAnswer]);

    // Update parent when matches change
    useEffect(() => {
      onAnswerChange(matches);
    }, [matches, onAnswerChange]);

    const handleDragStart = (e, leftIndex) => {
      setDraggedItem(leftIndex);
      e.dataTransfer.setData('text/plain', leftIndex.toString());
      e.dataTransfer.effectAllowed = 'move';
      e.target.style.opacity = '0.6';
    };

    const handleDragEnd = (e) => {
      setDraggedItem(null);
      setDragOverTarget(null);
      e.target.style.opacity = '1';
    };

    const handleDragOver = (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
    };

    const handleDragEnter = (e, rightIndex) => {
      e.preventDefault();
      if (draggedItem !== null) {
        setDragOverTarget(rightIndex);
      }
    };

    const handleDragLeave = (e, rightIndex) => {
      e.preventDefault();
      // Only clear if we're actually leaving this target
      if (!e.currentTarget.contains(e.relatedTarget)) {
        setDragOverTarget(null);
      }
    };

    const handleDrop = (e, rightIndex) => {
      e.preventDefault();
      const leftIndex = parseInt(e.dataTransfer.getData('text/plain'));
      
      if (!isNaN(leftIndex)) {
        setMatches(prev => ({
          ...prev,
          [leftIndex]: rightIndex
        }));
        setShowValidation(false);
      }
      setDragOverTarget(null);
    };

    const validateMatches = () => {
      let isValid = true;
      let correctCount = 0;

      // Check if all left items are matched
      for (let i = 0; i < leftItems.length; i++) {
        if (matches[i] === undefined) {
          isValid = false;
          break;
        }
      }

      if (isValid) {
        // Check correctness
        correctMatches.forEach(correctMatch => {
          if (matches[correctMatch.left] === correctMatch.right) {
            correctCount++;
          }
        });
        
        const message = correctCount === correctMatches.length 
          ? `Perfect! All ${correctCount} matches are correct.`
          : `${correctCount} out of ${correctMatches.length} matches are correct.`;
        
        setValidationResult({
          isValid: correctCount === correctMatches.length,
          message
        });
      } else {
        setValidationResult({
          isValid: false,
          message: 'Please match all items before checking your answer.'
        });
      }

      setShowValidation(true);
    };

    const clearMatches = () => {
      setMatches({});
      setShowValidation(false);
      setSelectedLeftItem(null);
    };

    const handleLeftItemClick = (leftIndex) => {
      if (selectedLeftItem === leftIndex) {
        // Deselect if clicking the same item
        setSelectedLeftItem(null);
      } else {
        setSelectedLeftItem(leftIndex);
      }
    };

    const handleRightItemClick = (rightIndex) => {
      if (selectedLeftItem !== null) {
        // Create or update match
        setMatches(prev => ({
          ...prev,
          [selectedLeftItem]: rightIndex
        }));
        setSelectedLeftItem(null);
        setShowValidation(false);
      }
    };

    if (leftItems.length === 0 || rightItems.length === 0) {
      return (
        <div className="matching-task-error">
          <i className="fas fa-exclamation-triangle"></i>
          <p>Invalid matching task configuration. Missing items.</p>
        </div>
      );
    }

    return (
      <div className="matching-task-question">
        <div className="matching-task-header">
          <div className="task-icon">
            <i className="fas fa-exchange-alt"></i>
          </div>
          <h4>Match the items from left column to right column</h4>
          <div className="matching-instructions">
            <i className="fas fa-hand-pointer"></i>
            <span>
              {selectedLeftItem !== null 
                ? 'Click a target to connect' 
                : 'Click items to select • Drag to connect'
              }
            </span>
          </div>
          <div className="progress-indicator">
            {Object.keys(matches).length} of {leftItems.length} matched
          </div>
        </div>

        <div className="matching-container">
          {/* Left Column */}
          <div className="left-column">
            <h5>
              <i className="fas fa-list"></i>
              Items to Match
            </h5>
            <div className="left-items">
              {leftItems.map((item, index) => (
                <div
                  key={index}
                  className={`left-item ${matches[index] !== undefined ? 'matched' : ''} ${draggedItem === index ? 'dragging' : ''} ${selectedLeftItem === index ? 'selected' : ''}`}
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragEnd={handleDragEnd}
                  onClick={() => handleLeftItemClick(index)}
                  data-item-index={index}
                >
                  <div className="item-number">{index + 1}</div>
                  <div className="item-content">{item}</div>
                  <div className="drag-handle">
                    <i className="fas fa-grip-vertical"></i>
                  </div>
                  {matches[index] !== undefined && (
                    <div className="connection-line-simple" data-target={String.fromCharCode(65 + matches[index])}></div>
                  )}
                  {selectedLeftItem === index && (
                    <div className="selection-indicator">
                      <i className="fas fa-hand-pointer"></i>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Connection Area */}
          <div className="connection-area">
            <div className="connection-instructions">
              <i className="fas fa-exchange-alt"></i>
              <span>Visual connections</span>
            </div>
            {/* Preview line during drag */}
            {draggedItem !== null && dragOverTarget !== null && (
              <div 
                className="drag-preview-line"
                style={{
                  '--start-index': draggedItem,
                  '--end-index': dragOverTarget,
                  '--total-left': leftItems.length,
                  '--total-right': rightItems.length
                }}
              ></div>
            )}
          </div>

          {/* Right Column */}
          <div className="right-column">
            <h5>
              <i className="fas fa-bullseye"></i>
              Match Targets
            </h5>
            <div className="right-items">
              {rightItems.map((item, index) => (
                <div
                  key={index}
                  className={`right-item ${Object.values(matches).includes(index) ? 'matched' : ''} ${dragOverTarget === index ? 'drag-target' : ''} ${selectedLeftItem !== null ? 'clickable' : ''}`}
                  onDragOver={handleDragOver}
                  onDragEnter={(e) => handleDragEnter(e, index)}
                  onDragLeave={(e) => handleDragLeave(e, index)}
                  onDrop={(e) => handleDrop(e, index)}
                  onClick={() => handleRightItemClick(index)}
                  data-item-index={index}
                >
                  <div className="item-letter">{String.fromCharCode(65 + index)}</div>
                  <div className="item-content">{item}</div>
                  <div className="drop-zone">
                    <i className="fas fa-crosshairs"></i>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="matching-controls">
          <button
            className="validate-btn"
            onClick={validateMatches}
            disabled={Object.keys(matches).length === 0}
          >
            <i className="fas fa-check"></i>
            Check Matches
          </button>
          <button
            className="clear-btn"
            onClick={clearMatches}
            disabled={Object.keys(matches).length === 0}
          >
            <i className="fas fa-undo"></i>
            Clear All
          </button>
        </div>

        {/* Validation Feedback */}
        {showValidation && (
          <div className={`validation-feedback ${validationResult.isValid ? 'correct' : 'incorrect'}`}>
            <div className="feedback-icon">
              <i className={`fas ${validationResult.isValid ? 'fa-check-circle' : 'fa-times-circle'}`}></i>
            </div>
            <div className="feedback-message">
              {validationResult.message}
            </div>
          </div>
        )}
      </div>
    );
  });

  const renderMatchingTask = useCallback(() => {
    return <MatchingTaskRenderer key={`matching-task-${question.id}`} />;
  }, [question.id]);


  // Render based on question type
  switch (questionType) {
    case 'single_choice':
      return (
        <div className="options-grid">
          {Object.entries(question.options || {}).map(([option, text]) => (
            <button
              key={option}
              className={`option-button ${currentAnswer === option ? 'selected' : ''}`}
              onClick={() => onAnswerChange(option)}
            >
              <span className="option-letter">{option}</span>
              <span className="option-text">{text}</span>
            </button>
          ))}
        </div>
      );

    case 'multiple_choice':
      const selectedOptions = Array.isArray(currentAnswer) ? currentAnswer : [];
      const options = questionData.options || [];
      
      return (
        <div className="multiple-choice-options">
          <div className="instruction">
            <i className="fas fa-info-circle"></i>
            Select all correct answers
          </div>
          {options.map((option, index) => (
            <label key={index} className="multiple-choice-option">
              <input
                type="checkbox"
                checked={selectedOptions.includes(index)}
                onChange={(e) => {
                  const newSelected = e.target.checked
                    ? [...selectedOptions, index]
                    : selectedOptions.filter(i => i !== index);
                  onAnswerChange(newSelected);
                }}
              />
              <span className="option-text">{option}</span>
            </label>
          ))}
        </div>
      );

    case 'fill_blank':
      // Check for blank_answers in question_data or fallback to direct question structure
      const blankAnswers = questionData.blank_answers || question.blank_answers || [];
      
      if (blankAnswers.length > 0) {
        // Legacy fill-blank - most common format
        return renderLegacyFillBlank();
      } else if (questionData.enhanced && questionData.blanks) {
        // Enhanced fill-blank with template (legacy support)
        return renderEnhancedFillBlank();
      }
      return <div className="error">Invalid fill-blank question configuration. No blank answers found.</div>;

    case 'puzzle_game':
      return renderPuzzleGame();

    case 'matching_task':
      return renderMatchingTask();

    default:
      // Fallback for other question types
      return (
        <div className="options-grid">
          {Object.entries(question.options || {}).map(([option, text]) => (
            <button
              key={option}
              className={`option-button ${currentAnswer === option ? 'selected' : ''}`}
              onClick={() => onAnswerChange(option)}
            >
              <span className="option-letter">{option}</span>
              <span className="option-text">{text}</span>
            </button>
          ))}
        </div>
      );
  }
};

export default InteractiveQuestionRenderer;