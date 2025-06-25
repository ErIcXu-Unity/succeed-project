const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from React build
app.use(express.static(path.join(__dirname, '../build')));

// OAuth2 token endpoint
app.post('/api/oauth/token', async (req, res) => {
  const { code, redirect_uri, client_id } = req.body;
  const client_secret = process.env.MOODLE_CLIENT_SECRET;

  try {
    const fetch = (await import('node-fetch')).default;
    
    const tokenResponse = await fetch('https://moodle.telt.unsw.edu.au/admin/oauth2/token.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id,
        client_secret,
        code,
        redirect_uri,
      }),
    });

    const tokenData = await tokenResponse.json();
    
    if (!tokenResponse.ok) {
      throw new Error(tokenData.error || 'Token exchange failed');
    }

    res.status(200).json(tokenData);
  } catch (error) {
    console.error('Token exchange error:', error);
    res.status(400).json({ error: error.message });
  }
});

// OAuth2 user info endpoint
app.get('/api/oauth/user', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid authorization header' });
  }

  const token = authHeader.substring(7);

  try {
    const fetch = (await import('node-fetch')).default;
    
    const userResponse = await fetch(
      `https://moodle.telt.unsw.edu.au/webservice/rest/server.php?wstoken=${token}&wsfunction=core_webservice_get_site_info&moodlewsrestformat=json`
    );

    const userData = await userResponse.json();
    
    if (!userResponse.ok || userData.exception) {
      throw new Error(userData.message || 'Failed to get user info');
    }

    res.status(200).json(userData);
  } catch (error) {
    console.error('User info error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Catch all handler for React Router
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../build/index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
