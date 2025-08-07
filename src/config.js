// API Configuration
const config = {
  // Use environment variable if available, fallback to localhost:5001
  API_BASE_URL: process.env.REACT_APP_BACKEND_URL || 'http://localhost:5001',
};

export default config;