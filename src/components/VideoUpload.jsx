import React, { useState, useEffect } from 'react';
import './VideoUpload.css';
import config from '../config';

const VideoUpload = ({ taskId, isCreateMode = false, onVideoUploaded }) => {
  const [uploadType, setUploadType] = useState('local');
  const [currentVideo, setCurrentVideo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [youtubeUploading, setYoutubeUploading] = useState(false);

  useEffect(() => {
    if (taskId && !isCreateMode) {
      fetchTaskDetails();
    }
  }, [taskId, isCreateMode]);

  const fetchTaskDetails = async () => {
    if (!taskId || taskId === 'new') return;

    try {
      setLoading(true);
      const response = await fetch(`${config.API_BASE_URL}/api/tasks/${taskId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.video_type && (data.video_url || data.video_path)) {
          setCurrentVideo({
            type: data.video_type,
            url: data.video_url,
            path: data.video_path
          });
        }
      }
    } catch (error) {
      console.error('Error fetching task details:', error);
      setError('Failed to load video information');
    } finally {
      setLoading(false);
    }
  };

  const handleLocalUpload = async (file) => {
    if (!file || (!taskId && !isCreateMode)) {
      setError('Please select a file and ensure task ID is available');
      return;
    }

    if (isCreateMode) {
      setError('Please save the task first before uploading videos');
      return;
    }

    setUploading(true);
    setError('');

    const formData = new FormData();
    formData.append('video', file);

    try {
      const response = await fetch(`${config.API_BASE_URL}/api/tasks/${taskId}/video`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        const videoInfo = {
          type: 'local',
          path: result.filename || result.video_url.split('/').pop(), // Get filename from return result
          url: result.video_url
        };
        
        setCurrentVideo(videoInfo);
        
        if (onVideoUploaded) {
          onVideoUploaded(videoInfo);
        }
        
        console.log('Video uploaded successfully:', result);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to upload video');
      }
    } catch (error) {
      console.error('Error uploading video:', error);
      setError('Network error occurred while uploading');
    } finally {
      setUploading(false);
    }
  };

  const handleYouTubeUpload = async () => {
    if (!youtubeUrl.trim()) {
      setError('Please enter a YouTube URL');
      return;
    }

    if (!taskId || isCreateMode) {
      setError('Please save the task first before adding YouTube videos');
      return;
    }

    setYoutubeUploading(true);
    setError('');

    try {
      const response = await fetch(`${config.API_BASE_URL}/api/tasks/${taskId}/youtube`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ youtube_url: youtubeUrl }),
      });

      if (response.ok) {
        const result = await response.json();
        const videoInfo = {
          type: 'youtube',
          url: youtubeUrl,
          path: null
        };
        
        setCurrentVideo(videoInfo);
        setYoutubeUrl('');
        
        if (onVideoUploaded) {
          onVideoUploaded(videoInfo);
        }
        
        console.log('YouTube video set successfully:', result);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to set YouTube video');
      }
    } catch (error) {
      console.error('Error setting YouTube video:', error);
      setError('Network error occurred');
    } finally {
      setYoutubeUploading(false);
    }
  };

  const handleVideoRemove = async () => {
    if (!taskId || isCreateMode) {
      setCurrentVideo(null);
      if (onVideoUploaded) {
        onVideoUploaded(null);
      }
      return;
    }

    try {
      const response = await fetch(`${config.API_BASE_URL}/api/tasks/${taskId}/video`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setCurrentVideo(null);
        if (onVideoUploaded) {
          onVideoUploaded(null);
        }
        console.log('Video removed successfully');
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to remove video');
      }
    } catch (error) {
      console.error('Error removing video:', error);
      setError('Network error occurred while removing video');
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['video/mp4', 'video/mov', 'video/avi', 'video/wmv', 'video/webm'];
      if (!allowedTypes.includes(file.type)) {
        setError('Please select a valid video format (MP4, MOV, AVI, WMV, WebM)');
        return;
      }
      
      // Validate file size (100MB)
      const maxSize = 100 * 1024 * 1024; // 100MB
      if (file.size > maxSize) {
        setError('Video file too large. Maximum size: 100MB');
        return;
      }
      
      handleLocalUpload(file);
    }
    
    // Reset file input so user can reselect the same file
    e.target.value = '';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const file = e.dataTransfer.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['video/mp4', 'video/mov', 'video/avi', 'video/wmv', 'video/webm'];
      if (!allowedTypes.includes(file.type)) {
        setError('Please select a valid video format (MP4, MOV, AVI, WMV, WebM)');
        return;
      }
      
      // Validate file size (100MB)
      const maxSize = 100 * 1024 * 1024; // 100MB
      if (file.size > maxSize) {
        setError('Video file too large. Maximum size: 100MB');
        return;
      }
      
      handleLocalUpload(file);
    }
  };

  if (loading) {
    return (
      <div className="video-upload-container">
        <div className="upload-progress">
          <i className="fas fa-spinner fa-spin"></i>
          Loading video information...
        </div>
      </div>
    );
  }

  return (
    <div className="video-upload-container">
      {isCreateMode && (
        <div className="create-mode-warning">
          <i className="fas fa-info-circle"></i>
          Please save the task first before uploading videos.
        </div>
      )}

      {/* Current video display */}
      {currentVideo && currentVideo.type && (
        <div className="current-video">
          <h4>
            <i className="fas fa-video"></i>
            Current Video
          </h4>
          <div className="current-video-info">
            <div className="video-info-header">
              <i className={`${currentVideo.type === 'youtube' ? 'fab fa-youtube' : 'fas fa-file-video'} video-icon`}></i>
              <span className="video-title">
                {currentVideo.type === 'youtube' ? 'YouTube Video' : 'Local Video File'}
              </span>
            </div>
            
            <div className="video-details">
              {currentVideo.type === 'local' && (
                <>
                  <p><strong>File Name:</strong> {currentVideo.path || 'Unknown'}</p>
                  <p><strong>Path:</strong> {currentVideo.url || 'Unknown'}</p>
                </>
              )}
              {currentVideo.type === 'youtube' && (
                <p><strong>URL:</strong> <a href={currentVideo.url} target="_blank" rel="noopener noreferrer">{currentVideo.url}</a></p>
              )}
            </div>

            {/* Video preview */}
            <div className="video-preview">
              <h5>Video Preview:</h5>
              {currentVideo.type === 'local' ? (
                <div className="local-video-container">
                  <video
                    src={
                      currentVideo.url && currentVideo.url !== 'null' && currentVideo.url !== 'undefined' 
                        ? (currentVideo.url.startsWith('http') 
                            ? currentVideo.url 
                            : `${config.API_BASE_URL}${currentVideo.url}`) 
                        : (currentVideo.path && currentVideo.path !== 'null' && currentVideo.path !== 'undefined' 
                            ? `${config.API_BASE_URL}/uploads/videos/${currentVideo.path}` 
                            : '')
                    }
                    controls
                    style={{ width: '100%', maxWidth: '400px', height: 'auto' }}
                    onError={(e) => {
                      e.target.style.display = 'none';
                      const errorDiv = e.target.nextElementSibling;
                      if (errorDiv && errorDiv.classList.contains('video-error-fallback')) {
                        errorDiv.style.display = 'block';
                      }
                    }}
                  >
                    <source src={
                      currentVideo.url && currentVideo.url !== 'null' && currentVideo.url !== 'undefined' 
                        ? (currentVideo.url.startsWith('http') 
                            ? currentVideo.url 
                            : `${config.API_BASE_URL}${currentVideo.url}`) 
                        : (currentVideo.path && currentVideo.path !== 'null' && currentVideo.path !== 'undefined' 
                            ? `${config.API_BASE_URL}/uploads/videos/${currentVideo.path}` 
                            : '')
                    } type="video/mp4" />
                    <source src={
                      currentVideo.url && currentVideo.url !== 'null' && currentVideo.url !== 'undefined' 
                        ? (currentVideo.url.startsWith('http') 
                            ? currentVideo.url 
                            : `${config.API_BASE_URL}${currentVideo.url}`) 
                        : (currentVideo.path && currentVideo.path !== 'null' && currentVideo.path !== 'undefined' 
                            ? `${config.API_BASE_URL}/uploads/videos/${currentVideo.path}` 
                            : '')
                    } type="video/mov" />
                    <source src={
                      currentVideo.url && currentVideo.url !== 'null' && currentVideo.url !== 'undefined' 
                        ? (currentVideo.url.startsWith('http') 
                            ? currentVideo.url 
                            : `${config.API_BASE_URL}${currentVideo.url}`) 
                        : (currentVideo.path && currentVideo.path !== 'null' && currentVideo.path !== 'undefined' 
                            ? `${config.API_BASE_URL}/uploads/videos/${currentVideo.path}` 
                            : '')
                    } type="video/webm" />
                    Your browser does not support video playback
                  </video>
                  <div className="video-error-fallback" style={{ 
                    display: 'none', 
                    padding: '20px', 
                    textAlign: 'center', 
                    backgroundColor: '#f8d7da', 
                    color: '#721c24', 
                    borderRadius: '8px',
                    border: '1px solid #f5c6cb'
                  }}>
                    <i className="fas fa-exclamation-triangle"></i>
                    <p>Video loading failed, please check if the file exists</p>
                  </div>
                </div>
              ) : (
                <div className="youtube-embed">
                  <iframe
                    width="400"
                    height="225"
                    src={`https://www.youtube.com/embed/${currentVideo.url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/)?.[1] || ''}`}
                    title="YouTube video preview"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  ></iframe>
                </div>
              )}
              <div className="video-error" style={{ display: 'none' }}>
                <p>Video loading failed, please check if the file exists</p>
              </div>
            </div>

            <div className="video-actions">
              <button 
                className="remove-video-btn" 
                onClick={handleVideoRemove}
                disabled={uploading || youtubeUploading}
              >
                <i className="fas fa-trash"></i>
                Remove Video
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload type selector */}
      {(!currentVideo || !currentVideo.type) && !isCreateMode && (
        <>
          <div className="upload-options">
            <button 
              className={`upload-option-btn local-upload-btn ${uploadType === 'local' ? 'active' : ''}`}
              onClick={(e) => {
                e.preventDefault();
                
                // Auto-select local upload type
                setUploadType('local');
                setError(''); // Clear previous errors
                
                // Open file selector
                const fileInput = document.getElementById('video-file-input');
                if (fileInput) {
                  fileInput.click();
                }
              }}
              disabled={uploading}
            >
              <i className="fas fa-folder-open"></i>
              Browse Local Files
            </button>
            
            <button 
              className={`upload-option-btn youtube-option-btn ${uploadType === 'youtube' ? 'active' : ''}`}
              onClick={() => {
                setUploadType('youtube');
                setError(''); // Clear previous errors
              }}
            >
              <i className="fab fa-youtube"></i>
              YouTube Link
            </button>
          </div>

          {uploadType === 'local' && (
            <div className="local-upload-section">
              <div
                className="upload-area"
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                onDragEnter={(e) => e.preventDefault()}
                onClick={() => {
                  const fileInput = document.getElementById('video-file-input');
                  if (fileInput) {
                    fileInput.click();
                  }
                }}
                style={{ cursor: uploading ? 'not-allowed' : 'pointer' }}
              >
                <div className="upload-content">
                  {uploading ? (
                    <>
                      <i className="fas fa-spinner fa-spin upload-icon"></i>
                      <p>Uploading video...</p>
                    </>
                  ) : (
                    <>
                      <i className="fas fa-video upload-icon"></i>
                      <p>Click to select video file or drag and drop</p>
                      <p className="upload-hint">Supported formats: MP4, MOV, AVI, WMV, WebM (Max: 100MB)</p>
                    </>
                  )}
                </div>
              </div>

            </div>
          )}

          {uploadType === 'youtube' && (
            <div className="youtube-upload-section">
              <div className="form-group">
                <label htmlFor="youtube-url">YouTube Video URL</label>
                <input
                  id="youtube-url"
                  type="url"
                  className="youtube-input"
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  disabled={youtubeUploading}
                />
                <button
                  className="youtube-save-btn"
                  onClick={handleYouTubeUpload}
                  disabled={!youtubeUrl.trim() || youtubeUploading}
                >
                  {youtubeUploading ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i>
                      Setting...
                    </>
                  ) : (
                    <>
                      <i className="fab fa-youtube"></i>
                      Set YouTube Video
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {error && (
        <div className="upload-error">
          <i className="fas fa-exclamation-triangle"></i>
          {error}
        </div>
      )}

      {/* Hidden file selector, placed at component end so any button can access it */}
      <input
        id="video-file-input"
        type="file"
        accept="video/mp4,video/mov,video/avi,video/wmv,video/webm"
        style={{ display: 'none' }}
        onChange={handleFileSelect}
        disabled={uploading}
      />
    </div>
  );
};

export default VideoUpload; 