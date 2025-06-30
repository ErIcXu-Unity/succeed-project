import React from 'react';
import './TeacherDashboard.css';
import { useNavigate } from 'react-router-dom';

const TeacherDashboard = () => {
  const navigate = useNavigate();

  const gameData = [
    { id: 1, title: 'Escape Room 1', image: '/assets/game01.jpg' },
    { id: 2, title: 'Escape Room 2', image: '/assets/game02.jpg' }
  ];

  const stats = {
    totalGames: 12,
    totalStudents: 86,
    avgCompletion: 75
  };

  const viewGrades = (gameId) => {
    navigate('/teacher/gamegrade');
  };

  const editGame = (gameId) => {
    alert(`Redirect to edit game page for game ${gameId}`);
  };

  const createGame = () => {
    alert("Redirect to create game page");
  };

  return (
    <div className="main-content">
      <div className="stats">
        <div className="stat-box">Total Games: {stats.totalGames}</div>
        <div className="stat-box">Total Students: {stats.totalStudents}</div>
        <div className="stat-box">Avg Completion: {stats.avgCompletion}%</div>
      </div>

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
        <div className="add-card" onClick={createGame}>+</div>
      </div>
    </div>
  );
};

export default TeacherDashboard;