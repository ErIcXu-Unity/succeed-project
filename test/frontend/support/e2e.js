// Global Cypress support setup
import '@cypress/code-coverage/support';

// Command: login via API and set localStorage user_data
// This command is resilient to the backend being unavailable.
Cypress.Commands.add('loginAs', (role = 'stu', overrides = {}) => {
  const username =
    role === 'tea' ? 'st1000@tea.com' : overrides.username || '9000001@stu.com';
  const password = overrides.password || '123456';

  return cy
    .request({
      method: 'POST',
      url: `${Cypress.env('apiBaseUrl')}/login`,
      body: { username, password },
      failOnStatusCode: false, // don't fail on 4xx/5xx
      timeout: 3000, // fail fast if the server is down
    })
    .then(
      (res) => {
        if (res && res.status === 200) {
          const userData = {
            role: res.body.role,
            user_id: res.body.user_id,
            username,
            real_name: res.body.real_name,
          };
          // Use app window localStorage
          return cy.window().then((win) => {
            win.localStorage.setItem('user_data', JSON.stringify(userData));
            return res;
          });
        }
        return res;
      },
      // Handle network-level failures (e.g., ECONNREFUSED) gracefully
      (err) => {
        Cypress.log({
          name: 'loginAs',
          message: `API not reachable at ${Cypress.env('apiBaseUrl')}/login (${err.message || err})`,
        });
        return { status: 0, error: err };
      }
    );
});

// Preserve localStorage between tests if needed
beforeEach(() => {
  // noop; individual tests decide whether to clear storage
});


