import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import QuestionCreateLayout from '../components/QuestionCreateLayout';
import FillBlankEditor from '../components/FillBlankEditor';
import config from '../config';

const FillBlankQuestionCreate = () => {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const questionId = searchParams.get('questionId');
  
  const [formData, setFormData] = useState({
    question: '',
    question_type: 'fill_blank',
    difficulty: 'Easy',
    score: 3,
    description: '',
    blank_answers: ['']
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
              question_type: 'fill_blank',
              difficulty: question.difficulty || 'Easy',
              score: question.score || 3,
              description: question.description || '',
              blank_answers: questionData.blank_answers || ['']
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

    // Check if we have blank_answers and if any are filled
    const blankAnswers = formData.blank_answers || [];
    const hasFilledAnswers = blankAnswers.some(answer => (answer || '').trim() !== '');
    
    if (!hasFilledAnswers) {
      setError('At least one blank answer must be filled');
      return false;
    }

    // For validation, only check answers that should be filled based on template
    const templateMatches = (formData.question || '').match(/\{\{[^}]+\}\}/g) || [];
    const expectedBlanks = Math.max(templateMatches.length, 1);
    
    // Check that we have answers for the expected number of blanks
    const answersToCheck = blankAnswers.slice(0, expectedBlanks);
    const hasEmptyRequiredAnswers = answersToCheck.some(answer => !(answer || '').trim());
    
    if (hasEmptyRequiredAnswers) {
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
      
      // Add fill-blank specific data in the format backend expects (only filled answers)
      const filledAnswers = (formData.blank_answers || []).filter(answer => (answer || '').trim());
      filledAnswers.forEach((answer, index) => {
        formDataToSend.append(`blank_answers[${index}]`, answer);
      });
      
      // Add user ID
      const user = JSON.parse(localStorage.getItem('user_data'));
      if (user && user.user_id) {
        formDataToSend.append('created_by', user.user_id);
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
              blank_answers: (formData.blank_answers || []).filter(answer => (answer || '').trim())
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
      questionType="fill_blank"
      questionTypeLabel="Fill in the Blank"
      questionTypeIcon="fas fa-edit"
      formData={formData}
      setFormData={setFormData}
      onSubmit={handleSubmit}
      loading={loading}
      error={error}
      isEditMode={isEditMode}
      questionId={questionId}
    >
      {/* Question-specific editor content */}
      <FillBlankEditor formData={formData} setFormData={setFormData} />
    </QuestionCreateLayout>
  );
};

export default FillBlankQuestionCreate;