const { defineConfig } = require('cypress');

module.exports = defineConfig({
  // Point fixtures to the test/frontend directory
  fixturesFolder: 'test/frontend/fixtures',
  e2e: {
    baseUrl: 'http://localhost:3000',
    // Point specs and support to test/frontend
    specPattern: 'test/frontend/e2e/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'test/frontend/support/e2e.js',
    setupNodeEvents(on, config) {
      require('@cypress/code-coverage/task')(on, config);
      return config;
    },
    video: false,
    chromeWebSecurity: false,
    env: {
      apiBaseUrl: 'http://localhost:5001'
    }
  }
});


