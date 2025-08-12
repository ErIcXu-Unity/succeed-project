/// <reference types="cypress" />

describe('Authentication flows', () => {
  beforeEach(() => {
    cy.clearLocalStorage();
  });

  it('renders loading screen first, then login cards', () => {
    cy.visit('/');
    cy.contains('UNSW Escape Room');
    // Loading screen progresses then hides after ~3s (App has 3s minimum)
    cy.contains('Waiting to start the adventure');
    cy.wait(30);
    cy.contains('Teacher Login');
    cy.contains('Student Login');
    cy.contains('Student Register');
  });

  it('student login modal validation (empty fields, missing password, wrong password, network error)', () => {
    cy.visit('/');
    cy.wait(30);
    cy.contains('Student Login').click();
    cy.get('.modal-content').within(() => {
      // empty fields
      cy.contains('button', 'Login').click();
      cy.contains('Please enter username and password');
    });

    // only username provided
    cy.get('.modal-content input[name="username"]').type('9000001@stu.com');
    cy.get('.modal-content').within(() => {
      cy.contains('button', 'Login').click();
      cy.contains('Please enter username and password');
    });

    // wrong password (stub 401)
    cy.get('.modal-content input[name="password"]').clear().type('wrongpass');
    cy.intercept('POST', '**/login', {
      statusCode: 401,
      body: { error: 'Invalid credentials' }
    }).as('login401');
    cy.get('.modal-content').within(() => {
      cy.contains('button', 'Login').click();
    });
    cy.wait('@login401');
    cy.get('[data-cy="login-error"]').contains(/Invalid credentials|Login failed/);

    // network error
    cy.intercept('POST', '**/login', { forceNetworkError: true }).as('loginNet');
    cy.get('.modal-content').within(() => {
      cy.contains('button', 'Login').click();
    });
    cy.wait('@loginNet');
    cy.get('[data-cy="login-error"]').contains('Network error. Please try again.');
  });

  it('student login success path (stubbed)', () => {
    cy.visit('/');
    cy.wait(30);
    cy.contains('Student Login').click();
    cy.get('.modal-content input[name="username"]').type('9000001@stu.com');
    cy.get('.modal-content input[name="password"]').type('123456');
    cy.intercept('POST', '**/login', {
      statusCode: 200,
      body: { role: 'stu', user_id: 9000001, real_name: 'Cypress Stu' }
    }).as('login200');
    cy.get('.modal-content').within(() => {
      cy.contains('button', 'Login').click();
    });
    cy.wait('@login200');
    cy.location('pathname', { timeout: 6000 }).should('include', '/student');
  });

  it('teacher login success path (stubbed via UI)', () => {
    cy.visit('/');
    cy.wait(30);
    cy.contains('Teacher Login').click();
    cy.get('.modal-content input[name="username"]').type('st1000@tea.com');
    cy.get('.modal-content input[name="password"]').type('123456');
    cy.intercept('POST', '**/login', {
      statusCode: 200,
      body: { role: 'tea', user_id: 1000, real_name: 'Cypress Tea' }
    }).as('tLogin200');
    cy.get('.modal-content').within(() => {
      cy.contains('button', 'Login').click();
    });
    cy.wait('@tLogin200');
    cy.location('pathname', { timeout: 6000 }).should('include', '/teacher');
    cy.contains('Teacher Dashboard');
  });

  it('opens Teacher login modal, shows correct title, and closes via X button', () => {
    cy.visit('/');
    cy.wait(30);
    cy.contains('Teacher Login').click();
    cy.get('.modal-content').within(() => {
      cy.contains('Teacher Login');
      cy.get('.close-btn').click();
    });
    cy.get('.modal-content').should('not.exist');
  });

  it('closes login modal by clicking outside overlay', () => {
    cy.visit('/');
    cy.wait(30);
    cy.contains('Student Login').click();
    cy.get('.modal').click('topLeft');
    cy.get('.modal-content').should('not.exist');
  });

  it('switches Teacher -> Student login resets fields and title', () => {
    cy.visit('/');
    cy.wait(30);
    cy.contains('Teacher Login').click();
    cy.get('.modal-content input[name="username"]').type('t@tea.com');
    cy.get('.close-btn').click();
    cy.contains('Student Login').click();
    cy.get('.modal-content').within(() => {
      cy.contains('Student Login');
      cy.get('input[name="username"]').should('have.value', '');
      cy.get('input[name="password"]').should('have.value', '');
    });
  });

  it('login button shows loading and is disabled during pending request; prevents double submit', () => {
    let calls = 0;
    cy.visit('/');
    cy.wait(30);
    cy.contains('Student Login').click();
    cy.get('.modal-content input[name="username"]').type('9000001@stu.com');
    cy.get('.modal-content input[name="password"]').type('123456');
    cy.intercept('POST', '**/login', (req) => {
      calls += 1;
      req.reply({ delay: 1000, statusCode: 401, body: { error: 'Invalid credentials' } });
    }).as('slowLogin');
    cy.get('.modal-content').within(() => {
      cy.get('[data-cy="login-submit"]').click();
      cy.contains('Logging in...');
      cy.get('[data-cy="login-submit"]').should('be.disabled');
      // second click attempt should not send another request while disabled
      cy.get('[data-cy="login-submit"]').click({ force: true });
    });
    cy.wait('@slowLogin');
    cy.then(() => {
      expect(calls).to.eq(1);
    });
  });

  it('auto logs in if localStorage has student user_data (redirect to /student/home)', () => {
    const userData = { role: 'stu', user_id: 9000001, username: '9000001@stu.com', real_name: 'Auto Stu' };
    cy.visit('/', {
      onBeforeLoad(win) {
        win.localStorage.setItem('user_data', JSON.stringify(userData));
      }
    });
    cy.contains('UNSW Escape Room');
    cy.wait(30);
    cy.location('pathname', { timeout: 6000 }).should('include', '/student');
  });

  it('logout removes user_data and returns to login page', () => {
    const userData = { role: 'stu', user_id: 9000001, username: '9000001@stu.com', real_name: 'Auto Stu' };
    cy.visit('/', {
      onBeforeLoad(win) {
        win.localStorage.setItem('user_data', JSON.stringify(userData));
      }
    });
    cy.wait(30);
    cy.get('button.logout-btn').click();
    cy.location('pathname', { timeout: 6000 }).should('eq', '/');
    cy.window().then((win) => {
      expect(win.localStorage.getItem('user_data')).to.be.null;
    });
  });

  it('error message clears after closing and reopening modal', () => {
    cy.visit('/');
    cy.wait(30);
    cy.contains('Student Login').click();
    cy.get('.modal-content').within(() => {
      cy.contains('button', 'Login').click();
      cy.get('[data-cy="login-error"]').contains('Please enter username and password');
      cy.get('.close-btn').click();
    });
    cy.get('.modal-content').should('not.exist');
    cy.contains('Student Login').click();
    cy.get('.modal-content [data-cy="login-error"]').should('not.exist');
  });

  it('switch role opens correct modal titles', () => {
    cy.visit('/');
    cy.wait(30);
    cy.contains('Teacher Login').click();
    cy.get('.modal-content').contains('Teacher Login');
    cy.get('.close-btn').click();
    cy.contains('Student Login').click();
    cy.get('.modal-content').contains('Student Login');
  });

  it('register flow visible and back to login', () => {
    cy.visit('/');
    cy.wait(30);
    cy.contains('Student Register').click();
    cy.contains('Student Registration');
    cy.contains('Back to Login').click();
    cy.contains('Student Login');
  });
});


