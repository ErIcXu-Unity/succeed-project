// src/components/StudentAccessibility.jsx
import React, { useState, useEffect } from 'react';
import { useAlert } from './CustomAlert';
import './StudentAccessibility.css';

function StudentAccessibility() {
  const alert = useAlert();
  // Current states
  const [highContrast, setHighContrast] = useState(false);
  const [largeFont, setLargeFont] = useState(false);
  const [colorBlind, setColorBlind] = useState(false);

  // New states
  const [fontSize, setFontSize] = useState(100);
  const [colorTheme, setColorTheme] = useState('default');
  const [reduceMotion, setReduceMotion] = useState(false);
  const [keyboardNavMode, setKeyboardNavMode] = useState(false);
  const [readingGuide, setReadingGuide] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [ttsSettings, setTtsSettings] = useState({
    rate: 1,
    pitch: 1,
    voice: null,
    autoHighlight: true,
    enabled: false
  });

  // Font size options
  const fontSizeOptions = [
    { label: 'Small Font (85%)', value: 85 },
    { label: 'Normal (100%)', value: 100 },
    { label: 'Large Font (120%)', value: 120 },
    { label: 'Extra Large (150%)', value: 150 },
    { label: 'Maximum (200%)', value: 200 }
  ];

  // Color theme options
  const colorThemes = {
    default: 'Default Theme',
    darkMode: 'Dark Mode',
    highContrast: 'High Contrast',
    yellowBlack: 'Yellow on Black',
    blueWhite: 'Blue and White',
    protanopia: 'Protanopia Friendly',
    deuteranopia: 'Deuteranopia Friendly'
  };

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

  // Apply styles
  useEffect(() => {
    const body = document.body;
    
    // Clear all theme classes
    Object.keys(colorThemes).forEach(theme => {
      body.classList.remove(`theme-${theme}`);
    });
    
    // Apply new theme
    body.classList.add(`theme-${colorTheme}`);
    
    // Other styles
    body.classList.toggle('high-contrast', highContrast);
    body.classList.toggle('font-large', largeFont);
    body.classList.toggle('colorblind', colorBlind);
    body.classList.toggle('reduce-motion', reduceMotion);
    body.classList.toggle('keyboard-nav-enhanced', keyboardNavMode);
    body.classList.toggle('reading-guide', readingGuide);
    body.classList.toggle('focus-mode', focusMode);
    
    // Set font size
    body.style.fontSize = `${fontSize}%`;
  }, [colorTheme, highContrast, largeFont, colorBlind, reduceMotion, keyboardNavMode, readingGuide, focusMode, fontSize]);

  // Enhanced text-to-speech
  const speak = () => {
    const synth = window.speechSynthesis;
    if (!synth) return alert.warning('Speech Synthesis not supported in your browser');
    
    // Get main content to read
    const mainContent = document.querySelector('.student-accessibility-content');
    const headings = mainContent.querySelectorAll('h1, h2, h3');
    const textContent = Array.from(headings).map(h => h.textContent).join('. ');
    
    const text = textContent || 'Accessibility Settings Center. Configure your accessibility preferences using the options below.';
    const utterance = new SpeechSynthesisUtterance(text);
    
    utterance.rate = ttsSettings.rate;
    utterance.pitch = ttsSettings.pitch;
    if (ttsSettings.voice) {
      utterance.voice = ttsSettings.voice;
    }
    
    synth.cancel();
    synth.speak(utterance);
  };

  // Get available voices
  const [voices, setVoices] = useState([]);
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

  // Reset all settings
  const resetSettings = () => {
    setHighContrast(false);
    setLargeFont(false);
    setColorBlind(false);
    setFontSize(100);
    setColorTheme('default');
    setReduceMotion(false);
    setKeyboardNavMode(false);
    setReadingGuide(false);
    setFocusMode(false);
    setTtsSettings({ rate: 1, pitch: 1, voice: null, autoHighlight: true, enabled: false });
  };

  return (
    <div className="student-accessibility-content">
      <div className="accessibility-header">
        <h1>Accessibility Settings Center</h1>
        <button className="reset-btn" onClick={resetSettings}>
          Reset All Settings
        </button>
      </div>

      <div className="controls-grid">
        {/* Visual Settings */}
        <div className="control-section">
          <h2>Visual Settings</h2>
          
          <div className="control-card">
            <h3>Font Size</h3>
            <select 
              value={fontSize} 
              onChange={(e) => setFontSize(Number(e.target.value))}
              aria-label="Select font size"
            >
              {fontSizeOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="control-card">
            <h3>Color Theme</h3>
            <select 
              value={colorTheme} 
              onChange={(e) => setColorTheme(e.target.value)}
              aria-label="Select color theme"
            >
              {Object.entries(colorThemes).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>

          <div className="control-card">
            <h3>High Contrast Mode</h3>
            <button 
              onClick={() => setHighContrast(v => !v)}
              aria-pressed={highContrast}
            >
              {highContrast ? 'Disable' : 'Enable'} High Contrast
            </button>
          </div>

          <div className="control-card">
            <h3>Color Blind Assistance</h3>
            <button 
              onClick={() => setColorBlind(v => !v)}
              aria-pressed={colorBlind}
            >
              {colorBlind ? 'Disable' : 'Enable'} Color Blind Mode
            </button>
          </div>

          <div className="control-card">
            <h3>Reduce Motion</h3>
            <button 
              onClick={() => setReduceMotion(v => !v)}
              aria-pressed={reduceMotion}
            >
              {reduceMotion ? 'Restore' : 'Reduce'} Animation Effects
            </button>
          </div>
        </div>

        {/* Navigation Settings */}
        <div className="control-section">
          <h2>Navigation Settings</h2>

          <div className="control-card">
            <h3>Enhanced Keyboard Navigation</h3>
            <button 
              onClick={() => setKeyboardNavMode(v => !v)}
              aria-pressed={keyboardNavMode}
            >
              {keyboardNavMode ? 'Disable' : 'Enable'} Enhanced Navigation
            </button>
            <small>Enhanced focus indicators and skip links</small>
          </div>

          <div className="control-card">
            <h3>Reading Guide</h3>
            <button 
              onClick={() => setReadingGuide(v => !v)}
              aria-pressed={readingGuide}
            >
              {readingGuide ? 'Hide' : 'Show'} Reading Guide
            </button>
            <small>Helps track reading position</small>
          </div>

          <div className="control-card">
            <h3>Focus Mode</h3>
            <button 
              onClick={() => setFocusMode(v => !v)}
              aria-pressed={focusMode}
            >
              {focusMode ? 'Exit' : 'Enter'} Focus Mode
            </button>
            <small>Hide distracting elements</small>
          </div>
        </div>

        {/* Voice Settings */}
        <div className="control-section">
          <h2>Voice Settings</h2>

          <div className="control-card">
            <h3>Text-to-Speech</h3>
            
            <label className="tts-enable-setting">
              <input
                type="checkbox"
                checked={ttsSettings.enabled}
                onChange={(e) => setTtsSettings(prev => ({
                  ...prev,
                  enabled: e.target.checked
                }))}
              />
              <span>Enable Global Text-to-Speech</span>
            </label>
            
            <button onClick={speak} disabled={!ttsSettings.enabled}>
              🔊 Read Page Content
            </button>
            
            <small style={{ display: 'block', marginTop: '0.5rem', color: '#666', fontSize: '0.85rem' }}>
              💡 When enabled, you can also use the floating TTS button (🔊) on any page
            </small>
            
            <div className="tts-controls">
              <label>
                Speech Rate: {ttsSettings.rate}
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
              
              <label>
                Pitch: {ttsSettings.pitch}
                <input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.1"
                  value={ttsSettings.pitch}
                  onChange={(e) => setTtsSettings(prev => ({
                    ...prev,
                    pitch: parseFloat(e.target.value)
                  }))}
                />
              </label>

              {voices.length > 0 && (
                <label>
                  Voice Selection:
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
          </div>
        </div>
      </div>

      {/* Keyboard Shortcuts Guide */}
      <div className="keyboard-shortcuts">
        <h2>Keyboard Shortcuts</h2>
        <ul>
          <li><kbd>Tab</kbd> - Navigate forward</li>
          <li><kbd>Shift + Tab</kbd> - Navigate backward</li>
          <li><kbd>Enter</kbd> / <kbd>Space</kbd> - Activate buttons</li>
          <li><kbd>Escape</kbd> - Close popups/modals</li>
          <li><kbd>Arrow Keys</kbd> - Menu navigation</li>
        </ul>
      </div>
    </div>
  );
}

export default StudentAccessibility;