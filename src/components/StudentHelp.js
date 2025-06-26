import React, { useEffect } from 'react';
import './StudentHelp.css';

function StudentHelp() {
  useEffect(() => {
    // FAQ 折叠交互
    document.querySelectorAll('.faq-question').forEach(q => {
      const toggleFaq = () => {
        q.classList.toggle('open');
        const ans = q.nextElementSibling;
        if (q.classList.contains('open')) {
          ans.style.maxHeight = ans.scrollHeight + 'px';
        } else {
          ans.style.maxHeight = null;
        }
      };
      q.addEventListener('click', toggleFaq);
      q.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          toggleFaq();
        }
      });
    });
  }, []);

  return (
    <div className="student-help">
      <header>
        <img src="/assets/logo.png" alt="UNSW Logo" />
        <h1>Escape Room • Help</h1>
        <a href="#dashboard" className="back-link">Back to Dashboard</a>
      </header>
      <nav aria-label="Student Navigation">
        <ul>
          <li><a href="#home">Home</a></li>
          <li><a href="#achievements">Achievements</a></li>
          <li><a href="#history">History</a></li>
          <li><a href="#accessibility">Accessibility</a></li>
          <li><a href="#help" className="active" aria-current="page">Help</a></li>
        </ul>
      </nav>
      <main>
        <div className="section-title">Frequently Asked Questions</div>
        {[
          {
            q: 'How do I start a new escape room?',
            a: 'Go to your Task List, select the escape room you want to play, and click “Start Game”.'
          },
          {
            q: 'How can I view my achievements?',
            a: 'Click on the “Achievements” tab in the top navigation to see all badges and points you have earned.'
          },
          {
            q: 'Why isn’t the text-to-speech working?',
            a: 'Please make sure your browser supports Speech Synthesis, and that you have not muted it. Try refreshing the page or using a different browser.'
          },
          {
            q: 'Who can I contact for more help?',
            a: <>
              If you experience technical issues, please submit the form below or email us at{' '}
              <a href="mailto:escaperoom-support@unsw.edu.au">
                escaperoom-support@unsw.edu.au
              </a>.
            </>
          }
        ].map((item, idx) => (
          <div className="faq-item" key={idx}>
            <div
              className="faq-question"
              tabIndex="0"
            >
              {item.q}
            </div>
            <div className="faq-answer">
              <p>{item.a}</p>
            </div>
          </div>
        ))}

        <div className="section-title">Contact Support</div>
        <form className="support-form">
          <label htmlFor="name">Your Name</label>
          <input type="text" id="name" placeholder="Enter your name" />

          <label htmlFor="email">Your Email</label>
          <input type="email" id="email" placeholder="Enter your email" />

          <label htmlFor="message">Message</label>
          <textarea id="message" rows="4" placeholder="Describe your issue" />

          <button type="submit">Submit</button>
        </form>
      </main>
      <footer>
        &copy; 2025 UNSW Sydney • <a href="https://moodle.telt.unsw.edu.au">Moodle Home</a>
      </footer>
    </div>
  );
}

export default StudentHelp;
