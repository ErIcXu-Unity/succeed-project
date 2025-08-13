/// <reference types="cypress" />

import React from 'react';
import Login from '../../../src/components/Login.jsx';
import { AlertProvider } from '../../../src/components/CustomAlert.jsx';

const stubFetch = (handler) => {
  cy.window().then((win) => {
    cy.stub(win, 'fetch').callsFake((url, options = {}) => handler(url, options));
  });
};

describe('Login (Component)', () => {
  const mountWithProvider = (onSuccess) => {
    cy.mount(
      <AlertProvider>
        <Login onLoginSuccess={onSuccess} />
      </AlertProvider>
    );
  };
  it('opens Student Login modal and validates empty fields', () => {
    const onSuccess = cy.stub().as('onSuccess');
    mountWithProvider(onSuccess);

    cy.contains('Student Login').click();
    cy.get('.modal-content h2').should('contain.text', 'Student Login');

    cy.get('[data-cy="login-submit"]').click();
    cy.get('[data-cy="login-error"]').should('contain.text', 'Please enter username and password');
  });

  it('successful login stores user_data and calls onLoginSuccess', () => {
    const onSuccess = cy.stub().as('onSuccess');
    stubFetch((url, options = {}) => {
      if (/\/login$/.test(url) && options.method === 'POST') {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ role: 'stu', user_id: 100, real_name: 'Alice' }) });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });

    mountWithProvider(onSuccess);
    cy.contains('Student Login').click();
    cy.get('[data-cy="login-username"]').type('9000001@stu.com');
    cy.get('[data-cy="login-password"]').type('123456');
    cy.get('[data-cy="login-submit"]').click();

    cy.window().then((win) => {
      const stored = JSON.parse(win.localStorage.getItem('user_data'));
      expect(stored).to.include({ role: 'stu', user_id: 100, username: '9000001@stu.com', real_name: 'Alice' });
    });
    cy.get('@onSuccess').should('have.been.called');
  });

  it('shows server error on non-ok response', () => {
    const onSuccess = cy.stub();
    stubFetch((url, options = {}) => {
      if (/\/login$/.test(url) && options.method === 'POST') {
        return Promise.resolve({ ok: false, json: () => Promise.resolve({ error: 'Invalid credentials' }) });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });

    mountWithProvider(onSuccess);
    cy.contains('Student Login').click();
    cy.get('[data-cy="login-username"]').type('x@stu.com');
    cy.get('[data-cy="login-password"]').type('bad');
    cy.get('[data-cy="login-submit"]').click();
    cy.get('[data-cy="login-error"]').should('contain.text', 'Invalid credentials');
  });

  it('shows network error on fetch reject', () => {
    const onSuccess = cy.stub();
    stubFetch((url, options = {}) => {
      if (/\/login$/.test(url) && options.method === 'POST') {
        return Promise.reject(new Error('down'));
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });

    cy.mount(<Login onLoginSuccess={onSuccess} />);
    cy.contains('Student Login').click();
    cy.get('[data-cy="login-username"]').type('x@stu.com');
    cy.get('[data-cy="login-password"]').type('123456');
    cy.get('[data-cy="login-submit"]').click();
    cy.get('[data-cy="login-error"]').should('contain.text', 'Network error');
  });

  it('close modal via X and overlay clears fields and error', () => {
    const onSuccess = cy.stub();
    mountWithProvider(onSuccess);
    cy.contains('Teacher Login').click();
    cy.get('[data-cy="login-username"]').type('t');
    cy.get('[data-cy="login-password"]').type('p');
    cy.get('[data-cy="login-submit"]').click();
    cy.get('[data-cy="login-error"]').should('exist');
    cy.get('.close-btn').click();
    cy.contains('Teacher Login').click();
    cy.get('[data-cy="login-username"]').should('have.value', '');
    cy.get('[data-cy="login-password"]').should('have.value', '');

    // overlay close
    cy.get('.close-btn').click();
    cy.contains('Teacher Login').click();
    cy.get('.modal').click('topLeft');
    cy.get('.modal-content').should('not.exist');
  });

  it('Student Register card replaces view with Register component', () => {
    const onSuccess = cy.stub();
    mountWithProvider(onSuccess);
    cy.contains('Student Register').click();
    cy.contains('Student Registration').should('exist');
  });
});
