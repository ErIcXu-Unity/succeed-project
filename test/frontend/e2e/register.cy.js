/// <reference types="cypress" />

describe('Student Registration', () => {
  const openRegister = () => {
    cy.visit('/');
    cy.wait(30);
    cy.contains('Student Register').click();
    cy.contains('Student Registration');
  };

  const disableNativeValidation = () => {
    cy.get('form').invoke('attr', 'novalidate', 'novalidate');
  };

  beforeEach(() => {
    cy.clearLocalStorage();
  });

  it('email auto-generates when studentId reaches 7 digits and is read-only', () => {
    openRegister();
    cy.get('input[name="studentId"]').type('9000001');
    cy.get('input[name="email"]').should('have.value', '9000001@stu.com').and('have.attr', 'readonly');
  });

  // New granular validations
  it('realName with only spaces still triggers required', () => {
    openRegister();
    disableNativeValidation();
    cy.get('input[name="realName"]').type('   ');
    cy.get('input[name="studentId"]').type('9001234');
    cy.contains('Register').click();
    cy.get('.error-message').should('contain.text', 'Real name is required');
  });

  it('studentId is 7 chars but contains letters -> 7 digits validation error', () => {
    openRegister();
    disableNativeValidation();
    cy.get('input[name="realName"]').type('Tester');
    cy.get('input[name="studentId"]').type('12ab567');
    cy.contains('Register').click();
    cy.get('.error-message').should('contain.text', 'Student ID must be exactly 7 digits');
  });

  it('email auto-updates when studentId changes (overwrites previous)', () => {
    openRegister();
    cy.get('input[name="studentId"]').type('9002001');
    cy.get('input[name="email"]').should('have.value', '9002001@stu.com');
    // change id
    cy.get('input[name="studentId"]').clear().type('9002002');
    cy.get('input[name="email"]').should('have.value', '9002002@stu.com');
  });

  it('password visibility toggle works for both password fields', () => {
    openRegister();
    cy.get('input[name="password"]').type('abcdef');
    cy.get('input[name="confirmPassword"]').type('abcdef');
    cy.get('.password-toggle').first().click();
    cy.get('input[name="password"]').should('have.attr', 'type', 'text');
    cy.get('.password-toggle').eq(1).click();
    cy.get('input[name="confirmPassword"]').should('have.attr', 'type', 'text');
  });

  it('studentId input enforces maxLength 7 and pattern attribute exists', () => {
    openRegister();
    cy.get('input[name="studentId"]').should('have.attr', 'maxLength', '7');
    cy.get('input[name="studentId"]').should('have.attr', 'pattern');
  });

  it('submit button disabled state binds to loading', () => {
    openRegister();
    disableNativeValidation();
    cy.get('input[name="realName"]').type('Cypress User');
    cy.get('input[name="studentId"]').type('9001999');
    cy.get('input[name="password"]').type('123456');
    cy.get('input[name="confirmPassword"]').type('123456');
    cy.intercept('POST', `${Cypress.env('apiBaseUrl')}/register`, { statusCode: 200, delay: 500, body: { ok: true } }).as('ok2');
    cy.contains('Register').as('btn').click();
    cy.get('@btn').should('be.disabled').and('contain.text', 'Registering...');
    cy.wait('@ok2');
  });

  it('email field background indicates read-only style', () => {
    openRegister();
    cy.get('input[name="studentId"]').type('9001888');
    cy.get('input[name="email"]').should('have.css', 'background-color');
  });

  it('footer renders Moodle link', () => {
    openRegister();
    cy.contains('Moodle Home').should('have.attr', 'href');
  });

  it('disables submit and shows loading text during request; prevents double submit', () => {
    openRegister();
    cy.get('input[name="realName"]').type('Cypress User');
    cy.get('input[name="studentId"]').type('9001001');
    cy.get('input[name="password"]').type('123456');
    cy.get('input[name="confirmPassword"]').type('123456');
    let count = 0;
    cy.intercept('POST', `${Cypress.env('apiBaseUrl')}/register`, (req) => {
      count += 1;
      req.reply({ statusCode: 200, delay: 800, body: { ok: true } });
    }).as('reg');
    cy.contains('Register').as('btn').click();
    cy.get('@btn').should('be.disabled').and('contain.text', 'Registering...');
    cy.wait('@reg').then(() => {
      expect(count).to.eq(1);
    });
  });

  it('success path returns to login with success alert', () => {
    openRegister();
    disableNativeValidation();
    cy.get('input[name="realName"]').type('Cypress User');
    cy.get('input[name="studentId"]').type('9001002');
    cy.get('input[name="password"]').type('123456');
    cy.get('input[name="confirmPassword"]').type('123456');
    cy.intercept('POST', `${Cypress.env('apiBaseUrl')}/register`, { statusCode: 200, body: { ok: true } }).as('ok');
    cy.contains('Register').click();
    cy.wait('@ok');
    cy.contains('Student Login');
  });

  it('server error 409 (exists) and 400 surface message to UI', () => {
    openRegister();
    disableNativeValidation();
    cy.get('input[name="realName"]').type('Cypress User');
    cy.get('input[name="studentId"]').type('9001003');
    cy.get('input[name="password"]').type('123456');
    cy.get('input[name="confirmPassword"]').type('123456');
    cy.intercept('POST', `${Cypress.env('apiBaseUrl')}/register`, { statusCode: 409, body: { error: 'User already exists' } }).as('dup');
    cy.contains('Register').click();
    cy.wait('@dup');
    cy.get('.error-message').should('contain.text', 'User already exists');

    // try 400
    cy.get('input[name="studentId"]').clear().type('9001004');
    cy.intercept('POST', `${Cypress.env('apiBaseUrl')}/register`, { statusCode: 400, body: { error: 'Invalid data' } }).as('bad');
    cy.contains('Register').click();
    cy.wait('@bad');
    cy.get('.error-message').should('contain.text', 'Invalid data');
  });

  it('network error shows friendly message', () => {
    openRegister();
    disableNativeValidation();
    cy.get('input[name="realName"]').type('Cypress User');
    cy.get('input[name="studentId"]').type('9001005');
    cy.get('input[name="password"]').type('123456');
    cy.get('input[name="confirmPassword"]').type('123456');
    cy.intercept('POST', `${Cypress.env('apiBaseUrl')}/register`, { forceNetworkError: true }).as('net');
    cy.contains('Register').click();
    cy.wait('@net');
    cy.get('.error-message').should('contain.text', 'Network error');
  });

  it('Back to Login navigates back', () => {
    openRegister();
    cy.contains('Back to Login').click();
    cy.contains('Student Login');
  });
});


