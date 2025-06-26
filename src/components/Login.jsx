import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';

const Login = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const openLoginModal = (role) => {
    setModalTitle(`${role} Login`);
    setIsModalOpen(true);
  };

  const closeLoginModal = () => {
    setIsModalOpen(false);
    setUsername('');
    setPassword('');
  };

  const submitLogin = () => {
    if (username && password) {
      // Navigate to editor after successful login
      navigate('/editor');
    } else {
      alert('Please enter username and password');
    }
  };

  return (
    <div className="login-page">
      <header>
        <img src="assets/logo.png" alt="UNSW Logo" />
        <h1>escape room</h1>
      </header>

      <main>
        <div className="card-group">
          <div className="login-card" onClick={() => openLoginModal('Teacher')}>
            <img src="assets/teacher.png" alt="Teacher Logo" />
            <h2>Teacher Login</h2>
            <div className="login-text">Click to login with Moodle</div>
          </div>

          <div className="login-card" onClick={() => openLoginModal('Student')}>
            <img src="assets/graduation.png" alt="Student Logo" />
            <h2>Student Login</h2>
            <div className="login-text">Click to login with Moodle</div>
          </div>
        </div>
      </main>

      <footer>
        &copy; 2025 UNSW Sydney • <a href="https://moodle.telt.unsw.edu.au">Moodle Home</a>
      </footer>

      {isModalOpen && (
        <div className="modal" onClick={closeLoginModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <span className="close-btn" onClick={closeLoginModal}>&times;</span>
            <h2>{modalTitle}</h2>
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button onClick={submitLogin}>Login</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;