import React, { useState } from 'react';
import ImageUpload from './ImageUpload';
import './QuestionCreateModal.css';
import config from '../config';

const QuestionCreateModal = ({ isOpen, onClose, onSubmit, taskId }) => {
  const [formData, setFormData] = useState({
    question: '',
    option_a: '',
    option_b: '',
    option_c: '',
    option_d: '',
    correct_answer: 'A',
    difficulty: 'Easy',
    score: 3
  });
  const [selectedImage, setSelectedImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const difficultyScoreMap = {
    'Easy': 3,
    'Medium': 5,
    'Hard': 10
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const newData = { ...prev, [name]: value };
      
      // 当难度改变时，自动更新分数
      if (name === 'difficulty') {
        newData.score = difficultyScoreMap[value];
      }
      
      return newData;
    });
  };

  const handleImageSelect = (file) => {
    setSelectedImage(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // 创建FormData对象支持文件上传
      const formDataToSend = new FormData();
      
      // 添加所有表单字段
      Object.keys(formData).forEach(key => {
        formDataToSend.append(key, formData[key]);
      });
      
      // 添加当前用户ID
      const user = JSON.parse(localStorage.getItem('user_data'));
      if (user && user.user_id) {
        formDataToSend.append('created_by', user.user_id);
      }
      
      // 添加图片文件（如果有）
      if (selectedImage) {
        formDataToSend.append('image', selectedImage);
      }

              const response = await fetch(`${config.API_BASE_URL}/api/tasks/${taskId}/questions`, {
        method: 'POST',
        body: formDataToSend
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create questions');
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
      option_a: '',
      option_b: '',
      option_c: '',
      option_d: '',
      correct_answer: 'A',
      difficulty: 'Easy',
      score: 3
    });
    setSelectedImage(null);
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Create a new question</h2>
          <button className="close-btn" onClick={handleClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="question-form">
          {error && (
            <div className="error-message">
              <i className="fas fa-exclamation-triangle"></i>
              {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="question">Question content *</label>
            <textarea
              id="question"
              name="question"
              value={formData.question}
              onChange={handleInputChange}
              placeholder="Please enter your question..."
              required
              rows="3"
            />
          </div>

          <div className="form-group">
            <label>Question image (optional)</label>
            <ImageUpload onImageSelect={handleImageSelect} />
          </div>

          <div className="options-grid">
            <div className="form-group">
              <label htmlFor="option_a">Option A *</label>
              <input
                type="text"
                id="option_a"
                name="option_a"
                value={formData.option_a}
                onChange={handleInputChange}
                placeholder="Option A"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="option_b">Option B *</label>
              <input
                type="text"
                id="option_b"
                name="option_b"
                value={formData.option_b}
                onChange={handleInputChange}
                placeholder="Option B"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="option_c">Option C *</label>
              <input
                type="text"
                id="option_c"
                name="option_c"
                value={formData.option_c}
                onChange={handleInputChange}
                placeholder="Option C"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="option_d">Option D *</label>
              <input
                type="text"
                id="option_d"
                name="option_d"
                value={formData.option_d}
                onChange={handleInputChange}
                placeholder="Option D"
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="correct_answer">Correct answer *</label>
              <select
                id="correct_answer"
                name="correct_answer"
                value={formData.correct_answer}
                onChange={handleInputChange}
                required
              >
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
                <option value="D">D</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="difficulty">Difficulty *</label>
              <select
                id="difficulty"
                name="difficulty"
                value={formData.difficulty}
                onChange={handleInputChange}
                required
              >
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="score">Score *</label>
              <input
                type="number"
                id="score"
                name="score"
                value={formData.score}
                onChange={handleInputChange}
                min="1"
                max="20"
                required
              />
            </div>
          </div>

          <div className="form-actions">
            <button type="button" onClick={handleClose} className="cancel-btn">
                Cancel
            </button>
            <button type="submit" disabled={loading} className="submit-btn">
              {loading ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i>
                  Creating...
                </>
              ) : (
                <>
                  <i className="fas fa-plus"></i>
                  Create question
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default QuestionCreateModal; 