import React, { useState, useEffect } from 'react';
import './LoadingScreen.css';

const LoadingScreen = () => {
  const [progress, setProgress] = useState(0);
  const [loadingText, setLoadingText] = useState('Initializing escape room...');

  const loadingMessages = [
    'Initializing escape room...',
    'Setting up puzzles...',
    'Loading challenges...',
    'Preparing adventure...',
    'Almost ready...'
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + Math.random() * 15 + 5;
        
        // Update loading text based on progress
        if (newProgress > 80) {
          setLoadingText(loadingMessages[4]);
        } else if (newProgress > 60) {
          setLoadingText(loadingMessages[3]);
        } else if (newProgress > 40) {
          setLoadingText(loadingMessages[2]);
        } else if (newProgress > 20) {
          setLoadingText(loadingMessages[1]);
        } else {
          setLoadingText(loadingMessages[0]);
        }
        
        return Math.min(newProgress, 100);
      });
    }, 200);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="loading-screen">
      <div className="loading-background"></div>
      <div className="loading-content">
        <div className="logo-container">
          <img src="/assets/logo.png" alt="UNSW Logo" className="loading-logo" />
          <div className="title-container">
            <h1 className="loading-title">UNSW Escape Room</h1>
            <div className="title-underline"></div>
          </div>
        </div>
        
        <div className="subtitle-container">
          <p className="loading-subtitle">Waiting to start the adventure</p>
        </div>

        <div className="progress-container">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${progress}%` }}
            ></div>
            <div className="progress-glow"></div>
          </div>
          <div className="progress-text">{Math.round(progress)}%</div>
        </div>

        <div className="loading-message">
          <p>{loadingText}</p>
        </div>

        <div className="loading-dots">
          <span className="dot"></span>
          <span className="dot"></span>
          <span className="dot"></span>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;