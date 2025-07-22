import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import QuestionCreateLayout from '../components/QuestionCreateLayout';
import PuzzleGameEditor from '../components/PuzzleGameEditor';

const PuzzleGameQuestionCreate = () => {
  const { taskId } = useParams();
  const navigate = useNavigate();
  
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
      
      // Add puzzle game specific data
      const questionData = {
        puzzle_solution: formData.puzzle_solution,
        puzzle_fragments: formData.puzzle_fragments
      };
      
      formDataToSend.append('question_data', JSON.stringify(questionData));
      
      // Add user ID
      const user = JSON.parse(localStorage.getItem('user_data'));
      if (user && user.user_id) {
        formDataToSend.append('created_by', user.user_id);
      }

      const response = await fetch(`http://localhost:5001/api/tasks/${taskId}/questions`, {
        method: 'POST',
        body: formDataToSend
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create question');
      }

      // Success - navigate back to task page
      navigate(`/teacher/tasks/${taskId}`);
      
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
    >
      {/* Question-specific editor content */}
      <PuzzleGameEditor formData={formData} setFormData={setFormData} />
    </QuestionCreateLayout>
  );
};

export default PuzzleGameQuestionCreate;