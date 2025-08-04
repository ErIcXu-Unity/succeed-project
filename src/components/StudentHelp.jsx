// src/components/StudentHelp.jsx
import React, { useState, useEffect } from 'react';
import './StudentHelp.css';

function StudentHelp() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [feedbackGiven, setFeedbackGiven] = useState({});
  const [showContactForm, setShowContactForm] = useState(false);

  const categories = {
    'all': 'All Topics',
    'getting-started': 'Getting Started',
    'gameplay': 'Gameplay & Tasks',
    'technical': 'Technical Issues',
    'accessibility': 'Accessibility',
    'account': 'Account & Profile'
  };

  const helpContent = [
    {
      id: 1,
      category: 'getting-started',
      question: 'How do I start my first escape room?',
      answer: 'Navigate to your dashboard, select a task from the available list, and click "Start Game". Make sure you have a stable internet connection for the best experience.',
      tags: ['start', 'begin', 'first', 'dashboard']
    },
    {
      id: 2,
      category: 'getting-started', 
      question: 'What are the different types of puzzles?',
      answer: 'Our platform includes multiple choice questions, fill-in-the-blank puzzles, matching tasks, and interactive puzzle games. Each type is designed to test different aspects of Chemistry and Statistics knowledge.',
      tags: ['puzzles', 'types', 'multiple choice', 'matching']
    },
    {
      id: 3,
      category: 'gameplay',
      question: 'How can I view my achievements and progress?',
      answer: 'Click on the "Achievements" tab in the navigation menu to see all badges and points you have earned. You can also track your completion rate and performance statistics.',
      tags: ['achievements', 'progress', 'badges', 'points']
    },
    {
      id: 4,
      category: 'gameplay',
      question: 'Can I retake a quiz if I didn\'t do well?',
      answer: 'Yes! You can retake most quizzes to improve your score. Check the specific task settings as some may have attempt limits. Your highest score will be recorded.',
      tags: ['retake', 'quiz', 'score', 'attempt']
    },
    {
      id: 5,
      category: 'technical',
      question: 'Why isn\'t the text-to-speech working?',
      answer: 'Ensure your browser supports Speech Synthesis and that audio isn\'t muted. Try refreshing the page or using a different browser. Chrome and Firefox work best.',
      tags: ['text-to-speech', 'audio', 'browser', 'sound']
    },
    {
      id: 6,
      category: 'technical',
      question: 'The page is loading slowly. What should I do?',
      answer: 'Clear your browser cache, check your internet connection, and ensure you\'re using an updated browser. If issues persist, try accessing the platform during off-peak hours.',
      tags: ['slow', 'loading', 'cache', 'internet']
    },
    {
      id: 7,
      category: 'accessibility',
      question: 'How do I adjust font size and colors?',
      answer: 'Go to the "Accessibility" section in your student dashboard. You can adjust font size, enable high contrast mode, choose different color themes, and configure other visual preferences.',
      tags: ['font', 'size', 'color', 'contrast', 'accessibility']
    },
    {
      id: 8,
      category: 'accessibility',
      question: 'Does the platform work with screen readers?',
      answer: 'Yes! Our platform is designed to work with screen readers like NVDA, JAWS, and VoiceOver. We follow WCAG 2.1 guidelines for accessibility. If you encounter issues, please contact support.',
      tags: ['screen reader', 'NVDA', 'JAWS', 'VoiceOver', 'WCAG']
    },
    {
      id: 9,
      category: 'account',
      question: 'How do I change my password?',
      answer: 'In your dashboard, look for account settings or profile options. You can change your password securely there. Always use a strong password with mixed characters.',
      tags: ['password', 'change', 'account', 'security']
    },
    {
      id: 10,
      category: 'account',
      question: 'Can I track my learning history?',
      answer: 'Yes! Visit the "History" section to see all your completed tasks, scores, time spent, and improvement trends. This helps track your learning journey.',
      tags: ['history', 'track', 'learning', 'progress']
    }
  ];

  const quickActions = [
    { title: 'Start New Task', action: '→ Dashboard', icon: '🎯' },
    { title: 'View Achievements', action: '→ Achievements', icon: '🏆' },
    { title: 'Accessibility Settings', action: '→ Accessibility', icon: '♿' },
    { title: 'Check History', action: '→ History', icon: '📊' }
  ];

  // Filter content based on search and category
  const filteredContent = helpContent.filter(item => {
    const matchesSearch = searchTerm === '' || 
      item.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
    
    return matchesSearch && matchesCategory;
  });

  const toggleFaq = (id) => {
    setExpandedFaq(expandedFaq === id ? null : id);
  };

  const handleFeedback = (faqId, isHelpful) => {
    setFeedbackGiven(prev => ({
      ...prev,
      [faqId]: isHelpful
    }));
    // Here you would typically send feedback to your backend
  };

  const handleKeyDown = (e, faqId) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleFaq(faqId);
    }
  };

  return (
    <div className="student-help-content">
      <div className="help-header">
        <h1>Help & Support Center</h1>
        <p>Find answers to common questions or get personalized help</p>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <h2>Quick Actions</h2>
        <div className="actions-grid">
          {quickActions.map((action, idx) => (
            <div key={idx} className="action-card">
              <span className="action-icon">{action.icon}</span>
              <div className="action-content">
                <h3>{action.title}</h3>
                <span className="action-link">{action.action}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Search Bar */}
      <div className="search-section">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search for help topics, keywords..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
            aria-label="Search help topics"
          />
        </div>
      </div>

      {/* Category Filter */}
      <div className="category-filter">
        <h2>Browse by Category</h2>
        <div className="category-tabs">
          {Object.entries(categories).map(([key, label]) => (
            <button
              key={key}
              className={`category-tab ${activeCategory === key ? 'active' : ''}`}
              onClick={() => setActiveCategory(key)}
              aria-pressed={activeCategory === key}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* FAQ Section */}
      <div className="faq-section">
        <div className="section-header">
          <h2>Frequently Asked Questions</h2>
          <span className="results-count">
            {filteredContent.length} result{filteredContent.length !== 1 ? 's' : ''} found
          </span>
        </div>

        {filteredContent.length === 0 ? (
          <div className="no-results">
            <p>No results found for "{searchTerm}". Try different keywords or browse categories above.</p>
          </div>
        ) : (
          filteredContent.map((item) => (
            <div key={item.id} className="faq-item">
              <div 
                className={`faq-question ${expandedFaq === item.id ? 'open' : ''}`}
                onClick={() => toggleFaq(item.id)}
                onKeyDown={(e) => handleKeyDown(e, item.id)}
                tabIndex="0"
                role="button"
                aria-expanded={expandedFaq === item.id}
                aria-controls={`faq-answer-${item.id}`}
              >
                <span className="category-badge">{categories[item.category]}</span>
                {item.question}
              </div>
              <div 
                id={`faq-answer-${item.id}`}
                className="faq-answer"
                style={{
                  maxHeight: expandedFaq === item.id ? '200px' : '0',
                  padding: expandedFaq === item.id ? '1rem' : '0 1rem'
                }}
              >
                <p>{item.answer}</p>
                
                {expandedFaq === item.id && (
                  <div className="faq-feedback">
                    <span>Was this helpful?</span>
                    <div className="feedback-buttons">
                      <button
                        className={`feedback-btn ${feedbackGiven[item.id] === true ? 'active' : ''}`}
                        onClick={() => handleFeedback(item.id, true)}
                        aria-label="Mark as helpful"
                      >
                        👍 Yes
                      </button>
                      <button
                        className={`feedback-btn ${feedbackGiven[item.id] === false ? 'active' : ''}`}
                        onClick={() => handleFeedback(item.id, false)}
                        aria-label="Mark as not helpful"
                      >
                        👎 No
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Contact Section */}
      <div className="contact-section">
        <h2>Still Need Help?</h2>
        <div className="contact-options">
          <div className="contact-card">
            <h3>📧 Email Support</h3>
            <p>Get detailed help via email</p>
            <a href="mailto:escaperoom-support@unsw.edu.au" className="contact-link">
              escaperoom-support@unsw.edu.au
            </a>
          </div>
          
          <div className="contact-card">
            <h3>💬 Submit a Ticket</h3>
            <p>Describe your specific issue</p>
            <button 
              className="contact-btn"
              onClick={() => setShowContactForm(!showContactForm)}
            >
              {showContactForm ? 'Hide Form' : 'Open Form'}
            </button>
          </div>
        </div>

        {showContactForm && (
          <form className="support-form">
            <h3>Contact Support</h3>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="name">Your Name *</label>
                <input id="name" placeholder="Enter your full name" required />
              </div>
              <div className="form-group">
                <label htmlFor="email">Email Address *</label>
                <input id="email" type="email" placeholder="your.email@student.unsw.edu.au" required />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="category">Issue Category</label>
              <select id="category">
                <option value="">Select a category</option>
                <option value="technical">Technical Issue</option>
                <option value="accessibility">Accessibility</option>
                <option value="content">Content/Quiz Problem</option>
                <option value="account">Account Issue</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="message">Describe Your Issue *</label>
              <textarea 
                id="message" 
                rows="4" 
                placeholder="Please provide as much detail as possible about the issue you're experiencing..."
                required
              />
            </div>

            <div className="form-actions">
              <button type="submit" className="submit-btn">Submit Ticket</button>
              <button type="button" className="cancel-btn" onClick={() => setShowContactForm(false)}>
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default StudentHelp;
