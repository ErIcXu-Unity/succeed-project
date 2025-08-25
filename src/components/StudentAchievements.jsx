// src/components/StudentAchievements.jsx
import React, { useState, useEffect } from 'react';
import './StudentAchievements.css';
import config from '../config';

function StudentAchievements() {
  const [profile, setProfile] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStudentData();
  }, []);

  const fetchStudentData = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user_data'));
      
      if (!user?.user_id) {
        setError('User not logged in');
        setLoading(false);
        return;
      }

      // Get student profile information
              const profileResponse = await fetch(`${config.API_BASE_URL}/students/${user.user_id}/profile`);
      
      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        setProfile(profileData);
      } else {
        const errorText = await profileResponse.text();
        console.error('Profile fetch error:', errorText);
        throw new Error(`Failed to fetch profile: ${profileResponse.status}`);
      }

      // Get student achievement information
              const achievementsResponse = await fetch(`${config.API_BASE_URL}/students/${user.user_id}/achievements`);
      
      if (achievementsResponse.ok) {
        const achievementsData = await achievementsResponse.json();
        setAchievements(achievementsData.achievements);
      } else {
        const errorText = await achievementsResponse.text();
        throw new Error(`Failed to fetch achievements: ${achievementsResponse.status}`);
      }

    } catch (error) {
      setError(`Failed to load student data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Achievement icon mapping
  const getAchievementIcon = (name) => {
    switch (name) {
      case 'Perfect Score':
        return '🏆';
      case 'Accuracy Master':
        return '🎯';
      case 'Fast Solver':
        return '⏱️';
      case 'Quiz Warrior':
        return '📚';
      default:
        return '🏅';
    }
  };

  if (loading) {
    return (
      <div className="student-achievements-content">
        <div className="loading">
          <i className="fas fa-spinner fa-spin"></i>
          Loading your achievements...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="student-achievements-content">
        <div className="error">
          <i className="fas fa-exclamation-triangle"></i>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="student-achievements-content">
        <div className="error">
          <p>No profile data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="student-achievements-content">
      <div className="profile-stats">
        <div className="profile-card">
          <img src="/assets/avatar.jpg" alt="Student Avatar" />
          <div className="profile-info">
            <div><strong>Name:</strong> {profile.student_info.real_name}</div>
            <div><strong>ID:</strong> {profile.student_info.student_id}</div>
          </div>
        </div>
        <div className="stats-card">
          <div className="stat-box">
            Accuracy Rate
            <span>{profile.statistics.accuracy_rate}%</span>
          </div>
          <div className="stat-box">
            Average Score
            <span>{profile.statistics.average_score}%</span>
          </div>
          <div className="stat-box">
            Completed Tasks
            <span>{profile.statistics.completed_tasks}</span>
          </div>
        </div>
      </div>

      <div className="achievements-section">
        <h2>🏅 Achievements</h2>
        <div className="badge-container">
          {achievements.map((achievement) => (
            <div 
              key={achievement.id} 
              className={`badge ${achievement.unlocked ? 'unlocked' : 'locked'}`} 
              tabIndex="0"
              title={achievement.condition}
            >
              <div className="badge-icon">
                {getAchievementIcon(achievement.name)}
              </div>
              <div className="badge-title">{achievement.name}</div>
              {achievement.unlocked && (
                <div className="badge-unlock-date">
                  {new Date(achievement.unlocked_at).toLocaleDateString()}
                </div>
              )}
            </div>
          ))}
        </div>
        
        {achievements.length === 0 && (
          <div className="no-achievements">
            <p>No achievements available yet. Start completing tasks to unlock achievements!</p>
          </div>
        )}
        
        <div className="achievement-summary">
          <p>Unlocked: {achievements.filter(a => a.unlocked).length} / {achievements.length} achievements</p>
        </div>
      </div>
    </div>
  );
}

export default StudentAchievements;
