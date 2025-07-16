import React, { useState, useEffect } from 'react';
import './VideoUpload.css';

const VideoUpload = ({ taskId, onVideoUploaded }) => {
  const [uploadMode, setUploadMode] = useState('local'); // 'local' 或 'youtube'
  const [selectedFile, setSelectedFile] = useState(null);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [currentVideo, setCurrentVideo] = useState(null);

  // 检查是否为新建模式
  const isCreateMode = !taskId || taskId === 'new';

  // 获取当前任务的视频信息（仅在编辑模式下）
  useEffect(() => {
    const fetchTaskVideo = async () => {
      if (isCreateMode) return;
      
      try {
        const response = await fetch(`http://localhost:5001/api/tasks/${taskId}`);
        if (response.ok) {
          const taskData = await response.json();
          if (taskData.video_path || taskData.video_url) {
            setCurrentVideo({
              type: taskData.video_type,
              path: taskData.video_path,
              url: taskData.video_url
            });
          }
        }
      } catch (error) {
        console.error('Error fetching task video:', error);
      }
    };

    fetchTaskVideo();
  }, [taskId, isCreateMode]);

  // 支持的视频格式
  const SUPPORTED_FORMATS = ['mp4', 'avi', 'mov', 'wmv', 'webm'];
  const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

  // 验证文件
  const validateFile = (file) => {
    if (!file) return false;

    const fileExtension = file.name.split('.').pop().toLowerCase();
    if (!SUPPORTED_FORMATS.includes(fileExtension)) {
      setError(`不支持的文件格式。支持的格式：${SUPPORTED_FORMATS.join(', ')}`);
      return false;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError('文件大小超过 100MB 限制');
      return false;
    }

    return true;
  };

  // 验证 YouTube URL
  const validateYouTubeUrl = (url) => {
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[\w-]+/;
    return youtubeRegex.test(url);
  };

  // 处理文件选择
  const handleFileSelect = (file) => {
    setError('');
    setSuccess('');

    if (!validateFile(file)) return;

    setSelectedFile(file);
    
    // 创建预览 URL
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  // 拖拽事件处理
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  // 文件输入改变
  const handleFileInputChange = (e) => {
    if (e.target.files.length > 0) {
      handleFileSelect(e.target.files[0]);
    }
  };

  // 上传本地视频文件
  const uploadLocalVideo = async () => {
    if (!selectedFile) return;

    // 新建模式：暂时不支持本地文件（需要复杂的文件保存逻辑）
    if (isCreateMode) {
      setError('新建任务时暂不支持本地视频文件。请先保存任务，然后编辑任务来添加本地视频。');
      return;
    }

    setUploading(true);
    setError('');
    setSuccess('');

    const formData = new FormData();
    formData.append('video', selectedFile);

    try {
      const response = await fetch(`http://localhost:5001/api/tasks/${taskId}/video`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        setSuccess('视频上传成功！');
        setCurrentVideo({
          type: 'local',
          path: result.video_path,
          url: null
        });
        
        // 通知父组件
        if (onVideoUploaded) {
          onVideoUploaded({
            type: 'local',
            path: result.video_path
          });
        }
      } else {
        const errorData = await response.json();
        setError(errorData.error || '上传失败');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setError('网络错误，请重试');
    } finally {
      setUploading(false);
    }
  };

  // 保存 YouTube 链接
  const saveYouTubeUrl = async () => {
    if (!youtubeUrl) return;

    if (!validateYouTubeUrl(youtubeUrl)) {
      setError('请输入有效的 YouTube 链接');
      return;
    }

    // 新建模式：收集信息，不立即保存
    if (isCreateMode) {
      setSuccess('YouTube 链接已设置！将在保存任务时一并保存。');
      setCurrentVideo({
        type: 'youtube',
        path: null,
        url: youtubeUrl
      });
      
      // 通知父组件
      if (onVideoUploaded) {
        onVideoUploaded({
          type: 'youtube',
          url: youtubeUrl
        });
      }
      return;
    }

    // 编辑模式：立即保存
    setUploading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`http://localhost:5001/api/tasks/${taskId}/youtube`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ youtube_url: youtubeUrl }),
      });

      if (response.ok) {
        setSuccess('YouTube 链接保存成功！');
        setCurrentVideo({
          type: 'youtube',
          path: null,
          url: youtubeUrl
        });
        
        // 通知父组件
        if (onVideoUploaded) {
          onVideoUploaded({
            type: 'youtube',
            url: youtubeUrl
          });
        }
      } else {
        const errorData = await response.json();
        setError(errorData.error || '保存失败');
      }
    } catch (error) {
      console.error('Save error:', error);
      setError('网络错误，请重试');
    } finally {
      setUploading(false);
    }
  };

  // 清除选择
  const clearSelection = () => {
    setSelectedFile(null);
    setPreviewUrl('');
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
  };

  // 切换上传模式
  const handleModeChange = (mode) => {
    setUploadMode(mode);
    setError('');
    setSuccess('');
    clearSelection();
    setYoutubeUrl('');
  };

  return (
    <div className="video-upload-container">
      <h3>任务视频 (可选)</h3>
      
      {/* 模式提示 */}
      {isCreateMode && (
        <div className="mode-notice">
          💡 新建任务模式：YouTube 链接将在保存任务时一并保存。本地视频请先保存任务后再添加。
        </div>
      )}
      
      {/* 当前视频显示 */}
      {currentVideo && (
        <div className="current-video">
          <h4>当前视频:</h4>
          {currentVideo.type === 'local' ? (
            <div className="current-video-info">
              📁 本地视频文件: {currentVideo.path}
            </div>
          ) : (
            <div className="current-video-info">
              🎬 YouTube 视频: {currentVideo.url}
            </div>
          )}
        </div>
      )}

      {/* 上传模式选择 */}
      <div className="upload-mode-selector">
        <button
          className={uploadMode === 'local' ? 'active' : ''}
          onClick={() => handleModeChange('local')}
          disabled={uploading}
        >
          📁 本地视频文件
        </button>
        <button
          className={uploadMode === 'youtube' ? 'active' : ''}
          onClick={() => handleModeChange('youtube')}
          disabled={uploading}
        >
          🎬 YouTube 链接
        </button>
      </div>

      {/* 本地文件上传 */}
      {uploadMode === 'local' && (
        <div className="local-upload-section">
          {isCreateMode && (
            <div className="create-mode-warning">
              ⚠️ 新建任务时暂不支持本地视频。请使用 YouTube 链接，或先保存任务后再编辑添加本地视频。
            </div>
          )}
          <div
            className={`drop-zone ${isDragOver ? 'drag-over' : ''} ${isCreateMode ? 'disabled' : ''}`}
            onDrop={isCreateMode ? null : handleDrop}
            onDragOver={isCreateMode ? null : handleDragOver}
            onDragLeave={isCreateMode ? null : handleDragLeave}
          >
            <input
              type="file"
              accept="video/*"
              onChange={handleFileInputChange}
              style={{ display: 'none' }}
              id="video-file-input"
              disabled={uploading || isCreateMode}
            />
            <label htmlFor="video-file-input" className="drop-zone-content">
              {selectedFile ? (
                <div className="file-selected">
                  <div className="file-info">
                    📹 {selectedFile.name}
                    <br />
                    <small>{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</small>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      clearSelection();
                    }}
                    className="clear-file"
                    disabled={uploading}
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <div className="drop-zone-placeholder">
                  <div className="upload-icon">📁</div>
                  <p>{isCreateMode ? '新建模式下暂不支持本地视频' : '点击选择视频文件或拖拽到此处'}</p>
                  <small>支持格式: {SUPPORTED_FORMATS.join(', ')}</small>
                  <small>最大文件大小: 100MB</small>
                </div>
              )}
            </label>
          </div>

          {/* 视频预览 */}
          {previewUrl && !isCreateMode && (
            <div className="video-preview">
              <h4>预览:</h4>
              <video
                src={previewUrl}
                controls
                style={{ width: '100%', maxWidth: '400px', height: 'auto' }}
              />
            </div>
          )}

          {/* 上传按钮 */}
          {selectedFile && !isCreateMode && (
            <button
              onClick={uploadLocalVideo}
              disabled={uploading}
              className="upload-button"
            >
              {uploading ? '上传中...' : '上传视频'}
            </button>
          )}
        </div>
      )}

      {/* YouTube 链接输入 */}
      {uploadMode === 'youtube' && (
        <div className="youtube-section">
          <div className="youtube-input-group">
            <input
              type="url"
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              placeholder="请输入 YouTube 视频链接 (例: https://www.youtube.com/watch?v=...)"
              className="youtube-input"
              disabled={uploading}
            />
            <button
              onClick={saveYouTubeUrl}
              disabled={uploading || !youtubeUrl.trim()}
              className="save-youtube-button"
            >
              {uploading ? '保存中...' : (isCreateMode ? '设置链接' : '保存链接')}
            </button>
          </div>
          
          {/* YouTube 预览 */}
          {youtubeUrl && validateYouTubeUrl(youtubeUrl) && (
            <div className="youtube-preview">
              <h4>预览:</h4>
              <div className="youtube-embed">
                <iframe
                  src={youtubeUrl.replace('watch?v=', 'embed/')}
                  title="YouTube 视频预览"
                  frameBorder="0"
                  allowFullScreen
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* 状态消息 */}
      {error && <div className="error-message">❌ {error}</div>}
      {success && <div className="success-message">✅ {success}</div>}
      
      {/* 上传进度 */}
      {uploading && (
        <div className="upload-progress">
          <div className="progress-text">正在处理...</div>
        </div>
      )}
    </div>
  );
};

export default VideoUpload; 