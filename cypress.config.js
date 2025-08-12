const { defineConfig } = require('cypress');

module.exports = defineConfig({
  // Point fixtures to the test/frontend directory
  fixturesFolder: 'test/frontend/fixtures',
  // Move Cypress artifacts under test/frontend
  screenshotsFolder: 'test/frontend/.artifacts/screenshots',
  videosFolder: 'test/frontend/.artifacts/videos',
  downloadsFolder: 'test/frontend/.artifacts/downloads',
  e2e: {
    baseUrl: 'http://localhost:3000',
    // Point specs and support to test/frontend
    specPattern: 'test/frontend/e2e/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'test/frontend/support/e2e.js',

    video: false,
    chromeWebSecurity: false,
    env: {
      apiBaseUrl: 'http://localhost:5001'
    }
  },
  component: {
    // Component Testing spec and support paths
    specPattern: 'test/frontend/components/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'test/frontend/support/component.js',
    indexHtmlFile: 'test/frontend/support/component-index.html',
    devServer: {
      framework: 'react',
      bundler: 'vite'
    },
    setupNodeEvents(on, config) {
      // Enable code coverage task for component testing
      require('@cypress/code-coverage/task')(on, config);
      return config;
    }
  }
});


