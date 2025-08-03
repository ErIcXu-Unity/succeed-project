import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import QuestionCreateLayout from '../components/QuestionCreateLayout';
import PuzzleGameEditor from '../components/PuzzleGameEditor';

const PuzzleGameQuestionCreate = () => {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const questionId = searchParams.get('questionId');
  
  const [formData, setFormData] = useState({
    question: '',
    question_type: 'puzzle_game',
    difficulty: 'Easy',
    score: 3,
    description: '',
    
    // Puzzle game specific
    puzzle_solution: '',
    puzzle_fragments: ['']
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);

  // Load existing question data if questionId is provided
  useEffect(() => {
    const loadExistingQuestion = async () => {
      if (questionId) {
        setLoading(true);
        setIsEditMode(true);
        try {
          const user = JSON.parse(localStorage.getItem('user_data'));
          const response = await fetch(`http://localhost:5001/api/questions/${questionId}`, {
            headers: {
              'Authorization': `Bearer ${user.token}`,
              'Content-Type': 'application/json',
            },
          });

          if (response.ok) {
            const question = await response.json();
            
            // Parse question_data if it's a JSON string
            let questionData = {};
            try {
              if (typeof question.question_data === 'string') {
                questionData = JSON.parse(question.question_data);
              } else {
                questionData = question.question_data || {};
              }
            } catch (parseError) {
              console.error('Error parsing question_data:', parseError);
              questionData = {};
            }

            // Update form data with existing question
            setFormData({
              question: question.question || '',
              question_type: 'puzzle_game',
              difficulty: question.difficulty || 'Easy',
              score: question.score || 3,
              description: question.description || '',
              puzzle_solution: questionData.puzzle_solution || '',
              puzzle_fragments: questionData.puzzle_fragments || ['']
            });
          } else {
            setError('Failed to load question data');
          }
        } catch (error) {
          console.error('Error loading question:', error);
          setError('Error loading question data');
        } finally {
          setLoading(false);
        }
      }
    };

    loadExistingQuestion();
  }, [questionId]);

  const validateForm = () => {
    if (!(formData.question || '').trim()) {
      setError('Question content cannot be empty');
      return false;
    }

    if (!(formData.puzzle_solution || '').trim()) {
      setError('Puzzle solution is required');
      return false;
    }
    
    if (formData.puzzle_fragments && formData.puzzle_fragments.some(fragment => !(fragment || '').trim())) {
      setError('All puzzle fragments must be filled');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const formDataToSend = new FormData();
      
      // Add basic fields
      formDataToSend.append('question', formData.question);
      formDataToSend.append('question_type', formData.question_type);
      formDataToSend.append('difficulty', formData.difficulty);
      formDataToSend.append('score', formData.score);
      formDataToSend.append('description', formData.description);
      
      // Add puzzle game specific data in the format backend expects
      formDataToSend.append('puzzle_solution', formData.puzzle_solution);
      
      formData.puzzle_fragments.forEach((fragment, index) => {
        formDataToSend.append(`puzzle_fragments[${index}]`, fragment);
      });
      
      // Add user ID
      const user = JSON.parse(localStorage.getItem('user_data'));
      if (user && user.user_id) {
        formDataToSend.append('created_by', user.user_id);
      }

      let response;
      if (isEditMode && questionId) {
        // Update existing question
        response = await fetch(`http://localhost:5001/api/questions/${questionId}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${user.token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            question: formData.question,
            question_type: formData.question_type,
            difficulty: formData.difficulty,
            score: formData.score,
            description: formData.description,
            question_data: {
              puzzle_solution: formData.puzzle_solution,
              puzzle_fragments: formData.puzzle_fragments
            }
          })
        });
      } else {
        // Create new question
        response = await fetch(`http://localhost:5001/api/tasks/${taskId}/questions`, {
          method: 'POST',
          body: formDataToSend
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${isEditMode ? 'update' : 'create'} question`);
      }

      // Success - navigate back to task page
      navigate(`/teacher/tasks/${taskId}/edit`);
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <QuestionCreateLayout
      questionType="puzzle_game"
      questionTypeLabel="Puzzle Game"
      questionTypeIcon="fas fa-puzzle-piece"
      formData={formData}
      setFormData={setFormData}
      onSubmit={handleSubmit}
      loading={loading}
      error={error}
      isEditMode={isEditMode}
      questionId={questionId}
    >
      {/* Question-specific editor content */}
      <PuzzleGameEditor formData={formData} setFormData={setFormData} />
    </QuestionCreateLayout>
  );
};

export default PuzzleGameQuestionCreate;