import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Register from './Register.jsx';
import PasswordInput from './PasswordInput.jsx';
import './Login.css';

const Login = ({ onLoginSuccess }) => {
  const [showRegister, setShowRegister] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [loginData, setLoginData] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const openLoginModal = (role) => {
    setModalTitle(`${role} Login`);
    setIsModalOpen(true);
    setError('');
    setLoginData({ username: '', password: '' });
  };

  const closeLoginModal = () => {
    setIsModalOpen(false);
    setLoginData({ username: '', password: '' });
    setError('');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setLoginData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const submitLogin = async () => {
    if (!loginData.username || !loginData.password) {
      setError('Please enter username and password');
      return;
    }

    setLoading(true);
    setError('');

    try {
                  const response = await fetch('http://localhost:5001/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: loginData.username,
          password: loginData.password
        })
      });

      const data = await response.json();

      if (response.ok) {
        // Store user data in localStorage (include real_name)
        const userData = {
          role: data.role,
          user_id: data.user_id,
          username: loginData.username,
          real_name: data.real_name
        };
        localStorage.setItem('user_data', JSON.stringify(userData));
        
        closeLoginModal();
        onLoginSuccess(userData);
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const openStudentRegister = () => {
    setShowRegister(true);
  };

  const backToLogin = () => {
    setShowRegister(false);
  };

  // Show register component if requested
  if (showRegister) {
    return <Register onBackToLogin={backToLogin} />;
  }

  return (
    <div className="login-page">
      <header>
        <img src="/assets/logo.png" alt="UNSW Logo" />
        <h1>Escape Room Editor</h1>
      </header>

      <main>
        <div className="card-group">
          <div className="login-card" onClick={() => openLoginModal('Teacher')}>
            <img src="/assets/teacher.png" alt="Teacher Logo" />
            <h2>Teacher Login</h2>
            <div className="login-text">Click to login with credentials</div>
          </div>

          <div className="login-card" onClick={() => openLoginModal('Student')}>
            <img src="/assets/graduation.png" alt="Student Logo" />
            <h2>Student Login</h2>
            <div className="login-text">Click to login with credentials</div>
          </div>

          <div className="login-card" onClick={openStudentRegister}>
            <img src="/assets/graduation.png" alt="Student Registration" />
            <h2>Student Register</h2>
            <div className="login-text">New student? Register here</div>
          </div>
        </div>
      </main>

      <footer>
        &copy; 2025 UNSW Sydney •{' '}
        <a href="https://moodle.telt.unsw.edu.au">Moodle Home</a>
      </footer>

      {isModalOpen && (
        <div className="modal" onClick={closeLoginModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <span className="close-btn" onClick={closeLoginModal}>&times;</span>
            <h2>{modalTitle}</h2>
            
            {error && <div style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}
            
            <input
              type="text"
              name="username"
              placeholder="Username (email)"
              value={loginData.username}
              onChange={handleInputChange}
            />
            
            <PasswordInput
              name="password"
              placeholder="Password"
              value={loginData.password}
              onChange={handleInputChange}
            />
            <button onClick={submitLogin} disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;