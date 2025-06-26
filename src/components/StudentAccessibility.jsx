import React, { useState, useEffect } from 'react';
import './StudentAccessibility.css';

function StudentAccessibility() {
  const [highContrast, setHighContrast] = useState(false);
  const [largeFont, setLargeFont] = useState(false);
  const [colorBlind, setColorBlind] = useState(false);

  // Text-to-Speech
  const speak = () => {
    const synth = window.speechSynthesis;
    if (!synth) {
      return alert('Speech Synthesis not supported');
    }
    const text = document.getElementById('access-content').innerText;
    const utter = new SpeechSynthesisUtterance(text);
    synth.cancel();
    synth.speak(utter);
  };

  // Toggle classes on body
  useEffect(() => {
    const body = document.body;
    body.classList.toggle('high-contrast', highContrast);
    body.classList.toggle('font-large', largeFont);
    body.classList.toggle('colorblind', colorBlind);
  }, [highContrast, largeFont, colorBlind]);

  return (
    <div className="student-accessibility">
      <header>
        <img src="/assets/logo.png" alt="UNSW Logo" />
        <h1>Escape Room • Accessibility</h1>
        <a href="#dashboard" className="back-link">Back to Dashboard</a>
      </header>
      <nav aria-label="Student Navigation">
        <ul>
          <li><a href="#home">Home</a></li>
          <li><a href="#achievements">Achievements</a></li>
          <li><a href="#history">History</a></li>
          <li><a href="#accessibility" className="active" aria-current="page">Accessibility</a></li>
          <li><a href="#help">Help</a></li>
        </ul>
      </nav>
      <main>
        <div className="controls">
          <div className="control-card" role="region" aria-labelledby="contrast-label">
            <h2 id="contrast-label">High Contrast Mode</h2>
            <button
              id="btn-contrast"
              aria-pressed={highContrast}
              onClick={() => setHighContrast(prev => !prev)}
            >
              Toggle Contrast
            </button>
          </div>
          <div className="control-card" role="region" aria-labelledby="font-label">
            <h2 id="font-label">Large Font</h2>
            <button
              id="btn-font"
              aria-pressed={largeFont}
              onClick={() => setLargeFont(prev => !prev)}
            >
              Toggle Font Size
            </button>
          </div>
          <div className="control-card" role="region" aria-labelledby="colorblind-label">
            <h2 id="colorblind-label">Colorblind Mode</h2>
            <button
              id="btn-colorblind"
              aria-pressed={colorBlind}
              onClick={() => setColorBlind(prev => !prev)}
            >
              Toggle Colorblind
            </button>
          </div>
          <div className="control-card" role="region" aria-labelledby="tts-label">
            <h2 id="tts-label">Text-to-Speech</h2>
            <button id="btn-tts" onClick={speak}>🔊 Read Page Aloud</button>
          </div>
        </div>
        <section className="sample" aria-live="polite">
          <h2>Sample Content</h2>
          <p id="access-content">
            Welcome to the Escape Room platform! Here you can solve puzzles to learn Chemistry and Statistics.
          </p>
        </section>
      </main>
      <footer>
        &copy; 2025 UNSW Sydney • <a href="https://moodle.telt.unsw.edu.au">Moodle Home</a>
      </footer>
    </div>
  );
}

export default StudentAccessibility;