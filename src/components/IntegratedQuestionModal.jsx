import React, { useState, useEffect } from 'react';
import './QuestionCreateModal.css';
import config from '../config';
// 导入所有问题类型编辑器
import SingleChoiceEditor from './SingleChoiceEditor';
import MultipleChoiceEditor from './MultipleChoiceEditor';
import FillBlankEditor from './FillBlankEditor';
import PuzzleGameEditor from './PuzzleGameEditor';
import MatchingTaskEditor from './MatchingTaskEditor';
import ErrorSpottingEditor from './ErrorSpottingEditor';

const IntegratedQuestionModal = ({ isOpen, onClose, onSubmit, taskId }) => {
  // 基础表单数据
  const [formData, setFormData] = useState({
    question: '',
    question_type: 'single_choice',
    difficulty: 'Easy',
    score: 3,
    description: '',
    
    // 单选题数据
    option_a: '',
    option_b: '',
    option_c: '',
    option_d: '',
    correct_answer: 'A',
    
    // 多选题数据
    options: ['', ''],
    correct_answers: [],
    
    // 填空题数据
    blank_answers: [''],
    
    // 拼图游戏数据
    puzzle_solution: '',
    puzzle_fragments: [''],
    
    // 匹配题数据
    left_items: ['', ''],
    right_items: ['', ''],
    correct_matches: [],
    
    // 错误识别数据
    error_spots: []
  });
  
  const [mediaData, setMediaData] = useState({
    selectedImage: null,
    selectedVideo: null,
    youtubeUrl: '',
    mediaType: 'none' // 'image', 'video', 'youtube', 'description', 'none'
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 问题类型选项
  const questionTypes = [
    { value: 'single_choice', label: 'Single Choice', icon: 'fas fa-dot-circle' },
    { value: 'multiple_choice', label: 'Multiple Choice', icon: 'fas fa-check-square' },
    { value: 'fill_blank', label: 'Fill in Blank', icon: 'fas fa-edit' },
    { value: 'puzzle_game', label: 'Puzzle Game', icon: 'fas fa-puzzle-piece' },
    { value: 'matching_task', label: 'Matching Task', icon: 'fas fa-exchange-alt' }
  ];

  const difficultyScoreMap = {
    'Easy': 3,
    'Medium': 5,
    'Hard': 10
  };



  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const newData = { ...prev, [name]: value };
      
      // Auto-update score when difficulty changes
      if (name === 'difficulty') {
        newData.score = difficultyScoreMap[value];
      }
      
      return newData;
    });
  };

  const handleQuestionTypeChange = (type) => {
    setFormData(prev => ({ ...prev, question_type: type }));
  };

  const handleMediaTypeChange = (type) => {
    setMediaData(prev => ({
      ...prev,
      mediaType: type,
      // 清除其他媒体类型的数据
      selectedImage: type === 'image' ? prev.selectedImage : null,
      selectedVideo: type === 'video' ? prev.selectedVideo : null,
      youtubeUrl: type === 'youtube' ? prev.youtubeUrl : ''
    }));
  };

  const handleFileSelect = (e, fileType) => {
    const file = e.target.files[0];
    if (file) {
      if (fileType === 'image') {
        // 验证图片格式
        const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
          setError('Please select a valid image format (PNG, JPG, JPEG, GIF, WebP)');
          return;
        }
        setMediaData(prev => ({ ...prev, selectedImage: file }));
      } else if (fileType === 'video') {
        // 验证视频格式
        const allowedTypes = ['video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/webm'];
        if (!allowedTypes.includes(file.type)) {
          setError('Please select a valid video format (MP4, AVI, MOV, WMV, WebM)');
          return;
        }
        // 验证文件大小 (50MB)
        if (file.size > 50 * 1024 * 1024) {
          setError('Video file too large, maximum 50MB supported');
          return;
        }
        setMediaData(prev => ({ ...prev, selectedVideo: file }));
      }
      setError('');
    }
  };

  const handleYoutubeUrlChange = (e) => {
    setMediaData(prev => ({ ...prev, youtubeUrl: e.target.value }));
  };

  const validateForm = () => {
    // 验证基本字段
    if (!(formData.question || '').trim()) {
      setError('Question content cannot be empty');
      return false;
    }

    // 根据问题类型验证特定字段
    switch (formData.question_type) {
      case 'single_choice':
        if (!(formData.option_a || '').trim() || !(formData.option_b || '').trim() || 
            !(formData.option_c || '').trim() || !(formData.option_d || '').trim()) {
          setError('All options must be filled for single choice questions');
          return false;
        }
        break;
        
      case 'multiple_choice':
        if (formData.options && formData.options.some(opt => !(opt || '').trim())) {
          setError('All options must be filled for multiple choice questions');
          return false;
        }
        if (!formData.correct_answers || formData.correct_answers.length === 0) {
          setError('At least one correct answer must be selected for multiple choice questions');
          return false;
        }
        break;
        
      case 'fill_blank':
        if (formData.blank_answers && formData.blank_answers.some(answer => !(answer || '').trim())) {
          setError('All blank answers must be filled');
          return false;
        }
        break;
        
      case 'puzzle_game':
        if (!(formData.puzzle_solution || '').trim()) {
          setError('Puzzle solution is required');
          return false;
        }
        if (formData.puzzle_fragments && formData.puzzle_fragments.some(fragment => !(fragment || '').trim())) {
          setError('All puzzle fragments must be filled');
          return false;
        }
        break;
        
      case 'matching_task':
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
        break;
        
    }

    
    // 其他题型的媒体内容是完全可选的

    // 验证 YouTube 链接格式
    if (mediaData.mediaType === 'youtube' && mediaData.youtubeUrl.trim()) {
      const youtubeUrl = mediaData.youtubeUrl.trim();
      if (!youtubeUrl.includes('youtube.com/watch') && !youtubeUrl.includes('youtu.be/')) {
        setError('Please enter a valid YouTube link');
        return false;
      }
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
      // 创建 FormData 对象支持文件上传
      const formDataToSend = new FormData();
      
      // 添加基本字段
      formDataToSend.append('question', formData.question);
      formDataToSend.append('question_type', formData.question_type);
      formDataToSend.append('difficulty', formData.difficulty);
      formDataToSend.append('score', formData.score);
      formDataToSend.append('description', formData.description);
      
      // 根据问题类型添加特定数据
      const questionData = {};
      switch (formData.question_type) {
        case 'single_choice':
          formDataToSend.append('option_a', formData.option_a);
          formDataToSend.append('option_b', formData.option_b);
          formDataToSend.append('option_c', formData.option_c);
          formDataToSend.append('option_d', formData.option_d);
          formDataToSend.append('correct_answer', formData.correct_answer);
          break;
          
        case 'multiple_choice':
          questionData.options = formData.options;
          questionData.correct_answers = formData.correct_answers;
          break;
          
        case 'fill_blank':
          questionData.blank_answers = formData.blank_answers;
          break;
          
        case 'puzzle_game':
          questionData.puzzle_solution = formData.puzzle_solution;
          questionData.puzzle_fragments = formData.puzzle_fragments;
          break;
          
        case 'matching_task':
          questionData.left_items = formData.left_items;
          questionData.right_items = formData.right_items;
          questionData.correct_matches = formData.correct_matches;
          break;
          
          break;
      }
      
      // 如果有问题数据，将其转为 JSON 字符串
      if (Object.keys(questionData).length > 0) {
        formDataToSend.append('question_data', JSON.stringify(questionData));
      }
      
      // 添加当前用户 ID
      const user = JSON.parse(localStorage.getItem('user_data'));
      if (user && user.user_id) {
        formDataToSend.append('created_by', user.user_id);
      }
      
      // 根据媒体类型添加相应的数据
      switch (mediaData.mediaType) {
        case 'image':
          if (mediaData.selectedImage) {
            formDataToSend.append('image', mediaData.selectedImage);
          }
          break;
        case 'video':
          if (mediaData.selectedVideo) {
            formDataToSend.append('video', mediaData.selectedVideo);
          }
          break;
        case 'youtube':
          if (mediaData.youtubeUrl.trim()) {
            formDataToSend.append('youtube_url', mediaData.youtubeUrl.trim());
          }
          break;
        default:
          // 无媒体内容或其他情况
          break;
      }

      const response = await fetch(`${config.API_BASE_URL}/api/tasks/${taskId}/questions`, {
        method: 'POST',
        body: formDataToSend
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create question');
      }

      const result = await response.json();
      
      // 通知父组件并关闭弹窗
      onSubmit(result);
      handleClose();
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    // 重置表单
    setFormData({
      question: '',
      question_type: 'single_choice',
      difficulty: 'Easy',
      score: 3,
      description: '',
      
      // 单选题数据
      option_a: '',
      option_b: '',
      option_c: '',
      option_d: '',
      correct_answer: 'A',
      
      // 多选题数据
      options: ['', ''],
      correct_answers: [],
      
      // 填空题数据
      blank_answers: [''],
      
      // 拼图游戏数据
      puzzle_solution: '',
      puzzle_fragments: [''],
      
      // 匹配题数据
      left_items: ['', ''],
      right_items: ['', ''],
      correct_matches: [],
      
      // 错误识别数据
      error_spots: []
    });
    setMediaData({
      selectedImage: null,
      selectedVideo: null,
      youtubeUrl: '',
      mediaType: 'none'
    });
    setError('');
    onClose();
  };

  // ESC 键监听
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && isOpen) {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]); // 现在 handleClose 在作用域内，不需要添加到依赖数组

  // 渲染问题类型特定的编辑器
  const renderQuestionEditor = () => {
    switch (formData.question_type) {
      case 'single_choice':
        return <SingleChoiceEditor formData={formData} setFormData={setFormData} />;
      case 'multiple_choice':
        return <MultipleChoiceEditor formData={formData} setFormData={setFormData} />;
      case 'fill_blank':
        return <FillBlankEditor formData={formData} setFormData={setFormData} />;
      case 'puzzle_game':
        return <PuzzleGameEditor formData={formData} setFormData={setFormData} />;
      case 'matching_task':
        return <MatchingTaskEditor formData={formData} setFormData={setFormData} />;
      default:
        return <SingleChoiceEditor formData={formData} setFormData={setFormData} />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content question-modal-redesigned">
        <div className="modal-header-redesigned">
          <div className="modal-title-section">
            <div className="modal-icon">
              <i className="fas fa-question-circle"></i>
            </div>
            <div>
              <h2>Create New Question</h2>
              <p>Add rich multimedia questions to your escape room (Press ESC to exit)</p>
            </div>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="question-form-redesigned">
          {error && (
            <div className="upload-error">
              <i className="fas fa-exclamation-triangle"></i>
              <span>{error}</span>
            </div>
          )}
          
          {/* Left Column - Question Information */}
          <div className="main-content-area">
            <div className="form-card">
              <div className="card-header">
                <i className="fas fa-question-circle"></i>
                <h3>Question Information</h3>
              </div>
              
              {/* 问题类型选择 */}
              <div className="form-group-redesigned">
                <label className="form-label-redesigned">
                  <i className="fas fa-list"></i>
                  Question Type <span className="required">*</span>
                </label>
                <div className="question-type-grid">
                  {questionTypes.map((type) => (
                    <div 
                      key={type.value}
                      className={`question-type-card ${formData.question_type === type.value ? 'selected' : ''}`}
                      onClick={() => handleQuestionTypeChange(type.value)}
                    >
                      <i className={`question-type-icon ${type.icon}`}></i>
                      <span>{type.label}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="form-group-redesigned">
                <label className="form-label-redesigned">
                  <i className="fas fa-edit"></i>
                  Question Description <span className="required">*</span>
                </label>
                <textarea
                  className="form-textarea-redesigned"
                  name="question"
                  value={formData.question}
                  onChange={handleInputChange}
                  placeholder="Enter your question here..."
                  rows="8"
                  required
                />
              </div>


            </div>
          </div>

          {/* Middle Column - Question Type Specific Editor */}
          <div className="options-area">
            {renderQuestionEditor()}
          </div>

          {/* Right Column - Settings & Media */}
          <div className="sidebar-area">
            {/* Question Settings Card */}
            <div className="form-card">
              <div className="card-header">
                <i className="fas fa-cog"></i>
                <h3>Question Settings</h3>
              </div>
              
              <div className="form-group-redesigned">
                <label className="form-label-redesigned">
                  <i className="fas fa-layer-group"></i>
                  Difficulty Level
                </label>
                <select
                  className="form-input-redesigned"
                  name="difficulty"
                  value={formData.difficulty}
                  onChange={handleInputChange}
                >
                  <option value="Easy">Easy (3 points)</option>
                  <option value="Medium">Medium (5 points)</option>
                  <option value="Hard">Hard (10 points)</option>
                </select>
              </div>

              <div className="form-group-redesigned">
                <label className="form-label-redesigned">
                  <i className="fas fa-star"></i>
                  Question Score
                </label>
                <input
                  type="number"
                  className="form-input-redesigned"
                  name="score"
                  value={formData.score}
                  onChange={handleInputChange}
                  min="1"
                  max="10"
                  placeholder="Score (1-10)"
                />
              </div>
            </div>

            {/* Media Content Card */}
            <div className="form-card">
              <div className="card-header">
                <i className="fas fa-photo-video"></i>
                <h3>Media Content</h3>
                <span className="card-subtitle">
                  Optional media attachment
                </span>
              </div>

            {/* 媒体类型选择 */}
            <div className="form-group-redesigned">
              <label className="form-label-redesigned">
                <i className="fas fa-plus-circle"></i>
                Media Content
              </label>
              <div className="media-type-grid">
                <div 
                  className={`media-type-card ${mediaData.mediaType === 'none' ? 'selected' : ''}`}
                  onClick={() => handleMediaTypeChange('none')}
                >
                  <i className="media-icon fas fa-ban"></i>
                  <span>None</span>
                </div>
                <div 
                  className={`media-type-card ${mediaData.mediaType === 'image' ? 'selected' : ''}`}
                  onClick={() => handleMediaTypeChange('image')}
                >
                  <i className="media-icon fas fa-image"></i>
                  <span>Image</span>
                </div>
                <div 
                  className={`media-type-card ${mediaData.mediaType === 'video' ? 'selected' : ''}`}
                  onClick={() => handleMediaTypeChange('video')}
                >
                  <i className="media-icon fas fa-video"></i>
                  <span>Local Video</span>
                </div>
                <div 
                  className={`media-type-card ${mediaData.mediaType === 'youtube' ? 'selected' : ''}`}
                  onClick={() => handleMediaTypeChange('youtube')}
                >
                  <i className="media-icon fab fa-youtube"></i>
                  <span>YouTube</span>
                </div>
              </div>

              {/* 媒体内容预览区域 */}
              <div className="media-preview-section">
                <h4 style={{ color: '#495057', fontSize: '0.9rem', marginBottom: '1rem', fontWeight: 600 }}>
                  <i className="fas fa-eye"></i> Media Content Preview
                </h4>
                


                {/* 显示已选择的图片 */}
                {mediaData.selectedImage && (
                  <div className="media-preview-item">
                    <div className="media-preview-header">
                      <i className="fas fa-image"></i>
                      <span>Selected Image</span>
                    </div>
                    <div className="media-preview-content">
                      <div className="image-preview">
                        <img 
                          src={URL.createObjectURL(mediaData.selectedImage)} 
                          alt="Preview" 
                          style={{ 
                            maxWidth: '100%', 
                            maxHeight: '150px', 
                            borderRadius: '8px',
                            objectFit: 'cover'
                          }}
                        />
                        <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.8rem', color: '#6c757d' }}>
                          {mediaData.selectedImage.name} ({Math.round(mediaData.selectedImage.size / 1024)} KB)
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* 显示已选择的视频 */}
                {mediaData.selectedVideo && (
                  <div className="media-preview-item">
                    <div className="media-preview-header">
                      <i className="fas fa-video"></i>
                      <span>Selected Video</span>
                    </div>
                    <div className="media-preview-content">
                      <div className="video-preview">
                        <video 
                          src={URL.createObjectURL(mediaData.selectedVideo)} 
                          controls 
                          style={{ 
                            maxWidth: '100%', 
                            maxHeight: '150px', 
                            borderRadius: '8px'
                          }}
                        />
                        <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.8rem', color: '#6c757d' }}>
                          {mediaData.selectedVideo.name} ({Math.round(mediaData.selectedVideo.size / 1024 / 1024 * 100) / 100} MB)
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* 显示 YouTube 链接 */}
                {mediaData.youtubeUrl && (
                  <div className="media-preview-item">
                    <div className="media-preview-header">
                      <i className="fab fa-youtube"></i>
                      <span>YouTube Video</span>
                    </div>
                    <div className="media-preview-content">
                      <div className="youtube-preview">
                        <iframe
                          width="100%"
                          height="150"
                          src={`https://www.youtube.com/embed/${mediaData.youtubeUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/)?.[1] || ''}`}
                          title="YouTube video preview"
                          style={{ borderRadius: '8px', border: 'none' }}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                        <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.8rem', color: '#6c757d' }}>
                          {mediaData.youtubeUrl}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* 如果没有任何媒体内容 */}
                {!mediaData.selectedImage && !mediaData.selectedVideo && !mediaData.youtubeUrl && (
                  <div className="no-media-notice">
                    <i className="fas fa-info-circle"></i>
                    <span>
                      No media content added (optional: image, video, or YouTube link)
                    </span>
                  </div>
                )}
              </div>
            </div>
            </div>

            {/* 根据选择的媒体类型显示相应的输入控件 */}
            {mediaData.mediaType === 'image' && (
              <div className="media-upload-section">
                <div className="upload-area">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileSelect(e, 'image')}
                    id="image-upload"
                    className="file-input"
                  />
                  <label htmlFor="image-upload" className="upload-label">
                    <div className="upload-content">
                      <i className="fas fa-cloud-upload-alt"></i>
                      <span>Click to select image file</span>
                      <small>Supports PNG, JPG, JPEG, GIF, WebP formats</small>
                    </div>
                  </label>
                  {mediaData.selectedImage && (
                    <div className="file-preview-redesigned">
                      <i className="fas fa-check-circle"></i>
                      <span>Selected: {mediaData.selectedImage.name}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {mediaData.mediaType === 'video' && (
              <div className="media-upload-section">
                <div className="upload-area">
                  <input
                    type="file"
                    accept="video/*"
                    onChange={(e) => handleFileSelect(e, 'video')}
                    id="video-upload"
                    className="file-input"
                  />
                  <label htmlFor="video-upload" className="upload-label">
                    <div className="upload-content">
                      <i className="fas fa-video"></i>
                      <span>Click to select video file</span>
                      <small>Supports MP4, AVI, MOV, WMV, WebM formats, max 50MB</small>
                    </div>
                  </label>
                  {mediaData.selectedVideo && (
                    <div className="file-preview-redesigned">
                      <i className="fas fa-check-circle"></i>
                      <span>Selected: {mediaData.selectedVideo.name}</span>
                      <small>({Math.round(mediaData.selectedVideo.size / 1024 / 1024 * 100) / 100} MB)</small>
                    </div>
                  )}
                </div>
              </div>
            )}

            {mediaData.mediaType === 'youtube' && (
              <div className="form-group-redesigned">
                <label>
                  <i className="fab fa-youtube"></i>
                  YouTube Video Link
                </label>
                <div className="input-with-icon">
                  <i className="fas fa-link"></i>
                  <input
                    type="url"
                    value={mediaData.youtubeUrl}
                    onChange={handleYoutubeUrlChange}
                    placeholder="https://www.youtube.com/watch?v=..."
                  />
                </div>
              </div>
            )}
          </div>

          <div className="modal-buttons">
            <button type="button" className="btn-cancel" onClick={handleClose}>
              <i className="fas fa-times"></i>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i>
                  Creating...
                </>
              ) : (
                <>
                  <i className="fas fa-plus-circle"></i>
                  Create Question
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default IntegratedQuestionModal; 