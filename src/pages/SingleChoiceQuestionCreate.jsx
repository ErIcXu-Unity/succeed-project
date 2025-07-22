import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import QuestionCreateLayout from '../components/QuestionCreateLayout';
import SingleChoiceEditor from '../components/SingleChoiceEditor';

const SingleChoiceQuestionCreate = () => {
  const { taskId } = useParams();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    question: '',
    question_type: 'single_choice',
    difficulty: 'Easy',
    score: 3,
    description: '',
    
    // Single choice specific
    option_a: '',
    option_b: '',
    option_c: '',
    option_d: '',
    correct_answer: 'A'
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const validateForm = () => {
    if (!(formData.question || '').trim()) {
      setError('Question content cannot be empty');
      return false;
    }

    if (!(formData.option_a || '').trim() || !(formData.option_b || '').trim() || 
        !(formData.option_c || '').trim() || !(formData.option_d || '').trim()) {
      setError('All options must be filled for single choice questions');
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
      
      // Add single choice specific data
      formDataToSend.append('option_a', formData.option_a);
      formDataToSend.append('option_b', formData.option_b);
      formDataToSend.append('option_c', formData.option_c);
      formDataToSend.append('option_d', formData.option_d);
      formDataToSend.append('correct_answer', formData.correct_answer);
      
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
      questionType="single_choice"
      questionTypeLabel="Single Choice"
      questionTypeIcon="fas fa-dot-circle"
      formData={formData}
      setFormData={setFormData}
      onSubmit={handleSubmit}
      loading={loading}
      error={error}
    >
      {/* Question-specific editor content */}
      <SingleChoiceEditor formData={formData} setFormData={setFormData} />
    </QuestionCreateLayout>
  );
};

export default SingleChoiceQuestionCreate;