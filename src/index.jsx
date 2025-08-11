import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App.jsx';

// Enable CRA instrumentation for coverage only during Cypress runs
if (typeof window !== 'undefined' && window.Cypress) {
  // eslint-disable-next-line global-require
  require('@cypress/instrument-cra');
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);