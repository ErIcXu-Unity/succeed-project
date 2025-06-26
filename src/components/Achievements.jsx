import React from 'react';
import './Achievements.css';

const Achievements = () => {
  const badges = [
    { id: 1, title: 'Escape Artist', description: 'Completed your first escape room!', icon: 'fas fa-key' },
    { id: 2, title: 'Speed Runner', description: 'Finished an escape room in under 30 minutes.', icon: 'fas fa-trophy' },
    { id: 3, title: 'Puzzle Master', description: 'Solved all puzzles in an escape room.', icon: 'fas fa-lightbulb' },
    { id: 4, title: 'Team Player', description: 'Completed an escape room with a team.', icon: 'fas fa-users' },
    { id: 5, title: 'Lone Wolf', description: 'Completed an escape room solo.', icon: 'fas fa-user-secret' },
    { id: 6, title: 'Chemistry Conqueror', description: 'Mastered the Chemistry Escape Room.', icon: 'fas fa-flask' },
    { id: 7, title: 'Statistics Savvy', description: 'Excelled in the Statistics Escape Room.', icon: 'fas fa-chart-line' }
  ];

  return (
    <div className="achievements">
      <h1>🏆 Your Achievements</h1>
      <div className="badge-container">
        {badges.map(badge => (
          <div key={badge.id} className="badge">
            <div className="icon">
              <i className={badge.icon}></i>
            </div>
            <div className="title">{badge.title}</div>
            <div className="description">{badge.description}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Achievements;