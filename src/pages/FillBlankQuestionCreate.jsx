import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import QuestionCreateLayout from '../components/QuestionCreateLayout';
import FillBlankEditor from '../components/FillBlankEditor';

const FillBlankQuestionCreate = () => {
  const { taskId } = useParams();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    question: '',
    question_type: 'fill_blank',
    difficulty: 'Easy',
    score: 3,
    description: '',
    
    // Legacy format
    blank_answers: [''],
    
    // Enhanced format
    fill_blank_template: '',
    fill_blank_blanks: [
      {
        id: 0,
        placeholder: '',
        correct_answer: '',
        hints: ['']
      }
    ]
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const validateForm = () => {
    if (!(formData.question || '').trim()) {
      setError('Question content cannot be empty');
      return false;
    }

    if (formData.blank_answers && formData.blank_answers.some(answer => !(answer || '').trim())) {
      setError('All blank answers must be filled');
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
      
      // Add fill-blank specific data in the format backend expects
      formData.blank_answers.forEach((answer, index) => {
        formDataToSend.append(`blank_answers[${index}]`, answer);
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
      questionType="fill_blank"
      questionTypeLabel="Fill in the Blank"
      questionTypeIcon="fas fa-edit"
      formData={formData}
      setFormData={setFormData}
      onSubmit={handleSubmit}
      loading={loading}
      error={error}
    >
      {/* Question-specific editor content */}
      <FillBlankEditor formData={formData} setFormData={setFormData} />
    </QuestionCreateLayout>
  );
};

export default FillBlankQuestionCreate;