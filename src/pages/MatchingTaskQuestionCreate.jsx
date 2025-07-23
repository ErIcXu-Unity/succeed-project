import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import QuestionCreateLayout from '../components/QuestionCreateLayout';
import MatchingTaskEditor from '../components/MatchingTaskEditor';

const MatchingTaskQuestionCreate = () => {
  const { taskId } = useParams();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    question: '',
    question_type: 'matching_task',
    difficulty: 'Easy',
    score: 3,
    description: '',
    
    // Matching task specific
    left_items: ['', ''],
    right_items: ['', ''],
    correct_matches: []
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const validateForm = () => {
    if (!(formData.question || '').trim()) {
      setError('Question content cannot be empty');
      return false;
    }

    if ((formData.left_items && formData.left_items.some(item => !(item || '').trim())) || 
        (formData.right_items && formData.right_items.some(item => !(item || '').trim()))) {
      setError('All matching items must be filled');
      return false;
    }
    
    if (!formData.correct_matches || !formData.left_items || 
        formData.correct_matches.length !== formData.left_items.length) {
      setError('All left items must have matching right items');
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
      
      // Add matching task specific data in the format backend expects
      formData.left_items.forEach((item, index) => {
        formDataToSend.append(`left_items[${index}]`, item);
      });
      
      formData.right_items.forEach((item, index) => {
        formDataToSend.append(`right_items[${index}]`, item);
      });
      
      formData.correct_matches.forEach((match, index) => {
        formDataToSend.append(`correct_matches[${index}]`, match);
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
      questionType="matching_task"
      questionTypeLabel="Matching Task"
      questionTypeIcon="fas fa-exchange-alt"
      formData={formData}
      setFormData={setFormData}
      onSubmit={handleSubmit}
      loading={loading}
      error={error}
    >
      {/* Question-specific editor content */}
      <MatchingTaskEditor formData={formData} setFormData={setFormData} />
    </QuestionCreateLayout>
  );
};

export default MatchingTaskQuestionCreate;