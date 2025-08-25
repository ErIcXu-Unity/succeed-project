// API Configuration
// Be defensive: in Vite-based Component Testing, `process` may be undefined in the browser runtime
const apiBaseFromEnv =
  (typeof process !== 'undefined' && process.env && process.env.REACT_APP_BACKEND_URL)
    ? process.env.REACT_APP_BACKEND_URL
    : undefined;

const config = {
  // Use env when available, otherwise use /api prefix
  API_BASE_URL: apiBaseFromEnv || '',
};

export default config;