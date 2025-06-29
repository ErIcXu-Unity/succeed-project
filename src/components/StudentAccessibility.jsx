// src/components/StudentAccessibility.jsx
import React, { useState, useEffect } from 'react';
import './StudentAccessibility.css';

function StudentAccessibility() {
  const [highContrast, setHighContrast] = useState(false);
  const [largeFont, setLargeFont]       = useState(false);
  const [colorBlind, setColorBlind]     = useState(false);

  useEffect(() => {
    const body = document.body;
    body.classList.toggle('high-contrast', highContrast);
    body.classList.toggle('font-large', largeFont);
    body.classList.toggle('colorblind', colorBlind);
  }, [highContrast, largeFont, colorBlind]);

  const speak = () => {
    const synth = window.speechSynthesis;
    if (!synth) return alert('Speech Synthesis not supported');
    const text = document.getElementById('access-content').innerText;
    const utt  = new SpeechSynthesisUtterance(text);
    synth.cancel();
    synth.speak(utt);
  };

  return (
    <div className="student-accessibility-content">
      <div className="controls">
        <div className="control-card">
          <h2>High Contrast Mode</h2>
          <button onClick={() => setHighContrast(v => !v)}>
            Toggle Contrast
          </button>
        </div>
        <div className="control-card">
          <h2>Large Font</h2>
          <button onClick={() => setLargeFont(v => !v)}>
            Toggle Font Size
          </button>
        </div>
        <div className="control-card">
          <h2>Colorblind Mode</h2>
          <button onClick={() => setColorBlind(v => !v)}>
            Toggle Colorblind
          </button>
        </div>
        <div className="control-card">
          <h2>Text-to-Speech</h2>
          <button onClick={speak}>🔊 Read Page Aloud</button>
        </div>
      </div>

      <section className="sample" aria-live="polite">
        <h2>Sample Content</h2>
        <p id="access-content">
          Welcome to the Escape Room platform! Here you can solve puzzles to learn Chemistry and Statistics.
        </p>
      </section>
    </div>
  );
}

export default StudentAccessibility;
