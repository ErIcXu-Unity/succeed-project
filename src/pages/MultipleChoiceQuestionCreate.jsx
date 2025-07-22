import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import QuestionCreateLayout from '../components/QuestionCreateLayout';
import MultipleChoiceEditor from '../components/MultipleChoiceEditor';

const MultipleChoiceQuestionCreate = () => {
  const { taskId } = useParams();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    question: '',
    question_type: 'multiple_choice',
    difficulty: 'Easy',
    score: 3,
    description: '',
    
    // Multiple choice specific
    options: ['', ''],
    correct_answers: []
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const validateForm = () => {
    if (!(formData.question || '').trim()) {
      setError('Question content cannot be empty');
      return false;
    }

    if (formData.options && formData.options.some(opt => !(opt || '').trim())) {
      setError('All options must be filled for multiple choice questions');
      return false;
    }
    
    if (!formData.correct_answers || formData.correct_answers.length === 0) {
      setError('At least one correct answer must be selected for multiple choice questions');
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
      
      // Add multiple choice specific data in the format backend expects
      formData.options.forEach((option, index) => {
        formDataToSend.append(`options[${index}]`, option);
      });
      
      formData.correct_answers.forEach((answerIndex, index) => {
        formDataToSend.append(`correct_answers[${index}]`, answerIndex);
      });
      
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
      navigate(`/teacher/tasks/${taskId}/edit`);
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <QuestionCreateLayout
      questionType="multiple_choice"
      questionTypeLabel="Multiple Choice"
      questionTypeIcon="fas fa-check-square"
      formData={formData}
      setFormData={setFormData}
      onSubmit={handleSubmit}
      loading={loading}
      error={error}
    >
      {/* Question-specific editor content */}
      <MultipleChoiceEditor formData={formData} setFormData={setFormData} />
    </QuestionCreateLayout>
  );
};

export default MultipleChoiceQuestionCreate;