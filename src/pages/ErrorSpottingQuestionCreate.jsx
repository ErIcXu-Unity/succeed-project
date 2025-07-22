import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import QuestionCreateLayout from '../components/QuestionCreateLayout';
import ErrorSpottingEditor from '../components/ErrorSpottingEditor';

const ErrorSpottingQuestionCreate = () => {
  const { taskId } = useParams();
  const navigate = useNavigate();
  
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

    // Error spotting must have image
    if (!mediaData.selectedImage) {
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
      questionType="error_spotting"
      questionTypeLabel="Error Spotting"
      questionTypeIcon="fas fa-search"
      formData={formData}
      setFormData={setFormData}
      onSubmit={handleSubmit}
      loading={loading}
      error={error}
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
          {mediaData.selectedImage && (
            <div className="file-preview">
              <i className="fas fa-check-circle"></i>
              <span>Selected: {mediaData.selectedImage.name}</span>
              <div className="image-preview-container">
                <img 
                  src={URL.createObjectURL(mediaData.selectedImage)} 
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
            </div>
          )}
        </div>
      </div>
    </QuestionCreateLayout>
  );
};

export default ErrorSpottingQuestionCreate;