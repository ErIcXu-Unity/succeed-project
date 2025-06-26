import React, { useState, useEffect } from 'react';
import TeacherDashboard from './components/TeacherDashboard.jsx';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Front-end only fake OAuth2 login
  const loginWithMoodle = async () => {
    setLoading(true);
    setError(null);
    try {
      // Simulate network delay for OAuth2 flow
      await new Promise(res => setTimeout(res, 500));

      // Fake token and user profile
      const fakeToken = 'fake-oauth2-token-xyz';
      const fakeUser = {
        fullname: 'Professor Alice Wang',
        email:    'alice.wang@unsw.edu.au',
        username: 'z7654321',
        role:     'Teacher',
        userid:   'T-FAKE-001'
      };

      // Persist fake session data
      localStorage.setItem('moodle_token', fakeToken);
      localStorage.setItem('moodle_user', JSON.stringify(fakeUser));

      // Update UI state
      setUser(fakeUser);

    } catch (err) {
      console.error('Fake login error:', err);
      setError(`Login failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Clear session data
  const logout = () => {
    setUser(null);
    localStorage.removeItem('moodle_user');
    localStorage.removeItem('moodle_token');
  };

  // Restore session from localStorage on app load
  useEffect(() => {
    const saved = localStorage.getItem('moodle_user');
    if (saved) {
      try {
        setUser(JSON.parse(saved));
      } catch {
        localStorage.removeItem('moodle_user');
      }
    }
  }, []);

  if (loading) {
    return (
      <div className="App">
        <h2>Authenticating with Moodle…</h2>
        <div className="spinner" />
      </div>
    );
  }

  return user ? (
    <div className="App">
      <header>
        <img src="/assets/logo.png" alt="UNSW Logo" />
        <h1>Escape Room Editor</h1>
        <div className="user-info">
          <span>Welcome, {user.fullname} ({user.role})</span>
          <button onClick={logout} className="logout-btn">Logout</button>
        </div>
      </header>
      <main>
        <TeacherDashboard />
      </main>
      <footer>
        &copy; 2025 UNSW Sydney • <a href="https://moodle.telt.unsw.edu.au">Moodle Home</a>
      </footer>
    </div>
  ) : (
    <div className="App">
      <header>
        <img src="/assets/logo.png" alt="UNSW Logo" />
        <h1>Escape Room Editor</h1>
      </header>
      <main>
        <div className="card-group">
          <div className="login-card" onClick={loginWithMoodle}>
            <img src="/assets/moodle-icon.png" alt="Moodle Logo" />
            <h2>Login with Moodle</h2>
            {error && <div className="error-message">{error}</div>}
          </div>
        </div>
      </main>
      <footer>
        &copy; 2025 UNSW Sydney • <a href="https://moodle.telt.unsw.edu.au">Moodle Home</a>
      </footer>
    </div>
  );
}

export default App;