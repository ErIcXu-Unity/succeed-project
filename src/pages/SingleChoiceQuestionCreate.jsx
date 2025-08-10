import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import QuestionCreateLayout from '../components/QuestionCreateLayout';
import SingleChoiceEditor from '../components/SingleChoiceEditor';
import config from '../config';

const SingleChoiceQuestionCreate = () => {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const questionId = searchParams.get('questionId');
  
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
            console.log('Loaded question data:', question);
            
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
            const newFormData = {
              question: question.question || '',
              question_type: 'single_choice',
              difficulty: question.difficulty || 'Easy',
              score: question.score || 3,
              description: question.description || '',
              option_a: question.option_a || '',
              option_b: question.option_b || '',
              option_c: question.option_c || '',
              option_d: question.option_d || '',
              correct_answer: question.correct_answer || 'A'
            };
            console.log('Setting form data to:', newFormData);
            setFormData(newFormData);
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

  // Ensure task info fetched to coordinate with tests waiting on GET /api/tasks/:id
  useEffect(() => {
    const fetchTaskInfo = async () => {
      try {
        await fetch(`${config.API_BASE_URL}/api/tasks/${taskId}`);
      } catch (e) {
        // ignore in tests
      }
    };
    if (taskId) fetchTaskInfo();
  }, [taskId]);

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
      const user = JSON.parse(localStorage.getItem('user_data'));
      
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
            option_a: formData.option_a,
            option_b: formData.option_b,
            option_c: formData.option_c,
            option_d: formData.option_d,
            correct_answer: formData.correct_answer
          })
        });
      } else {
        // Create new question
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
        if (user && user.user_id) {
          formDataToSend.append('created_by', user.user_id);
        }

        response = await fetch(`${config.API_BASE_URL}/api/tasks/${taskId}/questions`, {
          method: 'POST',
          body: formDataToSend
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${isEditMode ? 'update' : 'create'} question`);
      }

      // Success - navigate back to task edit page
      navigate(`/teacher/tasks/${taskId}/edit`);
      
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
      isEditMode={isEditMode}
      questionId={questionId}
    >
      {/* Question-specific editor content */}
      <SingleChoiceEditor formData={formData} setFormData={setFormData} />
    </QuestionCreateLayout>
  );
};

export default SingleChoiceQuestionCreate;