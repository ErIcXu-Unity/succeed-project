import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import QuestionCreateLayout from '../components/QuestionCreateLayout';
import MatchingTaskEditor from '../components/MatchingTaskEditor';
import config from '../config';

const MatchingTaskQuestionCreate = () => {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const questionId = searchParams.get('questionId');
  
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
  const [isEditMode, setIsEditMode] = useState(false);

  // Load existing question data if questionId is provided
  useEffect(() => {
    const loadExistingQuestion = async () => {
      if (questionId) {
        setLoading(true);
        setIsEditMode(true);
        try {
          const user = JSON.parse(localStorage.getItem('user_data'));
          const response = await fetch(`${config.API_BASE_URL}/api/questions/${questionId}`, {
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
              question_type: 'matching_task',
              difficulty: question.difficulty || 'Easy',
              score: question.score || 3,
              description: question.description || '',
              left_items: questionData.left_items || ['', ''],
              right_items: questionData.right_items || ['', ''],
              correct_matches: questionData.correct_matches || []
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

    if ((formData.left_items && formData.left_items.some(item => !(item || '').trim())) || 
        (formData.right_items && formData.right_items.some(item => !(item || '').trim()))) {
      setError('All matching items must be filled');
      return false;
    }
    
    // Check if all left items have been matched
    if (!formData.correct_matches || !formData.left_items || 
        formData.correct_matches.length === 0) {
      setError('At least one correct match is required');
      return false;
    }

    // Check if all left items have matches defined
    const leftItemsWithMatches = new Set(formData.correct_matches.map(match => match.left));
    const unmatched = [];
    
    for (let i = 0; i < formData.left_items.length; i++) {
      if (!leftItemsWithMatches.has(i)) {
        unmatched.push(i + 1);
      }
    }
    
    if (unmatched.length > 0) {
      setError(`Please define matches for left item(s): ${unmatched.join(', ')}`);
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
        formDataToSend.append(`correct_matches[${index}][left]`, match.left);
        formDataToSend.append(`correct_matches[${index}][right]`, match.right);
      });
      
      // Add user ID
      const user = JSON.parse(localStorage.getItem('user_data'));
      if (user && user.user_id) {
        formDataToSend.append('created_by', user.user_id);
      }

      // Debug: Log what we're sending
      console.log('Sending matching task data:');
      console.log('Left items:', formData.left_items);
      console.log('Right items:', formData.right_items);
      console.log('Correct matches:', formData.correct_matches);
      
      // Log form data entries
      for (let [key, value] of formDataToSend.entries()) {
        console.log(`${key}: ${value}`);
      }

      let response;
      if (isEditMode && questionId) {
        // Update existing question
        response = await fetch(`${config.API_BASE_URL}/api/questions/${questionId}`, {
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
              left_items: formData.left_items,
              right_items: formData.right_items,
              correct_matches: formData.correct_matches
            }
          })
        });
      } else {
        // Create new question
        response = await fetch(`${config.API_BASE_URL}/api/tasks/${taskId}/questions`, {
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
      questionType="matching_task"
      questionTypeLabel="Matching Task"
      questionTypeIcon="fas fa-exchange-alt"
      formData={formData}
      setFormData={setFormData}
      onSubmit={handleSubmit}
      loading={loading}
      error={error}
      isEditMode={isEditMode}
      questionId={questionId}
    >
      {/* Question-specific editor content */}
      <MatchingTaskEditor formData={formData} setFormData={setFormData} />
    </QuestionCreateLayout>
  );
};

export default MatchingTaskQuestionCreate;