// src/components/StudentAchievements.jsx
import React from 'react';
import './StudentAchievements.css';

function StudentAchievements() {
  const profile = {
    name: 'John Doe',
    id: '123456',
    course: 'Chemistry Intro',
    avatar: '/assets/avatar.jpg'
  };

  const stats = [
    { label: 'Completion Rate', value: '92%' },
    { label: 'Total Quizzes', value: '15' },
    { label: 'Average Score', value: '87%' }
  ];

  const badges = [
    { icon: '🏆', title: 'Perfect Score' },
    { icon: '🎯', title: 'Accuracy Master' },
    { icon: '⏱️', title: 'Fast Solver' },
    { icon: '📚', title: 'Quiz Warrior' }
  ];

  return (
    <div className="student-achievements-content">
      <div className="profile-stats">
        <div className="profile-card">
          <img src={profile.avatar} alt="Student Avatar" />
          <div className="profile-info">
            <div><strong>Name:</strong> {profile.name}</div>
            <div><strong>ID:</strong> {profile.id}</div>
            <div><strong>Course:</strong> {profile.course}</div>
          </div>
        </div>
        <div className="stats-card">
          {stats.map((s, idx) => (
            <div key={idx} className="stat-box">
              {s.label}
              <span>{s.value}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="achievements-section">
        <h2>🏅 Achievements Unlocked</h2>
        <div className="badge-container">
          {badges.map((b, idx) => (
            <div key={idx} className="badge" tabIndex="0">
              <div className="badge-icon">{b.icon}</div>
              <div className="badge-title">{b.title}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default StudentAchievements;
