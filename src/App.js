import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Moodle OAuth2 configuration
  const MOODLE_CONFIG = {
    baseUrl: 'https://moodle.telt.unsw.edu.au',
    clientId: process.env.REACT_APP_MOODLE_CLIENT_ID || 'your-moodle-client-id',
    redirectUri: window.location.origin + '/oauth/callback',
    scope: 'read write'
  };

  useEffect(() => {
    // Check if returning from OAuth callback
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    
    if (code) {
      handleOAuthCallback(code, state);
    }
  }, []);

  const loginWithMoodle = () => {
    setError('');
    setLoading(true);
    
    // Generate state for security
    const state = Math.random().toString(36).substring(2, 15);
    localStorage.setItem('oauth_state', state);
    
    // Build OAuth2 authorization URL
    const authUrl = `${MOODLE_CONFIG.baseUrl}/admin/oauth2/login.php?` +
      `client_id=${MOODLE_CONFIG.clientId}&` +
      `response_type=code&` +
      `redirect_uri=${encodeURIComponent(MOODLE_CONFIG.redirectUri)}&` +
      `scope=${encodeURIComponent(MOODLE_CONFIG.scope)}&` +
      `state=${state}`;
    
    // Redirect to Moodle OAuth2 login
    window.location.href = authUrl;
  };

  const handleOAuthCallback = async (code, state) => {
    setLoading(true);
    setError('');
    
    try {
      // Verify state parameter
      const savedState = localStorage.getItem('oauth_state');
      if (state !== savedState) {
        throw new Error('Invalid state parameter');
      }
      
      // Exchange code for access token
      const tokenResponse = await fetch('/api/oauth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code,
          redirect_uri: MOODLE_CONFIG.redirectUri,
          client_id: MOODLE_CONFIG.clientId,
        }),
      });
      
      if (!tokenResponse.ok) {
        throw new Error('Failed to get access token');
      }
      
      const tokenData = await tokenResponse.json();
      
      // Get user information
      const userResponse = await fetch('/api/oauth/user', {
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
        },
      });
      
      if (!userResponse.ok) {
        throw new Error('Failed to get user information');
      }
      
      const userData = await userResponse.json();
      
      // Store user data
      setUser(userData);
      localStorage.setItem('moodle_user', JSON.stringify(userData));
      localStorage.setItem('moodle_token', tokenData.access_token);
      
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
      
    } catch (error) {
      console.error('OAuth error:', error);
      setError('Login failed: ' + error.message);
    } finally {
      setLoading(false);
      localStorage.removeItem('oauth_state');
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('moodle_user');
    localStorage.removeItem('moodle_token');
  };

  // Check for existing user session on app load
  useEffect(() => {
    const savedUser = localStorage.getItem('moodle_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  if (loading) {
    return (
      <div className="App">
        <div className="loading">
          <h2>Authenticating with Moodle...</h2>
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  if (user) {
    return (
      <div className="App">
        <header>
          <img src="/assets/logo.png" alt="UNSW Logo" />
          <h1>escape room</h1>
          <div className="user-info">
            <span>Welcome, {user.fullname || user.username}</span>
            <button onClick={logout} className="logout-btn">Logout</button>
          </div>
        </header>

        <main>
          <div className="dashboard">
            <h2>Welcome to Escape Room Editor</h2>
            <p>You are successfully logged in through Moodle!</p>
            <div className="user-details">
              <p><strong>Name:</strong> {user.fullname}</p>
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>Username:</strong> {user.username}</p>
            </div>
            <button className="start-btn" onClick={() => window.location.href = '/ER/index.html'}>
              Start Creating Escape Room
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="App">
      <header>
        <img src="/assets/logo.png" alt="UNSW Logo" />
        <h1>escape room</h1>
      </header>

      <main>
        <div className="card-group">
          <div className="login-card" onClick={loginWithMoodle}>
            <img src="/assets/moodle-icon.png" alt="Moodle Logo" />
            <h2>Login with Moodle</h2>
            <div className="login-text">Click to login with your UNSW Moodle account</div>
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
