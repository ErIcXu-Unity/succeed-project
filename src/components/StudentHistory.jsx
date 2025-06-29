// src/components/StudentHistory.jsx
import React from 'react';
import './StudentHistory.css';

function StudentHistory() {
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
    <div className="student-history-content">
      <div className="section-title">Completed Escape Room Tasks</div>
      <div className="history-grid">
        {historyItems.map(item => (
          <div key={item.id} className="history-card">
            <img src={item.img} alt={item.title} />
            <div className="history-info">
              <h3>{item.title}</h3>
              <p>Course: {item.course}</p>
              <p>Completed: {item.completed} &middot; Score: {item.score}</p>
              <a href={`#feedback?task=${item.id}`}>View Feedback</a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default StudentHistory;
