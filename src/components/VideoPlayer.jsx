import React from 'react';
import './VideoPlayer.css';

const VideoPlayer = ({ task }) => {
  if (!task.video_type) {
    return null; // 没有视频
  }

  if (task.video_type === 'youtube') {
    // YouTube视频嵌入
    const getYouTubeEmbedUrl = (url) => {
      const regex = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/;
      const match = url.match(regex);
      return match ? `https://www.youtube.com/embed/${match[1]}` : null;
    };

    const embedUrl = getYouTubeEmbedUrl(task.video_url);
    
    if (!embedUrl) {
      return (
        <div className="video-player error-player">
          <div className="video-error">
            <i className="fas fa-exclamation-triangle"></i>
            <p>无法解析YouTube视频链接</p>
          </div>
        </div>
      );
    }

    return (
      <div className="video-player youtube-player">
        <div className="video-header">
          <i className="fab fa-youtube"></i>
          <span>YouTube 视频</span>
        </div>
        <div className="video-wrapper">
          <iframe
            width="100%"
            height="315"
            src={embedUrl}
            title="Task Video"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
        </div>
      </div>
    );
  }

  if (task.video_type === 'local') {
    // 本地视频播放
    return (
      <div className="video-player local-player">
        <div className="video-header">
          <i className="fas fa-video"></i>
          <span>任务视频</span>
        </div>
        <div className="video-wrapper">
          <video controls width="100%" preload="metadata">
            <source src={task.video_url} type="video/mp4" />
            <p>
              您的浏览器不支持视频标签。
              <a href={task.video_url} download>下载视频</a>
            </p>
          </video>
        </div>
      </div>
    );
  }

  return null;
};

export default VideoPlayer; 