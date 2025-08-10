// src/components/StudentLayout.jsx
import React, { useState, useEffect } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAlert } from './CustomAlert';
import './StudentLayout.css';

export default function StudentLayout() {
  const alert = useAlert();
  // Global TTS states
  const [showTTSPanel, setShowTTSPanel] = useState(false);
  const [ttsSettings, setTtsSettings] = useState({
    rate: 1,
    pitch: 1,
    voice: null,
    enabled: false
  });
  const [voices, setVoices] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);

  // Load TTS settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('student-tts-settings');
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      setTtsSettings(prev => ({ ...prev, ...settings }));
    }
  }, []);

  // Save TTS settings to localStorage when changed
  useEffect(() => {
    localStorage.setItem('student-tts-settings', JSON.stringify(ttsSettings));
  }, [ttsSettings]);

  // Get available voices
  useEffect(() => {
    const updateVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices.filter(voice => voice.lang.startsWith('en')));
    };
    
    updateVoices();
    window.speechSynthesis.addEventListener('voiceschanged', updateVoices);
    
    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', updateVoices);
    };
  }, []);

  // Read current page content
  const readCurrentPage = () => {
    const synth = window.speechSynthesis;
    if (!synth) {
      alert.warning('Speech Synthesis not supported in your browser');
      return;
    }

    // Stop any current speech
    synth.cancel();

    // Get main content from current page
    const mainContent = document.querySelector('.student-content');
    if (!mainContent) return;

    // Extract text from headings and paragraphs
    const headings = mainContent.querySelectorAll('h1, h2, h3');
    const paragraphs = mainContent.querySelectorAll('p');
    
    let textContent = '';
    
    // Add headings
    headings.forEach(heading => {
      textContent += heading.textContent + '. ';
    });
    
    // Add first few paragraphs
    const maxParagraphs = 3;
    for (let i = 0; i < Math.min(paragraphs.length, maxParagraphs); i++) {
      if (paragraphs[i].textContent.trim().length > 20) {
        textContent += paragraphs[i].textContent + '. ';
      }
    }

    if (!textContent.trim()) {
      textContent = 'No readable content found on this page.';
    }

    const utterance = new SpeechSynthesisUtterance(textContent);
    utterance.rate = ttsSettings.rate;
    utterance.pitch = ttsSettings.pitch;
    
    if (ttsSettings.voice) {
      utterance.voice = ttsSettings.voice;
    }

    utterance.onstart = () => setIsPlaying(true);
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => {
      setIsPlaying(false);
      alert.error('Speech synthesis failed. Please try again.');
    };

    synth.speak(utterance);
  };

  const stopSpeech = () => {
    window.speechSynthesis.cancel();
    setIsPlaying(false);
  };

  const toggleTTSPanel = () => {
    setShowTTSPanel(!showTTSPanel);
  };

  return (
    <div className="student-layout">
      {/* Secondary header */}
      <div className="sub-header">
        <h2>Escape Room • Student Dashboard</h2>
        {/*
        <NavLink to="/" className="back-to-main">
          Back to Main
        </NavLink>
        */}
      </div>

      {/* Student secondary navigation */}
      <nav className="student-nav">
        <ul>
          <li><NavLink to="home">Home</NavLink></li>
          <li><NavLink to="achievements">Achievements</NavLink></li>
          <li><NavLink to="history">History</NavLink></li>
          <li><NavLink to="accessibility">Accessibility</NavLink></li>
          <li><NavLink to="help">Help</NavLink></li>
        </ul>
      </nav>

      {/* Global TTS Floating Panel */}
      <div className="global-tts-container">
        {/* TTS Toggle Button */}
        <button 
          className="tts-toggle-btn"
          onClick={toggleTTSPanel}
          title="Text-to-Speech Controls"
          aria-label="Toggle text-to-speech panel"
        >
          🔊
        </button>

        {/* TTS Control Panel */}
        {showTTSPanel && (
          <div className="tts-floating-panel">
            <div className="tts-panel-header">
              <h3>🔊 Text-to-Speech</h3>
              <button 
                className="close-panel-btn"
                onClick={toggleTTSPanel}
                aria-label="Close panel"
              >
                ✕
              </button>
            </div>

            <div className="tts-panel-content">
              {/* Main Control */}
              <div className="tts-main-control">
                <button 
                  className={`read-page-btn ${isPlaying ? 'playing' : ''}`}
                  onClick={isPlaying ? stopSpeech : readCurrentPage}
                  disabled={!ttsSettings.enabled && !isPlaying}
                >
                  {isPlaying ? '⏹️ Stop Reading' : '▶️ Read This Page'}
                </button>
              </div>

              {/* Quick Settings */}
              <div className="tts-quick-settings">
                <label className="tts-setting">
                  <span>Enable TTS:</span>
                  <input
                    type="checkbox"
                    checked={ttsSettings.enabled}
                    onChange={(e) => setTtsSettings(prev => ({
                      ...prev,
                      enabled: e.target.checked
                    }))}
                  />
                </label>

                <label className="tts-setting">
                  <span>Speed: {ttsSettings.rate}x</span>
                  <input
                    type="range"
                    min="0.5"
                    max="2"
                    step="0.1"
                    value={ttsSettings.rate}
                    onChange={(e) => setTtsSettings(prev => ({
                      ...prev,
                      rate: parseFloat(e.target.value)
                    }))}
                  />
                </label>

                {voices.length > 0 && (
                  <label className="tts-setting">
                    <span>Voice:</span>
                    <select
                      value={ttsSettings.voice?.name || ''}
                      onChange={(e) => {
                        const selectedVoice = voices.find(v => v.name === e.target.value);
                        setTtsSettings(prev => ({ ...prev, voice: selectedVoice }));
                      }}
                    >
                      <option value="">Default Voice</option>
                      {voices.map(voice => (
                        <option key={voice.name} value={voice.name}>
                          {voice.name}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
              </div>

              <div className="tts-panel-footer">
                <small>
                  <NavLink to="accessibility" onClick={toggleTTSPanel}>
                    → Advanced Settings
                  </NavLink>
                </small>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Sub-route mount point */}
      <div className="student-content">
        <Outlet />
      </div>
    </div>
  );
}
