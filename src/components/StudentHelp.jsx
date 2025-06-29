// src/components/StudentHelp.jsx
import React, { useEffect } from 'react';
import './StudentHelp.css';

function StudentHelp() {
  useEffect(() => {
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

  const faqs = [
    { q: 'How do I start a new escape room?', a: 'Go to your Task List, select the escape room you want to play, and click “Start Game”.' },
    { q: 'How can I view my achievements?', a: 'Click on the “Achievements” tab in the top navigation to see all badges and points you have earned.' },
    { q: 'Why isn’t the text-to-speech working?', a: 'Please make sure your browser supports Speech Synthesis, and that you have not muted it. Try refreshing the page or using a different browser.' },
    { q: 'Who can I contact for more help?', a: (
      <>If you experience technical issues, please submit the form below or email us at&nbsp;
        <a href="mailto:escaperoom-support@unsw.edu.au">escaperoom-support@unsw.edu.au</a>.
      </>)
    }
  ];

  return (
    <div className="student-help-content">
      <div className="section-title">Frequently Asked Questions</div>
      {faqs.map((item, idx) => (
        <div className="faq-item" key={idx}>
          <div className="faq-question" tabIndex="0">{item.q}</div>
          <div className="faq-answer"><p>{item.a}</p></div>
        </div>
      ))}

      <div className="section-title">Contact Support</div>
      <form className="support-form">
        <label htmlFor="name">Your Name</label>
        <input id="name" placeholder="Enter your name" />

        <label htmlFor="email">Your Email</label>
        <input id="email" type="email" placeholder="Enter your email" />

        <label htmlFor="message">Message</label>
        <textarea id="message" rows="4" placeholder="Describe your issue" />

        <button type="submit">Submit</button>
      </form>
    </div>
  );
}

export default StudentHelp;
