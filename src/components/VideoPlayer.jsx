import React from 'react';
import './VideoPlayer.css';
import config from '../config';

const VideoPlayer = ({ task }) => {
  if (!task || !task.video_type) {
    return (
      <div className="simple-video-player">
        <div className="no-video-notice">
          <i className="fas fa-video-slash"></i>
          <p>There is no video added to this task yet</p>
        </div>
      </div>
    );
  }

  if (task.video_type === 'youtube') {
    // YouTube 视频嵌入
    const getYouTubeEmbedUrl = (url) => {
      const regex = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/;
      const match = url.match(regex);
      return match ? `https://www.youtube.com/embed/${match[1]}?rel=0&showinfo=0&modestbranding=1` : null;
    };

    const embedUrl = getYouTubeEmbedUrl(task.video_url);
    
    if (!embedUrl) {
      return (
        <div className="simple-video-player">
          <div className="video-error-simple">
            <i className="fas fa-exclamation-triangle"></i>
            <p>Unable to parse the YouTube video link, please check if the link is correct</p>
          </div>
        </div>
      );
    }

    return (
      <div className="simple-video-player">
        <div className="video-info-header">
          <i className="fab fa-youtube"></i>
          <span>YouTube Video</span>
        </div>
        <div className="youtube-video-container">
          <iframe
            width="100%"
            height="450"
            src={embedUrl}
            title="Task Video"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            loading="lazy"
            style={{ 
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
            }}
          ></iframe>
        </div>
      </div>
    );
  }

  if (task.video_type === 'local') {
    // 本地视频播放 - 采用教师端的简洁样式
    const videoUrl = task.video_url?.startsWith('http') 
      ? task.video_url 
      : `${config.API_BASE_URL}${task.video_url}`;
      
    return (
      <div className="simple-video-player">
        <div className="video-info-header">
          <i className="fas fa-file-video"></i>
          <span>Task Video</span>
        </div>
        <div className="local-video-container">
          <video
            src={videoUrl}
            controls
            style={{ 
              width: '100%', 
              maxWidth: '800px', 
              height: 'auto',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
              backgroundColor: '#f8fafc'
            }}
            onError={(e) => {
              console.error('Video load error. Current video URL:', videoUrl);
              e.target.style.display = 'none';
              // 显示错误提示
              const errorDiv = e.target.nextElementSibling;
              if (errorDiv && errorDiv.classList.contains('video-error-fallback')) {
                errorDiv.style.display = 'block';
              }
            }}
            onLoadStart={() => {
              console.log('Video loading started for:', videoUrl);
            }}
            onCanPlay={() => {
              console.log('Video can play:', videoUrl);
            }}
          >
            <source src={videoUrl} type="video/mp4" />
            <source src={videoUrl} type="video/mov" />
            <source src={videoUrl} type="video/avi" />
            <source src={videoUrl} type="video/webm" />
          </video>
          <div className="video-error-fallback" style={{ display: 'none' }}>
            <i className="fas fa-exclamation-triangle"></i>
            <p>Video loading failed, please check if the file exists</p>
            <a href={videoUrl} download target="_blank" rel="noopener noreferrer">
              <i className="fas fa-download"></i>
              Download video file
            </a>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default VideoPlayer; 