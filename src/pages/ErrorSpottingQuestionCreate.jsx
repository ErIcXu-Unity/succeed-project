import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import QuestionCreateLayout from '../components/QuestionCreateLayout';
import ErrorSpottingEditor from '../components/ErrorSpottingEditor';

const ErrorSpottingQuestionCreate = () => {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const questionId = searchParams.get('questionId');
  
  const [formData, setFormData] = useState({
    question: '',
    question_type: 'error_spotting',
    difficulty: 'Easy',
    score: 3,
    description: '',
    
    // Error spotting specific
    error_spots: []
  });
  
  const [mediaData, setMediaData] = useState({
    selectedImage: null,
    mediaType: 'image' // Error spotting requires image
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
              question_type: 'error_spotting',
              difficulty: question.difficulty || 'Easy',
              score: question.score || 3,
              description: question.description || '',
              error_spots: questionData.error_spots || []
            });

            // Note: For edit mode, we don't load the existing image file
            // The user will need to re-upload if they want to change it
            // But we indicate there's an existing image in the UI
            if (question.image_url) {
              setMediaData(prev => ({
                ...prev,
                existingImageUrl: question.image_url
              }));
            }
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

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        setError('Please select a valid image format (PNG, JPG, JPEG, GIF, WebP)');
        return;
      }
      setMediaData(prev => ({ ...prev, selectedImage: file }));
      setError('');
    }
  };

  const validateForm = () => {
    if (!(formData.question || '').trim()) {
      setError('Question content cannot be empty');
      return false;
    }

    if (!formData.error_spots || formData.error_spots.length === 0) {
      setError('At least one error spot must be defined');
      return false;
    }
    
    if (formData.error_spots.some(spot => !spot || !(spot.description || '').trim())) {
      setError('All error spots must have descriptions');
      return false;
    }

    // Error spotting must have image (either newly selected or existing in edit mode)
    if (!mediaData.selectedImage && !mediaData.existingImageUrl) {
      setError('Error spotting questions require an image to be uploaded');
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
      
      // Add error spotting specific data in the format backend expects
      formData.error_spots.forEach((spot, index) => {
        formDataToSend.append(`error_spots[${index}][x]`, spot.x);
        formDataToSend.append(`error_spots[${index}][y]`, spot.y);
        formDataToSend.append(`error_spots[${index}][description]`, spot.description);
      });
      
      // Add required image
      if (mediaData.selectedImage) {
        formDataToSend.append('image', mediaData.selectedImage);
      }
      
      // Add user ID
      const user = JSON.parse(localStorage.getItem('user_data'));
      if (user && user.user_id) {
        formDataToSend.append('created_by', user.user_id);
      }

      let response;
      if (isEditMode && questionId) {
        // Update existing question
        if (mediaData.selectedImage) {
          // If new image is uploaded, use FormData for the update
          response = await fetch(`http://localhost:5001/api/questions/${questionId}`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${user.token}`,
            },
            body: formDataToSend
          });
        } else {
          // If no new image, use JSON update (keep existing image)
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
                error_spots: formData.error_spots
              }
            })
          });
        }
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
      questionType="error_spotting"
      questionTypeLabel="Error Spotting"
      questionTypeIcon="fas fa-search"
      formData={formData}
      setFormData={setFormData}
      onSubmit={handleSubmit}
      loading={loading}
      error={error}
      isEditMode={isEditMode}
      questionId={questionId}
    >
      {/* Question-specific editor content */}
      <ErrorSpottingEditor formData={formData} setFormData={setFormData} />
      
      {/* Image Upload Section */}
      <div className="form-group-redesigned">
        <label className="form-label-redesigned">
          <i className="fas fa-image"></i>
          Question Image <span className="required">*</span>
        </label>
        <div className="image-upload-section">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            id="error-image-upload"
            className="file-input"
            style={{ display: 'none' }}
          />
          <label htmlFor="error-image-upload" className="upload-label">
            <div className="upload-content">
              <i className="fas fa-cloud-upload-alt"></i>
              <span>Click to select image file</span>
              <small>Error spotting requires an image to mark error locations</small>
            </div>
          </label>
          {(mediaData.selectedImage || mediaData.existingImageUrl) && (
            <div className="file-preview">
              <i className="fas fa-check-circle"></i>
              <span>
                {mediaData.selectedImage 
                  ? `Selected: ${mediaData.selectedImage.name}` 
                  : 'Using existing image'}
              </span>
              <div className="image-preview-container">
                <img 
                  src={mediaData.selectedImage 
                    ? URL.createObjectURL(mediaData.selectedImage) 
                    : mediaData.existingImageUrl} 
                  alt="Preview" 
                  style={{ 
                    maxWidth: '100%', 
                    maxHeight: '200px', 
                    borderRadius: '8px',
                    objectFit: 'contain',
                    marginTop: '0.5rem'
                  }}
                />
              </div>
              {mediaData.existingImageUrl && !mediaData.selectedImage && (
                <small style={{ color: '#666', marginTop: '0.5rem', display: 'block' }}>
                  Upload a new image to replace the current one
                </small>
              )}
            </div>
          )}
        </div>
      </div>
    </QuestionCreateLayout>
  );
};

export default ErrorSpottingQuestionCreate;