import React, { useState, useRef } from 'react';
import './VideoUpload.css';

const VideoUpload = ({ onVideoSelect, onYouTubeUrl, taskId, currentVideo }) => {
  const [dragActive, setDragActive] = useState(false);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [uploadType, setUploadType] = useState('local'); // 'local' 或 'youtube'
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const validateFile = (file) => {
    // 检查文件大小 (最大100MB)
    const maxSize = 100 * 1024 * 1024;
    if (file.size > maxSize) {
      return '视频文件大小不能超过100MB';
    }

    // 检查文件格式
    const allowedTypes = ['video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/webm'];
    if (!allowedTypes.includes(file.type)) {
      return '只支持MP4, AVI, MOV, WMV, WEBM格式的视频文件';
    }

    return null;
  };

  const handleFile = async (file) => {
    const errorMsg = validateFile(file);
    if (errorMsg) {
      setError(errorMsg);
      return;
    }

    setError('');
    setUploading(true);

    try {
      // 创建FormData上传文件
      const formData = new FormData();
      formData.append('video', file);

      const response = await fetch(`http://localhost:5001/api/tasks/${taskId}/video`, {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const result = await response.json();
        setPreview(result.video_url);
        onVideoSelect && onVideoSelect(result);
        alert('视频上传成功！');
      } else {
        const errorData = await response.json();
        setError(errorData.error || '上传失败');
      }
    } catch (error) {
      setError('上传过程中发生错误');
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleYouTubeSubmit = async () => {
    if (!youtubeUrl.trim()) {
      setError('请输入YouTube链接');
      return;
    }

    setError('');
    setUploading(true);

    try {
      const response = await fetch(`http://localhost:5001/api/tasks/${taskId}/youtube`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ youtube_url: youtubeUrl })
      });

      if (response.ok) {
        const result = await response.json();
        onYouTubeUrl && onYouTubeUrl(result);
        setPreview(youtubeUrl);
        alert('YouTube链接保存成功！');
      } else {
        const errorData = await response.json();
        setError(errorData.error || '保存失败');
      }
    } catch (error) {
      setError('保存过程中发生错误');
      console.error('YouTube save error:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const removeVideo = () => {
    setPreview(null);
    setError('');
    setYoutubeUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="video-upload-container">
      <div className="upload-type-selector">
        <label className={uploadType === 'local' ? 'active' : ''}>
          <input
            type="radio"
            value="local"
            checked={uploadType === 'local'}
            onChange={(e) => setUploadType(e.target.value)}
          />
          <i className="fas fa-upload"></i>
          本地视频文件
        </label>
        <label className={uploadType === 'youtube' ? 'active' : ''}>
          <input
            type="radio"
            value="youtube"
            checked={uploadType === 'youtube'}
            onChange={(e) => setUploadType(e.target.value)}
          />
          <i className="fab fa-youtube"></i>
          YouTube链接
        </label>
      </div>

      {uploadType === 'local' && (
        <div className="local-upload-section">
          {!preview && (
            <div
              className={`upload-area ${dragActive ? 'drag-active' : ''}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={openFileDialog}
            >
              <div className="upload-content">
                <i className="fas fa-video upload-icon"></i>
                <p>拖拽视频文件到此处或点击选择文件</p>
                <p className="upload-hint">
                  支持格式: MP4, AVI, MOV, WMV, WEBM | 最大100MB
                </p>
              </div>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            onChange={(e) => e.target.files[0] && handleFile(e.target.files[0])}
            style={{ display: 'none' }}
          />
        </div>
      )}

      {uploadType === 'youtube' && (
        <div className="youtube-upload-section">
          <div className="form-group">
            <label htmlFor="youtube-url">YouTube视频链接</label>
            <input
              id="youtube-url"
              type="url"
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=... 或 https://youtu.be/..."
              className="youtube-input"
            />
            <button
              type="button"
              onClick={handleYouTubeSubmit}
              disabled={uploading || !youtubeUrl.trim()}
              className="youtube-save-btn"
            >
              {uploading ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i>
                  保存中...
                </>
              ) : (
                <>
                  <i className="fab fa-youtube"></i>
                  保存YouTube链接
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="upload-error">
          <i className="fas fa-exclamation-triangle"></i>
          {error}
        </div>
      )}

      {uploading && uploadType === 'local' && (
        <div className="upload-progress">
          <i className="fas fa-spinner fa-spin"></i>
          上传中，请稍候...
        </div>
      )}

      {preview && (
        <div className="video-preview">
          {uploadType === 'local' ? (
            <div className="local-video-preview">
              <video controls width="100%" style={{ maxHeight: '300px' }}>
                <source src={preview} type="video/mp4" />
                您的浏览器不支持视频标签。
              </video>
              <button type="button" className="remove-btn" onClick={removeVideo}>
                <i className="fas fa-times"></i>
                移除视频
              </button>
            </div>
          ) : (
            <div className="youtube-preview">
              <div className="youtube-info">
                <i className="fab fa-youtube"></i>
                <span>YouTube视频已设置</span>
                <a href={preview} target="_blank" rel="noopener noreferrer">
                  <i className="fas fa-external-link-alt"></i>
                  查看视频
                </a>
              </div>
              <button type="button" className="remove-btn" onClick={removeVideo}>
                <i className="fas fa-times"></i>
                移除链接
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default VideoUpload; 