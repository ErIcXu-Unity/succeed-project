import React, { useState } from 'react';
import './TeacherDashboard.css';

const TeacherDashboard = () => {
  const [activeTab, setActiveTab] = useState('Dashboard');

  const gameData = [
    {
      id: 1,
      title: 'Escape Room 1',
      image: '/assets/game01.jpg'
    },
    {
      id: 2,
      title: 'Escape Room 2',
      image: '/assets/game02.jpg'
    }
  ];

  const stats = {
    totalGames: 12,
    totalStudents: 86,
    avgCompletion: 75
  };

  const handleNavClick = (tabName) => {
    setActiveTab(tabName);
  };

  const viewGrades = (gameId) => {
    alert(`Redirect to grades page for game ${gameId}`);
  };

  const editGame = (gameId) => {
    alert(`Redirect to edit game page for game ${gameId}`);
  };

  const createGame = () => {
    alert("Redirect to create game page");
  };

  return (
    <div className="teacher-dashboard">
      <div className="header">Teacher Dashboard</div>

      <div className="nav">
        {['Dashboard', 'Students', 'Reports', 'Settings'].map((item) => (
          <div
            key={item}
            className={`nav-item ${activeTab === item ? 'active' : ''}`}
            onClick={() => handleNavClick(item)}
          >
            <i className={`fas fa-${getIconName(item)}`}></i>
            {item}
          </div>
        ))}
      </div>

      <div className="main-content">
        {/* Stats */}
        <div className="stats">
          <div className="stat-box">Total Games: {stats.totalGames}</div>
          <div className="stat-box">Total Students: {stats.totalStudents}</div>
          <div className="stat-box">Avg Completion: {stats.avgCompletion}%</div>
        </div>

        {/* Cards */}
        <div className="card-container">
          {gameData.map((game) => (
            <div key={game.id} className="card">
              <img src={game.image} alt={game.title} />
              <div className="card-title">{game.title}</div>
              <div className="card-buttons">
                <button className="grade-btn" onClick={() => viewGrades(game.id)}>
                  <i className="fas fa-chart-line"></i> Grades
                </button>
                <button className="edit-btn" onClick={() => editGame(game.id)}>
                  <i className="fas fa-edit"></i> Edit
                </button>
              </div>
            </div>
          ))}

          {/* Add Card */}
          <div className="add-card" onClick={createGame}>
            +
          </div>
        </div>
      </div>
    </div>
  );
};

const getIconName = (item) => {
  const iconMap = {
    'Dashboard': 'home',
    'Students': 'users',
    'Reports': 'chart-bar',
    'Settings': 'cog'
  };
  return iconMap[item] || 'home';
};

export default TeacherDashboard;