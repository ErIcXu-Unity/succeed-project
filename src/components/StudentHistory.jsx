import React from 'react';
import './StudentHistory.css';

function StudentHistory() {
  // Fake completed tasks data; replace with API calls as needed
  const historyItems = [
    {
      id: '1',
      title: 'Lab Escape: Solution Prep',
      course: 'Chemistry Intro',
      completed: '2025-06-15',
      score: '85%',
      img: '/assets/task1.jpg'
    },
    {
      id: '2',
      title: 'Data Analysis Escape: Probability',
      course: 'Statistics',
      completed: '2025-06-13',
      score: '92%',
      img: '/assets/task2.jpg'
    },
    {
      id: '3',
      title: 'Lab Safety Escape',
      course: 'Chemistry Intro',
      completed: '2025-06-10',
      score: '78%',
      img: '/assets/task3.jpg'
    },
    {
      id: '4',
      title: 'Statistics Challenge Escape',
      course: 'Statistics',
      completed: '2025-06-08',
      score: '88%',
      img: '/assets/task4.jpg'
    }
  ];

  return (
    <div className="student-history">
      <header>
        <img src="/assets/logo.png" alt="UNSW Logo" />
        <h1>Escape Room • History</h1>
        <a href="#dashboard" className="back-link">Back to Dashboard</a>
      </header>

      <nav aria-label="Student Navigation">
        <ul>
          <li><a href="#home">Home</a></li>
          <li><a href="#achievements">Achievements</a></li>
          <li><a href="#history" className="active" aria-current="page">History</a></li>
          <li><a href="#accessibility">Accessibility</a></li>
          <li><a href="#help">Help</a></li>
        </ul>
      </nav>

      <main>
        <div className="section-title">Completed Escape Room Tasks</div>
        <div className="history-grid">
          {historyItems.map(item => (
            <div key={item.id} className="history-card">
              <img src={item.img} alt={item.title} />
              <div className="history-info">
                <h3>{item.title}</h3>
                <p>Course: {item.course}</p>
                <p>Completed: {item.completed} • Score: {item.score}</p>
                <a href={`#feedback?task=${item.id}`}>View Feedback</a>
              </div>
            </div>
          ))}
        </div>
      </main>

      <footer>
        &copy; 2025 UNSW Sydney • <a href="https://moodle.telt.unsw.edu.au">Moodle Home</a>
      </footer>
    </div>
  );
}

export default StudentHistory;